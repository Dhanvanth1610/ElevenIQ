# ElevenIQ — Top-5 Leagues, Champions League & Match Analysis

Two things in one app:

1. **League Center** — live standings, fixtures and results for the
   Premier League, La Liga, Serie A, Bundesliga, Ligue 1 and the Champions
   League, pulled from a real football data API. Auto-refreshes every 60s
   while the tab is open, so the points table updates itself as real
   matches finish.
2. **Match Center** — a computer-vision pipeline + dashboard for *your own*
   footage (club, training, amateur match) that turns a fixed-camera clip
   into player heatmaps, a pass/interaction network, physical performance
   metrics (distance, sprints, fatigue), and an xG (expected goals)
   estimator you can also use standalone in the xG Lab.

These are deliberately separate: League Center is real competition data with
no video involved, Match Center is video analysis of footage you supply.
Neither one fakes the other, and neither ships with placeholder/demo data —
both require a running backend, and show a clear "connect a backend" state
until one's reachable.

## Architecture

```
eleveniq/
├── backend/
│   ├── main.py                    # FastAPI app: upload/status/results, xG, league endpoints
│   ├── requirements.txt
│   ├── league_data/
│   │   ├── client.py              # football-data.org client (standings/fixtures/results)
│   │   └── competitions.py        # PL / PD / SA / BL1 / FL1 / CL competition registry
│   └── cv_pipeline/
│       ├── detector.py            # YOLOv8 + ByteTrack player detection/tracking
│       ├── homography.py          # pixel -> real pitch coordinate mapping
│       ├── heatmap.py             # heatmaps + naive pass network visualization
│       ├── metrics.py             # distance, sprint count, fatigue index
│       ├── xg.py                  # baseline logistic xG model (+ XGBoost upgrade path)
│       └── pipeline.py            # orchestrates the full video -> results flow
├── docs/
│   └── index.html                 # single-file build (GitHub Pages-ready), talks to your backend
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx
        └── components/
            ├── Nav.jsx            # tabbed nav: Overview / League Center / Match Center / xG Lab
            ├── Hero.jsx           # landing page + feature grid
            ├── LeagueCenter.jsx   # live standings/fixtures/results, league selector
            ├── UploadForm.jsx
            ├── Dashboard.jsx      # heatmaps, formation, leaderboard, fatigue rings, stats table
            ├── XgLab.jsx          # click-to-shoot interactive xG pitch (no backend needed)
            └── Footer.jsx
```

## Theme

Dark, navy/blue "under the floodlights" look — Bebas Neue display type,
Inter for body copy, angular clipped-corner UI elements, gold accents on
prestige numbers (points, xG%), and a left-border highlight on top-4
standings rows. No grass-green/lime styling left from earlier iterations of
this project.

## Quick start

### 0. Just want to click around first?

Open `docs/index.html` directly in any browser — no install step. It's the
full UI (Overview, League Center, Match Center, xG Lab) as a single static
file. There's a small connection bar at the top where you point it at a
running backend (defaults to `http://localhost:8000`) — until it connects,
League Center and Match Center show a "connect a backend" state instead of
any placeholder numbers. xG Lab works with no backend at all. Push this repo
to GitHub and enable **Settings → Pages → deploy from `/docs`** to host it
for free (you'll still need a backend reachable from wherever people load
the page for League/Match Center to do anything).

### 1. Get a free football-data.org API key (for League Center)

League Center needs real data, so it needs a key — there's no fallback that
fabricates standings.

1. Sign up free at <https://www.football-data.org/client/register>.
2. Set it as an environment variable before starting the backend:
   ```bash
   export FOOTBALL_DATA_API_KEY=your_key_here
   ```
3. The free tier covers the big-5 leagues + Champions League used here, with
   a modest rate limit (responses are cached for 60s to stay under it — this
   is also why the UI polls every 60s rather than more often).

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
export FOOTBALL_DATA_API_KEY=your_key_here
uvicorn main:app --reload --port 8000
```

First run of the CV pipeline will auto-download `yolov8n.pt` (~6MB) from
Ultralytics. League Center works independently of that.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Runs on `http://localhost:3000` and talks to the backend at
`http://localhost:8000` (override with `REACT_APP_API_BASE` env var).

