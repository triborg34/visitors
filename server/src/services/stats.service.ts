import { prisma } from '../config/prisma';
import { startOfDay, endOfDay } from '../utils/dates';

export interface StatsFilters {
  exhibitionId?: string;
  employeeId?: string;
  from?: Date;
  to?: Date;
  employeeScope?: string;
}

function visitWhere(filters: StatsFilters) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (filters.exhibitionId) where.exhibitionId = filters.exhibitionId;
  if (filters.employeeScope) where.employeeId = filters.employeeScope;
  else if (filters.employeeId) where.employeeId = filters.employeeId;
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }
  return where;
}

export async function getStats(filters: StatsFilters) {
  const where = visitWhere(filters);

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    totalVisits,
    uniqueVisitors,
    todayCount,
    hotLeads,
    awaitingFollowUp,
    consentGranted,
    byExhibition,
    byEmployee,
    byRequestType,
    byPriority,
    byFollowUpStatus,
    byPlatform,
    messageLogs,
  ] = await Promise.all([
    prisma.visit.count({ where }),
    prisma.visit.findMany({ where, select: { visitorId: true } }),
    prisma.visit.count({
      where: { ...where, createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.visit.count({ where: { ...where, priority: 'HOT' } }),
    prisma.visit.count({ where: { ...where, followUpStatus: 'NEW' } }),
    prisma.visit.count({ where: { ...where, marketingConsent: true } }),
    prisma.visit.groupBy({
      by: ['exhibitionId'],
      where,
      _count: { _all: true },
    }),
    prisma.visit.groupBy({
      by: ['employeeId'],
      where,
      _count: { _all: true },
    }),
    prisma.visit.groupBy({
      by: ['requestType'],
      where,
      _count: { _all: true },
    }),
    prisma.visit.groupBy({
      by: ['priority'],
      where,
      _count: { _all: true },
    }),
    prisma.visit.groupBy({
      by: ['followUpStatus'],
      where,
      _count: { _all: true },
    }),
    prisma.visit.groupBy({
      by: ['preferredPlatform'],
      where,
      _count: { _all: true },
    }),
    prisma.messageLog.groupBy({
      by: ['status'],
      where: filters.exhibitionId ? { visit: { exhibitionId: filters.exhibitionId } } : {},
      _count: { _all: true },
    }),
  ]);

  const exhibitions = await prisma.exhibition.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });
  const exhibitionMap = new Map(exhibitions.map((e) => [e.id, e.name]));

  const employees = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, fullName: true },
  });
  const employeeMap = new Map(employees.map((e) => [e.id, e.fullName]));

  const mapCount = (
    rows: Array<Record<string, unknown> & { _count: { _all: number } }>,
    key: string,
    labels: Map<string, string>,
  ) =>
    rows.map((row) => ({
      id: String(row[key] ?? ''),
      name: labels.get(String(row[key] ?? '')) ?? String(row[key] ?? 'نامشخص'),
      count: row._count._all,
    }));

  const platformLabels = new Map<string, string>([
    ['BALE', 'بل'],
    ['EITAA', 'ایتا'],
    ['WHATSAPP', 'واتساپ'],
    ['TELEGRAM', 'تلگرام'],
    ['NONE', 'بدون پیام'],
  ]);

  return {
    totalVisits,
    uniqueVisitors: new Set(uniqueVisitors.map((v) => v.visitorId)).size,
    todayCount,
    hotLeads,
    awaitingFollowUp,
    consentGranted,
    consentRate: totalVisits > 0 ? Math.round((consentGranted / totalVisits) * 100) : 0,
    byExhibition: mapCount(byExhibition as never, 'exhibitionId', exhibitionMap),
    byEmployee: mapCount(byEmployee as never, 'employeeId', employeeMap),
    byRequestType: (byRequestType as never as Array<{ requestType: string; _count: { _all: number } }>).map((r) => ({
      key: r.requestType,
      count: r._count._all,
    })),
    byPriority: (byPriority as never as Array<{ priority: string; _count: { _all: number } }>).map((r) => ({
      key: r.priority,
      count: r._count._all,
    })),
    byFollowUpStatus: (byFollowUpStatus as never as Array<{ followUpStatus: string; _count: { _all: number } }>).map((r) => ({
      key: r.followUpStatus,
      count: r._count._all,
    })),
    byPlatform: (byPlatform as never as Array<{ preferredPlatform: string | null; _count: { _all: number } }>).map((r) => ({
      key: r.preferredPlatform ?? 'NONE',
      name: platformLabels.get(r.preferredPlatform ?? 'NONE') ?? 'نامشخص',
      count: r._count._all,
    })),
    messageStatus: messageLogs.map((r) => ({ key: r.status, count: r._count._all })),
  };
}

export async function getDailyTrend(filters: StatsFilters, days = 30) {
  const where = visitWhere(filters);
  const since = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
  const visits = await prisma.visit.findMany({
    where: { ...where, createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const visit of visits) {
    const key = visit.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}
