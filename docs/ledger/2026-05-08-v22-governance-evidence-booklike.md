# EXP-2026-05-08-005 V22 Governance-Evidence Booklike Repair

- `id`: `EXP-2026-05-08-005`
- `date`: `2026-05-08`
- `purpose`: Repair the remaining v21 `governance_evidence_booklike` miss and test whether a fourth ranked specialist can close the old booklike hole without destabilizing locked lanes.
- `implementation_path`: `v22-governance-evidence-booklike`
- `baseline`: `v19-lock` / `v20-ranked-selector`

## Method

- Started from `embedding-training-spec-v13-balanced-triad` instead of the v6 base used by v21.
- Added v21-style booklike boundary groups plus a narrow governance-evidence longform boundary group.
- Removed v21's risky hard-negative anchors against matching book-root groups.
- Appended narrow replay support to existing control, audit, retention, archive-catalog, and compliance groups.
- Reduced the final negative sample limit to `16` per hard-negative pair after the first larger v22 training run did not complete in practical time.

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

| Case | Selected Head | Min Margin | Avg Patches | Result |
| --- | --- | ---: | ---: | --- |
| `book-root` | `bookRoot` | `8` | `3` | pass |
| `governance-adversarial` | `governance` | `3.5` | `2.8333` | pass |
| `archive-pressure` | `governance` | `8` | `3` | pass |
| `booklike` | `booklikeRepair` | `7.5` | `3` | pass |
| `mega-book-ladder` | `default` | `31` | `2.9167` | pass |
| `blind-holdout` | `default` | `-15.5` | `1` | fail |
| `stress-100` | `default` | `-28.6444` | `1` | fail |

## Claim Supported

- The old chapter-style `booklike` failure is now trainable to positive margin while preserving the `3`-patch fold.
- A four-head ranked selector can cover book-root, governance, archive, old booklike, and mega-book ladder primary cases together by selecting the right specialist.
- The route-specialist architecture is now stronger than the single-universal-model path for current evidence.

## Claim Not Supported

- V22 single-head is not a new baseline.
- The four-head ranked setup is not production proof.
- Blind holdout and stress-100 remain negative.
- Broad tokenizer superiority, 99.99% storage reduction, and 1.25 GB collapse claims remain unproven.

## Artifacts

- [v22 summary](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v22-governance-evidence-booklike\README.md)
- [four-head summary](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v22-four-head-ranked\README.md)
- [v22 generator](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\scripts\generate-v22-governance-evidence-booklike-spec.mjs)
- [v22 model](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\models\learned-hybrid-prototype-v22-governance-evidence-booklike-hierarchical-packer-v2.json)
