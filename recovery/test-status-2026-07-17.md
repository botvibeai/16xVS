# 16xVS Maximum-Advantage Build Test Status

Date: 2026-07-17
Branch: `build/maximum-advantage-vault-2026-07-17`
Base: frozen commit `fb49ce97d07e596509823f6de2be8734bca0139d`

This file distinguishes tests actually executed from code or tests that have only been added. It does not authorize a deployment or public compression claim.

## Executed locally and passed

### Secure Vault foundation

- Seal and reopen a payload byte-for-byte.
- Reject an incorrect passphrase.
- Refuse to overwrite an existing sealed container.
- Reject ciphertext tampering.
- Reject authenticated-metadata tampering.
- Reject authentication-tag tampering.
- Reject hostile or unsupported key-derivation container parameters.

### Immutable three-tier replication simulation

- Write identical bytes to live, fallback, and Vault tiers.
- Treat an identical retry as idempotent success.
- Reject a same-key/different-content collision without deleting existing data.
- Preserve successful live and Vault writes when fallback fails.

### Compression qualification gate

- Qualify a 315:1 all-pass run set only as public tier 300:1.
- Qualify a 707:1 all-pass run set only as public tier 700:1.
- Lower the public tier when the worst correct run falls below a tier.
- Block qualification when any result is incorrect.
- Permit 80,000:1 only when all required runs clear it.
- Reject duplicated run IDs.
- Reject non-finite token counts.
- Prevent input data from weakening the 100-run, blind, restart, restore, spread, or correctness policy floors.

## Existing tracked evidence, not rerun in this recovery environment

- V30 controlled fixture reports 100/100 source-group retrieval.
- V30 average source is 220.49 BPE tokens and average equivalent output is one token.
- V30 pressure tests reject collapsed identical signatures and count residual patches against the ratio.
- V23 four-head reports preserve positive primary lanes while blind and stress cases remain unresolved.

The tracked V30 result remains a controlled local proof. It is not a newly qualified 300:1 or 700:1 release result.

## Added and pending execution against the complete original workspace

- `recovery-scan-compression-evidence.test.mjs`
- `specialist-model-rebuild-manifest.test.mjs`
- Full compression evidence scan across `CODEX-AGENT`, including ignored models and Vault snapshots.
- Deterministic rebuild of the four V23 specialist heads into `recovery-output/rebuilt-models/`.
- Stable-hash comparison between rebuilt candidates and recovered original model JSON files.
- Full V23 proof reproduction from a restored copy.
- Repeated 100-run qualification dataset for 300:1, 700:1, and any higher observed tier.

## Abandoned test avenue after two failures

GitHub Actions failed twice before launching any job, including a minimal one-line runner smoke test. There were no test job logs because no runner started. The workflow was removed from the build branch to avoid repeated false-noise failures. This is an Actions availability problem, not a tokenizer test result.

## Current release truth

- Newly qualified public ratio: none.
- Preserved controlled baseline: 220.49:1 at 100/100 on the V30 fixture.
- 300:1 notification threshold: not yet earned.
- 700:1 target: recovery hypothesis based on founder-observed consistency, not yet recovered or reproduced.
- Higher ratios: private research evidence only until the complete qualification gate passes.

## Testing rule

Continue a lane while evidence improves. After two meaningful failures in the same lane, stop, diagnose the common cause, and redesign before spending more runs there.
