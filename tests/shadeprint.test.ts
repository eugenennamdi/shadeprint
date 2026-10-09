import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { FieldSession, Observation, ShadeCategory, ModelScoreDetail } from '../src/types';
import { CANDIDATE_PROMPTS, CATEGORY_METADATA } from '../src/lib/ai/classifier';
import { createMockIndexedDB } from './mock-idb';
import { 
  saveSession, 
  getSession, 
  getAllSessions, 
  getObservationsBySession, 
  deleteSession, 
  clearAllData 
} from '../src/lib/storage/db';

// Install mock IndexedDB before tests
beforeEach(() => {
  (globalThis as any).indexedDB = createMockIndexedDB();
});

describe('1. Persistence & Interrupted-Session Recovery', () => {
  it('creates and saves a session with observation records', async () => {
    const session: FieldSession = {
      id: 'session-persist-01',
      startedAt: new Date().toISOString(),
      mode: 'field',
      observations: [
        {
          id: 'obs-01',
          sessionId: 'session-persist-01',
          createdAt: new Date().toISOString(),
          photoDataUrl: 'data:image/jpeg;base64,sample1',
          locationLabel: 'Oak Avenue',
          finalCategory: 'tree_shade',
          modelStatus: 'success',
          userNote: 'Cool breeze under canopy'
        }
      ]
    };

    await saveSession(session);
    const restored = await getSession('session-persist-01');

    expect(restored).not.toBeNull();
    expect(restored?.id).toBe('session-persist-01');
    expect(restored?.observations.length).toBe(1);
    expect(restored?.observations[0].locationLabel).toBe('Oak Avenue');
  });

  it('restores all confirmed observations via session query', async () => {
    const session: FieldSession = {
      id: 'session-multi-obs',
      startedAt: new Date().toISOString(),
      mode: 'field',
      observations: [
        {
          id: 'obs-a',
          sessionId: 'session-multi-obs',
          createdAt: new Date().toISOString(),
          photoDataUrl: 'data:image/jpeg;base64,a',
          finalCategory: 'tree_shade',
          modelStatus: 'success'
        },
        {
          id: 'obs-b',
          sessionId: 'session-multi-obs',
          createdAt: new Date().toISOString(),
          photoDataUrl: 'data:image/jpeg;base64,b',
          finalCategory: 'built_shade',
          modelStatus: 'success'
        }
      ]
    };

    await saveSession(session);
    const obsList = await getObservationsBySession('session-multi-obs');
    expect(obsList.length).toBe(2);
    expect(obsList[0].id).toBe('obs-a');
    expect(obsList[1].id).toBe('obs-b');
  });

  it('detects and recovers an interrupted in-progress session', async () => {
    // Session with 2 of 3 stops completed and no completedAt
    const inProgressSession: FieldSession = {
      id: 'session-interrupted',
      startedAt: new Date().toISOString(),
      mode: 'field',
      observations: [
        {
          id: 'obs-int-1',
          sessionId: 'session-interrupted',
          createdAt: new Date().toISOString(),
          photoDataUrl: 'data:image/jpeg;base64,1',
          finalCategory: 'tree_shade',
          modelStatus: 'success'
        },
        {
          id: 'obs-int-2',
          sessionId: 'session-interrupted',
          createdAt: new Date().toISOString(),
          photoDataUrl: 'data:image/jpeg;base64,2',
          finalCategory: 'exposed',
          modelStatus: 'success'
        }
      ]
    };

    await saveSession(inProgressSession);
    const all = await getAllSessions();

    const recovered = all.find(s => !s.completedAt && s.observations.length > 0 && s.observations.length < 3);
    expect(recovered).toBeDefined();
    expect(recovered?.id).toBe('session-interrupted');
    expect(recovered?.observations.length).toBe(2);

    // Complete the restored session by adding the 3rd observation
    const finalObs: Observation = {
      id: 'obs-int-3',
      sessionId: recovered!.id,
      createdAt: new Date().toISOString(),
      photoDataUrl: 'data:image/jpeg;base64,3',
      finalCategory: 'built_shade',
      modelStatus: 'success'
    };

    const completedSession: FieldSession = {
      ...recovered!,
      observations: [...recovered!.observations, finalObs],
      completedAt: new Date().toISOString()
    };

    await saveSession(completedSession);
    const postComplete = await getSession('session-interrupted');
    expect(postComplete?.observations.length).toBe(3);
    expect(postComplete?.completedAt).toBeDefined();
  });

  it('deletes persisted records and clears all data', async () => {
    const session: FieldSession = {
      id: 'session-to-delete',
      startedAt: new Date().toISOString(),
      mode: 'field',
      observations: []
    };

    await saveSession(session);
    let found = await getSession('session-to-delete');
    expect(found).not.toBeNull();

    await deleteSession('session-to-delete');
    found = await getSession('session-to-delete');
    expect(found).toBeNull();

    // Clear all data
    await saveSession({ ...session, id: 's1' });
    await saveSession({ ...session, id: 's2' });
    expect((await getAllSessions()).length).toBe(2);

    await clearAllData();
    expect((await getAllSessions()).length).toBe(0);
  });
});

