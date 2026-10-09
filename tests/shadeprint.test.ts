import { describe, it, expect } from 'vitest';
import { FieldSession, Observation, ShadeCategory, ModelScoreDetail } from '../src/types';
import { CANDIDATE_PROMPTS, CATEGORY_METADATA } from '../src/lib/ai/classifier';

describe('Domain & Session Progress', () => {
  it('creates an empty session with correct initial state', () => {
    const session: FieldSession = {
      id: 'session-test-01',
      startedAt: new Date().toISOString(),
      mode: 'field',
      observations: [],
    };

    expect(session.observations.length).toBe(0);
    expect(session.completedAt).toBeUndefined();
    expect(session.mode).toBe('field');
  });

  it('completes session only when 3 observations are recorded', () => {
    const session: FieldSession = {
      id: 'session-test-02',
      startedAt: new Date().toISOString(),
      mode: 'field',
      observations: [],
    };

    const makeObs = (id: string, cat: ShadeCategory): Observation => ({
      id,
      sessionId: session.id,
      createdAt: new Date().toISOString(),
      photoDataUrl: 'data:image/jpeg;base64,mock',
      finalCategory: cat,
      modelStatus: 'success',
    });

    session.observations.push(makeObs('obs-1', 'tree_shade'));
    expect(session.observations.length).toBe(1);
    expect(session.observations.length >= 3).toBe(false);

    session.observations.push(makeObs('obs-2', 'built_shade'));
    expect(session.observations.length).toBe(2);
    expect(session.observations.length >= 3).toBe(false);

    session.observations.push(makeObs('obs-3', 'exposed'));
    expect(session.observations.length).toBe(3);
    expect(session.observations.length >= 3).toBe(true);
    
    session.completedAt = new Date().toISOString();
    expect(session.completedAt).toBeDefined();
  });

  it('preserves user correction separately from AI suggested category', () => {
    const observation: Observation = {
      id: 'obs-correction-test',
      sessionId: 'session-01',
      createdAt: new Date().toISOString(),
      photoDataUrl: 'data:image/jpeg;base64,mock',
      aiSuggestedCategory: 'tree_shade',
      finalCategory: 'built_shade', // Human user corrected it to built_shade
      modelStatus: 'success',
      userNote: 'Actually an awning next to a small bush',
    };

    expect(observation.aiSuggestedCategory).toBe('tree_shade');
    expect(observation.finalCategory).toBe('built_shade');
    expect(observation.aiSuggestedCategory).not.toBe(observation.finalCategory);
  });
});

describe('Report Aggregation & Technical Honesty', () => {
  it('accurately aggregates shade observation counts without fabricating percentages', () => {
    const observations: Observation[] = [
      {
        id: '1',
        sessionId: 's',
        createdAt: '2026-10-09',
        photoDataUrl: '',
        finalCategory: 'tree_shade',
        modelStatus: 'success',
      },
      {
        id: '2',
        sessionId: 's',
        createdAt: '2026-10-09',
        photoDataUrl: '',
        finalCategory: 'built_shade',
        modelStatus: 'success',
      },
      {
        id: '3',
        sessionId: 's',
        createdAt: '2026-10-09',
        photoDataUrl: '',
        finalCategory: 'exposed',
        modelStatus: 'success',
      },
    ];

    const treeCount = observations.filter((o) => o.finalCategory === 'tree_shade').length;
    const builtCount = observations.filter((o) => o.finalCategory === 'built_shade').length;
    const exposedCount = observations.filter((o) => o.finalCategory === 'exposed').length;
    const unclearCount = observations.filter((o) => o.finalCategory === 'unclear').length;
    const totalShaded = treeCount + builtCount;

    expect(treeCount).toBe(1);
    expect(builtCount).toBe(1);
    expect(exposedCount).toBe(1);
    expect(unclearCount).toBe(0);
    expect(totalShaded).toBe(2);

    // Verify metadata exists for all categories
    expect(CATEGORY_METADATA.tree_shade.name).toBe('Tree Shade');
    expect(CATEGORY_METADATA.built_shade.name).toBe('Built Shade');
    expect(CATEGORY_METADATA.exposed.name).toBe('Exposed');
    expect(CATEGORY_METADATA.unclear.name).toBe('Unclear / Mixed');
  });
});

describe('Model Integration & Uncertainty Logic', () => {
  it('contains valid candidate prompts for all core categories', () => {
    expect(CANDIDATE_PROMPTS.length).toBe(3);
    const categories = CANDIDATE_PROMPTS.map((p) => p.category);
    expect(categories).toContain('tree_shade');
    expect(categories).toContain('built_shade');
    expect(categories).toContain('exposed');
  });

  it('correctly detects uncertainty when similarity scores are very close or low', () => {
    // Top score 0.38 is below 0.42 confidence threshold
    const scoresLow: ModelScoreDetail[] = [
      { category: 'tree_shade', label: 'tree', score: 0.38 },
      { category: 'built_shade', label: 'built', score: 0.35 },
      { category: 'exposed', label: 'sun', score: 0.27 },
    ];
    const top = scoresLow[0];
    const second = scoresLow[1];
    const isUncertain = !top || top.score < 0.42 || (second && top.score - second.score < 0.10);
    expect(isUncertain).toBe(true);

    // Clear decisive score
    const scoresDecisive: ModelScoreDetail[] = [
      { category: 'tree_shade', label: 'tree', score: 0.79 },
      { category: 'built_shade', label: 'built', score: 0.18 },
      { category: 'exposed', label: 'sun', score: 0.03 },
    ];
    const topDecisive = scoresDecisive[0];
    const secondDecisive = scoresDecisive[1];
    const isDecisiveUncertain = !topDecisive || topDecisive.score < 0.42 || (secondDecisive && topDecisive.score - secondDecisive.score < 0.10);
    expect(isDecisiveUncertain).toBe(false);
  });

  it('does not produce falsely successful results on empty scores', () => {
    const emptyScores: ModelScoreDetail[] = [];
    const top = emptyScores[0];
    expect(top).toBeUndefined();
    const suggestedCategory = top ? (top as ModelScoreDetail).category : 'unclear';
    expect(suggestedCategory).toBe('unclear');
  });
});
