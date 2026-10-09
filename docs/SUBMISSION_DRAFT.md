---
title: Shadeprint: An Open-Weight Field Notebook for Discovering Neighborhood Shade
published: false
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

---

## What I Built

Most modern technology trains us to stare into screens. We look at map navigators to see where to turn; we scroll algorithmic feeds while waiting at crosswalks; we converse with text chatbots that know nothing of the pavement beneath our feet.

**Shadeprint** is built on the opposite philosophy: **the screen should be the shortest part of the experience.**

Shadeprint is an open-weight AI field notebook designed to get people off their couches, out of their doors, and walking through their neighborhoods to observe the physical micro-geography of shade.

In hot urban environments, the difference between a tree-shaded canopy sidewalk and an exposed concrete street can transform a neighborhood from inviting to uninhabitable. Yet we rarely pause to observe the light and shadow defining our daily walking paths.

### The 3-Stop Walking Flow
1. **Step Outside**: You open Shadeprint, put on your walking shoes, and step outside for a 10-minute stroll around your block.
2. **Document Three Places**: Whenever you reach a notable pedestrian location—a leafy residential street, a commercial storefront arcade, or a sun-drenched intersection—you take a single photo.
3. **Local Open-Weight AI Analysis**: Directly inside your mobile browser, an open-weight CLIP vision model (`Xenova/clip-vit-base-patch32`) classifies visible shade conditions using zero-shot contrastive vision embeddings.
4. **Human Ground-Truth**: The AI suggests what it sees (Tree Shade, Built Shade, or Exposed Sunlight). You verify or correct it with what you actually experienced.
5. **Put Your Phone in Your Pocket**: The app tells you to pocket your phone, look up, and continue walking.
6. **Synthesized Field Report**: After documenting three stops, Shadeprint compiles a clean, printable field report contrasting shaded versus exposed spots along your walking route.

---

## Demo

- **Live Application URL**: [INSERT_LIVE_DEMO_URL_HERE] *(e.g. deployed on Render / Vercel / GitHub Pages)*
- **Interactive Sample Mode**: If you are testing this at your desk before stepping outside, Shadeprint features a built-in **Sample Mode** with bundled, realistic pedestrian test photography. It executes the exact same on-device open-weight vision model pipeline in real-time.
- **Walkthrough Video**: [INSERT_VIDEO_DEMO_URL_HERE]

### Outdoor Field Trial Evidence (To Be Captured on Walk)
1. **Photo 1**: Tree-lined sidewalk canopy photo + AI suggestion confirmation.
2. **Photo 2**: Storefront awning or building shadow photo + ground-truth verification.
3. **Photo 3**: Open sunny crosswalk or park plaza photo + observation review.
4. **Final Report Export**: PDF / Printout of the completed 3-stop field synthesis.
*(Insert field photos here: [INSERT_FIELD_TEST_PHOTOS])*

---

## Code

- **GitHub Repository**: [INSERT_GITHUB_REPO_URL_HERE]
- **License**: MIT License
- **Open-Weight Model**: [`Xenova/clip-vit-base-patch32`](https://huggingface.co/Xenova/clip-vit-base-patch32) (Apache 2.0)

---

## How I Built It

Shadeprint is engineered around client-side open-source AI, requiring zero cloud servers, zero proprietary vision APIs, and zero user accounts.

### 1. The Open-Weight AI Core
Instead of making costly round-trip API calls to closed models like GPT-4o or Claude Vision, Shadeprint runs OpenAI's Contrastive Language-Image Pre-Training (**CLIP ViT-B/32**) directly inside the browser using **Hugging Face Transformers.js v3** and **ONNX Web Runtime (WebAssembly SIMD)**:

```ts
import { pipeline } from '@huggingface/transformers';

const classifier = await pipeline(
  'zero-shot-image-classification',
  'Xenova/clip-vit-base-patch32'
);

const result = await classifier(imageDataUrl, [
  'a pedestrian walkway shaded by trees and green foliage',
  'a pedestrian walkway shaded by buildings, walls, or awnings',
  'an open pedestrian walkway exposed to direct sunlight with little or no shade'
]);
```

Once downloaded on first load, the ~150MB ONNX model weights are cached in the browser's native **Cache API**, enabling rapid sub-300ms inference completely offline.

### 2. Technical Honesty & Uncertainty Guardrails
A photograph cannot measure thermodynamic microclimates, ambient air temperature, or UV index. Shadeprint never pretends to do so:
- **Visible Shade Only**: We classify observable physical shade types (Tree Canopy, Built Structure, or Direct Sun).
- **Relative Uncertainty Metrics**: CLIP similarity scores are relative cosine similarities, not calibrated probabilities. If top scores are within 10 percentage points of each other, Shadeprint explicitly flags relative uncertainty and elevates human observation over the AI.
- **Audit Trail**: User corrections never overwrite the model suggestion; both are preserved in the session record.

### 3. Local Privacy & Persistence
- Photographs never touch a remote server. All resizing and pixel processing occurs on an HTML5 Canvas.
- Completed walks and observation records are stored locally in browser `IndexedDB`.
- Users can clear all local observations with one click.

### 4. Minimalist Botanical UI
Built with React 19, TypeScript (strict mode), and Tailwind CSS, the visual design blends an environmental field notebook with modern typographic restraint: warm parchment paper tones, deep forest greens, rich charcoal body text, and sunlit ochre accents.

---

## Why Does Open Innovation Matter?

Open-source and open-weight AI are not just philosophical ideals—for an application like Shadeprint, **open innovation is what makes the product technically and ethically viable**:

1. **True Offline Independence on the Trail**:
   Outdoor walkers frequently encounter spotty cellular coverage or dead zones under dense tree cover. A proprietary API fails immediately when you lose signal. With open-weight models cached locally in the browser, Shadeprint runs full vision inference anywhere on Earth without an internet connection.
2. **Absolute Privacy of the Physical World**:
   When you photograph your neighborhood street, your home perimeter, or your children's walking route to school, you should not be forced to upload those images to a corporate cloud database for model training. Open weights allow the intelligence to travel to the user's device, rather than forcing the user's private data to travel to a server.
3. **Zero Marginal Compute Cost**:
   Every classification runs on the user's local hardware via WebAssembly. There are no API tokens, no monthly SaaS tiers, and no risk of a project breaking when an API key expires. Anyone in any neighborhood can run this tool for free, forever.
4. **Transparent, Verifiable Weights**:
   Proprietary APIs change their weights, alignments, and endpoints without warning. Open-weight models like CLIP provide deterministic, verifiable, and auditable performance that researchers and community builders can inspect and trust.

---

## My Agent Session

This application was engineered with pair-programming assistance from **Antigravity** (Google DeepMind agentic coding system):
- [INSERT_DEVRELAY_OR_AGENT_SESSION_LINK_HERE]

---

## Prize Categories

- **Hacktoberfest Week 1: Touch Grass (Main Challenge)**:
  Shadeprint is built from the ground up to get people off their screens and into the physical environment, using locally running open-weight vision models to notice neighborhood shade.
- **Best Use of Render** *(if deployed on Render)*:
  Static web frontend hosted on Render Static Sites.

---

*Take a short walk. Find three places. See your everyday streets differently.*
