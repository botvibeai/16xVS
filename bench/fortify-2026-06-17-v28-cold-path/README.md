# V28 Cold-Path Fallback Probe

- generatedAt: `2026-06-17T12:02:41.171Z`
- claimLevel: `cold-path-proof`
- noWorkerDeploy: `true`
- noExternalCalls: `true`

## Required Fields

| laneId | eligibleHeads | confidence | accepted | fallbackUsed | fallbackPatchIds | temperatureSchedule | driftBefore | driftAfter |
| --- | --- | ---: | --- | --- | --- | --- | ---: | ---: |
| governance-adversarial | governance, default | 1 | true | true | patch-unknown |  |  |  |

## Deferred Layers

- BART
- Wasm SIMD
- Durable Object sharding
- QJL
- Cloudmersive

## Read

This proves fallback is patch-local and does not fail the whole sequence.

