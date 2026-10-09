import React from 'react';
import { Button } from '@/components/ui/Button';
import { Observation } from '@/types';
import { CATEGORY_METADATA } from '@/lib/ai/classifier';
import { 
  Footprints, 
  ArrowRight, 
  CheckCircle2
} from 'lucide-react';

interface BetweenStopsScreenProps {
  completedObservations: Observation[];
  totalStops: number; // 3
  onContinueWalk: () => void;
  onFinishSession: () => void;
}

export const BetweenStopsScreen: React.FC<BetweenStopsScreenProps> = ({
  completedObservations,
  totalStops,
  onContinueWalk,
  onFinishSession,
}) => {
  const currentCount = completedObservations.length;
  const isComplete = currentCount >= totalStops;

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col justify-between text-center">
      <div className="my-auto py-4">
        {/* Step indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold uppercase tracking-wider mb-6 border border-forest-600/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
          <span>
            {currentCount} of {totalStops} places documented
          </span>
        </div>

        {/* Big poetic instruction */}
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest-900 mb-3 tracking-tight">
          {isComplete
            ? 'Three places observed.'
            : currentCount === 1
            ? 'One place documented. Keep walking.'
            : 'Two places documented. Find your contrast.'}
        </h2>

        <p className="text-base text-stone-slate max-w-md mx-auto mb-8 leading-relaxed">
          {isComplete
            ? 'Your three-stop walk is complete. Let us synthesize what you observed along your neighborhood route.'
            : currentCount === 1
            ? 'Put your phone in your pocket. Walk down the block or turn the corner. Notice when the air feels different.'
            : 'Look for a contrast: if your last stop had deep tree shade, look for an open sunny crosswalk or building awning.'}
        </p>

        {/* Visual filmstrip of confirmed stops */}
        <div className="max-w-md mx-auto mb-10">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: totalStops }).map((_, idx) => {
              const obs = completedObservations[idx];
              return (
                <div key={idx} className="space-y-1.5 text-left">
                  <div
                    className={`aspect-[4/3] rounded-lg overflow-hidden border transition-all ${
                      obs
                        ? 'border-forest-700 shadow-sm bg-stone-100'
                        : 'border-dashed border-stone-border bg-paper-200/50 flex items-center justify-center'
                    }`}
                  >
                    {obs ? (
                      <img
                        src={obs.photoDataUrl}
                        alt={`Observation 0${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-mono text-xs text-stone-muted font-bold">
                        0{idx + 1}
                      </span>
                    )}
                  </div>
                  {obs ? (
                    <div className="px-0.5">
                      <p className="text-[11px] font-semibold text-forest-900 truncate">
                        {CATEGORY_METADATA[obs.finalCategory]?.name}
                      </p>
                      <p className="text-[10px] text-stone-muted truncate">
                        {obs.locationLabel || `Stop 0${idx + 1}`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-stone-muted px-0.5">Upcoming</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Gentle encouragement card */}
        {!isComplete && (
          <div className="p-4 rounded-xl bg-forest-50/70 border border-forest-600/20 max-w-md mx-auto text-xs text-stone-slate flex items-center gap-3 text-left mb-6">
            <div className="p-2 rounded-lg bg-forest-100 text-forest-800 shrink-0">
              <Footprints className="w-4 h-4" />
            </div>
            <p className="leading-relaxed">
              No need to rush. Shadeprint remembers your session if you close your browser or turn off the screen while you walk.
            </p>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="pt-6 border-t border-stone-border/60 max-w-md mx-auto w-full">
        {isComplete ? (
          <Button
            size="lg"
            variant="primary"
            onClick={onFinishSession}
            className="w-full flex items-center justify-center gap-2 shadow-md"
          >
            <span>Generate Field Report</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="lg"
            variant="primary"
            onClick={onContinueWalk}
            className="w-full flex items-center justify-center gap-2 shadow-md"
          >
            <span>Document stop 0{currentCount + 1}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
