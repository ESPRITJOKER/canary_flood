#!/usr/bin/env python3
"""
Generate the FloodSight front-end placeholder data set (web/public/data).

IMPORTANT: this is *sample* data for building and demoing the interface before
notebook 02 is re-run with ESA WorldCover, rainfall and DSWx-S1. Per-pass flood
areas are sampled inside the range the real pipeline reported on 14 Nov 2026
(0.04-0.29 km2). Every value carries meta.data_status = "sample" and the app
shows a banner until web_v2/ output replaces these files unchanged in shape.

Run: python3 tools/make_sample_data.py
"""

from __future__ import annotations

import json
import math
import random
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "public" / "data"

# Douala bbox (9.60, 3.95, 9.80, 4.15) -> Leaflet [[south, west], [north, east]]
BOUNDS = [[3.95, 9.60], [4.15, 9.80]]
SIZE = 512
SS = 2  # supersampling factor for smooth coastlines

# 11 NISAR passes, track 58 / frame 4 / ascending, 18 Jun - 28 Oct 2026.
PASSES = [
    ("2026-06-18", 0.17, 42.0, 1.9, -13.6),
    ("2026-06-30", 0.29, 96.0, 2.4, -13.9),
    ("2026-07-12", 0.12, 31.0, 1.6, -13.5),
    ("2026-07-24", 0.05, 18.0, 1.2, -13.3),
    # 24-day gap: 24 Jul -> 17 Aug (no pass over Douala)
    ("2026-08-17", 0.08, 64.0, 2.0, -13.4),
    ("2026-08-29", 0.14, 88.0, 2.2, -13.7),
    ("2026-09-10", 0.07, 22.0, 1.5, -13.2),
    ("2026-09-22", 0.10, 47.0, 1.8, -13.6),
    ("2026-10-04", 0.16, 71.0, 2.1, -13.8),
    ("2026-10-16", 0.21, 55.0, 2.0, -13.7),
    ("2026-10-28", 0.29, 103.0, 2.3, -13.9),
]

PLACES = [
    # name, admin, lat, lon
    ("Akwa", "Douala I", 4.0500, 9.7000),
    ("Bonanjo", "Douala I", 4.0430, 9.6870),
    ("Bonabéri", "Douala IV", 4.0700, 9.6600),
    ("Bépanda", "Douala VII", 4.0600, 9.7300),
    ("Makèpè", "Douala V", 4.0800, 9.7500),
    ("Ndokoti", "Douala III", 4.0400, 9.7200),
    ("Deido", "Douala I", 4.0650, 9.6900),
    ("Bassa", "Douala III", 4.0330, 9.7400),
    ("Logbaba", "Douala V", 4.0500, 9.7700),
    ("Ndogbong", "Douala V", 4.0700, 9.7400),
]

# Hotspot clusters, in pixel space fraction (x, y) inside the sample raster.
HOTSPOTS = [
    {
        "id": "makepe-missoke",
        "name": "Makèpè Missoke",
        "district": "Douala V",
        "lat": 4.0785,
        "lon": 9.7515,
        "passes_flooded": 10,
        "peak_km2": 0.041,
        "cause": {
            "en": "Tongo Bassa overflow and silted culverts",
            "fr": "Débordement du Tongo Bassa et buses envasées",
        },
        "hint": {"en": "Chronic: drains blocked before the pass", "fr": "Chronique : drains bouchés avant le passage"},
        "px": (0.66, 0.44),
    },
    {
        "id": "mabanda",
        "name": "Mabanda / Bonabéri",
        "district": "Douala IV",
        "lat": 4.0690,
        "lon": 9.6625,
        "passes_flooded": 9,
        "peak_km2": 0.033,
        "cause": {
            "en": "Tidal backflow into unpaved channels",
            "fr": "Reflux de marée dans des canaux non revêtus",
        },
        "hint": {"en": "High-tide sensitive", "fr": "Sensible à la marée haute"},
        "px": (0.30, 0.52),
    },
    {
        "id": "bepanda",
        "name": "Bépanda",
        "district": "Douala VII",
        "lat": 4.0595,
        "lon": 9.7270,
        "passes_flooded": 8,
        "peak_km2": 0.024,
        "cause": {
            "en": "Low basin, slow runoff clearance",
            "fr": "Bassin bas, évacuation lente",
        },
        "hint": {"en": "Retains water ~48 h after rain", "fr": "Retient l'eau ~48 h après la pluie"},
        "px": (0.54, 0.58),
    },
    {
        "id": "ndokoti",
        "name": "Ndokoti",
        "district": "Douala III",
        "lat": 4.0395,
        "lon": 9.7195,
        "passes_flooded": 7,
        "peak_km2": 0.018,
        "cause": {
            "en": "Culvert overflow onto a commercial artery",
            "fr": "Débordement de buse sur un axe commercial",
        },
        "hint": {"en": "Traffic cut-off risk on the RN3", "fr": "Risque de coupure sur la RN3"},
        "px": (0.46, 0.66),
    },
    {
        "id": "akwa-nord",
        "name": "Akwa Nord",
        "district": "Douala I",
        "lat": 4.0530,
        "lon": 9.7015,
        "passes_flooded": 5,
        "peak_km2": 0.012,
        "cause": {
            "en": "Flash runoff during >100 mm rain days",
            "fr": "Ruissellement éclair les jours > 100 mm",
        },
        "hint": {"en": "Recedes within ~12 h", "fr": "Se résorbe en ~12 h"},
        "px": (0.42, 0.48),
    },
]

