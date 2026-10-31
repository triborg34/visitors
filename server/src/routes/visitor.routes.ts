import { Router } from 'express';
import { prisma } from '../config/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createFollowUpSchema,
  createVisitSchema,
  duplicateCheckSchema,
  messagePrepareSchema,
  updateFollowUpSchema,
  updateVisitSchema,
} from '../validators/visitor.validator';
import { ApiError, asyncHandler, paginate } from '../utils/http';
import { normalizeMobile, normalizeText } from '../utils/persian';
import { findDuplicateByMobile } from '../services/duplicate.service';
import {
  buildDeepLink,
  getCompanySettings,
  getTemplateBody,
  renderTemplate,
} from '../services/message.service';
import { clientIp, recordAudit } from '../services/audit.service';
import { parseDateBoundary } from '../utils/dates';
import { SORTABLE_FIELDS, buildVisitWhere } from '../services/visit-query.service';

export const visitorRouter = Router();

visitorRouter.use(requireAuth);

visitorRouter.get(
  '/check-duplicate',
  validate(duplicateCheckSchema, 'query'),
  asyncHandler(async (req, res) => {
    const query = req.query as { mobile?: string };
    const info = await findDuplicateByMobile(query.mobile ?? '');
    res.json({ success: true, data: info });
  }),
);

visitorRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, string | undefined>;
    const { page, pageSize, skip, take } = paginate(query.page, query.pageSize);
    const isAdmin = req.user!.role === 'ADMIN';
    const where = buildVisitWhere(query, isAdmin ? undefined : req.user!.sub);

    const sortKey = SORTABLE_FIELDS[query.sortBy ?? ''] ?? 'createdAt';
    const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortKey]: sortDir } as Record<string, 'asc' | 'desc'>;

    const [items, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          visitor: {
            select: { id: true, fullName: true, gender: true, company: true, mobile: true },
          },
          exhibition: { select: { id: true, name: true } },
          employee: { select: { id: true, fullName: true } },
          assignedEmployee: { select: { id: true, fullName: true } },
          _count: { select: { followUps: true, messageLogs: true } },
        },
      }),
      prisma.visit.count({ where }),
    ]);

    res.json({
      success: true,
      data: items.map((v) => ({
        id: v.id,
        visitorId: v.visitorId,
        fullName: v.visitor.fullName,
        gender: v.visitor.gender,
        company: v.visitor.company,
        mobile: v.visitor.mobile,
        exhibition: v.exhibition,
        employee: v.employee,
        assignedEmployee: v.assignedEmployee,
        requestType: v.requestType,
        priority: v.priority,
        followUpStatus: v.followUpStatus,
        sendThankYou: v.sendThankYou,
        preferredPlatform: v.preferredPlatform,
        marketingConsent: v.marketingConsent,
        notes: v.notes,
        createdAt: v.createdAt,
        followUpCount: v._count.followUps,
        messageCount: v._count.messageLogs,
      })),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  }),
);

visitorRouter.post(
  '/',
  validate(createVisitSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      fullName: string;
      gender: string;
      company?: string;
      mobile: string;
      requestType: string;
      priority: string;
      notes?: string;
      sendThankYou: boolean;
      preferredPlatform?: string | null;
      marketingConsent: boolean;
      exhibitionId: string;
      assignedEmployeeId?: string;
    };

    const mobile = normalizeMobile(body.mobile);
    const exhibition = await prisma.exhibition.findUnique({ where: { id: body.exhibitionId } });
    if (!exhibition || exhibition.deletedAt) {
      throw ApiError.badRequest('نمایشگاه انتخاب‌شده معتبر نیست.');
    }

    const duplicate = await findDuplicateByMobile(mobile);
    const employeeId = req.user!.sub;
    const consent = body.marketingConsent;

    const visit = await prisma.$transaction(async (tx) => {
      let visitorId = duplicate.visitorId;
      if (!visitorId) {
        const created = await tx.visitor.create({
          data: {
            fullName: body.fullName,
            gender: body.gender,
            company: body.company ?? null,
            mobile,
          },
        });
        visitorId = created.id;
      } else {
        const existing = await tx.visitor.findUnique({ where: { id: visitorId } });
        if (existing && !existing.company && body.company) {
          await tx.visitor.update({ where: { id: visitorId }, data: { company: body.company } });
        }
      }

      return tx.visit.create({
        data: {
          visitorId,
          exhibitionId: body.exhibitionId,
          employeeId,
          assignedEmployeeId: body.assignedEmployeeId ?? null,
          requestType: body.requestType,
          priority: body.priority ?? 'NORMAL',
          notes: body.notes ?? null,
          sendThankYou: Boolean(body.sendThankYou),
          preferredPlatform: body.preferredPlatform ?? null,
          marketingConsent: consent,
          consentAt: consent ? new Date() : null,
          consentContext: consent ? 'ثبت در غرفه نمایشگاه ' + exhibition.name : null,
          followUpStatus: 'NEW',
        },
        include: {
          visitor: { select: { id: true, fullName: true, mobile: true, company: true } },
          exhibition: { select: { id: true, name: true } },
          employee: { select: { id: true, fullName: true } },
        },
      });
    });

    await recordAudit({
      userId: employeeId,
      action: 'VISIT_CREATED',
      entity: 'Visit',
      entityId: visit.id,
      details: { mobile, duplicate: duplicate.exists, consent },
      ip: clientIp(req),
    });

    res.status(201).json({
      success: true,
      data: { visit, duplicate },
      message: duplicate.exists
        ? 'بازدیدکننده قبلاً ثبت شده بود؛ مراجعه جدید به‌عنوان مراجعه مجدد ثبت شد.'
        : 'بازدیدکننده با موفقیت ثبت شد.',
    });
  }),
);

