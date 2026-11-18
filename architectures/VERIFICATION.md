# Phase 1 verification · 2026-11-18

## Published baseline

- Live route: https://raj-microsoft.github.io/azure-icons/architectures/
- HTTP 200; headless Edge loaded and counted **187 cards**, with no failed requests or browser errors.
- Initial local commit: `21b187c`.
- Published, tree-matched commit: `d63d30f8bfb42af637d7d77233057804b3379217`.
- Author: Raj Balakrishnan <raj-microsoft@users.noreply.github.com>.
- Publication used the task-authorized repository helper; local history was aligned only after checking equal trees. No raw variants or logs were committed.

## Checks performed

- Build refreshes the Learn API at build time, using stable title ordering; 187 distinct articles, 187 reviewed mappings, 24 used archetypes. All original snapshot articles are included. All links are absolute Learn URLs. No Microsoft thumbnails.
- `tsc --noEmit` and Vite production build pass. Existing `npm test` icon-collection regression suite also passes: search/filters, modal, clipboard, SVG/PNG/ZIP downloads, keyboard navigation, theme, mobile, reduced motion, and 20 source-fidelity samples.
- Two deterministic scene-clock frames (850ms and 2850ms) differ; real-time captures also differ. Settled frames remain readable.
- Shared Motion toggle and system reduced motion produce identical successive screenshots. IntersectionObserver pauses offscreen scenes. The active-set cap is 12.
- Search; category, article type and product filters; A–Z/newest ordering; no-results state; clearing; keyboard shortcut; 390px mobile overflow checks pass.
- Axe WCAG 2/2.1 A/AA: zero violations on desktop light, desktop dark and mobile.
- Hostile SVG fixtures: scripts, event handlers, external references and foreignObject cannot survive. Malformed XML, DTD/entities, unsafe CSS, oversize data and invalid motion are rejected. IDs, selectors and keyframes are scoped. Both SMIL and CSS fixtures pass actual inline-card motion, toggle and reduced-motion tests; test fixtures were not published.
- The 24-archetype contact sheet was rendered at mid-animation and settled and inspected. The first visual pass found a missing lighthouse tower; fixed and rechecked. Bridge trajectories and the gate passage were improved. A second refinement gives globes 3–5 hubs, brains variable agent groups, container harbors variable stacks and hybrid connections distinct cable curves; moving data now follows its actual stream/cable.
- Design detector: advisory differences only; no blockers. Surface palette variations belong to the requested original vector illustrations. Existing site look is preserved.

## Demos and provenance

Direct captures of the real page; no generated raster previews are used in the site.

- `C:\Users\dev\.openclaw\media\outbound\aac-cards.png` — 24 complete real cards.
- `C:\Users\dev\.openclaw\media\outbound\aac-page.mp4` — 20 seconds, 1280×900, H.264, 24fps, silent.
- `C:\Users\dev\.openclaw\media\outbound\aac-page.gif` — 20-second compact preview, below 8 MB.
- Detailed ignored test reports, contact sheets and frames: `verification/aac/`.

## Boundaries

Phase 2 has **not** started. No ChatGPT account was used. The sanitized `art` override hook and runbook are ready. The conceptual pictures are not authoritative deployment diagrams; Microsoft Learn remains the source of architecture guidance. Product icons are used only for actual supported matches, unchanged in shape/aspect ratio. The renderer is tested on Edge desktop/mobile emulation, not every browser or physical device.
