# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Wayborne Map Editor (aka "Cartographer") — a fantasy/medieval map editor. Vanilla JS + Canvas 2D only: no framework, no build step, no bundler, no npm dependencies, no CDN assets. Everything (891 symbols, 34 terrain types, isometric buildings) is generated in code, not loaded from files.

Source comments and UI strings are primarily Turkish (this is a Turkish-authored project with TR/EN i18n built in via `js/ui.js`'s `DICT`). Keep that convention in mind when reading/writing comments.

## Running it locally

There is no build/compile/lint step — it's static files served directly.

```bash
python3 serve.py 8000        # or: python3 -m http.server 8000
# or, if Node is available:
npx http-server . -p 8000 -c-1 -o
```

Then open `http://localhost:8000/`. **Do not open `index.html` via `file://`** — `toDataURL`/`getImageData` (used for the shore effect and PNG export) are blocked by CORS under `file://`.

### Tests

Four Node scripts drive a real headless Chromium over CDP (no Playwright dependency — they speak the
protocol directly via Node's built-in `WebSocket`, and each boots its own static server). Run them from
the repo root with plain `node`; each exits non-zero on failure.

```bash
node run-integration-test.mjs   # 75 assertions: every module, catalog integrity, round-trips
node run-layer-undo-test.mjs    # layer add/delete undo, pixel-level fidelity
node run-fps.mjs                # frame budget at 1024/2048/4096, idle+pan+zoom
node run-mapgen-test.mjs        # renders 3 landmass templates to /tmp/mapgen-shots for eyeballing
```

Two gotchas when writing more of these: **`requestAnimationFrame` is throttled in headless Chrome**, so
benchmark loops must use `setTimeout(0)`; and a Chromium left over from a previous run holds the CDP port,
so the first invocation after one is killed can fail to connect — just run it again.

Anything they don't cover still wants a manual pass: run the server, open the app, confirm
`[WME] hazır — N sembol, tuval 2048×2048` in the console, and exercise the affected tool.

## Architecture

Everything hangs off `window` as a set of singleton modules, each an IIFE assigning to `global.<Name>`. `index.html` loads them via plain `<script>` tags in a load-bearing order (no module system, no dynamic imports):

```
iso.js → catalog.js → catalog2.js → symbols.js → i18n-names.js → names.js → history.js → layers.js → canvas.js → tools.js → export.js → ui.js → app.js
```

This order matters: later files reference globals defined by earlier ones (e.g. `catalog2.js` pushes into `IsoCatalog.ITEMS` created by `catalog.js`; `Layers`, `Cv`, `Tools` etc. are read by `ui.js` and `app.js` at init time).

### App shell (Homepage / Canvas / Tutorial / Community)

`index.html` also contains a top-level app shell wrapping the editor: `#shell-nav` (four tabs) plus `#view-home`/`#view-canvas`/`#view-tutorial`/`#view-community`/`#view-editor`, each a `.shell-view` toggled by `UI.showView(name)` in `js/ui.js` (styling in `css/shell.css`). `App.init()` still runs unconditionally on load and fully initializes the editor (Layers/Cv/UI) — it's just hidden behind `#view-editor.hidden` until the user enters it via the Canvas tab (`display:contents` on `#view-editor` when active, so the editor's pre-existing viewport-relative absolute positioning is untouched by the wrapper). Switching into the editor calls `Cv.resize(); Cv.fit();` on the next frame, since the canvas reports 0×0 while hidden. There's no backend: the Canvas tab's "saved canvases" list is `localStorage` (`Exporter.LIB_KEY`, via `Exporter.libList/libSave/libOpen/libDelete`), separate from the `.json` export/import which remains the real backup/transfer path. `Exporter.buildProjectData()`/`applyProjectData(d)` are the shared serialize/deserialize core used by both the file-based flow and the `localStorage` library. `Exporter.autoSave()` is the silent counterpart of the "Save" button's `libSave` call (no `.json` download, no toast) — it fires from `UI.showView()` whenever the user navigates away from the editor view, and on a `setInterval` every 10 minutes while the editor view is active; both are gated on `History.canUndo()` so an untouched blank canvas never clutters the library.

### RTL languages

`UI.RTL_LANGS` lists the right-to-left UI languages (`ar` ships; `fa`/`he`/`ur` are data-only additions), and
`applyLang()` stamps `document.documentElement.dir`. The layout mirrors on its own because the direction-sensitive
CSS uses **logical** properties (`border-inline-start`, `padding-inline-end`, `inset-inline-end`, `text-align:start`)
— the `#workspace` grid reverses its columns under `dir="rtl"`, so the tool rail moves to the right and the options
panel to the left. Canvas rendering is coordinate math and is unaffected. `UI.t()` falls back to **English** (not
Turkish) for any non-`tr` language, so a partially translated language degrades sensibly.

The canvas label engine needed a real fix for this, independent of UI language: `drawLabel` positions glyphs
**one at a time** to implement letter-spacing, arc curvature and path-following, which destroys Arabic/Persian
joining forms and bidi order and breaks Indic ligatures. `Cv.isComplexText()` / `Cv.isRTLText()` detect those
scripts and switch the label to a **single shaped run** (`ctx.direction` set, tracking and curve dropped, an
on-path label placed at the path midpoint tangent); `measureLabel` likewise measures the whole string, since
summing per-character widths comes out ~26% too wide for connected scripts. `labelSVG` mirrors this with
`direction="rtl"`, `letter-spacing="0"` and no curved `textPath`. Latin/Cyrillic labels take the original
per-character path untouched.


### Screen support

Shell pages scale fluidly from 360px phones to 4K TVs via `clamp()` typography in `shell.css` (no per-device layouts); under 640px card grids collapse to one column and forms go full-width. The **editor is desktop-only by design** — its three-column `#workspace` grid (`--panel-l` + `1fr` + `--panel-r`) drives the canvas column negative below ~1024px. Rather than render a broken editor, `UI.showView('editor')` redirects to the `#view-narrow` explainer whenever `UI.editorFits()` is false (`EDITOR_MIN_W` 1024 / `EDITOR_MIN_H` 600). `UI._wantedView` remembers that the user actually asked for the editor, so a debounced `resize` handler (`syncNarrowGate`) moves them into the editor the moment a rotation gives enough room, and back out if it shrinks — the existing leave-editor autosave fires on the way out, so no work is lost. Touch is deliberately out of scope for now: pointer events and double-tap path-finish already work, but there is no pinch-zoom (zoom is `wheel`-only and `#view` sets `touch-action:none`).

Chrome icons are monochrome inline SVG (`.ico-svg`, `stroke="currentColor"`) rather than emoji — emoji glyphs like 🌐/🏠/📏 render in full colour on macOS and Windows and break the brass palette. Where a text glyph is used for an emoji-capable codepoint (⛰, ⛏) it carries U+FE0E to force text presentation.

Module responsibilities:
- **`app.js`** — `App`, the single mutable state object (current tool, brush/terrain/symbol/river/road/label/scale/windrose settings). `App.init()` is the entry point, wired to `DOMContentLoaded`.
- **`layers.js`** — `Layers` (the 13 built-in raster/vector layers, plus up to `CUSTOM_MAX` user-added ones — see below — land, terrain, elevation, territories, rivers, roads, symbols, labels, etc.) and `Terrain` (34 terrain type definitions: base/dark/mark colors, procedural scatter density, terrain-aware shore coloring, selectable shore style — sandy/rocky/reef). Terrain texture is generated per-brush-stroke, not tiled — no two strokes look identical. The `elevation` layer stores raw grayscale height (painted in `tools.js` via lighten/darken brush compositing); `Cv.buildElevationEffect()` derives a cached hillshade + contour-line overlay from it at render time (same lazy-rebuild-on-dirty pattern as the shore effect). Terrain includes an "interior" subset (`woodfloor`/`stonefloor`/`strawfloor`/`carpetfloor`/`cavefloor`/`stonewall`) meant for the region-link sub-map workflow below — no separate mechanic, just paint a room shape with the land brush and texture it with these instead of an outdoor terrain (turn off the "Kıyı" shore-glow checkbox for interiors, since it's styled for coastlines).

### User-added layers

The 13 layers in `DEFS` are fixed, but `Layers.addCustom(name, w, h)` inserts an extra `type:'raster'` layer
(`custom:true`, `id:'usr_…'`) directly above the active one, up to `Layers.CUSTOM_MAX` (12). These need no
rendering code of their own: `renderMap`'s generic `l.type === 'raster'` branch already draws any raster layer,
and visibility/lock/opacity/blend/reordering all come from the existing layer machinery. `Layers.name()` returns
the user's own string for a custom layer instead of going through `i18nName`, so a hand-typed name survives a
language switch. `serialize()` carries `custom`/`name`; `deserialize()` **creates** custom layers found in the
saved data (built-ins are matched by id, so an unknown id used to be silently dropped) and removes any custom
layer the incoming document doesn't have — the active document must end up exactly matching what was saved.

The `sketch` tool paints into them (`Tools.startRaster(activeId, p, 'sketch')`, a soft round dab honouring
`App.sketch.{color,size,hardness,opacity,eraser}`), and it refuses to run unless the active layer is a custom
one — free paint on `landmass` or `elevation` would corrupt what those layers mean (a land mask, a grayscale
height field). Adding and deleting layers **is** undoable via dedicated `layerAdd`/`layerRemove` History entries
(`Layers.snapshotLayer`/`restoreLayer`/`removeById`) — separate from `pushMeta`, which only round-trips
id/visible/locked/opacity/blend and can't resurrect a deleted layer. Deletion is still confirm-gated since it's
destructive within the session even though it's now reversible via Ctrl+Z.

### Multi-map (region links) and interior maps

`App.enterMap(targetId, label)`/`App.exitMap()` (`app.js`) swap the *entire* active `Layers` document for another one keyed in `App.maps{}` — a region-link pin (Tools' `regionlink` tool, `links` vector layer) just calls `enterMap` with a fresh `uid()` as `targetMapId` on first placement. Each sub-map is a fully independent document (own layers, own undo history, `History.clear()`'d on switch) round-tripped through `App._snapshotLayers()` (JSON-deep-clone — the vector `.objects` arrays must never be shared by reference between two "documents", see the aliasing bug this fixed earlier). `App.mapStack` is the breadcrumb trail back to the parent map. Both switches are **asynchronous** (`Layers.deserialize()` returns a Promise, since raster layers decode through `Image`), and `currentMapId` is only updated once that promise resolves — so a second switch fired mid-flight would snapshot the *incoming* document under the *outgoing* map's id and silently destroy the parent's content. `App._switching` guards against exactly that: `enterMap`/`exitMap` bail out while a switch is in flight and clear the flag in a terminal `.then()` (after a `.catch()`, so a failed deserialize can't wedge the editor). This same mechanism is intentionally reused for interior maps (a room/hall behind a building symbol) — there is no dedicated "interior" mode; it's just another sub-map, populated with the `furniture` symbol category (bed/table/chair/chest/bookshelf/fireplace/cauldron/cabinet/crate/rug/window/door/sconce/weapon rack/throne/anvil) and the interior terrain subset above.
- **`canvas.js`** — `Cv` (viewport: zoom/pan/fit/minimap, main render loop, shore glow effect, river/road/territory/label rendering, interactive scale bar) and `Geo` (path sampling/geometry helpers, including `sampleBezier`/`autoHandle` for optional per-point bezier tangent handles on rivers/roads/lakes/territories — a path with no `handles` renders exactly as the original Catmull-Rom `Geo.sample`, so old saves are unaffected). A river/road path can cross the land/sea boundary any number of times; `Cv._findAllSeaCrossings`/`_findAllSeaCrossingsCached` find every crossing (not just one), each gets its own river-mouth "plume" effect, and `drawRiver` no longer truncates the path itself — the land/sea clip is applied once, pixel-exact, by the `destination-in` mask in `renderMap`'s `'rivers'` branch, so it's correct regardless of how many times the river weaves in and out of land.
- **`tools.js`** — `Tools`, the input/tool state machine (land brush, sea eraser, terrain paint, elevation raise/lower brush, symbol placement, river/road/territory path drawing, label placement, texture eyedropper, selection, right-click pan) plus `Eyedropper`. This is where mouse/keyboard events become layer edits. Selected symbols show 4 draggable corner handles (`resizeHandlePositions`/`hitTestResizeHandle`/`drawResizeHandles`) for uniform-scale resize by dragging, matching common design-tool UX; the drag is resolved in the symbol's local (rotation-compensated) space so it also works correctly on rotated symbols. The lasso/floating-selection lift (`liftSelection`/`LASSO_VECTOR_LAYERS`) also picks up point-based vector objects (symbols, resources, labels, map-links) whose position falls inside the lasso polygon, not just the raster layers — so anything sitting on a lifted piece of land moves with it; committed as one atomic `History.pushCombo` step.
- **`iso.js`** — the isometric building engine (`Iso.Scene`, `Iso.MAT`). Parallel projection `sx=(x-y)*0.866, sy=(x+y)*0.5-z`; solids are depth-sorted with the painter's algorithm. Produces `Sym.part()`-style path data normalized to a 0–100 box.
- **`catalog.js` / `catalog2.js`** — composite isometric buildings built on top of `Iso.Scene`, organized by theme (`catalog2.js` loads second and pushes additional items + material variants into the same `IsoCatalog.ITEMS` table). Civic buildings (inn/tavern/library/shrine/well/stall/smithy/bakery) are generated from a shared `CIVIC_CULTURE` (5 regional material/roof signatures) × `CIVIC_TIER` (5 wealth levels, 1–5, driving scale + wing/accent additions) grid in `catalog2.js` — `civicLabel()` builds the `"<Bina> · <katman>.<isim> · <kültür>"` display name from the pair, so adding a new civic building type is one `CIVIC_CULTURE.forEach(cul => CIVIC_TIER.forEach(tier => reg(...)))` block reusing an existing scene-generator function shape. House variants (`ivh_*`, 9 materials × 6 roofs = 54) predate this grid and are labeled via a simpler `HOUSE_WALL`/`HOUSE_ROOF` → tier/culture mapping (`TIER_NAMES`) rather than driving geometry from it.
- **`symbols.js`** — `Sym`, the flat (non-isometric) symbol index (~200+ ink-style symbols as `{d, f, s, lw, tr}` Path2D parts in a 0–100 coordinate space centered at (50,50)), plus custom PNG symbol upload/registration. The same path data draws to canvas via `Path2D` and is written verbatim as `<path>` in SVG export — SVG output is genuinely vector, not embedded bitmap.
- **`names.js`** — `Names`: syllable-based fantasy place-name generator. Seven cultures (western / med / north / east / stone / sylvan / savage), each with its own onset / nucleus / coda inventory and a `birlesik` flag deciding compound (`Ashford`) vs. flowing (`Mithriel`) construction; eight feature types add a TR/EN suffix. No dictionary, no external data. `Names.generate(culture, feature, lang, seed)` is seeded (same seed → same name) so output is testable.
- **`i18n-names.js`** — `NameI18N` lookup table + `i18nName(key, tr, en, lang)` helper. Display names for symbols/buildings/terrain/categories/label presets/layers live as `tr`/`en` fields on their own data structures (`symbols.js`, `catalog.js`/`catalog2.js`, `layers.js`, `canvas.js`); this table supplies the other 8 UI languages by id/key, falling back to English when a key or language is missing. `ui.js`'s eleven-language switcher (see `DICT` in `ui.js`) covers chrome strings directly — this module only covers catalog/data names. Arabic (`ar`) is filled in here for the **structural** names only (34 terrain types, symbol categories, label presets, the 13 layer names, typeface families, name-generator cultures); the 910 catalog symbol names fall back to English.
- **`history.js`** — `History`, 50-step undo/redo. Brush strokes are stored as bbox-cropped PNG patches (not full layer copies), so even an 8192² canvas keeps undo memory small; `rasterMulti` lets one undo step atomically touch multiple layers (e.g. the sea eraser clears both land and terrain); `combo` does the same for a raster+vector mix in one atomic step (e.g. the lasso tool moving painted land together with the symbols/resources/labels/links sitting on it).
- **`export.js`** — `Exporter` and `downloadFile`: PNG/SVG export and `.json` project save/load, plus two share/print paths. `Exporter.html(opts)` writes a **single self-contained `.html`**: the map as a data-URI image plus an inline pan/zoom viewer (`_viewerHTML`) — no external requests, no library, so a map can be emailed and double-clicked. `Exporter.print(opts)` scales the map into the printable area of a chosen page (A5–Tabloid, orientation, margin, DPI), writes it into a hidden iframe with an `@page` rule and calls `print()` on it — the browser's "Save as PDF" produces the PDF, so there is no PDF library in the repo; a hidden iframe rather than a popup avoids popup blockers. `png`, `html` and `print` all share `Exporter.renderToCanvas(w, h)`, the single scaled `renderMap` path (grid included).
- **`ui.js`** — `UI`: panels, the TR/EN `DICT` i18n table, the layer list, symbol library browser, label presets, scale bar controls, keyboard shortcut bindings. The left tool rail is split into **five functional groups** (`grp_navigate` / `grp_terrain` / `grp_water` / `grp_markers` / `grp_regions`) over a 3-column grid; a group whose count is not a multiple of 3 centres its lone trailing tool via `.tool-grid > .tool:last-child:nth-child(3n+1){grid-column:2}`, so `grp_markers`'s four tools read as deliberate rather than ragged; the markup lives in `index.html` as `.tool-group > .tool-group-label + .tool-grid`, and `TUTORIAL_GROUPS` in `ui.js` mirrors the exact same grouping and order so the Rehber page teaches the layout the user actually sees. Tool buttons must keep their `.tool` class and `data-tool` attribute — `bindTools`/`setTool` bind through `querySelectorAll('.tool')`, so wrapping them in group containers is safe but renaming is not.

### Adding a new symbol

Add to the relevant category's `items` array in `js/symbols.js`:
```js
{ id, tr, en, parts: [part('M...', 'fill', 'ink', 3)] }
```
Coordinate space is 0–100, centered at (50,50).

### Key data-flow points

- User input → `Tools` mutates `App.*` settings and/or writes into `Layers` (raster patches or vector object arrays) → `History` snapshots the change → `Cv` re-renders from `Layers` state.
- Canvas defaults to 2048×2048 at `App.init()`, but size is per-project: `Exporter.newProject(w, h, name)` (called from the Canvas tab's new-canvas form) accepts independent width/height.
- Why Canvas 2D and not WebGL: raster layers are kept full-resolution in offscreen canvases and composited to screen with a single `drawImage` (browser already GPU-accelerates this); WebGL would add per-stroke shader cost and complicate the `getImageData`-based shore thresholding and SVG export.
