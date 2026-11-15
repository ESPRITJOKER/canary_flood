---
name: FloodSight Douala
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#495f82'
  primary: '#001026'
  on-primary: '#ffffff'
  primary-container: '#0b2545'
  on-primary-container: '#778db2'
  inverse-primary: '#b1c7f0'
  secondary: '#0060a8'
  on-secondary: '#ffffff'
  secondary-container: '#47a1ff'
  on-secondary-container: '#003663'
  tertiary: '#00120f'
  on-tertiary: '#ffffff'
  tertiary-container: '#002a25'
  on-tertiary-container: '#009d8d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#b1c7f0'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#314769'
  secondary-fixed: '#d3e4ff'
  secondary-fixed-dim: '#a2c9ff'
  on-secondary-fixed: '#001c38'
  on-secondary-fixed-variant: '#004881'
  tertiary-fixed: '#71f8e4'
  tertiary-fixed-dim: '#4fdbc8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-stat:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.03em
  display-stat-mobile:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-lg:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system serves a mission-critical public information utility: communicating immediate flood inundation risks, SAR (Synthetic Aperture Radar) analysis, and civic safety data to residents, municipal authorities, and emergency response teams across Douala, Cameroon.

The aesthetic philosophy balances **Scientific Precision** with **Humanitarian Urgency**:
- **Tone:** Authoritative, tranquil under pressure, highly legible, and civic-minded.
- **Visual Style:** Modern Information Architecture paired with Tonal Elevation. It blends crisp cartographic HUD patterns with approachable, human-readable editorial clarity (supporting French and English AI-generated briefings).
- **Core Emotional Response:** Clarity over panic. Residents must feel oriented, informed, and capable of decisive action without sensory overload or technical confusion.

## Colors

The palette establishes immediate situational clarity through environmental and hydrological metaphors.

- **Primary (`#0B2545` - Deep Navy):** Represents municipal authority, deep ocean baseline, and foundational structure. Anchors navigation headers, typography baselines, and high-emphasis controls.
- **Secondary (`#1E88E5` - Water Blue):** Represents active radar flood extents, hydrological layers, and interactive water data points.
- **Tertiary (`#14B8A6` - Soft Teal):** Represents sensor equilibrium, safe passage corridors, and verified sensor pings.
- **Neutrals & Surfaces:**
  - Base Canvas: `#F8FAFC` (Slate 50)
  - Sub-surface / Inactive Controls: `#F1F5F9` (Slate 100)
  - Card & Container Surface: `#FFFFFF` (Pure White)
  - Borders & Grid Lines: `#E2E8F0` (Slate 200)
  - Secondary Text / Meta: `#64748B` (Slate 500)
- **Hazard & Alert Tiers:**
  - Critical Inundation / Evacuation Alert: `#EF4444` (Red 500) with surface tint `#FEF2F2`
  - Warning / Surface Runoff Risk: `#F97316` (Orange 500) with surface tint `#FFF7ED`
  - Safe / Decreasing Flood Waters: `#10B981` (Emerald 500)

## Typography

Inter powers all typographic expressions to ensure neutral legibility across low-resolution mobile devices, varying sunlight conditions in the field, and dual-language phrasing (French/English).

- **Data Metrics:** `display-stat` is reserved exclusively for numerical sensor readouts, surface water percentages, and rainfall depth gauges. Numerals must be configured with tabular figures (`font-variant-numeric: tabular-nums`) to prevent layout shifting during real-time telemetry updates.
- **Bilingual Considerations:** French phrases often require 15–25% more horizontal width than English. Layouts pairing `label-md` or `headline-sm` must avoid fixed-width clipping and provide wrapping flexibility.
- **Readability Rules:** Body text must strictly use `#0B2545` for primary content and `#64748B` for meta captions. Avoid light font weights below 400.

## Layout & Spacing

The layout model pairs a full-viewport geospatial canvas with overlay panels and structured informational drawers.

- **Grid Architecture:**
  - **Desktop (1024px+):** Fluid 12-column layout with 24px gutters. The map runs full-bleed behind a fixed 380px or 420px floating analytic sidebar drawer on the left/right.
  - **Tablet (768px - 1023px):** 8-column layout. Split layout or collapsible half-sheet presentation.
  - **Mobile (&lt;768px):** 4-column layout with 16px horizontal margins. Map fills the background; interaction relies on an expandable bottom sheet modal and a fixed bottom tab navigation.
