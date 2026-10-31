import jalaali from 'jalaali-js';

export function toJalaaliParts(date: Date) {
  return jalaali.toJalaali(date);
}

export function formatJalaliDate(date: Date): string {
  const { jy, jm, jd } = jalaali.toJalaali(date);
  return jy + '/' + String(jm).padStart(2, '0') + '/' + String(jd).padStart(2, '0');
}

export function formatJalaliDateTime(date: Date): string {
  const { jy, jm, jd } = jalaali.toJalaali(date);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return (
    jy + '/' + String(jm).padStart(2, '0') + '/' + String(jd).padStart(2, '0') + ' ' + hh + ':' + mm
  );
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function parseDateBoundary(value: string | undefined, endOfRange = false): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return endOfRange ? endOfDay(parsed) : startOfDay(parsed);
}
