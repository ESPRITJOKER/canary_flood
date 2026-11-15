"""FloodSight v2 — change-based flood detection + export to the web data contract.

Paste into one Colab cell (after mounting Drive) or run:  python src/floodsight/detect_v2.py
Reads   : <ROOT>/nisar/gcov/track058_frame004_A/douala_<date>_HH_db.tif  (falls back to <ROOT>/db/)
          <ROOT>/static/*  (DEM, JRC occurrence, WorldCover)   — optional, skipped if missing
          <ROOT>/osm/*places*.geojson                         — optional
          <ROOT>/rainfall/douala_imerg_daily.csv               — optional
          <ROOT>/opera_dswx_s1/douala_<date>_dswx_wtr.tif      — optional
Writes  : <ROOT>/web_v2/  flood_<date>.png, urban_signal_<date>.png, permanent_water.png,
          hotspots.png, bounds.json, stats.json            (spec section 12.4)

Fix vs earlier runs: the Otsu threshold is CLIPPED to [DB_MIN, DB_MAX]; the old ~-9 dB
threshold came from the clip not being applied (and/or 20*log10 instead of 10*log10).
"""
import glob
import json
import os
import re
import warnings
from datetime import date as _date, timedelta
from pathlib import Path

import numpy as np
import rioxarray  # noqa: F401  (registers .rio)
import xarray as xr
from PIL import Image
from rasterio.enums import Resampling
from scipy import ndimage
from skimage.filters import threshold_otsu

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------- settings
ROOT = Path(os.environ.get("FLOODSIGHT_ROOT", "/content/drive/MyDrive/FloodSight/data"))
OUT = ROOT / "web_v2"
BBOX = (9.60, 3.95, 9.80, 4.15)          # west, south, east, north
WORK_CRS = "EPSG:32632"                   # UTM 32N: metres, for areas and buffers
RES_M = 20.0

P = dict(DROP_DB=3.0, BRIGHT_DB=3.0, DB_MIN=-24.0, DB_MAX=-14.0, JRC_PERMANENT=50,
         RADAR_PERMANENT=0.8, SHORE_BUFFER_M=60, MAX_ELEV_M=20, MAX_SLOPE_DEG=5,
         MIN_PATCH_M2=10_000, PLACE_RADIUS_M=1000, MEDIAN_PX=5, NORMAL_PCT=75)

LIMITS = [
    {"id": "revisit", "en": "NISAR passes over Douala every 12 days; short flash floods that drain within hours to a day are often missed.",
     "fr": "NISAR passe sur Douala tous les 12 jours ; les crues éclair qui se vident en quelques heures sont souvent manquées."},
    {"id": "streets", "en": "Flooded streets between buildings often look brighter, not darker, to radar; they appear only in the separate, less-certain 'possible flooded streets' layer.",
     "fr": "Les rues inondées entre les bâtiments paraissent souvent plus claires au radar ; elles figurent seulement dans la couche séparée « rues possiblement inondées »."},
    {"id": "tide", "en": "Rivers, the Wouri estuary, tidal mangroves and a 60 m shoreline buffer are excluded, so floods right at the water's edge are not counted.",
     "fr": "Les rivières, l'estuaire du Wouri, les mangroves et une bande de 60 m le long des rives sont exclus ; les crues en bord d'eau ne sont pas comptées."},
    {"id": "gap", "en": "There is a 24-day gap with no pass between 24 July and 17 August 2026.",
     "fr": "Aucun passage entre le 24 juillet et le 17 août 2026 (trou de 24 jours)."},
    {"id": "min_patch", "en": "Flood patches smaller than 1 hectare are removed to suppress radar speckle.",
     "fr": "Les zones inondées de moins d'un hectare sont supprimées pour limiter le bruit radar."},
    {"id": "detection", "en": "FloodSight detects and maps past floods; it does not forecast them.",
     "fr": "FloodSight détecte et cartographie les inondations passées ; il ne les prévoit pas."},
]


# ---------------------------------------------------------------- helpers
def log(*a):
    print("[floodsight]", *a, flush=True)


def first(patterns):
    for pat in patterns:
        hits = sorted(glob.glob(str(ROOT / pat), recursive=True))
        if hits:
            return hits[0]
    return None


def make_template():
    """Empty UTM grid covering the bbox at RES_M."""
    t = xr.DataArray(np.zeros((2, 2), "float32"), dims=("y", "x"),
                     coords={"y": [BBOX[3], BBOX[1]], "x": [BBOX[0], BBOX[2]]}).rio.write_crs("EPSG:4326")
    return t.rio.reproject(WORK_CRS, resolution=RES_M)


