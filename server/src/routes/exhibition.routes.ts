import { Router } from 'express';
import { prisma } from '../config/prisma';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createExhibitionSchema, updateExhibitionSchema } from '../validators/exhibition.validator';
import { ApiError, asyncHandler } from '../utils/http';
import { clientIp, recordAudit } from '../services/audit.service';

export const exhibitionRouter = Router();

exhibitionRouter.use(requireAuth);

exhibitionRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, string | undefined>;
    const where = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
    };
    const items = await prisma.exhibition.findMany({
      where,
      orderBy: [{ startDate: 'desc' }],
      include: {
        _count: { select: { visits: { where: { deletedAt: null } } } },
      },
    });
    res.json({
      success: true,
      data: items.map((e) => ({ ...e, visitCount: e._count.visits })),
    });
  }),
);

exhibitionRouter.get(
  '/active',
  asyncHandler(async (_req, res) => {
    const items = await prisma.exhibition.findMany({
      where: { deletedAt: null, status: { in: ['ACTIVE', 'UPCOMING'] } },
      orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
      select: {
        id: true,
        name: true,
        location: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });
    res.json({ success: true, data: items });
  }),
);

exhibitionRouter.post(
  '/',
  requireAdmin,
  validate(createExhibitionSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      name: string;
      location?: string;
      startDate: Date;
      endDate: Date;
      description?: string;
      status: string;
    };
    const exhibition = await prisma.exhibition.create({
      data: {
        name: body.name,
        location: body.location ?? null,
        startDate: body.startDate,
        endDate: body.endDate,
        description: body.description ?? null,
        status: body.status,
      },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: 'EXHIBITION_CREATED',
      entity: 'Exhibition',
      entityId: exhibition.id,
      details: { name: exhibition.name },
      ip: clientIp(req),
    });
    res.status(201).json({ success: true, data: exhibition });
  }),
);

exhibitionRouter.patch(
  '/:id',
  requireAdmin,
  validate(updateExhibitionSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const existing = await prisma.exhibition.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('نمایشگاه یافت نشد.');
    const body = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of ['name', 'location', 'startDate', 'endDate', 'description', 'status']) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (data.startDate && data.endDate && (data.endDate as Date) < (data.startDate as Date)) {
      throw ApiError.badRequest('تاریخ پایان نباید قبل از تاریخ شروع باشد.');
    }
    const exhibition = await prisma.exhibition.update({ where: { id }, data });
    await recordAudit({
      userId: req.user!.sub,
      action: 'EXHIBITION_UPDATED',
      entity: 'Exhibition',
      entityId: id,
      details: data,
      ip: clientIp(req),
    });
    res.json({ success: true, data: exhibition });
  }),
);

exhibitionRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const existing = await prisma.exhibition.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('نمایشگاه یافت نشد.');
    const visitCount = await prisma.visit.count({ where: { exhibitionId: id, deletedAt: null } });
    if (visitCount > 0) {
      await prisma.exhibition.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'COMPLETED' },
      });
    } else {
      await prisma.exhibition.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    await recordAudit({
      userId: req.user!.sub,
      action: 'EXHIBITION_DELETED',
      entity: 'Exhibition',
      entityId: id,
      ip: clientIp(req),
    });
    res.json({ success: true, data: { message: 'نمایشگاه حذف شد.' } });
  }),
);
