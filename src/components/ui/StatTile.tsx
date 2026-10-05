import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { GlassCard } from './GlassCard';

type Tone = 'gold' | 'sky' | 'emerald' | 'rose' | 'amber' | 'violet' | 'neutral';

const TONES: Record<Tone, { icon: string; value: string; bar: string }> = {
  gold: { icon: 'text-gold-300 bg-gold-400/12 border-gold-300/25', value: 'text-white', bar: 'bg-gold-400' },
  sky: { icon: 'text-sky-glow bg-sky-glow/12 border-sky-glow/25', value: 'text-white', bar: 'bg-sky-glow' },
  emerald: {
    icon: 'text-emerald-glow bg-emerald-glow/12 border-emerald-glow/25',
    value: 'text-white',
    bar: 'bg-emerald-glow',
  },
  rose: { icon: 'text-rose-glow bg-rose-glow/12 border-rose-glow/25', value: 'text-white', bar: 'bg-rose-glow' },
  amber: { icon: 'text-amber-glow bg-amber-glow/12 border-amber-glow/25', value: 'text-white', bar: 'bg-amber-glow' },
  violet: {
    icon: 'text-violet-300 bg-violet-400/12 border-violet-400/25',
    value: 'text-white',
    bar: 'bg-violet-400',
  },
  neutral: { icon: 'text-ink-200 bg-white/6 border-white/12', value: 'text-white', bar: 'bg-white/40' },
};

export interface StatTileProps {
  label: string;
  value: ReactNode;
  suffix?: string;
  icon?: ReactNode;
  tone?: Tone;
  hint?: string;
  /** 0-100 — renders a thin progress bar under the value. */
  progress?: number;
  className?: string;
  compact?: boolean;
}

export const StatTile = ({
  label,
  value,
  suffix,
  icon,
  tone = 'gold',
  hint,
  progress,
  className,
  compact,
}: StatTileProps) => {
  const palette = TONES[tone];
  return (
    <GlassCard hover padding={compact ? 'sm' : 'md'} className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-ink-300 sm:text-sm">{label}</span>
        {icon && (
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
              palette.icon,
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'font-heading font-black tabular-nums text-white',
            compact ? 'text-2xl' : 'text-3xl sm:text-4xl',
          )}
        >
          {value}
        </span>
        {suffix && <span className="text-xs font-semibold text-ink-300">{suffix}</span>}
      </div>
      {typeof progress === 'number' && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className={cn('h-full rounded-full transition-all duration-700', palette.bar)}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      {hint && <p className="text-[11px] leading-relaxed text-ink-400">{hint}</p>}
    </GlassCard>
  );
};
