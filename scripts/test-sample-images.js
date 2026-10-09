import { pipeline } from '@huggingface/transformers';
import path from 'path';

async function testAllSamples() {
  console.log('Loading classifier...');
  const classifier = await pipeline(
    'zero-shot-image-classification',
    'Xenova/clip-vit-base-patch32'
  );
  console.log('Classifier ready. Testing sample images...');

  const prompts = [
    'a pedestrian walkway shaded by trees and green foliage',
    'a pedestrian walkway shaded by buildings, walls, or awnings',
    'an open pedestrian walkway exposed to direct sunlight with little or no shade'
  ];

  const testImages = [
    { name: 'Tree Shade Sample', file: './public/samples/sample_tree_shade.jpg', expected: 'tree_shade' },
    { name: 'Built Shade Sample', file: './public/samples/sample_built_shade.jpg', expected: 'built_shade' },
    { name: 'Exposed Sample', file: './public/samples/sample_exposed.jpg', expected: 'exposed' }
  ];

  for (const img of testImages) {
    const start = performance.now();
    const result = await classifier(img.file, prompts);
    const duration = Math.round(performance.now() - start);

    console.log(`\n--- ${img.name} (${img.file}) ---`);
    console.log(`Inference time: ${duration}ms`);
    console.log(`Top result: ${result[0].label} (score: ${(result[0].score * 100).toFixed(1)}%)`);
    console.log('All scores:');
    result.forEach((r, idx) => {
      console.log(`  ${idx + 1}. ${(r.score * 100).toFixed(1)}% — "${r.label}"`);
    });
  }
}

testAllSamples().catch(console.error);
