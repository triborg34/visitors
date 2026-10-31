import { PrismaClient } from '@prisma/client';
import { config } from './env';

export const prisma = new PrismaClient({
  log: config.isProd ? ['warn', 'error'] : ['warn', 'error'],
});

export async function enableSqlitePragmas(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    await prisma.$queryRawUnsafe('PRAGMA foreign_keys = ON;');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ اجرای PRAGMAهای SQLite ناموفق بود:', (error as Error).message);
  }
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
