---
name: Clinical Academic Medical System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444651'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006a63'
  on-secondary: '#ffffff'
  secondary-container: '#99efe5'
  on-secondary-container: '#006f67'
  tertiary: '#410070'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f0d9c'
  on-tertiary-container: '#cc93ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#9cf2e8'
  secondary-fixed-dim: '#80d5cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#00504a'
  tertiary-fixed: '#f1dbff'
  tertiary-fixed-dim: '#dfb7ff'
  on-tertiary-fixed: '#2d0050'
  on-tertiary-fixed-variant: '#661aa3'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Noto Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 48px
  headline-xl-mobile:
    fontFamily: Noto Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg:
    fontFamily: Noto Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 36px
  headline-sm:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 30px
  vignette-text:
    fontFamily: Noto Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Noto Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 22px
  option-label:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  data-metric:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

### Personality & Demeanor
This design system is engineered for medical students, clinical interns, and practicing physicians preparing for high-stakes licensing exams (e.g., SMLE, IFOM, USMLE). The aesthetic is grounded in clinical gravitas, intellectual discipline, and supreme legibility. It deliberately rejects casual gamification, juvenile reward loops, loud gradients, and hyper-saturated aesthetics. 

The interface reflects the rigor of an elite academic medical center: calm, deliberate, authoritative, and optically rested. The goal is sustained visual stamina during uninterrupted 2-to-4 hour question banks (QBank) and timed examination blocks.

### Design Movement: Modern Clinical Precision
The visual language pairs high-density academic typography with architectural order. It utilizes low-contrast surface divisions, disciplined data-density, and structured information grouping. Complex clinical vignettes, laboratory values, and differential diagnoses are delivered with immediate hierarchy. Every pixel and micro-interaction respects cognitive load, reducing decision fatigue under timed pressure.

### Directionality & Cultural Grounding
Designed natively for Right-to-Left (RTL) reading patterns with bi-directional fluency. Arabic medical syntax takes typographic precedence, seamlessly handling inline Latin medical nomenclature, pharmacological notations, and metric laboratory values without baseline shifts, awkward word-wraps, or broken optical flow.

## Colors

### Visual Hierarchy & Palette Intent
The default theme is a calibrated, low-strain light mode optimized for extended diagnostic reading and clinical vignettes.

- **Primary (`#1E3A8A`)**: Deep Medical Navy. Anchors primary structural frames, active states, examination timer headers, and major progression indicators. Conveys institutional authority and clinical steadiness.
- **Secondary (`#0F766E`)**: Clinical Teal. Applied to clinical reasoning callouts, physiological rationale accordions, and secondary actionable utilities.
- **Tertiary (`#6B21A8`)**: Flagged & Review Purple. Dedicated exclusively to tagged questions, marked review status, and clinical differential bookmarking.
- **Neutral Surface & Background**:
  - Main Canvas: `#F8FAFC` (Slate 50) and `#F1F5F9` (Slate 100) provide an anti-glare, non-fatiguing baseline.
  - Active Cards & Question Panes: Pure White (`#FFFFFF`) with disciplined borders (`#E2E8F0`).
  - Text: High-contrast Slate `#0F172A` (900) for body and stems, `#334155` (700) for clinical data/stems, and `#64748B` (500) for peripheral metadata.

### Strict Semantic Dual-Coding (WCAG 2.2 AA / AAA Compliant)
Color is never the sole communicator of outcome, accuracy, or state. All diagnostic states mandate **Color + Iconography + Explicit Linguistic Labels**:
- **Correct / Rationale Accepted**: `#15803D` (Text/Border), `#DCFCE7` (Surface tint), accompanied by a checkmark badge and affirmative confirmation copy.
- **Incorrect / Distractor Triggered**: `#B91C1C` (Text/Border), `#FEE2E2` (Surface tint), paired with an alert cross badge and corrective diagnostic breakdown.
- **Warning / Ambiguity / High Yield**: `#B45309` (Text/Border), `#FEF3C7` (Surface tint), paired with an alert triangle.
- **Unanswered / Information**: `#1D4ED8` (Text/Border), `#DBEAFE` (Surface tint), indicating clinical neutral inquiry.

## Typography

### Typographic Architecture & RTL Bi-Directionality
The primary typographic engine uses unified geometric clarity capable of harmonizing Arabic script with embedded Latin terms (ICD-10 classifications, drug names, gene notations).

- **Arabic Stem & Clinical Vignettes**: Line-height is intentionally expanded to `1.75 - 1.85` for extended body copy (`vignette-text`) to accommodate Arabic diacritics and complex character stacking without optical collision.
- **Latin & Medical Shorthand (`Inter`)**: Deployed for lab value indicators (e.g., `PaO2/FiO2`, `mg/dL`, `mEq/L`), exam countdown chronometers, statistical percentiles, and answer stem anchors (A, B, C, D, E).
- **Mixed Content Behavior**: Inline Latin terms within Arabic sentences must inherit identical optical vertical alignment, utilizing fallback stacks that prevent baseline jump or unnatural kerning anomalies.

## Layout & Spacing

### Grid & Layout Philosophy
The layout operates on a strict 8pt grid system (with a 4pt sub-grid for micro-alignments such as icons, badges, and inline values).

- **Desktop (>= 1280px)**: 
  - Structural asymmetric 2-column or 3-column workspace with a fixed right-hand navigation drawer (native RTL).
  - Main question workspace: 65% width (ideal line length between 60-75 Arabic characters for optimum saccadic movement).
  - Collapsible left-hand contextual pane: 35% width for lab reference values, medical calculators, and diagnostic rationales.
- **Tablet (768px - 1279px)**: 
  - Single primary reading pane with slide-over drawers for lab references and test navigation matrices.
- **Mobile (< 768px, baseline 390px)**:
  - Full-width stacked layout with strict 16px lateral margins.
  - Interactive touch zones maintain a minimum clickable area of 44x44px.
  - Sticky bottom exam bar containing forward/backward navigation, bookmark flag, and answer submission trigger.

### Spatial Discipline
Whitespace functions as clinical separation. Dense medical case data is partitioned using modular spacing (`space-md` through `space-xl`) rather than heavy graphic dividers, keeping visual focus anchored on analytical diagnostic work.

## Elevation & Depth

### Elevation Strategy: Flat Architectural Tiers
The design system avoids heavy shadows, floating visual gimmickry, and colored atmospheric glows. Instead, visual planes are established using surface color steps and crisp structural borders:

- **Level 0 (Base Canvas)**: Background `#F8FAFC`. Zero elevation, zero shadow.
- **Level 1 (Card & Content Blocks)**: White `#FFFFFF` surface with a crisp 1px `#E2E8F0` border and an ultra-subtle ambient drop: `0px 1px 2px rgba(15, 23, 42, 0.04)`.
- **Level 2 (Active Distractor Choices & Floating Action Bars)**: `0px 4px 8px -2px rgba(15, 23, 42, 0.06), 0px 2px 4px -2px rgba(15, 23, 42, 0.04)`. Border shifts to `#CBD5E1`.
- **Level 3 (Diagnostic Drawers, Lab Reference Sheets, Overlays)**: `0px 12px 24px -4px rgba(15, 23, 42, 0.08), 0px 4px 8px -4px rgba(15, 23, 42, 0.03)`. Backed by a high-legibility scrim (`rgba(15, 23, 42, 0.4)` with 2px backdrop blur).

## Shapes

### Shape Language
Geometry is conservative, structured, and clinically precise. Roundedness Level 1 defines the visual footprint:
- Base components (Answer cards, vignette containers, input fields): `rounded` (0.25rem / 4px to 0.375rem / 6px).
- Structural containers (Modals, lab sheets, large diagnostic panels): `rounded-lg` (0.5rem / 8px).
- Interactive indicators (Status badges, question navigation grid circles): `rounded-full` (strictly restricted to high-density index tokens and circular progress discs).

No soft pill-shaped buttons or bubbly aesthetics are permitted within the core testing interface.

## Components

### Question Item / Distractor Option Cards
- **Architecture**: Horizontal RTL flex layout. The choice indicator (A, B, C, D, E) sits right-aligned in a 32x32px square container (`#F1F5F9`, border `#CBD5E1`). The question text flows naturally to the left with `vignette-text` line-height.
- **Default State**: Background `#FFFFFF`, border 1px solid `#E2E8F0`.
- **Hover / Focus State**: Background `#F8FAFC`, border 1.5px solid `#1E3A8A`.
- **Selected State**: Background `#EFF6FF`, border 2px solid `#1E3A8A`. Option index token switches to `#1E3A8A` fill with white text.
- **Revealed Correct State**: Background `#DCFCE7`, border 2px solid `#15803D`. Trailing icon indicates clinical checkmark.
- **Revealed Incorrect State**: Background `#FEE2E2`, border 2px solid `#B91C1C`, accompanied by strike-through typography options for distractor elimination.

### Buttons & Action Triggers
- **Primary Exam Action (Confirm, Submit Block)**: Solid `#1E3A8A`, high-contrast white text, 8px radius, minimum height 44px (mobile: 48px). No external gradients.
- **Secondary Action (Flag Question, Previous)**: Outlined `#E2E8F0`, text `#334155`, hover background `#F1F5F9`.
- **Review / Critical Trigger**: Subtle tertiary border with `#6B21A8` icon and text tint.

### Clinical Lab Reference Sheets & Values Panel
- Tabular numeric alignment with explicit Latin monospaced numerals (`Inter`).
- Categorized by physiological systems (Hematology, Serum Electrolytes, Renal, Cerebrospinal).
- Interactive quick-search input with immediate filtering and clear highlight pins for reference range benchmarks.

### Clinical Rationales & Explanations (Post-Submission)
- Structured segmented accordions:
  1. **Key Educational Objective**: High-yield takeaway highlighted with a 3px right-border accent (`#1E3A8A`).
  2. **Why the Correct Answer is Correct**: `#15803D` text banner header with step-by-step pathophysiological rationale.
  3. **Why the Distractors are Incorrect**: Exhaustive breakdown for each alternative answer choice.
  4. **Referenced Literature**: Academic citation tags linking directly to standard medical texts.

### RTL Mirroring Rules
- Chevron arrows and progression meters invert along the horizontal axis (Previous points right `→`, Next points left `←`).
- Question navigation grids index from right to left, top to bottom.
- Pinned toolbars (e.g., Strike-through tool, Highlighter, Calculator) anchor consistently to the clinical reading direction.