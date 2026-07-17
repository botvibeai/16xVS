# V24 Quote-Repair Probe

- `date`: `2026-05-16`
- `baseline`: `v23 four-head proof package`
- `base training spec`: `embedding-training-spec-v13-balanced-triad`
- `model`: `learned-hybrid-prototype-v24-quote-repair-hierarchical-packer-v2`
- `purpose`: Test whether a narrow quote-theme repair head can improve the remaining quote and quote-paragraph semantic failures without claiming a new baseline.

## Training Notes

The generator adds five quote-theme boundary groups over the v13 balanced-triad base:

- `quote_theme_discipline_boundary`
- `quote_theme_truth_boundary`
- `quote_theme_patience_boundary`
- `quote_theme_courage_boundary`
- `quote_theme_craft_boundary`

The generated v24 training artifacts contain:

| Metric | Value |
| --- | ---: |
| groups | `26` |
| items | `230` |
| positive pairs | `976` |
| negative pairs | `1224` |
| total pairs | `2200` |

## Single-Head Result

| Case | Min Margin | Avg Patches | Collapse | Result |
| --- | ---: | ---: | --- | --- |
| `book-root` | `-11` | `3` | false | fail |
| `governance-adversarial` | `-1.5` | `2.8333` | false | fail |
| `archive-pressure` | `-3` | `3` | false | fail |
| `booklike` | `-11` | `3` | false | fail |
| `mega-book-ladder` | `26.25` | `2.9167` | true | fail |
| `quote` | `-12.8` | `1` | false | fail |
| `quote-paragraph` | `-10.3333` | `1` | false | fail |
| `blind-holdout` | `-14.6667` | `1` | false | fail |
| `stress-100` | `-29.8778` | `1` | false | fail |

## Read

V24 is a quote-repair signal, not a baseline. It improves the quote surfaces relative to the v23 selected heads, but both target surfaces remain negative. It also regresses the locked single-head guardrails, so it only makes sense as a candidate specialist head.

Target comparison against v23 selected-head margins:

| Target | V23 Selected Margin | V24 Single-Head Margin | Read |
| --- | ---: | ---: | --- |
| `quote` | `-18.2` | `-12.8` | improved, still fail |
| `quote-paragraph` | `-20.25` | `-10.3333` | improved, still fail |

## Artifacts

- [v24 generator](scripts\generate-v24-quote-repair-spec.mjs)
- [v24 spec](data\training\embedding-training-spec-v24-quote-repair.json)
- [v24 pairs](data\training\embedding-training-pairs-v24-quote-repair.json)
- [v24 base model](models\learned-hybrid-prototype-v24-quote-repair-base.json)
- [v24 hierarchical model](models\learned-hybrid-prototype-v24-quote-repair-hierarchical-packer-v2.json)
- [single-head reports](bench\fortify-2026-05-16-v24-quote-repair)