def load_on(path, tmpl, resampling=Resampling.bilinear):
    da = rioxarray.open_rasterio(path, masked=True).squeeze(drop=True).astype("float32")
    return da.rio.reproject_match(tmpl, resampling=resampling)


def to_db_if_linear(a):
    """Safety net: if values look like linear power (all >= 0, median < 1), convert with 10*log10."""
    finite = a[np.isfinite(a)]
    if finite.size and finite.min() >= 0 and np.median(finite) < 1:
        log("  input looked linear -> converting with 10*log10")
        return 10 * np.log10(np.clip(a, 1e-6, None))
    return a


def remove_small(mask, min_px):
    lab, n = ndimage.label(mask)
    if n == 0:
        return mask
    sizes = ndimage.sum(mask, lab, index=np.arange(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = sizes >= min_px
    return keep[lab]


def km2(mask):
    return round(float(mask.sum()) * RES_M * RES_M / 1e6, 4)


def save_png(mask_or_vals, tmpl, path, rgba=None, cmap=None):
    """Reproject a UTM layer to EPSG:4326 and save a transparent PNG for Leaflet."""
    da = tmpl.copy(data=mask_or_vals.astype("float32")).rio.write_nodata(np.nan)
    geo = da.rio.reproject("EPSG:4326", resampling=Resampling.nearest).values
    h, w = geo.shape
    img = np.zeros((h, w, 4), "uint8")
    if cmap is None:                                   # binary layer
        on = np.nan_to_num(geo) > 0
        img[on] = rgba
    else:                                              # count layer -> colour ramp
        v = np.nan_to_num(geo).astype(int)
        for k, colour in cmap.items():
            img[v >= k] = colour
    Image.fromarray(img, "RGBA").save(path, optimize=True)


def nearest_file(pattern_dir, d, max_days=3):
    best = None
    for f in glob.glob(str(pattern_dir / "*.tif")):
        m = re.search(r"(\d{4}-\d{2}-\d{2})", os.path.basename(f))
        if not m:
            continue
        gap = abs((_date.fromisoformat(m.group(1)) - _date.fromisoformat(d)).days)
        if gap <= max_days and (best is None or gap < best[0]):
            best = (gap, f, m.group(1))
    return best


# ---------------------------------------------------------------- 1. stack NISAR HH
def run():
    OUT.mkdir(parents=True, exist_ok=True)
    tmpl = make_template()
    hh_glob = os.environ.get("FLOODSIGHT_HH_GLOB")
    files = (sorted(glob.glob(hh_glob, recursive=True)) if hh_glob else []) \
        or sorted(glob.glob(str(ROOT / "nisar/gcov/track058_frame004_A/douala_*_HH_db.tif"))) \
        or sorted(glob.glob(str(ROOT / "db/*HH*db*.tif"))) \
        or sorted(glob.glob(str(ROOT / "**/*HH*.tif"), recursive=True))
    files = [f for f in files if "web" not in Path(f).parts]
    if not files:
        raise SystemExit(f"No HH GeoTIFFs found under {ROOT}. Set FLOODSIGHT_ROOT / FLOODSIGHT_HH_GLOB.")
    log(f"using {len(files)} HH files, e.g. {files[0]}")
    dates, raw = [], []
    for f in files:
        m = re.search(r"(\d{4}-\d{2}-\d{2}|\d{8})", os.path.basename(f))
        d = m.group(1)
        d = d if "-" in d else f"{d[:4]}-{d[4:6]}-{d[6:]}"
        dates.append(d)
        raw.append(to_db_if_linear(load_on(f, tmpl).values))
    order = np.argsort(dates)
    dates = [dates[i] for i in order]
    stack = np.stack([raw[i] for i in order])
    log(f"{len(dates)} passes: {dates[0]} -> {dates[-1]}")

    # speckle filter (NaN-safe: fill with per-image median, filter, restore NaN)
    smooth = np.empty_like(stack)
    for i, a in enumerate(stack):
        nan = ~np.isfinite(a)
        filled = np.where(nan, np.nanmedian(a), a)
        smooth[i] = np.where(nan, np.nan, ndimage.median_filter(filled, size=P["MEDIAN_PX"]))
    valid = np.isfinite(smooth).all(axis=0)

    # ---------------------------------------------------------------- 2. normal level
    normal = np.nanpercentile(smooth, P["NORMAL_PCT"], axis=0)

    # ---------------------------------------------------------------- 3. water per date (CLIPPED Otsu)
    thresholds, water = [], []
    for a in smooth:
        v = a[np.isfinite(a)]
        thr = float(np.clip(threshold_otsu(v), P["DB_MIN"], P["DB_MAX"]))
        thresholds.append(round(thr, 2))
        water.append(np.isfinite(a) & (a < thr))
    water = np.stack(water)
    log("water thresholds (dB):", thresholds)

    # ---------------------------------------------------------------- context layers
    layers = {}
    for key, pats in {
        "dem": ["static/*dem*.tif", "static/*DEM*.tif", "static/*cop*30*.tif"],
        "jrc": ["static/*jrc*.tif", "static/*occurrence*.tif", "static/*gsw*.tif"],
        "wc": ["static/*worldcover*.tif", "static/*WorldCover*.tif", "static/*esa_wc*.tif"],
    }.items():
        f = first(pats)
        if f:
            rs = Resampling.nearest if key != "dem" else Resampling.bilinear
            layers[key] = load_on(f, tmpl, rs).values
            log(f"loaded {key}: {os.path.basename(f)}")
        else:
            log(f"MISSING {key} — related masks skipped")

    # ---------------------------------------------------------------- 4. permanent water + buffer
    perm = water.mean(axis=0) >= P["RADAR_PERMANENT"]
    if "jrc" in layers:
        perm |= np.nan_to_num(layers["jrc"]) >= P["JRC_PERMANENT"]
    buf_px = int(round(P["SHORE_BUFFER_M"] / RES_M))
    perm_buf = ndimage.binary_dilation(perm, iterations=buf_px) if buf_px else perm

    # ---------------------------------------------------------------- 5. land where floods can happen
    eligible = valid & ~perm_buf
    mangrove = np.zeros_like(valid)
    builtup = np.zeros_like(valid)
    if "wc" in layers:
        wc = np.nan_to_num(layers["wc"]).astype(int)
        mangrove = wc == 95
        builtup = wc == 50
        eligible &= ~mangrove
    if "dem" in layers:
        dem = layers["dem"]
        gy, gx = np.gradient(np.nan_to_num(dem, nan=np.nanmean(dem)), RES_M)
        slope = np.degrees(np.arctan(np.hypot(gx, gy)))
        eligible &= (np.nan_to_num(dem, nan=999) <= P["MAX_ELEV_M"]) & (slope <= P["MAX_SLOPE_DEG"])

    # ---------------------------------------------------------------- 6–8. floods, streets, hotspots
    min_px = int(np.ceil(P["MIN_PATCH_M2"] / (RES_M * RES_M)))
    floods, urban, rows = [], [], []
    for i, d in enumerate(dates):
        drop = normal - smooth[i]
        fl = remove_small(water[i] & (drop >= P["DROP_DB"]) & eligible, min_px)
        ub = builtup & valid & (-drop >= P["BRIGHT_DB"])
        floods.append(fl)
        urban.append(ub)
        rows.append(dict(date=d, flooded_km2=km2(fl), urban_signal_km2=km2(ub),
                         tidal_mangrove_water_km2=km2(water[i] & mangrove),
                         water_threshold_db=thresholds[i], rain_prev3d_mm=None))
    hotspots = np.sum(floods, axis=0)

    # ---------------------------------------------------------------- rainfall (3 days before each pass)
    rain_csv = first(["rainfall/douala_imerg_daily.csv", "rainfall/*.csv"])
    if rain_csv:
        import pandas as pd
        df = pd.read_csv(rain_csv)
        dcol = next(c for c in df.columns if "date" in c.lower() or "time" in c.lower())
        vcol = next(c for c in df.columns if c != dcol and np.issubdtype(df[c].dtype, np.number))
        df[dcol] = pd.to_datetime(df[dcol]).dt.date
        s = df.groupby(dcol)[vcol].mean()
        for r in rows:
            d0 = _date.fromisoformat(r["date"])
            vals = [s.get(d0 - timedelta(days=k)) for k in range(0, 3)]
            vals = [float(v) for v in vals if v is not None and np.isfinite(v)]
            r["rain_prev3d_mm"] = round(sum(vals), 1) if vals else None
        log(f"rainfall joined from {os.path.basename(rain_csv)} (column '{vcol}')")
    else:
        log("MISSING rainfall CSV — rain_prev3d_mm stays null")

    rain_corr = None
    pairs = [(r["rain_prev3d_mm"], r["flooded_km2"]) for r in rows if r["rain_prev3d_mm"] is not None]
    if len(pairs) >= 4:
        a, b = np.array(pairs).T
        if a.std() > 0 and b.std() > 0:
            rain_corr = round(float(np.corrcoef(a, b)[0, 1]), 3)

    # ---------------------------------------------------------------- DSWx-S1 validation (IoU)
    validation = []
    dswx_dir = ROOT / "opera_dswx_s1"
    if dswx_dir.is_dir():
        for i, d in enumerate(dates):
            hit = nearest_file(dswx_dir, d)
            if not hit:
                continue
            wtr = np.nan_to_num(load_on(hit[1], tmpl, Resampling.nearest).values).astype(int)
            dsw = np.isin(wtr, [1, 2]) & eligible          # 1 open water, 2 partial; same land mask
            ours = floods[i]
            union = (ours | dsw).sum()
            validation.append(dict(date=d, dswx_date=hit[2],
                                   iou=round(float((ours & dsw).sum() / union), 3) if union else None,
                                   dswx_water_km2=km2(dsw), flooded_km2=km2(ours)))
        log(f"DSWx comparisons: {len(validation)}")
    else:
        log("MISSING opera_dswx_s1/ — validation_dswx stays empty")

    # ---------------------------------------------------------------- neighbourhood impact (F11)
    neighbourhoods = []
    places_f = first(["osm/*places*.geojson", "osm/*place*.geojson"])
    if places_f:
        import geopandas as gpd
        pl = gpd.read_file(places_f)
        pl = pl[pl.geometry.notna()].copy()
        pl["geometry"] = pl.geometry.centroid if pl.geom_type.ne("Point").any() else pl.geometry
        pl = pl.to_crs(WORK_CRS)
        xs, ys = tmpl.x.values, tmpl.y.values
        r_px = P["PLACE_RADIUS_M"] / RES_M
        yy, xx = np.mgrid[0:len(ys), 0:len(xs)]
        name_col = next((c for c in ["name", "name:fr", "name:en"] if c in pl.columns), None)
        for _, p in pl.iterrows():
            name = p.get(name_col) if name_col else None
            if not isinstance(name, str) or not name.strip():
                continue
            cx = (p.geometry.x - xs[0]) / (xs[1] - xs[0])
            cy = (p.geometry.y - ys[0]) / (ys[1] - ys[0])
            disk = (xx - cx) ** 2 + (yy - cy) ** 2 <= r_px ** 2
            if not disk.any():
                continue
            per = {d: km2(floods[i] & disk) for i, d in enumerate(dates)}
            total = round(sum(per.values()), 4)
            if total > 0:
                neighbourhoods.append(dict(name=name, place=str(p.get("place", "")),
                                           lat=round(float(gpd.GeoSeries([p.geometry], crs=WORK_CRS).to_crs(4326).y[0]), 5),
                                           lon=round(float(gpd.GeoSeries([p.geometry], crs=WORK_CRS).to_crs(4326).x[0]), 5),
                                           total_flooded_km2=total, by_date=per))
        neighbourhoods.sort(key=lambda n: -n["total_flooded_km2"])
        log(f"neighbourhoods with flooding: {len(neighbourhoods)}")
    else:
        log("MISSING osm places — neighbourhoods stays empty")

    # ---------------------------------------------------------------- export (data contract 12.4)
    bounds = [[BBOX[1], BBOX[0]], [BBOX[3], BBOX[2]]]
    for i, d in enumerate(dates):
        save_png(floods[i], tmpl, OUT / f"flood_{d}.png", rgba=(0, 229, 255, 210))        # cyan
        save_png(urban[i], tmpl, OUT / f"urban_signal_{d}.png", rgba=(255, 214, 0, 200))  # yellow
    save_png(perm, tmpl, OUT / "permanent_water.png", rgba=(30, 90, 200, 150))
    save_png(hotspots, tmpl, OUT / "hotspots.png",
             cmap={1: (255, 237, 160, 200), 2: (254, 178, 76, 215), 3: (240, 59, 32, 230), 4: (189, 0, 38, 240)})
    (OUT / "bounds.json").write_text(json.dumps(bounds))

    stats = dict(
        dates=rows,
        neighbourhoods=neighbourhoods[:50],
        validation_dswx=validation,
        limits=LIMITS,
        bounds=bounds,
        params={**P, "RES_M": RES_M, "WORK_CRS": WORK_CRS},
        summary=dict(passes=len(dates), first=dates[0], last=dates[-1],
                     max_flood_date=max(rows, key=lambda r: r["flooded_km2"])["date"],
                     max_flooded_km2=max(r["flooded_km2"] for r in rows),
                     max_times_flooded=int(hotspots.max()),
                     rain_flood_correlation=rain_corr,
                     layers_loaded=sorted(layers)),
        source="NASA-ISRO NISAR L2 GCOV (PR), track 58 / frame 4 / ascending, via ASF DAAC",
    )
    (OUT / "stats.json").write_text(json.dumps(stats, indent=2, ensure_ascii=False))
    log(f"exported {len(dates)} passes to {OUT}")
    for r in rows:
        log(f"  {r['date']}  flood {r['flooded_km2']:.3f} km²  streets {r['urban_signal_km2']:.3f} km²  thr {r['water_threshold_db']} dB  rain {r['rain_prev3d_mm']}")
    return stats


if __name__ == "__main__":   # true both for `python detect_v2.py` and a pasted Colab cell
    run()
