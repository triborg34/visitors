import { toInternationalMobile } from '../utils/persian';

export type MessagePlatform = 'BALE' | 'EITAA' | 'WHATSAPP' | 'TELEGRAM' | 'NONE';

export type LinkMethod = 'DIRECT_LINK' | 'SHARE_SHEET' | 'MANUAL_COPY' | 'API';

export type ConnectionStatus = 'UNTESTED' | 'WORKING' | 'PARTIAL' | 'NOT_WORKING';

export interface MessagingPlatformSpec {
  key: MessagePlatform;
  label: string;
  officialDocsUrl: string;
  method: LinkMethod;
  directChatByPhone: boolean;
  prefilledText: boolean;
  linkTemplate: string;
  secondaryLinkTemplate?: string;
  secondaryLabel?: string;
  guidance: string;
  limitations: string[];
  reviewedAt: string;
}

/**
 * اطلاعات لینک‌ها بر پایهٔ مستندات و رفتار واقعی سرویس‌ها بررسی شده است:
 *  - WhatsApp: لینک رسمی Click to Chat (api.whatsapp.com/send) با شمارهٔ بین‌المللی.
 *  - Telegram: لینک اشتراک‌گذاری رسمی (t.me/share/url) متن را از پیش پر می‌کند ولی گفتگو را
 *    کاربر انتخاب می‌کند؛ گفتگوی مستقیم با شماره فقط با t.me/+phone و بدون متن ممکن است.
 *  - Bale: ارسال مستقیم به شماره با API سرویس سفیر انجام می‌شود.
 *  - Eitaa: مسیر /share تنها وقتی با پارامتر url پاسخ می‌دهد؛ با text تنها به صفحهٔ اصلی هدایت
 *    می‌شود، بنابراین الگوی صحیح شامل url است و باید روی دستگاه واقعی آزمایش شود.
 */
export const MESSAGING_PLATFORM_SPECS: MessagingPlatformSpec[] = [
  {
    key: 'WHATSAPP',
    label: 'واتساپ',
    officialDocsUrl: 'https://developers.facebook.com/docs/whatsapp/click-to-chat/',
    method: 'DIRECT_LINK',
    directChatByPhone: true,
    prefilledText: true,
    linkTemplate: 'https://api.whatsapp.com/send?phone={phone}&text={text}',
    secondaryLinkTemplate: 'https://wa.me/{phone}?text={text}',
    secondaryLabel: 'شکل کوتاه wa.me',
    guidance:
      'شماره باید بین‌المللی و بدون علامت + باشد (مثال: 989123456789). اگر واتساپ نصب نباشد، صفحهٔ واتساپ وب باز می‌شود.',
    limitations: ['در ایران بدون نسخهٔ وب یا دسترسی مناسب ممکن است باز نشود.'],
    reviewedAt: '2026-10-31',
  },
  {
    key: 'TELEGRAM',
    label: 'تلگرام',
    officialDocsUrl: 'https://core.telegram.org/widgets/share',
    method: 'SHARE_SHEET',
    directChatByPhone: false,
    prefilledText: true,
    linkTemplate: 'https://t.me/share/url?url={url}&text={text}',
    secondaryLinkTemplate: 'https://t.me/+{phone}',
    secondaryLabel: 'گفتگوی مستقیم با شماره (بدون متن آماده)',
    guidance:
      'لینک اشتراک‌گذاری متن را از پیش پر می‌کند ولی کاربر باید گفتگوی مقصد را انتخاب کند. گفتگوی مستقیم با شماره (t.me/+phone) متن آماده ندارد و فقط برای شماره‌هایی کار می‌کند که تماس با شماره را مجاز کرده‌اند.',
    limitations: [
      'تلگرام متن را داخل گفتگوی مستقیم با شماره نمی‌گذارد؛ در آن حالت متن باید دستی کپی شود.',
      'گفتگوی مستقیم با شماره به تنظیم حریم خصوصی طرف مقابل وابسته است.',
    ],
    reviewedAt: '2026-10-31',
  },
  {
    key: 'BALE',
    label: 'بل',
    officialDocsUrl: 'https://docs.bale.ai/safir',
    method: 'API',
    directChatByPhone: true,
    prefilledText: true,
    linkTemplate: '',
    guidance: 'ارسال پیام به شمارهٔ تلفن با کلید API و Bot ID سرویس سفیر انجام می‌شود.',
    limitations: ['ارسال به شماره‌های معتبر بله وابسته به دسترسی و محدودیت‌های حساب سفیر است.'],
    reviewedAt: '2026-11-04',
  },
  {
    key: 'EITAA',
    label: 'ایتا',
    officialDocsUrl: 'https://eitaa.com/developers',
    method: 'SHARE_SHEET',
    directChatByPhone: false,
    prefilledText: true,
    linkTemplate: 'https://eitaa.com/share?url={url}&text={text}',
    guidance:
      'در بررسی وب، مسیر /share تنها با پارامتر url پاسخ درست می‌دهد و با text تنها به صفحهٔ اصلی هدایت می‌شود. بنابراین لینک باید همیشه شامل نشانی کاتالوگ باشد و نتیجه باید روی دستگاه واقعی آزمایش شود.',
    limitations: [
      'نتیجهٔ این پلتفرم به آزمون روی دستگاه نیاز دارد؛ در بخش «آزمایش اتصال پیام‌رسان‌ها» وضعیت را ثبت کنید.',
      'اگر لینک کار نکرد، از دکمهٔ «کپی متن» و باز کردن مستقیم ایتا استفاده کنید.',
    ],
    reviewedAt: '2026-10-31',
  },
];

