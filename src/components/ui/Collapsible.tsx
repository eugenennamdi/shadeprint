import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface CollapsibleProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
  badge,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-stone-border/80 bg-paper-50 transition-all overflow-hidden',
        isOpen ? 'shadow-xs border-forest-600/30' : 'hover:border-stone-border',
        className
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        className="w-full p-4 flex items-center justify-between text-left transition-colors hover:bg-paper-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-inset select-none min-h-[44px]"
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {icon && <span className="text-forest-700 shrink-0">{icon}</span>}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold text-forest-900 leading-snug">
                {title}
              </span>
              {badge}
            </div>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-stone-muted mt-0.5 leading-normal truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="p-1 rounded-md text-stone-muted hover:text-stone-charcoal transition-transform shrink-0">
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-200 ease-out',
              isOpen ? 'rotate-180 text-forest-700' : 'rotate-0'
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-stone-border/40 text-xs text-stone-slate animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};
