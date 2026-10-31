import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card p-5', className)}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  action,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
            {icon}
          </span>
        ) : null}
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = 'bg-slate-100 text-slate-600 ring-slate-200',
  className,
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        tone,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-slate-500">
      <Loader2 className="size-5 animate-spin" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      {icon ? <div className="text-slate-400">{icon}</div> : null}
      <div>
        <p className="font-semibold text-slate-700">{title}</p>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center">
      <p className="font-semibold text-rose-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
        >
          تلاش دوباره
        </button>
      ) : null}
    </div>
  );
}

export function StatCard({
  title,
  value,
  icon,
  tone = 'brand',
  hint,
}: {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: 'brand' | 'emerald' | 'rose' | 'amber' | 'violet';
  hint?: string;
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  } as const;
  return (
    <div className="card flex items-center gap-4 p-4">
      {icon ? (
        <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl', tones[tone])}>{icon}</span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500">{title}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
        {hint ? <p className="mt-0.5 truncate text-xs text-slate-400">{hint}</p> : null}
      </div>
    </div>
  );
}
