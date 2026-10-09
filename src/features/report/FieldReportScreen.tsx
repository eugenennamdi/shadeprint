import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FieldSession, ShadeCategory } from '@/types';
import { CATEGORY_METADATA } from '@/lib/ai/classifier';
import { formatFieldDate } from '@/lib/utils';
import { 
  Printer, 
  Copy, 
  Check, 
  RotateCcw, 
  Trees, 
  Building2, 
  SunMedium, 
  HelpCircle,
  Trash2,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { playTick } from '@/lib/sound/soundEffects';

interface FieldReportScreenProps {
  session: FieldSession;
  onStartNewWalk: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export const FieldReportScreen: React.FC<FieldReportScreenProps> = ({
  session,
  onStartNewWalk,
  onDeleteSession,
}) => {
  const [copied, setCopied] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const observations = session.observations;
  const isSample = session.mode === 'sample';

  // Calculate honest observation counts
  const treeShadeCount = observations.filter((o) => o.finalCategory === 'tree_shade').length;
  const builtShadeCount = observations.filter((o) => o.finalCategory === 'built_shade').length;
  const exposedCount = observations.filter((o) => o.finalCategory === 'exposed').length;
  const unclearCount = observations.filter((o) => o.finalCategory === 'unclear').length;
  const totalShaded = treeShadeCount + builtShadeCount;

  // Copy plain text summary to clipboard
  const handleCopySummary = async () => {
    playTick();
    const textLines = [
      `SHADEPRINT FIELD REPORT`,
      `Date: ${formatFieldDate(session.startedAt)}`,
      `Type: ${isSample ? 'Sample Demonstration Walk' : 'Neighborhood Field Walk'}`,
      `Stops Documented: ${observations.length}`,
      ``,
      `SUMMARY:`,
      `- Shaded stops: ${totalShaded} of ${observations.length} (${treeShadeCount} tree canopy, ${builtShadeCount} built structure)`,
      `- Exposed stops: ${exposedCount} of ${observations.length}`,
      unclearCount > 0 ? `- Mixed/unclear stops: ${unclearCount} of ${observations.length}` : '',
      ``,
      `OBSERVATIONS:`,
      ...observations.map((o, idx) => {
        const catName = CATEGORY_METADATA[o.finalCategory]?.name || o.finalCategory;
        const loc = o.locationLabel ? ` (${o.locationLabel})` : '';
        const note = o.userNote ? ` — "${o.userNote}"` : '';
        const aiOverride = o.aiSuggestedCategory && o.aiSuggestedCategory !== o.finalCategory
          ? ` [User ground truth override: was suggested as ${CATEGORY_METADATA[o.aiSuggestedCategory]?.name}]`
          : '';
        return `Stop 0${idx + 1}${loc}: ${catName}${aiOverride}${note}`;
      }),
      ``,
      `Classified with open-weight Xenova/clip-vit-base-patch32 running locally on-device.`,
      `Discover your neighborhood shade with Shadeprint.`,
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(textLines);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handlePrint = () => {
    playTick();
    window.print();
  };

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
    <div className="flex-1 max-w-3xl mx-auto w-full px-3.5 sm:px-6 py-6 sm:py-10">
      {/* Action Toolbar (Hidden during print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2.5 mb-5 sm:mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            playTick();
            onStartNewWalk();
          }} 
          className="flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New walk</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleCopySummary} 
            className="flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-forest-700" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy log'}</span>
          </Button>

          <Button 
            variant="primary" 
            size="sm" 
            onClick={handlePrint} 
            className="flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print report</span>
          </Button>
        </div>
      </div>

      {/* Main Printable Field Report Container */}
      <div className="bg-paper-50 rounded-2xl border border-stone-border/80 p-4 sm:p-8 shadow-xs">
        {/* Report Header */}
        <div className="border-b border-stone-border/70 pb-5 mb-5 sm:mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-forest-700 uppercase tracking-widest">
                Field Observation Report
              </span>
              <Badge variant={isSample ? 'sample' : 'success'} size="sm">
                {isSample ? 'Sample Mode' : 'Field Walk'}
              </Badge>
            </div>
            <span className="text-xs text-stone-muted font-mono">
              {formatFieldDate(session.startedAt)}
            </span>
          </div>

          <h1 className="font-serif text-2xl xs:text-3xl sm:text-4xl font-bold text-forest-900 tracking-tight mb-2 leading-tight">
            Your neighborhood, seen differently.
          </h1>
          <p className="text-xs sm:text-sm text-stone-slate leading-relaxed">
            Three walking locations observed, classified via on-device open-weight vision AI, and verified through human ground-truth observation.
          </p>

          {isSample && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900 shadow-2xs">
              <strong>Evaluation Notice:</strong> This report was generated using bundled photographic reference fixtures for desk review. It demonstrates actual on-device CLIP inference, but was not taken outdoors.
            </div>
          )}
        </div>

        {/* Observation Synthesis Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-forest-50/70 border border-forest-600/20 mb-6 sm:mb-8 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-forest-800">
              Observation Synthesis
            </span>
            <span className="text-xs font-mono font-bold text-forest-900">
              {totalShaded} of {observations.length} stops shaded
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-1">
            <div className="p-2.5 sm:p-3 rounded-xl bg-paper-50 border border-stone-border/70">
              <span className="text-[11px] sm:text-xs text-stone-muted block truncate">Tree Canopy</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-forest-900">{treeShadeCount}</span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-paper-50 border border-stone-border/70">
              <span className="text-[11px] sm:text-xs text-stone-muted block truncate">Built Shade</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-forest-900">{builtShadeCount}</span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-paper-50 border border-stone-border/70">
              <span className="text-[11px] sm:text-xs text-stone-muted block truncate">Sun Exposed</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-forest-900">{exposedCount}</span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-paper-50 border border-stone-border/70">
              <span className="text-[11px] sm:text-xs text-stone-muted block truncate">Mixed / Unclear</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-forest-900">{unclearCount}</span>
            </div>
          </div>

          {/* Qualitative Synthesis Statement */}
          <p className="text-xs text-stone-slate leading-relaxed pt-1">
            {totalShaded === 3 ? (
              <span>Your walk stayed consistently sheltered from direct overhead sun, benefitting from continuous tree canopy or building overhangs along pedestrian walkways.</span>
            ) : totalShaded === 2 ? (
              <span>Your walk featured an informative contrast: 2 locations offered meaningful visible shade (from vegetation or structures), while {exposedCount > 0 ? '1 location left pedestrians in direct sun' : '1 location featured transitional lighting'}.</span>
            ) : totalShaded === 1 ? (
              <span>The documented route was predominantly open, with 1 location providing protective overhead canopy and {exposedCount} {exposedCount === 1 ? 'spot' : 'spots'} exposed to bright midday sun.</span>
            ) : (
              <span>The documented route featured no overhead canopy or structural cover across all three stops.</span>
            )}
          </p>
        </div>

        {/* The Three Observation Entries */}
        <div className="space-y-5 sm:space-y-6 mb-6 sm:mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-muted">
            Documented Places ({observations.length})
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            {observations.map((obs, idx) => {
              const meta = CATEGORY_METADATA[obs.finalCategory];
              const aiMeta = obs.aiSuggestedCategory ? CATEGORY_METADATA[obs.aiSuggestedCategory] : null;
              const wasCorrected = obs.aiSuggestedCategory && obs.finalCategory !== obs.aiSuggestedCategory;

              return (
                <div
                  key={obs.id}
                  className="p-3.5 sm:p-5 rounded-2xl bg-paper-50 border border-stone-border/80 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start shadow-2xs"
                >
                  {/* Photo Thumbnail */}
                  <div className="w-full sm:w-44 aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 border border-stone-border/80 shrink-0 shadow-inner">
                    <img
                      src={obs.photoDataUrl}
                      alt={`Observation 0${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Entry Details */}
                  <div className="flex-1 space-y-2 w-full min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-forest-700 uppercase tracking-widest">
                        Stop 0{idx + 1}
                      </span>
                      {obs.locationLabel && (
                        <span className="text-xs font-medium text-stone-slate truncate max-w-[180px]">
                          {obs.locationLabel}
                        </span>
                      )}
                    </div>

                    {/* Final Confirmed Category Badge */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-paper-200 border border-stone-border/80">
                        {getCategoryIcon(obs.finalCategory)}
                        <span>{meta.name}</span>
                      </div>

                      {wasCorrected && aiMeta && (
                        <span className="text-[11px] text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/90 font-medium">
                          Human ground truth (AI: {aiMeta.name})
                        </span>
                      )}
                    </div>

                    {/* User Field Note */}
                    {obs.userNote && (
                      <p className="text-xs italic text-stone-slate bg-paper-100 p-2.5 rounded-xl border border-stone-border/50">
                        "{obs.userNote}"
                      </p>
                    )}

                    {/* Open-Weight CLIP Model Breakdown */}
                    {obs.modelScoreDetails && obs.modelScoreDetails.length > 0 && (
                      <div className="pt-2 text-xs space-y-1.5 border-t border-stone-border/40">
                        <div className="flex items-center gap-1 text-[11px] text-stone-muted">
                          <Cpu className="w-3 h-3 text-forest-700" />
                          <span>Relative candidate prompt match:</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                          {obs.modelScoreDetails.map((scoreItem) => (
                            <div key={scoreItem.category} className="text-[11px] min-w-0">
                              <span className="text-stone-muted block truncate text-[10px] sm:text-[11px]">
                                {CATEGORY_METADATA[scoreItem.category]?.name || scoreItem.category}
                              </span>
                              <span className="font-mono font-medium text-forest-900 text-xs">
                                {Math.round(scoreItem.score * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technical & Ethical Integrity Statement */}
        <div className="p-4 rounded-xl bg-paper-200/50 border border-stone-border/80 text-xs text-stone-muted space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-stone-charcoal">
            <ShieldCheck className="w-4 h-4 text-forest-700" />
            <span>Scientific & Privacy Notes</span>
          </div>
          <p className="leading-relaxed text-[11px] sm:text-xs">
            This field report reflects visible physical shade patterns captured in daylight photographs. Shade conditions do not directly quantify air temperature, radiant surface heat, or UV index. All photographs and inference calculations occurred locally on your device without transmitting image data to remote servers.
          </p>
        </div>
      </div>

      {/* Footer / Delete Session Action */}
      <div className="no-print mt-6 flex justify-between items-center text-xs text-stone-muted">
        <span>Session: <code className="font-mono text-[10px]">{session.id.slice(0, 10)}</code></span>

        {showConfirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-red-700 font-medium">Delete session?</span>
            <button
              onClick={() => {
                playTick();
                onDeleteSession(session.id);
              }}
              className="text-red-700 hover:text-red-900 font-semibold underline px-1 min-h-[36px]"
            >
              Yes, delete
            </button>
            <button
              onClick={() => {
                playTick();
                setShowConfirmDelete(false);
              }}
              className="hover:text-stone-charcoal px-1 min-h-[36px]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              playTick();
              setShowConfirmDelete(true);
            }}
            className="hover:text-red-700 transition-colors flex items-center gap-1 min-h-[36px] px-2 py-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete session</span>
          </button>
        )}
      </div>
    </div>
  );
};
