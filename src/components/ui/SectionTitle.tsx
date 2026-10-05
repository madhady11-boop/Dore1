import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  eyebrow?: string;
  className?: string;
  align?: 'start' | 'center';
}

export const SectionTitle = ({
  title,
  subtitle,
  icon,
  action,
  eyebrow,
  className,
  align = 'start',
}: SectionTitleProps) => (
  <div
    className={cn(
      'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
      align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
      className,
    )}
  >
    <div className={cn('space-y-1.5', align === 'center' && 'text-center')}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-300/80">
          <span className="h-px w-6 bg-gold-300/50" />
          {eyebrow}
        </span>
      )}
      <h2 className="flex items-center gap-2.5 font-heading text-xl font-bold text-white sm:text-2xl">
        {icon && <span className="text-gold-400">{icon}</span>}
        {title}
      </h2>
      {subtitle && <p className="max-w-2xl text-sm leading-relaxed text-ink-300">{subtitle}</p>}
    </div>
    {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
  </div>
);
