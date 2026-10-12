# Bio animations — Interactive 3D Human Anatomy Suite

A cutting-edge interactive 3D human anatomical atlas and clinical education platform built with **React 19**, **Three.js**, **@react-three/fiber**, and **@react-three/drei**.

---

## Features & Capabilities

-  **Realistic 3D Organ Models (GLB)**:
  - ** The Human Heart**: 3D GLB cardiac model with dual-pulse systolic/diastolic contraction, chambers, valves, great vessels, and coronary arteries.
  - ** Respiratory System**: Official NIH Visible Human Project 3D GLB lungs with trachea, bronchial arborization, and alveolar fields.
  - ** The Liver & Gallbladder**: Official NIH Visible Human Project 3D GLB liver with anatomical lobes, falciform ligament, and biliary system.
  - ** The Human Brain**: Segmented high-detail 3D GLB brain with cortical hemispheres, sulci/gyri, cerebellum, and brainstem.
  - ** Renal & Excretory System**: Official NIH Visible Human Project 3D GLB kidney with cortex, medulla, renal columns, and hilum.

-  **Real-Time Cross-Section Clipping**:
  - Anatomical slice planes: **Sagittal (X)**, **Coronal (Y)**, and **Transverse (Z)**.
  - Dynamic slice depth slider revealing internal anatomical morphology.

-  **Clinical Medical Aesthetic**:
  - Sleek surgical obsidian and titanium slate design system.
  - Precision clinical cyan and emerald accents — zero generic/AI pastel purple gradients.
  - Screen-space projected 3D callout pins with connector lines.

-  **Web Audio Physiological Sound Engine**:
  - Procedural cardiac sound synthesis: S1 (*lub*) & S2 (*dub*) heart tones synchronized dynamically with heart rate (BPM).
  - Procedural respiratory sound synthesis: Soft tidal breath murmur.
  - UI acoustic feedback on structure selection.

-  **Cinematic Viewport Tools & Shaders**:
  - **Visual Modes**: Realistic Physical Textures, Translucent X-Ray Mode, and Diagnostic Hologram Wireframe.
  - **View Presets**: Anterior, Posterior, Left, Right, Superior, and Isometric angles.
  - **Cardiac Rate Control**: Dynamic BPM slider (50 to 140 BPM) with Resting (60), Normal (75), and Elevated (110) presets.
  - **Camera Focus**: Smooth animated camera targeting when selecting any structure.
  - ** HD Snapshot Export**: One-click high-resolution PNG download for study notes and presentations.

-  **Clinical Educational Modules**:
  - Comprehensive structure details: Anatomical Description, Physiological Function, Clinical Pearls, and Board Exam Facts.
  - Organ-specific quiz modules with scoring, instant rationales, and performance assessments.
  - Full-text search across all anatomical parts and categories.

- **REST API & Resilient Client**:
  - Express backend on port `5001` with endpoints for organs, structures, search, quizzes, and stats.
  - Automatic local fallback for standalone offline operation.

---

##  Quick Start

### 1. Install Dependencies
```bash
cd medatlas3d
npm install
```

### 2. Start Development Server & API
```bash
# In the workspace root:
npm run dev

# Or in the medatlas3d folder:
npm run dev:all
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Toggle auto-rotation |
| `M` | Toggle physiological audio |
| `X` | Toggle cross-section clipping plane |
| `P` | Toggle animation pause / play |
| `1` - `5` | Switch organ system (Heart, Lungs, Liver, Brain, Kidneys) |
| `Esc` | Clear structure selection / Close modal |
| `?` | Show keyboard shortcuts guide |
