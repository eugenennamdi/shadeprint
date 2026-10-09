import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { 
  Cpu, 
  ShieldCheck, 
  Trash2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  isSoundEnabled, 
  setSoundEnabled, 
  playTick 
} from '@/lib/sound/soundEffects';

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
  const [soundActive, setSoundActive] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSoundActive(isSoundEnabled());
      setConfirmClear(false);
    }
  }, [isOpen]);

  const handleToggleSound = (enabled: boolean) => {
    setSoundActive(enabled);
    setSoundEnabled(enabled);
    if (enabled) {
      playTick();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 flex-wrap">
          <span>About Shadeprint</span>
          <Badge variant="success" size="sm">
            v1.0 Open-Source
          </Badge>
        </div>
      }
      description="An open-weight AI field notebook for observing neighborhood shade."
    >
      {/* Product Vision */}
      <div className="text-xs sm:text-sm text-stone-slate space-y-2.5 leading-relaxed">
        <p>
          In hot urban environments, the difference between a tree-shaded canopy street and an exposed concrete walkway meaningfully alters walking comfort. Yet digital technology usually pulls our attention toward screens.
        </p>
        <p className="font-medium text-forest-900">
          Shadeprint does the opposite: the screen is the shortest part of the walk. Document three outdoor places, pocket your phone, and discover the shade hiding in your neighborhood.
        </p>
      </div>

      {/* Sound Settings Card */}
      <div className="p-4 rounded-xl bg-paper-100 border border-stone-border/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-forest-100 text-forest-800 shrink-0">
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-muted" />}
          </div>
          <div>
            <span className="text-xs sm:text-sm font-semibold text-forest-900 block">
              Acoustic Feedback
            </span>
            <span className="text-[11px] sm:text-xs text-stone-muted leading-tight block">
              Subtle wooden ticks and confirmation chimes while walking.
            </span>
          </div>
        </div>
        <Switch
          checked={soundActive}
          onCheckedChange={handleToggleSound}
          aria-label="Toggle acoustic feedback"
        />
      </div>

      {/* AI Architecture & Open Weights */}
      <div className="p-4 rounded-xl bg-forest-50/70 border border-forest-600/20 text-xs sm:text-sm space-y-2.5">
        <div className="flex items-center gap-2 font-semibold text-forest-900">
          <Cpu className="w-4 h-4 text-forest-700 shrink-0" />
          <span>Open-Weight Vision Pipeline</span>
        </div>
        <p className="text-stone-slate leading-relaxed text-xs">
          Zero-shot vision inference runs client-side via Hugging Face Transformers.js and ONNX Web Runtime using unquantized FP32 weights:
        </p>
        <div className="p-2.5 bg-paper-50 rounded-lg border border-stone-border/70 font-mono text-[11px] text-forest-900 break-all sm:break-normal">
          Xenova/clip-vit-base-patch32 (FP32)
        </div>
        <p className="text-stone-muted text-[11px] leading-relaxed">
          Initial launch downloads ~606 MB of open ONNX weights stored in your browser's Cache API. No proprietary vision API, no tracking, and no external photo uploads.
        </p>
      </div>

      {/* Privacy Guarantee */}
      <div className="p-4 rounded-xl bg-paper-200/50 border border-stone-border text-xs sm:text-sm space-y-2">
        <div className="flex items-center gap-2 font-semibold text-stone-charcoal">
          <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
          <span>Private by Design</span>
        </div>
        <p className="text-stone-muted text-xs leading-relaxed">
          All photographs and observation logs remain strictly on your device. Sessions are stored in browser IndexedDB and are never sent to a server.
        </p>
      </div>

      {/* Clear Storage */}
      <div className="pt-3 border-t border-stone-border/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <span className="text-stone-muted">Erase all recorded field sessions:</span>
        {confirmClear ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                onClearAllData();
                onClose();
              }}
            >
              Confirm erase
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmClear(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmClear(true)}
            className="text-stone-muted hover:text-red-700 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Clear data</span>
          </Button>
        )}
      </div>
    </Dialog>
  );
};
