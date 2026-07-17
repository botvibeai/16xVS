# 16xVS POC

Isolated proof of concept for `16xVS` built as a standalone Cloudflare Worker project.

## Boundary

This folder is intentionally sealed off from the rest of the workspace:

- no imports from shared BotVibe Workers
- no `RemovedAgent`, `Native1`, `ReMemory`, or gateway tenancy
- one Worker serves both the site and API
- one Durable Object stores the glyph catalog for exact search
- three R2 tiers store the token records: `live`, `fallback`, and `vault`

If this folder is moved into its own repository, the app should still work without architecture changes.

## What it proves

The POC proves only the core loop:

1. Upload an image in the browser.
2. Downsample it to `16 x 16` grayscale.
3. Convert it in the Worker into a `256`-bit binary glyph.
4. Store the glyph with source metadata.
5. Query the catalog using exact Hamming distance.

For larger tests, the UI also supports fixture-only batch ingest from pasted text. That path is for storage and retrieval validation only. It is not the production `16xVS` tokenizer.

## Storage model

The POC now uses a three-tier storage policy for visual token records:

- `live` - primary operational copy
- `fallback` - secondary recovery copy
- `vault` - long-term archive copy

Durability rule:

- `live` is required
- at least one secondary copy (`fallback` or `vault`) is required
- records that do not reach that quorum are rejected and cleaned up
- degraded records can be reconciled later with the repair route or repair button

## Routes

- `GET /` - demo UI
- `GET /api/health` - service health and record count
- `GET /api/library` - stored glyph catalog
- `POST /api/tokenize` - generate glyph from a 16x16 grayscale array
- `POST /api/ingest` - generate and store a glyph
- `POST /api/ingest-batch` - batch store fixture glyphs for larger prompt or book tests
- `POST /api/search` - exact Hamming-distance search against stored glyphs
- `POST /api/repair` - reconcile degraded records back across storage tiers

## Bucket bindings

The Worker expects three R2 buckets:

- `16xvs-poc-live`
- `16xvs-poc-fallback`
- `16xvs-poc-vault`

Create them before deployment or rename the bindings in [wrangler.jsonc](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\wrangler.jsonc).

## Local commands

Install dependencies in this folder, then run:

```bash
npm install
npm run dev
```

Deploy with:

```bash
npm run deploy
```

Run the local benchmark with:

```bash
npm run benchmark
```

Run a benchmark against a specific learned model with:

```bash
npm run benchmark:model -- --input ./bench/quote-corpus-2026-04-25.txt --semantic ./bench/quote-semantic-2026-04-25.json --encoder-model ./models/learned-hybrid-prototype-v3.json --output ./bench/quote-benchmark.json
```

Derive a storage-focused model variant with a different patch packer using:

```bash
npm run model:derive -- --input ./models/learned-hybrid-prototype-v3.json --output ./models/learned-hybrid-prototype-v3-macro-packer-v1.json --variant-name macro-packer-v1 --packing-mode entry --max-entry-words 96 --max-entry-chars 512 --max-words-per-patch 96 --max-chars-per-patch 512
```

Run a storage projection from existing benchmark reports with:

```bash
npm run storage:project -- --report ./bench/2026-04-25-quote-benchmark-v3.json --report ./bench/2026-04-25-quote-paragraph-benchmark-v3.json --output ./bench/storage-projection.json
```

Create a hashed backup snapshot of the current repo evidence with:

```bash
npm run vault:snapshot -- --label proof-set
```

Run the evidence guardrail tests with:

```bash
npm test
```

Build the locked v19 proof package with:

```bash
npm run proof:package
```

This creates a dated folder under `bench/proof-locks/`, reruns the current v19 validated reports, writes full-head ranking metadata, and records blind/stress gates as explicit pass/fail evidence.

Create a separate upward-experiment sandbox after a lock package exists with:

```bash
npm run sandbox:create -- --from-lock ./bench/proof-locks/<lock-folder>
```

The sandbox intentionally excludes `.env`, `models`, `bench`, `node_modules`, `.wrangler`, and vault snapshots so upward tests do not overwrite the locked proof baseline.

Build the phase-1 training-pair dataset with:

```bash
npm run training:data
```

Build the expanded `v2` training-pair dataset with:

