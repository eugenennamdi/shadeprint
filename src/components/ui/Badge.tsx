import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'outline' | 'sample' | 'subtle';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const variants = {
    default: 'bg-paper-200 text-stone-slate border-stone-border/80',
    success: 'bg-forest-100 text-forest-800 border-forest-600/30',
    warning: 'bg-sunlit-sand/30 text-sunlit-ochre border-sunlit-amber/30',
    info: 'bg-canopy-mist/40 text-canopy-emerald border-canopy-sage/40',
    outline: 'border border-stone-border text-stone-slate bg-transparent',
    sample: 'bg-amber-100 text-amber-900 border-amber-300',
    subtle: 'bg-paper-100 text-stone-muted border-stone-border/60',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 tracking-wide',
    md: 'text-xs px-2.5 py-0.5 tracking-wider',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border uppercase whitespace-nowrap shrink-0 select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
