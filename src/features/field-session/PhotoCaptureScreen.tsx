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
  RefreshCw 
} from 'lucide-react';
import { resizeImage } from '@/lib/utils';
import { SampleStop } from '@/lib/sampleData';

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
  'Neighborhood sidewalk',
  'Park perimeter',
  'Commercial street',
  'Open crosswalk',
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
      // Resize to max 800px for instant local inference and light storage
      const resized = await resizeImage(file, 800, 0.85);
      setPreviewDataUrl(resized.dataUrl);
    } catch (err: any) {
      console.error('Image processing error:', err);
      setError('Could not process this image file. Please try another photo.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleConfirmPhoto = () => {
    if (!previewDataUrl) return;
    onPhotoSelected(previewDataUrl, locationLabel.trim() || undefined);
  };

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 sm:py-8 flex flex-col justify-between">
      <div>
        {/* Progress header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-forest-700 uppercase tracking-widest">
              Stop {stopNumberString} / {totalStopsString}
            </span>
            {isSampleMode && (
              <Badge variant="sample" className="text-[10px]">
                Sample Mode
              </Badge>
            )}
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: totalStops }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
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
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mb-2">
          {currentStopIndex === 0
            ? 'Find your first outdoor spot'
            : currentStopIndex === 1
            ? 'Walk further and find a second spot'
            : 'Find your final outdoor spot'}
        </h2>
        <p className="text-sm text-stone-slate mb-6">
          Photograph the walking path, street pavement, or overhead environment ahead of you.
        </p>

        {/* Sample Stop Guide Banner */}
        {isSampleMode && sampleStop && (
          <div className="mb-6 p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <div className="p-1 rounded bg-amber-200/60 shrink-0 mt-0.5">
              <Camera className="w-3.5 h-3.5 text-amber-900" />
            </div>
            <div>
              <p className="font-semibold">{sampleStop.fieldAnnotation}</p>
              <p className="text-amber-800/90 text-[11px] mt-0.5 leading-relaxed">
                {sampleStop.note}
              </p>
            </div>
          </div>
        )}

        {/* Photo Box / Preview */}
        <Card className="mb-6 p-4 sm:p-5 flex flex-col items-center justify-center text-center bg-paper-50 border-stone-border/80">
          {previewDataUrl ? (
            <div className="w-full space-y-4">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-stone-100 border border-stone-border shadow-inner">
                <img
                  src={previewDataUrl}
                  alt="Current observation capture"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewDataUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    if (cameraInputRef.current) cameraInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-forest-900/80 text-paper-50 hover:bg-forest-900 text-xs backdrop-blur-sm shadow flex items-center gap-1 px-2.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retake</span>
                </button>
              </div>

              <div className="flex justify-between items-center text-xs text-stone-muted px-1">
                <span>Photo captured and ready for analysis</span>
                <span className="font-mono text-[11px]">800px optimized</span>
              </div>
            </div>
          ) : (
            <div className="w-full py-8 sm:py-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-forest-100/70 border border-forest-600/20 text-forest-800 flex items-center justify-center mb-4">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="font-medium text-stone-charcoal text-sm mb-1">
                Take a photo of this spot
              </h3>
              <p className="text-xs text-stone-muted max-w-xs mb-6 leading-relaxed">
                Aim toward the path to capture visible shadows, tree foliage, buildings, or open sky.
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

              {/* Buttons to trigger photo capture */}
              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  size="md"
                  variant="primary"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2"
                  isLoading={isProcessingImage}
                >
                  <Camera className="w-4 h-4" />
                  <span>Take photo</span>
                </Button>

                <Button
                  type="button"
                  size="md"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                  isLoading={isProcessingImage}
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose from library</span>
                </Button>
              </div>

              {error && (
                <p className="text-xs text-red-600 mt-3 font-medium">
                  {error}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Optional Location Label */}
        <div className="mb-6 space-y-2">
          <label className="block text-xs font-semibold text-stone-slate uppercase tracking-wider">
            Location label <span className="text-stone-muted font-normal lowercase">(optional)</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-stone-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="e.g. Near home, 4th Street, Elm Grove"
              maxLength={60}
              className="w-full pl-9 pr-3 py-2 text-sm bg-paper-50 border border-stone-border rounded-lg text-stone-charcoal placeholder:text-stone-muted/70 focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PRESET_LOCATIONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLocationLabel(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  locationLabel === preset
                    ? 'bg-forest-100 text-forest-800 border-forest-600/40 font-medium'
                    : 'bg-paper-200/60 text-stone-slate border-stone-border/60 hover:bg-paper-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy badge */}
        <div className="flex items-center gap-2 text-xs text-stone-muted">
          <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
          <span>Photos are processed locally in your browser and never leave this device.</span>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="pt-6 border-t border-stone-border/60 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel walk
        </Button>

        <Button
          variant="primary"
          size="md"
          disabled={!previewDataUrl || isProcessingImage}
          onClick={handleConfirmPhoto}
          className="flex items-center gap-1.5"
        >
          <span>Analyze observation</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
