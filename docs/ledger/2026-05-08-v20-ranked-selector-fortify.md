# EXP-2026-05-08-002 V20 Ranked Selector Fortify Pass

- `id`: `EXP-2026-05-08-002`
- `date`: `2026-05-08`
- `purpose`: Test whether full-head ranking can be used as an opt-in selector without destabilizing the locked v19 proof cases.
- `implementation_path`: `ranked-accepted-head`
- `baseline`: `v19-lock`

## Method

- Added `selectRankedValidatedHead`.
- Kept `selectValidatedHead` unchanged so the v19 proof package remains stable.
- Added `--selection-policy ranked-accepted-head` to the validated routing runner.
- Ran the v20 selector across the five v19 lock cases, paraphrase holdout, multilingual longform, blind holdout, and stress-100.

## Result

| Case | Selected Head | Min Margin | Collapse | Avg Patches | Result |
| --- | --- | ---: | --- | ---: | --- |
| `book-root` | `bookRoot` | `8` | false | `3` | pass |
| `governance-adversarial` | `governance` | `3.5` | false | `2.8333` | pass |
| `archive-pressure` | `governance` | `8` | false | `3` | pass |
| `booklike` | `default` | `-18.5` | false | `3` | fail preserved |
| `mega-book-ladder` | `default` | `31` | false | `2.9167` | pass |
| `paraphrase-holdout` | `bookRoot` | `17.2` | false | `1` | improved |
| `multilingual-longform` | `default` | `38.5` | false | `3` | pass |
| `blind-holdout` | `default` | `-15.5` | false | `1` | fail |
| `stress-100` | `default` | `-28.6444` | false | `1` | fail |

## Claim Supported

- Ranked selection can improve at least one outward route-selection miss: paraphrase holdout improves from the v19 selected `governance` margin `7.4` to `bookRoot` margin `17.2`.
- Ranked selection preserves the current v19 primary route outcomes on this test set.
- The old booklike, blind, and stress failures remain visible and unresolved.

## Claim Not Supported

- This is not a new locked baseline.
- This does not solve production generalization.
- This does not solve the old booklike semantic failure.

## Artifacts

- [v20 fortify summary](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v20-ranked-selector\README.md)
- [head validator](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\core\head-validator.mjs)
- [validated routing runner](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\scripts\run-validated-routing-benchmark.mjs)
- [head validator tests](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\test\head-validator.test.mjs)
