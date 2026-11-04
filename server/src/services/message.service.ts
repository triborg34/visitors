import { prisma } from '../config/prisma';
import { toInternationalMobile } from '../utils/persian';

export type MessagePlatform = 'BALE' | 'EITAA' | 'WHATSAPP' | 'TELEGRAM' | 'NONE';
export type MessageStatus =
  | 'NOT_REQUESTED'
  | 'PREPARED'
  | 'OPENED'
  | 'CONFIRMED_SENT'
  | 'API_SENT'
  | 'FAILED';

export const TEMPLATE_KEYS = [
  'THANK_YOU',
  'COMPANY_INTRO',
  'PRODUCT_INTRO',
  'CATALOG',
  'FOLLOW_UP',
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export const DEFAULT_TEMPLATES: Record<TemplateKey, { title: string; body: string }> = {
  THANK_YOU: {
    title: 'پیام تشکر',
    body: 'سلام {name} عزیز,\n\nاز حضور شما در غرفه امن‌آفرینان در {exhibition} سپاسگزاریم.\n\nامیدواریم محصولات و خدمات ما مورد توجه شما قرار گرفته باشد.\n\nکاتالوگ محصولات ما:\n{catalog_url}\n\nبا احترام\n{temployee}\nتیم امن‌آفرینان',
  },
  COMPANY_INTRO: {
    title: 'معرفی شرکت',
    body: 'سلام {name} عزیز,\n\n{company} تولیدکننده و ارائه‌دهنده محصولات صنعتی با کیفیت است و افتخار همکاری با مجموعه {company} شما را دارد.\n\nاطلاعات تماس:\n{mobile}\n\nکاتالوگ:\n{catalog_url}',
  },
  PRODUCT_INTRO: {
    title: 'معرفی محصول',
    body: 'سلام {name} عزیز,\n\nدرخواست شما برای محصولات {company} در {exhibition} ثبت شد.\n\nهمکاران ما برای ارائه مشخصات فنی و شرایط همکاری با شما تماس خواهند گرفت.\n\nکاتالوگ:\n{catalog_url}',
  },
  CATALOG: {
    title: 'ارسال کاتالوگ',
    body: 'سلام {name} عزیز,\n\nکاتالوگ محصولات امن‌آفرینان را می‌توانید از لینک زیر دریافت کنید:\n\n{catalog_url}\n\nبا تشکر\nتیم امن‌آفرینان',
  },
  FOLLOW_UP: {
    title: 'پیگیری پس از نمایشگاه',
    body: 'سلام {name} عزیز,\n\nپیرو گفت‌وگوی شما در {exhibition}، جهت ارائه جزئیات بیشتر و بررسی شرایط همکاری با شما تماس گرفتیم.\n\nکاتالوگ:\n{catalog_url}\n\nبا احترام\n{temployee}',
  },
};

export interface TemplateContext {
  name: string;
  company: string;
  mobile: string;
  exhibition: string;
  employee: string;
  catalog_url: string;
}

export function renderTemplate(body: string, ctx: TemplateContext): string {
  return body.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = (ctx as unknown as Record<string, string | undefined>)[key];
    return value === undefined || value === null ? match : String(value);
  });
}

export function buildDeepLink(
  platform: MessagePlatform,
  mobile: string,
  text: string,
  catalogUrl?: string,
): string | null {
  const intl = toInternationalMobile(mobile);
  const encodedText = encodeURIComponent(text);
  switch (platform) {
    case 'WHATSAPP':
      return 'https://wa.me/' + intl + '?text=' + encodedText;
    case 'TELEGRAM':
      return (
        'https://t.me/share/url?url=' +
        encodeURIComponent(catalogUrl || 'https://amnafarinan.ir') +
        '&text=' +
        encodedText
      );
    case 'BALE':
      return null;
    case 'EITAA':
      return 'https://eitaa.com/share?text=' + encodedText;
    case 'NONE':
    default:
      return null;
  }
}

export async function getTemplateBody(key: string): Promise<{ key: string; title: string; body: string }> {
  const found = await prisma.messageTemplate.findUnique({ where: { key } });
  if (found) return { key: found.key, title: found.title, body: found.body };
  const fallback = DEFAULT_TEMPLATES[key as TemplateKey];
  if (fallback) return { key, title: fallback.title, body: fallback.body };
  return { key, title: 'پیام', body: 'سلام {name} عزیز,\n\n{catalog_url}' };
}

export async function getCompanySettings() {
  const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
  if (settings) return settings;
  return prisma.companySettings.create({
    data: {
      id: 'default',
      companyName: 'امن‌آفرینان',
      catalogUrl: 'https://amnafarinan.ir/catalog.pdf',
    },
  });
}
