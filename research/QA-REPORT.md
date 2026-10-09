# Local acceptance report

Build date: 9 October 2026. Site: `sanpedrodeatacamatours.com`. Status: local build; no deployment performed.

## Scope and content

- All 20 URLs in the plan's initial publishing list exist, including the homepage.
- Six supporting pages and 14 researched individual product guides bring the total to 40 commercial/editorial pages. Three utility pages and the 404 produce 44 HTML documents.
- All 39 additional content URLs appear exactly once in the homepage Explore section. The tour guides and product-detail directory are separated visually for readability.
- Fourteen GetYourGuide products have captured source records, actual prices and ratings, specific inclusions/exclusions, pickup guidance and restrictions. Five photographs appear on each product page; illustrative regional photographs are labelled.
- The site's own content does not claim personal tour participation. Published review summaries are labelled and attributed. Products with only an empty review entry have no invented written testimonial.

## Passed checks

| Check | Evidence |
|---|---|
| Production build | Hugo Extended 0.164.0, `--gc --minify --cleanDestinationDir`; no build warnings |
| Structured data | 44 HTML documents, 139 parsed JSON-LD blocks; valid numeric source prices and review counts |
| Static acceptance | `qa/local-acceptance.json`: all pages, images, responsive image candidates, canonicals, social images, internal paths and anchors resolve |
| Internal-link audit | Initial factory audit: 2,146 internal hrefs, zero dead destinations; final local parser also checks anchors and image links |
| Inbound links | All editorial spokes reachable; no orphan pages |
| Booking fallbacks | 176 attributed-link candidates have a real bare GetYourGuide destination in static HTML |
| Analytics and campaign | One head loader on all 44 pages; 39 widgets consistently use `1MSALBX` / `sanpedrodeatacamatours` |
| Browser sweep | 220 page/viewport combinations: 44 pages at 320, 390, 768, 1024 and 1440px; no horizontal overflow or script exceptions |
| Hero position | Factory gate: 120 page/viewport combinations; all hero facts visible on first paint and within the fold |
| Flat design | Factory browser audit: square corners, no decorative panel elevation, uppercase section-label tier and readable colours |
| Responsive layout | Final factory viewport audit: all six-width sample checks pass; inherited review-card overflow fixed |
| Dark surfaces | 318 sampled text elements pass their contrast thresholds |
| JavaScript disabled | Bare booking links, exposed mobile navigation and native FAQ disclosure still work |
| Date checker | Three actual input submissions change summer/winter advice, lunar guidance and the seasonal CTA destination |
| Live widget canaries | Piedras Rojas, stargazing and package widgets hydrate in the local browser with the correct partner and campaign; no reservation made |
| Initial image payload | Homepage at 390px: 228,096 encoded image bytes before scrolling in the local browser; this is not a production PageSpeed/LCP claim |
| Seasonal editorial review | Final title and exact answer paragraphs independently reviewed by three agents; all PASS; final SHA1 recorded in `data/judge_best-time-to-visit.json` |

## Contrast correction

The full hero sweep covered every hero-bearing page at five widths. It found three subtitle failures only at 320px: Baltinache (4.44:1), El Tatio (4.02:1) and Uyuni (3.41:1), against a 4.5:1 requirement. The shared overlay now retains its 70% charcoal stop to 82% of hero height. It only increases the dark protection behind light text; layout, text colour and button surfaces remain the same. The targeted recheck covers those three pages, homepage and best-time page at all five widths. **Final result: PASS — all 150 text runs in the 25 page/width rechecks clear AA.** See `qa/hero-contrast-recheck.log`.

## Template-specific audit differences

The stock homepage-order gate is for a single featured tour. It expects a different order and a chronological tour timeline. This build implements the supplied multi-tour plan, with alternative trip lengths. The local acceptance script verifies that requested sequence, six category cards, all product destinations and the independent URL inventory.

The old rendered-page script looks for prices under `tour-price-amount` and a specific experience-card class. It labels this build's visible `.offer-price` values blank. The local parser verifies visible prices, exact source values in Product schema and gallery depth on all 14 product pages. These selector incompatibilities are recorded rather than concealed as a green legacy run.

The seasonal verifier records **133 passed, 36 skipped, four warnings and one parser false positive**. ANS-AVAIL does not recognise “can be visited throughout the year” as availability wording. That qualified statement appears in the answer's second sentence and passed all three independent human-style reviews. The warnings concern optional summary/choice presentation and repetition of the recommendation in its source attribution. The site's actual checker is covered by the project browser test because the generic seasonal render script did not recognise `#visit-date`. See `skill-feedback.md` for the precise upstream fixes.

## Checks that require publication

Live-domain HTTP/redirect behavior, a Google Rich Results Test against a public URL, Search Console crawl results, and production PageSpeed measurements remain untested because the site was not deployed. No live-pass claim is made for those checks. Product operation, prices and reserve access should be rechecked when publishing, especially the Baltinache suspension.

## Reproduction

From the site folder:

```bash
hugo --cacheDir /tmp/atacama-hugo-cache --gc --minify --cleanDestinationDir
python3 scripts/qa.py
python3 -m http.server 8765 --bind 127.0.0.1 --directory public
# In another terminal:
python3 scripts/browser-qa.py http://127.0.0.1:8765
```

The installed factory and seasonal audit paths are recorded in the logs and README. No installed skill file was modified.
