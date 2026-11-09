# Verification record

Build date: 10 November 2026 (Europe/Amsterdam).

## Data and assets

- 721 official V25 source SVGs; 643 unique-name entries; 29 categories. The 78 repetitions are consolidated, with category membership retained.
- Four explicitly identified November additions carry badges. The official page names only four of eight; the remaining additions are not guessed.
- Every canonical SVG checked against its original SHA-256. Git attributes disable text conversion for SVGs. Mixed-line-ending originals were also checked against committed Git bytes.
- All 1,286 PNGs validated: 64×64 or 256×256, with alpha channels.
- Twenty deterministic random source SVG/PNG pairs browser-decoded and compared pixel-for-pixel against a fresh source rasterization; all match. Pair contact sheet visually inspected.
- Workspaces and Load Balancer Hub each have two byte-different source files under the same name; deterministic first-file artwork is used. See README and provenance manifest.

## Application gates

`npm run build`: TypeScript and production Vite build pass.

`npm test` against production preview in installed headless Microsoft Edge:

- Search `aks`, `key vault`, `foundry`, `sql`; name highlighting.
- Category filtering and counts, four-new-icons filter, empty state and reset.
- `/` shortcut, arrow grid navigation, Enter to inspect, Escape and focus return.
- Copy name and SVG read back from browser clipboard.
- SVG and both PNG downloads saved and validated; selection ZIP extracted and checked.
- Query and hash deep links loaded into search and details.
- Light/dark switching; 1440px and 390px screenshots; no mobile horizontal overflow; modal actions fit.
- Zero JavaScript exceptions or HTTP failures during the tested flows.
- Axe WCAG A/AA automatic scans: zero violations in desktop light and dark. This is not a full accessibility certification.

Local screenshot set: `.impeccable/review/`. Live deployment uses the identical script with `TEST_URL=https://raj-microsoft.github.io/azure-icons/` and writes screenshots, accessibility results, payload timings and the complete report under `verification/live/` (intentionally not committed).

## Design gate

Impeccable setup, product record, code-led direction, craft floor and documentation completed. Detector run on built HTML, stylesheet and TypeScript returned `[]` (zero findings). It warned that the base-prefixed linked CSS could not be resolved from the HTML path; the actual source stylesheet was included as a separate detector target. Inline finish review and correction recorded in `.impeccable/finish-review.md`; no independent reviewer or interactive design interview is claimed.

## Payload and dependencies

- JavaScript: 50.95 kB raw / 19.91 kB gzip.
- CSS including font declarations: 19.20 kB raw / 7.30 kB gzip.
- Index: 105,611 bytes raw / 16,579 bytes gzip.
- Latin variable font: 24.84 kB; other subsets are Unicode-range conditional.
- Complete deployed asset set approximately 8.3 MB; icons and PNG exports are fetched on demand. Grid appends 60 entries at a time; images lazy-load and cells use content visibility.
- `npm audit`: zero vulnerabilities after upgrading the build-only image dependency to sharp 0.35.5.
- ZIP, PDFs, raw extraction, node_modules and local verification captures are excluded from Git. Font and runtime library licenses accompany the distribution.
