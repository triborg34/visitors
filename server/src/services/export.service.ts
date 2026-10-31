import ExcelJS from 'exceljs';
import { formatJalaliDate, formatJalaliDateTime } from '../utils/dates';

export const GENDER_LABELS: Record<string, string> = {
  MALE: 'مرد',
  FEMALE: 'زن',
  UNKNOWN: 'نامشخص',
};

export const REQUEST_TYPE_LABELS: Record<string, string> = {
  PRICE_INQUIRY: 'استعلام قیمت / خرید',
  CATALOG: 'دریافت کاتالوگ',
  TECHNICAL_CONSULTATION: 'مشاوره فنی',
  PARTNERSHIP: 'همکاری تجاری',
  OTHER: 'سایر',
};

export const PRIORITY_LABELS: Record<string, string> = {
  HOT: 'داغ',
  WARM: 'گرم',
  NORMAL: 'معمولی',
};

export const FOLLOW_UP_LABELS: Record<string, string> = {
  NEW: 'جدید',
  CONTACTED: 'تماس گرفته شد',
  NEGOTIATION: 'در مذاکره',
  FINALIZED: 'نهایی شده',
  REJECTED: 'رد شده',
};

export const PLATFORM_LABELS: Record<string, string> = {
  BALE: 'بل',
  EITAA: 'ایتا',
  WHATSAPP: 'واتساپ',
  TELEGRAM: 'تلگرام',
  NONE: 'بدون پیام',
};

export interface ExportVisitRow {
  index: number;
  fullName: string;
  mobile: string;
  company: string;
  gender: string;
  exhibition: string;
  employee: string;
  requestType: string;
  priority: string;
  followUpStatus: string;
  sendThankYou: boolean;
  preferredPlatform: string | null;
  marketingConsent: boolean;
  notes: string;
  createdAt: Date;
  lastContactAt: Date | null;
  nextFollowUpAt: Date | null;
}

export interface ExportSummary {
  title: string;
  generatedAt: Date;
  total: number;
  byExhibition: Array<{ name: string; count: number }>;
  byEmployee: Array<{ name: string; count: number }>;
  byRequestType: Array<{ key: string; count: number }>;
  byPriority: Array<{ key: string; count: number }>;
  byFollowUpStatus: Array<{ key: string; count: number }>;
  hotLeads: number;
  consentGranted: number;
}

