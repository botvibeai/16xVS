# EXP-2026-06-18-001 V29 Report Gap Audit

## Purpose

Convert the external `16xVS 6-13-2026.md` report into a local proof-vs-claim matrix without changing the locked V23, V27, or V28 proof lanes.

## Changes

- Added `proof:gap:v29`.
- Added raw and normalized report snapshot output with SHA-256 source hashes.
- Added report-section detection for the 10 architecture items, BART pipeline, memory architecture, scaling behavior, fold mechanism, and cognitive stack.
- Added fixed claim classifications: `proven`, `directional`, `local-proof-only`, `deferred`, and `unsupported`.
- Added a claims-not-allowed list for reversibility, lossless unfolding, broad tokenizer superiority, `99.99%`, `1.25 GB`, and unmeasured BART meaning preservation.

## Read

V29 is an evidence-governance layer only. It confirms the report contains useful future work, but only V27/V28-covered governance items are locally supported, and none are promoted to production proof.

## Claims Not Allowed

- V29 as a new semantic model or repair head.
- BART, TokenTax0, Wasm SIMD, Durable Object sharding, Matryoshka compaction, H-MHSA, or QJL implementation proof.
- Reversible or lossless unfolding proof.
- Broad tokenizer-superiority proof.
- `99.99%` storage reduction or `1.25 GB` corpus-collapse proof.

## Reproduce

```powershell
npm test
npm run proof:gap:v29
```
