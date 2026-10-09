import { pipeline, env } from '@huggingface/transformers';
import { 
  ShadeCategory, 
  ClassificationResult, 
  ModelScoreDetail, 
  ModelDownloadProgress,
  ModelStatus 
} from '@/types';

// Browser environment optimizations for Transformers.js
if (typeof window !== 'undefined') {
  // Allow remote models from Hugging Face Hub (default)
  env.allowLocalModels = false;
  // Use browser Cache API for model weight persistence across page reloads
  env.useBrowserCache = true;
}

export const CANDIDATE_PROMPTS = [
  {
    category: 'tree_shade' as ShadeCategory,
    label: 'a pedestrian walkway shaded by trees and green foliage',
    title: 'Tree shade',
    description: 'Shade primarily cast by trees, canopy, or vegetation',
  },
  {
    category: 'built_shade' as ShadeCategory,
    label: 'a pedestrian walkway shaded by buildings, walls, or awnings',
    title: 'Built shade',
    description: 'Shade primarily cast by architectural structures, facades, or canopies',
  },
  {
    category: 'exposed' as ShadeCategory,
    label: 'an open pedestrian walkway exposed to direct sunlight with little or no shade',
    title: 'Exposed',
    description: 'Direct sun exposure with little to no visible protective cover',
  },
];

export const CATEGORY_METADATA: Record<ShadeCategory, { name: string; badge: string; color: string; desc: string }> = {
  tree_shade: {
    name: 'Tree Shade',
    badge: 'Vegetation canopy',
    color: 'bg-forest-100 text-forest-800 border-forest-600/30',
    desc: 'Cooling canopy produced by living trees and green street foliage.',
  },
  built_shade: {
    name: 'Built Shade',
    badge: 'Architectural cover',
    color: 'bg-stone-100 text-stone-charcoal border-stone-slate/30',
    desc: 'Cover cast by building walls, awnings, arcades, and urban structures.',
  },
  exposed: {
    name: 'Exposed',
    badge: 'Direct sunlight',
    color: 'bg-sunlit-sand/30 text-sunlit-ochre border-sunlit-amber/30',
    desc: 'High sun exposure with little to no overhead or side cover.',
  },
  unclear: {
    name: 'Unclear / Mixed',
    badge: 'Mixed conditions',
    color: 'bg-paper-300 text-stone-slate border-paper-400',
    desc: 'Dappled, transitional, or mixed lighting requiring human verification.',
  },
};

export type ProgressListener = (progress: ModelDownloadProgress) => void;

class VisionClassifierService {
  private classifier: any = null;
  private isInitializing = false;
  private initPromise: Promise<any> | null = null;
  private progressListeners: Set<ProgressListener> = new Set();
  private status: ModelStatus = 'idle';
  private lastError: string | null = null;

  public onProgress(listener: ProgressListener): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  private notifyProgress(progress: ModelDownloadProgress) {
    this.progressListeners.forEach((fn) => {
      try {
        fn(progress);
      } catch (err) {
        console.error('Error in progress listener:', err);
      }
    });
  }

  public getStatus(): ModelStatus {
    return this.status;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  /**
   * Initializes the zero-shot image classification pipeline once.
   * Uses Xenova/clip-vit-base-patch32 with ONNX runtime.
   */
  public async initClassifier(): Promise<any> {
    if (this.classifier) {
      return this.classifier;
    }

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.status = 'loading_weights';
    this.lastError = null;

    this.initPromise = (async () => {
      try {
        this.notifyProgress({ status: 'initiate', name: 'Initializing CLIP Vision Model...' });

        // ponytail: Explicitly request 'fp32' precision. Transformers.js defaults WASM to 'q8',
        // but empirical benchmarking revealed q8 severely degrades on architectural shade
        // (misclassifying storefront and colonnade shadows as direct sun).
        // Tradeoff ceiling: ~606 MB initial download payload vs 154 MB for q8.
        const pipelineInstance = await pipeline(
          'zero-shot-image-classification',
          'Xenova/clip-vit-base-patch32',
          {
            dtype: 'fp32',
            progress_callback: (p: any) => {
              this.notifyProgress({
                status: p.status,
                name: p.name,
                file: p.file,
                progress: p.progress,
                loaded: p.loaded,
                total: p.total,
              });
            },
          }
        );

        this.classifier = pipelineInstance;
        this.status = 'ready';
        this.isInitializing = false;
        return this.classifier;
      } catch (err: any) {
        this.isInitializing = false;
        this.status = 'error';
        this.lastError = err?.message || 'Failed to load open-weight model';
        console.error('CLIP Vision Classifier init failed:', err);
        throw err;
      }
    })();

    return this.initPromise;
  }

  /**
   * Performs zero-shot classification on an image (Data URL, Blob, or URL)
   */
  public async classifyImage(imageInput: string | Blob): Promise<ClassificationResult> {
    const startTime = performance.now();
    this.status = 'analyzing';

    const classifier = await this.initClassifier();

    const candidateLabels = CANDIDATE_PROMPTS.map((p) => p.label);

    const rawResults = await classifier(imageInput, candidateLabels);

    const inferenceDurationMs = Math.round(performance.now() - startTime);
    this.status = 'success';

    // Map raw results to typed domain scores
    const scores: ModelScoreDetail[] = (rawResults as Array<{ label: string; score: number }>).map((item) => {
      const promptMatch = CANDIDATE_PROMPTS.find((p) => p.label === item.label);
      const category: ShadeCategory = promptMatch ? promptMatch.category : 'unclear';
      return {
        category,
        label: item.label,
        score: Number(item.score.toFixed(4)),
      };
    });

    // Sort descending by similarity score
    scores.sort((a, b) => b.score - a.score);

    const top = scores[0];
    const second = scores[1];

    // ponytail: CLIP scores represent softmax-normalized cosine similarities across the 3 candidate prompts.
    // They are relative contrastive values summing to 1.0, NOT calibrated physical probabilities or coverage percentages.
    // Heuristic ceiling: For 3 classes, random chance is ~33.3%. A top score < 0.42 indicates weak discriminative power,
    // and a margin < 0.10 indicates a near-tie between candidates. Both trigger an uncertainty flag prompting human verification.
    // Upgrade path: Empirical calibration via temperature scaling on a larger labeled pedestrian dataset.
    const uncertain = !top || top.score < 0.42 || (second && top.score - second.score < 0.10);

    return {
      suggestedCategory: top ? top.category : 'unclear',
      scores,
      uncertain,
      inferenceDurationMs,
    };
  }
}

export const visionClassifier = new VisionClassifierService();
