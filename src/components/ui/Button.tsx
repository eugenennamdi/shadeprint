import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl select-none active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none touch-manipulation';
  
  const variants = {
    primary: 'bg-forest-800 text-paper-50 hover:bg-forest-900 active:bg-forest-900 shadow-sm border border-forest-900/90',
    secondary: 'bg-paper-200 text-stone-charcoal hover:bg-paper-300 active:bg-paper-300 border border-stone-border/80 shadow-xs',
    outline: 'border border-stone-border bg-paper-50/50 text-stone-charcoal hover:bg-paper-200 hover:border-stone-slate/30 active:bg-paper-300',
    ghost: 'text-stone-charcoal hover:bg-paper-200/80 active:bg-paper-300/80',
    danger: 'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 shadow-sm',
    subtle: 'bg-forest-100/70 text-forest-800 hover:bg-forest-100 border border-forest-600/20 active:bg-forest-200',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2 font-medium',
    lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5 font-semibold shadow-sm',
    icon: 'h-11 w-11 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center',
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';
