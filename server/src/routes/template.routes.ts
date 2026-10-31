import { Router } from 'express';
import { prisma } from '../config/prisma';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTemplateSchema, updateTemplateSchema } from '../validators/template.validator';
import { ApiError, asyncHandler } from '../utils/http';
import { clientIp, recordAudit } from '../services/audit.service';
import { DEFAULT_TEMPLATES, TEMPLATE_KEYS } from '../services/message.service';

export const templateRouter = Router();

templateRouter.use(requireAuth);

templateRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.messageTemplate.findMany({ orderBy: { key: 'asc' } });
    const map = new Map(items.map((t) => [t.key, t]));
    const merged = TEMPLATE_KEYS.map((key) => {
      const found = map.get(key);
      const fallback = DEFAULT_TEMPLATES[key];
      return (
        found ?? {
          id: 'default-' + key,
          key,
          title: fallback.title,
          body: fallback.body,
          platform: null,
          isActive: true,
          createdAt: new Date(0),
          updatedAt: new Date(0),
        }
      );
    });
    res.json({ success: true, data: merged });
  }),
);

templateRouter.post(
  '/',
  requireAdmin,
  validate(createTemplateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      key: string;
      title: string;
      body: string;
      platform?: string;
      isActive: boolean;
    };
    const template = await prisma.messageTemplate.upsert({
      where: { key: body.key },
      update: {
        title: body.title,
        body: body.body,
        platform: body.platform ?? null,
        isActive: body.isActive,
      },
      create: {
        key: body.key,
        title: body.title,
        body: body.body,
        platform: body.platform ?? null,
        isActive: body.isActive,
      },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: 'TEMPLATE_SAVED',
      entity: 'MessageTemplate',
      entityId: template.id,
      details: { key: template.key },
      ip: clientIp(req),
    });
    res.status(201).json({ success: true, data: template });
  }),
);

templateRouter.patch(
  '/:id',
  requireAdmin,
  validate(updateTemplateSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const existing = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('قالب یافت نشد.');
    const body = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of ['title', 'body', 'platform', 'isActive']) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const template = await prisma.messageTemplate.update({ where: { id }, data });
    await recordAudit({
      userId: req.user!.sub,
      action: 'TEMPLATE_UPDATED',
      entity: 'MessageTemplate',
      entityId: id,
      details: data,
      ip: clientIp(req),
    });
    res.json({ success: true, data: template });
  }),
);
