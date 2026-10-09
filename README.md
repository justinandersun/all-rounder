# The All-Rounder

A single-page general physical fitness test: 10 events, 10 hours, 100 points, graded A through D.
Enter your age, sex, and bodyweight to see personalized Advanced / Intermediate / Beginner
benchmarks for every event, then log your results for a live score.

Plain HTML, CSS, and JavaScript.

## Running it

Open `index.html` directly in a browser, or serve the folder with any static file server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Files

- `standard.js`: **the standard itself.** Version, events, anchors by sex/age band (or bodyweight ratios), grade bands, rules, and sources. Calibration changes go here.
- `scoring.js`: pure scoring functions (anchor resolution, interpolation, levels, grades). Has no DOM dependencies, so it can be loaded in Node.
- `script.js`: UI: renders the scorecard from the standard, live recalculation, share links.
- `index.html`: page structure and copy.
- `styles.css`: field-map styling.
- `topo.svg`: topographic background.
- `fonts/`: self-hosted Archivo (variable) and IBM Plex Mono, Latin subset. Both are under the SIL Open Font License 1.1.
- `og-image.png`: social share preview image (1200×630).

## Changing the standard

Edit `standard.js`. If the change would alter how any performance scores, bump `version`.
Shared links carry the version they were recorded under, and the page flags links from an
older version.
