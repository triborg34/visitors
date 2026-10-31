import { prisma } from '../config/prisma';
import { normalizeMobile } from '../utils/persian';

export interface DuplicateInfo {
  exists: boolean;
  visitorId?: string;
  fullName?: string;
  company?: string;
  mobile?: string;
  firstRegisteredAt?: Date;
  totalVisits?: number;
  lastVisit?: {
    id: string;
    exhibitionName: string;
    employeeName: string;
    createdAt: Date;
    followUpStatus: string;
  };
}

export async function findDuplicateByMobile(mobile: string): Promise<DuplicateInfo> {
  const normalized = normalizeMobile(mobile);
  if (!normalized) return { exists: false };

  const visitor = await prisma.visitor.findUnique({
    where: { mobile: normalized },
    include: {
      visits: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          exhibition: { select: { name: true } },
          employee: { select: { fullName: true } },
        },
      },
      _count: { select: { visits: { where: { deletedAt: null } } } },
    },
  });

  if (!visitor) return { exists: false };

  const last = visitor.visits[0];
  return {
    exists: true,
    visitorId: visitor.id,
    fullName: visitor.fullName,
    company: visitor.company ?? undefined,
    mobile: visitor.mobile,
    firstRegisteredAt: visitor.createdAt,
    totalVisits: visitor._count.visits,
    lastVisit: last
      ? {
          id: last.id,
          exhibitionName: last.exhibition.name,
          employeeName: last.employee.fullName,
          createdAt: last.createdAt,
          followUpStatus: last.followUpStatus,
        }
      : undefined,
  };
}
