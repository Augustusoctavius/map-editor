# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Wayborne Map Editor (aka "Cartographer") — a fantasy/medieval map editor. Vanilla JS + Canvas 2D only: no framework, no build step, no bundler, no npm dependencies, no CDN assets. Everything (472 symbols, 20 terrain types, isometric buildings) is generated in code, not loaded from files.

Source comments and UI strings are primarily Turkish (this is a Turkish-authored project with TR/EN i18n built in via `js/ui.js`'s `DICT`). Keep that convention in mind when reading/writing comments.

## Running it locally

There is no build/compile/lint/test tooling in this repo — it's static files served directly.

```bash
python3 serve.py 8000        # or: python3 -m http.server 8000
# or, if Node is available:
npx http-server . -p 8000 -c-1 -o
```

Then open `http://localhost:8000/`. **Do not open `index.html` via `file://`** — `toDataURL`/`getImageData` (used for the shore effect and PNG export) are blocked by CORS under `file://`.

There are no automated tests. To verify a change, run the local server, open the app in a browser, and check the browser console for `[WME] hazır — N sembol, tuval 2048×2048` on load, plus manually exercise the affected tool.

## Architecture

Everything hangs off `window` as a set of singleton modules, each an IIFE assigning to `global.<Name>`. `index.html` loads them via plain `<script>` tags in a load-bearing order (no module system, no dynamic imports):

```
iso.js → catalog.js → catalog2.js → symbols.js → i18n-names.js → history.js → layers.js → canvas.js → tools.js → export.js → ui.js → app.js
```

This order matters: later files reference globals defined by earlier ones (e.g. `catalog2.js` pushes into `IsoCatalog.ITEMS` created by `catalog.js`; `Layers`, `Cv`, `Tools` etc. are read by `ui.js` and `app.js` at init time).

Module responsibilities:
- **`app.js`** — `App`, the single mutable state object (current tool, brush/terrain/symbol/river/road/label/scale/windrose settings). `App.init()` is the entry point, wired to `DOMContentLoaded`.
- **`layers.js`** — `Layers` (the 10 raster/vector layers — land, terrain, elevation, territories, rivers, roads, symbols, labels, etc.) and `Terrain` (20 terrain type definitions: base/dark/mark colors, procedural scatter density, terrain-aware shore coloring, selectable shore style — sandy/rocky/reef). Terrain texture is generated per-brush-stroke, not tiled — no two strokes look identical. The `elevation` layer stores raw grayscale height (painted in `tools.js` via lighten/darken brush compositing); `Cv.buildElevationEffect()` derives a cached hillshade + contour-line overlay from it at render time (same lazy-rebuild-on-dirty pattern as the shore effect).
- **`canvas.js`** — `Cv` (viewport: zoom/pan/fit/minimap, main render loop, shore glow effect, river/road/territory/label rendering, interactive scale bar) and `Geo` (path sampling/geometry helpers, including `sampleBezier`/`autoHandle` for optional per-point bezier tangent handles on rivers/roads/lakes/territories — a path with no `handles` renders exactly as the original Catmull-Rom `Geo.sample`, so old saves are unaffected).
- **`tools.js`** — `Tools`, the input/tool state machine (land brush, sea eraser, terrain paint, elevation raise/lower brush, symbol placement, river/road/territory path drawing, label placement, texture eyedropper, selection, right-click pan) plus `Eyedropper`. This is where mouse/keyboard events become layer edits.
- **`iso.js`** — the isometric building engine (`Iso.Scene`, `Iso.MAT`). Parallel projection `sx=(x-y)*0.866, sy=(x+y)*0.5-z`; solids are depth-sorted with the painter's algorithm. Produces `Sym.part()`-style path data normalized to a 0–100 box.
- **`catalog.js` / `catalog2.js`** — composite isometric buildings built on top of `Iso.Scene`, organized by theme (`catalog2.js` loads second and pushes additional items + material variants into the same `IsoCatalog.ITEMS` table).
- **`symbols.js`** — `Sym`, the flat (non-isometric) symbol index (~200+ ink-style symbols as `{d, f, s, lw, tr}` Path2D parts in a 0–100 coordinate space centered at (50,50)), plus custom PNG symbol upload/registration. The same path data draws to canvas via `Path2D` and is written verbatim as `<path>` in SVG export — SVG output is genuinely vector, not embedded bitmap.
- **`i18n-names.js`** — `NameI18N` lookup table + `i18nName(key, tr, en, lang)` helper. Display names for symbols/buildings/terrain/categories/label presets/layers live as `tr`/`en` fields on their own data structures (`symbols.js`, `catalog.js`/`catalog2.js`, `layers.js`, `canvas.js`); this table supplies the other 8 UI languages by id/key, falling back to English when a key or language is missing. `ui.js`'s ten-language switcher (see `DICT` in `ui.js`) covers chrome strings directly — this module only covers catalog/data names.
- **`history.js`** — `History`, 50-step undo/redo. Brush strokes are stored as bbox-cropped PNG patches (not full layer copies), so even an 8192² canvas keeps undo memory small; `rasterMulti` lets one undo step atomically touch multiple layers (e.g. the sea eraser clears both land and terrain).
- **`export.js`** — `Exporter` and `downloadFile`: PNG/SVG export and `.json` project save/load.
- **`ui.js`** — `UI`: panels, the TR/EN `DICT` i18n table, the layer list, symbol library browser, label presets, scale bar controls, keyboard shortcut bindings.

### Adding a new symbol

Add to the relevant category's `items` array in `js/symbols.js`:
```js
{ id, tr, en, parts: [part('M...', 'fill', 'ink', 3)] }
```
Coordinate space is 0–100, centered at (50,50).

### Key data-flow points

- User input → `Tools` mutates `App.*` settings and/or writes into `Layers` (raster patches or vector object arrays) → `History` snapshots the change → `Cv` re-renders from `Layers` state.
- Canvas is fixed at 2048×2048, set once in `App.init()`.
- Why Canvas 2D and not WebGL: raster layers are kept full-resolution in offscreen canvases and composited to screen with a single `drawImage` (browser already GPU-accelerates this); WebGL would add per-stroke shader cost and complicate the `getImageData`-based shore thresholding and SVG export.