LIMITS = [
    {
        "id": "cadence",
        "title": {
            "en": "One radar pass every 12 days",
            "fr": "Un passage radar tous les 12 jours",
        },
        "body": {
            "en": "Douala's floods are mostly short urban flash floods in streets and drains that can clear within hours. A 12-day revisit often lands before or after the peak, so a pass with little flood water does not mean the city stayed dry.",
            "fr": "Les crues de Douala sont surtout des crues urbaines rapides, dans les rues et les drains, qui peuvent s'évacuer en quelques heures. Un passage tous les 12 jours tombe souvent avant ou après le pic : un passage avec peu d'eau ne signifie pas que la ville est restée au sec.",
        },
    },
    {
        "id": "streets",
        "title": {"en": "Flooded streets are hard for radar", "fr": "Les rues inondées sont difficiles pour le radar"},
        "body": {
            "en": "A thin sheet of water in a street scatters radar in several directions instead of away from the satellite. It can look brighter, not darker. FloodSight keeps those pixels in a separate, less certain 'possible flooded streets' layer.",
            "fr": "Une fine lame d'eau dans une rue diffuse le radar dans plusieurs directions au lieu de l'éloigner du satellite. Elle peut apparaître plus claire, pas plus sombre. FloodSight garde ces pixels dans une couche séparée et moins certaine : « rues possiblement inondées ».",
        },
    },
    {
        "id": "tide",
        "title": {"en": "Tide, waves and boats", "fr": "Marée, vagues et bateaux"},
        "body": {
            "en": "The Wouri estuary is tidal. Wind, waves and boats made water look bright in the first pipeline version, creating 2-7 km² of false flood inside the river. Version 2 masks permanent water, adds a 60 m shoreline buffer and drops patches under 1 ha.",
            "fr": "L'estuaire du Wouri est soumis à la marée. Le vent, les vagues et les bateaux rendaient l'eau claire dans la première version, créant 2 à 7 km² de faux positif dans le fleuve. La version 2 masque l'eau permanente, ajoute un tampon de 60 m et supprime les taches de moins de 1 ha.",
        },
    },
    {
        "id": "mangroves",
        "title": {"en": "Mangroves flood naturally", "fr": "Les mangroves s'inondent naturellement"},
        "body": {
            "en": "Wouri mangroves fill and empty with the tide, so their water is excluded (WorldCover class 95) and reported separately as tidal mangrove water, not as flood on land.",
            "fr": "Les mangroves du Wouri se remplissent et se vident avec la marée : leur eau est exclue (classe 95 de WorldCover) et comptée à part comme eau de mangrove, pas comme inondation sur terre.",
        },
    },
    {
        "id": "terrain",
        "title": {"en": "Only low, flat ground", "fr": "Uniquement les terrains bas et plats"},
        "body": {
            "en": "Flood candidates must sit below 20 m of elevation and on slopes under 5°. Hillside runoff and water above that line are not counted, even when a street there is visibly flooded.",
            "fr": "Les candidats doivent se trouver sous 20 m d'altitude et sur des pentes inférieures à 5°. Le ruissellement de versant et l'eau au-dessus de cette limite ne sont pas comptés, même si une rue y est visiblement inondée.",
        },
    },
    {
        "id": "patch",
        "title": {"en": "Small patches are removed", "fr": "Les petites taches sont supprimées"},
        "body": {
            "en": "Flood patches smaller than 1 hectare are dropped to limit speckle noise, so a single flooded courtyard or a short stretch of drain will not appear.",
            "fr": "Les taches de moins de 1 hectare sont supprimées pour limiter le bruit de chatoiement : une cour inondée ou un court tronçon de drain n'apparaîtra pas.",
        },
    },
    {
        "id": "threshold",
        "title": {"en": "A flood pixel must be 3 dB darker", "fr": "Un pixel inondé doit être 3 dB plus sombre"},
        "body": {
            "en": "Open water is detected when a pixel is at least 3 dB darker than its own seasonal normal, inside a -24 to -14 dB window. Weaker darkening (wet soil, damp roofs) is not counted as flood.",
            "fr": "L'eau libre est détectée quand un pixel est au moins 3 dB plus sombre que sa normale saisonnière, dans une fenêtre de -24 à -14 dB. Un assombrissement plus faible (sol humide, toits mouillés) n'est pas compté comme inondation.",
        },
    },
    {
        "id": "forecast",
        "title": {"en": "Detection, not forecasting", "fr": "Détection, pas prévision"},
        "body": {
            "en": "FloodSight shows where, when and how much water was observed on past passes, and where floods return. It does not predict the next flood: that needs rainfall forecasts, drainage models and years of history.",
            "fr": "FloodSight montre où, quand et combien d'eau a été observée lors des passages passés, et où les crues reviennent. Il ne prédit pas la prochaine crue : cela demande des prévisions de pluie, des modèles de drainage et des années d'historique.",
        },
    },
    {
        "id": "resolution",
        "title": {"en": "About 30 m per pixel", "fr": "Environ 30 m par pixel"},
        "body": {
            "en": "One pixel covers roughly 30 m on the ground, so a flooded block may be one or two pixels. The map is a screening tool for neighbourhoods, not a property-level record.",
            "fr": "Un pixel couvre environ 30 m au sol : un îlot inondé peut représenter un ou deux pixels. La carte sert à identifier des quartiers, pas à établir un relevé parcelle par parcelle.",
        },
    },
    {
        "id": "clouds",
        "title": {"en": "Clouds are not the problem — timing is", "fr": "Les nuages ne sont pas le problème, le calendrier oui"},
        "body": {
            "en": "Radar sees through monsoon cloud and at night, which is why it works in Douala in June-October. The limit is how often the satellite passes, not the weather.",
            "fr": "Le radar voit à travers les nuages de mousson et la nuit : c'est pourquoi il fonctionne à Douala de juin à octobre. La limite est la fréquence des passages, pas la météo.",
        },
    },
]


