# V27 Route-Gated Repair Probe

- generatedAt: `2026-06-12T20:19:38.422Z`
- claimLevel: `route-gated-proof`
- v23PrimaryPreserved: `true`
- cloudmersive: `disabled; optional external audit only`

## V26 Leakage Audit

- unrestrictedSelectedHead: `stressSplitV26`
- gatedSelectedHead: `governance`
- leakReproduced: `true`
- leakBlocked: `true`

## Primary Gates

| Case | Selected Head | Expected Margin | Actual Margin | Avg Patches | Pass |
| --- | --- | ---: | ---: | ---: | --- |
| book-root | bookRoot | 8 | 8 | 3 | true |
| governance-adversarial | governance | 3.5 | 3.5 | 2.8333 | true |
| archive-pressure | governance | 8 | 8 | 3 | true |
| booklike | booklikeRepair | 7.5 | 7.5 | 3 | true |
| mega-book-ladder | default | 31 | 31 | 2.9167 | true |

## Target Quarantine

| Case | Selected Head | Eligible Heads | Min Margin | Pass |
| --- | --- | --- | ---: | --- |
| quote | default | quoteRepair, quoteSplitV26, default | -18.2 | true |
| quote-paragraph | default | quoteRepair, quoteSplitV26, default | -21.5 | true |
| blind-holdout | default | blindSplitV26, default | -15.5 | true |
| stress-100 | default | stressSplitV26, default | -28.6444 | true |

## Read

V27 bans universal repair-head competition by applying lane ownership before ranked selection. This is route-governance evidence, not a new semantic repair baseline.

## Claims Not Allowed

- V27 as a production router.
- Quote, blind, or stress semantic repair unless those margins cross zero on independent holdouts.
- Broad tokenizer superiority, 99.99% raw-source reduction, or 1.25 GB corpus-collapse claims.
- Cloudmersive-backed proof; no external API was called.

## Logs

- audit-governance-unrestricted-ranked: bench/fortify-2026-06-12-v27-route-gated/logs/audit-governance-unrestricted-ranked.log
- v27-gated-book-root: bench/fortify-2026-06-12-v27-route-gated/logs/v27-gated-book-root.log
- v27-gated-governance-adversarial: bench/fortify-2026-06-12-v27-route-gated/logs/v27-gated-governance-adversarial.log
- v27-gated-archive-pressure: bench/fortify-2026-06-12-v27-route-gated/logs/v27-gated-archive-pressure.log
- v27-gated-booklike: bench/fortify-2026-06-12-v27-route-gated/logs/v27-gated-booklike.log
- v27-gated-mega-book-ladder: bench/fortify-2026-06-12-v27-route-gated/logs/v27-gated-mega-book-ladder.log
- v27-gated-quote: bench/fortify-2026-06-12-v27-route-gated/logs/v27-gated-quote.log
- v27-gated-quote-paragraph: bench/fortify-2026-06-12-v27-route-gated/logs/v27-gated-quote-paragraph.log
- v27-gated-blind-holdout: bench/fortify-2026-06-12-v27-route-gated/logs/v27-gated-blind-holdout.log
- v27-gated-stress-100: bench/fortify-2026-06-12-v27-route-gated/logs/v27-gated-stress-100.log

