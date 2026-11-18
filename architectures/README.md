# Azure Architecture Center: living ideas

**Phase 1 only.** `/azure-icons/architectures/` is a second Vite entry. It uses 24 original geometric SVG archetypes, not Microsoft's article thumbnails. No ChatGPT conversations or Phase 2 illustrations were created.

## Source and coverage

`npm run build` runs `scripts/fetch-aac.mjs`, then `scripts/build-scenes.mjs`, TypeScript and Vite. The committed source is `public/architectures/articles.json`; every URL is absolute on `https://learn.microsoft.com/`.

The supplied 187-row research snapshot contained three duplicate pairs (184 distinct URLs). Microsoft's default relevance order is not stable across page requests. Fetching `$top=30&$skip=N&$orderby=title` recovers **187 distinct articles**, including the omitted multitenancy overview, baseline Foundry chat architecture, and multiregion load-balancing article. All 187 original rows' distinct articles remain covered. No thumbnail URLs are retained.

## Mapping and parameters

`public/architectures/scenes.json` is keyed by the article's stable URL-derived ID. **All 187 entries have a hand-reviewed mapping**, recorded by title in `scripts/aac-reviewed.json`. The review decisions were made against the supplied titles, summaries, categories and services; the three recovered titles received explicit mappings too. `review-aac-once.mjs` records the original ordered review but is not part of future builds.

Future articles first match title intent, then summary/categories/products. Specific intent wins over incidental services: migration → bridge; private upload → gate/vault; cache → pantry; recovery → lighthouse; identity → key; WAN/regional distribution → globe; routing/integration → switchyard; documents → press; analytics → orchard; ETL/manufacturing → factory; containers → harbor. AI uses coordinated agents; hybrid uses connected islands. The final fallback is a compute workshop and is marked unreviewed. Existing art paths survive rebuilds.

Each URL-derived seed controls palette accent, subject framing, counts, windows/books, route variant, phase and a 4–6 second duration. Product actors are matched to actual `public/svg/` assets via explicit aliases or exact names. Unsupported products remain named in accessible metadata; no near-match icon is invented. Framing/palette combinations are unique across all 187 entries.

## Archetypes

Globe network; gate/vault; bridge migration; pipeline factory; brain/agents; web city; data lake; shield fortress; hybrid islands; DevOps conveyor; IoT satellite; media stage; archive library; container harbor; routing switchyard; monitoring observatory; analytics orchard; document press; cache pantry; recovery lighthouse; compute workshop; identity key; quantum orbits; tenant apartments.

## Motion and accessibility

One requestAnimationFrame loop computes small-group transforms using exponential easing. IntersectionObserver admits at most 12 visible cards. Offscreen/hidden cards stop; the shared `icon-motion` preference and `prefers-reduced-motion` show a deliberate static composition. CSS/SMIL art is similarly clocked and paused. Search and native selects are labeled, article links describe their destinations, and titles wrap without clipping. Summaries occupy one line with the full source text available as a tooltip. Dark/light themes inherit the icon collection.

## Phase 2 hook

1. Save raw worker output outside `public/` and `docs/`.
2. Run `node scripts/sanitize-art.mjs <in.svg> public/architectures/art/<slug>.svg` using Node 24+.
3. Look at the SVG at 320×200 at mid-animation and settled. Its subject must remain legible. Motion must use only transforms, opacity or stroke-dashoffset.
4. Set the matching scene entry's `art` to `art/<slug>.svg` (relative to `public/architectures/`). Do not change its ID or remove fallback parameters.
5. Run the tests and build below. Commit only sanitized artwork, metadata and build outputs.

The reusable XML/CSS sanitizer strips scripts, foreignObject, unapproved elements/attributes, event handlers and external hrefs; rejects malformed XML, DTD/entities, unsafe CSS and disallowed animation attributes; prefixes IDs, selectors and keyframes; confines CSS to the illustration; enforces `viewBox="0 0 320 200"`, 320×200 dimensions and a strict 40 KB input/output limit. It exits nonzero with a reason. CSS and SMIL are supported. The browser sanitizes again with a per-card prefix before inline insertion. Missing/rejected art falls back to the archetype instead of breaking the card. No external references are permitted in bespoke art.

## Verification

```
npm run build
node scripts/test-sanitize-art.mjs
node scripts/verify-art-hook.mjs
npm run test:aac
```

The browser tests use headless Edge and require `npm run dev -- --port 4173` (or a preview server at that port). `TEST_URL` can target a deployed page for `verify-aac.mjs`. Outputs go to ignored `verification/aac/`. `?sheet=archetypes` is a small visual-review mode using the actual cards. `window.aacTest.frame(ms, settled)` freezes the actual renderer at a deterministic timestamp; it doesn't enable motion by default.

Tests cover 187 unique URLs and mappings, official icon existence, SVG/CSS safety, both art-hook animation forms, two virtual frames and real-time movement, motion/reduced-motion stillness, the 12-card cap, search, all filters, sort, empty state, keyboard search, mobile overflow and WCAG AA axe scans in light/dark/mobile. Art fixtures are intercepted test responses only and never published.

## Visual review · 18 November 2026

Inspected a contact sheet of every archetype at mid-animation and settled, plus actual desktop/mobile pages and 24 real cards. All 24 silhouettes are distinct. Repaired a malformed lighthouse tower, separated the gate bars around its passage, made the migrating house follow the bridge arch, and added seeded framing/count variation. Rechecked SVG console errors as well as JavaScript errors. Illustrations remain visible in static frames. The page preserves the existing material-library world; the source brief, not an unrequested identity redesign, determined the composition.

The design detector found only advisory palette/type/radius differences; no blocker. Typography and chip radii follow incumbent small metadata treatments. Illustration colors are intentionally local to the original art; UI controls continue to inherit site tokens. The UI hover edge is a restrained blue-green border. Raster demos are direct headless Edge captures of this authored page, not generated or third-party art; they are not shipped as card imagery.
