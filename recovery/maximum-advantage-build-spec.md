# 16xVS Maximum-Advantage Recovery Build

Status: recovery and architecture specification only. This document does not modify the frozen engine, deploy a Worker, publish private methods, or approve a public performance claim.

## Goal

Recover the strongest stable 16xVS system, reproduce the historically reported approximately 707:1 operating range, continue private testing above that range, and make the rebuilt system extremely difficult to corrupt, overwrite, misroute, or falsely certify.

The public site and marketing repository remain separate from the protected engine repository.

## Non-negotiable rule

A large reduction number is not a passing result unless all of the following are recorded and pass:

- exact source fixture and SHA-256 hash
- raw BPE token count
- preprocessing path and versions
- post-preprocessing token count
- selected 16xVS route and head versions
- equivalent 16xVS output count
- retrieval or reconstruction correctness
- protected-span preservation
- repeated-run determinism
- cold-cache and warm-cache equivalence
- restart and isolated-restore reproduction

## Maximum-advantage pipeline

```text
Raw input
  -> content classifier
  -> protected-span extraction
  -> exact lane | semantic lane | mixed lane
  -> optional normalization
  -> optional Workers AI BART denoising
  -> retention and contradiction gate
  -> deterministic hard route gate
  -> specialist 16xVS fold hierarchy
  -> confidence, lineage, and correctness gates
  -> layered cache
  -> Durable Object catalog
  -> R2 live + fallback + immutable vault evidence
```

## Lane A — exact preservation

BART and other summarizers are forbidden for:

- source code
- equations and formulas
- legal language and contractual clauses
- quotations
- IDs, hashes, keys, addresses, configuration, and commands
- tables, measurements, dates, quantities, and financial values
- user-marked literal content

Only reversible normalization may occur. The canonical source remains available by content hash.

## Lane B — semantic denoising

Use BART only for compressible prose where wording is not itself authoritative.

Primary Cloudflare adapter:

```text
@cf/facebook/bart-large-cnn
```

The BART stage is a feature-flagged adapter, not a dependency of the core tokenizer. Cloudflare currently lists this model at zero unit price for input tokens, but the model is deprecated. Therefore the system must support:

1. Workers AI BART while available.
2. A compatible replacement summarizer selected by a versioned policy.
3. A local or external fallback adapter.
4. Complete bypass of summarization when no approved adapter is available.

Every denoising output records:

- source hash
- model identifier
- model or policy version
- generation parameters
- output hash
- reduction ratio
- entities
- quantities
- dates
- negations
- obligations and conditions
- named relations
- retention score
- contradiction score

Reject the summary when it changes polarity, modifies a number, loses a protected entity or condition, introduces unsupported facts, or falls below the retention threshold.

The original input is always canonical. A BART summary is a derived acceleration artifact, never the only copy.

## Lane C — mixed content

For prose containing exact material:

1. Extract protected spans into a lossless sidecar.
2. Replace them with typed stable references.
3. Run denoising only on eligible prose.
4. Reattach the sidecar references to the semantic packet.
5. Fold the structured packet with 16xVS.
6. Verify every protected reference before accepting the result.

## Honest ratio accounting

Store all measurements separately:

- `rawBpeTokens`
- `normalizedBpeTokens`
- `bartInputTokens`
- `bartOutputTokens`
- `bartReductionRatio`
- `equivalent16xvsTokens`
- `foldReductionRatio`
- `totalPipelineReductionRatio`
- `retrievalCorrectness`
- `semanticRetention`
- `protectedSpanPreservation`

Do not describe a BART-plus-16xVS total as a pure 16xVS ratio. Both numbers may be excellent, but they must remain auditable.

## Cache architecture

### L0 — request-local memoization

Cache hashes, route decisions, token counts, parsed spans, and intermediate buffers for the lifetime of a single request. This layer is never authoritative.

### L1 — Cloudflare Cache API

Use only for safe, immutable, or version-addressed responses such as:

- public proof summaries
- static manifests
- model-policy metadata
- health responses with short TTLs
- idempotent public lookups

Never place private raw input or user-specific semantic packets into a shared public cache.

### L2 — Durable Object hot state

The Durable Object owns mutable catalog coordination:

- route ownership and lane locks
- hot fingerprint index
- active model-policy version
- write and repair state
- cluster metadata
- idempotency records
- cache invalidation sequence numbers

Persist important state to Durable Object storage. In-memory maps are acceleration only.

### L3 — Workers KV read cache

KV stores versioned, read-heavy, non-authoritative artifacts:

- route manifests
- approved model metadata
- public proof metadata
- content-hash lookup hints
- frequently reused denoising or fold references where privacy permits

All writes for a logical mutable key flow through its owning Durable Object. KV eventual consistency must never decide canonical state.

