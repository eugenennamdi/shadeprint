export type ShadeCategory = 'tree_shade' | 'built_shade' | 'exposed' | 'unclear';

export interface ModelScoreDetail {
  category: ShadeCategory;
  label: string;
  score: number; // Raw relative similarity score (0.0 to 1.0)
}

export type ModelStatus = 
  | 'idle'
  | 'loading_weights'
  | 'ready'
  | 'analyzing'
  | 'success'
  | 'error'
  | 'bypassed';

export interface Observation {
  id: string;
  sessionId: string;
  createdAt: string;
  photoDataUrl: string; // Base64 data URL for display and IndexedDB storage
  thumbnailDataUrl?: string;
  locationLabel?: string;
  aiSuggestedCategory?: ShadeCategory;
  modelScoreDetails?: ModelScoreDetail[];
  finalCategory: ShadeCategory;
  modelStatus: ModelStatus;
  modelError?: string;
  userNote?: string;
}

export interface FieldSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  mode: 'field' | 'sample';
  observations: Observation[];
}

export interface ClassificationResult {
  suggestedCategory: ShadeCategory;
  scores: ModelScoreDetail[];
  uncertain: boolean; // True if top scores are very close or low similarity
  inferenceDurationMs: number;
}

export interface ModelDownloadProgress {
  status: 'progress' | 'initiate' | 'done';
  name?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}
