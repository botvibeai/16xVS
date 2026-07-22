# 16xVS Cloudflare Topology

This topology keeps the original Worker clean and separates production from experiments.

## Workers

- `16xvs-poc`: primary production Worker, locked to V30 evidence.
- `16xvs-poc-secondary`: secondary production Worker, same V30 code and same production R2 stack.
- `16xvs-poc-testing`: isolated testing Worker for 707-to-1 and larger fold experiments.

## R2 Data Stacks

Production uses the original buckets:

- `16xvs-poc-live`
- `16xvs-poc-fallback`
- `16xvs-poc-vault`

Testing uses isolated buckets:

- `16xvs-poc-testing-live`
- `16xvs-poc-testing-fallback`
- `16xvs-poc-testing-vault`

## Rules

- Production primary and secondary stay on V30 until a later proof is explicitly promoted.
- Testing never writes to production buckets.
- Ingest requires live plus at least one secondary copy.
- Vault records are private R2 objects and must not use public `r2.dev` access.
- If a Durable Object catalog is empty, the Worker can recover records from R2 as a cold fallback.

## Deploy Commands

```powershell
npm run deploy:primary
npm run deploy:secondary
npm run deploy:testing
```
