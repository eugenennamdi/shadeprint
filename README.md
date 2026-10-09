# Shadeprint

> **Discover the shade hiding in your neighborhood.**
>
> An open-weight AI field notebook for discovering, documenting, and comparing the shade along everyday walking environments. Built for the **Hacktoberfest 2026 Open-Source AI Challenge, Week 1: Touch Grass**.

---

## 🌿 The Vision

In hot urban environments, the difference between a tree-shaded sidewalk and an exposed concrete street can define whether a neighborhood feels walkable or punishing. Yet most digital technology pulls our eyes toward glass screens and keeps people indoors.

**Shadeprint does the opposite.**

Our core design principle: **The screen should be the shortest part of the experience.**

Shadeprint asks you to step outside, take a 10-minute walk around your block, photograph three pedestrian spots, and let an open-weight vision model classify visible shade conditions directly in your browser. After three stops, Shadeprint generates an exportable, printable field report contrasting the shaded and sun-exposed sections of your route.

---

## ✨ Key Features

- **3-Stop Field Walk Flow**: Minimal screen time. Take a photo, confirm what you observe, put your phone in your pocket, and keep walking.
- **Client-Side Open-Weight Vision AI**: Runs zero-shot image classification locally using `Xenova/clip-vit-base-patch32` via Hugging Face Transformers.js and ONNX Web Runtime.
- **Human-in-the-Loop Ground Truth**: The AI provides a relative similarity suggestion; the human observer confirms or corrects the ground truth. User overrides are preserved and honored.
- **100% Privacy by Design**: Zero cloud image uploads, zero analytics trackers, and zero required user accounts or geolocation permissions. All records persist locally in IndexedDB.
- **Offline Capable**: Once the open-weight model is cached by your browser, all vision inference and notebook features function with no internet connection.
- **Technical Honesty**: Explicitly avoids misleading microclimate or UV claims. We classify *visible physical shade characteristics*, not ambient temperatures or canopy percentages.
- **Exportable Field Reports**: Export your synthesized neighborhood walk to PDF / print, or copy a clean plain-text log.
- **Sample Demonstration Mode**: Includes bundled, realistic pedestrian test imagery so evaluators and judges can test the full AI inference pipeline immediately without going outside first.

---

## 🧠 Open-Weight Model Architecture

| Property | Details |
| :--- | :--- |
| **Model** | `Xenova/clip-vit-base-patch32` |
| **Architecture** | Vision Transformer (ViT-B/32) Contrastive Language-Image Pre-training |
| **Runtime** | `@huggingface/transformers` v3.3.3 + ONNX Web Runtime (WASM SIMD) |
| **Task** | Zero-shot image classification |
| **Execution** | 100% Client-side (in-browser WebAssembly) |
| **Model License** | Apache 2.0 (Open Weights) |
| **Weight Size** | ~150 MB (cached in browser Cache API on first run) |
| **Inference Latency** | ~150 ms – 300 ms on modern mobile / desktop CPU |

### Candidate Classification Prompts
1. **Tree Shade** (`tree_shade`): `"a pedestrian walkway shaded by trees and green foliage"`
2. **Built Shade** (`built_shade`): `"a pedestrian walkway shaded by buildings, walls, or awnings"`
3. **Exposed** (`exposed`): `"an open pedestrian walkway exposed to direct sunlight with little or no shade"`
4. **Unclear / Mixed** (`unclear`): Dappled, transitional, or ambiguous lighting conditions requiring human verification.

---

## 🔒 Privacy Model

- **No Remote Image Uploads**: Photographs never leave your device. All pixels are read via HTML Canvas and processed directly by the WebAssembly ONNX runtime.
- **No Remote AI APIs**: No OpenAI, Anthropic, or proprietary vision APIs. No API keys required.
- **No User Accounts or Telemetry**: No sign-ups, no cookies, no third-party tracking scripts.
- **Local Persistence**: Sessions and observations are stored in browser `IndexedDB`. Users can clear all saved data at any time with one click in the "About" dialog.

---

## ⚠️ Technical Limitations & Honesty

- **Visual vs. Thermal**: A photograph records visible light and shadows, not thermodynamic metrics. Shadeprint does not claim to measure ambient temperature, radiant surface heat, or UV index.
- **Lighting Conditions**: Twilight, heavy overcast conditions, or night walks cannot be reliably classified by visual shade models.
- **Relative Scores**: CLIP similarity scores are relative contrastive similarities, not calibrated probabilities. When top candidate scores are close (< 10% delta), Shadeprint flags relative uncertainty.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### Installation & Local Run
```bash
# Clone the repository
git clone https://github.com/your-username/shadeprint.git
cd shadeprint

# Install dependencies
npm install

# Run Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### Running Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```
The compiled static assets are output to `dist/`, ready for zero-config static hosting (Vercel, Netlify, Render, GitHub Pages, or Cloudflare Pages).

---

## 🛠 Tech Stack

- **Framework**: Vite + React 19 + TypeScript (strict mode)
- **Styling**: Tailwind CSS + custom environmental palette
- **Icons**: Lucide React
- **AI / Vision**: `@huggingface/transformers`
- **Storage**: Native Browser `IndexedDB`
- **Testing**: Vitest

---

## 📄 License & Attribution

- **Shadeprint Application**: [MIT License](LICENSE)
- **CLIP Vision Model**: [OpenAI CLIP / Xenova](https://huggingface.co/Xenova/clip-vit-base-patch32) under Apache 2.0 license.
