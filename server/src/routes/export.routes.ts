import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/http';
import { buildVisitWhere, fetchVisitRows } from '../services/visit-query.service';
import { buildVisitorsWorkbook, type ExportVisitRow, type ExportSummary } from '../services/export.service';
import { buildVisitorsPdf } from '../services/pdf.service';
import { getStats } from '../services/stats.service';
import { parseDateBoundary } from '../utils/dates';

export const exportRouter = Router();

exportRouter.use(requireAuth, requireAdmin);

// Shared query → rows + summary (used by both xlsx and pdf endpoints)
async function buildExportData(query: Record<string, string | undefined>) {
  const where = buildVisitWhere(query);
  const rows = await fetchVisitRows(where);

  const stats = await getStats({
    exhibitionId: query.exhibitionId,
    employeeId: query.employeeId,
    from: parseDateBoundary(query.from),
    to: parseDateBoundary(query.to, true),
  });

  const exportRows: ExportVisitRow[] = rows.map((row, index) => {
    const last = row.followUps[0];
    return {
      index: index + 1,
      fullName: row.visitor.fullName,
      mobile: row.visitor.mobile,
      company: row.visitor.company ?? '',
      gender: row.visitor.gender,
      exhibition: row.exhibition.name,
      employee: row.employee.fullName,
      requestType: row.requestType,
      priority: row.priority,
      followUpStatus: row.followUpStatus,
      sendThankYou: row.sendThankYou,
      preferredPlatform: row.preferredPlatform,
      marketingConsent: row.marketingConsent,
      notes: row.notes ?? '',
      createdAt: row.createdAt,
      lastContactAt: last?.lastContactAt ?? null,
      nextFollowUpAt: last?.nextFollowUpAt ?? null,
    };
  });

  const titleParts = ['گزارش بازدیدکنندگان'];
  if (query.exhibitionId) titleParts.push('نمایشگاه: ' + query.exhibitionId);
  if (query.employeeId) titleParts.push('کارمند: ' + query.employeeId);
  if (query.from) titleParts.push('از: ' + query.from);
  if (query.to) titleParts.push('تا: ' + query.to);

  const summary: ExportSummary = {
    title: titleParts.join(' — '),
    generatedAt: new Date(),
    total: exportRows.length,
    byExhibition: stats.byExhibition,
    byEmployee: stats.byEmployee,
    byRequestType: stats.byRequestType,
    byPriority: stats.byPriority,
    byFollowUpStatus: stats.byFollowUpStatus,
    hotLeads: stats.hotLeads,
    consentGranted: stats.consentGranted,
  };

  return { exportRows, summary };
}

exportRouter.get(
  '/visitors.xlsx',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, string | undefined>;
    const { exportRows, summary } = await buildExportData(query);

    const workbook = buildVisitorsWorkbook(exportRows, summary);

    const fileName = 'visitors-' + new Date().toISOString().slice(0, 10) + '.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="' + fileName + '"; filename*=UTF-8\'\'' + encodeURIComponent('بازدیدکنندگان-' + fileName),
    );
    await workbook.xlsx.write(res);
    res.end();
  }),
);

exportRouter.get(
  '/visitors.pdf',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, string | undefined>;
    const { exportRows, summary } = await buildExportData(query);

    const pdf = await buildVisitorsPdf(exportRows, summary);

    const fileName = 'visitors-' + new Date().toISOString().slice(0, 10) + '.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="' + fileName + '"; filename*=UTF-8\'\'' + encodeURIComponent('بازدیدکنندگان-' + fileName),
    );
    res.setHeader('Content-Length', pdf.length);
    res.end(pdf);
  }),
);
