import { config } from '../config/env';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/password';
import { DEFAULT_TEMPLATES, TEMPLATE_KEYS } from '../services/message.service';

async function main() {
  console.log('[seed] شروع مقداردهی اولیه پایگاه داده...');

  const settings = await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: config.companyName,
      catalogUrl: config.catalogUrl,
      defaultPlatform: 'BALE',
    },
  });
  console.log('[seed] تنظیمات شرکت آماده شد:', settings.companyName);

  for (const key of TEMPLATE_KEYS) {
    const fallback = DEFAULT_TEMPLATES[key];
    const existing = await prisma.messageTemplate.findUnique({ where: { key } });
    if (!existing) {
      await prisma.messageTemplate.create({
        data: { key, title: fallback.title, body: fallback.body, isActive: true },
      });
      console.log('[seed] قالب پیام ساخته شد:', key);
    }
  }

  const admin = await prisma.user.findUnique({ where: { username: config.adminUsername } });
  if (!admin) {
    const created = await prisma.user.create({
      data: {
        username: config.adminUsername,
        fullName: config.adminFullName,
        passwordHash: await hashPassword(config.adminPassword),
        role: 'ADMIN',
        isActive: true,
        mustChangePassword: true,
      },
    });
    console.log('[seed] حساب مدیر ساخته شد. نام کاربری:', created.username);
    console.log('[seed] رمز عبور اولیه از ADMIN_PASSWORD تنظیم شده است. پس از اولین ورود آن را تغییر دهید.');
  } else {
    console.log('[seed] حساب مدیر موجود است:', admin.username);
  }

  if (process.env.DEMO_SEED === '1') {
    const exhibition =
      (await prisma.exhibition.findFirst({ where: { name: 'نمایشگاه نمونه' } })) ??
      (await prisma.exhibition.create({
        data: {
          name: 'نمایشگاه نمونه',
          location: 'تهران',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          description: 'نمایشگاه آزمایشی برای تست سامانه',
          status: 'ACTIVE',
        },
      }));

    const employee = await prisma.user.findUnique({ where: { username: 'demo' } });
    if (!employee) {
      await prisma.user.create({
        data: {
          username: 'demo',
          fullName: 'کارمند نمونه',
          passwordHash: await hashPassword('Demo@12345'),
          role: 'EMPLOYEE',
          isActive: true,
          mustChangePassword: true,
          activeExhibitionId: exhibition.id,
        },
      });
      console.log('[seed] کارمند نمونه ساخته شد (demo / Demo@12345)');
    }
    console.log('[seed] نمایشگاه نمونه آماده است:', exhibition.name);
  }

  console.log('[seed] پایان.');
}

main()
  .catch((error) => {
    console.error('[seed] خطا:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
