import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export const Spinner = ({ className }: { className?: string }) => (
  <span
    className={cn(
      'inline-block h-5 w-5 animate-[spin_0.9s_linear_infinite] rounded-full border-2 border-gold-400/25 border-t-gold-400',
      className,
    )}
  />
);

export const LoadingBlock = ({ label = 'جاري التحميل...', rows = 3 }: { label?: string; rows?: number }) => (
  <div className="space-y-4" role="status" aria-live="polite">
    <div className="flex items-center gap-3 text-ink-300 text-sm">
      <Spinner />
      {label}
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="shimmer h-28 rounded-3xl border border-white/8" />
      ))}
    </div>
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('shimmer rounded-2xl border border-white/8', className)} />
);

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ title, description, icon, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      'glass-soft flex flex-col items-center justify-center gap-4 rounded-3xl px-6 py-14 text-center',
      className,
    )}
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gold-300">
      {icon || <Inbox className="h-7 w-7" />}
    </div>
    <div className="space-y-1.5">
      <h3 className="font-heading text-lg font-bold text-white">{title}</h3>
      {description && <p className="max-w-md text-sm leading-relaxed text-ink-300">{description}</p>}
    </div>
    {action}
  </div>
);

export const ErrorState = ({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) => (
  <div
    className={cn(
      'glass-soft flex flex-col items-center gap-4 rounded-3xl border-rose-glow/20 px-6 py-12 text-center',
      className,
    )}
  >
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-glow/25 bg-rose-glow/10 text-rose-glow">
      <AlertTriangle className="h-6 w-6" />
    </div>
    <p className="text-sm text-ink-200">{message}</p>
    {onRetry && (
      <Button variant="glass" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={onRetry}>
        إعادة المحاولة
      </Button>
    )}
  </div>
);
