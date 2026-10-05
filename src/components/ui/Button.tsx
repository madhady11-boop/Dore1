import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'glass' | 'outline' | 'ghost' | 'danger' | 'success' | 'dark';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'text-ink-950 font-bold bg-[linear-gradient(135deg,#f4e0a1_0%,#e8c158_38%,#d4af37_68%,#b8912b_100%)] hover:brightness-110 border border-gold-200/40 shadow-[0_16px_38px_-16px_rgba(232,193,88,0.75)]',
  glass:
    'glass text-white font-semibold hover:border-gold-400/45 hover:bg-white/10',
  outline:
    'border border-white/15 text-ink-100 font-semibold hover:border-gold-400/50 hover:text-white hover:bg-white/5',
  ghost: 'text-ink-200 font-medium hover:text-white hover:bg-white/8 border border-transparent',
  danger:
    'text-rose-50 font-bold bg-rose-glow/18 border border-rose-glow/35 hover:bg-rose-glow/28 hover:border-rose-glow/55',
  success:
    'text-emerald-50 font-bold bg-emerald-glow/18 border border-emerald-glow/35 hover:bg-emerald-glow/28',
  dark: 'bg-ink-800/90 text-white font-semibold border border-white/10 hover:bg-ink-700/90',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-2xl',
  lg: 'h-13 px-7 text-base gap-2.5 rounded-2xl',
  icon: 'h-11 w-11 rounded-2xl justify-center',
  'icon-sm': 'h-9 w-9 rounded-xl justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, icon, iconEnd, block, children, disabled, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center whitespace-nowrap transition-all duration-300',
        'active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
      {!loading && iconEnd}
    </button>
  ),
);
Button.displayName = 'Button';
