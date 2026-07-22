# 16xVS Documentation System

This folder is the documentation backbone for `16xVS`.

It uses a two-track model:

- `ledger/` - internal experiment ledger and evidence source of truth
- `proofs/` - founder-facing proof dossier with claim-backed wins only
- `failures/` - failed or unproven findings that must stay visible
- `math/` - target protocol math, assumptions, and implementation boundary
- `status.md` - one-page current state
- `bench/proof-locks/` - generated proof packages from `npm run proof:package`

Evidence labels used throughout this folder:

- `Proven` - implemented and reproduced by artifacts in this repo
- `Directional` - signal exists, but the implementation is incomplete or indirect
- `Failed / Unproven` - the current method does not validate the claim or the benchmark contradicts it

Implementation layers that must stay separated in every document:

- `POC harness` - image ingest, storage, exact Hamming retrieval, repair
- `Experimental core candidate` - heuristic benchmark path used for current text experiments
- `Target 16xVS math` - BSQ-based tokenizer with spherical normalization and binary quantization

No proof document should treat target 16xVS math as already implemented unless a ledger entry and artifact say so.

The current lock proof package boundary is documented in [proofs/v19-lock-proof-package.md](docs\proofs\v19-lock-proof-package.md).