visitorRouter.get(
  '/visits/:visitId/messages',
  asyncHandler(async (req, res) => {
    const visitId = req.params.visitId as string;
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { id: true, employeeId: true, deletedAt: true },
    });
    if (!visit || visit.deletedAt) throw ApiError.notFound('مراجعه یافت نشد.');
    if (req.user!.role !== 'ADMIN' && visit.employeeId !== req.user!.sub) {
      throw ApiError.forbidden('دسترسی به این مراجعه مجاز نیست.');
    }
    const logs = await prisma.messageLog.findMany({
      where: { visitId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
    res.json({ success: true, data: logs });
  }),
);

visitorRouter.post(
  '/visits/:visitId/messages/prepare',
  validate(messagePrepareSchema),
  asyncHandler(async (req, res) => {
    const visitId = req.params.visitId as string;
    const body = req.body as { templateKey: string; platform: string; body?: string };
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        visitor: true,
        exhibition: true,
        employee: { select: { fullName: true } },
      },
    });
    if (!visit || visit.deletedAt) throw ApiError.notFound('مراجعه یافت نشد.');
    if (req.user!.role !== 'ADMIN' && visit.employeeId !== req.user!.sub) {
      throw ApiError.forbidden('دسترسی به این مراجعه مجاز نیست.');
    }
    if (body.platform !== 'NONE' && !visit.visitor.mobile) {
      throw ApiError.badRequest('برای این بازدیدکننده شماره موبایل ثبت نشده است.');
    }

    const settings = await getCompanySettings();
    const template = await getTemplateBody(body.templateKey);
    const ctx = {
      name: visit.visitor.fullName,
      company: visit.visitor.company ?? settings.companyName,
      mobile: visit.visitor.mobile,
      exhibition: visit.exhibition.name,
      employee: visit.employee.fullName,
      catalog_url: settings.catalogUrl ?? '',
    };
    const rendered = renderTemplate(body.body?.trim() || template.body, ctx);
    const deepLink = buildDeepLink(
      body.platform as 'BALE' | 'EITAA' | 'WHATSAPP' | 'TELEGRAM' | 'NONE',
      visit.visitor.mobile,
      rendered,
      settings.catalogUrl ?? undefined,
    );

    const log = await prisma.messageLog.create({
      data: {
        visitId,
        visitorId: visit.visitorId,
        platform: body.platform,
        templateKey: template.key,
        body: rendered,
        status: 'PREPARED',
        createdById: req.user!.sub,
      },
    });

    res.status(201).json({
      success: true,
      data: { log, deepLink, templateKey: template.key, title: template.title },
      message: 'پیام آماده شد. ارسال پیام بر عهده کارمند است.',
    });
  }),
);

visitorRouter.post(
  '/visits/:visitId/messages/:logId/opened',
  asyncHandler(async (req, res) => {
    const log = await getOwnedLog(req, req.params.visitId as string, req.params.logId as string);
    const updated = await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: 'OPENED' },
    });
    res.json({ success: true, data: updated });
  }),
);

visitorRouter.post(
  '/visits/:visitId/messages/:logId/confirm',
  asyncHandler(async (req, res) => {
    const log = await getOwnedLog(req, req.params.visitId as string, req.params.logId as string);
    const updated = await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: 'CONFIRMED_SENT' },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: 'MESSAGE_CONFIRMED_SENT',
      entity: 'MessageLog',
      entityId: log.id,
      ip: clientIp(req),
    });
    res.json({
      success: true,
      data: updated,
      message: 'ارسال پیام توسط کارمند تأیید شد.',
    });
  }),
);

async function getOwnedLog(req: import('express').Request, visitId: string, logId: string) {
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    select: { id: true, employeeId: true, deletedAt: true },
  });
  if (!visit || visit.deletedAt) throw ApiError.notFound('مراجعه یافت نشد.');
  if (req.user!.role !== 'ADMIN' && visit.employeeId !== req.user!.sub) {
    throw ApiError.forbidden('دسترسی به این مراجعه مجاز نیست.');
  }
  const log = await prisma.messageLog.findUnique({ where: { id: logId } });
  if (!log || log.visitId !== visitId) throw ApiError.notFound('پیام یافت نشد.');
  return log;
}
