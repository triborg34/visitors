import { jalaaliMonthLength, toGregorian, toJalaali } from 'jalaali-js';

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export interface JalaliCell {
  day: number;
  iso: string;
  isToday: boolean;
}

export function todayJalali(): { jy: number; jm: number; jd: number } {
  return toJalaali(new Date());
}

export function monthLength(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm);
}

export function toIsoDate(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return gy + '-' + String(gm).padStart(2, '0') + '-' + String(gd).padStart(2, '0');
}

export function fromIsoDate(iso: string): { jy: number; jm: number; jd: number } | null {
  if (!iso) return null;
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  const { jy, jm, jd } = toJalaali(new Date(year, month - 1, day));
  return { jy, jm, jd };
}

/** روز هفته‌ی اول ماه (شنبه = ۰) */
function firstWeekdayOffset(jy: number, jm: number): number {
  const { gy, gm, gd } = toGregorian(jy, jm, 1);
  const day = new Date(gy, gm - 1, gd).getDay();
  return (day + 1) % 7;
}

export function buildMonthGrid(jy: number, jm: number): JalaliCell[] {
  const cells: JalaliCell[] = [];
  const offset = firstWeekdayOffset(jy, jm);
  const length = monthLength(jy, jm);
  const today = todayJalali();

  for (let i = 0; i < offset; i += 1) {
    cells.push({ day: 0, iso: '', isToday: false });
  }
  for (let day = 1; day <= length; day += 1) {
    cells.push({
      day,
      iso: toIsoDate(jy, jm, day),
      isToday: today.jy === jy && today.jm === jm && today.jd === day,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: 0, iso: '', isToday: false });
  }
  return cells;
}

export function shiftMonth(jy: number, jm: number, delta: number): { jy: number; jm: number } {
  let month = jm + delta;
  let year = jy;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  return { jy: year, jm: month };
}

export function parseJalaliText(text: string): string | null {
  const normalized = text
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^0-9/\-]/g, '');
  const match = normalized.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return null;
  const jy = Number(match[1]);
  const jm = Number(match[2]);
  const jd = Number(match[3]);
  if (jm < 1 || jm > 12 || jd < 1 || jd > monthLength(jy, jm)) return null;
  return toIsoDate(jy, jm, jd);
}
