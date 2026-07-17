# Original Cloudflare Architecture Evidence Map

This document preserves the original Cloudflare architecture intent supplied by the founder and maps it to the frozen V30 repository state. It is not implementation proof by itself.

## Status labels

- **Implemented** — present in the frozen repository source or configuration.
- **Locally proven** — exercised by the local proof harness, but not independently confirmed as production behavior.
- **Historically reported live** — supported by the recovered Codex session transcript, but still requires fresh read-only verification.
- **Deferred** — described in the architecture report but not present in the frozen implementation.
- **Unverified claim** — economic, performance, scale, or accuracy statement that requires independent testing.

## Architecture mapping

| Component | Recovery status | Current evidence | Required next proof |
|---|---|---|---|
| 16x16 binary glyph generation | Implemented | Worker and browser POC source are preserved. | Fresh clone test and isolated reproduction. |
| Cloudflare Worker edge runtime | Implemented | `wrangler.jsonc` and `src/index.js` are preserved. | Read-only live route inventory, then isolated deploy rehearsal only after approval. |
| Durable Object catalog | Implemented | `GLYPH_CATALOG` binding and catalog/search routes are preserved. | Export record count, IDs, and metadata from the live DO without mutation. |
| Three-tier R2 durability | Implemented; historically reported live | Live, fallback, and vault bucket bindings exist; recovered transcript reports triple-tier ingest and exact retrieval. | Authenticated read-only object inventory and cross-tier hash comparison. |
| Exact Hamming search in JavaScript | Implemented / locally proven | Search and distance logic are preserved in the POC. | Run controlled retrieval suite from a recovery copy. |
| Binary Spherical Quantization-style learned path | Locally proven research path | Training scripts, compact training pairs, reports, and proof ledgers are preserved; exact model dumps remain external. | Recover or regenerate named model assets and reproduce frozen suites. |
| Specialist multi-head routing | Locally proven | V15-V23 routing, lane selection, proof gates, and reports are preserved. | Recover four named specialist models and rerun V23 package. |
| Hard route gating / lane ownership | Locally proven | V27 and V28 local proof harnesses are preserved. | Worker-entry integration test before production use. |
| Cold-path fallback | Locally proven | V28 demonstrates patch-local fallback in the local harness. | Connect to a real high-precision fallback and test sequence behavior. |
| STE temperature schedule | Local simulation only | V28 includes a controlled drift-reduction simulation. | Apply to an actual training run and compare holdouts. |
| Wasm SIMD Hamming kernels | Deferred | No Wasm SIMD implementation is present in the frozen repository. | Implement and benchmark against the JavaScript path. |
| Rust/Wasm production core | Deferred | Not present in the frozen package. | Define protected core boundary, implement, and benchmark. |
| Vectorize two-stage retrieval | Deferred | No deployed Vectorize integration is proven in the frozen repo. | Add approximate candidate retrieval plus exact reranking tests. |
| Multi-region R2 replication via Queues | Deferred | Three logical R2 tiers exist, but jurisdictional multi-region replication is not proven. | Define regions, queue flow, consistency ledger, and disaster-recovery test. |
| Dynamic Workers orchestration | Deferred | Not present in the frozen 16xVS package. | Separate security review and isolated prototype. |
| AI Gateway and visual safety guardrails | Deferred | Not implemented in the frozen 16xVS Worker. | Define moderation boundary and false-positive/false-negative tests. |
| Llama Guard 3 Vision | Deferred | No dependency or runtime path is preserved. | Verify model availability and implement an isolated safety test. |
| BitNet b1.58 inference layer | Deferred architectural direction | No BitNet runtime is implemented in this repository. | Independent hardware/runtime benchmark before product claims. |
| Permanent Keepers library | Architecture preserved; runtime state unverified | The recovered architecture report defines the permanent concept library, but the complete live catalog has not been exported. | Export DO/R2 catalog state, IDs, metadata, and hashes. |
| Temporary Throwaways memory | Architecture only | Described in the recovered report, not proven as a complete runtime layer. | Define schema, lifecycle, and deletion/reconstruction tests. |
| Reversible/lossless unfolding | Unsupported in current evidence | Existing audit explicitly prohibits this claim. | Independent held-out reconstruction benchmark. |

## Claims that must remain unverified until independently tested

The original report contains ambitious performance and economic targets. They are preserved as design hypotheses, not release claims:

- 99% operational-cost reduction.
- 100x compression with minimal perceptual distortion.
- 2.4x tokenizer throughput.
- 251 ns Hamming comparisons and 65x speedup.
- Under-100 ms global retrieval.
- Greater than 95% search accuracy.
- 71.4x arithmetic-energy reduction in an integrated 16xVS system.
- The stated billion-token monthly TCO comparison.
- Multi-region instant availability and strong-consistency behavior.
- 99.99% storage reduction or Library-of-Congress-scale collapse.

These targets may be researched later, but none should block preservation of the working POC and proof lineage.

## Recovery priority derived from the original architecture

1. Preserve and hash the original local workspace.
2. Recover the named model files and all Vault snapshots.
3. Inventory the Durable Object catalog and all three R2 buckets read-only.
4. Cross-check record IDs and hashes across tiers.
5. Reproduce the V23 specialist proof and V27/V28 governance proofs from an isolated copy.
6. Establish a safe preview release containing only claims supported by reproduced evidence.
7. Keep deferred Cloudflare architecture components in a separate roadmap; do not silently add them to the release.

## Release boundary

A Monday preview may expose the existing POC and evidence dashboard only after recovery gates pass. It must not claim the deferred architecture, lossless unfolding, production tokenizer readiness, independent superiority, or the report's economic projections.
