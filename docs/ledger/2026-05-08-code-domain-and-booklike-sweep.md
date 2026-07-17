# EXP-2026-05-08-003 Code-Domain Holdout and Booklike Sweep

- `id`: `EXP-2026-05-08-003`
- `date`: `2026-05-08`
- `purpose`: Fortify outward from the v19/v20 route work by testing a controlled code-domain fixture and sweeping named checkpoints against the unresolved booklike failure.
- `baseline`: `v19-lock`

## Code-Domain Holdout

The new code-domain fixture has four labeled code-intent groups:

- Worker routing code
- Proof gate code
- Database persistence code
- Ranked selector test code

Under the v20 ranked selector, the fixture passes:

| Route | Selected Head | Min Margin | Collapse | Avg Patches |
| --- | --- | ---: | --- | ---: |
| `archive` | `governance` | `30.5` | false | `1` |

All three release heads passed the fixture. `governance/v13` ranked first.

## Booklike Sweep

The named checkpoint sweep shows the old booklike failure is still real, but `v3` is the best historical repair base:

| Model | Min Margin | Avg Patches | Read |
| --- | ---: | ---: | --- |
| `v3` | `-11.5` | `3` | best in sweep |
| `v6` | `-12` | `3` | close second |
| `v13` | `-12.5` | `3` | close third |
| `v10` | `-18.5` | `3` | current default failure |
| `v9` | `-20` | `13.25` | breaks fold |
| `v8` | `-23.5` | `3` | worst in sweep |

The worst repeating group is `multilingual_equity_booklike`.

## Claim Supported

- A small controlled code-domain fixture passes under current release heads.
- Booklike repair should start from `v3`-style storage geometry, not the current v8/v10/v13 release heads.
- The next booklike repair target is `multilingual_equity_booklike`, then `governance_evidence_booklike`, then `hardware_edge_booklike`.

## Claim Not Supported

- Broad code-tokenizer superiority.
- A solved booklike semantic boundary.
- A new production baseline.

## Artifacts

- [code-domain fortify summary](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-code-domain\README.md)
- [booklike sweep summary](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-booklike-sweep\README.md)
- [code-domain corpus](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\code-domain-holdout-2026-05-08.txt)
- [code-domain semantic groups](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\code-domain-semantic-2026-05-08.json)
