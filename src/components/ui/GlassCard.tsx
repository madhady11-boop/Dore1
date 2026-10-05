import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type GlassVariant = 'soft' | 'glass' | 'strong' | 'gold' | 'panel';
type Padding = 'none' | 'sm' | 'md' | 'lg';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  padding?: Padding;
  hover?: boolean;
  as?: ElementType;
  children?: ReactNode;
  /** decorative corner glow */
  glow?: 'gold' | 'sky' | 'emerald' | 'rose' | 'none';
  bare?: boolean;
}

const VARIANTS: Record<GlassVariant, string> = {
  soft: 'glass-soft',
  glass: 'glass',
  strong: 'glass-strong',
  gold: 'glass-gold',
  panel: 'glass-panel',
};

const PADDING: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const GLOWS: Record<string, string> = {
  gold: 'bg-gold-400/16',
  sky: 'bg-sky-glow/14',
  emerald: 'bg-emerald-glow/14',
  rose: 'bg-rose-glow/14',
  none: 'hidden',
};

export const GlassCard = ({
  variant = 'glass',
  padding = 'md',
  hover = false,
  glow = 'none',
  bare = false,
  as: Tag = 'div',
  className,
  children,
  ...props
}: GlassCardProps) => (
  <Tag
    className={cn(
      'relative overflow-hidden rounded-3xl',
      !bare && VARIANTS[variant],
      !bare && PADDING[padding],
      hover && 'glass-hover',
      className,
    )}
    {...props}
  >
    {glow !== 'none' && (
      <div
        className={cn(
          'pointer-events-none absolute -top-24 -left-16 h-52 w-52 rounded-full blur-3xl',
          GLOWS[glow],
        )}
      />
    )}
    {children}
  </Tag>
);
