import React from 'react';
import { Badge } from './ui/Badge';
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
    <header className="no-print sticky top-0 z-40 bg-paper-100/90 backdrop-blur-md border-b border-stone-border/60 px-4 py-3 sm:px-6">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-forest-800 flex items-center justify-center text-paper-50 shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-tight text-forest-900 leading-none">
                Shadeprint
              </span>
              {mode === 'sample' && (
                <Badge variant="sample" className="text-[10px] py-0 px-1.5 h-4">
                  Sample Mode
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-stone-muted hidden sm:block">
              Open-weight AI field notebook
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isSessionActive && onReset && (
            <button
              onClick={onReset}
              className="text-xs text-stone-muted hover:text-stone-charcoal flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-paper-200 transition-colors"
              title="Reset current walk"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Reset</span>
            </button>
          )}

          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              className="text-xs text-forest-800 hover:text-forest-900 bg-forest-100/60 hover:bg-forest-100 border border-forest-600/20 flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors"
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
