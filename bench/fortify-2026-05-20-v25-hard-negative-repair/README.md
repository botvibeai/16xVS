# V25 Hard-Negative Repair Probe

- generatedAt: `2026-05-20T11:26:30.136Z`
- claimLevel: `negative-or-mixed-probe`
- v23BaselinePreserved: `true`

## Target Gates

| Case | Previous | Single V25 Margin | Best Ranked Head | Best Ranked Margin | Selected Head | Selected Margin | Improved | Pass |
| --- | ---: | ---: | --- | ---: | --- | ---: | --- | --- |
| quote | -12.8 | -19 | quoteRepair | -12.8 | default | -18.2 | false | false |
| quote-paragraph | -10.3333 | -14.8333 | quoteRepair | -10.3333 | governance | -20.25 | false | false |
| blind-holdout | -15.5 | -17.4167 | quoteRepair | -14.6667 | default | -15.5 | false | false |
| stress-100 | -28.6444 | -24.0667 | quoteRepairV25 | -24.0667 | default | -28.6444 | true | false |

## Primary Lane Stability

| Case | Selected Head | Min Margin | Avg Patches | Pass |
| --- | --- | ---: | ---: | --- |
| book-root | bookRoot | 8 | 3 | true |
| governance-adversarial | governance | 3.5 | 2.8333 | true |
| archive-pressure | governance | 8 | 3 | true |
| booklike | booklikeRepair | 7.5 | 3 | true |
| mega-book-ladder | default | 31 | 2.9167 | true |

## Read

V25 does not replace v23. Treat it as repair evidence only; mined failure pairs mean the target surfaces are no longer independent blind proof.

## Claims Not Allowed

- V25 as the locked baseline unless all target gates pass and independent holdout verification is added.
- Production proof from mined failure-pair repair.
- Broad tokenizer superiority, 99.99% raw-source reduction, or 1.25 GB corpus-collapse claims.

## Logs

- single-quote: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/single-quote.log
- single-quote-paragraph: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/single-quote-paragraph.log
- single-blind-holdout: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/single-blind-holdout.log
- single-stress-100: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/single-stress-100.log
- ranked-book-root: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/ranked-book-root.log
- ranked-governance-adversarial: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/ranked-governance-adversarial.log
- ranked-archive-pressure: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/ranked-archive-pressure.log
- ranked-booklike: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/ranked-booklike.log
- ranked-mega-book-ladder: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/ranked-mega-book-ladder.log
- ranked-quote: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/ranked-quote.log
- ranked-quote-paragraph: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/ranked-quote-paragraph.log
- ranked-blind-holdout: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/ranked-blind-holdout.log
- ranked-stress-100: bench/fortify-2026-05-20-v25-hard-negative-repair/logs/ranked-stress-100.log