### 4. Use it

- **League Center**: pick a competition chip (Premier League, La Liga, Serie
  A, Bundesliga, Ligue 1, Champions League) to see its live standings table,
  recent results and upcoming fixtures. Refreshes automatically every 60s.
- **Match Center**: upload a fixed-camera match/training clip (MP4/MOV). The
  dashboard polls `/status/{job_id}` automatically every 3s, then shows the
  team heatmap, pass network, average formation, player leaderboard, fatigue
  rings and the full physical-metrics table once `status == done`.
- **xG Lab**: click anywhere on the pitch (or use a preset) for a live read
  from the baseline model — works fully client-side, no backend needed.

## What's real vs. what's a placeholder (read this before you demo)

Be upfront about this in interviews/demos — it's more credible than
pretending otherwise:

| Component | Status |
|---|---|
| League standings / fixtures / results | **Real** — live from football-data.org, requires your own free API key (see setup above), auto-refreshes every 60s |
| Player detection & tracking | **Real** — YOLOv8n + ByteTrack, works out of the box on any clip with visible people |
| Pixel → pitch coordinate mapping | **Semi-real** — homography math is correct, but needs 4 manually-calibrated corner points per camera angle for real accuracy (currently defaults to a naive fallback if none supplied) |
| Heatmaps | **Real** — genuinely computed from tracked positions |
| Pass network | **Placeholder heuristic** — proximity-based "who's near whom," not real ball-possession tracking. Swap in a ball-detection model + nearest-player logic for accurate passes. |
| Distance/sprint/fatigue metrics | **Real math**, but accuracy depends entirely on calibration quality and frame sample rate |
| xG model | **Real baseline** (distance+angle logistic function calibrated to public xG distributions) with a clear upgrade path to a trained XGBoost model once you log real shot data |
| Average formation snapshot | **Real** — plots each tracked player's mean pitch position (same `avg_positions` used internally for the pass network), subject to the same homography caveats above |

**Important scope note**: the CV pipeline (Match Center) is built for
**fixed-camera footage you upload yourself** — a single stationary angle
covering the whole pitch (club/training footage, a tripod at a local match,
etc.). It is *not* built to run on broadcast footage of professional matches
(constantly panning/cutting camera angles, replays, graphics overlays) — that
would need a materially different detection and re-identification pipeline.
For the professional leagues themselves, use League Center's real data
instead of trying to feed broadcast clips into Match Center.

## Recommended next steps (in priority order)

1. **Calibrate homography properly**: add a simple UI step where you click
   4 known pitch points on the first frame of each new video; pass those as
   `pixel_corners` to `run_pipeline()`.
2. **Real ball tracking**: fine-tune a YOLOv8 model on a small labeled set
   of your own footage (or use a public dataset like SoccerNet) to detect
   the ball, then replace `build_naive_pass_network` with ball-possession-
   based pass detection (nearest player to ball at each frame + possession
   changes = passes).
3. **Persist jobs and league data in a real database** instead of the
   in-memory `JOBS` dict and the 60s in-process cache.
4. **Player identification**: jersey number OCR or color-based team
   clustering so track IDs map to actual player names/teams across clips.
5. **League Center extras**: team/player pages, head-to-head history, a
   simple points-per-game trend chart — football-data.org exposes more than
   what's wired up here (squads, top scorers, head-to-head).
6. **`docs/index.html` deployment**: if you host the static build somewhere
   public, either run the backend on a public host too and point the
   connection bar at it, or add a small serverless proxy in front of
   football-data.org so the API key never sits in client-side code.

## Tuning knobs

- `sample_every_n` in `run_pipeline()` — higher = faster processing, lower
  time-resolution (fine for heatmaps, too coarse for accurate sprint speeds
  below ~3-4 frames/sec effective sampling).
- `CONF_THRESHOLD` in `detector.py` — raise if you're getting false-positive
  detections from crowd/advertising boards; lower if players are being missed.
- `proximity_threshold_m` in `build_naive_pass_network` — how close two
  players need to be (in meters) to count as an interaction.
- `_CACHE_TTL_S` in `league_data/client.py` — how long standings/fixtures
  responses are cached in-process before re-hitting football-data.org (also
  controls how often the UI can meaningfully refresh).