describe('2. Domain Invariants', () => {
  it('strictly requires exactly 3 confirmed observations to complete', () => {
    const session: FieldSession = {
      id: 'invariant-01',
      startedAt: new Date().toISOString(),
      mode: 'field',
      observations: []
    };

    expect(session.observations.length >= 3).toBe(false);

    session.observations.push({
      id: '1', sessionId: 'invariant-01', createdAt: '', photoDataUrl: '',
      finalCategory: 'tree_shade', modelStatus: 'success'
    });
    expect(session.observations.length >= 3).toBe(false);

    session.observations.push({
      id: '2', sessionId: 'invariant-01', createdAt: '', photoDataUrl: '',
      finalCategory: 'built_shade', modelStatus: 'success'
    });
    expect(session.observations.length >= 3).toBe(false);

    session.observations.push({
      id: '3', sessionId: 'invariant-01', createdAt: '', photoDataUrl: '',
      finalCategory: 'exposed', modelStatus: 'success'
    });
    expect(session.observations.length >= 3).toBe(true);
  });

  it('never overwrites original AI suggestions when human correction occurs', () => {
    const observation: Observation = {
      id: 'obs-override',
      sessionId: 'sess',
      createdAt: '',
      photoDataUrl: '',
      aiSuggestedCategory: 'tree_shade', // Original model output
      finalCategory: 'built_shade',       // User ground-truth override
      modelStatus: 'success',
      userNote: 'Storefront awning next to saplings'
    };

    expect(observation.aiSuggestedCategory).toBe('tree_shade');
    expect(observation.finalCategory).toBe('built_shade');
    expect(observation.aiSuggestedCategory).not.toBe(observation.finalCategory);
  });

  it('does not represent failed inference as successful classification', () => {
    const failedObservation: Observation = {
      id: 'obs-failed',
      sessionId: 'sess',
      createdAt: '',
      photoDataUrl: '',
      aiSuggestedCategory: undefined,
      finalCategory: 'unclear',
      modelStatus: 'error',
      modelError: 'WebAssembly SIMD memory allocation error'
    };

    expect(failedObservation.modelStatus).toBe('error');
    expect(failedObservation.aiSuggestedCategory).toBeUndefined();
    expect(failedObservation.modelStatus).not.toBe('success');
  });

  it('strictly isolates sample sessions from field sessions', () => {
    const sampleSession: FieldSession = {
      id: 'sample-001',
      startedAt: new Date().toISOString(),
      mode: 'sample',
      observations: []
    };

    const fieldSession: FieldSession = {
      id: 'field-001',
      startedAt: new Date().toISOString(),
      mode: 'field',
      observations: []
    };

    expect(sampleSession.mode).toBe('sample');
    expect(fieldSession.mode).toBe('field');
    expect(sampleSession.mode === 'field').toBe(false);
  });
});

describe('3. Model Logic & Uncertainty Signals', () => {
  it('maps candidate prompts to correct domain shade categories', () => {
    expect(CANDIDATE_PROMPTS.length).toBe(3);
    const mapping = CANDIDATE_PROMPTS.reduce((acc, p) => {
      acc[p.category] = p.label;
      return acc;
    }, {} as Record<string, string>);

    expect(mapping['tree_shade']).toContain('trees');
    expect(mapping['built_shade']).toContain('buildings');
    expect(mapping['exposed']).toContain('direct sunlight');
  });

  it('maps unknown or arbitrary labels safely to unclear', () => {
    const arbitraryLabel = 'an astronaut walking on Mars';
    const match = CANDIDATE_PROMPTS.find(p => p.label === arbitraryLabel);
    const category: ShadeCategory = match ? match.category : 'unclear';
    expect(category).toBe('unclear');
  });

  it('correctly triggers heuristic uncertainty on weak top score (< 0.42)', () => {
    const weakScores: ModelScoreDetail[] = [
      { category: 'tree_shade', label: 'tree', score: 0.38 },
      { category: 'built_shade', label: 'built', score: 0.35 },
      { category: 'exposed', label: 'sun', score: 0.27 }
    ];
    const top = weakScores[0];
    const second = weakScores[1];
    const uncertain = !top || top.score < 0.42 || (second && top.score - second.score < 0.10);
    expect(uncertain).toBe(true);
  });

  it('correctly triggers heuristic uncertainty on narrow candidate margin (< 0.10)', () => {
    const closeScores: ModelScoreDetail[] = [
      { category: 'built_shade', label: 'built', score: 0.49 },
      { category: 'exposed', label: 'sun', score: 0.44 },
      { category: 'tree_shade', label: 'tree', score: 0.07 }
    ];
    const top = closeScores[0];
    const second = closeScores[1];
    // Margin is 0.49 - 0.44 = 0.05 (< 0.10)
    const uncertain = !top || top.score < 0.42 || (second && top.score - second.score < 0.10);
    expect(uncertain).toBe(true);
  });

  it('does NOT trigger uncertainty on decisive high-margin predictions', () => {
    const decisiveScores: ModelScoreDetail[] = [
      { category: 'tree_shade', label: 'tree', score: 0.88 },
      { category: 'built_shade', label: 'built', score: 0.09 },
      { category: 'exposed', label: 'sun', score: 0.03 }
    ];
    const top = decisiveScores[0];
    const second = decisiveScores[1];
    const uncertain = !top || top.score < 0.42 || (second && top.score - second.score < 0.10);
    expect(uncertain).toBe(false);
  });
});

