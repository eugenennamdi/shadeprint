import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  X, 
  Cpu, 
  ShieldCheck, 
  Trash2
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onClearAllData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <Card className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 bg-paper-50 shadow-2xl border-stone-border">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-muted hover:text-stone-charcoal hover:bg-paper-200 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-5">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-serif text-2xl font-bold text-forest-900">
                Shadeprint
              </span>
              <Badge variant="success" className="text-[10px]">
                v1.0 Open-Source
              </Badge>
            </div>
            <p className="text-xs text-stone-muted">
              Built for Hacktoberfest 2026: Touch Grass Challenge
            </p>
          </div>

          {/* Vision */}
          <div className="text-xs text-stone-slate space-y-2 leading-relaxed">
            <p>
              In hot urban environments, the difference between a shaded canopy street and an exposed concrete walkway can meaningfully affect walking comfort. Yet digital technology usually pulls our attention toward screens.
            </p>
            <p>
              <strong>Shadeprint does the opposite:</strong> it invites you to take a brief neighborhood walk, document three everyday pedestrian spots, and use locally running open-weight AI to discover differences in visible shade.
            </p>
          </div>

          {/* AI Architecture & Open Weights */}
          <div className="p-3.5 rounded-xl bg-forest-50/70 border border-forest-600/20 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-forest-900">
              <Cpu className="w-4 h-4 text-forest-700" />
              <span>Open-Weight AI Pipeline</span>
            </div>
            <p className="text-stone-slate leading-relaxed">
              Inference runs client-side via Hugging Face Transformers.js and ONNX Web Runtime using the open-weight model:
            </p>
            <div className="p-2 bg-paper-50 rounded border border-stone-border/70 font-mono text-[11px] text-forest-800">
              Xenova/clip-vit-base-patch32
            </div>
            <p className="text-stone-muted text-[11px]">
              Zero server API keys, zero cloud compute costs, and complete offline capability once weights are cached by your browser.
            </p>
          </div>

          {/* Privacy Guarantee */}
          <div className="p-3.5 rounded-xl bg-paper-200/50 border border-stone-border text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-stone-charcoal">
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              <span>Privacy by Design</span>
            </div>
            <p className="text-stone-muted leading-relaxed">
              No photos or location data leave this browser. Observations and sessions are stored strictly on-device in your browser's IndexedDB.
            </p>
          </div>

          {/* Clear Storage */}
          <div className="pt-2 border-t border-stone-border flex items-center justify-between text-xs">
            <span className="text-stone-muted">Erase all saved walks on this device:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete all saved walks and observation photos?')) {
                  onClearAllData();
                  onClose();
                }
              }}
              className="text-red-700 hover:text-red-800 border-red-300 hover:bg-red-50 text-xs py-1 h-7"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              <span>Clear local data</span>
            </Button>
          </div>

          <div className="pt-2 text-center">
            <Button variant="primary" size="md" onClick={onClose} className="w-full">
              Back to notebook
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
