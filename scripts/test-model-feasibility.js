import { pipeline, env } from '@huggingface/transformers';
import fs from 'fs';
import path from 'path';

// Enable logging
console.log('--- Phase A: Model Feasibility Check ---');
console.log('Transformers.js version check and pipeline initialization...');

async function runFeasibilityTest() {
  const startTime = Date.now();
  console.log('Loading zero-shot-image-classification pipeline for Xenova/clip-vit-base-patch32...');
  
  try {
    const classifier = await pipeline(
      'zero-shot-image-classification',
      'Xenova/clip-vit-base-patch32',
      {
        progress_callback: (p) => {
          if (p.status === 'progress') {
            process.stdout.write(`Downloading ${p.file}: ${Math.round(p.progress || 0)}%\r`);
          }
        }
      }
    );
    
    const loadDuration = Date.now() - startTime;
    console.log(`\nModel loaded successfully in ${(loadDuration / 1000).toFixed(2)}s`);

    // Test candidate labels
    const candidateLabels = [
      'a pedestrian walkway shaded by large trees and green foliage',
      'a pedestrian walkway shaded by buildings, walls, or awnings',
      'an open pedestrian walkway exposed to direct sunlight with little visible shade'
    ];

    console.log('\nTesting inference with a synthetic RGB test image...');
    // Create a 224x224 RGB image buffer or use a sample URL/data URI
    // We can test with a remote public image or data URL
    // Let's use a simple 1x1 or test image:
    const testImageUrl = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/cats.jpg';
    
    const inferStart = Date.now();
    const result = await classifier(testImageUrl, candidateLabels);
    const inferDuration = Date.now() - inferStart;
    
    console.log(`\nInference completed in ${inferDuration}ms!`);
    console.log('Raw results:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n[PASS] Model feasibility check passed!');
  } catch (error) {
    console.error('\n[FAIL] Model feasibility check error:', error);
    process.exit(1);
  }
}

runFeasibilityTest();
