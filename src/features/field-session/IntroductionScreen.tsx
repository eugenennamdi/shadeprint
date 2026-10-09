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
  BookOpen 
} from 'lucide-react';
import { FieldSession } from '@/types';
import { formatFieldDate } from '@/lib/utils';

interface IntroductionScreenProps {
  onStartWalk: () => void;
  onStartSample: () => void;
  onViewPastReport: (session: FieldSession) => void;
  pastSessions: FieldSession[];
}

export const IntroductionScreen: React.FC<IntroductionScreenProps> = ({
  onStartWalk,
  onStartSample,
  onViewPastReport,
  pastSessions,
}) => {
  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col justify-between">
      <div>
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold tracking-wider uppercase mb-5 border border-forest-600/20">
          <Sparkles className="w-3.5 h-3.5 text-forest-600" />
          <span>An Open-Weight Field Notebook</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest-900 leading-[1.15] mb-4">
          Discover the shade hiding in your neighborhood.
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg text-stone-slate leading-relaxed mb-8 max-w-xl">
          Take a short walk. Document three everyday places. Let locally running open-weight AI examine visible canopy and architectural cover. See your familiar streets with fresh eyes.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <Button
            size="lg"
            variant="primary"
            onClick={onStartWalk}
            className="group flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <span>Start exploring</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={onStartSample}
            className="flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4 text-stone-muted" />
            <span>Try with sample photos</span>
          </Button>
        </div>

        {/* Core Principles Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-10">
          <Card className="p-4 bg-paper-50/80 border-stone-border/70 hover:border-forest-600/40 transition-colors">
            <div className="w-8 h-8 rounded-md bg-forest-100 text-forest-800 flex items-center justify-center mb-3">
              <Footprints className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-forest-900 mb-1">Three stops</h3>
            <p className="text-xs text-stone-muted leading-relaxed">
              A quick 10-minute walk. The screen is the shortest part of the observation.
            </p>
          </Card>

          <Card className="p-4 bg-paper-50/80 border-stone-border/70 hover:border-forest-600/40 transition-colors">
            <div className="w-8 h-8 rounded-md bg-canopy-mist/50 text-canopy-emerald flex items-center justify-center mb-3">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-forest-900 mb-1">Local vision AI</h3>
            <p className="text-xs text-stone-muted leading-relaxed">
              CLIP open weights run on-device. Zero proprietary API calls.
            </p>
          </Card>

          <Card className="p-4 bg-paper-50/80 border-stone-border/70 hover:border-forest-600/40 transition-colors">
            <div className="w-8 h-8 rounded-md bg-sunlit-sand/40 text-sunlit-ochre flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-forest-900 mb-1">100% Private</h3>
            <p className="text-xs text-stone-muted leading-relaxed">
              No login, no tracking, and no server image storage. Stored in IndexedDB.
            </p>
          </Card>
        </div>

        {/* Technical Honesty & Model Disclosure */}
        <div className="p-4 rounded-xl bg-forest-50/60 border border-forest-600/20 text-xs text-stone-slate space-y-2 mb-10">
          <div className="flex items-center gap-1.5 font-semibold text-forest-900">
            <BookOpen className="w-4 h-4 text-forest-700" />
            <span>Field Notebook Disclosure</span>
          </div>
          <p className="leading-relaxed">
            Shadeprint evaluates <strong className="text-forest-900">visible shade characteristics</strong> (tree canopy, structural overhangs, or open sunlight) using the open-weight <code className="bg-paper-200 px-1 py-0.5 rounded text-[11px]">Xenova/clip-vit-base-patch32</code> model. It does not measure ambient microclimates, thermal comfort, or UV radiation.
          </p>
          <p className="text-[11px] text-stone-muted">
            Model weights (~150MB ONNX) download once on first run and are cached locally by your browser.
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
                  onClick={() => onViewPastReport(session)}
                  className="p-3 bg-paper-50 rounded-lg border border-stone-border hover:border-forest-600/50 cursor-pointer flex items-center justify-between transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-forest-100 text-forest-800 flex items-center justify-center font-serif font-bold text-xs">
                      {session.observations.length}
                    </div>
                    <div>
                      <p className="font-semibold text-forest-900">
                        {session.mode === 'sample' ? 'Sample Demonstration Session' : 'Neighborhood Field Walk'}
                      </p>
                      <p className="text-stone-muted text-[11px]">
                        {formatFieldDate(session.startedAt)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={session.mode === 'sample' ? 'sample' : 'success'} className="text-[10px]">
                    {session.mode === 'sample' ? 'Sample' : 'Complete'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer attribution */}
      <footer className="pt-8 border-t border-stone-border/40 text-[11px] text-stone-muted flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Built for Hacktoberfest 2026: Touch Grass Challenge</span>
        <span>Open Weights · On-Device Inference · MIT License</span>
      </footer>
    </div>
  );
};
