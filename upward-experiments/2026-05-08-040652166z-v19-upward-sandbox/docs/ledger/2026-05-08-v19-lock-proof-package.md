# EXP-2026-05-08-001 V19 Lock Proof Package

- `id`: `EXP-2026-05-08-001`
- `date`: `2026-05-08`
- `purpose`: Freeze the current v19 validated router as a reproducible directional proof package before upward experiments continue.
- `implementation_path`: `v19-lock-proof-package`
- `baseline`: `v19-validated-routing`

## Method

- Added a checkpoint manifest for `v3`, `v6`, `v8`, `v9`, `v10`, `v13`, and `v19`.
- Extended the validated routing runner to evaluate all configured release heads and write full-head ranking metadata.
- Kept the active v19 selection rule on routed-candidate plus default-fallback to avoid promoting ranking into production policy too early.
- Added proof gates that separate primary directional-lock checks from blind/stress production-generalization checks.
- Added a proof package command that writes a dated `bench/proof-locks/` bundle.
- Added an upward sandbox command that copies code/docs/test scaffolding while excluding `.env`, `models`, `bench`, `node_modules`, `.wrangler`, and vault snapshots.

## Claim Supported

- v19 can now be rebuilt as a clean proof package instead of only described in docs.
- Full-head ranking is available for audit across the configured v19 release heads.
- Blind/stress results are visible as gates and cannot be hidden behind a positive lock summary.

## Claim Not Supported

- Production route selection.
- Broad tokenizer superiority.
- Blind/stress semantic generalization unless those gates pass.
- `99.99%` raw-source reduction or Library of Congress to `1.25 GB`.

## Artifacts

- [v19 lock proof package doc](docs\proofs\v19-lock-proof-package.md)
- [checkpoint manifest](data\release\v19-lock-checkpoints.json)
- [proof gates](core\proof-gates.mjs)
- [proof package command](scripts\build-proof-package.mjs)
- [upward sandbox command](scripts\create-upward-sandbox.mjs)
