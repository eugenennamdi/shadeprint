import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Observation } from '@/types';
import { CATEGORY_METADATA } from '@/lib/ai/classifier';
import { 
  Footprints, 
  ArrowRight, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { playTick, playWalkCompleted } from '@/lib/sound/soundEffects';

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

  // Play completion acoustic chord when reaching all 3 stops
  useEffect(() => {
    if (isComplete) {
      playWalkCompleted();
    }
  }, [isComplete]);

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 sm:py-10 flex flex-col justify-between text-center">
      <div className="my-auto py-3">
        {/* Step Indicator Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold uppercase tracking-wider mb-5 sm:mb-6 border border-forest-600/20 select-none">
          <CheckCircle2 className="w-3.5 h-3.5 text-forest-700 shrink-0" />
          <span>
            {currentCount} of {totalStops} places documented
          </span>
        </div>

        {/* Poetic Outdoor Instruction */}
        <h2 className="font-serif text-2xl xs:text-3xl sm:text-4xl font-bold text-forest-900 mb-3 tracking-tight leading-[1.2]">
          {isComplete
            ? 'Three places observed.'
            : currentCount === 1
            ? 'One place saved. Put your phone away.'
            : 'Two places saved. Find your contrast.'}
        </h2>

        <p className="text-sm sm:text-base text-stone-slate max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed">
          {isComplete
            ? 'Your neighborhood walk is complete. Review and synthesize the visible shade patterns along your route.'
            : currentCount === 1
            ? 'Pocket your phone. Walk down the street or turn the corner. Notice how the temperature and light change.'
            : 'Look for contrast: if your last stop had deep canopy, seek an open sunny crosswalk or building awning.'}
        </p>

        {/* Visual Filmstrip of Observations */}
        <div className="max-w-md mx-auto mb-6 sm:mb-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: totalStops }).map((_, idx) => {
              const obs = completedObservations[idx];
              return (
                <div key={idx} className="space-y-1.5 text-left">
                  <div
                    className={`aspect-[4/3] rounded-xl overflow-hidden border transition-all ${
                      obs
                        ? 'border-forest-700 shadow-xs bg-stone-100 ring-1 ring-forest-800/10'
                        : 'border-dashed border-stone-border/80 bg-paper-200/50 flex items-center justify-center'
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
                    <div className="px-0.5 min-w-0">
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

        {/* Calm Outdoor Note */}
        {!isComplete && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-forest-50/70 border border-forest-600/20 max-w-md mx-auto text-xs text-stone-slate flex items-center gap-3 text-left mb-4 shadow-2xs">
            <div className="p-2 rounded-xl bg-forest-100 text-forest-800 shrink-0">
              <Footprints className="w-4 h-4" />
            </div>
            <p className="leading-relaxed">
              No need to keep this screen open. Shadeprint safely preserves your session in IndexedDB if your phone sleeps.
            </p>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="pt-4 pb-safe border-t border-stone-border/60 max-w-md mx-auto w-full">
        {isComplete ? (
          <Button
            size="lg"
            variant="primary"
            onClick={() => {
              playTick();
              onFinishSession();
            }}
            className="w-full flex items-center justify-center gap-2 shadow-md font-semibold"
          >
            <Sparkles className="w-4 h-4 text-canopy-leaf" />
            <span>Generate Field Report</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="lg"
            variant="primary"
            onClick={() => {
              playTick();
              onContinueWalk();
            }}
            className="w-full flex items-center justify-center gap-2 shadow-md font-semibold"
          >
            <span>Document stop 0{currentCount + 1}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
