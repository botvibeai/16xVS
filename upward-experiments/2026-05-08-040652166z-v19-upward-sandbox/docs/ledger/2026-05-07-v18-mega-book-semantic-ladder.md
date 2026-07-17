# EXP-2026-05-07-011 V18 Mega-Book Semantic Ladder

- `id`: `EXP-2026-05-07-011`
- `date`: `2026-05-07`
- `purpose`: Test whether folded book-root records retain semantic relation to their own chapters instead of only showing small patch counts.
- `method`: Generated a synthetic ladder with `3` books. Each book has `1` folded root and `3` chapter entries, for `12` entries total. The dedicated ladder evaluator measures whether each folded root is closer to its own chapters than to the nearest outside chapter from another book.
- `implementation_path`: `v18-mega-book-semantic-ladder`
- `baseline`: `v17-confidence-routed`

## Main V18 Auto-Routed Result

| Route | Selected Model | Entries | Tokens | Patches | Avg Patches/Entry | Generic Min Margin | Ladder Min Margin | Collapse Guard | Result |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `bookRoot` | `v8` | `12` | `6026` | `35` | `2.9167` | `33.0833` | `26` | fail: avg nearest distance `15.5 < 16` | failed |

The current v17 router correctly identifies the corpus as `bookRoot`, and the dedicated ladder check passes: every folded book-root is closer to its own chapters than to outside chapters. However, the generic collapse guard fails by a narrow margin because average nearest signature distance is `15.5`, below the current `16` threshold. Therefore the auto-routed v18 run is not a clean pass.

## Head Comparison

| Head Used For `bookRoot` | Generic Result | Generic Min Margin | Avg Nearest Signature Distance | Collapse | Ladder Min Margin | Ladder All Positive | Avg Patches/Entry |
| --- | --- | ---: | ---: | --- | ---: | --- | ---: |
| `v8` | failed | `33.0833` | `15.5` | true | `26` | true | `2.9167` |
| `v10` | directional | `31` | `21` | false | `34` | true | `2.9167` |
| `v13` | failed | `31.25` | `14.8333` | true | `35` | true | `2.9167` |

The important result is that `v10` clears the v18 ladder without tripping collapse while preserving the same compact patch shape. That means the semantic ladder itself is viable in this controlled synthetic test, but the current route selection is not yet smart enough. The next router should validate candidate-head behavior before accepting `v8`.

## Claim Supported

- Folded book-root records can remain semantically closer to their own chapters than to outside chapters on a controlled multi-book ladder.
- The best current head for this ladder is `v10`, not the auto-selected `v8`.
- The fold shape remains compact: `6026` tiktoken tokens become `35` patches across `12` entries.
- The `v10` comparison run has all generic semantic margins positive and no collapse signal.

## Claim Not Supported

- The current v17 auto-router is not sufficient for all book-root-shaped corpora.
- The v8 book-root specialist is not universally safe for every book-root route.
- This is still synthetic evidence, not broad real-world book understanding.
- This does not solve blind holdout or stress-suite generalization.
- This does not prove broad tokenizer superiority.
- This does not prove `99.99%` raw-source reduction or `Library of Congress -> 1.25 GB`.

## Artifacts

- [mega-book ladder core](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\core\mega-book-ladder.mjs)
- [mega-book ladder runner](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\scripts\run-mega-book-ladder.mjs)
- [mega-book ladder tests](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\test\mega-book-ladder.test.mjs)
- [v18 ladder corpus](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\mega-book-ladder-corpus-2026-05-07.txt)
- [v18 ladder semantic groups](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\mega-book-ladder-semantic-2026-05-07.json)
- [v18 auto-routed report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-mega-book-ladder-v18-confidence-routed.json)
- [v18 v10 head comparison](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-mega-book-ladder-v18-v10-head-comparison.json)
- [v18 v13 head comparison](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-mega-book-ladder-v18-v13-head-comparison.json)

## Next Action

Build a route validator that tests candidate-head behavior before accepting the lexical/shape route:

- Run the candidate specialist on a small diagnostic ladder/sample.
- Reject the candidate if it trips collapse or if root-to-chapter margin is weak.
- Fall back to `v10` when it is more stable than the specialist.
