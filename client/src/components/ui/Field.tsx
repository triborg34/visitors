import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/utils';

interface FieldWrapperProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FieldWrapperProps) {
  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="field-error">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { invalid, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'field-input',
        invalid && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100',
        className,
      )}
      {...rest}
    />
  );
});

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { invalid, className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'field-input min-h-24 resize-y leading-7',
        invalid && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100',
        className,
      )}
      {...rest}
    />
  );
});

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { invalid, className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'field-input appearance-none bg-no-repeat pe-9',
        invalid && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: 'left 0.75rem center',
        backgroundSize: '1.1rem',
      }}
      {...rest}
    >
      {children}
    </select>
  );
});

interface OptionGroupProps {
  options: Array<{ value: string; label: string; description?: string }>;
  value?: string;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3;
  name: string;
}

export function OptionGroup({ options, value, onChange, columns = 2, name }: OptionGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        'grid gap-2',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-3',
      )}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'tap-target flex flex-col items-start justify-center rounded-xl border px-4 py-3 text-start transition',
              selected
                ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40',
            )}
          >
            <span className={cn('text-sm font-semibold', selected ? 'text-brand-800' : 'text-slate-700')}>
              {option.label}
            </span>
            {option.description ? (
              <span className="mt-0.5 text-xs text-slate-500">{option.description}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
