import PDFDocument from 'pdfkit';
import path from 'node:path';
import { formatJalaliDate, formatJalaliDateTime } from '../utils/dates';
import {
  GENDER_LABELS,
  REQUEST_TYPE_LABELS,
  PRIORITY_LABELS,
  FOLLOW_UP_LABELS,
  PLATFORM_LABELS,
  type ExportVisitRow,
  type ExportSummary,
} from './export.service';

const FONT_REGULAR = path.resolve(__dirname, '../../../node_modules/vazirmatn/fonts/ttf/Vazirmatn-Regular.ttf');
const FONT_BOLD = path.resolve(__dirname, '../../../node_modules/vazirmatn/fonts/ttf/Vazirmatn-Bold.ttf');
const FONT_MEDIUM = path.resolve(__dirname, '../../../node_modules/vazirmatn/fonts/ttf/Vazirmatn-Medium.ttf');

const PAGE_MARGIN = 40;
const ACCENT = '#1E5C8A';
const TEXT = '#1E293B';
const MUTED = '#64748B';
const LIGHT_BG = '#F1F5F9';
const BORDER = '#E2E8F0';

// ── RTL text helper ──────────────────────────────────────────────────────────
// PDFKit doesn't implement the bidi algorithm. For mostly-Persian content we
// render each line right-aligned and rely on the font's OpenType shaping.
// Mixed-direction runs (numbers, latin) are wrapped in RLM/LRM marks so the
// engine keeps their visual order stable.
const RLM = '\u200F';
const LRM = '\u200E';

function rtl(text: string): string {
  // Prepend RLM to signal right-to-left paragraph direction
  return RLM + text;
}

function ltr(text: string): string {
  return LRM + text;
}

// ── Low-level drawing helpers ────────────────────────────────────────────────
interface Ctx {
  doc: PDFKit.PDFDocument;
  pageWidth: number;
  pageHeight: number;
  y: number;
}

function ensureSpace(ctx: Ctx, needed: number): void {
  if (ctx.y + needed <= ctx.pageHeight - PAGE_MARGIN) return;
  ctx.doc.addPage();
  ctx.y = PAGE_MARGIN;
}

function drawTextRight(
  ctx: Ctx,
  text: string,
  opts: { x: number; width: number; size?: number; font?: string; color?: string; lineGap?: number } ,
): number {
  const { doc } = ctx;
  doc.font(opts.font ?? FONT_REGULAR)
     .fontSize(opts.size ?? 9)
     .fillColor(opts.color ?? TEXT);
  const height = doc.heightOfString(text, { width: opts.width, lineGap: opts.lineGap ?? 2 });
  doc.text(rtl(text), opts.x, ctx.y, { width: opts.width, align: 'right', lineGap: opts.lineGap ?? 2 });
  return height;
}

// ── Table renderer ───────────────────────────────────────────────────────────
interface Column {
  header: string;
  key: keyof ExportVisitRow;
  width: number;
  /** Optional per-cell transform */
  fmt?: (row: ExportVisitRow) => string;
}

const COLUMNS: Column[] = [
  { header: 'ردیف', key: 'index', width: 34, fmt: (r) => String(r.index) },
  { header: 'نام', key: 'fullName', width: 90 },
  { header: 'موبایل', key: 'mobile', width: 76, fmt: (r) => ltr(r.mobile) },
  { header: 'شرکت', key: 'company', width: 80 },
  { header: 'نمایشگاه', key: 'exhibition', width: 72 },
  { header: 'کارمند', key: 'employee', width: 70 },
  { header: 'نوع درخواست', key: 'requestType', width: 66, fmt: (r) => REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType },
  { header: 'اولویت', key: 'priority', width: 40, fmt: (r) => PRIORITY_LABELS[r.priority] ?? r.priority },
  { header: 'پیگیری', key: 'followUpStatus', width: 54, fmt: (r) => FOLLOW_UP_LABELS[r.followUpStatus] ?? r.followUpStatus },
  { header: 'تاریخ ثبت', key: 'createdAt', width: 62, fmt: (r) => formatJalaliDate(r.createdAt) },
  { header: 'توضیحات', key: 'notes', width: 90, fmt: (r) => r.notes || '-' },
];

