# Stitch update prompt (real data)

Paste into Stitch on top of the existing FloodSight design. Export the updated screens (PNG) and `DESIGN.md` into this folder for Member 4.

```
Update the FloodSight design with the real project data. Keep the existing style.

Global:
- Dark basemap for the map (Douala, bbox 9.60–9.80 E, 3.95–4.15 N).
- Flood layer = cyan. Possible flooded streets = yellow, with a "less certain" label. Permanent water = dark blue. Hotspots = orange to red.
- Interface in English with French labels; FR/EN switch top-right.
- Desktop: left side panel. Mobile: bottom tabs (Map, Compare, Hotspots, Stats, About).

Timeline: exactly 11 NISAR passes:
18 Jun, 30 Jun, 12 Jul, 24 Jul, 17 Aug, 29 Aug, 10 Sep, 22 Sep, 4 Oct, 16 Oct, 28 Oct 2026.
Show the 24-day gap between 24 Jul and 17 Aug as a dashed segment labelled "no pass".

Stat cards (use small realistic values): "Flooded land: 0.29 km²" (30 Jun), "Possible flooded streets: — km²", "Rain previous 3 days: — mm", "Water threshold: −14 dB".

Statistics: bar chart of flooded km² per pass (range 0.04–0.29 km², peaks on 30 Jun and 28 Oct) with a rainfall line on a second axis. Add a table "DSWx-S1 overlap (IoU)".

AI chat: right-side panel on desktop, full screen on mobile. Title "FloodSight Assistant". Chips: "Which pass had the most flooding?", "Compare 18 June and 30 June", "Quels quartiers sont les plus touchés ?". Each answer shows the numbers it used as small cards and the note "Answers use only FloodSight data". Add a "Download report (FR/EN)" button.

Limits panel (About page and an info icon on the map): 3 cards:
1. "One pass every 12 days: short flash floods can be missed."
2. "Flooded streets look brighter, not darker: that layer is less certain."
3. "Tide and waves near the Wouri estuary are masked out."
Plus a badge "Detection tool, not a forecast".
```
