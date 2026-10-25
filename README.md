# mandarin
A vibecoded clicker with mandarins🍊

A Material 3 Expressive mandarin clicker. Static HTML, CSS and JavaScript with no build step, so it runs straight from GitHub Pages.

## Features
- 🍊 A big mandarin to tap, with an expressive "cookie" shape behind it that changes shape when you press
- 🔢 A click counter, saved in `localStorage` so it survives reloads
- 🏅 17 ranks, from **Seedling** (0) to **Mandarin Deity** (1,000,000), with a wavy progress bar and a list of every rank
- 📳 A short vibration on every click and a longer pattern on rank-up, where the browser supports it. You can turn it off with the button in the top bar.
- 💡 A "Did you know?" card with 116 mandarin facts. A new fact shows up every 50 clicks.
- 🎨 Material 3 colour scheme generated from the seed colour `#FF8C00` (orange), with light and dark themes
- ⌨️ Space or Enter adds a mandarin, and the animations respect `prefers-reduced-motion`

## Files
| File | Purpose |
| --- | --- |
| `index.html` | Page markup |
| `styles.css` | M3 tokens (generated from the orange seed), shapes, spring motion |
| `app.js` | Clicker logic, ranks, vibration, saving progress |
| `facts.js` | The mandarin facts |
| `icon.svg`, `manifest.webmanifest` | Icon, and the manifest that lets you add it to your home screen |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## Deploying to GitHub Pages
1. Merge to `main`.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, then pick `main` and `/ (root)`.
4. The site will appear at `https://<user>.github.io/mandarin/`.

## Running locally
```sh
python3 -m http.server 8000
# open http://localhost:8000
```

> Vibration uses the Vibration API, which works in Chrome, Edge, Firefox and Samsung Internet on Android. It does **not** work on iOS Safari or most desktop browsers. On those, the vibration button is greyed out.
