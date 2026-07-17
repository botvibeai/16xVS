# V24 Five-Head Ranked Probe

- `date`: `2026-05-16`
- `baseline`: `v23 four-head proof package`
- `selection policy`: `ranked-accepted-head`
- `purpose`: Add v24 as a fifth `quoteRepair` specialist head and verify whether it can repair quote-style failures without destabilizing the locked v23 lanes.

## Heads

- `default`: v10 constrained merge
- `bookRoot`: v8 control bridge
- `governance`: v13 balanced triad
- `booklikeRepair`: v22 governance-evidence booklike
- `quoteRepair`: v24 quote repair

## Result

| Case | Selected Head | Selected Margin | Best Ranked Head | Best Ranked Margin | Avg Patches | Result |
| --- | --- | ---: | --- | ---: | ---: | --- |
| `book-root` | `bookRoot` | `8` | `bookRoot` | `8` | `3` | pass |
| `governance-adversarial` | `governance` | `3.5` | `governance` | `3.5` | `2.8333` | pass |
| `archive-pressure` | `governance` | `8` | `governance` | `8` | `3` | pass |
| `booklike` | `booklikeRepair` | `7.5` | `booklikeRepair` | `7.5` | `3` | pass |
| `mega-book-ladder` | `default` | `31` | `default` | `31` | `2.9167` | pass |
| `quote` | `default` | `-18.2` | `quoteRepair` | `-12.8` | `1` | fail |
| `quote-paragraph` | `governance` | `-20.25` | `quoteRepair` | `-10.3333` | `1` | fail |
| `blind-holdout` | `default` | `-15.5` | `quoteRepair` | `-14.6667` | `1` | fail |
| `stress-100` | `default` | `-28.6444` | `default` | `-28.6444` | `1` | fail |

## Read

The fifth head does not destabilize the primary v23 lanes: book-root, governance, archive, booklike, and mega-book ladder keep the same selected margins. The quoteRepair head ranks best on quote, quote-paragraph, and blind holdout, but it is correctly rejected because none of those margins are positive.

This is useful governance evidence for the router: the system can see a better specialist without promoting it when the acceptance gate fails.

## Artifacts

- [five-head ranked reports](bench\fortify-2026-05-16-v24-five-head-ranked)
- [v24 single-head summary](bench\fortify-2026-05-16-v24-quote-repair\README.md)
- [v24 blend sweep summary](bench\fortify-2026-05-16-v24-quote-blend-sweep\README.md)
