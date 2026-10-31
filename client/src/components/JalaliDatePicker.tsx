import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatJalaliDate, toPersianDigits } from '../lib/format';
import {
  JALALI_MONTHS,
  WEEK_DAYS,
  buildMonthGrid,
  fromIsoDate,
  parseJalaliText,
  shiftMonth,
  todayJalali,
  toIsoDate,
} from '../lib/jalali';

interface JalaliDatePickerProps {
  value?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  disabled,
  id,
}: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const today = todayJalali();
  const [view, setView] = useState(() => {
    const parsed = value ? fromIsoDate(value) : null;
    return parsed ? { jy: parsed.jy, jm: parsed.jm } : { jy: today.jy, jm: today.jm };
  });
  const [text, setText] = useState(value ? formatJalaliDate(value) : '');
  const [textError, setTextError] = useState(false);

  useEffect(() => {
    setText(value ? formatJalaliDate(value) : '');
    const parsed = value ? fromIsoDate(value) : null;
    if (parsed) setView({ jy: parsed.jy, jm: parsed.jm });
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const cells = useMemo(() => buildMonthGrid(view.jy, view.jm), [view]);

  const handleTextChange = (next: string) => {
    setText(next);
    const iso = parseJalaliText(next);
    if (iso) {
      setTextError(false);
      onChange(iso);
      const parsed = fromIsoDate(iso);
      if (parsed) setView({ jy: parsed.jy, jm: parsed.jm });
    } else {
      setTextError(next.trim().length > 0);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          dir="ltr"
          disabled={disabled}
          value={text}
          onChange={(event) => handleTextChange(event.target.value)}
          placeholder="مثال: ۱۴۰۴/۰۸/۰۹"
          className={cn(
            'field-input flex-1 text-center',
            textError && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100',
          )}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className="grid size-12 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
          aria-label="انتخاب تاریخ"
        >
          <CalendarDays className="size-5" />
        </button>
      </div>

      {open ? (
        <div className="absolute z-30 mt-2 w-full min-w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView((current) => shiftMonth(current.jy, current.jm, -1))}
              className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              aria-label="ماه قبل"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="text-center text-sm font-semibold text-slate-800">
              {toPersianDigits(JALALI_MONTHS[view.jm - 1])} {toPersianDigits(view.jy)}
            </div>
            <button
              type="button"
              onClick={() => setView((current) => shiftMonth(current.jy, current.jm, 1))}
              className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              aria-label="ماه بعد"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="py-1 font-medium">
                {day}
              </div>
            ))}
            {cells.map((cell, index) =>
              cell.day === 0 ? (
                <div key={'empty-' + index} />
              ) : (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => {
                    onChange(cell.iso);
                    setOpen(false);
                  }}
                  className={cn(
                    'grid aspect-square place-items-center rounded-lg text-sm transition',
                    value === cell.iso
                      ? 'bg-brand-700 font-semibold text-white'
                      : cell.isToday
                        ? 'bg-brand-50 font-semibold text-brand-700 ring-1 ring-brand-200'
                        : 'text-slate-700 hover:bg-slate-100',
                  )}
                >
                  {toPersianDigits(cell.day)}
                </button>
              ),
            )}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => {
                onChange(toIsoDate(today.jy, today.jm, today.jd));
                setView({ jy: today.jy, jm: today.jm });
                setOpen(false);
              }}
              className="rounded-lg px-2 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-50"
            >
              امروز
            </button>
            <span className="text-xs text-slate-400">{placeholder}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
