# V21 Booklike Repair Probe

- `date`: `2026-05-08`
- `baseline`: `v19-lock`
- `training base`: `embedding-training-spec-v6-book-root`
- `model`: `learned-hybrid-prototype-v21-booklike-repair-hierarchical-packer-v2`
- `purpose`: Test whether the old booklike semantic failure is trainable while preserving v3/v6-style hierarchical fold geometry.

## Primary Result

| Case | Model | Min Margin | Avg Patches | Read |
| --- | --- | ---: | ---: | --- |
| `booklike` | `v10 default` | `-18.5` | `3` | current default failure |
| `booklike` | `v3 historical` | `-11.5` | `3` | best prior sweep result |
| `booklike` | `v21 repair` | `-2.5` | `3` | strong improvement, still not a pass |

## Booklike Group Detail

| Group | Margin |
| --- | ---: |
| `multilingual_equity_booklike` | `20.5` |
| `storage_economics_booklike` | `7.5` |
| `retrieval_booklike` | `8` |
| `pricing_operations_booklike` | `10.5` |
| `hardware_edge_booklike` | `14` |
| `governance_evidence_booklike` | `-2.5` |

## Guardrail Result

| Case | Min Margin | Avg Patches | Read |
| --- | ---: | ---: | --- |
| `book-root` | `-31.5` | `3` | regressed |
| `governance-adversarial` | `-16.5` | `2.8333` | regressed |
| `archive-pressure` | `-4` | `3` | regressed |
| `paraphrase-holdout` | `5.6` | `1` | passes |
| `multilingual-longform` | `31.5` | `3` | passes |

## Read

V21 proves the old booklike failure is trainable: the worst margin improved from `-18.5` under v10 and `-11.5` under v3 to `-2.5`. The original worst group, `multilingual_equity_booklike`, flipped from negative to strongly positive.

V21 is not a new baseline because the locked book-root, governance, and archive guardrails regressed. The remaining repair target is now narrower: `governance_evidence_booklike` without sacrificing the v19 route-specialist guardrails.

## Artifacts

- [spec](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\data\training\embedding-training-spec-v21-booklike-repair.json)
- [pairs](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\data\training\embedding-training-pairs-v21-booklike-repair.json)
- [base model](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\models\learned-hybrid-prototype-v21-booklike-repair-base.json)
- [hierarchical model](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\models\learned-hybrid-prototype-v21-booklike-repair-hierarchical-packer-v2.json)
- [booklike report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v21-booklike-repair\booklike-v21-booklike-repair.json)
