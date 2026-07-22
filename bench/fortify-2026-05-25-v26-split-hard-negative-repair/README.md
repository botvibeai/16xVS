# V26 Split Hard-Negative Repair Probe

- generatedAt: `2026-05-25T19:02:16.211Z`
- claimLevel: `negative-or-mixed-probe`
- v23BaselinePreserved: `false`

## Split Specs

| Probe | Head | Base Spec | Explicit Negatives | Mined Groups |
| --- | --- | --- | ---: | ---: |
| quote-split | quoteSplitV26 | data/training/embedding-training-spec-v24-quote-repair.json | 17 | 10 |
| blind-split | blindSplitV26 | data/training/embedding-training-spec-v13-balanced-triad.json | 8 | 5 |
| stress-split | stressSplitV26 | data/training/embedding-training-spec-v13-balanced-triad.json | 9 | 5 |

## Target Gates

| Case | Target Head | Previous Best | Single Margin | Best Ranked Head | Best Ranked Margin | Selected Head | Selected Margin | Improved | Pass |
| --- | --- | ---: | ---: | --- | ---: | --- | ---: | --- | --- |
| quote | quoteSplitV26 | -12.8 | -10.8 | quoteSplitV26 | -10.8 | default | -18.2 | true | false |
| quote-paragraph | quoteSplitV26 | -10.3333 | -15 | quoteRepair | -10.3333 | governance | -20.25 | false | false |
| blind-holdout | blindSplitV26 | -14.6667 | -17.5 | quoteSplitV26 | -13.5833 | default | -15.5 | false | false |
| stress-100 | stressSplitV26 | -24.0667 | -26.8111 | blindSplitV26 | -25.8889 | default | -28.6444 | false | false |

## Primary Lane Stability

| Case | Selected Head | Min Margin | Avg Patches | Pass |
| --- | --- | ---: | ---: | --- |
| book-root | bookRoot | 8 | 3 | true |
| governance-adversarial | stressSplitV26 | 4.5 | 2.8333 | false |
| archive-pressure | governance | 8 | 3 | true |
| booklike | booklikeRepair | 7.5 | 3 | true |
| mega-book-ladder | default | 31 | 2.9167 | true |

## Read

V26 tests whether V25 failed from over-mixing repair pressure. Treat it as split-head repair evidence only, not as a baseline.

## Claims Not Allowed

- V26 as the locked baseline unless all target gates pass and independent holdout verification is added.
- Production proof from mined failure-pair repair.
- Broad tokenizer superiority, 99.99% raw-source reduction, or 1.25 GB corpus-collapse claims.

## Logs

- generate-quote-split-spec: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/generate-quote-split-spec.log
- build-quote-split-training-data: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/build-quote-split-training-data.log
- train-quote-split-model: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/train-quote-split-model.log
- derive-quote-split-hierarchical: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/derive-quote-split-hierarchical.log
- generate-blind-split-spec: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/generate-blind-split-spec.log
- build-blind-split-training-data: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/build-blind-split-training-data.log
- train-blind-split-model: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/train-blind-split-model.log
- derive-blind-split-hierarchical: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/derive-blind-split-hierarchical.log
- generate-stress-split-spec: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/generate-stress-split-spec.log
- build-stress-split-training-data: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/build-stress-split-training-data.log
- train-stress-split-model: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/train-stress-split-model.log
- derive-stress-split-hierarchical: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/derive-stress-split-hierarchical.log
- single-quote-quoteSplitV26: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/single-quote-quotesplitv26.log
- single-quote-paragraph-quoteSplitV26: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/single-quote-paragraph-quotesplitv26.log
- single-blind-holdout-blindSplitV26: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/single-blind-holdout-blindsplitv26.log
- single-stress-100-stressSplitV26: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/single-stress-100-stresssplitv26.log
- ranked-book-root: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/ranked-book-root.log
- ranked-governance-adversarial: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/ranked-governance-adversarial.log
- ranked-archive-pressure: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/ranked-archive-pressure.log
- ranked-booklike: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/ranked-booklike.log
- ranked-mega-book-ladder: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/ranked-mega-book-ladder.log
- ranked-quote: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/ranked-quote.log
- ranked-quote-paragraph: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/ranked-quote-paragraph.log
- ranked-blind-holdout: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/ranked-blind-holdout.log
- ranked-stress-100: bench/fortify-2026-05-25-v26-split-hard-negative-repair/logs/ranked-stress-100.log

