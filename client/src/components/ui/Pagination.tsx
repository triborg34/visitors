import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatNumber } from '../../lib/format';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  if (total === 0) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((value) => {
    if (totalPages <= 7) return true;
    if (value === 1 || value === totalPages) return true;
    return Math.abs(value - page) <= 1;
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
      <p className="text-xs text-slate-500">
        مجموع <span className="font-semibold text-slate-700">{formatNumber(total)}</span> رکورد — صفحه{' '}
        <span className="font-semibold text-slate-700">{formatNumber(page)}</span> از{' '}
        <span className="font-semibold text-slate-700">{formatNumber(totalPages)}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          aria-label="صفحه قبل"
        >
          <ChevronRight className="size-4" />
        </button>
        {pages.map((value, index) => {
          const previous = pages[index - 1];
          const showGap = previous !== undefined && value - previous > 1;
          return (
            <span key={value} className="flex items-center gap-1">
              {showGap ? <span className="px-1 text-slate-400">…</span> : null}
              <button
                type="button"
                onClick={() => onChange(value)}
                className={cn(
                  'size-9 rounded-lg text-sm font-medium transition',
                  value === page
                    ? 'bg-brand-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                {formatNumber(value)}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          aria-label="صفحه بعد"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>
    </div>
  );
}
