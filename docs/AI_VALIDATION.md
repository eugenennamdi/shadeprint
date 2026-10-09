# Open-Weight AI Validation Report

This document records the empirical validation benchmarks, configuration parameters, and technical observations gathered during Phase A and Phase D testing of **Shadeprint**.

---

## 1. Model & Runtime Specifications

| Parameter | Value |
| :--- | :--- |
| **Model Repository** | [`Xenova/clip-vit-base-patch32`](https://huggingface.co/Xenova/clip-vit-base-patch32) |
| **Original Architecture** | OpenAI Contrastive Language-Image Pre-Training (ViT-B/32) |
| **ONNX Export Provider** | Hugging Face Xenova Hub |
| **Library Version** | `@huggingface/transformers` v3.3.3 |
| **Inference Backend** | ONNX Runtime (WASM SIMD in-browser / Node.js native runtime for tests) |
| **Data Type** | `fp32` (default precision) |
| **Total ONNX Model Size** | ~350 MB uncompressed; ~150 MB transfer weight |
| **Task Pipeline** | `zero-shot-image-classification` |
| **Model License** | Apache 2.0 |

---

## 2. Candidate Prompts Evaluated

We tested multiple phrasing variations for pedestrian shade classification. The contrastive performance of CLIP is highly sensitive to prompt structure.

### Candidate Set A (Verbose narrative - Phase A preliminary)
1. `"A pedestrian walkway shaded by large trees and green foliage."`
2. `"A pedestrian walkway shaded by buildings, roofs, or awnings."`
3. `"An open pedestrian walkway exposed to direct sunlight with little visible shade."`

*Observation*: Worked well, but occasional minor ambiguity when awnings and buildings were separated.

### Candidate Set B (Standardized, calibrated - Final Production Set)
1. **Tree Shade**: `"a pedestrian walkway shaded by trees and green foliage"`
2. **Built Shade**: `"a pedestrian walkway shaded by buildings, walls, or awnings"`
3. **Exposed**: `"an open pedestrian walkway exposed to direct sunlight with little or no shade"`

---

## 3. Empirical Test Results (Actual Measured Performance)

The following benchmark was executed using the production `Xenova/clip-vit-base-patch32` pipeline against ground-truth pedestrian street photography:

### Test Case 1: Tree Shade Sample (`public/samples/sample_tree_shade.jpg`)
- **Description**: Neighborhood residential sidewalk flanked by mature maple and oak trees with extensive overhead canopy casting dappled shadows.
- **Measured Inference Time**: **174 ms**
- **CLIP Similarity Scores**:
  1. `79.8%` — `"a pedestrian walkway shaded by trees and green foliage"` *(Tree shade)*
  2. `18.7%` — `"a pedestrian walkway shaded by buildings, walls, or awnings"` *(Built shade)*
  3. `1.4%` — `"an open pedestrian walkway exposed to direct sunlight with little or no shade"` *(Exposed)*
- **Outcome**: **CORRECT** (Decisive top match, delta = +61.1%).

### Test Case 2: Built Shade Sample (`public/samples/sample_built_shade.jpg`)
- **Description**: Commercial storefront sidewalk shaded by a 4-story masonry facade and an architectural street awning, with direct sun on the opposite street lane.
- **Measured Inference Time**: **272 ms**
- **CLIP Similarity Scores**:
  1. `92.3%` — `"a pedestrian walkway shaded by buildings, walls, or awnings"` *(Built shade)*
  2. `5.3%` — `"a pedestrian walkway shaded by trees and green foliage"` *(Tree shade)*
  3. `2.3%` — `"an open pedestrian walkway exposed to direct sunlight with little or no shade"` *(Exposed)*
- **Outcome**: **CORRECT** (High confidence match, delta = +87.0%).

### Test Case 3: Sun-Exposed Sample (`public/samples/sample_exposed.jpg`)
- **Description**: Wide concrete pedestrian esplanade under direct midday sun with short ground shadows and zero overhead canopy.
- **Measured Inference Time**: **154 ms**
- **CLIP Similarity Scores**:
  1. `60.1%` — `"an open pedestrian walkway exposed to direct sunlight with little or no shade"` *(Exposed)*
  2. `38.3%` — `"a pedestrian walkway shaded by buildings, walls, or awnings"` *(Built shade)*
  3. `1.6%` — `"a pedestrian walkway shaded by trees and green foliage"` *(Tree shade)*
- **Outcome**: **CORRECT** (Classified correctly as exposed; notable built-shade baseline due to adjacent urban storefront glass in background).

---

## 4. Latency & Resource Utilization

- **Cold Model Download**: ~12 minutes on limited bandwidth connections (one-time download of ONNX weights).
- **Cached Model Initialization**: **< 1.8 seconds** from local browser Cache API / disk.
- **Per-Image Inference Latency**: **150 ms – 300 ms** on Apple Silicon / modern CPU.
- **Memory Consumption**: Peak memory during inference ~420 MB RAM; idle memory footprint ~90 MB.

---

## 5. Technical Honesty & Uncertainty Guardrails

In testing, we established three strict technical honesty rules implemented in `src/lib/ai/classifier.ts`:

1. **Relative Similarity, Not Objective Probability**:
   CLIP similarity scores reflect the relative cosine similarity of image embeddings to candidate text embeddings, normalized via softmax. They do not constitute calibrated statistical probabilities.
2. **Uncertainty Trigger**:
   If the top similarity score is below `0.42` or the difference between the top score and the runner-up is under `0.10` (10 percentage points), Shadeprint flags the observation as **Uncertain / Mixed** and explicitly prompts the human observer to verify ground reality.
3. **No Overwrite on Correction**:
   If a user overrides an AI recommendation (e.g. classifying a tree-adjacent wall as built shade instead of tree shade), the application stores both `aiSuggestedCategory` and `finalCategory`, ensuring scientific auditability.

---

## 6. Browser Compatibility & Feasibility Notes

- **Chromium / Chrome / Edge**: Full support for WebAssembly SIMD and Cache API.
- **Safari / WebKit (iOS & macOS)**: Supported via standard WebAssembly fallback. Requires memory quota clearance for initial 150MB ONNX asset caching.
- **Firefox**: Supported with WebAssembly SIMD enabled.
- **Offline Operation**: Verified; after the initial model download, turning off network connectivity allows uninterrupted image classification and notebook persistence.
