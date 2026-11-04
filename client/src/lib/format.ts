import { toJalaali } from 'jalaali-js';
import type {
  ExhibitionStatus,
  FollowUpStatus,
  Gender,
  MessageStatus,
  Platform,
  Priority,
  RequestType,
} from '../types';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function formatNumber(value: number): string {
  return toPersianDigits(new Intl.NumberFormat('fa-IR').format(value));
}

export function formatJalaliDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  const { jy, jm, jd } = toJalaali(date);
  return toPersianDigits(jy + '/' + String(jm).padStart(2, '0') + '/' + String(jd).padStart(2, '0'));
}

export function formatJalaliDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  const { jy, jm, jd } = toJalaali(date);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return (
    toPersianDigits(jy + '/' + String(jm).padStart(2, '0') + '/' + String(jd).padStart(2, '0')) +
    ' - ' +
    toPersianDigits(hh + ':' + mm)
  );
}

export function formatRelativeDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'همین حالا';
  if (minutes < 60) return toPersianDigits(minutes) + ' دقیقه پیش';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return toPersianDigits(hours) + ' ساعت پیش';
  const days = Math.floor(hours / 24);
  if (days < 30) return toPersianDigits(days) + ' روز پیش';
  return formatJalaliDate(date);
}

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'مرد',
  FEMALE: 'زن',
  UNKNOWN: 'نامشخص',
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  PRICE_INQUIRY: 'استعلام قیمت / خرید',
  CATALOG: 'دریافت کاتالوگ',
  TECHNICAL_CONSULTATION: 'مشاوره فنی',
  PARTNERSHIP: 'همکاری تجاری',
  OTHER: 'سایر',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  HOT: 'داغ',
  WARM: 'گرم',
  NORMAL: 'معمولی',
};

export const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  NEW: 'جدید',
  CONTACTED: 'تماس گرفته شد',
  NEGOTIATION: 'در مذاکره',
  FINALIZED: 'نهایی شده',
  REJECTED: 'رد شده',
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  BALE: 'بله',
  EITAA: 'ایتا',
  WHATSAPP: 'واتساپ',
  TELEGRAM: 'تلگرام',
  NONE: 'بدون پیام',
};

export const EXHIBITION_STATUS_LABELS: Record<ExhibitionStatus, string> = {
  UPCOMING: 'پیش‌رو',
  ACTIVE: 'در حال برگزاری',
  COMPLETED: 'برگزار شده',
};

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  NOT_REQUESTED: 'درخواست نشده',
  PREPARED: 'آماده‌سازی شد',
  OPENED: 'توسط کارمند باز شد',
  CONFIRMED_SENT: 'ارسال توسط کارمند تأیید شد',
  API_SENT: 'ارسال شد (API)',
  FAILED: 'ناموفق',
};

export const PRIORITY_TONES: Record<Priority, string> = {
  HOT: 'bg-rose-100 text-rose-700 ring-rose-200',
  WARM: 'bg-amber-100 text-amber-700 ring-amber-200',
  NORMAL: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export const FOLLOW_UP_TONES: Record<FollowUpStatus, string> = {
  NEW: 'bg-brand-100 text-brand-700 ring-brand-200',
  CONTACTED: 'bg-sky-100 text-sky-700 ring-sky-200',
  NEGOTIATION: 'bg-violet-100 text-violet-700 ring-violet-200',
  FINALIZED: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  REJECTED: 'bg-slate-200 text-slate-600 ring-slate-300',
};

export const EXHIBITION_TONES: Record<ExhibitionStatus, string> = {
  UPCOMING: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  ACTIVE: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  COMPLETED: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export const MESSAGE_STATUS_TONES: Record<MessageStatus, string> = {
  NOT_REQUESTED: 'bg-slate-100 text-slate-600 ring-slate-200',
  PREPARED: 'bg-sky-100 text-sky-700 ring-sky-200',
  OPENED: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  CONFIRMED_SENT: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  API_SENT: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  FAILED: 'bg-rose-100 text-rose-700 ring-rose-200',
};
