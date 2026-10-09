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
| **Total ONNX Model Size** | 605.8 MB (577.7 MiB) uncompressed ONNX; ~606 MB cold network download |
| **Task Pipeline** | `zero-shot-image-classification` |
| **Model License** | Apache 2.0 |

---

## 2. Model Size & Quantization Audit (`fp32` vs `q8`)

### Network Transfer & Caching Reality
- **Exact Active Artifact**: `onnx/model.onnx` (FP32).
- **Exact File Size**: 605,799,029 bytes (~605.8 MB decimal / 577.7 MiB binary).
- **Ancillary Files**: `tokenizer.json` (2.2 MB), `config.json` (4.5 KB), `tokenizer_config.json` (775 B), `preprocessor_config.json` (520 B). Total initial payload: ~608 MB.
- **Resolution of Previous Size Discrepancy**: A previous report claimed "~150 MB network transfer" for FP32. That figure was an error caused by conflating the file size of the 8-bit quantized model (`model_quantized.onnx`, 153.7 MB / 146.6 MiB) with an assumed gzip-compressed stream of the FP32 model. In reality, Hugging Face Hub serves ONNX files as raw binary octet-streams without 75% on-the-fly compression. Cold download transfers the full ~606 MB.
- **Client-Side Caching**: `env.useBrowserCache = true` persists the model in the browser's native **Cache API** (`transformers-cache`). Once downloaded, subsequent visits and app restarts require **0 bytes** of network transfer.

### Quantization Tradeoff Analysis
As part of the cold-download audit, we empirically tested loading 8-bit quantized weights (`onnx/model_quantized.onnx`, 153.7 MB / 146.6 MiB):
- **Transfer Size**: Reduced by 74.6% (153.7 MB vs 605.8 MB).
- **Inference Latency**: 188 ms.
- **Accuracy Finding**: On `./public/samples/sample_built_shade.jpg`, the `q8` quantized model misclassified architectural awning shade as exposed sunlight (`59.3%` exposed), whereas the `fp32` model decisively and correctly classified it as built shade (`92.3%` built shade).
- **Engineering Decision**: In accordance with the project rule (*a verified working model is better than an untested optimization*), the `fp32` model is maintained as the production standard to prevent classification degradation.

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

### Benchmark Summary & Qualification of Results
- **Unambiguous Single-Category Scenes (10 of 12 images)**: 10 out of 10 matched the expected category (**100% on definitive subset**).
  - *Tree Canopy*: T01 (Dense canopy), T02 (Tropical palms), T03 (Suburban street canopy), T11 (Forest path).
  - *Architectural Shade*: T04 (Fabric awning), T05 (Stone colonnade), T06 (Skyscraper shadow).
  - *Direct Sunlight*: T07 (Open plaza), T08 (Sunny crosswalk), T12 (Open asphalt lot).
- **Ambiguous Edge Cases & Failure Modes (2 of 12 images)**:
  - **T09 (Mixed Dappled Light)**: Sparse saplings casting fragmented shadow patches over bright pavement. The CLIP model leaned toward `tree_shade` (54.5%), but split scores substantially across built shade (24.4%) and exposed sun (21.1%). This is inherently a mixed state; treating it as a simple binary pass/fail is scientifically unsound.
  - **T10 (Overcast Flat Diffuse Light)**: Rainy overcast day with diffuse lighting and no cast shadows or direct sun. CLIP predicted `built_shade` (88.0%) because the absence of bright solar highlights penalized the "open sunny walkway" candidate prompt, grouping dark wet asphalt closer to architectural shadow.
- **Overall Suite Score**: **10 / 12 (83.3%)** when evaluated across all test cases including edge cases.
- **Average Inference Latency**: **141.5 ms** per image on Apple Silicon CPU (WebAssembly SIMD).

### Why This Benchmark Does Not Establish General Model Accuracy
A 12-image local test suite provides an engineering smoke test and qualitative boundary check, but **cannot and does not establish general real-world accuracy**:
1. **Sample Size**: Twelve images cannot capture the vast distribution of urban pedestrian environments worldwide.
2. **Solar & Atmospheric Variance**: Sun angles change drastically across latitude, time of day, and season. Overcast, foggy, or twilight conditions break simple solar shadow assumptions.
3. **Camera Sensor Processing**: Smartphone HDR, automatic white balance, and contrast sharpening alter shadow depth.
4. **Conclusion**: This benchmark proves the ONNX pipeline correctly executes zero-shot vision inference locally, but reinforces Shadeprint's fundamental design thesis: **AI suggestion is only an initial hint; the human observer remains the sole reliable ground-truth arbiter.**

---

## 5. Asset Provenance & Usage Rights

Every image in the benchmark and sample dataset is stored locally in the repository with documented provenance:
- `public/samples/sample_tree_shade.jpg`: Project-synthesized photographic reference (MIT License).
- `public/samples/sample_built_shade.jpg`: Project-synthesized photographic reference (MIT License).
- `public/samples/sample_exposed.jpg`: Project-synthesized photographic reference (MIT License).
- `tests/fixtures/*.jpg`: Dedicated project test fixtures generated specifically for this benchmark (MIT License).
- **Third-Party Image Server Dependency**: **0%**. All assets are self-contained in the repository without external CDN calls.
