import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
}

export const ObservationReviewScreen: React.FC<ObservationReviewScreenProps> = ({
  currentStopIndex,
  totalStops,
  photoDataUrl,
  locationLabel,
  onConfirmObservation,
  onRetake,
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
          // Default selection for manual entry
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
    onConfirmObservation(
      selectedCategory,
      aiSuggestedCategory,
      scores.length > 0 ? scores : undefined,
      userNote.trim() || undefined
    );
  };

  const isUserOverriding = aiSuggestedCategory && selectedCategory !== aiSuggestedCategory;

  const getCategoryIcon = (category: ShadeCategory) => {
    switch (category) {
      case 'tree_shade':
        return <Trees className="w-4 h-4 text-forest-700" />;
      case 'built_shade':
        return <Building2 className="w-4 h-4 text-stone-slate" />;
      case 'exposed':
        return <SunMedium className="w-4 h-4 text-sunlit-ochre" />;
      case 'unclear':
        return <HelpCircle className="w-4 h-4 text-stone-muted" />;
    }
  };

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 sm:py-8 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs font-bold text-forest-700 uppercase tracking-widest">
            Observation {stopNumberString} / 0{totalStops}
          </span>
          {locationLabel && (
            <span className="text-xs text-stone-muted truncate max-w-[200px]">
              {locationLabel}
            </span>
          )}
        </div>

        <h2 className="font-serif text-2xl font-bold text-forest-900 mb-1">
          Review your observation
        </h2>
        <p className="text-xs text-stone-slate mb-5">
          Verify what the open-weight model sees against what you actually experienced outside.
        </p>

        {/* Captured Photo Card */}
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-stone-100 border border-stone-border shadow-sm mb-5">
          <img
            src={photoDataUrl}
            alt="Captured field observation"
            className="w-full h-full object-cover"
          />

          {/* Model status overlay / banner */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            {modelStatus === 'loading_weights' && (
              <div className="px-3 py-1.5 rounded-lg bg-forest-900/90 text-paper-50 text-xs backdrop-blur-md flex items-center gap-2 shadow">
                <Download className="w-3.5 h-3.5 animate-bounce" />
                <span>
                  Downloading model: {Math.round(downloadProgress?.progress || 0)}%
                </span>
              </div>
            )}

            {modelStatus === 'analyzing' && (
              <div className="px-3 py-1.5 rounded-lg bg-forest-900/90 text-paper-50 text-xs backdrop-blur-md flex items-center gap-2 shadow">
                <Cpu className="w-3.5 h-3.5 animate-pulse text-canopy-leaf" />
                <span>Running local CLIP inference...</span>
              </div>
            )}

            {modelStatus === 'success' && aiSuggestedCategory && (
              <div className="px-2.5 py-1 rounded-md bg-paper-50/95 text-forest-900 text-xs backdrop-blur-md font-medium border border-stone-border/80 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-forest-600" />
                <span>AI suggested: {CATEGORY_METADATA[aiSuggestedCategory].name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Model Results / Technical Honesty Card */}
        {modelStatus === 'success' && (
          <div className="mb-6 p-4 rounded-xl bg-paper-50 border border-stone-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-forest-700" />
                  <span className="text-xs font-semibold text-forest-900">
                    Relative Candidate Match
                  </span>
                </div>
                <p className="text-[10px] text-stone-muted mt-0.5">
                  Contrastive scores normalized across candidate prompts. Not an absolute physical probability.
                </p>
              </div>
              {inferenceDurationMs !== null && (
                <span className="text-[11px] font-mono text-stone-muted shrink-0">
                  {inferenceDurationMs}ms
                </span>
              )}
            </div>

            {/* Relative CLIP Score Bars */}
            <div className="space-y-2 pt-1">
              {scores.map((s) => {
                const percent = Math.round(s.score * 100);
                const isTop = s.category === aiSuggestedCategory;
                return (
                  <div key={s.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`flex items-center gap-1.5 ${isTop ? 'font-semibold text-forest-900' : 'text-stone-slate'}`}>
                        {getCategoryIcon(s.category)}
                        <span>{CATEGORY_METADATA[s.category]?.name || s.category}</span>
                      </span>
                      <span className="font-mono text-[11px] text-stone-muted font-medium">
                        Relative match: {percent}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-paper-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTop ? 'bg-forest-700' : 'bg-stone-border'
                        }`}
                        style={{ width: `${Math.max(percent, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Uncertainty notice if applicable */}
            {isUncertain && (
              <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Heuristic uncertainty:</strong> Low margin between candidates or low overall score. The model makes a suggestion, not an authoritative determination—verify what you actually observed below.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Model Loading State */}
        {modelStatus === 'loading_weights' && (
          <div className="mb-6 p-4 rounded-xl bg-forest-50/70 border border-forest-600/20 text-xs text-stone-slate space-y-2">
            <div className="flex items-center justify-between font-medium text-forest-900">
              <span className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-forest-700" />
                <span>Downloading open weights ({downloadProgress?.file || 'model.onnx'})</span>
              </span>
              <span className="font-mono">{Math.round(downloadProgress?.progress || 0)}%</span>
            </div>
            <div className="h-2 w-full bg-paper-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-700 transition-all duration-300"
                style={{ width: `${downloadProgress?.progress || 0}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-muted">
              Weights are cached in your browser. Future walks analyze instantly offline.
            </p>
          </div>
        )}

        {/* Model Error State */}
        {modelStatus === 'error' && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Local AI Inference Unavailable</p>
              <p className="text-[11px] mt-0.5 leading-relaxed text-red-800">
                {errorMessage}
              </p>
              <p className="text-[11px] mt-1 font-medium">
                You can still classify this observation manually below.
              </p>
            </div>
          </div>
        )}

        {/* Human Confirmation Section */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-stone-slate uppercase tracking-wider">
              Confirm or correct category
            </label>
            {isUserOverriding && (
              <Badge variant="warning" className="text-[10px]">
                Human correction active
              </Badge>
            )}
          </div>

          {/* Category selection grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(['tree_shade', 'built_shade', 'exposed', 'unclear'] as ShadeCategory[]).map((cat) => {
              const meta = CATEGORY_METADATA[cat];
              const isSelected = selectedCategory === cat;
              const isAiPick = aiSuggestedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between ${
                    isSelected
                      ? 'bg-paper-50 border-forest-800 shadow-sm ring-1 ring-forest-800'
                      : 'bg-paper-50/60 border-stone-border/80 hover:bg-paper-50 hover:border-stone-border'
                  }`}
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-forest-900">
                      {getCategoryIcon(cat)}
                      <span>{meta.name}</span>
                      {isAiPick && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-forest-100 text-forest-800 border border-forest-600/30 uppercase">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-muted leading-tight">
                      {meta.desc}
                    </p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'border-forest-800 bg-forest-800 text-paper-50'
                        : 'border-stone-border bg-paper-200'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional field note */}
        <div className="mb-6 space-y-1.5">
          <label className="block text-xs font-semibold text-stone-slate uppercase tracking-wider">
            Field Note <span className="text-stone-muted font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            placeholder="e.g. Noticeable temperature drop under canopy; stark asphalt heat"
            maxLength={120}
            className="w-full px-3 py-2 text-xs bg-paper-50 border border-stone-border rounded-lg text-stone-charcoal placeholder:text-stone-muted/70 focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-6 border-t border-stone-border/60 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onRetake} className="flex items-center gap-1">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retake photo</span>
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={handleConfirm}
          disabled={modelStatus === 'analyzing'}
          className="flex items-center gap-1.5 shadow-sm"
        >
          <span>Confirm observation</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
