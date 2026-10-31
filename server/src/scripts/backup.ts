import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/env';
import { prisma } from '../config/prisma';

function resolveDatabasePath(): string {
  const raw = config.databaseUrl.replace(/^file:/, '');
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(__dirname, '../../prisma', raw);
}

async function main() {
  const dbPath = resolveDatabasePath();
  if (!fs.existsSync(dbPath)) {
    console.error('[backup] فایل پایگاه داده یافت نشد:', dbPath);
    process.exitCode = 1;
    return;
  }

  const backupDir = path.resolve(__dirname, '../../backups');
  fs.mkdirSync(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(backupDir, 'amnafarinan-' + stamp + '.db');

  try {
    await prisma.$executeRawUnsafe('VACUUM INTO ' + JSON.stringify(target) + ';');
  } catch (error) {
    console.warn('[backup] VACUUM INTO ناموفق بود، کپی مستقیم فایل انجام می‌شود:', (error as Error).message);
    fs.copyFileSync(dbPath, target);
  }

  const keep = Number(process.env.BACKUP_KEEP ?? 20);
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith('amnafarinan-') && f.endsWith('.db'))
    .sort()
    .reverse();
  for (const old of files.slice(keep)) {
    fs.unlinkSync(path.join(backupDir, old));
  }

  const size = fs.statSync(target).size;
  console.log('[backup] نسخه پشتیبان ساخته شد:', target, '(' + Math.round(size / 1024) + ' KB)');
}

main()
  .catch((error) => {
    console.error('[backup] خطا:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
