import { Router } from 'express';
import { prisma } from '../config/prisma';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateSettingsSchema } from '../validators/settings.validator';
import { asyncHandler } from '../utils/http';
import { clientIp, recordAudit } from '../services/audit.service';
import { getCompanySettings } from '../services/message.service';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await getCompanySettings();
    res.json({ success: true, data: settings });
  }),
);

settingsRouter.put(
  '/',
  requireAdmin,
  validate(updateSettingsSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = { updatedById: req.user!.sub };
    for (const key of [
      'companyName',
      'description',
      'website',
      'phone',
      'email',
      'logoUrl',
      'catalogUrl',
      'defaultPlatform',
    ]) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const settings = await prisma.companySettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: 'SETTINGS_UPDATED',
      entity: 'CompanySettings',
      entityId: settings.id,
      details: Object.keys(data),
      ip: clientIp(req),
    });
    res.json({ success: true, data: settings });
  }),
);
