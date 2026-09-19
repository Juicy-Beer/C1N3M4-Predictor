# C1N3M4 Traffic Predictor

| File | Purpose |
|------|---------|
| `index.html` | Page structure and layout |
| `style.css` | All visual styling |
| `app.js` | Data logic, predictions, and DOM updates |

## Features

- **Snapshot** - current visitor/view counts and live growth rates (visitors/hr, views/hr)
- **Forecast** - predictions at 6h, 12h, 24h, 2d, 3d, and 7d horizons
- **Two models** - Linear (blends recent + average rate) and Exponential (compound growth, 8× capped)
- **History** - add, view, and delete individual data points
- **Persistent** - data saved to `localStorage`; no server required

## Usage

Open `index.html` directly in a browser — no build step or server needed.

```bash
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Or serve locally:

```bash
npx serve .
# or
python3 -m http.server
```

## How predictions work

**Linear**: blends the most recent hourly rate (70%) with the overall average rate since the first data point (30%). More data points improve accuracy.

**Exponential**: compounds growth based on the rate between the last two points, capped at 8× the current value to avoid runaway numbers.

Both modes never predict a value below the current count.

## Notes

- Data lives only in your browser (`localStorage`). Clearing site data will erase it.
- The predictor pre-loads three seed data points on first run (from September 2026). Delete them once you have your own data.
- Accuracy improves significantly with more data points spread over time.
