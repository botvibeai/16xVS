# V22 Four-Head Ranked Probe

- `date`: `2026-05-08`
- `purpose`: Test v22 as a fourth specialist head instead of as a single universal baseline.
- `selection policy`: `ranked-accepted-head`

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

The four-head ranked selector preserves the v19/v20 primary locked lanes and uses v22 only on the old booklike gap. This supports the route-specialist architecture more strongly than a universal-model approach.

It is not production proof because blind/stress remain negative and the architecture now stores/evaluates four heads.
