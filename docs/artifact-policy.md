# Artifact Policy

This private repository stores the reproducible 16xVS proof harness, source code, tests, docs, and compact benchmark reports.

## Included

- Worker source and browser demo assets.
- Local proof harness code.
- Test suite.
- Training specs and compact training-pair fixtures.
- Ledger/status docs.
- Current proof reports, including the V30 commercial token-reduction bundle.

## Excluded

- `.env`, `.dev.vars`, and other local secrets.
- `node_modules`, `.wrangler`, and npm/cache folders.
- Raw generated model dumps under `models/`.
- Vault snapshot zip archives under `vault-snapshots/`.

## Why Heavy Artifacts Are Excluded

The raw model JSON files and vault zip archives are generated artifacts. They are large enough to cause local disk pressure and are not needed for a clean source/proof repository. The repo keeps the scripts, specs, reports, and proof ledgers needed to regenerate or audit the current proof state.

## Current Primary Proof Bundle

- `bench/fortify-2026-07-17-v30-commercial-baseline/summary.json`
- `bench/fortify-2026-07-17-v30-commercial-baseline/evaluation.json`
- `bench/fortify-2026-07-17-v30-commercial-baseline/commercial-gap-report.json`
- `docs/ledger/2026-07-17-v30-commercial-token-reduction-baseline.md`