### L4 — R2 canonical artifact store

Use content-addressed and versioned R2 keys for:

- canonical inputs where retention is permitted
- exact protected-span sidecars
- normalized semantic packets
- BART outputs
- 16xVS folds
- model manifests
- benchmark fixtures
- proof reports
- recovery manifests

A derived-object key includes:

```text
source hash
+ lane
+ normalizer version
+ BART model and parameter hash, or none
+ 16xVS model/head version
+ route-policy version
+ fold-policy version
+ schema version
```

This prevents stale output from an old model or route policy from poisoning newer runs.

### L5 — live, fallback, and vault

Maintain three independent logical copies:

- `16xvs-poc-live`
- `16xvs-poc-fallback`
- `16xvs-poc-vault`

Correct the historical cleanup danger:

- Never delete a successful vault write because another tier failed.
- A partial write creates a degraded record and repair task.
- The vault is append-only or object-lock simulated through immutable content-addressed keys and restrictive credentials.
- Repairs may add missing copies but may not rewrite historical evidence.
- Cross-tier manifests record key, size, ETag, checksum, schema, and timestamp.

## Semantic result cache

Cache BART and 16xVS results only when all inputs to the transformation are represented in the cache key.

Warm-cache output must be byte-for-byte equivalent to cold-cache output for deterministic paths. Where a model is nondeterministic, the exact output becomes an immutable derived artifact referenced by hash; it is not silently regenerated under the same identity.

## Routing

- Apply a deterministic hard gate before any specialist head runs.
- Define explicit lane ownership and allowlists.
- Reject cross-lane leakage.
- Record the route decision and policy hash.
- Use confidence thresholds per lane, not one universal threshold.
- Send only failing patches to a higher-precision cold path.
- Preserve the exact lane as the final safety fallback.

## Retrieval advantages

Recovery baseline:

- exact Hamming-distance search
- Durable Object hot catalog
- R2 canonical records

Performance path after recovery:

- Wasm SIMD popcount kernels
- zero-copy TypedArray transfer
- optional coarse binary or Matryoshka prefix search
- optional Vectorize candidate pruning
- exact Hamming reranking
- cache of immutable candidate sets keyed by index version

No approximate retrieval result is accepted without exact reranking when correctness is required.

## BART validation suite

Benchmark BART instead of assuming a fixed 60–75% reduction.

Required corpus classes:

- concise factual prose
- repetitive prose
- long narrative
- instructions
- governance and policy text
- multilingual prose
- mixed prose and code
- quoted material
- numeric and temporal claims
- adversarial negation examples

Measure:

- actual reduction distribution
- entity recall
- number/date retention
- negation retention
- relation retention
- contradiction rate
- downstream 16xVS stability
- cache hit rate
- end-to-end latency and cost

BART remains enabled only for classes where it improves total performance without reducing correctness.

## 707:1 recovery qualification

Treat approximately 707:1 as a historical target to reproduce, not as erased and not as automatically proven by V30.

A recovered 707-class configuration qualifies only after:

1. The original or regenerated model identity is hashed.
2. The exact fixture is preserved.
3. At least 100 consecutive deterministic runs pass.
4. Blind holdouts pass the declared correctness threshold.
5. Warm and cold cache results agree.
6. A new process and a new machine or clean container reproduce the result.
7. An isolated restore from a preserved snapshot reproduces it.
8. The result survives Worker-compatible limits or is clearly labeled local-only.

## Higher-ratio private research

An 80,000-to-1 experiment may be investigated privately, but it must not weaken the stable release path. Use a separate research branch, model namespace, cache namespace, proof ledger, and R2 prefix.

Never overwrite the 220, 707, or other known baselines with a more aggressive experiment.

## Public release policy

The site may initially state only the strongest independently reproduced and evidence-bound claim approved for release. The internal system can be substantially stronger without exposing model internals, library contents, private fixtures, or experimental ratios.

## Separation of repositories

- `botvibeai/16xVS` — protected engine, proof system, recovery, model lineage, Worker, storage contracts.
- `botvibeai/16xVS.com` — public website, SEO, GEO, AEO, FAQ, schemas, metadata, and TXT files.

The website consumes a narrow public proof manifest. It never imports the protected engine source.

## Build order

1. Recover and hash the full local workspace.
2. Recover models, library, vault snapshots, and Cloudflare catalog state.
3. Correct vault immutability and partial-write behavior.
4. Reproduce tracked baselines.
5. Reproduce the historical 707-class result.
6. Add the gated BART adapter and measure it independently.
7. Add cache layers one at a time with cold/warm equivalence tests.
8. Add Wasm SIMD and retrieval acceleration behind feature flags.
9. Run restart, chaos, partial-write, and isolated-restore tests.
10. Publish only the approved proof manifest to the separate site repository.
