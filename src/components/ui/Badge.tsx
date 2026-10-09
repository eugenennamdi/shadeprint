import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'outline' | 'sample';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-paper-200 text-stone-slate border-stone-border',
    success: 'bg-forest-100 text-forest-800 border-forest-600/30',
    warning: 'bg-sunlit-sand/30 text-sunlit-ochre border-sunlit-amber/30',
    info: 'bg-canopy-mist/40 text-canopy-emerald border-canopy-sage/40',
    outline: 'border border-stone-border text-stone-slate bg-transparent',
    sample: 'bg-amber-100 text-amber-900 border-amber-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
