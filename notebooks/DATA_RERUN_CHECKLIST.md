# Member 2 — Data re-run checklist (the remaining data work)

This is the **only** step that still needs a human: it runs in **Google Colab** with a
free **NASA Earthdata** login and the source rasters in the shared **Google Drive**
(`FloodSight/data/`). It cannot run in the repo — the big `.tif` inputs are never committed
to Git. The pipeline **code is already correct** (`src/floodsight/detect_v2.py`, notebook
`FloodSight_01_data_collection.ipynb`, params in `config/aoi_douala.yaml`); this just executes it.

## What this fixes
Today `web/public/data/stats.json` has these fields **empty/zero on all 11 passes** — the
re-run fills them:

| Field | Requirement | Why it's empty now |
|---|---|---|
| `urban_signal_km2` | F16 flooded streets | ESA WorldCover (built-up 50) not loaded |
| `tidal_mangrove_water_km2` | detection step 5 | ESA WorldCover (mangrove 95) not loaded |
| `rain_prev3d_mm` | F17 rain check | GPM IMERG rainfall not loaded |
| `validation_dswx[]` | F17 DSWx IoU | OPERA DSWx-S1 not loaded |

## Pre-flight
- [ ] Free **Earthdata** account verified → `urs.earthdata.nasa.gov` (see spec §6.2).
- [ ] In Colab **Secrets**: add `EARTHDATA_USERNAME` and `EARTHDATA_PASSWORD` (notebook access on). Never paste creds into cells.
- [ ] Shared **Google Drive** mounted; `FloodSight/data/` present.

## Run order
1. **`FloodSight_01_data_collection.ipynb` → run sections B, D, E–H**
   - **B** OPERA DSWx-S1 · **D** GPM IMERG rainfall · **E** Copernicus DEM · **F** JRC water · **G** ESA WorldCover · **H** OSM.
   - Re-runnable: finished files are skipped; a failing source never stops the others.
   - ✅ Done when `static/` has WorldCover + DEM + JRC, `rainfall/` has the IMERG CSVs, `opera_dswx_s1/` has the DSWx tifs, and `manifest.json` lists them.
2. **Threshold sanity check (F4)** — already handled in code (`detect_v2.py:176` clips Otsu to `DB_MIN..DB_MAX` = −24..−14 dB). Confirm the printed `water thresholds (dB)` sit inside that range (not ~−9 dB). No code change expected.
3. **`FloodSight_02_flood_detection_v2`** (logic in `src/floodsight/detect_v2.py`) — re-run end to end. It now has WorldCover/rain/DSWx, so it fills the four fields above plus neighbourhoods.
   - *(Optional)* try `DROP_DB = 2.0` to surface weaker floods; compare before keeping.
4. **Export** → writes `web_v2/`: `flood_*.png`, `urban_signal_*.png`, `permanent_water.png`, `hotspots.png`, `bounds.json`, `stats.json`.

## Publish to the app (keep the data contract, §12.4)
5. Copy **`web_v2/` → `web/public/data/`**, overwriting. **Filenames and field names must not change** — the front end is already wired to them.
6. Verify locally:
   ```bash
   cd web && node -e "const s=require('./public/data/stats.json'); \
     const d=s.dates; \
     console.log('rain filled:', d.some(p=>p.rain_prev3d_mm!=null)); \
     console.log('streets filled:', d.some(p=>p.urban_signal_km2>0)); \
     console.log('dswx rows:', s.validation_dswx.length);"
   # all three should now be true / > 0
   npm run build
   ```
7. Commit on **`data/pipeline`** (`data:` prefix) → PR into `dev`.

## When this is done
- F16 / F17 move from 🟡 to ✅, the mangrove/rain numbers become real, and the Statistics
  screen's "Pending" states auto-resolve (no front-end change needed — the UI already reads
  these fields and hides the zeros until they're real).
