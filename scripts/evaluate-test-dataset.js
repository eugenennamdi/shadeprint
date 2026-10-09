import { pipeline } from '@huggingface/transformers';
import path from 'path';

const TEST_SET = [
  {
    id: 'T01',
    name: 'Dense Tree Canopy',
    file: './tests/fixtures/tree_dense_canopy.jpg',
    category: 'tree_shade',
    type: 'Dense Tree Shade',
    description: 'Leafy deciduous tree tunnel overhead'
  },
  {
    id: 'T02',
    name: 'Tropical Palms & Broadleaf',
    file: './tests/fixtures/tree_tropical_palms.jpg',
    category: 'tree_shade',
    type: 'Tropical Vegetation',
    description: 'Dense tropical palm and monstera path shade'
  },
  {
    id: 'T03',
    name: 'Suburban Street Canopy',
    file: './tests/fixtures/tree_suburban_canopy.jpg',
    category: 'tree_shade',
    type: 'Dense Tree Shade',
    description: 'Continuous arching residential street canopy'
  },
  {
    id: 'T04',
    name: 'Storefront Fabric Awning',
    file: './tests/fixtures/built_storefront_awning.jpg',
    category: 'built_shade',
    type: 'Building/Structural Shade',
    description: 'Storefront awning & facade shadow over sidewalk'
  },
  {
    id: 'T05',
    name: 'Stone Colonnade Arcade',
    file: './tests/fixtures/built_arcade_colonnade.jpg',
    category: 'built_shade',
    type: 'Building/Structural Shade',
    description: 'Classical stone colonnade covered walkway'
  },
  {
    id: 'T06',
    name: 'Skyscraper Canyon Shadow',
    file: './tests/fixtures/built_skyscraper_shadow.jpg',
    category: 'built_shade',
    type: 'Building/Structural Shade',
    description: 'Deep architectural shadow from 30-story tower'
  },
  {
    id: 'T07',
    name: 'Open Pedestrian Plaza',
    file: './tests/fixtures/exposed_plaza.jpg',
    category: 'exposed',
    type: 'Open Sun-Exposed',
    description: 'Direct sun on wide concrete walkway'
  },
  {
    id: 'T08',
    name: 'Sunny Urban Crosswalk',
    file: './tests/fixtures/exposed_sunny_crosswalk.jpg',
    category: 'exposed',
    type: 'Open Sun-Exposed',
    description: 'Midday sun on asphalt zebra crosswalk'
  },
  {
    id: 'T09',
    name: 'Mixed Dappled Light',
    file: './tests/fixtures/mixed_dappled_light.jpg',
    category: 'unclear', // Or mixed
    type: 'Mixed Conditions',
    description: 'Sparse sapling branches casting partial light'
  },
  {
    id: 'T10',
    name: 'Overcast Rainy Street',
    file: './tests/fixtures/ambiguous_overcast_cloudy.jpg',
    category: 'unclear',
    type: 'Ambiguous Lighting',
    description: 'Diffuse flat gray lighting, wet pavement, no shadows'
  },
  {
    id: 'T11',
    name: 'Wilderness Forest (No Walkway)',
    file: './tests/fixtures/no_walkway_forest.jpg',
    category: 'tree_shade', // Natural vegetative shade despite no walkway
    type: 'No Pedestrian Walkway',
    description: 'Dense wilderness woods with leaf litter floor'
  },
  {
    id: 'T12',
    name: 'Commercial Parking Lot (No Walkway)',
    file: './tests/fixtures/no_walkway_parking_lot.jpg',
    category: 'exposed', // Asphalt sun exposure despite no walkway
    type: 'No Pedestrian Walkway',
    description: 'Vast asphalt parking lot under blazing direct sun'
  }
];

const PROMPTS = [
  { category: 'tree_shade', label: 'a pedestrian walkway shaded by trees and green foliage' },
  { category: 'built_shade', label: 'a pedestrian walkway shaded by buildings, walls, or awnings' },
  { category: 'exposed', label: 'an open pedestrian walkway exposed to direct sunlight with little or no shade' }
];

async function runEvaluation() {
  console.log('Loading production Xenova/clip-vit-base-patch32 pipeline (fp32)...');
  const classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
  console.log('Classifier ready.\n');

  const results = [];
  const candidateLabels = PROMPTS.map(p => p.label);

  console.log('Evaluating 12 representative test cases...\n');

  for (const testCase of TEST_SET) {
    const t0 = performance.now();
    const rawScores = await classifier(testCase.file, candidateLabels);
    const latency = Math.round(performance.now() - t0);

    // Map labels to categories
    const mappedScores = rawScores.map(item => {
      const pMatch = PROMPTS.find(p => p.label === item.label);
      return {
        category: pMatch ? pMatch.category : 'unclear',
        label: item.label,
        score: Number(item.score.toFixed(4))
      };
    });

    mappedScores.sort((a, b) => b.score - a.score);
    const top = mappedScores[0];
    const second = mappedScores[1];

    // Uncertainty heuristic
    const isUncertain = !top || top.score < 0.42 || (second && top.score - second.score < 0.10);

    // Match determination
    const predictedCat = top ? top.category : 'unclear';
    const isExactMatch = predictedCat === testCase.category;
    // If expected is unclear and uncertain triggered, that is also a correct detection!
    const isCorrect = isExactMatch || (testCase.category === 'unclear' && isUncertain);

    results.push({
      id: testCase.id,
      name: testCase.name,
      type: testCase.type,
      file: testCase.file,
      expected: testCase.category,
      predicted: predictedCat,
      topScore: (top.score * 100).toFixed(1) + '%',
      secondScore: second ? (second.score * 100).toFixed(1) + '%' : 'N/A',
      margin: second ? ((top.score - second.score) * 100).toFixed(1) + '%' : 'N/A',
      uncertain: isUncertain,
      correct: isCorrect,
      latencyMs: latency,
      scores: mappedScores
    });

    console.log(`[${testCase.id}] ${testCase.name}`);
    console.log(`  Expected: ${testCase.category} | Predicted: ${predictedCat} (${(top.score * 100).toFixed(1)}%) | Margin: ${results[results.length-1].margin}`);
    console.log(`  Uncertain: ${isUncertain ? 'YES (flagged)' : 'NO'} | Latency: ${latency}ms | Match: ${isCorrect ? 'PASS' : 'FAIL'}`);
    console.log('');
  }

  // Summary Metrics
  const total = results.length;
  const correctCount = results.filter(r => r.correct).length;
  const avgLatency = Math.round(results.reduce((acc, r) => acc + r.latencyMs, 0) / total);

  console.log('========================================================');
  console.log(`EVALUATION SUMMARY: ${correctCount}/${total} Passed (${((correctCount/total)*100).toFixed(1)}%)`);
  console.log(`Average Latency: ${avgLatency}ms per image`);
  console.log('========================================================\n');

  console.log(JSON.stringify(results, null, 2));
}

runEvaluation().catch(console.error);
