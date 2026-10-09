import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { RotateCcw, Info } from 'lucide-react';

interface HeaderProps {
  mode?: 'field' | 'sample';
  onReset?: () => void;
  onOpenAbout?: () => void;
  isSessionActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onReset,
  onOpenAbout,
  isSessionActive,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-paper-100/95 backdrop-blur-md border-b border-stone-border/60 px-3 sm:px-6 py-2.5 sm:py-3 transition-colors">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-forest-800 flex items-center justify-center text-paper-50 shadow-xs shrink-0 select-none">
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-forest-900 leading-none truncate">
                Shadeprint
              </span>
              {mode === 'sample' && (
                <Badge variant="sample" size="sm" className="hidden xs:inline-flex">
                  Sample
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-stone-muted hidden sm:block truncate">
              Open-weight AI field notebook
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {mode === 'sample' && (
            <Badge variant="sample" size="sm" className="xs:hidden">
              Sample
            </Badge>
          )}

          {isSessionActive && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-stone-slate hover:text-stone-charcoal flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-paper-200 active:bg-paper-300 transition-colors min-h-[38px] select-none touch-manipulation"
              title="Reset current walk"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Reset</span>
            </button>
          )}

          {onOpenAbout && (
            <button
              type="button"
              onClick={onOpenAbout}
              className="text-xs font-medium text-forest-800 hover:text-forest-900 bg-forest-100/70 hover:bg-forest-100 border border-forest-600/20 active:bg-forest-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors min-h-[38px] select-none touch-manipulation shadow-2xs"
              title="About Shadeprint and Privacy"
            >
              <Info className="w-3.5 h-3.5" />
              <span>About</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
