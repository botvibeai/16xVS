# EXP-2026-05-07-008 V15 Multi-Head Routed Round

- `id`: `EXP-2026-05-07-008`
- `date`: `2026-05-07`
- `purpose`: Test the hardening-audit hypothesis that the current conflict is better handled by routed specialist heads than by another single-head retrain.
- `method`: Added a deterministic multi-head routing benchmark wrapper. It keeps the hierarchical packer fixed and routes known corpora to existing specialist heads:
  - `default`: `v10-constrained-merge-hierarchical-packer-v2`
  - `bookRoot`: `v8-control-bridge-hierarchical-packer-v2`
  - `governance/archive`: `v13-balanced-triad-hierarchical-packer-v2`
- `implementation_path`: `v15-multihead-routed`
- `baseline`: hardening audit upper-bound route map

## Target Tests

| Corpus | Route | Selected Head | Avg Patches/Entry | Min Margin | Result | Three-Head Binary/Source |
| --- | --- | --- | ---: | ---: | --- | ---: |
| `book-root` | `bookRoot` | `v8` | `3` | `8` | pass | `0.1451` |
| `governance-adversarial` | `governance` | `v13` | `2.8333` | `3.5` | pass | `0.4933` |
| `archive-pressure` | `archive` | `v13` | `3` | `8` | pass | `0.3596` |

## Guardrail Tests

- Unknown/default route on old `booklike` corpus still fails: min margin `-18.5`.
- `v8` selected-head frozen suite:
  - passes `controlled_phrase`
  - passes `controlled_multilingual`
  - passes `paraphrase_holdout`
  - fails `blind_holdout`
  - fails `stress_100`
- `v13` selected-head frozen suite:
  - passes `controlled_phrase`
  - fails `controlled_multilingual`
  - passes `paraphrase_holdout`
  - fails `blind_holdout`
  - fails `stress_100`

## Claim Supported

- The multi-head/routed-head hypothesis clears the known book-root/governance/archive target triad using existing heads while preserving the compact fold shape.
- The three-head signature overhead remains below source size on the three target corpora in this test.
- This is the first local test where the exact known target triangle clears without training a new single-head model.

## Claim Not Supported

- This is not a production router. The route labels are supplied by the benchmark command.
- This does not solve the older `booklike` corpus.
- This does not solve blind holdout or stress-suite generalization.
- This does not prove broad tokenizer superiority.
- This does not prove `99.99%` raw-source reduction or `Library of Congress -> 1.25 GB`.

## Artifacts

- [multi-head routing helper](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\core\multi-head-routing.mjs)
- [multi-head routing benchmark script](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\scripts\run-multihead-routing-benchmark.mjs)
- [multi-head routing tests](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\test\multi-head-routing.test.mjs)
- [book-root v15 routed report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-book-root-benchmark-v15-multihead-routed.json)
- [governance v15 routed report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-governance-adversarial-v15-multihead-routed.json)
- [archive v15 routed report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-archive-pressure-v15-multihead-routed.json)
- [booklike default-route guardrail](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-booklike-benchmark-v15-multihead-default-route.json)
- [v8 selected-head frozen suite](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\eval-suite-v15-selected-head-bookroot-v8\suite-summary.json)
- [v13 selected-head frozen suite](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\eval-suite-v15-selected-head-governance-v13\suite-summary.json)

## Next Action

The next useful test is not another manually labeled router pass. It should test an automatic route classifier or multi-head selection rule, then compare that automatic route against the oracle route labels used here.
