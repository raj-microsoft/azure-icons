# Azure architecture icon browser

An unofficial, searchable browser for the official Microsoft Azure Architecture Center V25 icon pack (November 2026). Not a Microsoft product. No Microsoft or Azure logo is used as the site's brand.

**Live:** https://raj-microsoft.github.io/azure-icons/

## Run and build

Requires Node.js 22+.

```sh
npm ci
npm run dev
npm run build
```

Vite publishes to `docs/` with base `/azure-icons/`. GitHub Pages serves the `main` branch's `/docs` directory. Generated assets and index are included, so the official archive is not required for normal application builds.

## Regenerate the data and PNGs

Download the [official V25 ZIP](https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V25.zip) and extract so the category folders live at `src/raw/Azure_Public_Service_Icons/Icons/`. Then run `npm run data` and `npm run build`. The ZIP, raw source folder and PDFs are excluded from Git.

`scripts/build-icons.mjs` derives full display names, categories, deterministic IDs and alias keywords. It groups identical names across categories, retains their source counts and emits `public/icons.json`. The original SVG bytes are copied without modification; resvg rasterizes the full viewBox and sharp contains the result within transparent 64px and 256px squares without cropping or changing proportions. `scripts/provenance.json` records every source filename and SHA-256. Names are taken from the pack, with ACA Sandboxes expanded to Azure Container Apps Sandboxes. Historical service names are preserved rather than silently renamed. The 721 source files become 643 unique-name entries (78 repeated names consolidated). Two repeated names have byte-different sources within one category: Workspaces and Load Balancer Hub. The canonical artwork is the first file in deterministic filename order; all original paths and hashes remain in the provenance manifest, and the complete original pack remains linked. Only the four explicitly named November 2026 additions on the official update table receive a new badge; the table does not identify the other four.

## Features

- Instant Fuse.js search across names, category and acronyms; matching name text highlighted.
- `/` to focus search; arrow-key grid navigation; native focus-trapped details dialog.
- Category filters with search-aware counts, new-in-November filter and zero-result recovery.
- Original SVG, transparent 64/256 PNG, copy markup/name and multi-select ZIP.
- Lazy images, progressive 60-item rendering and CSS content visibility.
- System-aware, persistent light/dark theme; reduced-motion support; 390px mobile layout.
- Shareable `?q=`, `?category=`, `?new=1` and `#icon-id` URLs.
- No analytics, backend, accounts or third-party requests at runtime. Fonts self-hosted.

## Verification

`npm test` launches installed headless Microsoft Edge against the local Vite server. Set `TEST_URL=https://raj-microsoft.github.io/azure-icons/` for the live deployment. It tests search, filters, keyboard navigation, clipboard, downloads, ZIP, deep links, mobile overflow, theme changes and 20 deterministic random icon SVG/PNG pairs. Screenshots and reports are local ignored artifacts. Review `VERIFICATION.md` for the publication check summary.

## Microsoft icon terms

Icons © Microsoft, from the Azure Architecture Center V25 pack, used under Microsoft's icon terms. Unofficial browser.

Microsoft permits use in architectural diagrams, training materials and documentation. Copy, distribute and display only for those permitted uses unless Microsoft gives explicit permission. Label icons with their full service name. Do not crop, flip, rotate, distort or change their shape. Do not use Microsoft product icons to represent your own product or service. Microsoft reserves all other rights.

[Official icon page and terms](https://learn.microsoft.com/en-us/azure/architecture/icons/) · [Original V25 archive](https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V25.zip)

The icon terms are not an open-source license. This repository does not grant additional rights in Microsoft artwork.
