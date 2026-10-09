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
          ? ` [User corrected from AI: ${CATEGORY_METADATA[o.aiSuggestedCategory]?.name}]`
          : '';
        return `Stop 0${idx + 1}${loc}: ${catName}${aiOverride}${note}`;
      }),
      ``,
      `Classified with open-weight Xenova/clip-vit-base-patch32 running locally in-browser.`,
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
    window.print();
  };

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
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
      {/* Action Toolbar (Hidden during print) */}
      <div className="no-print flex items-center justify-between gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={onStartNewWalk} className="flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New walk</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopySummary} className="flex items-center gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5 text-forest-700" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy summary'}</span>
          </Button>

          <Button variant="primary" size="sm" onClick={handlePrint} className="flex items-center gap-1.5 shadow-sm">
            <Printer className="w-3.5 h-3.5" />
            <span>Print report</span>
          </Button>
        </div>
      </div>

      {/* Main Printable Field Report Container */}
      <div className="bg-paper-50 rounded-2xl border border-stone-border/80 p-6 sm:p-8 shadow-sm">
        {/* Report Header */}
        <div className="border-b border-stone-border/70 pb-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-forest-700 uppercase tracking-widest">
                Field Observation Report
              </span>
              <Badge variant={isSample ? 'sample' : 'success'}>
                {isSample ? 'Sample Demonstration Mode' : 'Real Field Session'}
              </Badge>
            </div>
            <span className="text-xs text-stone-muted font-mono">
              {formatFieldDate(session.startedAt)}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest-900 tracking-tight mb-2">
            Your neighborhood, seen differently.
          </h1>
          <p className="text-sm text-stone-slate">
            Three walking locations observed, classified via on-device open-weight vision AI, and confirmed through human ground-truth observation.
          </p>
        </div>

        {/* Honest Synthesis / Data Takeaway Card */}
        <div className="p-5 rounded-xl bg-forest-50/70 border border-forest-600/20 mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-forest-800">
              Observation Synthesis
            </span>
            <span className="text-xs font-mono font-bold text-forest-900">
              {totalShaded} of {observations.length} stops shaded
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-paper-50 border border-stone-border/60">
              <span className="text-xs text-stone-muted block">Tree Canopy</span>
              <span className="font-serif text-2xl font-bold text-forest-900">{treeShadeCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-paper-50 border border-stone-border/60">
              <span className="text-xs text-stone-muted block">Built Shade</span>
              <span className="font-serif text-2xl font-bold text-forest-900">{builtShadeCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-paper-50 border border-stone-border/60">
              <span className="text-xs text-stone-muted block">Sun Exposed</span>
              <span className="font-serif text-2xl font-bold text-forest-900">{exposedCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-paper-50 border border-stone-border/60">
              <span className="text-xs text-stone-muted block">Mixed / Unclear</span>
              <span className="font-serif text-2xl font-bold text-forest-900">{unclearCount}</span>
            </div>
          </div>

          {/* Honest Qualitative Observation Takeaway */}
          <p className="text-xs text-stone-slate leading-relaxed pt-1">
            {totalShaded === 3 ? (
              <span>Your walk stayed almost entirely sheltered from direct overhead sun, benefitting from consistent tree canopy or building overhangs along pedestrian routes.</span>
            ) : totalShaded === 2 ? (
              <span>Your walk featured an informative contrast: 2 locations offered meaningful visible shade (from vegetation or structures), while 1 location left pedestrians exposed to direct solar heat.</span>
            ) : totalShaded === 1 ? (
              <span>The documented route was predominantly open and sun-exposed, with only 1 documented location providing protective overhead or architectural shelter.</span>
            ) : (
              <span>All 3 documented locations were exposed to direct sunlight with little to no visible overhead canopy or building shade.</span>
            )}
          </p>
        </div>

        {/* The Three Observation Cards */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-muted">
            Documented Locations ({observations.length})
          </h2>

          <div className="grid grid-cols-1 gap-6">
            {observations.map((obs, idx) => {
              const meta = CATEGORY_METADATA[obs.finalCategory];
              const aiMeta = obs.aiSuggestedCategory ? CATEGORY_METADATA[obs.aiSuggestedCategory] : null;
              const wasCorrected = obs.aiSuggestedCategory && obs.finalCategory !== obs.aiSuggestedCategory;

              return (
                <div
                  key={obs.id}
                  className="p-4 sm:p-5 rounded-xl bg-paper-50 border border-stone-border/80 flex flex-col sm:flex-row gap-5 items-start"
                >
                  {/* Photo thumbnail */}
                  <div className="w-full sm:w-48 aspect-[4/3] rounded-lg overflow-hidden bg-stone-100 border border-stone-border shrink-0 shadow-inner">
                    <img
                      src={obs.photoDataUrl}
                      alt={`Observation 0${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Observation details */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-forest-700 uppercase tracking-widest">
                        Stop 0{idx + 1}
                      </span>
                      {obs.locationLabel && (
                        <span className="text-xs font-medium text-stone-slate">
                          {obs.locationLabel}
                        </span>
                      )}
                    </div>

                    {/* Final Confirmed Category Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-paper-200 border border-stone-border">
                        {getCategoryIcon(obs.finalCategory)}
                        <span>{meta.name}</span>
                      </div>

                      {wasCorrected && aiMeta && (
                        <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Human correction (AI suggested: {aiMeta.name})
                        </span>
                      )}
                    </div>

                    {/* User Field Note */}
                    {obs.userNote && (
                      <p className="text-xs italic text-stone-slate bg-paper-100 p-2.5 rounded-md border border-stone-border/50">
                        "{obs.userNote}"
                      </p>
                    )}

                    {/* Open-Weight CLIP Model Breakdown */}
                    {obs.modelScoreDetails && obs.modelScoreDetails.length > 0 && (
                      <div className="pt-2 text-xs space-y-1.5 border-t border-stone-border/40">
                        <div className="flex items-center gap-1 text-[11px] text-stone-muted">
                          <Cpu className="w-3 h-3 text-forest-700" />
                          <span>CLIP model relative similarity:</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {obs.modelScoreDetails.map((scoreItem) => (
                            <div key={scoreItem.category} className="text-[11px]">
                              <span className="text-stone-muted block truncate">
                                {CATEGORY_METADATA[scoreItem.category]?.name || scoreItem.category}
                              </span>
                              <span className="font-mono font-medium text-forest-900">
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
        <div className="p-4 rounded-xl bg-paper-200/60 border border-stone-border text-xs text-stone-muted space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-stone-charcoal">
            <ShieldCheck className="w-4 h-4 text-forest-700" />
            <span>Scientific & Privacy Notes</span>
          </div>
          <p className="leading-relaxed">
            This field report reflects visible physical shade patterns captured in daylight photographs. Shade characteristics do not directly quantify air temperature, radiant surface heat, or UV index. All photographs and inference calculations occurred locally on your device without transmitting image data to remote servers.
          </p>
        </div>
      </div>

      {/* Delete / Clear Action */}
      <div className="no-print mt-6 flex justify-between items-center text-xs text-stone-muted">
        <span>Session ID: <code className="font-mono text-[10px]">{session.id.slice(0, 8)}</code></span>

        {showConfirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-red-700 font-medium">Delete this session?</span>
            <button
              onClick={() => onDeleteSession(session.id)}
              className="text-red-700 hover:text-red-900 font-semibold underline px-1"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="hover:text-stone-charcoal px-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="hover:text-red-700 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete session</span>
          </button>
        )}
      </div>
    </div>
  );
};