export const PLATFORM_LABELS: Record<MessagePlatform, string> = {
  WHATSAPP: 'واتساپ',
  TELEGRAM: 'تلگرام',
  BALE: 'بل',
  EITAA: 'ایتا',
  NONE: 'بدون پیام',
};

export const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
  UNTESTED: 'آزمایش نشده',
  WORKING: 'کار می‌کند',
  PARTIAL: 'نیاز به کپی دستی متن',
  NOT_WORKING: 'کار نمی‌کند',
};

export function findPlatformSpec(key: string): MessagingPlatformSpec | undefined {
  return MESSAGING_PLATFORM_SPECS.find((spec) => spec.key === key);
}

export interface BuildLinkParams {
  phone?: string | null;
  text: string;
  url?: string | null;
}

export interface BuiltLink {
  url: string | null;
  method: LinkMethod;
  template: string;
  usedOverride: boolean;
  warnings: string[];
}

/**
 * ساخت لینک پیام‌رسان با جایگذاری و رمزگذاری درست پارامترها.
 * phone به‌صورت بین‌المللی و بدون علامت + تبدیل می‌شود.
 */
export function buildMessagingLink(
  platform: MessagePlatform,
  params: BuildLinkParams,
  overrideTemplate?: string | null,
): BuiltLink {
  const spec = findPlatformSpec(platform);
  if (!spec || platform === 'NONE') {
    return {
      url: null,
      method: 'MANUAL_COPY',
      template: '',
      usedOverride: false,
      warnings: ['برای این مورد لینکی وجود ندارد.'],
    };
  }

  if (spec.method === 'API') {
    return {
      url: null,
      method: 'API',
      template: '',
      usedOverride: false,
      warnings: ['این پلتفرم از طریق API ارسال می‌کند و لینک اشتراک‌گذاری ندارد.'],
    };
  }

  const template = (overrideTemplate && overrideTemplate.trim()) || spec.linkTemplate;
  const usedOverride = Boolean(overrideTemplate && overrideTemplate.trim());

  const international = params.phone ? toInternationalMobile(params.phone) : '';
  const phoneValue = international.replace(/^\+/, '');
  const textValue = encodeURIComponent(params.text ?? '');
  const urlValue = encodeURIComponent(params.url ?? '');

  const warnings: string[] = [];
  if (template.includes('{phone}') && !phoneValue) {
    warnings.push('شمارهٔ موبایل ثبت نشده است؛ لینک شماره نخواهد داشت.');
  }
  if (!spec.prefilledText) {
    warnings.push('این پلتفرم متن آماده را داخل لینک قرار نمی‌دهد؛ متن را دستی کپی کنید.');
  }
  if (spec.method === 'SHARE_SHEET') {
    warnings.push('انتخاب گفتگوی مقصد بر عهدهٔ کارمند است.');
  }

  const built = template
    .replace(/\{phone\}/g, phoneValue)
    .replace(/\{text\}/g, textValue)
    .replace(/\{url\}/g, urlValue);

  return {
    url: built,
    method: spec.method,
    template,
    usedOverride,
    warnings: [
      ...warnings,
      ...(usedOverride ? ['الگوی لینک توسط مدیر تغییر داده شده است.'] : []),
    ],
  };
}
