import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn, uid } from '../../lib/utils';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
  title?: string;
}

interface ToastContextValue {
  push: (tone: ToastTone, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONES: Record<ToastTone, { wrap: string; icon: ReactNode }> = {
  success: {
    wrap: 'border-emerald-glow/35 text-emerald-glow',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  error: { wrap: 'border-rose-glow/35 text-rose-glow', icon: <AlertTriangle className="h-5 w-5" /> },
  info: { wrap: 'border-sky-glow/35 text-sky-glow', icon: <Info className="h-5 w-5" /> },
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string, title?: string) => {
      const id = uid();
      setItems((current) => [...current.slice(-3), { id, tone, message, title }]);
      window.setTimeout(() => remove(id), tone === 'error' ? 7000 : 4500);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (message, title) => push('success', message, title),
      error: (message, title) => push('error', message, title),
      info: (message, title) => push('info', message, title),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[200] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2.5 sm:left-6 sm:translate-x-0">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'glass-strong pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-glass animate-[fade-up_0.35s_cubic-bezier(0.22,1,0.36,1)]',
              TONES[item.tone].wrap,
            )}
            role="status"
          >
            <span className="mt-0.5 shrink-0">{TONES[item.tone].icon}</span>
            <div className="flex-1 space-y-0.5">
              {item.title && <p className="text-sm font-bold text-white">{item.title}</p>}
              <p className="text-xs leading-relaxed text-ink-100">{item.message}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="text-ink-400 transition-colors hover:text-white"
              aria-label="إغلاق التنبيه"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
};
