# EXP-2026-05-07-010 V17 Confidence-Routed Round

- `id`: `EXP-2026-05-07-010`
- `date`: `2026-05-07`
- `purpose`: Harden the v16 auto-router so it does not send split chapter-style booklike content to the `bookRoot` specialist just because the lexical route score is high.
- `method`: Added a corpus-shape confidence guard. `bookRoot` remains eligible only when corpus entries look like folded macro entries, using minimum average words per entry and minimum per-entry word thresholds. If the lexical candidate is `bookRoot` but the shape guard rejects it, routing falls back to the `v10` default head.
- `implementation_path`: `v17-confidence-routed`
- `baseline`: `v16-auto-routed`

## Target Tests

| Corpus | Candidate Route | Final Route | Selected Head | Shape Guard | Avg Patches/Entry | Min Margin | Result | Three-Head Binary/Source |
| --- | --- | --- | --- | --- | ---: | ---: | --- | ---: |
| `book-root` | `bookRoot` | `bookRoot` | `v8` | pass | `3` | `8` | pass | `0.1451` |
| `governance-adversarial` | `governance` | `governance` | `v13` | not required | `2.8333` | `3.5` | pass | `0.4933` |
| `archive-pressure` | `archive` | `archive` | `v13` | not required | `3` | `8` | pass | `0.3596` |

## Guardrail Test

| Corpus | Candidate Route | Final Route | Selected Head | Shape Guard | Avg Patches/Entry | Min Margin | Result |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| `booklike` | `bookRoot` | `default` | `v10` | reject | `3` | `-18.5` | fail |

The old `booklike` corpus still fails grouped semantic separation. The improvement is routing safety, not semantic resolution: v17 avoids the worse `v8` specialist route from v16 and falls back to the prior `v10` default route.

## Mega-Book Fold Follow-Up

| Corpus | Candidate Route | Final Route | Selected Head | Shape Guard | Tiktoken Count | Patch Count | Selected-Head Binary/Source | Three-Head Binary/Source |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| `mega-book` | `bookRoot` | `bookRoot` | `v8` | pass | `2123` | `3` | `0.0081` | `0.0242` |

The synthetic mega-book follow-up tests the inward-folding shape directly under the v17 router. One `1831`-word entry with `2123` `cl100k_base` tokens routes to the `bookRoot` specialist and remains at `3` patches. This is strong storage-shape evidence, but it has no semantic margin because the one-entry mega-book corpus cannot validate grouped retrieval separation by itself.

## Claim Supported

- Automatic routing can still select the successful heads on the known target triad.
- The confidence guard prevents the known v16 over-route from old split chapter-style `booklike` content into the `bookRoot` specialist.
- The fold shape remains compact on all four reports.
- The v17 route also preserves the synthetic mega-book fold: `2123` tiktoken tokens into `3` patches.

## Claim Not Supported

- This is not a production router.
- The old `booklike` corpus remains semantically unresolved at `-18.5`.
- The guard uses corpus shape, not learned route validation.
- This does not solve blind holdout or stress-suite generalization.
- This does not prove broad tokenizer superiority.
- This does not prove `99.99%` raw-source reduction or `Library of Congress -> 1.25 GB`.

## Artifacts

- [auto-route helper](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\core\auto-route.mjs)
- [auto-route benchmark script](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\scripts\run-auto-routing-benchmark.mjs)
- [auto-route tests](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\test\auto-route.test.mjs)
- [book-root v17 confidence-routed report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-book-root-benchmark-v17-confidence-routed.json)
- [governance v17 confidence-routed report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-governance-adversarial-v17-confidence-routed.json)
- [archive v17 confidence-routed report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-archive-pressure-v17-confidence-routed.json)
- [booklike v17 confidence-routed guardrail](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-booklike-benchmark-v17-confidence-routed.json)
- [mega-book v17 confidence-routed fold report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-mega-book-benchmark-v17-confidence-routed.json)

## Next Action

Test a learned or evidence-based route validator:

- Compare candidate head behavior on a small unlabeled diagnostic sample.
- Reject a specialist when it shows collapse, unstable nearest-neighbor behavior, or weak internal cohesion.
- Keep `v17` as the safer automatic route until a stronger validator beats it on both target and guardrail corpora.
