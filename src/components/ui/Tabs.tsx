import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  scrollable?: boolean;
}

export const Tabs = <T extends string = string>({
  items,
  value,
  onChange,
  className,
  size = 'md',
  scrollable = true,
}: TabsProps<T>) => (
  <div
    className={cn(
      'glass-soft inline-flex items-center gap-1 rounded-2xl p-1.5',
      scrollable && 'max-w-full overflow-x-auto no-scrollbar',
      className,
    )}
  >
    {items.map((item) => {
      const active = item.value === value;
      return (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            'relative inline-flex items-center gap-2 whitespace-nowrap rounded-xl font-bold transition-all duration-300',
            size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
            active
              ? 'bg-[linear-gradient(135deg,rgba(244,224,161,0.95),rgba(212,175,55,0.9))] text-ink-950 shadow-[0_10px_26px_-12px_rgba(232,193,88,0.8)]'
              : 'text-ink-300 hover:bg-white/6 hover:text-white',
          )}
        >
          {item.icon}
          {item.label}
          {typeof item.count === 'number' && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums',
                active ? 'bg-ink-950/20 text-ink-950' : 'bg-white/8 text-ink-200',
              )}
            >
              {item.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
