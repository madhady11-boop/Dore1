import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6">
      <div
        className="fixed inset-0 bg-ink-950/80 backdrop-blur-md animate-[fade-in_0.25s_ease-out]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'glass-strong noise relative z-10 my-0 w-full animate-[fade-up_0.35s_cubic-bezier(0.22,1,0.36,1)] rounded-t-4xl sm:my-6 sm:rounded-4xl',
          SIZES[size],
          className,
        )}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="max-h-[88vh] overflow-y-auto">
          {(title || icon) && (
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/8 bg-ink-950/40 px-5 py-4 backdrop-blur-xl sm:px-7 sm:py-5">
              <div className="flex items-center gap-3">
                {icon && (
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-300/25 bg-gold-400/12 text-gold-300">
                    {icon}
                  </span>
                )}
                <div>
                  <h3 className="font-heading text-lg font-bold text-white sm:text-xl">{title}</h3>
                  {subtitle && <p className="mt-0.5 text-xs text-ink-300 sm:text-sm">{subtitle}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-ink-300 transition-colors hover:border-rose-glow/35 hover:text-rose-glow"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>
          {footer && (
            <div className="sticky bottom-0 border-t border-white/8 bg-ink-950/50 px-5 py-4 backdrop-blur-xl sm:px-7">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger = true,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Modal
    open={open}
    onClose={onCancel}
    title={title}
    size="sm"
    icon={<AlertTriangle className={cn('h-5 w-5', danger ? 'text-rose-glow' : 'text-amber-glow')} />}
    footer={
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    }
  >
    <p className="text-sm leading-relaxed text-ink-200">{message}</p>
  </Modal>
);
