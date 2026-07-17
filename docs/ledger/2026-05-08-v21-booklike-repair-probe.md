# EXP-2026-05-08-004 V21 Booklike Repair Probe

- `id`: `EXP-2026-05-08-004`
- `date`: `2026-05-08`
- `purpose`: Test whether the old booklike semantic failure is trainable using targeted boundary groups while preserving hierarchical fold shape.
- `implementation_path`: `v21-booklike-repair`
- `baseline`: `v19-lock`

## Method

- Added a v21 training-spec generator.
- Started from the v6/v3-style book-root geometry.
- Added training-only boundary groups for the six old booklike themes.
- Did not include the old booklike holdout passages verbatim.
- Trained a v21 base model and derived the same hierarchical v2 patch geometry used by the stronger v3/v8 family.

## Result

| Case | Min Margin | Avg Patches | Result |
| --- | ---: | ---: | --- |
| `booklike` | `-2.5` | `3` | improved but still fail |
| `book-root` | `-31.5` | `3` | regressed |
| `governance-adversarial` | `-16.5` | `2.8333` | regressed |
| `archive-pressure` | `-4` | `3` | regressed |
| `paraphrase-holdout` | `5.6` | `1` | pass |
| `multilingual-longform` | `31.5` | `3` | pass |

## Claim Supported

- The old booklike failure is trainable.
- The worst booklike margin improved from v10 `-18.5` and v3 `-11.5` to v21 `-2.5`.
- The original worst group, `multilingual_equity_booklike`, flipped positive at `20.5`.
- The remaining booklike miss is now `governance_evidence_booklike` at `-2.5`.

## Claim Not Supported

- V21 is not a new baseline.
- V21 does not preserve the locked v19 guardrails.
- V21 does not solve production generalization.

## Artifacts

- [v21 generator](scripts\generate-v21-booklike-repair-spec.mjs)
- [v21 summary](bench\fortify-2026-05-08-v21-booklike-repair\README.md)
- [v21 spec](data\training\embedding-training-spec-v21-booklike-repair.json)
- [v21 model](models\learned-hybrid-prototype-v21-booklike-repair-hierarchical-packer-v2.json)
