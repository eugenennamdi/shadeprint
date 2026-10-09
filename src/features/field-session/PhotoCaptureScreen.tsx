import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Camera, 
  Upload, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { resizeImage } from '@/lib/utils';
import { SampleStop } from '@/lib/sampleData';
import { playTick } from '@/lib/sound/soundEffects';

interface PhotoCaptureScreenProps {
  currentStopIndex: number; // 0, 1, or 2
  totalStops: number; // 3
  isSampleMode: boolean;
  sampleStop?: SampleStop;
  onPhotoSelected: (photoDataUrl: string, locationLabel?: string) => void;
  onCancel: () => void;
}

const PRESET_LOCATIONS = [
  'Near home',
  'Sidewalk',
  'Park tree',
  'Storefront',
  'Crosswalk',
];

export const PhotoCaptureScreen: React.FC<PhotoCaptureScreenProps> = ({
  currentStopIndex,
  totalStops,
  isSampleMode,
  sampleStop,
  onPhotoSelected,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(
    isSampleMode && sampleStop ? sampleStop.imagePath : null
  );
  const [locationLabel, setLocationLabel] = useState<string>(
    isSampleMode && sampleStop ? sampleStop.locationLabel : ''
  );
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopNumberString = `0${currentStopIndex + 1}`.slice(-2);
  const totalStopsString = `0${totalStops}`.slice(-2);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessingImage(true);
    try {
      const resized = await resizeImage(file, 800, 0.85);
      setPreviewDataUrl(resized.dataUrl);
      playTick();
    } catch (err: any) {
      console.error('Image processing error:', err);
      setError('Could not process this image file. Please try another photo.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleConfirmPhoto = () => {
    if (!previewDataUrl) return;
    playTick();
    onPhotoSelected(previewDataUrl, locationLabel.trim() || undefined);
  };

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 py-5 sm:py-8 flex flex-col justify-between">
      <div>
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-forest-700 uppercase tracking-widest">
              Stop {stopNumberString} / {totalStopsString}
            </span>
            {isSampleMode && (
              <Badge variant="sample" size="sm">
                Sample Mode
              </Badge>
            )}
          </div>
          <div className="flex gap-1.5" aria-label={`Stop ${currentStopIndex + 1} of ${totalStops}`}>
            {Array.from({ length: totalStops }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStopIndex
                    ? 'w-6 bg-forest-800'
                    : idx < currentStopIndex
                    ? 'w-3 bg-forest-500'
                    : 'w-3 bg-paper-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Heading */}
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mb-1.5 leading-tight">
          {currentStopIndex === 0
            ? 'Find your first outdoor spot'
            : currentStopIndex === 1
            ? 'Walk further: find a second spot'
            : 'Find your final outdoor spot'}
        </h2>
        <p className="text-xs sm:text-sm text-stone-slate mb-5 leading-relaxed">
          Photograph the path, pavement, or overhead environment ahead of you.
        </p>

        {/* Sample Stop Guide Banner */}
        {isSampleMode && sampleStop && (
          <div className="mb-5 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
            <div className="p-1.5 rounded-lg bg-amber-200/60 shrink-0 mt-0.5">
              <Camera className="w-4 h-4 text-amber-900" />
            </div>
            <div>
              <p className="font-semibold">{sampleStop.fieldAnnotation}</p>
              <p className="text-amber-800/90 text-[11px] mt-0.5 leading-relaxed">
                {sampleStop.note}
              </p>
            </div>
          </div>
        )}

        {/* Photo Box / Preview Card */}
        <Card className="mb-5 p-3.5 sm:p-5 flex flex-col items-center justify-center text-center bg-paper-50 border-stone-border/80 shadow-2xs">
          {previewDataUrl ? (
            <div className="w-full space-y-3">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 border border-stone-border/80 shadow-inner">
                <img
                  src={previewDataUrl}
                  alt="Current observation capture"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    playTick();
                    setPreviewDataUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    if (cameraInputRef.current) cameraInputRef.current.value = '';
                  }}
                  className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-forest-900/85 text-paper-50 hover:bg-forest-900 text-xs backdrop-blur-md shadow-md flex items-center gap-1.5 px-3 transition-colors min-h-[38px] select-none touch-manipulation active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="font-medium">Retake</span>
                </button>
              </div>

              <div className="flex justify-between items-center text-[11px] sm:text-xs text-stone-muted px-1">
                <span>Photo ready for local analysis</span>
                <span className="font-mono text-[10px] sm:text-[11px] bg-paper-200/70 px-1.5 py-0.5 rounded">
                  800px on-device
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full py-6 sm:py-9 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-forest-100/80 border border-forest-600/20 text-forest-800 flex items-center justify-center mb-3.5 shadow-2xs">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-stone-charcoal text-sm sm:text-base mb-1">
                Take a photo of this spot
              </h3>
              <p className="text-xs text-stone-muted max-w-xs mb-6 leading-relaxed">
                Aim toward the path to capture visible shadows, tree foliage, building overhangs, or open sky.
              </p>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                id="camera-input"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />

              {/* Primary Action Buttons */}
              <div className="flex flex-col w-full max-w-sm gap-2.5">
                <Button
                  type="button"
                  size="lg"
                  variant="primary"
                  onClick={() => {
                    playTick();
                    cameraInputRef.current?.click();
                  }}
                  className="w-full flex items-center justify-center gap-2 shadow-sm"
                  isLoading={isProcessingImage}
                >
                  <Camera className="w-4 h-4" />
                  <span>Open camera</span>
                </Button>

                <Button
                  type="button"
                  size="md"
                  variant="outline"
                  onClick={() => {
                    playTick();
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center justify-center gap-2"
                  isLoading={isProcessingImage}
                >
                  <Upload className="w-4 h-4 text-stone-muted" />
                  <span>Choose from photo library</span>
                </Button>
              </div>

              {error && (
                <div className="mt-3.5 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Optional Location Label */}
        <div className="mb-5 space-y-2">
          <label className="block text-xs font-semibold text-stone-slate uppercase tracking-wider">
            Location label <span className="text-stone-muted font-normal lowercase">(optional)</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-stone-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="e.g. Near home, 4th Street, Elm Grove"
              maxLength={60}
              className="w-full pl-10 pr-3.5 py-2.5 text-[16px] sm:text-sm bg-paper-50 border border-stone-border rounded-xl text-stone-charcoal placeholder:text-stone-muted/70 focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600 transition-colors shadow-2xs"
            />
          </div>

          {/* Location preset chips with generous touch targets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PRESET_LOCATIONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  playTick();
                  setLocationLabel(preset);
                }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all min-h-[34px] flex items-center select-none touch-manipulation active:scale-95 ${
                  locationLabel === preset
                    ? 'bg-forest-100 text-forest-800 border-forest-600/40 font-semibold shadow-2xs'
                    : 'bg-paper-200/60 text-stone-slate border-stone-border/60 hover:bg-paper-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 text-xs text-stone-muted">
          <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
          <span>Photos are processed locally in your browser and never leave this device.</span>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="pt-4 pb-safe border-t border-stone-border/60 flex items-center justify-between gap-3 bg-paper-100/90 backdrop-blur-xs">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            playTick();
            onCancel();
          }}
          className="text-stone-muted hover:text-stone-charcoal"
        >
          Cancel walk
        </Button>

        <Button
          variant="primary"
          size="md"
          disabled={!previewDataUrl || isProcessingImage}
          onClick={handleConfirmPhoto}
          className="flex items-center gap-2 shadow-sm font-semibold"
        >
          <span>Analyze observation</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
