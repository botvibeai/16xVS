# EXP-2026-05-07-009 V16 Auto-Routed Round

- `id`: `EXP-2026-05-07-009`
- `date`: `2026-05-07`
- `purpose`: Test whether the multi-head route can be selected automatically instead of supplied by the benchmark command.
- `method`: Added a deterministic lexical auto-router. It scores the corpus for `bookRoot`, `governance`, and `archive` signals, maps `bookRoot` to the `v8` head, maps `governance/archive` to the `v13` head, and falls back to the `v10` default head when route evidence is weak.
- `implementation_path`: `v16-auto-routed`
- `baseline`: `v15-multihead-routed`

## Target Tests

| Corpus | Auto Route | Selected Head | Route Scores | Avg Patches/Entry | Min Margin | Result | Three-Head Binary/Source |
| --- | --- | --- | --- | ---: | ---: | --- | ---: |
| `book-root` | `bookRoot` | `v8` | `bookRoot=169`, `archive=73`, `governance=0` | `3` | `8` | pass | `0.1451` |
| `governance-adversarial` | `governance` | `v13` | `governance=172`, `bookRoot=0`, `archive=0` | `2.8333` | `3.5` | pass | `0.4933` |
| `archive-pressure` | `archive` | `v13` | `archive=159`, `governance=31`, `bookRoot=0` | `3` | `8` | pass | `0.3596` |

## Guardrail Test

| Corpus | Auto Route | Selected Head | Avg Patches/Entry | Min Margin | Result |
| --- | --- | --- | ---: | ---: | --- |
| `booklike` | `bookRoot` | `v8` | `3` | `-23.5` | fail |

The old `booklike` corpus is a useful negative signal. The classifier routes it to `bookRoot` because it has the same synthetic book-root surface language, but `v8` is worse than the `v10` default route on that corpus. The next router needs a confidence guard or model-selection check, not just lexical route selection.

## Claim Supported

- Automatic routing can select the same successful heads as v15 on the known target triad without benchmark-supplied route labels.
- The known target triangle clears:
  - book-root: min margin `8`
  - governance: min margin `3.5`
  - archive: min margin `8`
- The fold shape remains compact on all target corpora.

## Claim Not Supported

- This is not a production router.
- The lexical router over-routes old booklike content to the book-root head and fails the guardrail.
- This does not solve blind holdout or stress-suite generalization.
- This does not prove broad tokenizer superiority.
- This does not prove `99.99%` raw-source reduction or `Library of Congress -> 1.25 GB`.

## Artifacts

- [auto-route helper](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\core\auto-route.mjs)
- [auto-route benchmark script](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\scripts\run-auto-routing-benchmark.mjs)
- [auto-route tests](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\test\auto-route.test.mjs)
- [book-root v16 auto-routed report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-book-root-benchmark-v16-auto-routed.json)
- [governance v16 auto-routed report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-governance-adversarial-v16-auto-routed.json)
- [archive v16 auto-routed report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-archive-pressure-v16-auto-routed.json)
- [booklike v16 auto-routed guardrail](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-booklike-benchmark-v16-auto-routed.json)

## Next Action

Test `v17` confidence-guarded routing:

- Run candidate heads on a small sample or summary signature.
- Prefer the auto-route head only if its predicted confidence is high and it does not trip a known guardrail.
- Otherwise fall back to `v10`.
- Specifically test whether old `booklike` avoids the `v8` route while book-root still selects it.
