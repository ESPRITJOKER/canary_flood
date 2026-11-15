#!/usr/bin/env python3
"""
Group the FloodSight front-end screenshots and compute absolute-difference
images against a common reference.

Read-only with respect to the source folders: originals are copied, never
moved, edited or overwritten. Everything is written under this directory.

Layout produced:
  <out>/screens/                      copies of every screen.png, ordered + named
  <out>/montage_all_screens.png       labelled contact sheet (all screens)
  <out>/diff_<name>_vs_reference.png  per-pixel |a - b|, grayscale
  <out>/diff_<name>_vs_reference_x4.png  same diff, amplified x4 for visibility
  <out>/diff_metrics.json / .csv      quantitative summary
  <out>/README.md                     what was made and how to read it

Widths differ between screens (320-510 px), so comparisons are made on the
overlapping region only: top-left aligned, cropped to the narrowest width.
No resampling is done - that keeps the diff an exact pixel comparison.
"""

from __future__ import annotations

import csv
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/home/thementalist/Downloads/canaryflood")
OUT = ROOT / "_grouped_frontend"
SCREENS_DIR = OUT / "screens"

REFERENCE = "landing_overview"
DIFF_THRESHOLD = 8  # pixel counts as "changed" above this abs delta (0-255)

ORDER = [
    "landing_overview",
    "main_map_dashboard",
    "before_after_comparison",
    "persistent_hotspots",
]

TITLES = {
    "landing_overview": "Landing / Overview",
    "main_map_dashboard": "Main Map Dashboard",
    "before_after_comparison": "Before / After Comparison",
    "persistent_hotspots": "Persistent Hotspots",
}

LABEL_H = 34
GUTTER = 16
BG = (24, 24, 27)
FG = (238, 238, 240)
ACCENT = (56, 189, 248)

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def discover() -> list[tuple[str, Path]]:
    """Screens in canonical order, then any extra folder that grows a screen.png."""
    found: list[tuple[str, Path]] = []
    for name in ORDER:
        p = ROOT / name / "screen.png"
        if p.is_file():
            found.append((name, p))
    known = set(ORDER)
    for p in sorted(ROOT.glob("*/screen.png")):
        name = p.parent.name
        if name not in known and not name.startswith("_"):
            found.append((name, p))
    return found


def copy_screens(found: list[tuple[str, Path]]) -> dict[str, Path]:
    SCREENS_DIR.mkdir(parents=True, exist_ok=True)
    copies: dict[str, Path] = {}
    for i, (name, src) in enumerate(found, start=1):
        dst = SCREENS_DIR / f"{i:02d}_{name}.png"
        shutil.copy2(src, dst)  # copy, originals untouched
        copies[name] = dst
    return copies


def build_montage(copies: dict[str, Path], found: list[tuple[str, Path]]) -> Path:
    imgs = [Image.open(copies[name]).convert("RGB") for name, _ in found]
    target_h = max(im.height for im in imgs)

    width = GUTTER
    for im in imgs:
        width += im.width + GUTTER
    height = LABEL_H + target_h + GUTTER * 2

    sheet = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(sheet)
    f_label = font(FONT_BOLD, 20)
    f_note = font(FONT_REG, 15)

    x = GUTTER
    for (name, _), im in zip(found, imgs):
        draw.rectangle([x, GUTTER, x + im.width - 1, GUTTER + LABEL_H - 6], fill=ACCENT)
        draw.text((x + 8, GUTTER + 5), TITLES.get(name, name), font=f_label, fill=BG)
        draw.text(
            (x, GUTTER + LABEL_H + 2),
            f"{name}  ·  {im.width}x{im.height}",
            font=f_note,
            fill=FG,
        )
        sheet.paste(im, (x, GUTTER + LABEL_H + 24))
        x += im.width + GUTTER

    out = OUT / "montage_all_screens.png"
    sheet.save(out, optimize=True)
    return out


def diff_against_reference(
    name: str, ref: Image.Image, img: Image.Image
) -> tuple[Image.Image, dict]:
    w = min(ref.width, img.width)
    h = min(ref.height, img.height)
    a = np.asarray(ref.crop((0, 0, w, h)), dtype=np.int16)
    b = np.asarray(img.crop((0, 0, w, h)), dtype=np.int16)

    delta = np.abs(a - b)
    gray = delta.max(axis=2).astype(np.uint8)

    changed = int((gray > DIFF_THRESHOLD).sum())
    total = gray.size
    metrics = {
        "screen": name,
        "reference": REFERENCE,
        "compared_region_px": total,
        "width_compared": w,
        "height_compared": h,
        "mean_abs_diff": round(float(gray.mean()), 3),
        "max_abs_diff": int(gray.max()),
        "pct_pixels_changed": round(100.0 * changed / total, 2),
        "diff_threshold": DIFF_THRESHOLD,
    }
    return Image.fromarray(gray, mode="L"), metrics


