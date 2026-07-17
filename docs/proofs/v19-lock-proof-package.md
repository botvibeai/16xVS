# 16xVS V19 Lock Proof Package

This is the release-style proof boundary for the first shippable evidence bundle.

## Lock Definition

- `baseline`: `v19-validated-router`
- `claim level`: `directional-proof-lock`
- `proof command`: `npm run proof:package`
- `checkpoint manifest`: [v19-lock-checkpoints.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\data\release\v19-lock-checkpoints.json)

## What Is Proven

- The standalone POC harness exists and can be tested locally.
- The v19 proof command reruns the routed evidence instead of relying only on old JSON files.
- The v19 runner records full-head ranking metadata for all configured release heads.
- The directional lock gates require the known book-root, governance, archive, booklike, and mega-book ladder reports to preserve route safety, no-collapse behavior, and fold shape.

## What Is Directional

- Book-root, governance, archive, and mega-book ladder behavior are directional evidence for a routed multi-head architecture.
- The lock supports a clean baseline for shipping a proof package, not a production tokenizer.
- The old booklike result is intentionally preserved as a known semantic failure rather than hidden.

## What Is Not Claimed

- Production router proof.
- Broad semantic superiority over current model tokenizers.
- Blind/stress production generalization unless those gates pass in the generated lock summary.
- `99.99%` raw-source reduction.
- Library-scale collapse claims such as `Library of Congress -> 1.25 GB`.

## Release Heads

| Head | Checkpoint | Role |
| --- | --- | --- |
| `default` | `v10` | constrained fold fallback and unknown-route baseline |
| `bookRoot` | `v8` | folded book-root/control bridge specialist |
| `governance` | `v13` | governance/archive specialist |

## Gate Meaning

The proof package has two gate levels:

- `primary-directional-lock`: required for the v19 directional proof lock.
- `production-generalization`: required before making production generalization claims.

Blind holdout and stress-100 are not allowed to disappear behind a positive summary. If they fail, the generated package still shows the failures clearly and keeps the claim level at `directional-proof-lock`.

## Upward Experiment Boundary

Use the sandbox command before testing above this baseline:

```bash
npm run sandbox:create -- --from-lock ./bench/proof-locks/<lock-folder>
```

The sandbox command intentionally excludes `.env`, `models`, `bench`, `node_modules`, `.wrangler`, and generated vault snapshots.
