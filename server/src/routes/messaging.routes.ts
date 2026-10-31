import { Router } from 'express';
import { prisma } from '../config/prisma';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateConnectionSchema, testConnectionSchema, MESSAGING_PLATFORMS } from '../validators/messaging.validator';
import { ApiError, asyncHandler } from '../utils/http';
import { clientIp, recordAudit } from '../services/audit.service';

export const messagingRouter = Router();

messagingRouter.use(requireAuth);

// ── Platform metadata for the UI ──────────────────────────────────────────────
const PLATFORM_INFO: Record<string, { name: string; docsUrl: string; guideUrl: string }> = {
  WHATSAPP: {
    name: 'واتساپ بیزینس',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloudapi',
    guideUrl: 'https://developers.facebook.com/docs/whatsapp/cloudapi/get-started',
  },
  TELEGRAM: {
    name: 'تلگرام',
    docsUrl: 'https://core.telegram.org/bots/api',
    guideUrl: 'https://core.telegram.org/bots/features',
  },
  BALE: {
    name: 'بله (سفیر)',
    docsUrl: 'https://docs.bale.ai/safir',
    guideUrl: 'https://docs.bale.ai/safir',
  },
  EITAA: {
    name: 'ایتا (ایتایار)',
    docsUrl: 'https://developer.eitaa.com/docs/Develop/SendMassage',
    guideUrl: 'https://eitaayar.ir',
  },
};

// ── GET /api/messaging — list all connections ─────────────────────────────────
messagingRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.messagingConnection.findMany({ orderBy: { platform: 'asc' } });
    const map = new Map(items.map((c) => [c.platform, c]));
    const merged = MESSAGING_PLATFORMS.map((platform) => {
      const found = map.get(platform);
      return {
        platform,
        info: PLATFORM_INFO[platform],
        id: found?.id ?? null,
        status: found?.status ?? 'UNTESTED',
        apiToken: found?.apiToken ? '••••••••' : null,
        botId: found?.botId ?? null,
        note: found?.note ?? null,
        linkTemplate: found?.linkTemplate ?? null,
        testedAt: found?.testedAt ?? null,
        testedBy: null,
      };
    });
    res.json({ success: true, data: merged });
  }),
);

// ── PUT /api/messaging/:platform — create or update a connection ─────────────
messagingRouter.put(
  '/:platform',
  requireAdmin,
  validate(updateConnectionSchema),
  asyncHandler(async (req, res) => {
    const platform = req.params.platform as string;
    if (!MESSAGING_PLATFORMS.includes(platform as (typeof MESSAGING_PLATFORMS)[number])) {
      throw ApiError.badRequest('پلتفرم نامعتبر است.');
    }
    const body = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.apiToken !== undefined) data.apiToken = body.apiToken;
    if (body.botId !== undefined) data.botId = body.botId;
    if (body.note !== undefined) data.note = body.note;

    const connection = await prisma.messagingConnection.upsert({
      where: { platform },
      update: data,
      create: { platform, ...data },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: 'MESSAGING_CONNECTION_UPDATED',
      entity: 'MessagingConnection',
      entityId: connection.id,
      details: { platform, fields: Object.keys(data) },
      ip: clientIp(req),
    });
    res.json({ success: true, data: connection });
  }),
);

// ── POST /api/messaging/test — test a connection ─────────────────────────────
messagingRouter.post(
  '/test',
  requireAdmin,
  validate(testConnectionSchema),
  asyncHandler(async (req, res) => {
    const { platform, testPhone } = req.body as { platform: string; testPhone?: string };
    const connection = await prisma.messagingConnection.findUnique({ where: { platform } });
    if (!connection?.apiToken) {
      throw ApiError.badRequest('ابتدا توکن API را برای این پلتفرم ذخیره کنید.');
    }

    let success = false;
    let error: string | null = null;

    try {
      switch (platform) {
        case 'TELEGRAM': {
          const r = await fetch(
            `https://api.telegram.org/bot${connection.apiToken}/getMe`,
            { signal: AbortSignal.timeout(10000) },
          );
          const j = (await r.json()) as { ok: boolean; result?: { username?: string }; description?: string };
          success = j.ok === true;
          if (!success) error = j.description ?? 'ناموفق';
          break;
        }
        case 'BALE': {
          const r = await fetch(
            `https://tapi.bale.ai/bot${connection.apiToken}/getMe`,
            { signal: AbortSignal.timeout(10000) },
          );
          const j = (await r.json()) as { ok: boolean; result?: { username?: string }; description?: string };
          success = j.ok === true;
          if (!success) error = j.description ?? 'ناموفق';
          break;
        }
        case 'EITAA': {
          const r = await fetch('https://eitaayar.ir/api/app/getMe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: connection.apiToken }),
            signal: AbortSignal.timeout(10000),
          });
          const j = (await r.json()) as { ok: boolean; result?: unknown; description?: string };
          success = j.ok === true;
          if (!success) error = j.description ?? 'ناموفق';
          break;
        }
        case 'WHATSAPP': {
          const phoneId = connection.botId;
          if (!phoneId) {
            error = 'شناسه شماره تلفن (Phone Number ID) وارد نشده است.';
            break;
          }
          const r = await fetch(
            `https://graph.facebook.com/v21.0/${phoneId}`,
            { headers: { Authorization: `Bearer ${connection.apiToken}` }, signal: AbortSignal.timeout(10000) },
          );
          const j = (await r.json()) as { verified_name?: string; error?: { message?: string } };
          success = !j.error && !!j.verified_name;
          if (!success) error = j.error?.message ?? 'ناموفق';
          break;
        }
        default:
          error = 'پلتفرم پشتیبانی نمی‌شود.';
      }
    } catch (e) {
      error = (e as Error).message || 'خطای شبکه';
    }

    const updated = await prisma.messagingConnection.update({
      where: { platform },
      data: {
        status: success ? 'CONNECTED' : 'FAILED',
        testedAt: new Date(),
        testedById: req.user!.sub,
      },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: 'MESSAGING_CONNECTION_TESTED',
      entity: 'MessagingConnection',
      entityId: updated.id,
      details: { platform, success, error },
      ip: clientIp(req),
    });

    if (!success) {
      return res.json({ success: true, data: { status: 'FAILED', error } });
    }
    res.json({ success: true, data: { status: 'CONNECTED', error: null } });
  }),
);

// ── DELETE /api/messaging/:platform — remove a connection ────────────────────
messagingRouter.delete(
  '/:platform',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const platform = req.params.platform as string;
    const existing = await prisma.messagingConnection.findUnique({ where: { platform } });
    if (!existing) throw ApiError.notFound('اتصال یافت نشد.');
    await prisma.messagingConnection.delete({ where: { platform } });
    await recordAudit({
      userId: req.user!.sub,
      action: 'MESSAGING_CONNECTION_DELETED',
      entity: 'MessagingConnection',
      entityId: existing.id,
      details: { platform },
      ip: clientIp(req),
    });
    res.json({ success: true, data: { deleted: true } });
  }),
);
