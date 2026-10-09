import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Collapsible } from '@/components/ui/Collapsible';
import { 
  ShadeCategory, 
  ModelScoreDetail, 
  ModelStatus, 
  ModelDownloadProgress 
} from '@/types';
import { 
  visionClassifier, 
  CATEGORY_METADATA 
} from '@/lib/ai/classifier';
import { 
  Trees, 
  Building2, 
  SunMedium, 
  HelpCircle, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  RotateCcw,
  Cpu,
  Download
} from 'lucide-react';
import { playTick } from '@/lib/sound/soundEffects';

interface ObservationReviewScreenProps {
  currentStopIndex: number;
  totalStops: number;
  photoDataUrl: string;
  locationLabel?: string;
  onConfirmObservation: (
    finalCategory: ShadeCategory,
    aiSuggestedCategory?: ShadeCategory,
    scores?: ModelScoreDetail[],
    userNote?: string
  ) => void;
  onRetake: () => void;
  persistenceError?: string | null;
  onRetrySave?: () => void;
  isSaving?: boolean;
}

export const ObservationReviewScreen: React.FC<ObservationReviewScreenProps> = ({
  currentStopIndex,
  totalStops,
  photoDataUrl,
  locationLabel,
  onConfirmObservation,
  onRetake,
  persistenceError,
  onRetrySave,
  isSaving,
}) => {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState<ModelDownloadProgress | null>(null);
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState<ShadeCategory | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<ShadeCategory>('tree_shade');
  const [scores, setScores] = useState<ModelScoreDetail[]>([]);
  const [isUncertain, setIsUncertain] = useState(false);
  const [inferenceDurationMs, setInferenceDurationMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userNote, setUserNote] = useState<string>('');

  const stopNumberString = `0${currentStopIndex + 1}`.slice(-2);

  // Subscribe to model progress and run real classification
  useEffect(() => {
    let isCancelled = false;

    const unsubscribe = visionClassifier.onProgress((progress) => {
      if (!isCancelled) {
        setDownloadProgress(progress);
        if (progress.status === 'progress' || progress.status === 'initiate') {
          setModelStatus('loading_weights');
        }
      }
    });

    const runAnalysis = async () => {
      try {
        setModelStatus('analyzing');
        setErrorMessage(null);

        const result = await visionClassifier.classifyImage(photoDataUrl);

        if (!isCancelled) {
          setAiSuggestedCategory(result.suggestedCategory);
          setSelectedCategory(result.suggestedCategory);
          setScores(result.scores);
          setIsUncertain(result.uncertain);
          setInferenceDurationMs(result.inferenceDurationMs);
          setModelStatus('success');
        }
      } catch (err: any) {
        console.error('Observation inference error:', err);
        if (!isCancelled) {
          setModelStatus('error');
          setErrorMessage(err?.message || 'Open-weight model failed to load. You can still confirm your observation manually.');
          setSelectedCategory('unclear');
        }
      }
    };

    runAnalysis();

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [photoDataUrl]);

  const handleConfirm = () => {
    if (modelStatus === 'analyzing' || modelStatus === 'loading_weights' || isSaving) return;
    onConfirmObservation(
      selectedCategory,
      aiSuggestedCategory,
      scores.length > 0 ? scores : undefined,
      userNote.trim() || undefined
    );
  };

  const isUserOverriding = aiSuggestedCategory && selectedCategory !== aiSuggestedCategory;

  const getCategoryIcon = (category: ShadeCategory, className = 'w-4 h-4') => {
    switch (category) {
      case 'tree_shade':
        return <Trees className={`${className} text-forest-700`} />;
      case 'built_shade':
        return <Building2 className={`${className} text-stone-slate`} />;
      case 'exposed':
        return <SunMedium className={`${className} text-sunlit-ochre`} />;
      case 'unclear':
        return <HelpCircle className={`${className} text-stone-muted`} />;
    }
  };

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 py-5 sm:py-8 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="font-mono text-xs font-bold text-forest-700 uppercase tracking-widest">
            Observation {stopNumberString} / 0{totalStops}
          </span>
          {locationLabel && (
            <span className="text-xs text-stone-muted truncate max-w-[180px] font-medium">
              {locationLabel}
            </span>
          )}
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mb-1 leading-tight">
          Review your observation
        </h2>
        <p className="text-xs sm:text-sm text-stone-slate mb-4 leading-relaxed">
          Verify what the open-weight model sees against what you actually experienced outside.
        </p>

        {/* 1. Captured Photo Box */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-stone-100 border border-stone-border/80 shadow-xs mb-4">
          <img
            src={photoDataUrl}
            alt="Captured field observation"
            className="w-full h-full object-cover"
          />

          {/* Model Status Overlay Pill */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            {modelStatus === 'loading_weights' && (
              <div className="px-3 py-1.5 rounded-xl bg-forest-900/90 text-paper-50 text-xs backdrop-blur-md flex items-center gap-2 shadow-md">
                <Download className="w-3.5 h-3.5 animate-bounce shrink-0" />
                <span className="font-medium">
                  Downloading weights: {Math.round(downloadProgress?.progress || 0)}%
                </span>
              </div>
            )}

            {modelStatus === 'analyzing' && (
              <div className="px-3 py-1.5 rounded-xl bg-forest-900/90 text-paper-50 text-xs backdrop-blur-md flex items-center gap-2 shadow-md">
                <Cpu className="w-3.5 h-3.5 animate-pulse text-canopy-leaf shrink-0" />
                <span className="font-medium">Analyzing with local CLIP model...</span>
              </div>
            )}

            {modelStatus === 'success' && aiSuggestedCategory && (
              <div className="px-3 py-1.5 rounded-xl bg-paper-50/95 text-forest-900 text-xs backdrop-blur-md font-semibold border border-stone-border/80 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                <span>AI suggestion: {CATEGORY_METADATA[aiSuggestedCategory].name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading Weights Progress Card */}
        {modelStatus === 'loading_weights' && (
          <div className="mb-4 p-4 rounded-2xl bg-forest-50/80 border border-forest-600/20 text-xs text-stone-slate space-y-2 animate-fade-in shadow-2xs">
            <div className="flex items-center justify-between font-semibold text-forest-900">
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4 text-forest-700" />
                <span>Downloading unquantized weights (FP32)</span>
              </span>
              <span className="font-mono text-xs">{Math.round(downloadProgress?.progress || 0)}%</span>
            </div>
            <div className="h-2 w-full bg-paper-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-700 transition-all duration-300"
                style={{ width: `${downloadProgress?.progress || 0}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-muted leading-relaxed">
              Once downloaded (~606 MB), weights are cached in your browser. Future walks analyze instantly without re-downloading.
            </p>
          </div>
        )}

        {/* Error State Banner */}
        {modelStatus === 'error' && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Local AI Inference Unavailable</p>
              <p className="text-[11px] mt-0.5 leading-relaxed text-red-800">
                {errorMessage}
              </p>
              <p className="text-[11px] mt-1 font-medium text-forest-900">
                You can still classify this observation manually below.
              </p>
            </div>
          </div>
        )}

        {/* Persistence Failure Banner */}
        {persistenceError && (
          <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex flex-col sm:flex-row items-start justify-between gap-3 animate-fade-in shadow-2xs">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs sm:text-sm">Storage Save Failed</p>
                <p className="text-[11px] mt-0.5 leading-relaxed text-red-800">
                  {persistenceError}
                </p>
                <p className="text-[11px] mt-1 text-stone-muted">
                  Your observation is preserved in memory. You can retry saving now.
                </p>
              </div>
            </div>
            {onRetrySave && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetrySave}
                isLoading={isSaving}
                className="shrink-0 text-red-900 border-red-300 hover:bg-red-100 min-h-[44px] min-w-[100px] font-semibold"
              >
                Retry save
              </Button>
            )}
          </div>
        )}

        {/* 2 & 3. Clear AI Suggestion Banner */}
        {modelStatus === 'success' && aiSuggestedCategory && (
          <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-forest-50/80 border border-forest-600/30 flex items-start gap-3 shadow-2xs animate-fade-in">
            <div className="p-2 rounded-xl bg-forest-100 text-forest-800 shrink-0 mt-0.5">
              {getCategoryIcon(aiSuggestedCategory, 'w-5 h-5')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-forest-800 uppercase tracking-wider">
                  AI Suggestion
                </span>
                <Badge variant="success" size="sm">
                  {CATEGORY_METADATA[aiSuggestedCategory].name}
                </Badge>
              </div>
              <p className="text-xs text-stone-slate mt-1 leading-relaxed">
                {CATEGORY_METADATA[aiSuggestedCategory].desc}
              </p>
            </div>
          </div>
        )}

        {/* 4. Human Confirmation & Correction Cards */}
        <div className="mb-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-stone-slate uppercase tracking-wider">
              Your ground-truth observation
            </label>
            {isUserOverriding && (
              <Badge variant="warning" size="sm">
                Human override active
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(['tree_shade', 'built_shade', 'exposed', 'unclear'] as ShadeCategory[]).map((cat) => {
              const meta = CATEGORY_METADATA[cat];
              const isSelected = selectedCategory === cat;
              const isAiPick = aiSuggestedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    playTick();
                    setSelectedCategory(cat);
                  }}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between min-h-[52px] select-none touch-manipulation active:scale-[0.98] ${
                    isSelected
                      ? 'bg-paper-50 border-forest-800 shadow-xs ring-2 ring-forest-800/80'
                      : 'bg-paper-50/70 border-stone-border/80 hover:bg-paper-50 hover:border-stone-slate/30'
                  }`}
                >
                  <div className="space-y-0.5 pr-2 min-w-0">
                    <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-forest-900">
                      {getCategoryIcon(cat, 'w-4 h-4')}
                      <span className="truncate">{meta.name}</span>
                      {isAiPick && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-forest-100 text-forest-800 border border-forest-600/30 uppercase shrink-0 font-bold">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-muted leading-tight line-clamp-2">
                      {meta.desc}
                    </p>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? 'border-forest-800 bg-forest-800 text-paper-50 shadow-2xs'
                        : 'border-stone-border bg-paper-200/80'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Collapsible: "How the AI decided" (Progressive Technical Disclosure) */}
        {modelStatus === 'success' && scores.length > 0 && (
          <div className="mb-4">
            <Collapsible
              icon={<Cpu className="w-4 h-4" />}
              title="How the AI decided"
              subtitle="Relative contrastive prompt scores & diagnostics"
              badge={
                inferenceDurationMs !== null ? (
                  <span className="text-[10px] font-mono bg-paper-200/80 px-1.5 py-0.5 rounded text-stone-muted">
                    {inferenceDurationMs}ms
                  </span>
                ) : undefined
              }
            >
              <div className="space-y-3 pt-1">
                <p className="text-[11px] text-stone-muted leading-relaxed">
                  Scores represent softmax-normalized cosine similarity across candidate descriptions. They indicate relative contrastive alignment, not physical shade area or calibrated probability.
                </p>

                {/* Score Bars */}
                <div className="space-y-2">
                  {scores.map((s) => {
                    const percent = Math.round(s.score * 100);
                    const isTop = s.category === aiSuggestedCategory;
                    return (
                      <div key={s.category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={`flex items-center gap-1.5 ${isTop ? 'font-semibold text-forest-900' : 'text-stone-slate'}`}>
                            {getCategoryIcon(s.category, 'w-3.5 h-3.5')}
                            <span>{CATEGORY_METADATA[s.category]?.name || s.category}</span>
                          </span>
                          <span className="font-mono text-[11px] text-stone-muted font-medium">
                            Relative match: {percent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-paper-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isTop ? 'bg-forest-700' : 'bg-stone-border'
                            }`}
                            style={{ width: `${Math.max(percent, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Uncertainty Notice */}
                {isUncertain && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      <strong>Heuristic uncertainty:</strong> Low candidate margin or low top score indicates ambiguous lighting. Verify ground truth above.
                    </p>
                  </div>
                )}
              </div>
            </Collapsible>
          </div>
        )}

        {/* Field Note */}
        <div className="mb-4 space-y-1.5">
          <label className="block text-xs font-semibold text-stone-slate uppercase tracking-wider">
            Field Note <span className="text-stone-muted font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            placeholder="e.g. Distinct cool draft under canopy; hot glare on sidewalk"
            maxLength={120}
            className="w-full px-3.5 py-2.5 text-[16px] sm:text-xs bg-paper-50 border border-stone-border rounded-xl text-stone-charcoal placeholder:text-stone-muted/70 focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="pt-4 pb-safe border-t border-stone-border/60 flex items-center justify-between gap-3 bg-paper-100/90 backdrop-blur-xs">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            playTick();
            onRetake();
          }} 
          className="flex items-center gap-1.5 text-stone-muted hover:text-stone-charcoal"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retake</span>
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={persistenceError && onRetrySave ? onRetrySave : handleConfirm}
          disabled={modelStatus === 'analyzing' || modelStatus === 'loading_weights'}
          isLoading={isSaving}
          className="flex items-center gap-2 shadow-sm font-semibold"
        >
          <span>{persistenceError ? 'Retry saving' : 'Confirm observation'}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
