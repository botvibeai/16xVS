# EXP-2026-05-16-001 V23 Four-Head Proof Package

- `id`: `EXP-2026-05-16-001`
- `date`: `2026-05-16`
- `purpose`: Turn the v22 four-head ranked result into a reproducible proof package with primary, blind/stress, and extra controlled-surface gates.
- `script`: `npm run proof:package:v23 -- --label v23-four-head-ranked-2026-05-16`
- `claimLevel`: `directional-specialist-proof`

## Implementation

- Added `core/v23-proof-package.mjs` with the four-head suite definition and gate evaluation.
- Added `scripts/build-v23-four-head-proof-package.mjs` to rerun the package in one command.
- Added `test/v23-proof-package.test.mjs` and wired it into `test/all-tests.mjs`.
- Added package script `proof:package:v23`.

## Primary Gates

| Case | Selected Head | Min Margin | Avg Patches | Result |
| --- | --- | ---: | ---: | --- |
| `book-root` | `bookRoot` | `8` | `3` | pass |
| `governance-adversarial` | `governance` | `3.5` | `2.8333` | pass |
| `archive-pressure` | `governance` | `8` | `3` | pass |
| `booklike` | `booklikeRepair` | `7.5` | `3` | pass |
| `mega-book-ladder` | `default` | `31` | `2.9167` | pass |

## Generalization Gates

| Case | Selected Head | Min Margin | Avg Patches | Result |
| --- | --- | ---: | ---: | --- |
| `blind-holdout` | `default` | `-15.5` | `1` | fail |
| `stress-100` | `default` | `-28.6444` | `1` | fail |

## Extra Controlled Surfaces

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

## Claim Supported

- The four-head ranked selector is now reproducible as a proof package.
- The primary specialist lanes pass together: book-root, governance, archive, old booklike, and mega-book ladder.
- V22 remains useful as a `booklikeRepair` specialist, not a universal baseline.

## Claim Not Supported

- Production generalization is not proven because blind and stress still fail.
- Quote and quote-paragraph semantic grouping are still unresolved.
- Broad tokenizer superiority and extreme storage claims remain outside the evidence boundary.

## Verification

- Package run completed successfully.
- Unit tests inside package passed: `38/38`.

## Artifacts

- [v23 package README](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\README.md)
- [v23 package summary](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\summary.json)
- [v23 proof package core](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\core\v23-proof-package.mjs)
- [v23 proof package runner](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\scripts\build-v23-four-head-proof-package.mjs)