const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0);

function drawTableHeader(ctx: Ctx): void {
  const { doc } = ctx;
  const rowH = 24;
  ensureSpace(ctx, rowH + 4);

  const x0 = ctx.pageWidth - PAGE_MARGIN - TABLE_WIDTH; // start from right edge
  doc.save();
  doc.rect(x0, ctx.y, TABLE_WIDTH, rowH).fill(ACCENT);

  // Draw cells right-to-left: first column at far right
  let x = ctx.pageWidth - PAGE_MARGIN;
  for (const col of COLUMNS) {
    x -= col.width;
    doc.font(FONT_BOLD).fontSize(7.5).fillColor('#FFFFFF');
    doc.text(rtl(col.header), x + 3, ctx.y + 7, { width: col.width - 6, align: 'center' });
  }
  doc.restore();
  ctx.y += rowH;
}

function drawTableRow(ctx: Ctx, row: ExportVisitRow, striped: boolean): void {
  const { doc } = ctx;
  const cellPad = 4;

  // Measure row height
  doc.font(FONT_REGULAR).fontSize(7.5);
  let maxH = 18;
  for (const col of COLUMNS) {
    const raw = col.fmt ? col.fmt(row) : String(row[col.key] ?? '');
    const h = doc.heightOfString(raw, { width: col.width - cellPad * 2 });
    if (h + cellPad * 2 > maxH) maxH = h + cellPad * 2;
  }

  ensureSpace(ctx, maxH + 2);

  const x0 = ctx.pageWidth - PAGE_MARGIN - TABLE_WIDTH;
  doc.save();

  if (striped) {
    doc.rect(x0, ctx.y, TABLE_WIDTH, maxH).fill(LIGHT_BG);
  }
  doc.rect(x0, ctx.y, TABLE_WIDTH, maxH).lineWidth(0.4).stroke(BORDER);

  let x = ctx.pageWidth - PAGE_MARGIN;
  for (const col of COLUMNS) {
    x -= col.width;
    const raw = col.fmt ? col.fmt(row) : String(row[col.key] ?? '');
    doc.font(FONT_REGULAR).fontSize(7.5).fillColor(TEXT);
    doc.text(raw, x + cellPad, ctx.y + cellPad, {
      width: col.width - cellPad * 2,
      align: col.key === 'mobile' || col.key === 'index' ? 'center' : 'right',
      height: maxH - cellPad * 2,
      ellipsis: true,
    });
    // column separator
    doc.moveTo(x, ctx.y).lineTo(x, ctx.y + maxH).lineWidth(0.4).stroke(BORDER);
  }

  doc.restore();
  ctx.y += maxH;
}

