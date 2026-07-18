# 16xVS Maximum-Advantage Build Test Status — 2026-07-18

Branch: `build/maximum-advantage-vault-2026-07-17`
Frozen base: `fb49ce97d07e596509823f6de2be8734bca0139d`

This ledger records only tests that were actually executed in isolated local sandboxes during recovery. It does not authorize deployment, merge, model replacement, or a public compression claim.

## Current isolated safeguard total: 50 passed

| Lane | Passed | What is protected |
| --- | ---: | --- |
| Secure Vault v2 core | 7 | encrypted manifest, exact passphrase bytes, legacy read support, hostile KDF rejection, overwrite refusal, tamper rejection |
| Secure Vault CLI | 2 | no direct passphrase environment variable, noninteractive execution fails closed |
| Immutable three-tier R2 simulation | 5 | conditional writes, R2 stored SHA-256 verification, forged-metadata rejection, collision refusal, no rollback deletion |
| Qualification gate v3 | 14 | 100-run floors, source/domain diversity, single model, single claim scope, single verifier, worst-run tiering, public cap |
| Governed BART and cache path | 13 | exact-content bypass, protected literals, retention checks, semantic verification, poisoned-cache rejection, source fallback |
| Compression measurement ledger | 9 | separate BART/16xVS/total math, cache accounting, tamper detection, scoped 707/2400/80000 simulations |

## Claim-scope rule

A ratio is never enough by itself. Every qualification run is bound to one verified scope:

- `retrieval-signature`: compact retrieval or routing proof only; never a public tokenizer reconstruction claim.
- `semantic-reconstruction`: semantic skeleton or meaning reconstruction under one hashed verifier; eligible for a scoped public recommendation.
- `lossless-roundtrip`: exact reconstruction; eligible for a lossless public recommendation.
- `task-preserving`: downstream-task evidence; private and task-specific unless separately approved.

Mixed scopes or mixed verifier identities fail qualification.

## Ratio truth

- Preserved tracked controlled proof: `220.49:1`, `100/100`, V30 source-group retrieval fixture.
- Newly reproduced real 300:1 result: none.
- Newly reproduced real 700:1 result: none.
- Founder-observed historical 707:1: recovery target, not yet reproduced in this environment.
- Higher ratios: record privately with their exact scope. Initial public recommendation remains capped at 700:1.

Synthetic gate tests prove only that correctly formed evidence would be classified safely. They do not prove that the tokenizer achieved those ratios.

## Real evidence still required

1. Recover or deterministically rebuild the V8, V10, V13, and V22 generated model files.
2. Compare stable model hashes with recovered originals.
3. Scan the complete `CODEX-AGENT` workspace and Vault snapshots for the latest 707 configuration.
4. Run at least 100 diverse real inputs through one fixed model and one fixed verifier.
5. Include blind inputs, restart runs, restored-copy runs, and at least eight domains.
6. Keep BART preprocessing, 16xVS folding, and total ratio as separate measurements.
7. Publish only the worst-run qualified tier and its exact claim scope.

## Stopped avenues

- GitHub Actions was abandoned after two startup failures before any job launched.
- The compression measurement lane paused after two failures with one shared test-fixture cause; the fixture was corrected and all nine scoped measurement tests now pass.

## Non-negotiable protection

- Frozen recovery branch remains untouched.
- Build work remains on the separate maximum-advantage branch.
- No deployment, merge, Cloudflare mutation, model overwrite, or Vault deletion has been performed.
