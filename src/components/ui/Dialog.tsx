import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-forest-900/60 backdrop-blur-sm transition-opacity" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] flex flex-col bg-paper-50 rounded-2xl border border-stone-border shadow-2xl overflow-hidden text-stone-slate focus:outline-none',
            className
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 sm:p-6 pb-3 border-b border-stone-border/40 shrink-0">
            <div className="min-w-0 pr-4">
              {title ? (
                <DialogPrimitive.Title asChild>
                  <div className="font-serif text-xl sm:text-2xl font-bold text-forest-900 leading-snug">
                    {title}
                  </div>
                </DialogPrimitive.Title>
              ) : (
                <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>
              )}

              {description ? (
                <DialogPrimitive.Description asChild>
                  <div className="text-xs sm:text-sm text-stone-muted mt-1 leading-normal">
                    {description}
                  </div>
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only" />
              )}
            </div>

            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label="Close dialog"
                className="p-2 -mr-2 -mt-2 rounded-xl text-stone-muted hover:text-stone-charcoal hover:bg-paper-200/80 active:bg-paper-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