- **Content Hierarchy:** Critical alert banners sit anchored at the top of the view stack. Key metrics rely on a strict 8pt rhythm using `space-xs` through `space-2xl`.

## Elevation & Depth

Visual hierarchy uses physical sheet elevations combined with soft, natural water-tinted ambient shadows to isolate telemetry panels from satellite imagery.

- **Level 0 (Flat / Basemap):** Raw NISAR radar imagery, street overlays, and hydrological vector layers.
- **Level 1 (Card / Container):** Background `#FFFFFF`, border `1px solid #E2E8F0`, shadow `0 1px 3px 0 rgba(11, 37, 69, 0.04), 0 1px 2px -1px rgba(11, 37, 69, 0.04)`.
- **Level 2 (Hover / Floating Cards):** Shadow `0 4px 6px -1px rgba(11, 37, 69, 0.07), 0 2px 4px -2px rgba(11, 37, 69, 0.05)`.
- **Level 3 (Floating HUD / Side Panels / Bottom Sheets):** Shadow `0 10px 15px -3px rgba(11, 37, 69, 0.08), 0 4px 6px -4px rgba(11, 37, 69, 0.04)`.
- **Level 4 (Emergency Overlays / Modals):** Shadow `0 20px 25px -5px rgba(11, 37, 69, 0.12), 0 8px 10px -6px rgba(11, 37, 69, 0.06)`.
- **Backdrop Blurs:** Glassmorphism is restrained to floating navigation pills and map controls (`backdrop-filter: blur(8px); background: rgba(255, 255, 255, 0.88)`).

## Shapes

The design uses a clean, friendly geometry that counters the coldness of radar charts:
- Standard interactive elements (inputs, normal buttons, standard badges) employ `0.5rem` (`rounded-md`).
- Primary information cards, risk metrics summaries, and floating HUDs use `1rem` (`rounded-xl` equivalent in scale level 2) or `1.5rem` (`rounded-2xl` for large mobile sheets).
- Status indicators, alert tags, and floating action triggers use full pill radiuses (`9999px`).

## Components

### Buttons
- **Primary:** Background `#0B2545`, text `#FFFFFF`, hover `#1E88E5`. 44px min-height for touch accessibility in wet conditions.
- **Secondary / Radar Toggle:** Background `#F1F5F9`, text `#0B2545`, border `1px solid #E2E8F0`, hover background `#E2E8F0`.
- **Emergency Action:** Background `#EF4444`, text `#FFFFFF`, hover `#DC2626`.

### Badges & Data Pills
- **Flood Alert Hotspot Pill:** Pill-shaped (`rounded-full`), padding `4px 12px`.
  - *Critical:* Background `#FEF2F2`, border `1px solid #FCA5A5`, text `#DC2626` with pulsing dot indicator.
  - *Warning:* Background `#FFF7ED`, border `1px solid #FDBA74`, text `#C2410C`.
  - *Normal / Monitored:* Background `#F0FDFA`, border `1px solid #99F6E4`, text `#0F766E`.
- **Language Switcher Pill:** Segmented control container (`#F1F5F9`), active tab `#FFFFFF` with Level 1 shadow, font weight 600.

### Metric Cards
- Background `#FFFFFF`, border `1px solid #E2E8F0`, corner radius `1rem` (`rounded-xl`).
- Internal layout: Top-level category label (`label-sm` in `#64748B`), centered numeric impact reading (`display-stat` in `#0B2545`), bottom secondary badge showing 24h trend delta.

### AI Explanation Cards (French / English)
- Background gradient subtle tint: linear from `#FFFFFF` to `#F8FAFC`.
- Left accent indicator: 3px solid `#14B8A6`.
- Header featuring spark icon, language toggle, and timestamp of the latest NISAR satellite pass.

### Navigation Architecture
- **Desktop Top Navigation:** Fixed height 64px, pure white surface with bottom border `#E2E8F0`. Houses the brand logo, live district status dropdown, language switch (FR/EN), and satellite pass indicator.
- **Mobile Bottom Tab Bar:** Fixed height 64px, `#FFFFFF` with top border `#E2E8F0` and `backdrop-filter: blur(12px)`. 4 primary destinations: Map (Carte), Alerts (Alertes), Analysis (Analyses), Guide (Conseils). Minimum touch target: 48px.