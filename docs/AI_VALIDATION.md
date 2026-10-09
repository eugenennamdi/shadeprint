# Open-Weight AI Validation Report

This document records the empirical validation benchmarks, configuration parameters, and technical observations gathered during Phase A, Phase D, and the final production hardening audit of **Shadeprint**.

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
| **Total ONNX Model Size** | 577.7 MB uncompressed ONNX; ~150 MB network transfer |
| **Task Pipeline** | `zero-shot-image-classification` |
| **Model License** | Apache 2.0 |

---

## 2. Quantization Audit (`fp32` vs `q8`)

As part of the cold-download audit, we empirically tested loading 8-bit quantized weights (`onnx/model_quantized.onnx`, 146.6 MB):
- **Transfer Size**: Reduced by 74.6% (146 MB vs 578 MB).
- **Inference Latency**: 188 ms.
- **Accuracy Finding**: On `./public/samples/sample_built_shade.jpg`, the `q8` quantized model misclassified architectural awning shade as exposed sunlight (`59.3%` exposed), whereas the `fp32` model decisively and correctly classified it as built shade (`92.3%` built shade).
- **Engineering Decision**: In accordance with the project rule (*a verified working model is better than an untested optimization*), the `fp32` model is maintained as the default production standard to prevent classification degradation.

---

## 3. Score Semantics & Technical Honesty

In the zero-shot image classification pipeline, raw image and text embeddings produce cosine similarity logits that are scaled and normalized via softmax across the candidate prompt set:

$$p_i = \frac{e^{100 \cdot \cos(\mathbf{v}_{img}, \mathbf{w}_i)}}{\sum_{j=1}^N e^{100 \cdot \cos(\mathbf{v}_{img}, \mathbf{w}_j)}}$$

### Critical Semantics
1. **Relative, Not Absolute**: Scores sum to 100% across the 3 supplied candidate prompts. They reflect relative contrastive match, **not calibrated statistical confidence** or physical percentage of shade canopy.
2. **UI Presentation**: The UI labels scores as **"Relative Candidate Match"** with explicit disclaimers preventing misinterpretation as microclimate measurements.
3. **Heuristic Uncertainty Signals**:
   - Random chance baseline for 3 candidates is $33.3\%$.
   - **Signal 1 (Low Score)**: Top candidate score $< 0.42$ ($42\%$) indicates weak discriminative preference over random chance.
   - **Signal 2 (Narrow Margin)**: Difference between top score and runner-up $< 0.10$ ($10$ percentage points) indicates a near-tie.
   - When triggered, Shadeprint flags heuristic uncertainty and prompts the human observer to verify ground reality.

---

## 4. 12-Image Empirical Benchmark Dataset

We evaluated the production `fp32` CLIP pipeline across 12 distinct physical scenarios representing diverse outdoor environments:

| ID | Test Scenario | File | Expected Category | Predicted Category | Top Score | Runner-Up | Margin | Latency | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T01** | Dense Tree Canopy | `tree_dense_canopy.jpg` | `tree_shade` | `tree_shade` | 79.8% | 18.7% | +61.1% | 133 ms | **PASS** |
| **T02** | Tropical Palms & Broadleaf | `tree_tropical_palms.jpg` | `tree_shade` | `tree_shade` | 99.1% | 0.8% | +98.3% | 125 ms | **PASS** |
| **T03** | Suburban Street Canopy | `tree_suburban_canopy.jpg` | `tree_shade` | `tree_shade` | 99.7% | 0.2% | +99.5% | 144 ms | **PASS** |
| **T04** | Storefront Fabric Awning | `built_storefront_awning.jpg` | `built_shade` | `built_shade` | 92.3% | 5.3% | +87.0% | 124 ms | **PASS** |
| **T05** | Stone Colonnade Arcade | `built_arcade_colonnade.jpg` | `built_shade` | `built_shade` | 93.3% | 5.3% | +88.0% | 203 ms | **PASS** |
| **T06** | Skyscraper Canyon Shadow | `built_skyscraper_shadow.jpg` | `built_shade` | `built_shade` | 92.1% | 7.4% | +84.7% | 130 ms | **PASS** |
| **T07** | Open Pedestrian Plaza | `exposed_plaza.jpg` | `exposed` | `exposed` | 60.1% | 38.3% | +21.8% | 144 ms | **PASS** |
| **T08** | Sunny Urban Crosswalk | `exposed_sunny_crosswalk.jpg` | `exposed` | `exposed` | 55.1% | 42.9% | +12.2% | 129 ms | **PASS** |
| **T09** | Mixed Dappled Light | `mixed_dappled_light.jpg` | `unclear` / mixed | `tree_shade` | 54.5% | 24.4% | +30.1% | 138 ms | *AI Leaned Tree* |
| **T10** | Overcast Rainy Street | `ambiguous_overcast_cloudy.jpg` | `unclear` | `built_shade` | 88.0% | 10.6% | +77.4% | 132 ms | *Lighting Ambiguity* |
| **T11** | Wilderness (No Walkway) | `no_walkway_forest.jpg` | `tree_shade` | `tree_shade` | 99.6% | 0.3% | +99.3% | 150 ms | **PASS** |
| **T12** | Parking Lot (No Walkway) | `no_walkway_parking_lot.jpg` | `exposed` | `exposed` | 78.2% | 21.4% | +56.8% | 146 ms | **PASS** |

### Benchmark Summary
- **Clear Physical Categories**: 10 out of 10 correct (**100% accuracy**).
- **Average Inference Latency**: **141.5 ms** per image on Apple Silicon CPU.
- **Observed Edge Cases & Model Blind Spots**:
  1. *Overcast diffuse lighting (T10)*: Under cloud cover, flat diffuse lighting eliminates shadows. In the absence of bright sunlight, CLIP misinterprets gloomy architectural walls as built shade.
  2. *Mixed sapling light (T09)*: Dappled saplings split the scores across all three categories (54.5% tree, 24.4% built, 21.1% exposed), demonstrating the absolute necessity of human ground-truth confirmation.

---

## 5. Asset Provenance & Usage Rights

Every image in the benchmark and sample dataset is stored locally in the repository with documented provenance:
- `public/samples/sample_tree_shade.jpg`: Project-synthesized photographic reference (MIT License).
- `public/samples/sample_built_shade.jpg`: Project-synthesized photographic reference (MIT License).
- `public/samples/sample_exposed.jpg`: Project-synthesized photographic reference (MIT License).
- `tests/fixtures/*.jpg`: Dedicated project test fixtures generated specifically for this benchmark (MIT License).
- **Third-Party Image Server Dependency**: **0%**. All assets are self-contained in the repository without external CDN calls.
