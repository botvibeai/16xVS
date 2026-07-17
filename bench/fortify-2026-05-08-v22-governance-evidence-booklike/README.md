# V22 Governance-Evidence Booklike Probe

- `date`: `2026-05-08`
- `baseline`: `v19-lock` / `v20-ranked-selector`
- `base training spec`: `embedding-training-spec-v13-balanced-triad`
- `model`: `learned-hybrid-prototype-v22-governance-evidence-booklike-hierarchical-packer-v2`
- `purpose`: Repair the remaining `governance_evidence_booklike` miss from v21 while preserving hierarchical fold shape.

## Training Notes

The first v22 training attempt used the v13 base plus v21-style booklike boundaries with `48` negatives per hard-negative pair. That run did not finish within the timeout and had not written a model after continued monitoring. The final v22 probe kept the same content but reduced `negativeSampleLimitPerPair` to `16`, producing:

| Metric | Value |
| --- | ---: |
| groups | `28` |
| items | `249` |
| positive pairs | `1093` |
| negative pairs | `1856` |
| total pairs | `2949` |

## Single-Head Result

| Case | Min Margin | Avg Patches | Result |
| --- | ---: | ---: | --- |
| `booklike` | `7.5` | `3` | pass |
| `book-root` | `-13.5` | `3` | fail |
| `governance-adversarial` | `-1.5` | `2.8333` | fail |
| `archive-pressure` | `1` | `3` | pass |
| `paraphrase-holdout` | `0.2` | `1` | pass |
| `multilingual-longform` | `30.5` | `3` | pass |
| `blind-holdout` | `-15.3333` | `1` | fail |
| `stress-100` | `-29.5556` | `1` | fail |

## Four-Head Ranked Result

This test adds v22 as a fourth `booklikeRepair` head while keeping the locked release heads:

- `default`: v10 constrained merge
- `bookRoot`: v8 control bridge
- `governance`: v13 balanced triad
- `booklikeRepair`: v22 governance-evidence booklike

| Case | Selected Head | Min Margin | Avg Patches | Result |
| --- | --- | ---: | ---: | --- |
| `book-root` | `bookRoot` | `8` | `3` | pass |
| `governance-adversarial` | `governance` | `3.5` | `2.8333` | pass |
| `archive-pressure` | `governance` | `8` | `3` | pass |
| `booklike` | `booklikeRepair` | `7.5` | `3` | pass |
| `mega-book-ladder` | `default` | `31` | `2.9167` | pass |
| `blind-holdout` | `default` | `-15.5` | `1` | fail |
| `stress-100` | `default` | `-28.6444` | `1` | fail |

## Read

V22 is the first run that clears the old chapter-style `booklike` corpus while keeping the fold shape at `3` patches per entry. As a single model, it is not a baseline because book-root and governance-adversarial still fail.

The stronger finding is the four-head ranked architecture: adding v22 as a dedicated `booklikeRepair` head lets the selector cover booklike without destabilizing the existing book-root, governance, archive, and mega-book lanes. This is still directional proof, not production proof, because blind and stress generalization remain negative and the four-head setup has higher stored-head overhead.

## Artifacts

- [v22 generator](scripts\generate-v22-governance-evidence-booklike-spec.mjs)
- [v22 spec](data\training\embedding-training-spec-v22-governance-evidence-booklike.json)
- [v22 pairs](data\training\embedding-training-pairs-v22-governance-evidence-booklike.json)
- [v22 model](models\learned-hybrid-prototype-v22-governance-evidence-booklike-hierarchical-packer-v2.json)
- [single-head reports](bench\fortify-2026-05-08-v22-governance-evidence-booklike)
- [four-head ranked reports](bench\fortify-2026-05-08-v22-four-head-ranked)
