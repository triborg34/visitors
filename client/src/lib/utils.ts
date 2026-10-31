import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function normalizeMobileInput(value: string): string {
  const digits = value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^0-9]/g, '');
  if (digits.startsWith('98') && digits.length === 12) return '0' + digits.slice(2);
  if (digits.startsWith('0098')) return '0' + digits.slice(4);
  if (digits.length === 10 && digits.startsWith('9')) return '0' + digits;
  return digits;
}

export function isValidIranianMobile(value: string): boolean {
  return /^09\d{9}$/.test(normalizeMobileInput(value));
}
