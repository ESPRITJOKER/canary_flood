# Pitch kit (Member 5)

Owner: Member 5 · Branch: `docs/pitch`

## Checklist

- [ ] Stitch screens updated with real dates, desktop layout, AI chat → `docs/design/` (prompt: [`../design/stitch-update-prompt.md`](../design/stitch-update-prompt.md))
- [ ] Flood reports from the news → [`../reports/flood_reports_douala.csv`](../reports/flood_reports_douala.csv) (add 30 June and 28 October if found)
- [ ] Screenshots of the live app → `screenshots/` (list below)
- [ ] Slides (7 slides, outline below) → link here
- [ ] Demo video (≤ 2 min) → [`demo-script.md`](demo-script.md), then link in the main README
- [ ] Main README: live URL, video link, team names

## Screenshots to take (from the Vercel app, 1440 px wide + one phone view)

| File | Screen |
|---|---|
| `01_map_dashboard.png` | Map with flood layer, 30 June selected |
| `02_before_after.png` | Slider: 18 June vs 30 June |
| `03_hotspots.png` | Hotspots map and neighbourhood list |
| `04_statistics.png` | km² per date chart with rainfall |
| `05_assistant_fr.png` | Assistant answering in French |
| `06_limits.png` | Limits / About panel |
| `07_mobile.png` | Phone view with bottom tabs |

## Slides outline (7 slides)

1. **Title**: FloodSight, Lions Roar Labs, pitch line
2. **Problem**: Douala floods every rainy season; clouds blind optical satellites (photo/news headline from 11 Sept 2026)
3. **Solution**: NISAR radar sees through clouds → flood map, hotspots, bilingual AI
4. **How it works**: 5-step pipeline diagram
5. **Demo**: 3 screenshots (map, before/after, assistant)
6. **What we found + honesty**: 0.04–0.29 km² per pass; 11 Sept flood came 1 day after a pass → why we add DSWx-S1 and rainfall
7. **Impact and next steps**: CUD, NGOs, residents; forecasting, SMS alerts, more seasons