// ── Summary block ────────────────────────────────────────────────────────────
function drawSummary(ctx: Ctx, summary: ExportSummary): void {
  const { doc } = ctx;
  const colW = (ctx.pageWidth - PAGE_MARGIN * 2) / 3;

  ensureSpace(ctx, 80);

  // Title
  doc.font(FONT_BOLD).fontSize(14).fillColor(ACCENT);
  doc.text(rtl('گزارش ' + summary.title), PAGE_MARGIN, ctx.y, {
    width: ctx.pageWidth - PAGE_MARGIN * 2,
    align: 'right',
  });
  ctx.y += 22;

  // Meta line
  doc.font(FONT_REGULAR).fontSize(9).fillColor(MUTED);
  doc.text(
    rtl(
      'تولید: ' + formatJalaliDateTime(summary.generatedAt) +
      '  |  تعداد کل: ' + summary.total +
      '  |  سرنخ داغ: ' + summary.hotLeads +
      '  |  رضایت بازاریابی: ' + summary.consentGranted,
    ),
    PAGE_MARGIN,
    ctx.y,
    { width: ctx.pageWidth - PAGE_MARGIN * 2, align: 'right' },
  );
  ctx.y += 18;

  // Stats groups in a 3-column layout
  const groups: Array<{ label: string; items: Array<{ name: string; count: number }> }> = [
    { label: 'بر اساس نمایشگاه', items: summary.byExhibition },
    { label: 'بر اساس کارمند', items: summary.byEmployee },
    { label: 'بر اساس نوع درخواست', items: summary.byRequestType.map((i) => ({ name: REQUEST_TYPE_LABELS[i.key] ?? i.key, count: i.count })) },
    { label: 'بر اساس اولویت', items: summary.byPriority.map((i) => ({ name: PRIORITY_LABELS[i.key] ?? i.key, count: i.count })) },
    { label: 'بر اساس وضعیت پیگیری', items: summary.byFollowUpStatus.map((i) => ({ name: FOLLOW_UP_LABELS[i.key] ?? i.key, count: i.count })) },
  ].filter((g) => g.items.length > 0);

  const colCount = 3;
  const cols: Array<{ label: string; items: Array<{ name: string; count: number }> }>[] = [[], [], []];
  groups.forEach((g, i) => cols[i % colCount].push(g));

  // Calculate height needed
  let maxRows = 0;
  for (const col of cols) {
    const rows = col.reduce((s, g) => s + g.items.length + 2, 0);
    if (rows > maxRows) maxRows = rows;
  }
  const estH = maxRows * 14 + 10;
  ensureSpace(ctx, estH);

  const startY = ctx.y;
  for (let c = 0; c < colCount; c++) {
    let cy = startY;
    // Right-to-left column order
    const x = ctx.pageWidth - PAGE_MARGIN - (c + 1) * colW;
    for (const group of cols[c]) {
      doc.font(FONT_BOLD).fontSize(9).fillColor(ACCENT);
      doc.text(rtl(group.label), x, cy, { width: colW - 8, align: 'right' });
      cy += 14;
      for (const item of group.items) {
        doc.font(FONT_REGULAR).fontSize(8).fillColor(TEXT);
        doc.text(rtl(item.name + ': ' + item.count), x, cy, { width: colW - 8, align: 'right' });
        cy += 12;
      }
      cy += 4;
    }
  }
  ctx.y = Math.max(startY + estH, ctx.y);

  // Divider
  ctx.y += 6;
  doc.moveTo(PAGE_MARGIN, ctx.y).lineTo(ctx.pageWidth - PAGE_MARGIN, ctx.y).lineWidth(0.6).stroke(BORDER);
  ctx.y += 14;
}

// ── Main builder ─────────────────────────────────────────────────────────────
export function buildVisitorsPdf(
  rows: ExportVisitRow[],
  summary: ExportSummary,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: PAGE_MARGIN,
        bufferPages: true,
        info: {
          Title: 'گزارش بازدیدکنندگان - ' + summary.title,
          Author: 'Amnafarinan Visitor Management',
          CreationDate: summary.generatedAt,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Register fonts
      doc.registerFont('Vazirmatn', FONT_REGULAR);
      doc.registerFont('Vazirmatn-Bold', FONT_BOLD);
      doc.registerFont('Vazirmatn-Medium', FONT_MEDIUM);
      doc.font('Vazirmatn');

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const ctx: Ctx = { doc, pageWidth, pageHeight, y: PAGE_MARGIN };

      // Summary section
      drawSummary(ctx, summary);

      // Table
      drawTableHeader(ctx);
      rows.forEach((row, i) => drawTableRow(ctx, row, i % 2 === 1));

      // Footer with page numbers
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.font(FONT_REGULAR).fontSize(7).fillColor(MUTED);
        doc.text(
          rtl('صفحه ' + (i - range.start + 1) + ' از ' + range.count),
          PAGE_MARGIN,
          pageHeight - 24,
          { width: pageWidth - PAGE_MARGIN * 2, align: 'center' },
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
