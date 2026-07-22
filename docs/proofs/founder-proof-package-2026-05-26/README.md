# 16xVS Founder Proof Package

Date: `2026-05-26`

This package is the clean current read of 16xVS for founder, attorney, investor, or technical-review use.

It intentionally separates:

- what is proven in repo artifacts
- what is directional but promising
- what is explicitly not claimed
- what failed and why it matters
- how to reproduce the current proof package

## Current Bottom Line

The closest usable artifact is the `v23 four-head proof package`.

It is a reproducible research proof package, not a production tokenizer.

The strongest supported claim is:

> A ranked specialist-router proof can preserve compact fold shape and positive semantic margins across the current primary controlled lanes: book-root, governance, archive, old booklike, and mega-book ladder.

The strongest unsupported claim is:

> 16xVS is not yet proven as a general-purpose tokenizer replacement.

## Best Current Baseline

`v23` remains the locked proof baseline.

Primary V23 lanes:

| Case | Selected Head | Min Margin | Avg Patches | Status |
| --- | --- | ---: | ---: | --- |
| `book-root` | `bookRoot` | `8` | `3` | pass |
| `governance-adversarial` | `governance` | `3.5` | `2.8333` | pass |
| `archive-pressure` | `governance` | `8` | `3` | pass |
| `booklike` | `booklikeRepair` | `7.5` | `3` | pass |
| `mega-book-ladder` | `default` | `31` | `2.9167` | pass |

Generalization failures:

| Case | Selected Head | Min Margin | Avg Patches | Status |
| --- | --- | ---: | ---: | --- |
| `blind-holdout` | `default` | `-15.5` | `1` | fail |
| `stress-100` | `default` | `-28.6444` | `1` | fail |
| `quote` | `default` | `-18.2` | `1` | fail |
| `quote-paragraph` | `governance` | `-20.25` | `1` | fail |

## What Works

- The POC harness exists and is separate from shared BotVibe systems.
- The benchmark harness exists and can generate repeatable reports.
- The learned/prototype training loop exists.
- The hierarchical packer can preserve compact patch shape on controlled long-form and synthetic book-fold cases.
- The specialist-router direction works on the known primary lanes.
- The proof package can be reproduced with one command.

## What Does Not Work Yet

- Blind unseen-domain generalization is still negative.
- Stress-100 mixed-format grouping is still negative.
- Quote and quote-paragraph grouping are still negative.
- V25 hard-negative mining did not solve the wall.
- V26 split repair improved direct quote slightly, but still failed and exposed route leakage.
- No current artifact supports production-router proof.
- No current artifact supports broad tokenizer-superiority claims.
- No current artifact supports `99.99%` raw-source reduction or `1.25 GB` corpus-collapse claims.

## Current Technical Thesis

The system is currently strongest as a routed specialist architecture.

The current evidence suggests:

- fold shape can be preserved under hierarchical packing
- semantic preservation is possible on controlled lanes
- one universal semantic head is not enough yet
- unrestricted ranked repair heads can leak into lanes they should not control
- the next research step should be route-gated repair, not another unrestricted global head

See [technical thesis](docs\proofs\founder-proof-package-2026-05-26\TECHNICAL-THESIS.md).

## Reproduce

Use [REPRODUCE.md](docs\proofs\founder-proof-package-2026-05-26\REPRODUCE.md) for commands.

Minimum verification:

```powershell
npm test
npm run proof:package:v23 -- --label v23-founder-proof-2026-05-26
```

## Evidence

- [Fresh V23 founder proof package](bench\proof-locks\2026-05-26-181831302z-v23-founder-proof-2026-05-26\README.md)
- [Fresh V23 founder summary](bench\proof-locks\2026-05-26-181831302z-v23-founder-proof-2026-05-26\summary.json)
- [V23 locked proof package](bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\README.md)
- [V23 ledger](docs\ledger\2026-05-16-v23-four-head-proof-package.md)
- [V24 quote repair probe](docs\ledger\2026-05-16-v24-quote-repair-probe.md)
- [V25 hard-negative repair probe](docs\ledger\2026-05-20-v25-hard-negative-repair-probe.md)
- [V26 split hard-negative repair probe](docs\ledger\2026-05-25-v26-split-hard-negative-repair-probe.md)
- [Evidence map](docs\proofs\founder-proof-package-2026-05-26\EVIDENCE-MAP.md)

## Use Boundary

Safe to use as:

- private proof-of-concept package
- attorney/investor/technical-review evidence bundle
- internal research baseline
- reproducible benchmark frame

Not safe to use as:

- production tokenizer
- public API claim
- broad tokenizer replacement claim
- storage-collapse claim beyond tested artifacts
- blind-generalization proof
