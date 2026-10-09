# San Pedro de Atacama Tours

A complete Hugo site following the **initial publishing scope** in `website-plan.txt`: a tour-selection homepage, all 19 additional pages in its first-20 list, six supporting navigation/planning pages, 14 individual product guides, and three utility pages. Total: **40 editorial/commercial pages + About, Privacy and Terms**, plus a custom 404.

The homepage follows the requested sequence: quick picks → six tour categories → comparison → trip length → packages → booking checks → practical planning → reviews and FAQs. The commercial emphasis is Piedras Rojas, El Tatio, stargazing, Moon Valley, lagoons and packages.

## Preview and build

Hugo Extended 0.164.0 was used. No npm dependencies or external Hugo theme are required.

```bash
hugo --cacheDir /tmp/atacama-hugo-cache --gc --minify --cleanDestinationDir
python3 -m http.server 8765 --bind 127.0.0.1 --directory public
```

Open <http://localhost:8765/>. The `public/` folder is the static deployment artifact. This work has **not been deployed** and no hosting account, DNS record or remote repository has been changed.

For editing with live reload, use `hugo server --cacheDir /tmp/atacama-hugo-cache`. Re-run the production build before deploying.

## Content and booking data

- `content/`: complete page text, FAQs, metadata, related links and selected product IDs.
- `data/offers.json`: 14 checked GetYourGuide products, with prices, ratings, inclusions, exclusions, restrictions, source date and review summaries.
- `data/galleries.json`: product galleries, distinguishing operator images from illustrative regional photography.
- `research/site-inventory.json`: independent list of the 39 additional content URLs. All appear exactly once in the homepage Explore section.
- `research/website-plan.txt`: the supplied plan; `research/scope.md` records its initial publishing boundary.
- `research/<product-id>.json`: captured source information. It is research material and is not published by Hugo.
- `static/images/`: self-hosted WebP photos, responsive variants and 40 dedicated social images. Original user photographs remain untouched in the parent workspace.

Partner **1MSALBX** comes from the supplied analytics snippet. Campaign **sanpedrodeatacamatours** is consistent site-wide. Change these only in `hugo.toml`; the head loader, widgets and runtime links use those settings. Booking buttons ship with working bare URLs and add attribution in JavaScript. External bookings are handled by GetYourGuide.

Displayed USD prices are rounded snapshots checked on **9 October 2026**, not live quotes. Ratings refer to identified products. Written reviews are labelled summaries; products with no substantive review text have no invented testimonial. Product schema uses captured source prices and counts without fabricated shipping, returns or site-wide ratings.

## Source-sensitive details

The featured Baltinache listing reports floating suspended from 29 September 2026. Pages describe the current sightseeing format and do not promise a reopening date. Recheck this notice before publishing or changing the recommendation. The Puritama transfer excludes pool admission. The selected Uyuni product returns to San Pedro after four days. Package pages separate included reserve admission from extra fees.

The seasonal page cites Chile Travel and operator evidence, includes a month table and an approximate lunar date guide, and has three independent answer-box reviews. The checker is neither a weather forecast nor a live availability or road-safety service.

No Stay22 ID was supplied. The accommodation page compares areas and transport considerations; it does not invent hotel offers, hotel rankings or an affiliate account.

## Verification

```bash
python3 scripts/qa.py
# With the production preview server running:
python3 scripts/browser-qa.py http://127.0.0.1:8765
```

The browser check requires Python Playwright and Chromium. In the build environment, Chromium also needs:

```bash
export LD_LIBRARY_PATH=/home/marina/tools/libroot/usr/lib/x86_64-linux-gnu
```

See `research/QA-REPORT.md` for results and the documented adaptations of single-tour factory checks to this multi-tour homepage. Machine-readable results and screenshots are in `research/qa/`.

## Future pages from the plan

The plan explicitly prioritises its first 20 pages. Remaining clusters are recorded in `research/future-pages.md`; they are not published as empty pages or linked as if they exist. Product details supplement the initial topical pages rather than replacing them.