export function buildVisitorsWorkbook(
  rows: ExportVisitRow[],
  summary: ExportSummary,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Amnafarinan Visitor Management';
  workbook.created = summary.generatedAt;

  const sheet = workbook.addWorksheet('بازدیدکنندگان', {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }],
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  sheet.columns = [
    { header: 'ردیف', key: 'index', width: 8 },
    { header: 'نام و نام خانوادگی', key: 'fullName', width: 26 },
    { header: 'شماره موبایل', key: 'mobile', width: 16 },
    { header: 'شرکت / سازمان', key: 'company', width: 26 },
    { header: 'جنسیت', key: 'gender', width: 12 },
    { header: 'نمایشگاه', key: 'exhibition', width: 24 },
    { header: 'کارمند ثبت‌کننده', key: 'employee', width: 22 },
    { header: 'نوع درخواست', key: 'requestType', width: 22 },
    { header: 'اولویت مشتری', key: 'priority', width: 14 },
    { header: 'وضعیت پیگیری', key: 'followUpStatus', width: 18 },
    { header: 'پیام تشکر', key: 'sendThankYou', width: 12 },
    { header: 'پلتفرم پیام', key: 'preferredPlatform', width: 14 },
    { header: 'رضایت بازاریابی', key: 'marketingConsent', width: 16 },
    { header: 'تاریخ ثبت (شمسی)', key: 'createdAtJalali', width: 18 },
    { header: 'تاریخ ثبت (میلادی)', key: 'createdAt', width: 18 },
    { header: 'آخرین تماس', key: 'lastContactAt', width: 18 },
    { header: 'پیگیری بعدی', key: 'nextFollowUpAt', width: 18 },
    { header: 'توضیحات', key: 'notes', width: 40 },
  ];

  for (const row of rows) {
    sheet.addRow({
      ...row,
      gender: GENDER_LABELS[row.gender] ?? row.gender,
      requestType: REQUEST_TYPE_LABELS[row.requestType] ?? row.requestType,
      priority: PRIORITY_LABELS[row.priority] ?? row.priority,
      followUpStatus: FOLLOW_UP_LABELS[row.followUpStatus] ?? row.followUpStatus,
      preferredPlatform: PLATFORM_LABELS[row.preferredPlatform ?? 'NONE'] ?? '-',
      sendThankYou: row.sendThankYou ? 'بله' : 'خیر',
      marketingConsent: row.marketingConsent ? 'بله' : 'خیر',
      createdAtJalali: formatJalaliDateTime(row.createdAt),
      notes: row.notes || '-',
    });
  }

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E5C8A' } };
  header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  header.height = 26;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: 'top', horizontal: 'right', wrapText: true };
    row.getCell('mobile').alignment = { vertical: 'top', horizontal: 'left' };
    row.getCell('mobile').numFmt = '@';
    row.getCell('createdAt').numFmt = 'yyyy-mm-dd hh:mm';
    row.getCell('lastContactAt').numFmt = 'yyyy-mm-dd';
    row.getCell('nextFollowUpAt').numFmt = 'yyyy-mm-dd';
  });

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length },
  };

  const statSheet = workbook.addWorksheet('آمار خلاصه', {
    views: [{ rightToLeft: true }],
  });

  const titleRow = statSheet.addRow(['گزارش ' + summary.title]);
  statSheet.mergeCells(titleRow.number, 1, titleRow.number, 3);
  titleRow.font = { bold: true, size: 14 };
  titleRow.alignment = { horizontal: 'center' };

  statSheet.addRow(['تاریخ تولید گزارش', formatJalaliDateTime(summary.generatedAt)]);
  statSheet.addRow(['تعداد کل بازدیدکنندگان', summary.total]);
  statSheet.addRow(['سرنخ‌های داغ', summary.hotLeads]);
  statSheet.addRow(['رضایت بازاریابی', summary.consentGranted]);
  statSheet.addRow([]);

  const addGroup = (label: string, items: Array<{ name: string; count: number }>) => {
    if (!items.length) return;
    statSheet.addRow([label]);
    const headerRow = statSheet.addRow(['عنوان', 'تعداد']);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F1F8' } };
    for (const item of items) statSheet.addRow([item.name, item.count]);
    statSheet.addRow([]);
  };

  addGroup(
    'بر اساس نمایشگاه',
    summary.byExhibition.map((i) => ({ name: i.name, count: i.count })),
  );
  addGroup(
    'بر اساس کارمند',
    summary.byEmployee.map((i) => ({ name: i.name, count: i.count })),
  );
  addGroup(
    'بر اساس نوع درخواست',
    summary.byRequestType.map((i) => ({
      name: REQUEST_TYPE_LABELS[i.key] ?? i.key,
      count: i.count,
    })),
  );
  addGroup(
    'بر اساس اولویت',
    summary.byPriority.map((i) => ({ name: PRIORITY_LABELS[i.key] ?? i.key, count: i.count })),
  );
  addGroup(
    'بر اساس وضعیت پیگیری',
    summary.byFollowUpStatus.map((i) => ({
      name: FOLLOW_UP_LABELS[i.key] ?? i.key,
      count: i.count,
    })),
  );

  statSheet.columns = [
    { width: 34 },
    { width: 22 },
    { width: 18 },
  ];
  statSheet.eachRow((row) => {
    row.alignment = { vertical: 'middle', horizontal: 'right' };
  });

  return workbook;
}
