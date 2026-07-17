# V22 Four-Head Extra Sweep

- `date`: `2026-05-11`
- `selection policy`: `ranked-accepted-head`
- `heads`: `default/v10`, `bookRoot/v8`, `governance/v13`, `booklikeRepair/v22`
- `purpose`: Broaden the v22 four-head evidence beyond the primary lock cases without retraining.

## Result Table

| Case | Selected Head | Min Margin | Avg Patches | Result |
| --- | --- | ---: | ---: | --- |
| `code-domain` | `governance` | `30.5` | `1` | pass |
| `paraphrase-holdout` | `bookRoot` | `17.2` | `1` | pass |
| `multilingual-longform` | `default` | `38.5` | `3` | pass |
| `phrase-semantic` | `bookRoot` | `17` | `1` | pass |
| `multilingual-phrases` | `bookRoot` | `2.8095` | `1` | pass |
| `protocol-longform` | `governance` | `18.5` | `3` | pass |
| `quote` | `default` | `-18.2` | `1` | fail |
| `quote-paragraph` | `governance` | `-20.25` | `1` | fail |

## Read

The four-head selector handled code, paraphrase, multilingual, phrase, and protocol-longform surfaces without needing v22 except where v22 was already useful for old `booklike`. That is good route-specialist evidence.

The quote and quote-paragraph semantic suites remain negative. They still compress to `1` patch per entry, but the grouped semantic signal is not solved. This should stay in the failure log because it is a different weakness than booklike.

## Boundary

This sweep does not change the locked baseline. It strengthens the case for a ranked specialist architecture, while preserving the open failures: blind holdout, stress-100, quote, and quote-paragraph semantics.
