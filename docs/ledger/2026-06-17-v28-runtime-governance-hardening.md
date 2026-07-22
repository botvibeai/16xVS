# EXP-2026-06-17-001 V28 Runtime-Governance Hardening

## Purpose

Implement the next local proof layer after V27 without starting another global-head training loop.

V28 tests runtime governance, not production deployment.

## Changes

- Added a runtime policy contract with lane id, eligible heads, confidence, acceptance state, and reject reason.
- Added deterministic Bloom-style lane classification for local proof use.
- Added patch-local cold-path fallback for low-confidence or rejected patches.
- Added an STE temperature-decay simulation to compare drift against fixed hard sign behavior.
- Deferred BART, Wasm SIMD, Durable Object sharding, QJL, and Cloudmersive.

## Results

| Probe | Result |
| --- | --- |
| Runtime governance | `runtime-governance-proof` |
| STE temperature decay | `ste-stability-proof` |
| Cold-path fallback | `cold-path-proof` |

## Evidence

- Runtime summary: `bench/fortify-2026-06-17-v28-runtime/summary.json`
- Runtime report: `bench/fortify-2026-06-17-v28-runtime/runtime-report.json`
- STE summary: `bench/fortify-2026-06-17-v28-ste/summary.json`
- STE report: `bench/fortify-2026-06-17-v28-ste/ste-report.json`
- Cold-path summary: `bench/fortify-2026-06-17-v28-cold-path/summary.json`
- Cold-path report: `bench/fortify-2026-06-17-v28-cold-path/cold-path-report.json`

## Read

V28 proves the local control shell around the routed system: lane contracts reject mismatched heads before selection, cold-path fallback affects only failing patches, and the STE temperature-decay simulation reduces drift on the controlled fixture.

This is the correct next step after V27 because it hardens the runtime behavior that prevents cross-lane contamination and catastrophic sequence failure.

## Claims Not Allowed

- V28 as a production runtime.
- V28 as a new semantic repair baseline.
- Quote, blind, or stress solved.
- BART, Wasm SIMD, Durable Object, QJL, or Cloudmersive-backed proof.
- Worker deployment proof or Cloudflare runtime proof.
