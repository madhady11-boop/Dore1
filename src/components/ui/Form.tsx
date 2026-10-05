import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

const CONTROL_BASE =
  'w-full rounded-2xl border border-white/10 bg-ink-950/60 px-4 py-3 text-sm text-white placeholder:text-ink-400 ' +
  'backdrop-blur-md transition-all duration-300 focus:border-gold-400/55 focus:bg-ink-950/80 focus:outline-none ' +
  'disabled:opacity-55 disabled:cursor-not-allowed';

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export const Field = ({ label, hint, error, required, children, className }: FieldProps) => (
  <label className={cn('block space-y-2', className)}>
    {label && (
      <span className="flex items-center gap-1.5 text-xs font-bold text-ink-200">
        {label}
        {required && <span className="text-gold-400">*</span>}
      </span>
    )}
    {children}
    {error ? (
      <span className="block text-[11px] font-semibold text-rose-glow">{error}</span>
    ) : (
      hint && <span className="block text-[11px] leading-relaxed text-ink-400">{hint}</span>
    )}
  </label>
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(CONTROL_BASE, className)} {...props} />,
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(CONTROL_BASE, 'cursor-pointer appearance-none bg-ink-950/80', className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} rows={4} className={cn(CONTROL_BASE, 'resize-y leading-relaxed', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input ref={ref} className={cn(CONTROL_BASE, 'pr-10')} {...props} />
    </div>
  ),
);
SearchInput.displayName = 'SearchInput';

/** Two-column responsive form grid. */
export const FormGrid = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('grid gap-5 sm:grid-cols-2', className)}>{children}</div>
);

export const FormActions = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('flex flex-wrap justify-end gap-3 pt-2', className)}>{children}</div>
);

/** Segmented numeric stepper used for score entry. */
export const NumberStepper = ({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}) => (
  <div className={cn('flex flex-col items-center gap-2', className)}>
    {label && <span className="text-[11px] font-bold text-ink-300">{label}</span>}
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-lg font-black text-ink-100 transition-colors hover:border-rose-glow/40 hover:text-rose-glow"
      >
        −
      </button>
      <span className="w-14 text-center font-heading text-3xl font-black tabular-nums text-white">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-lg font-black text-ink-100 transition-colors hover:border-emerald-glow/40 hover:text-emerald-glow"
      >
        +
      </button>
    </div>
  </div>
);
