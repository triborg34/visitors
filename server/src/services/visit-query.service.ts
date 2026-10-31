import { prisma } from '../config/prisma';
import { normalizeText } from '../utils/persian';
import { parseDateBoundary } from '../utils/dates';

export const SORTABLE_FIELDS: Record<string, string> = {
  createdAt: 'createdAt',
  fullName: 'visitor.fullName',
  company: 'visitor.company',
  priority: 'priority',
  followUpStatus: 'followUpStatus',
  requestType: 'requestType',
  exhibition: 'exhibition.name',
};

export interface VisitQueryFilters {
  search?: string;
  exhibitionId?: string;
  employeeId?: string;
  priority?: string;
  requestType?: string;
  followUpStatus?: string;
  platform?: string;
  marketingConsent?: string;
  sendThankYou?: string;
  from?: string;
  to?: string;
}

export function buildVisitWhere(
  query: VisitQueryFilters,
  employeeScope?: string,
): Record<string, unknown> {
  const where: Record<string, unknown> = { deletedAt: null };

  if (employeeScope) {
    where.employeeId = employeeScope;
  } else if (query.employeeId) {
    where.employeeId = query.employeeId;
  }
  if (query.exhibitionId) where.exhibitionId = query.exhibitionId;
  if (query.priority) where.priority = query.priority;
  if (query.requestType) where.requestType = query.requestType;
  if (query.followUpStatus) where.followUpStatus = query.followUpStatus;
  if (query.platform) where.preferredPlatform = query.platform;
  if (query.marketingConsent === 'true') where.marketingConsent = true;
  if (query.marketingConsent === 'false') where.marketingConsent = false;
  if (query.sendThankYou === 'true') where.sendThankYou = true;
  if (query.sendThankYou === 'false') where.sendThankYou = false;

  const search = normalizeText(query.search);
  if (search) {
    where.visitor = {
      OR: [
        { fullName: { contains: search } },
        { mobile: { contains: search } },
        { company: { contains: search } },
      ],
    };
  }

  const from = parseDateBoundary(query.from);
  const to = parseDateBoundary(query.to, true);
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }
  return where;
}

export async function fetchVisitRows(where: Record<string, unknown>) {
  return prisma.visit.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      visitor: { select: { fullName: true, mobile: true, company: true, gender: true } },
      exhibition: { select: { name: true } },
      employee: { select: { fullName: true } },
      followUps: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
}
