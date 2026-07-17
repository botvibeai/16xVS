# EXP-2026-05-20-001 V25 Hard-Negative Repair Probe

- `id`: `EXP-2026-05-20-001`
- `date`: `2026-05-20`
- `purpose`: Test whether mining nearest-outside confusion pairs from failed quote, quote-paragraph, blind-holdout, and stress reports can repair the remaining negative semantic margins without destabilizing the locked v23 primary lanes.
- `implementation_path`: `v25-hard-negative-repair`
- `baseline`: `v23 four-head proof package`
- `status`: `negative-or-mixed-probe`

## Method

- Kept `v23` as the locked proof baseline.
- Added a deterministic hard-negative miner for failed benchmark reports.
- Mined nearest-outside confusion pairs from the v24 quote, quote-paragraph, blind-holdout, and stress-100 reports.
- Generated `embedding-training-spec-v25-hard-negative-repair.json` from the v24 spec.
- Added mined boundary groups and explicit negative pairs.
- Did not add holdout lines as positive training items.
- Trained `learned-hybrid-prototype-v25-hard-negative-repair-base.json`.
- Derived `learned-hybrid-prototype-v25-hard-negative-repair-hierarchical-packer-v2.json`.
- Tested v25 as a single head and as `quoteRepairV25` in a six-head ranked probe.
- Used the report research as design inspiration only. This probe does not implement DART, VisionDrop, ColPali, FlexiViT PI-resize, BitNet, or DeepSeek-OCR.

## Mining Summary

| Source | Mined Pairs |
| --- | ---: |
| `quote` | `9` |
| `quote-paragraph` | `8` |
| `blind-holdout` | `8` |
| `stress-100` | `9` |

## Training Artifact Summary

| Metric | Value |
| --- | ---: |
| groups | `46` |
| items | `310` |
| positive pairs | `1091` |
| negative pairs | `1738` |
| explicit negative pairs | `34` |
| total pairs | `2829` |

## Target Gates

| Case | Previous Best | Single V25 Margin | Best Ranked Head | Best Ranked Margin | Selected Head | Selected Margin | Result |
| --- | ---: | ---: | --- | ---: | --- | ---: | --- |
| `quote` | `-12.8` | `-19` | `quoteRepair` | `-12.8` | `default` | `-18.2` | fail |
| `quote-paragraph` | `-10.3333` | `-14.8333` | `quoteRepair` | `-10.3333` | `governance` | `-20.25` | fail |
| `blind-holdout` | `-15.5` | `-17.4167` | `quoteRepair` | `-14.6667` | `default` | `-15.5` | fail |
| `stress-100` | `-28.6444` | `-24.0667` | `quoteRepairV25` | `-24.0667` | `default` | `-28.6444` | fail |

## Primary Lane Stability

| Case | Selected Head | Min Margin | Avg Patches | Result |
| --- | --- | ---: | ---: | --- |
| `book-root` | `bookRoot` | `8` | `3` | pass |
| `governance-adversarial` | `governance` | `3.5` | `2.8333` | pass |
| `archive-pressure` | `governance` | `8` | `3` | pass |
| `booklike` | `booklikeRepair` | `7.5` | `3` | pass |
| `mega-book-ladder` | `default` | `31` | `2.9167` | pass |

## Claim Supported

- The v25 probe infrastructure works end-to-end: spec generation, hard-negative training data, model training, model derivation, single-head reports, six-head ranked reports, and summary generation.
- The six-head ranked probe preserves the v23 primary lanes: book-root `8`, governance `3.5`, archive `8`, booklike `7.5`, and mega-book ladder `31`.
- The hard-negative pressure improves stress-100 as a single head from the v23 selected margin `-28.6444` to `-24.0667`.

## Claim Not Supported

- V25 is not a new baseline.
- V25 does not solve quote, quote-paragraph, blind-holdout, or stress-100.
- V25 worsens quote versus v24 quoteRepair: `-12.8` to `-19`.
- V25 worsens quote-paragraph versus v24 quoteRepair: `-10.3333` to `-14.8333`.
- V25 worsens blind-holdout as a single head versus the v23 selected margin: `-15.5` to `-17.4167`.
- The stress-100 improvement remains negative at `-24.0667`.
- Because v25 mines failed report confusion pairs, these target surfaces are no longer independent blind proof.
- This does not support production-proof, broad tokenizer-superiority, `99.99%`, or `1.25 GB` claims.

## Artifacts

- [v25 probe summary](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-20-v25-hard-negative-repair\README.md)
- [v25 summary json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-20-v25-hard-negative-repair\summary.json)
- [v25 spec generator](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\scripts\generate-v25-hard-negative-repair-spec.mjs)
- [v25 probe builder](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\scripts\build-v25-hard-negative-proof-probe.mjs)
- [v25 hard-negative miner](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\core\v25-hard-negative-miner.mjs)
- [v25 hierarchical model](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\models\learned-hybrid-prototype-v25-hard-negative-repair-hierarchical-packer-v2.json)
