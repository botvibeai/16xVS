# Code-Domain Holdout Fortify Pass

- `date`: `2026-05-08`
- `fixture`: `code-domain-holdout-2026-05-08`
- `selector`: `v20 ranked-accepted-head`
- `baseline`: `v19-lock`

## Result

| Case | Route | Selected Head | Min Margin | Collapse | Avg Patches | Read |
| --- | --- | --- | ---: | --- | ---: | --- |
| `code-domain` | `archive` | `governance` | `30.5` | false | `1` | pass |

## Full Head Ranking

| Rank | Head | Accepted | Min Margin | Collapse | Avg Patches |
| ---: | --- | --- | ---: | --- | ---: |
| 1 | `governance` | true | `30.5` | false | `1` |
| 2 | `default` | true | `27.5` | false | `1` |
| 3 | `bookRoot` | true | `24.5` | false | `1` |

## Read

The code-domain fixture is not a blocker in this pass. All release heads pass; `governance/v13` ranks best and keeps the code snippets at `1` patch per entry. This is a small controlled code fixture, not broad programming-language proof.

## Artifacts

- [corpus](bench\code-domain-holdout-2026-05-08.txt)
- [semantic groups](bench\code-domain-semantic-2026-05-08.json)
- [report](bench\fortify-2026-05-08-code-domain\code-domain-v20-ranked-selector.json)