def rng(seed: int) -> random.Random:
    return random.Random(seed)


def blob(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float, rnd: random.Random, fill):
    """Irregular organic patch (polar random walk), in supersampled pixels."""
    pts = []
    steps = 28
    base = r * (0.65 + rnd.random() * 0.5)
    for i in range(steps):
        a = 2 * math.pi * i / steps
        wobble = 0.55 + 0.45 * math.sin(a * rnd.randint(2, 5) + rnd.random() * 3)
        rr = base * wobble * (0.85 + 0.3 * rnd.random())
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    draw.polygon(pts, fill=fill)


def estuary_mask(px: int) -> Image.Image:
    """Wavy Wouri-estuary band across the upper-middle of the sample raster."""
    m = Image.new("L", (px, px), 0)
    d = ImageDraw.Draw(m)
    pts_top, pts_bottom = [], []
    for i in range(0, px + 1, px // 64):
        x = i
        t = x / px
        y = px * (0.30 + 0.06 * math.sin(t * 5.2) + 0.03 * math.sin(t * 11.0))
        w = px * (0.035 + 0.02 * math.sin(t * 3.1 + 1.2))
        pts_top.append((x, y - w))
        pts_bottom.append((x, y + w))
    d.polygon(pts_top + list(reversed(pts_bottom)), fill=255)

    # two tributaries
    for cx, cy, r in [(0.36, 0.44, 0.05), (0.55, 0.40, 0.045), (0.70, 0.47, 0.035)]:
        d.line(
            [(px * cx, px * 0.33), (px * cx + px * 0.02, px * cy)],
            fill=255,
            width=int(px * 0.014),
        )
        d.ellipse(
            [px * cx - px * r, px * cy - px * r * 0.55, px * cx + px * r, px * cy + px * r * 0.55],
            fill=255,
        )
    return m


def save(img: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / name, optimize=True)


def make_layers() -> None:
    px = SIZE * SS
    water = estuary_mask(px)
    # permanent water layer
    perm = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    perm.paste((0, 16, 38, 210), mask=water)
    save(perm.resize((SIZE, SIZE), Image.LANCZOS), "permanent_water.png")

    land_mask = water.point(lambda v: 0 if v > 40 else 255)  # avoid drawing over the estuary

    for i, (date, km2, rain, tidal, thr) in enumerate(PASSES):
        rnd = rng(1000 + i * 17)
        layer = Image.new("RGBA", (px, px), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        # number of patches scales with reported flooded area
        n = max(1, int(round(km2 / 0.045)))
        for _ in range(n):
            h = HOTSPOTS[rnd.randrange(len(HOTSPOTS))]
            cx = px * (h["px"][0] + rnd.uniform(-0.06, 0.06))
            cy = px * (h["px"][1] + rnd.uniform(-0.05, 0.05))
            r = px * (0.018 + 0.030 * (km2 / 0.29) + rnd.uniform(0, 0.008))
            blob(d, cx, cy, r, rnd, (71, 161, 255, 235))
            blob(d, cx, cy, r * 0.55, rnd, (113, 248, 228, 235))

        # keep the mask outside permanent water + 60 m shoreline buffer (~1.5 px here)
        buf = water.filter(ImageFilter.MaxFilter(2 * int(px * 60 / 22000 * 2) + 1))
        keep = buf.point(lambda v: 0 if v > 0 else 255)
        layer.putalpha(Image.composite(layer.getchannel("A"), Image.new("L", (px, px), 0), keep))

        save(layer.resize((SIZE, SIZE), Image.LANCZOS), f"flood_{date}.png")

        # urban signal: unavailable until WorldCover is loaded -> transparent file
        save(Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0)), f"urban_signal_{date}.png")

    # hotspot frequency raster (teal -> blue -> orange -> red ramp)
    hot = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    ramp = {
        10: (239, 68, 68),
        9: (249, 115, 22),
        8: (234, 179, 8),
        7: (0, 96, 168),
        5: (71, 248, 228),
    }
    for h in HOTSPOTS:
        cx, cy = px * h["px"][0], px * h["px"][1]
        color = ramp.get(h["passes_flooded"], (0, 96, 168))
        r = px * (0.022 + 0.004 * h["passes_flooded"] / 10)
        glow = Image.new("RGBA", (px, px), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        for k in range(6, 0, -1):
            rr = r * (1 + 0.55 * k)
            alpha = int(30 + 22 * (6 - k))
            gd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(*color, alpha))
        hot = Image.alpha_composite(hot, glow)
    save(hot.resize((SIZE, SIZE), Image.LANCZOS), "hotspots.png")


