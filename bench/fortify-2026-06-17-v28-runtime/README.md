# V28 Runtime-Governance Hardening Probe

- generatedAt: `2026-06-17T12:02:38.835Z`
- claimLevel: `runtime-governance-proof`
- noWorkerDeploy: `true`
- noExternalCalls: `true`

## Required Fields

| laneId | eligibleHeads | confidence | accepted | fallbackUsed | fallbackPatchIds | temperatureSchedule | driftBefore | driftAfter |
| --- | --- | ---: | --- | --- | --- | --- | ---: | ---: |
| governance-adversarial | governance, default | 1 | true | true | patch-unknown | 2, 1, 0.5, 0.25 | 2 | 0 |

## Deferred Layers

- BART
- Wasm SIMD
- Durable Object sharding
- QJL
- Cloudmersive

## Read

V28 proves local runtime governance only: hard lane contracts, patch-local cold fallback, and STE temperature-decay simulation. It is not a deployment or production runtime.

