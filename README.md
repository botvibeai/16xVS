# 16xVS Proof Harness

Private proof repository for the current `16xVS` proof-of-concept and evidence bundle.

This is a research/proof harness, not a production tokenizer claim. It packages the Cloudflare Worker POC, local test harnesses, proof ledgers, compact benchmark evidence, and the current V30 commercial token-reduction baseline.

## Current High-Level Result

The latest local commercial-baseline proof is V30:

- Fixture: `100` deterministic entries
- Source size: `200-240` BPE tokens per entry
- Average source: `220.49` BPE tokens
- Average output: `1` equivalent 16xVS token
- Local compression ratio: `220.49x`
- Source-group retrieval correctness: `100/100`

Primary artifact:

- `bench/fortify-2026-07-17-v30-commercial-baseline/summary.json`
- `bench/fortify-2026-07-17-v30-commercial-baseline/README.md`
- `docs/ledger/2026-07-17-v30-commercial-token-reduction-baseline.md`

## Worker Identified

The packaged Worker is the `16xvs-poc` Worker.

- Config: `wrangler.jsonc`
- Main entry: `src/index.js`
- Demo assets: `assets/`
- Durable Object binding: `GLYPH_CATALOG`
- R2 buckets: `16xvs-poc-live`, `16xvs-poc-fallback`, `16xvs-poc-vault`

No Worker deploy is required to run the local proof suite.

## What This Repo Proves

The POC proves a controlled storage/search loop and local proof harness:

1. Convert visual/text fixtures into 16xVS-style binary signatures.
2. Store and search signatures with exact Hamming-distance style checks.
3. Preserve named proof baselines and report known failures.
4. Run local V23-V30 proof and governance tests reproducibly.
5. Demonstrate the V30 controlled commercial-baseline result above.

## What This Repo Does Not Prove Yet

Do not claim these from the current repo:

- Broad tokenizer superiority over current commercial tokenizers.
- Production tokenizer readiness.
- Lossless or reversible unfolding.
- General quote, blind-holdout, or stress-suite repair.
- `99.99%` raw-source reduction.
- `1.25 GB` corpus collapse.
- Commercial API parity against third-party compressors without independent testing.
- Beating the `226x` query-aware extraction demo with the current `220.49x` V30 fixture.

## Install

```bash
npm install
```

For deterministic install in CI or a fresh clone:

```bash
npm ci
```

## Local Verification

Run all local tests:

```bash
npm test
```

Run the current V30 commercial-baseline proof:

```bash
npm run proof:commercial:v30
```

Expected V30 output includes:

```text
averageSourceBpe: 220.49
averageEquivalentOutputTokens: 1
averageCompressionRatio: 220.49
correctness: 100/100
```

## Useful Proof Commands

```bash
npm run proof:package:v23
npm run proof:probe:v27-route-gated
npm run proof:fold:v27
npm run proof:probe:v28-runtime-hardening
npm run proof:gap:v29
npm run proof:commercial:v30
```

## Local Worker Commands

Run local dev:

```bash
npm run dev
```

Deploy only after explicit approval:

```bash
npm run deploy
```

## Artifact Policy

Heavy generated artifacts are intentionally excluded from Git:

- `.env`, `.dev.vars`, and local secrets
- `node_modules`, `.wrangler`, and npm caches
- raw `models/` dumps
- `vault-snapshots/` zip archives

See `docs/artifact-policy.md`.

## Evidence Map

- Current status: `docs/status.md`
- Known failures: `docs/failures/current-failures.md`
- Ledger entries: `docs/ledger/`
- Current V30 bundle: `bench/fortify-2026-07-17-v30-commercial-baseline/`

## Public-Release Rule

If this repo is made public, keep the language evidence-bound. The current strongest public-safe statement is:

`16xVS has a local controlled proof where 100 entries averaging 220.49 BPE tokens fold to 1 equivalent token each with 100/100 source-group retrieval under the V30 fixture.`

Everything broader remains unproven until directly tested.
