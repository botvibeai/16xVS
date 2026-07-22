# Booklike Checkpoint Sweep

- `date`: `2026-05-08`
- `fixture`: `booklike-corpus-2026-04-25`
- `purpose`: Find whether any named checkpoint already improves the old booklike semantic failure.

## Result

| Model | Min Margin | Avg Patches | Patches/Token | Worst Group | Read |
| --- | ---: | ---: | ---: | --- | --- |
| `v3` | `-11.5` | `3` | `0.017` | `multilingual_equity_booklike` | best historical shape in this sweep |
| `v6` | `-12` | `3` | `0.017` | `governance_evidence_booklike` | close second |
| `v13` | `-12.5` | `3` | `0.017` | `multilingual_equity_booklike` | close to v6 |
| `v10` | `-18.5` | `3` | `0.017` | `multilingual_equity_booklike` | current v19/v20 default failure |
| `v9` | `-20` | `13.25` | `0.0749` | `multilingual_equity_booklike` | worse and breaks fold shape |
| `v8` | `-23.5` | `3` | `0.017` | `multilingual_equity_booklike` | worst release head for this fixture |

## Read

The booklike repair should start from the `v3` storage geometry, not the current v8/v10/v13 release-head set. The main repair target is `multilingual_equity_booklike`, followed by `governance_evidence_booklike` and `hardware_edge_booklike`.

This sweep does not solve booklike. It narrows the next training or derivation target.

## Artifacts

- [v3](bench\fortify-2026-05-08-booklike-sweep\booklike-v3.json)
- [v6](bench\fortify-2026-05-08-booklike-sweep\booklike-v6.json)
- [v8](bench\fortify-2026-05-08-booklike-sweep\booklike-v8.json)
- [v9](bench\fortify-2026-05-08-booklike-sweep\booklike-v9.json)
- [v10](bench\fortify-2026-05-08-booklike-sweep\booklike-v10.json)
- [v13](bench\fortify-2026-05-08-booklike-sweep\booklike-v13.json)