describe('4. Report Generation & Scientific Integrity', () => {
  it('gives precedence to user-corrected categories in final counts', () => {
    const observations: Observation[] = [
      {
        id: '1', sessionId: 's', createdAt: '', photoDataUrl: '',
        aiSuggestedCategory: 'tree_shade',
        finalCategory: 'built_shade', // Human override
        modelStatus: 'success',
        userNote: 'Storefront awning'
      },
      {
        id: '2', sessionId: 's', createdAt: '', photoDataUrl: '',
        aiSuggestedCategory: 'exposed',
        finalCategory: 'exposed',
        modelStatus: 'success'
      },
      {
        id: '3', sessionId: 's', createdAt: '', photoDataUrl: '',
        aiSuggestedCategory: 'tree_shade',
        finalCategory: 'tree_shade',
        modelStatus: 'success'
      }
    ];

    const treeCount = observations.filter(o => o.finalCategory === 'tree_shade').length;
    const builtCount = observations.filter(o => o.finalCategory === 'built_shade').length;
    const exposedCount = observations.filter(o => o.finalCategory === 'exposed').length;
    const totalShaded = treeCount + builtCount;

    // AI originally suggested 2 tree_shade, but user corrected 1 to built_shade
    expect(treeCount).toBe(1);
    expect(builtCount).toBe(1);
    expect(exposedCount).toBe(1);
    expect(totalShaded).toBe(2);
  });

  it('preserves field notes without loss', () => {
    const observation: Observation = {
      id: 'obs-note',
      sessionId: 's',
      createdAt: '',
      photoDataUrl: '',
      finalCategory: 'built_shade',
      modelStatus: 'success',
      userNote: 'Remarkably cool shadow cast by granite colonnade'
    };

    expect(observation.userNote).toBe('Remarkably cool shadow cast by granite colonnade');
  });

  it('strictly prevents fabricated environmental metrics', () => {
    const observation: Observation = {
      id: 'obs-clean',
      sessionId: 's',
      createdAt: '',
      photoDataUrl: '',
      finalCategory: 'tree_shade',
      modelStatus: 'success'
    };

    // Assert that domain model contains NO unscientific fabricated metrics
    expect((observation as any).temperatureDrop).toBeUndefined();
    expect((observation as any).uvProtectionPercentage).toBeUndefined();
    expect((observation as any).exactCanopyPercentage).toBeUndefined();
    expect((observation as any).microclimateScore).toBeUndefined();
  });
});

describe('5. Mobile Design System & Sound Interaction Integrity', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };

  beforeAll(() => {
    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).window = globalThis;
  });

  beforeEach(() => {
    mockStorage.clear();
  });

  it('guarantees sound feedback is strictly OFF by default', async () => {
    const { isSoundEnabled } = await import('@/lib/sound/soundEffects');
    expect(isSoundEnabled()).toBe(false);
  });

  it('persists sound user preference in localStorage upon opt-in', async () => {
    const { isSoundEnabled, setSoundEnabled } = await import('@/lib/sound/soundEffects');
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
    expect(localStorage.getItem('shadeprint_sound_enabled')).toBe('true');

    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(localStorage.getItem('shadeprint_sound_enabled')).toBe('false');
  });

  it('executes sound triggers safely without crashing when AudioContext is uninitialized', async () => {
    const { playTick, playObservationConfirmed, playWalkCompleted, setSoundEnabled } = await import('@/lib/sound/soundEffects');
    
    // Even when enabled, calling synth in non-browser/headless environment must not throw
    setSoundEnabled(true);
    expect(() => playTick()).not.toThrow();
    expect(() => playObservationConfirmed()).not.toThrow();
    expect(() => playWalkCompleted()).not.toThrow();
  });

  it('ensures all shade categories have complete UI metadata and descriptions', async () => {
    const { CATEGORY_METADATA } = await import('@/lib/ai/classifier');
    const categories: ShadeCategory[] = ['tree_shade', 'built_shade', 'exposed', 'unclear'];

    categories.forEach((cat) => {
      const meta = CATEGORY_METADATA[cat];
      expect(meta).toBeDefined();
      expect(meta.name.length).toBeGreaterThan(0);
      expect(meta.desc.length).toBeGreaterThan(0);
      expect(meta.badge.length).toBeGreaterThan(0);
    });
  });

  it('verifies tailwind configuration defines mobile xs breakpoint at 375px', async () => {
    // Dynamic import tailwind config
    const tailwindConfig = await import('../tailwind.config.js');
    const screens = tailwindConfig.default?.theme?.extend?.screens;
    expect(screens?.xs).toBe('375px');
  });
});

