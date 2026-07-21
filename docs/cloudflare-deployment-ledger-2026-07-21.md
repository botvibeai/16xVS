# 16xVS Cloudflare Deployment Ledger - 2026-07-21

This ledger records the additive V30 Cloudflare topology setup. No source files, buckets, or deployments were deleted.

## Workers

| Role | Worker | URL | Data stack | Proof baseline | Current version |
| --- | --- | --- | --- | --- | --- |
| Primary | `16xvs-poc` | `https://16xvs-poc.michael-38d.workers.dev` | production | `v30` | `f9865031-65f3-42d5-9410-83600de6c45b` |
| Secondary hot standby | `16xvs-poc-secondary` | `https://16xvs-poc-secondary.michael-38d.workers.dev` | production | `v30` | `04c11763-e2d2-473b-859c-096dfdb10fb1` |
| Testing sandbox | `16xvs-poc-testing` | `https://16xvs-poc-testing.michael-38d.workers.dev` | testing | `v30-plus-experiments` | `9eb6e918-f2c3-4859-9f76-651fc9a0a558` |

The existing custom route `https://pre.16xvs.com` resolves to the primary Worker and reported `role: primary`, `dataStack: production`, and `proofBaseline: v30`.

## R2 Data Stacks

Production primary and secondary share the same R2 quorum:

| Binding | Bucket |
| --- | --- |
| `LIVE_TOKENS` | `16xvs-poc-live` |
| `FALLBACK_TOKENS` | `16xvs-poc-fallback` |
| `VAULT_TOKENS` | `16xvs-poc-vault` |

Testing uses a separate R2 quorum:

| Binding | Bucket |
| --- | --- |
| `LIVE_TOKENS` | `16xvs-poc-testing-live` |
| `FALLBACK_TOKENS` | `16xvs-poc-testing-fallback` |
| `VAULT_TOKENS` | `16xvs-poc-testing-vault` |

## Verified Health

Health was checked after deployment using `/api/health`.

| Endpoint | OK | Role | Data stack | Proof baseline | Records | Triple | Degraded |
| --- | --- | --- | --- | --- | ---: | ---: | ---: |
| `https://16xvs-poc.michael-38d.workers.dev/api/health` | true | primary | production | v30 | 1 | 1 | 0 |
| `https://16xvs-poc-secondary.michael-38d.workers.dev/api/health` | true | secondary | production | v30 | 1 | 1 | 0 |
| `https://16xvs-poc-testing.michael-38d.workers.dev/api/health` | true | testing | testing | v30-plus-experiments | 0 | 0 | 0 |
| `https://pre.16xvs.com/api/health` | true | primary | production | v30 | 1 | 1 | 0 |

## Local Verification

- `node --check src/index.js`: passed.
- `npm test`: passed with `74/74`.
- Wrangler deploy dry-runs passed for primary, secondary, and testing before live deployment.

## Recovery Notes

- The primary Worker keeps older Cloudflare deployment history from April 2026 plus the July 21, 2026 V30 deployment.
- Secondary is intentionally separate from the primary Durable Object instance, but it can rebuild catalog visibility from the shared production R2 live/fallback/vault stack.
- Testing is intentionally empty and isolated. It is the correct place to load recovered experiments such as higher-ratio `707 -> 1` or book-fold probes.
- Cloudflare R2 object data is still not a replacement for the local emergency backup zips. Keep off-machine backups as the next safety layer.
