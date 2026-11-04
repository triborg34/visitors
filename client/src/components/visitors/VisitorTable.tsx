import { Link } from 'react-router-dom';
import { ArrowUpDown, Eye, Trash2, Users } from 'lucide-react';
import type { VisitListItem } from '../../types';
import {
  FOLLOW_UP_LABELS,
  FOLLOW_UP_TONES,
  PRIORITY_LABELS,
  PRIORITY_TONES,
  REQUEST_TYPE_LABELS,
  formatJalaliDate,
  toPersianDigits,
} from '../../lib/format';
import { Badge, EmptyState } from '../ui/Display';
import { cn } from '../../lib/utils';

export type SortKey = 'createdAt' | 'fullName' | 'company' | 'priority' | 'followUpStatus' | 'requestType';

interface VisitorTableProps {
  items: VisitListItem[];
  onSort?: (key: SortKey) => void;
  sortKey?: SortKey;
  sortDir?: 'asc' | 'desc';
  showEmployee?: boolean;
  emptyAction?: React.ReactNode;
  onOpen?: (item: VisitListItem) => void;
  onDelete?: (item: VisitListItem) => void;
}

const COLUMNS: Array<{ key: string; label: string; sort?: SortKey; className?: string }> = [
  { key: 'fullName', label: 'نام و نام خانوادگی', sort: 'fullName' },
  { key: 'mobile', label: 'شماره موبایل' },
  { key: 'company', label: 'شرکت', sort: 'company' },
  { key: 'exhibition', label: 'نمایشگاه' },
  { key: 'employee', label: 'کارمند ثبت‌کننده' },
  { key: 'requestType', label: 'نوع درخواست', sort: 'requestType' },
  { key: 'priority', label: 'اولویت', sort: 'priority' },
  { key: 'followUpStatus', label: 'وضعیت پیگیری', sort: 'followUpStatus' },
  { key: 'createdAt', label: 'تاریخ ثبت', sort: 'createdAt' },
];

export function VisitorTable({
  items,
  onSort,
  sortKey,
  sortDir,
  showEmployee = true,
  emptyAction,
  onOpen,
  onDelete,
}: VisitorTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="بازدیدکننده‌ای یافت نشد"
        description="فیلترها را تغییر دهید یا بازدیدکننده جدیدی ثبت کنید."
        action={emptyAction}
        icon={<Users className="size-8" />}
      />
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-right text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              {COLUMNS.filter((column) => showEmployee || column.key !== 'employee').map((column) => (
                <th key={column.key} className="whitespace-nowrap px-4 py-3 font-medium">
                  {column.sort && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.sort!)}
                      className="inline-flex items-center gap-1 transition hover:text-slate-800"
                    >
                      {column.label}
                      <ArrowUpDown
                        className={cn(
                          'size-3.5',
                          sortKey === column.sort && sortDir === 'desc' && 'text-brand-600',
                        )}
                      />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex min-w-44 items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-800">{item.fullName}</p>
                      {item.company ? <p className="text-xs text-slate-500">{item.company}</p> : null}
                    </div>
                    {onDelete ? (
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        aria-label={`حذف مراجعهٔ ${item.fullName}`}
                        title="حذف مراجعه"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash2 className="size-4" />
                        حذف
                      </button>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="ltr-numbers text-slate-700">{toPersianDigits(item.mobile)}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{item.company ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{item.exhibition.name}</td>
                {showEmployee ? (
                  <td className="px-4 py-3 text-slate-600">{item.employee.fullName}</td>
                ) : null}
                <td className="px-4 py-3 text-slate-600">{REQUEST_TYPE_LABELS[item.requestType]}</td>
                <td className="px-4 py-3">
                  <Badge tone={PRIORITY_TONES[item.priority]}>{PRIORITY_LABELS[item.priority]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={FOLLOW_UP_TONES[item.followUpStatus]}>
                    {FOLLOW_UP_LABELS[item.followUpStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                  {formatJalaliDate(item.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {onOpen ? (
                      <button
                        type="button"
                        onClick={() => onOpen(item)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50"
                      >
                        <Eye className="size-4" />
                        مشاهده
                      </button>
                    ) : (
                      <Link
                        to={'/admin/visitors/' + item.visitorId}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50"
                      >
                        <Eye className="size-4" />
                        مشاهده
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