def build_comparison_sheet(name: str, ref: Image.Image, img: Image.Image, gray: Image.Image) -> Path:
    """Reference | screen | amplified diff, side by side, on one canvas."""
    w = min(ref.width, img.width)
    h = min(ref.height, img.height)
    panels = [
        (f"REFERENCE · {REFERENCE}", ref.crop((0, 0, w, h))),
        (f"SCREEN · {name}", img.crop((0, 0, w, h))),
        ("ABS DIFF x4 (black = identical)", gray.convert("RGB")),
    ]

    width = GUTTER
    for _, p in panels:
        width += p.width + GUTTER
    height = LABEL_H + h + GUTTER * 2

    sheet = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(sheet)
    f_label = font(FONT_BOLD, 17)
    f_note = font(FONT_REG, 13)

    x = GUTTER
    for label, panel in panels:
        draw.rectangle([x, GUTTER, x + panel.width - 1, GUTTER + LABEL_H - 8], fill=ACCENT)
        draw.text((x + 8, GUTTER + 4), label, font=f_label, fill=BG)
        draw.text(
            (x, GUTTER + LABEL_H - 2),
            f"{panel.width}x{panel.height} comparable region",
            font=f_note,
            fill=FG,
        )
        sheet.paste(panel, (x, GUTTER + LABEL_H + 16))
        x += panel.width + GUTTER

    out = OUT / f"comparison_{name}_vs_{REFERENCE}.png"
    sheet.save(out, optimize=True)
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    found = discover()
    if not found:
        raise SystemExit("no screen.png found")
    if REFERENCE not in dict(found):
        raise SystemExit(f"reference screen missing: {REFERENCE}")

    copies = copy_screens(found)
    montage = build_montage(copies, found)

    ref_img = Image.open(copies[REFERENCE]).convert("RGB")
    rows: list[dict] = []
    for name, _ in found:
        if name == REFERENCE:
            continue
        img = Image.open(copies[name]).convert("RGB")
        gray, metrics = diff_against_reference(name, ref_img, img)

        stem = f"diff_{name}_vs_{REFERENCE}"
        gray.save(OUT / f"{stem}.png", optimize=True)

        amplified = np.clip(np.asarray(gray, dtype=np.int16) * 4, 0, 255).astype(np.uint8)
        Image.fromarray(amplified, mode="L").save(OUT / f"{stem}_x4.png", optimize=True)

        build_comparison_sheet(name, ref_img, img, gray)

        rows.append(metrics)

    rows.sort(key=lambda r: r["mean_abs_diff"], reverse=True)

    (OUT / "diff_metrics.json").write_text(
        json.dumps(
            {
                "reference": REFERENCE,
                "note": (
                    "Absolute per-pixel difference on the overlapping region "
                    "(top-left aligned, cropped to the narrowest width, no resampling). "
                    "Diff images are grayscale (max channel delta); '_x4' versions are "
                    "multiplied by 4 for visibility. 0 = identical pixel."
                ),
                "screens": [
                    {"name": n, "file": str(copies[n].relative_to(OUT)), "size": Image.open(copies[n]).size}
                    for n, _ in found
                ],
                "comparisons": rows,
            },
            indent=2,
        )
        + "\n"
    )

    with (OUT / "diff_metrics.csv").open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    write_readme(found, rows, montage)

    print(f"screens grouped : {len(found)} -> {SCREENS_DIR}")
    print(f"montage         : {montage.name}")
    for r in rows:
        print(
            f"diff {r['screen']:<24} mean={r['mean_abs_diff']:>7.3f} "
            f"max={r['max_abs_diff']:>3} changed={r['pct_pixels_changed']:>5.2f}%"
        )


def write_readme(found: list[tuple[str, Path]], rows: list[dict], montage: Path) -> None:
    lines = [
        "# Grouped front-end screens + absolute diffs",
        "",
        "Generated non-destructively: every source `screen.png` and `code.html` was",
        "read only. Copies live in `screens/`, all diff output lives here.",
        "",
        "## Screens found",
        "",
        "| # | Folder | Copy | Size |",
        "| - | ------ | ---- | ---- |",
    ]
    for i, (name, src) in enumerate(found, start=1):
        size = Image.open(src).size
        lines.append(
            f"| {i} | `{name}/screen.png` | `screens/{i:02d}_{name}.png` | {size[0]}x{size[1]} |"
        )
    lines += [
        "",
        "`floodsight_douala/` holds only `DESIGN.md`, so it contributes no screenshot.",
        "",
        "## Files",
        "",
        f"- `{montage.name}` - labelled contact sheet of all screens.",
        f"- `diff_<screen>_vs_{REFERENCE}.png` - absolute difference, grayscale, 0 = identical.",
        f"- `diff_<screen>_vs_{REFERENCE}_x4.png` - same diff amplified 4x to reveal faint change.",
        f"- `comparison_<screen>_vs_{REFERENCE}.png` - reference | screen | diff, side by side.",
        "- `diff_metrics.json` / `diff_metrics.csv` - quantitative summary.",
        "- `make_group_and_diffs.py` - the script that produced all of it (re-runnable).",
        "",
        "## How the diff is computed",
        "",
        f"Each screen is compared one-to-one with `{REFERENCE}` on the **overlapping region only**:",
        "both images are top-left aligned and cropped to the narrower width. Nothing is scaled or",
        "resampled, so the result is an exact pixel comparison. `delta = |ref - screen|` per channel;",
        "the diff PNG stores the max channel delta.",
        "",
        "## Summary",
        "",
        f"| Screen vs {REFERENCE} | Mean abs diff | Max | Pixels changed (>{DIFF_THRESHOLD}/255) |",
        "| --- | --- | --- | --- |",
    ]
    for r in rows:
        lines.append(
            f"| `{r['screen']}` | {r['mean_abs_diff']} | {r['max_abs_diff']} "
            f"| {r['pct_pixels_changed']}% |"
        )
    lines += [
        "",
        "Because these are five different app screens (not five versions of one screen),",
        "high differences are expected: the diff maps layout/content disagreement, not regressions.",
        "",
    ]
    (OUT / "README.md").write_text("\n".join(lines))


if __name__ == "__main__":
    main()
