import type { Request } from 'express';
import { prisma } from '../config/prisma';

export function clientIp(req?: Request): string | undefined {
  if (!req) return undefined;
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? undefined;
}

export async function recordAudit(params: {
  userId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  details?: unknown;
  ip?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        details: params.details === undefined ? null : JSON.stringify(params.details),
        ip: params.ip ?? null,
      },
    });
  } catch (error) {
    console.warn('ثبت لاگ حسابرسی ناموفق بود:', (error as Error).message);
  }
}
