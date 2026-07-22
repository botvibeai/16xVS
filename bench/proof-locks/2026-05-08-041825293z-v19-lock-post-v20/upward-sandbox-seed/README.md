# Upward Sandbox Seed

This lock package is the baseline. Create upward experiments outside this folder with:

```bash
npm run sandbox:create -- --from-lock bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20
```

The sandbox command excludes `.env`, `models`, `bench`, `node_modules`, `.wrangler`, and generated vault snapshots.
