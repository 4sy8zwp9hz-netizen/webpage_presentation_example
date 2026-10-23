# Manufacturing studies — public report examples

Two browser-only public editions of saved manufacturing investigations, hosted with GitHub Pages.

- **Resistance shift investigation:** 345 observed wafer summaries, relative-week trend, geometry associations, equipment groups, and saved adjustment results.
- **Qualification and burn-in:** 3,527 wafer–protocol summaries across 2,489 wafers and 23 protocols, derived from 160,092 positive finite paired-device records.

The reports preserve observed trends; the data are not synthetic. Identifiers are pseudonymized, original dates become relative weeks, and absolute electrical and geometry measurements use normalized indices. Dimensionless degradation ratios and sample counts are retained. Specific recipes and physical failure-mechanism details are omitted. These are adapted public editions, not full copies of the source application.

## View

GitHub Pages serves the `docs` folder on `main`. Start from the homepage and follow either study link. Reports include working cohort filters, chart views, paginated evidence tables, CSV export, methods, and print support.

For a local preview, run `python -m http.server 8089 --directory docs` and open `http://localhost:8089/`.

## Data and interpretation

Each resistance point is an observed wafer summary. A positive constant normalizes each measurement field so its full-cohort median is 100, preserving relative changes and rank associations. Saved adjusted-model estimates apply to the original full cohort and do not change with filters.

Each qualification point is the median of device-level ratios within one wafer and one original test-condition group. Protocols remain separate. Recorded wafer qualification status is distinct from device degradation; this report does not infer chip pass/fail counts or burn-in yield. Logarithmic ratio axes retain the full positive range, including extreme ratios. See each report's methods for cohort eligibility and exclusions.

Anonymized public data live in `docs/assets/`. Each study loads its own dataset. The site uses no external JavaScript dependencies, fonts, analytics, or production-system connections.

## Publication boundary

Only this README and the `docs` directory are intended for this repository. Original source data, preparation scripts, identity maps, normalization factors, internal application source, and local working files are excluded. `publication-audit.json` records the public data counts and completed parity checks.

When adding reports, create a new `docs/studies/<slug>/index.html`, add a homepage link, and inspect the full publication set including downloads and embedded chart data.
