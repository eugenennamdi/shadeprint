# Shadeprint — Build Notes & Engineering Journal

**Project**: Shadeprint  
**Hackathon**: Hacktoberfest 2026 Open-Source AI Challenge, Week 1: Touch Grass  
**Target Build Time**: 3–4.5 hours focused engineering  

---

## 1. Architectural Overview

Shadeprint is structured as a zero-backend, fully client-side static web application designed to run seamlessly on mobile phones and desktop browsers.

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser Runtime                       │
│                                                             │
│  ┌────────────────────┐            ┌─────────────────────┐  │
│  │   UI Flow (React)  │            │  Storage (IndexedDB)│  │
│  │  - Intro           │            │  - Sessions         │  │
│  │  - Photo Capture   │            │  - Observations     │  │
│  │  - AI Review       │◄──────────►│  - Offline Cache    │  │
│  │  - Between Stops   │            └─────────────────────┘  │
│  │  - Field Report    │                                     │
│  └─────────┬──────────┘                                     │
│            │                                                │
│            ▼                                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │     Open-Weight Vision Pipeline (Transformers.js)     │  │
│  │     - Model: Xenova/clip-vit-base-patch32             │  │
│  │     - ONNX WebAssembly Runtime (WASM SIMD)            │  │
│  │     - Zero-Shot Contrastive Classification            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Why This Stack?
- **No Cloud Backend**: Prevents privacy leakage, eliminates cloud infrastructure cost, ensures offline operation outdoors where cellular reception may be patchy.
- **Native IndexedDB without heavy ORMs**: Uses native browser IndexedDB via a clean promise wrapper (`src/lib/storage/db.ts`). Zero extra package dependencies.
- **React 19 + TypeScript (Strict Mode)**: Strict compile-time checks ensure state safety across the 5 observation stages.
- **Tailwind CSS**: Rapid styling with a tailored environmental color scheme (botanical greens, warm parchment neutrals, and sunlit ochre accents).

---

## 2. Key Design & Product Decisions

### A. "The screen should be the shortest part of the experience"
Conventional walking and navigation applications trap users in map overlays, gamified badges, and continuous GPS tracking. Shadeprint takes the opposite stance:
- **No continuous GPS tracking**: We do not monitor where the user walks or enforce map routes.
- **3-Stop Constraint**: A bounded, bite-sized observation loop that takes roughly 10 minutes.
- **Screen 4 (Between Stops)**: Explicitly instructs the user to put their phone in their pocket, look up, and notice changes in the physical environment.

### B. Technical Honesty
A common temptation in AI environmental apps is claiming to measure microclimates, thermal indices, or tree canopy percentages. We deliberately avoided this:
- **Visible Shade Only**: We classify whether visible shadows stem from vegetative foliage, architectural walls, or open sun.
- **No Fake Microclimates**: The app does not display simulated temperature reductions or fabricated environmental health scores.
- **Relative Uncertainty**: If CLIP's top candidate scores are within 10 percentage points of each other, the app flags the result as uncertain and elevates the user's ground-truth judgment.

---

## 3. Open-Source AI Choices: Why CLIP Zero-Shot?

When evaluating open-weight vision models for in-browser pedestrian shade observation, we compared three paths:

1. **Custom Fine-Tuned ResNet/MobileNet**:
   - *Pros*: Small download size (~15MB).
   - *Cons*: Highly brittle to lighting variations, camera sensors, and seasonal foliage changes; required training a custom dataset from scratch.
2. **Vision-Language Model (e.g. SmolVLM / Moondream)**:
   - *Pros*: Conversational reasoning.
   - *Cons*: Excessively large download (>1.5 GB), sluggish in-browser generation (>8 seconds per token), contradicts the goal of minimizing screen time.
3. **CLIP (`Xenova/clip-vit-base-patch32`) Zero-Shot Classification**:
   - *Pros*: Contrastive semantic embeddings trained on diverse real-world lighting conditions; fast inference (150–300 ms); zero generative hallucinations; directly maps contrastive text prompts to image features.
   - *Verdict*: Chosen as the ideal open-weight model for physical-world field observation.

---

## 4. Problems Encountered & Solutions

### Problem 1: Network Sandboxing During Initial Setup
- **Issue**: Standard build sandboxes isolate network requests, preventing package installation and Hugging Face model weight fetching.
- **Resolution**: Used sandboxed mode for all local file operations, TypeScript compilation, and unit tests; isolated package installs and model download checks to authorized bypass commands.

### Problem 2: Camera Capture on Mobile vs Desktop
- **Issue**: Desktop browsers do not support `capture="environment"`, while mobile Safari handles camera file inputs differently than Android Chrome.
- **Resolution**: Implemented dual-mode input handling: a standard `<input type="file" accept="image/*" capture="environment">` for mobile camera launch, paired with a generic `<input type="file" accept="image/*">` for desktop library uploads. Added automated canvas resizing to 800px max dimension before inference.

---

## 5. Known Compromises & Future Upgrades

1. **Web Worker Offloading**:
   - *Current*: Inference runs via asynchronous WebAssembly promises on the main thread.
   - *Upgrade Path*: Move pipeline execution to a dedicated Web Worker to prevent minor UI stutter on low-end mobile devices during cold initialization.
2. **Quantized ONNX Weights (`q8`)**:
   - *Current*: `fp32` ONNX model (~150MB transfer).
   - *Upgrade Path*: Ship quantized 8-bit weights (~85MB) to reduce initial download time on mobile data.
3. **EXIF Orientation Normalization**:
   - *Current*: Handled by standard browser HTMLImageElement loading.
   - *Upgrade Path*: Add EXIF tag extraction to preserve compass bearing if users opt in.
