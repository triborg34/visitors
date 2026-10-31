import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  push: (toast: { type?: ToastType; title: string; message?: string }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE: Record<ToastType, { icon: typeof Info; wrapper: string; iconColor: string }> = {
  success: {
    icon: CheckCircle2,
    wrapper: 'border-emerald-200 bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  error: { icon: AlertTriangle, wrapper: 'border-rose-200 bg-rose-50', iconColor: 'text-rose-600' },
  info: { icon: Info, wrapper: 'border-brand-200 bg-brand-50', iconColor: 'text-brand-600' },
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: { type?: ToastType; title: string; message?: string }) => {
      counter += 1;
      const id = counter;
      setToasts((current) => [...current, { id, type: toast.type ?? 'info', title: toast.title, message: toast.message }]);
      window.setTimeout(() => remove(id), toast.type === 'error' ? 8000 : 4500);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, message) => push({ type: 'success', title, message }),
      error: (title, message) => push({ type: 'error', title, message }),
      info: (title, message) => push({ type: 'info', title, message }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map((toast) => {
          const tone = TONE[toast.type];
          const Icon = tone.icon;
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lg',
                tone.wrapper,
              )}
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', tone.iconColor)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                {toast.message ? <p className="mt-0.5 text-sm text-slate-600">{toast.message}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-600"
                aria-label="بستن"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast باید داخل ToastProvider استفاده شود.');
  return context;
}