```bash
npm run training:data:v2
```

Run the frozen evaluation suite with:

```bash
npm run eval:suite
```

Train the first learned encoder prototype with:

```bash
npm run learned:train
```

Run the frozen suite against the learned encoder with:

```bash
npm run learned:eval
```

Train the current best local-only hybrid learned encoder with:

```bash
npm run learned:train:hybrid-v3
```

Run the frozen suite against the hybrid `v3` encoder with:

```bash
npm run learned:eval:hybrid-v3
```

This benchmark compares:

- the current `16xVS` POC character-fixture path
- an isolated `16xVS-core` experimental patch-packer candidate with BSQ-style prototype code generation for retrieval
- `tiktoken` using `cl100k_base`

It is useful for baseline and directional measurement, but it is not proof that the final `16xVS` tokenizer beats BPE.

Inputs:

- default sample corpus: [sample-corpus.txt](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\sample-corpus.txt)
- semantic fixture groups: [semantic-phrases.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\semantic-phrases.json)
- custom corpus file via `node ./scripts/benchmark.mjs --input <path>`

Output:

- JSON report at `bench/latest-report.json`

## Evidence System

`16xVS` now has a dedicated documentation backbone:

- [docs/README.md](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\README.md)
- [docs/status.md](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\status.md)
- [docs/ledger/README.md](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\ledger\README.md)
- [docs/proofs/current-proof-dossier.md](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\proofs\current-proof-dossier.md)
- [docs/proofs/v19-lock-proof-package.md](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\proofs\v19-lock-proof-package.md)
- [docs/failures/current-failures.md](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\failures\current-failures.md)
- [docs/math/bsq-and-protocol-foundation.md](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\math\bsq-and-protocol-foundation.md)
- [docs/math/hierarchical-folding-architecture.md](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\math\hierarchical-folding-architecture.md)

Evidence labels:

- `Proven`
- `Directional`
- `Failed / Unproven`

Every tokenizer-performance statement must also say which layer it refers to:

- `POC harness`
- `Experimental core candidate`
- `Target 16xVS math`

Future benchmark runs should keep the raw JSON in `bench/` and add a matching ledger entry in `docs/ledger/`.

Current dated artifacts include:

- [2026-04-20-sample-baseline-report.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-04-20-sample-baseline-report.json)
- [2026-04-20-google-1000-bsq-style-report.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-04-20-google-1000-bsq-style-report.json)
- [2026-04-20-phrase-semantic-bsq-style-report.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-04-20-phrase-semantic-bsq-style-report.json)
- [2026-04-20-multilingual-bsq-style-report.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-04-20-multilingual-bsq-style-report.json)
- [2026-04-20-perturbation-bsq-style-report.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-04-20-perturbation-bsq-style-report.json)
- [2026-04-20-blind-holdout-bsq-style-report.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-04-20-blind-holdout-bsq-style-report.json)

Draft a ledger entry from a report with:

```bash
npm run ledger:from-report -- --report ./bench/latest-report.json --title "Sample Baseline"
```

## Phase-1 Encoder Scaffold

The repo now has the first learned-encoder scaffold pieces:

- training-only phrase groups: [embedding-training-spec.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\data\training\embedding-training-spec.json)
- generated training pairs: [embedding-training-pairs.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\data\training\embedding-training-pairs.json)
- expanded training spec: [embedding-training-spec-v2.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\data\training\embedding-training-spec-v2.json)
- expanded training pairs: [embedding-training-pairs-v2.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\data\training\embedding-training-pairs-v2.json)
- frozen evaluation manifest: [frozen-eval-suite.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\data\eval\frozen-eval-suite.json)
- suite summary output: [suite-summary.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\eval-suite-latest\suite-summary.json)
- learned encoder model output: [learned-feature-prototype.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\models\learned-feature-prototype.json)
- learned suite summary: [eval-suite-learned-latest/suite-summary.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\eval-suite-learned-latest\suite-summary.json)
- best local-only hybrid model output: [learned-hybrid-prototype-v3.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\models\learned-hybrid-prototype-v3.json)
- hybrid `v3` suite summary: [eval-suite-learned-hybrid-v3/suite-summary.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\eval-suite-learned-hybrid-v3\suite-summary.json)
- storage-focused macro model: [learned-hybrid-prototype-v3-macro-packer-v1.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\models\learned-hybrid-prototype-v3-macro-packer-v1.json)
- storage-focused macro suite summary: [eval-suite-learned-hybrid-v3-macro-packer-v1/suite-summary.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\eval-suite-learned-hybrid-v3-macro-packer-v1\suite-summary.json)
- storage-focused hierarchical model `v1`: [learned-hybrid-prototype-v3-hierarchical-packer-v1.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\models\learned-hybrid-prototype-v3-hierarchical-packer-v1.json)
- storage-focused hierarchical model `v2`: [learned-hybrid-prototype-v3-hierarchical-packer-v2.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\models\learned-hybrid-prototype-v3-hierarchical-packer-v2.json)
- storage-focused hierarchical `v2` suite summary: [eval-suite-learned-hybrid-v3-hierarchical-packer-v2/suite-summary.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\eval-suite-learned-hybrid-v3-hierarchical-packer-v2\suite-summary.json)

