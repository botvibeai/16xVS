# 16xVS Maximum-Advantage Build Test Status

Updated: `2026-07-18 UTC`
Branch: `build/maximum-advantage-vault-2026-07-17`
Base: frozen commit `fb49ce97d07e596509823f6de2be8734bca0139d`

This file distinguishes tests actually executed from tracked evidence and pending recovery work. It does not authorize deployment, merge, model replacement, or a public compression claim.

## Executed locally and passed

The current isolated safeguard total is **43 passed tests**. These are targeted module tests, not a rerun of the complete original workspace.

### Secure Vault v2 — 7 passed

- Seal and reopen a payload byte-for-byte.
- Encrypt the source filename, source hash, source size, timestamp, and custom metadata inside the authenticated ciphertext.
- Treat the passphrase as exact UTF-8 bytes for new v2 containers.
- Reject hostile or unsupported scrypt parameters before expensive key derivation.
- Reject malformed base64 and invalid cryptographic field lengths.
- Refuse overwrite during both seal and open operations.
- Read legacy v1 containers while writing only the hardened v2 format.
- Reject authenticated-header tampering and an incorrect passphrase.

### Immutable three-tier replication simulation — 4 passed

- Write identical bytes to live, fallback, and Vault tiers.
- Treat an identical retry as idempotent success.
- Reject a same-key/different-content collision without deleting existing data.
- Preserve successful live and Vault writes when fallback fails.

### Compression qualification gate v2 — 11 passed

- Qualify a 315:1 all-pass run set only as tier 300:1.
- Qualify a 707:1 all-pass run set only as tier 700:1.
- Lower the tier when the worst correct run falls below it.
- Block qualification when any result is incorrect.
- Record 80,000:1 as a private technical tier while keeping the initial public recommendation capped at 700:1.
- Reject duplicated run IDs and duplicated evidence.
- Reject modified evidence payloads and non-finite token counts.
- Reject cloned fixtures even when their run IDs differ.
- Reject mixed model identities inside one qualification set.
- Require at least 80 unique sources, 20 unique blind sources, eight domains, restart coverage, and restored-copy coverage.
- Prevent input data from weakening any policy floor.

### Governed BART/preprocessing and layered cache path — 13 passed

- Route code, equations, legal/exact text, short text, and high-literal-density content to exact preservation.
- Route eligible long prose to the governed preprocessing lane.
- Protect and restore URLs, numbers, quoted text, identifiers, code, and other exact spans.
- Reject missing, duplicated, or unknown protected placeholders.
- Reject changed numbers, obligations, or critical negations.
- Accept conservative shortening only when retention checks pass.
- Bind cache identity to source hash, model, model revision, parameters, route, and policy version.
- Bypass preprocessing when the semantic verifier is unavailable.
- Ignore poisoned cache entries.
- Fall back to the untouched source on summarizer, restoration, retention, or semantic failure.
- Cache only candidates that passed both retention and semantic verification.

These are policy and execution-path tests. They do not claim that a live BART model preserved meaning on the recovered 16xVS benchmark set.

### Compression measurement ledger — 8 passed

- Record source, preprocessing, tokenizer, and total token counts separately.
- Reconcile stage ratios mathematically so BART and 16xVS savings cannot be double-counted.
- Count a cache hit as normal output rather than zero-cost or zero-token output.
- Reject zero, infinite, expanded, or contradictory token accounting.
- Require exact-bypass hashes and token counts to remain unchanged.
- Detect measurement tampering before qualification.
- Demonstrate that a valid synthetic 100-run 707:1 evidence set would qualify as 700:1.
- Demonstrate that a valid synthetic 100-run 80,000:1 set would remain private above the public 700:1 launch cap.

The two initial failures in this lane had the same cause: the test fixture marked restore runs after deciding whether to attach the Vault artifact hash. Testing stopped, the shared fixture builder was corrected, and all eight tests then passed. This was not a tokenizer or compression failure.

## Existing tracked evidence, not rerun in this recovery environment

- V30 controlled fixture reports 100/100 source-group retrieval.
- V30 average source is 220.49 BPE tokens and average equivalent output is one token.
- V30 pressure tests reject collapsed identical signatures and count residual patches against the ratio.
- V23 four-head reports preserve positive primary lanes while blind and stress cases remain unresolved.
- V27 fold-lineage evidence reports all tested parent margins positive with minimum margin 9.

The tracked V30 result remains a controlled local proof. It is not a newly qualified 300:1 or 700:1 release result.

## Recovery searches completed

- The tracked GitHub tree contains the source, reports, training pairs, deterministic training implementation, and exact expected metadata for the V8, V10, V13, and V22 specialist heads.
- The ignored generated model JSON files are still required for exact original-hash comparison.
- A File Library search found the June BART architecture/report material but did not find machine-generated 707:1 benchmark evidence or the exact latest configuration.

## Added and pending execution against the complete original workspace

- Full compression evidence scan across `CODEX-AGENT`, including ignored models and Vault snapshots.
- Deterministic rebuild of the four V23 specialist heads into `recovery-output/rebuilt-models/`.
- Stable-hash comparison between rebuilt candidates and recovered original model JSON files.
- Full V23 proof reproduction from a restored copy.
- Live BART evaluation through the governed retention and semantic gates.
- A real 100-run qualification dataset for 300:1, 700:1, and any higher observed tier.

## Abandoned test avenue after two failures

GitHub Actions failed twice before launching any job, including a minimal one-line runner smoke test. There were no test job logs because no runner started. The workflow was removed from the build branch to avoid repeated false-noise failures. This is an Actions availability problem, not a tokenizer test result.

## Current release truth

- Newly qualified public ratio: **none**.
- Preserved controlled baseline: **220.49:1 at 100/100 on the V30 fixture**.
- 300:1 notification threshold: **not yet earned on recovered real evidence**.
- 700:1 target: **founder-observed historical consistency, not yet recovered or reproduced here**.
- Higher ratios: may be recorded as private technical evidence, but the initial public recommendation remains capped at 700:1 until the founder deliberately changes release policy.

## Testing rule

Continue a lane while evidence improves. After two meaningful failures in the same lane, stop, diagnose the common cause, and redesign before spending more runs there.
