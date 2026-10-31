const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (char) => {
    const pIndex = PERSIAN_DIGITS.indexOf(char);
    if (pIndex >= 0) return String(pIndex);
    const aIndex = ARABIC_DIGITS.indexOf(char);
    if (aIndex >= 0) return String(aIndex);
    return char;
  });
}

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function normalizeMobile(raw: string | null | undefined): string {
  if (!raw) return '';
  const digits = toEnglishDigits(String(raw)).replace(/[^0-9]/g, '');
  if (!digits) return '';
  let national = digits;
  if (national.startsWith('0098')) national = national.slice(4);
  else if (national.startsWith('98') && national.length === 12) national = national.slice(2);
  else if (national.startsWith('9') && national.length === 10) national = '0' + national;
  else if (national.startsWith('0') && national.length === 11) national = national;
  else if (national.length === 10) national = '0' + national;
  return national;
}

export function isValidIranianMobile(mobile: string): boolean {
  return /^09\d{9}$/.test(normalizeMobile(mobile));
}

export function toInternationalMobile(mobile: string): string {
  const national = normalizeMobile(mobile);
  if (!national.startsWith('09')) return national;
  return '98' + national.slice(1);
}

export function normalizeText(value: string | null | undefined): string {
  if (!value) return '';
  const stripped = String(value).replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '');
  return toEnglishDigits(stripped).trim();
}
