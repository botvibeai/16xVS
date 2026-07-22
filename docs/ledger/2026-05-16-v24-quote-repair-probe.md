# EXP-2026-05-16-002 V24 Quote-Repair Probe

- `id`: `EXP-2026-05-16-002`
- `date`: `2026-05-16`
- `purpose`: Test whether the remaining quote and quote-paragraph semantic failures can be repaired by a narrow quote-theme specialist without replacing the locked v23 proof package.
- `implementation_path`: `v24-quote-repair`
- `baseline`: `v23 four-head proof package`

## Method

- Started from `embedding-training-spec-v13-balanced-triad.json`.
- Added five paraphrased quote-theme boundary groups for discipline, truth, patience, courage, and craft.
- Avoided using the old holdout quote strings verbatim in the new training items.
- Trained `learned-hybrid-prototype-v24-quote-repair-base.json` with the same learned/prototype path used by prior specialist rounds.
- Derived `learned-hybrid-prototype-v24-quote-repair-hierarchical-packer-v2.json` with the current hierarchical fold constraints.
- Tested v24 as a single head, then as a fifth ranked specialist head, then ran a heuristic-blend sweep.

## Training Artifact Summary

| Metric | Value |
| --- | ---: |
| groups | `26` |
| items | `230` |
| positive pairs | `976` |
| negative pairs | `1224` |
| total pairs | `2200` |

## Single-Head Result

| Case | Min Margin | Avg Patches | Result |
| --- | ---: | ---: | --- |
| `book-root` | `-11` | `3` | fail |
| `governance-adversarial` | `-1.5` | `2.8333` | fail |
| `archive-pressure` | `-3` | `3` | fail |
| `booklike` | `-11` | `3` | fail |
| `mega-book-ladder` | `26.25` | `2.9167` | fail, signature collapse |
| `quote` | `-12.8` | `1` | fail |
| `quote-paragraph` | `-10.3333` | `1` | fail |
| `blind-holdout` | `-14.6667` | `1` | fail |
| `stress-100` | `-29.8778` | `1` | fail |

## Five-Head Ranked Result

| Case | Selected Head | Selected Margin | Best Ranked Head | Best Ranked Margin | Result |
| --- | --- | ---: | --- | ---: | --- |
| `book-root` | `bookRoot` | `8` | `bookRoot` | `8` | pass |
| `governance-adversarial` | `governance` | `3.5` | `governance` | `3.5` | pass |
| `archive-pressure` | `governance` | `8` | `governance` | `8` | pass |
| `booklike` | `booklikeRepair` | `7.5` | `booklikeRepair` | `7.5` | pass |
| `mega-book-ladder` | `default` | `31` | `default` | `31` | pass |
| `quote` | `default` | `-18.2` | `quoteRepair` | `-12.8` | fail |
| `quote-paragraph` | `governance` | `-20.25` | `quoteRepair` | `-10.3333` | fail |
| `blind-holdout` | `default` | `-15.5` | `quoteRepair` | `-14.6667` | fail |
| `stress-100` | `default` | `-28.6444` | `default` | `-28.6444` | fail |

## Blend Sweep Result

| Target | Best Variant | Best Margin | Result |
| --- | --- | ---: | --- |
| `quote` | `h0p2` | `-12` | fail |
| `quote-paragraph` | `h0p4` | `-9.5833` | fail |

## Claim Supported

- Quote-style semantic grouping is directionally trainable: the v24 quoteRepair head improves the quote margin from `-18.2` to `-12.8`, and quote-paragraph from `-20.25` to `-10.3333`.
- The ranked router correctly refuses to promote a better-but-still-negative specialist.
- The five-head probe preserves the v23 primary lane outcomes while exposing quoteRepair as the best failing head on the quote surfaces.

## Claim Not Supported

- V24 is not a new baseline.
- V24 does not solve quote or quote-paragraph semantic grouping.
- The blend sweep does not solve quote grouping.
- Blind holdout and stress-100 remain negative.
- This does not support production-proof, broad tokenizer-superiority, `99.99%`, or `1.25 GB` claims.

## Artifacts

- [v24 single-head summary](bench\fortify-2026-05-16-v24-quote-repair\README.md)
- [v24 five-head ranked summary](bench\fortify-2026-05-16-v24-five-head-ranked\README.md)
- [v24 blend sweep summary](bench\fortify-2026-05-16-v24-quote-blend-sweep\README.md)
- [v24 generator](scripts\generate-v24-quote-repair-spec.mjs)
- [v24 hierarchical model](models\learned-hybrid-prototype-v24-quote-repair-hierarchical-packer-v2.json)
