import { Router } from 'express';
import { prisma } from '../config/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createFollowUpSchema,
  updateFollowUpSchema,
  updateVisitSchema,
} from '../validators/visitor.validator';
import { ApiError, asyncHandler, paginate } from '../utils/http';
import { clientIp, recordAudit } from '../services/audit.service';
import { normalizeText } from '../utils/persian';
import { parseDateBoundary } from '../utils/dates';

export const visitDetailRouter = Router();

visitDetailRouter.use(requireAuth);

async function loadVisitForUser(visitId: string, userId: string, role: string) {
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    select: { id: true, employeeId: true, visitorId: true, deletedAt: true },
  });
  if (!visit || visit.deletedAt) throw ApiError.notFound('مراجعه یافت نشد.');
  if (role !== 'ADMIN' && visit.employeeId !== userId) {
    throw ApiError.forbidden('دسترسی به این مراجعه مجاز نیست.');
  }
  return visit;
}

visitDetailRouter.patch(
  '/visits/:visitId',
  validate(updateVisitSchema),
  asyncHandler(async (req, res) => {
    const visitId = req.params.visitId as string;
    await loadVisitForUser(visitId, req.user!.sub, req.user!.role);
    const body = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of [
      'followUpStatus',
      'priority',
      'requestType',
      'notes',
      'assignedEmployeeId',
      'exhibitionId',
    ]) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (data.assignedEmployeeId) {
      const employee = await prisma.user.findUnique({
        where: { id: data.assignedEmployeeId as string },
      });
      if (!employee || employee.deletedAt) throw ApiError.badRequest('کارمند انتخاب‌شده معتبر نیست.');
    }
    const visit = await prisma.visit.update({
      where: { id: visitId },
      data,
      include: {
        visitor: { select: { id: true, fullName: true, mobile: true, company: true, gender: true } },
        exhibition: { select: { id: true, name: true } },
        employee: { select: { id: true, fullName: true } },
        assignedEmployee: { select: { id: true, fullName: true } },
      },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: 'VISIT_UPDATED',
      entity: 'Visit',
      entityId: visitId,
      details: data,
      ip: clientIp(req),
    });
    res.json({ success: true, data: visit });
  }),
);

visitDetailRouter.post(
  '/visits/:visitId/followups',
  validate(createFollowUpSchema),
  asyncHandler(async (req, res) => {
    const visitId = req.params.visitId as string;
    await loadVisitForUser(visitId, req.user!.sub, req.user!.role);
    const body = req.body as {
      status: string;
      note?: string;
      lastContactAt?: Date;
      nextFollowUpAt?: Date;
      assignedEmployeeId?: string;
    };

    const followUp = await prisma.$transaction(async (tx) => {
      const created = await tx.followUp.create({
        data: {
          visitId,
          status: body.status,
          note: body.note ?? null,
          lastContactAt: body.lastContactAt ?? null,
          nextFollowUpAt: body.nextFollowUpAt ?? null,
          assignedEmployeeId: body.assignedEmployeeId ?? null,
          createdById: req.user!.sub,
        },
        include: { assignedEmployee: { select: { id: true, fullName: true } } },
      });
      await tx.visit.update({
        where: { id: visitId },
        data: {
          followUpStatus: body.status,
          ...(body.assignedEmployeeId ? { assignedEmployeeId: body.assignedEmployeeId } : {}),
        },
      });
      return created;
    });

    await recordAudit({
      userId: req.user!.sub,
      action: 'FOLLOWUP_CREATED',
      entity: 'FollowUp',
      entityId: followUp.id,
      details: { visitId, status: body.status },
      ip: clientIp(req),
    });

    res.status(201).json({ success: true, data: followUp });
  }),
);

visitDetailRouter.patch(
  '/followups/:id',
  validate(updateFollowUpSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const existing = await prisma.followUp.findUnique({
      where: { id },
      include: { visit: { select: { id: true, employeeId: true } } },
    });
    if (!existing) throw ApiError.notFound('پیگیری یافت نشد.');
    if (req.user!.role !== 'ADMIN' && existing.visit.employeeId !== req.user!.sub) {
      throw ApiError.forbidden('دسترسی به این پیگیری مجاز نیست.');
    }
    const body = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of ['status', 'note', 'lastContactAt', 'nextFollowUpAt', 'assignedEmployeeId']) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const followUp = await prisma.followUp.update({ where: { id }, data });
    if (data.status) {
      await prisma.visit.update({
        where: { id: existing.visit.id },
        data: { followUpStatus: data.status },
      });
    }
    res.json({ success: true, data: followUp });
  }),
);

visitDetailRouter.delete(
  '/followups/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const existing = await prisma.followUp.findUnique({
      where: { id },
      include: { visit: { select: { id: true, employeeId: true } } },
    });
    if (!existing) throw ApiError.notFound('پیگیری یافت نشد.');
    if (req.user!.role !== 'ADMIN' && existing.visit.employeeId !== req.user!.sub) {
      throw ApiError.forbidden('دسترسی به این پیگیری مجاز نیست.');
    }
    await prisma.followUp.delete({ where: { id } });
    res.json({ success: true, data: { message: 'پیگیری حذف شد.' } });
  }),
);

visitDetailRouter.get(
  '/followups',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, string | undefined>;
    const { page, pageSize, skip, take } = paginate(query.page, query.pageSize);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.employeeId) where.assignedEmployeeId = query.employeeId;
    if (query.search) {
      const search = normalizeText(query.search);
      where.visit = {
        OR: [
          { visitor: { fullName: { contains: search } } },
          { visitor: { mobile: { contains: search } } },
          { visitor: { company: { contains: search } } },
        ],
      };
    }
    const nextFollowUp = parseDateBoundary(query.nextFollowUpBefore, true);
    if (nextFollowUp) where.nextFollowUpAt = { lte: nextFollowUp };

    const [items, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        skip,
        take,
        orderBy: [{ nextFollowUpAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          assignedEmployee: { select: { id: true, fullName: true } },
          createdBy: { select: { id: true, fullName: true } },
          visit: {
            select: {
              id: true,
              followUpStatus: true,
              priority: true,
              visitor: { select: { id: true, fullName: true, mobile: true, company: true } },
              exhibition: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.followUp.count({ where }),
    ]);

    res.json({
      success: true,
      data: items,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  }),
);

visitDetailRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: {
        visits: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            exhibition: { select: { id: true, name: true } },
            employee: { select: { id: true, fullName: true } },
            assignedEmployee: { select: { id: true, fullName: true } },
            followUps: { orderBy: { createdAt: 'desc' } },
            messageLogs: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });
    if (!visitor || visitor.deletedAt) throw ApiError.notFound('بازدیدکننده یافت نشد.');

    if (req.user!.role !== 'ADMIN') {
      const owns = visitor.visits.some((v) => v.employeeId === req.user!.sub);
      if (!owns) throw ApiError.forbidden('دسترسی به اطلاعات این بازدیدکننده مجاز نیست.');
    }

    res.json({ success: true, data: visitor });
  }),
);
