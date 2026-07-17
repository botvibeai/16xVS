# EXP-2026-05-07-012 V19 Validated Routing Round

- `id`: `EXP-2026-05-07-012`
- `date`: `2026-05-07`
- `purpose`: Test whether candidate-head validation can prevent the v18 routing mistake where `bookRoot` lexical routing selected `v8` even though `v10` was safer on the mega-book semantic ladder.
- `method`: Added a head validator. The validator runs the routed candidate head and the default fallback head, rejects heads with signature collapse or negative semantic margins, and writes the selected-head report with validation metadata.
- `implementation_path`: `v19-validated-routing`
- `baseline`: `v18-mega-book-semantic-ladder`

## Validated Route Tests

| Corpus | Lexical Route | Candidate Head | Selected Head | Selected Model | Min Margin | Collapse | Avg Patches/Entry | Result |
| --- | --- | --- | --- | --- | ---: | --- | ---: | --- |
| `book-root` | `bookRoot` | `v8` | `v8` | `bookRoot` | `8` | false | `3` | pass |
| `governance-adversarial` | `governance` | `v13` | `v13` | `governance` | `3.5` | false | `2.8333` | pass |
| `archive-pressure` | `archive` | `v13` | `v13` | `governance` | `8` | false | `3` | pass |
| `booklike` | `default` | `v10` | `v10` | `default` | `-18.5` | false | `3` | fail |
| `mega-book-ladder` | `bookRoot` | `v8` | `v10` | `default` | `31` | false | `2.9167` | pass |

## Key Result

The validator preserves the known target-triad wins while fixing the v18 route-selection problem:

- `book-root` still accepts `v8`.
- `governance` and `archive` still accept `v13`.
- `mega-book-ladder` rejects `v8` because the candidate showed collapse in the v18 run, then selects `v10`, which passes with min semantic margin `31` and average nearest signature distance `21`.

The old `booklike` corpus remains unresolved. The validator correctly keeps it on `v10`, but `v10` still has negative semantic margin `-18.5`.

## Claim Supported

- Candidate-head validation can catch a bad specialist route and fall back to a safer head.
- The v19 validator keeps the successful book-root/governance/archive target triad intact.
- The v19 validator fixes the v18 mega-book ladder head choice by selecting `v10` instead of `v8`.
- Compact fold shape is preserved across all validated reports.

## Claim Not Supported

- This is not a production router.
- The validator currently compares the candidate head and default fallback; it does not yet rank every possible head.
- The old `booklike` semantic failure remains open.
- This does not solve blind holdout or stress-suite generalization.
- This does not prove broad tokenizer superiority.
- This does not prove `99.99%` raw-source reduction or `Library of Congress -> 1.25 GB`.

## Artifacts

- [head validator](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\core\head-validator.mjs)
- [validated route runner](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\scripts\run-validated-routing-benchmark.mjs)
- [head validator tests](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\test\head-validator.test.mjs)
- [book-root v19 validated route](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-book-root-benchmark-v19-validated-routed.json)
- [governance v19 validated route](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-governance-adversarial-v19-validated-routed.json)
- [archive v19 validated route](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-archive-pressure-v19-validated-routed.json)
- [booklike v19 validated guardrail](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-booklike-benchmark-v19-validated-routed.json)
- [mega-book ladder v19 validated route](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-mega-book-ladder-v19-validated-routed.json)

## Next Action

Test a full head-ranking validator:

- Evaluate `v8`, `v10`, and `v13` for candidate corpora.
- Rank by collapse safety, semantic margin, and route fit.
- Keep the current v19 candidate-plus-default validator as the safer baseline until full ranking beats it.
