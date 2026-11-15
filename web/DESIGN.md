# FloodSight — Design tokens (DESIGN.md)

Single source of truth for the visual language. These tokens are mirrored in
`web/tailwind.config.ts`; change them here first, then keep the Tailwind config in
sync. Lions Roar Labs palette · Material 3 "Tonal Elevation" structure · Inter type.

## Colour

### Surfaces (tonal elevation, light)
| Token | Hex | Use |
|---|---|---|
| `surface` | `#f8f9ff` | App background |
| `surface-dim` | `#cbdbf5` | Dimmed background |
| `surface-container-lowest` | `#ffffff` | Cards, sheets |
| `surface-container-low` | `#eff4ff` | Inset fields, chips |
| `surface-container` | `#e5eeff` | Raised container |
| `surface-container-high` | `#dce9ff` | Hover container |
| `surface-container-highest` | `#d3e4fe` | Highest elevation |
| `surface-variant` | `#d3e4fe` | Muted surface |
| `on-surface` | `#0b1c30` | Primary text |
| `on-surface-variant` | `#44474e` | Secondary text |
| `inverse-surface` / `inverse-on-surface` | `#213145` / `#eaf1ff` | Inverted blocks |
| `outline` / `outline-variant` | `#74777f` / `#c4c6cf` | Borders, dividers |
| `line` | `#e2e8f0` | Hairline rules |

### Brand / roles
| Token | Hex | Use |
|---|---|---|
| `primary` | `#001026` | Deep navy ink |
| `primary-container` | `#0b2545` | Headlines, primary buttons |
| `on-primary` | `#ffffff` | Text on primary |
| `primary-fixed` / `primary-fixed-dim` | `#d5e3ff` / `#b1c7f0` | Accents on dark |
| `secondary` | `#0060a8` | Links, active nav, data accent |
| `secondary-container` | `#47a1ff` | Flood layer / chart series |
| `secondary-fixed` / `-dim` | `#d3e4ff` / `#a2c9ff` | Soft accents |
| `tertiary-container` | `#002a25` | Teal AI-assistant accent |
| `tertiary-fixed` / `-dim` | `#71f8e4` / `#4fdbc8` | Assistant highlights |

### Status
| Token | Hex | Meaning |
|---|---|---|
| `error` / `on-error` | `#ba1a1a` / `#ffffff` | Critical / peak flood |
| `error-container` / `on-error-container` | `#ffdad6` / `#93000a` | Critical surfaces |
| `warning-container` / `-border` / `-text` | `#fff7ed` / `#fdba74` / `#c2410c` | Pending / caution |
| `safe-container` / `-border` / `-text` | `#f0fdfa` / `#99f6e4` / `#0f766e` | Receding / OK |

## Typography (Inter)
Scale is semantic — use the named sizes, never raw px.

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `display-stat` / `-mobile` | 3rem / 2.25rem | 700 | Hero KPI numbers |
| `headline-lg` / `-mobile` | 2rem / 1.5rem | 700 | Page titles |
| `headline-md` | 1.25rem | 600 | Section heads |
| `headline-sm` | 1.125rem | 600 | Card heads |
| `body-lg/md/sm` | 1.125 / 1 / 0.875rem | 400 | Body copy |
| `label-lg/md/sm` | 0.875 / 0.75 / 0.6875rem | 600/500/600 | Labels, eyebrows, pills |

## Elevation (water-tinted shadows, navy base `rgba(11,37,69,·)`)
`card` → resting · `hover` → interactive · `hud` → floating controls · `modal` → dialogs/assistant · `nav` → bottom bar.

## Radius
`DEFAULT`/`md` 0.5rem · `lg` 1rem · `xl` 1.5rem.

## Motion
`fade-up` (240ms ease-out) for entering content · `pulse-ring` (2.4s) for live/hotspot dots · `radar-spin` (40s) for the loading satellite motif. Respect `prefers-reduced-motion`.

## Principles
1. **Honesty first.** Never render a not-yet-loaded value as `0`/`0 mm`; show `—` or a *Pending* pill (see `common.pending`, `map.rainNone`). Zeros from missing context layers "are not results" (spec §8).
2. **Bilingual by default.** Every string goes through `react-i18next`; EN and FR keys stay at parity.
3. **Mobile-first.** 16px side gutters, 44px min tap targets, bottom tabs on phones / side panel on desktop.
4. **Dark navy data canvas.** Maps sit on `#0b1620`; flood = cyan (`secondary-container`), permanent water = deep navy, hotspots = red→orange→blue by frequency.