Separation rule:

- training data may evolve
- frozen eval suites do not
- blind holdout, paraphrase holdout, and stress 100 are evaluation-only

Current best local-only read:

- `controlled_phrase`: pass
- `paraphrase_holdout`: pass
- `controlled_multilingual`: near miss, one negative group remains
- `blind_holdout`: fail
- `stress_100`: fail

That means the local learned path is improving phrase-level generalization, but it still does not prove unseen-domain or broad real-world superiority.

Storage-focused macro variant read:

- tested quote corpus: `1` patch per entry
- tested quote-paragraph corpus: `1` patch per entry
- raw-source storage on those tested corpora: `42.3539%` reduction
- blind holdout: still fail
- stress 100: still fail

That means the macro-packer variant improves storage behavior on tested long-line corpora, but it still does not prove broad semantic or corpus-collapse claims.

Macro-trained read:

- preserves `1` patch per tested quote and tested paragraph entry
- preserves `42.3539%` raw-source reduction on those tested corpora
- slightly improves multilingual and paraphrase margins over the derived macro variant
- still fails the blind unseen-domain holdout

That means training in macro mode did not open the real unseen-domain gate.

Hierarchical packer read:

- keeps the tested quote corpus at `1` patch per entry
- keeps the tested quote-paragraph corpus at `1` patch per entry
- reduces the controlled protocol-longform corpus from `9.5` patches per entry under the macro baseline to `3`
- improves the current tested aggregate raw-source reduction across quotes, quote-paragraphs, and protocol-longform passages to `70.7911%`
- still fails the blind unseen-domain holdout, the mixed-format stress suite, and one multilingual group

That means the hierarchical line is the current best storage-focused long-form experiment, but it is still not proof of broad semantic or corpus-collapse claims.

Book-like pressure read:

- macro baseline on the larger chapter-style corpus: `13.25` patches per entry
- hierarchical variant on the same corpus: `3` patches per entry
- current tested aggregate raw-source reduction across quotes, quote-paragraphs, protocol-longform, and booklike corpora: `83.1534%`
- current directional `1.25 GB` envelope across that tested set: `7.4199 GB` input
- grouped semantic separation on the book-like corpus still fails

That means the storage line is getting materially stronger on longer entries, but the semantic line is still behind it.

Residual-selection `v2` read:

- keeps the same `83.1534%` tested aggregate raw-source reduction
- keeps protocol-longform and book-like entries at `3` patches each on average
- reduces negative grouped themes on the book-like corpus from `4` to `3`
- still fails the controlled multilingual suite, blind holdout, stress suite, and grouped long-form semantic pass

That means `hierarchical-packer-v2` is the current storage-focused baseline, but it is still a storage-side refinement rather than a semantic win.

## Notes

- No secrets are required for the current POC.
- Storage is intentionally simple and local to the Durable Object.
- This is a proof path, not the final `16xVS` production architecture.
- The benchmark's `fixtureGlyphCount` is the current character-fixture path only.
- The benchmark's `experimentalPatchCount` is a separate `16xVS-core` candidate path, still not the final tokenizer.
- The current candidate now uses a BSQ-style prototype retrieval encoder (`z -> normalize -> sign`), but its embedding source is still heuristic and must not be treated as proof of the target tokenizer math.
