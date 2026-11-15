# Grouped front-end screens + absolute diffs

Generated non-destructively: every source `screen.png` and `code.html` was
read only. Copies live in `screens/`, all diff output lives here.

## Screens found

| # | Folder | Copy | Size |
| - | ------ | ---- | ---- |
| 1 | `landing_overview/screen.png` | `screens/01_landing_overview.png` | 380x1600 |
| 2 | `main_map_dashboard/screen.png` | `screens/02_main_map_dashboard.png` | 510x1600 |
| 3 | `before_after_comparison/screen.png` | `screens/03_before_after_comparison.png` | 413x1600 |
| 4 | `persistent_hotspots/screen.png` | `screens/04_persistent_hotspots.png` | 320x1600 |

`floodsight_douala/` holds only `DESIGN.md`, so it contributes no screenshot.

## Files

- `montage_all_screens.png` - labelled contact sheet of all screens.
- `diff_<screen>_vs_landing_overview.png` - absolute difference, grayscale, 0 = identical.
- `diff_<screen>_vs_landing_overview_x4.png` - same diff amplified 4x to reveal faint change.
- `comparison_<screen>_vs_landing_overview.png` - reference | screen | diff, side by side.
- `diff_metrics.json` / `diff_metrics.csv` - quantitative summary.
- `make_group_and_diffs.py` - the script that produced all of it (re-runnable).

## How the diff is computed

Each screen is compared one-to-one with `landing_overview` on the **overlapping region only**:
both images are top-left aligned and cropped to the narrower width. Nothing is scaled or
resampled, so the result is an exact pixel comparison. `delta = |ref - screen|` per channel;
the diff PNG stores the max channel delta.

## Summary

| Screen vs landing_overview | Mean abs diff | Max | Pixels changed (>8/255) |
| --- | --- | --- | --- |
| `main_map_dashboard` | 72.078 | 255 | 67.6% |
| `before_after_comparison` | 66.947 | 255 | 64.7% |
| `persistent_hotspots` | 58.599 | 255 | 62.78% |

Because these are five different app screens (not five versions of one screen),
high differences are expected: the diff maps layout/content disagreement, not regressions.
