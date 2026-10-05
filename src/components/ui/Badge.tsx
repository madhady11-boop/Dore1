import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Tone = 'gold' | 'sky' | 'emerald' | 'rose' | 'amber' | 'neutral' | 'violet';

const TONES: Record<Tone, string> = {
  gold: 'text-gold-200 bg-gold-400/12 border-gold-300/30',
  sky: 'text-sky-glow bg-sky-glow/12 border-sky-glow/28',
  emerald: 'text-emerald-glow bg-emerald-glow/12 border-emerald-glow/28',
  rose: 'text-rose-glow bg-rose-glow/12 border-rose-glow/28',
  amber: 'text-amber-glow bg-amber-glow/12 border-amber-glow/28',
  violet: 'text-violet-300 bg-violet-400/12 border-violet-400/28',
  neutral: 'text-ink-200 bg-white/6 border-white/12',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge = ({ tone = 'neutral', icon, dot, size = 'md', className, children, ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-bold backdrop-blur-sm whitespace-nowrap',
      size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
      TONES[tone],
      className,
    )}
    {...props}
  >
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
    {icon}
    {children}
  </span>
);

/** Small coloured square with a number, used for table positions. */
export const RankChip = ({ rank, className }: { rank: number; className?: string }) => {
  const zone =
    rank === 1
      ? 'bg-[linear-gradient(135deg,#f4e0a1,#d4af37)] text-ink-950 border-gold-200/60'
      : rank <= 3
        ? 'bg-emerald-glow/18 text-emerald-glow border-emerald-glow/35'
        : 'bg-white/6 text-ink-200 border-white/12';
  return (
    <span
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-lg border font-heading text-xs font-black tabular-nums',
        zone,
        className,
      )}
    >
      {rank}
    </span>
  );
};
