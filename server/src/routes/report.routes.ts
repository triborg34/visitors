import { Router } from 'express';
import { prisma } from '../config/prisma';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/http';
import { getDailyTrend, getStats } from '../services/stats.service';
import { parseDateBoundary } from '../utils/dates';

export const reportRouter = Router();

reportRouter.use(requireAuth);

reportRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, string | undefined>;
    const isAdmin = req.user!.role === 'ADMIN';
    const stats = await getStats({
      exhibitionId: query.exhibitionId,
      employeeId: query.employeeId,
      employeeScope: isAdmin ? undefined : req.user!.sub,
      from: parseDateBoundary(query.from),
      to: parseDateBoundary(query.to, true),
    });
    res.json({ success: true, data: stats });
  }),
);

reportRouter.get(
  '/trend',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, string | undefined>;
    const days = Math.min(365, Math.max(7, Number(query.days) || 30));
    const isAdmin = req.user!.role === 'ADMIN';
    const trend = await getDailyTrend(
      {
        exhibitionId: query.exhibitionId,
        employeeScope: isAdmin ? undefined : req.user!.sub,
        from: parseDateBoundary(query.from),
        to: parseDateBoundary(query.to, true),
      },
      days,
    );
    res.json({ success: true, data: trend });
  }),
);

reportRouter.get(
  '/employees',
  asyncHandler(async (_req, res) => {
    const employees = await prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, fullName: true, role: true },
      orderBy: { fullName: 'asc' },
    });
    res.json({ success: true, data: employees });
  }),
);

reportRouter.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'این بخش تنها برای مدیر سیستم است.' },
      });
      return;
    }
    const query = req.query as Record<string, string | undefined>;
    const logs = await prisma.auditLog.findMany({
      where: query.action ? { action: query.action } : {},
      orderBy: { createdAt: 'desc' },
      take: Math.min(500, Number(query.limit) || 200),
      include: { user: { select: { id: true, fullName: true, username: true } } },
    });
    res.json({ success: true, data: logs });
  }),
);
