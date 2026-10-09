import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-paper-50 border border-stone-border/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 md:p-6 transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