def make_stats() -> None:
    dates = []
    for date, km2, rain, tidal, thr in PASSES:
        dates.append(
            {
                "date": date,
                "flooded_km2": km2,
                "urban_signal_km2": 0.0,
                "tidal_mangrove_water_km2": tidal,
                "water_threshold_db": thr,
                "rain_prev3d_mm": rain,
            }
        )

    neighbourhoods = []
    for i, (name, admin, lat, lon) in enumerate(PLACES):
        # each pass gets a small, plausible impact value per place
        for j, (date, km2, *_rest) in enumerate(PASSES):
            share = 0.16 + 0.10 * ((i * 3 + j * 5) % 7) / 6
            if (i + j) % 4 == 3:
                share *= 0.35
            neighbourhoods.append(
                {
                    "date": date,
                    "name": name,
                    "admin": admin,
                    "lat": lat,
                    "lon": lon,
                    "flooded_km2": round(km2 * share * 0.55, 4),
                    "place_radius_m": 1000,
                }
            )

    stats = {
        "meta": {
            "data_status": "sample",
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "product": "NISAR L2 GCOV, HH + HV, track 58 / frame 4 / ascending",
            "source": "Placeholder values inside the range reported by notebook 02 (0.04-0.29 km2). Replace with web_v2/ output; field names and types stay the same.",
            "pipeline_version": "v2 (sample shapes)",
            "aoi": "Douala, Cameroon",
        },
        "bounds": BOUNDS,
        "params": {
            "DROP_DB": 3.0,
            "BRIGHT_DB": 3.0,
            "DB_MIN": -24,
            "DB_MAX": -14,
            "JRC_PERMANENT": 0.5,
            "RADAR_PERMANENT": 0.8,
            "SHORE_BUFFER_M": 60,
            "MAX_ELEV_M": 20,
            "MAX_SLOPE_DEG": 5,
            "MIN_PATCH_M2": 10000,
            "PLACE_RADIUS_M": 1000,
            "PASSES": 11,
            "TRACK": 58,
            "FRAME": 4,
        },
        "dates": dates,
        "neighbourhoods": neighbourhoods,
        "hotspots": HOTSPOTS,
        "validation_dswx": [],
        "limits": LIMITS,
    }

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "stats.json").write_text(json.dumps(stats, indent=2, ensure_ascii=False) + "\n")
    (OUT / "bounds.json").write_text(json.dumps(BOUNDS) + "\n")


def main() -> None:
    make_layers()
    make_stats()
    total = sum(p[1] for p in PASSES)
    print(f"wrote {len(PASSES)} passes to {OUT}")
    print(f"peak flooded_km2 = {max(p[1] for p in PASSES)} | mean = {total/len(PASSES):.3f}")


if __name__ == "__main__":
    main()
