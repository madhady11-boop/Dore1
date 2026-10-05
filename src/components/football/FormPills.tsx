import { cn } from '../../lib/utils';
import type { FormResult } from '../../lib/stats';

const STYLES: Record<FormResult, string> = {
  W: 'bg-emerald-glow/20 text-emerald-glow border-emerald-glow/35',
  D: 'bg-white/8 text-ink-100 border-white/15',
  L: 'bg-rose-glow/18 text-rose-glow border-rose-glow/35',
};

const LETTERS: Record<FormResult, string> = { W: 'ف', D: 'ت', L: 'خ' };

export const FormPills = ({
  form,
  className,
  size = 'md',
}: {
  form: FormResult[];
  className?: string;
  size?: 'sm' | 'md';
}) => {
  if (!form || form.length === 0) return <span className="text-[11px] text-ink-400">—</span>;
  return (
    <div className={cn('flex flex-row-reverse items-center gap-1', className)} title="آخر النتائج (الأحدث أولاً)">
      {[...form].reverse().map((result, index) => (
        <span
          key={`${result}-${index}`}
          className={cn(
            'inline-flex items-center justify-center rounded-lg border font-heading font-black',
            size === 'sm' ? 'h-5 w-5 text-[9px]' : 'h-6 w-6 text-[10px]',
            STYLES[result],
          )}
        >
          {LETTERS[result]}
        </span>
      ))}
    </div>
  );
};
