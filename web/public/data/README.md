# web/public/data — the shared data contract

Every screen and `/api/ask` reads **only** these files (requirements spec §12.4).
The front end compiles against the types in [`src/lib/data.ts`](../../src/lib/data.ts),
so the names and fields below must not change when the pipeline re-runs.

| File | Content |
| --- | --- |
| `bounds.json` | `[[south, west], [north, east]]` for the Leaflet image overlays |
| `flood_<date>.png` | Open-water flood layer (cyan), one per pass, transparent elsewhere |
| `urban_signal_<date>.png` | Possible flooded streets (yellow), separate less-certain layer |
| `permanent_water.png` | Permanent water (JRC / multi-pass water + shoreline buffer) |
| `hotspots.png` | Flood frequency: number of passes each pixel was flooded |
| `stats.json` | `dates[]`, `neighbourhoods[]`, `hotspots[]`, `validation_dswx[]`, `limits[]`, `bounds`, `params`, `meta` |

## ⚠️ The committed rasters are placeholders

`stats.json` currently carries `meta.data_status: "sample"` and the app shows a
**Sample data** banner on every screen. The numbers are drawn from the range
notebook 02 reports (0.04 – 0.29 km² per pass) so the UI can be built and
reviewed before the re-run; the rasters are generated shapes, not NISAR pixels.

`urban_signal_km2` is `0.00` for every pass and the streets / mangrove layers are
blank because ESA WorldCover has not been run yet — that is a *pending* step,
not a measured zero.

## Replacing them with the real export

```bash
# from the repo root, after notebook 02 writes web_v2/
rm -f web/public/data/*.png
cp web_v2/png/*.png web/public/data/
cp web_v2/stats.json web_v2/bounds.json web/public/data/
```

Then set `meta.data_status` to `"final"` in `stats.json`; the sample banner
disappears on its own and the limits panel keeps saying what is still pending
(DSWx / rainfall validation).
