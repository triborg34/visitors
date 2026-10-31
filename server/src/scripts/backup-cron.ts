/**
 * اسکریپت پشتیبان‌گیری پایگاه داده (نسخه اجرایی برای cron).
 * از VACUUM INTO برای ساخت کپی سازگار استفاده می‌کند و ۲۰ نسخه آخر را نگه می‌دارد.
 */
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/env';
import { prisma } from '../config/prisma';

function resolveDatabasePath() {
  const raw = config.databaseUrl.replace(/^file:/, '');
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(__dirname, '../../prisma', raw);
}

async function main() {
  const dbPath = resolveDatabasePath();
  if (!fs.existsSync(dbPath)) {
    throw new Error('فایل پایگاه داده یافت نشد: ' + dbPath);
  }
  const backupDir = process.env.BACKUP_DIR ?? '/var/backups/amnafarinan';
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(backupDir, 'amnafarinan-' + stamp + '.db');
  try {
    await prisma.$executeRawUnsafe('VACUUM INTO ' + JSON.stringify(target) + ';');
  } catch {
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
  console.log('backup created: ' + target);
}

main()
  .catch((error) => {
    console.error('backup failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });