---
name: Financial Intelligence Editorial
colors:
  surface: '#f9f9ff'
  surface-dim: '#d7dae3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3fd'
  surface-container: '#ebeef7'
  surface-container-high: '#e5e8f2'
  surface-container-highest: '#dfe2ec'
  on-surface: '#181c23'
  on-surface-variant: '#4d4351'
  inverse-surface: '#2d3138'
  inverse-on-surface: '#eef0fa'
  outline: '#7f7383'
  outline-variant: '#d0c2d3'
  surface-tint: '#843ab4'
  primary: '#4e0078'
  on-primary: '#ffffff'
  primary-container: '#6a1b9a'
  on-primary-container: '#da9cff'
  inverse-primary: '#e4b5ff'
  secondary: '#8e3d95'
  on-secondary: '#ffffff'
  secondary-container: '#fa9dfd'
  on-secondary-container: '#7a2982'
  tertiary: '#442b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#623f00'
  on-tertiary-container: '#deac66'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f4d9ff'
  primary-fixed-dim: '#e4b5ff'
  on-primary-fixed: '#2f004b'
  on-primary-fixed-variant: '#6a1b9a'
  secondary-fixed: '#ffd6fb'
  secondary-fixed-dim: '#fea9ff'
  on-secondary-fixed: '#36003d'
  on-secondary-fixed-variant: '#73227c'
  tertiary-fixed: '#ffddb3'
  tertiary-fixed-dim: '#f2bd76'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#f9f9ff'
  on-background: '#181c23'
  surface-variant: '#dfe2ec'
  market-gain: '#0E8A54'
  market-gain-subtle: '#E8F5EE'
  market-loss: '#D32F2F'
  market-loss-subtle: '#FDECEC'
  surface-canvas: '#F4F4F6'
  surface-card: '#FFFFFF'
  border-subtle: '#E2E4E8'
  border-strong: '#C8CBD0'
  text-primary: '#1E2229'
  text-secondary: '#58606E'
  text-muted: '#8A92A0'
  brand-accent-glow: '#F3E5F5'
typography:
  headline-xl:
    fontFamily: Open Sans
    fontSize: 38px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Open Sans
    fontSize: 26px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Open Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Open Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Open Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Open Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Open Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Open Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Open Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Open Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Open Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Open Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
  ticker-numeric:
    fontFamily: Open Sans
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 0.75rem
  gutter-lg: 2rem
  margin: 2rem
  margin-sm: 1rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system defines a premier bilingual financial intelligence and market news portal. Balancing institutional authority with high-speed market clarity, the identity conveys trust, sharp analytical insight, and contemporary editorial prestige. It serves retail investors, market professionals, and regional wealth builders seeking dependable, nuanced equity coverage in both Malayalam and English.

The overarching design aesthetic fuses **Corporate / Modern** precision with **Editorial Minimalism**:
- **Clarity & Trust:** Crisp typography, calibrated information hierarchy, and restrained framing eliminate cognitive fatigue during volatile market cycles.
- **Bilingual Fluidity:** Seamless script alignment that respects the distinct rhythm and baseline metrics of regional scripts alongside Latin financial numerals and tickers.
- **Data-Driven Restraint:** Vivid emerald gains and crimson drawdowns are isolated strictly to market metrics and movement indicators, ensuring the authoritative brand purple remains focal for identity, actions, and key transitions.

## Colors

The palette balances high-prestige editorial depth with distinct financial signals:

- **Primary (`#6A1B9A`) & Secondary (`#903E97`):** The signature imperial purple anchors main interactions, brand badges, active navigation indicators, and primary call-to-actions, establishing an unmistakable market identity without visual aggression.
- **Neutral Core (`#1E2229`):** Deep charcoal/slate provides optimal reading contrast across body and headline typography, softening the harsh contrast of pure black against pure white.
- **Surfaces (`#F4F4F6` and `#FFFFFF`):** A dual-tier white and stone system separates background canvas from elevated story cards, sidebar filters, and data widgets.
- **Market Semantic Pairings:**
  - `market-gain` (`#0E8A54`) and `market-gain-subtle` (`#E8F5EE`): Precise institutional green for advancing tickers, sector breakouts, and upside margins.
  - `market-loss` (`#D32F2F`) and `market-loss-subtle` (`#FDECEC`): Crisp red for falling stocks, downside volume, and cautionary notices.
  - Semantic colors must never be used for navigational chrome or non-financial UI states to prevent false visual alarms.

## Typography

The typographical foundation optimizes editorial cadence and numeric legibility:

- **Bilingual Hierarchy:** When rendering Malayalam editorial copy, font family cascades directly to `Noto Sans Malayalam` with an intentional +15% line-height compensation (`lineHeight: 1.6` on body levels) to accommodate conjunct consonants and vowel signs without clipping ascenders or descenders.
- **Headlines & Leads:** Bold, tightly spaced weights command respect on front-page market events, utilizing high-density visual presence while preserving immediate scannability.
- **Financial & Data Styling:** Tickers, index points, and percentage deltas utilize tabular figures (`font-variant-numeric: tabular-nums`) to ensure vertical alignment throughout real-time market updates.

## Layout & Spacing

The portal adheres to an asymmetric editorial 12-column grid balanced for high content density:

- **Desktop Layout (≥ 1200px):**
  - **Left Rail (Cols 1–3):** Sticky utility navigation, sector categories, publication archives, and date filter drawers.
  - **Main Editorial Feed (Cols 4–9):** Primary breaking stories, hero market analyses, and deep-dive editorial pieces.
  - **Right Rail (Cols 10–12):** Live index tickers, trending equities, IPO pipelines, and exchange watchlists.
- **Tablet Layout (768px – 1199px):**
  - Left navigation collapses into an off-canvas drawer or top horizontal chip bar.
  - 8-column grid prioritizing news flow (Cols 1–5) and secondary market summaries (Cols 6–8).
- **Mobile Layout (< 768px):**
  - Single column with full-width cards, edge-to-edge media cards framed by a 16px safe margin, and horizontal scrolling market ticker strips at the top viewport edge.

## Elevation & Depth

Visual hierarchy favors clean structural planar layers over heavy skeuomorphic shadows:

- **Level 0 (Canvas Base):** Rendered in `#F4F4F6`. Acts as the structural framing canvas.
- **Level 1 (Card & Content Blocks):** Pure `#FFFFFF` surfaces bounded by a crisp 1px hairline border (`#E2E4E8`). Resting components use subtle ambient depth: `box-shadow: 0 1px 3px rgba(30, 34, 41, 0.04), 0 1px 2px rgba(30, 34, 41, 0.02)`.
- **Level 2 (Interactive Floating / Hover State):** Story cards on mouse-over elevate with `box-shadow: 0 8px 20px -4px rgba(30, 34, 41, 0.08), 0 4px 8px -2px rgba(30, 34, 41, 0.04)` alongside a subtle border transition to `#C8CBD0`.
- **Level 3 (Modals, Overlays, Floating Menus):** High-priority panels feature `box-shadow: 0 20px 32px -8px rgba(30, 34, 41, 0.16)` with subtle backdrop blur (`backdrop-filter: blur(8px)`) over content dimmers.

## Shapes

The system implements a controlled **Soft (`1`)** geometry that conveys institutional seriousness with modern refinement:

- **Cards & Data Modules:** Standard 4px (`rounded`) corner radius. This keeps dense financial grids crisp and avoids wasted corner whitespace.
- **Buttons & Filter Inputs:** Standard 4px radius (`rounded`) to match container borders.
- **Badges & Market Tags:** Full pill-shaped rounding (`9999px`) to create an intentional organic contrast against the rectangular architectural grid, instantly drawing the eye to story tags and live stock changes.

## Components

### Buttons
- **Primary:** Solid `#6A1B9A` background with `#FFFFFF` text. Padding: `10px 20px` for standard controls. Hover state transitions to `#7B1FA2` with a 1px upward translateY.
- **Secondary / Outline:** Transparent background with 1.5px solid `#1E2229` or `#6A1B9A`, matching font color. Hover fills with 6% alpha tint of the border color.
- **Ghost:** Text-only buttons (`#6A1B9A`) paired with inline arrows or icons for story navigation ("Read Full Story").

### Badges & Category Chips
- **Category Pill:** Bordered or solid tinted pill (`11px` uppercase label), such as `MARKET NEWS` or `INVESTMENT INSIGHTS`. Set in `#6A1B9A` border with 5% purple background fill.
- **Market Status Chips:**
  - *Gain:* `#E8F5EE` fill, `#0E8A54` text, prepended with a `▲` delta indicator.
  - *Loss:* `#FDECEC` fill, `#D32F2F` text, prepended with a `▼` delta indicator.

### Editorial & Story Cards
- **Structure:** Clean white surface container with 24px inner padding. Image aspect ratios maintain a calibrated 16:9 or 2:1 editorial framing with 4px corner rounding.
- **Header Line:** Timestamp in muted secondary typography (`OCT 8, 2026`) aligned opposite the category pill badge.
- **Footer Strip:** Quick bookmarking, social share actions, and a prominent reading lead with clear visual separation from the body lead.

### Market Ticker Tape
- Fixed or scrolling single-line bar with `#FFFFFF` background and bottom border `#E2E4E8`.
- Contains compact stock quotes: Symbol (`#1E2229`, bold) + Current Price + Colored Pill Delta (`+1.45%` in green, `-0.82%` in red).

### Navigation Rails & Filter Drawers
- Vertical category items include 3px left-edge active border accents in `#6A1B9A` with tinted purple backgrounds (`#F3E5F5`).
- Form controls for calendar date ranges and drop-down selectors use 1px slate borders, high-contrast text, and native keyboard navigation focus rings in `#6A1B9A`.