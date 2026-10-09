import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Footprints, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Camera, 
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { FieldSession } from '@/types';
import { formatFieldDate } from '@/lib/utils';
import { playTick } from '@/lib/sound/soundEffects';

interface IntroductionScreenProps {
  onStartWalk: () => void;
  onStartSample: () => void;
  onViewPastReport: (session: FieldSession) => void;
  pastSessions: FieldSession[];
  inProgressSession?: FieldSession | null;
  onResumeWalk?: (session: FieldSession) => void;
  onDiscardWalk?: (sessionId: string) => void;
}

export const IntroductionScreen: React.FC<IntroductionScreenProps> = ({
  onStartWalk,
  onStartSample,
  onViewPastReport,
  pastSessions,
  inProgressSession,
  onResumeWalk,
  onDiscardWalk,
}) => {
  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 sm:py-10 flex flex-col justify-between">
      <div>
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold tracking-wider uppercase mb-4 sm:mb-5 border border-forest-600/20 select-none">
          <Sparkles className="w-3.5 h-3.5 text-forest-600 shrink-0" />
          <span className="truncate">Open-Weight Field Notebook</span>
        </div>

        {/* Editorial Headline with Responsive Scaling */}
        <h1 className="font-serif text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest-900 leading-[1.18] mb-3 sm:mb-4 break-words">
          Discover the shade hiding in your neighborhood.
        </h1>

        {/* Lead Narrative */}
        <p className="text-sm sm:text-base md:text-lg text-stone-slate leading-relaxed mb-6 max-w-xl">
          Take a short walk. Document three everyday outdoor places. Let locally running open-weight AI examine visible canopy and architectural cover. See your familiar streets with fresh eyes.
        </p>

        {/* Interrupted Session Recovery Banner */}
        {inProgressSession && onResumeWalk && (
          <div className="mb-6 sm:mb-8 p-4 rounded-2xl bg-forest-100/90 border border-forest-600/30 text-xs text-forest-900 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse shrink-0" />
                <span className="font-semibold uppercase tracking-wider text-[11px] text-forest-800 truncate">
                  Walk In Progress
                </span>
              </div>
              <span className="text-[11px] text-stone-muted shrink-0">
                {formatFieldDate(inProgressSession.startedAt)}
              </span>
            </div>
            <p className="text-stone-slate mb-3.5 leading-relaxed text-xs">
              You have an active walk with <strong>{inProgressSession.observations.length} of 3 stops</strong> recorded on this device.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                size="sm" 
                variant="primary" 
                onClick={() => {
                  playTick();
                  onResumeWalk(inProgressSession);
                }} 
                className="flex items-center gap-1.5 shadow-xs"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Resume walk (Stop 0{inProgressSession.observations.length + 1})</span>
              </Button>
              {onDiscardWalk && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onDiscardWalk(inProgressSession.id)} 
                  className="text-stone-muted hover:text-red-700"
                >
                  Discard
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 sm:mb-10">
          <Button
            size="lg"
            variant="primary"
            onClick={() => {
              playTick();
              onStartWalk();
            }}
            className="group w-full sm:w-auto flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <span>Start exploring</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              playTick();
              onStartSample();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4 text-stone-muted" />
            <span>Try with sample photos</span>
          </Button>
        </div>

        {/* Core Principles Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5 mb-8 sm:mb-10">
          <Card className="p-4 bg-paper-50/90 border-stone-border/80 hover:border-forest-600/40 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center mb-2.5">
              <Footprints className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-forest-900 mb-1">Three stops</h3>
            <p className="text-xs text-stone-muted leading-relaxed">
              A quick 10-minute walk. The screen is the shortest part of the observation.
            </p>
          </Card>

          <Card className="p-4 bg-paper-50/90 border-stone-border/80 hover:border-forest-600/40 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-canopy-mist/50 text-canopy-emerald flex items-center justify-center mb-2.5">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-forest-900 mb-1">Local vision AI</h3>
            <p className="text-xs text-stone-muted leading-relaxed">
              CLIP open weights run on-device. Zero proprietary API calls.
            </p>
          </Card>

          <Card className="p-4 bg-paper-50/90 border-stone-border/80 hover:border-forest-600/40 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-sunlit-sand/40 text-sunlit-ochre flex items-center justify-center mb-2.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-forest-900 mb-1">Private by design</h3>
            <p className="text-xs text-stone-muted leading-relaxed">
              No account, no tracking, and no cloud photo uploads. Stored in IndexedDB.
            </p>
          </Card>
        </div>

        {/* Technical Honesty & Model Disclosure */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-forest-50/60 border border-forest-600/20 text-xs text-stone-slate space-y-2 mb-8 sm:mb-10">
          <div className="flex items-center gap-1.5 font-semibold text-forest-900">
            <BookOpen className="w-4 h-4 text-forest-700 shrink-0" />
            <span>Field Notebook Disclosure</span>
          </div>
          <p className="leading-relaxed text-xs">
            Shadeprint evaluates <strong className="text-forest-900">visible physical shade conditions</strong> (tree canopy, structural overhangs, or open sunlight) using the open-weight <code className="bg-paper-200 px-1 py-0.5 rounded text-[11px] font-mono">Xenova/clip-vit-base-patch32</code> model. It does not measure ambient microclimates, thermal comfort, or UV radiation.
          </p>
          <p className="text-[11px] text-stone-muted leading-relaxed">
            First-time launch downloads ~606 MB of unquantized FP32 weights stored in your browser's Cache API for subsequent use (subject to device storage policies). Pre-loading over Wi-Fi is recommended.
          </p>
        </div>

        {/* Past Sessions Archive */}
        {pastSessions.length > 0 && (
          <div className="border-t border-stone-border/70 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-muted">
                Your Saved Field Reports ({pastSessions.length})
              </h2>
            </div>
            <div className="space-y-2">
              {pastSessions.slice(0, 3).map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    playTick();
                    onViewPastReport(session);
                  }}
                  className="p-3.5 bg-paper-50 rounded-xl border border-stone-border/80 hover:border-forest-600/50 active:bg-paper-100 cursor-pointer flex items-center justify-between gap-3 transition-colors text-xs select-none touch-manipulation shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-800 flex items-center justify-center font-serif font-bold text-xs shrink-0">
                      {session.observations.length}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-forest-900 truncate">
                        {session.mode === 'sample' ? 'Sample Demonstration Session' : 'Neighborhood Field Walk'}
                      </p>
                      <p className="text-stone-muted text-[11px] truncate">
                        {formatFieldDate(session.startedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={session.mode === 'sample' ? 'sample' : 'success'} size="sm">
                      {session.mode === 'sample' ? 'Sample' : 'Complete'}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-stone-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Attribution */}
      <footer className="pt-8 pb-safe border-t border-stone-border/40 text-[11px] text-stone-muted flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <span>Built for Hacktoberfest 2026: Touch Grass Challenge</span>
        <span>Open Weights · On-Device Inference · MIT License</span>
      </footer>
    </div>
  );
};
