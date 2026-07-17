# 16xVS V19 Proof Lock Package

- label: `v19-lock-post-v20`
- generatedAt: `2026-05-08T04:18:25.293Z`
- claimLevel: `directional-proof-lock`

## Primary Directional Lock Gates

| Case | Gate | Route | Selected Head | Min Margin | Collapse | Avg Patches |
| --- | --- | --- | --- | ---: | --- | ---: |
| book-root | PASS | bookRoot | bookRoot | 8 | false | 3 |
| governance-adversarial | PASS | governance | governance | 3.5 | false | 2.8333 |
| archive-pressure | PASS | archive | governance | 8 | false | 3 |
| booklike | PASS | default | default | -18.5 | false | 3 |
| mega-book-ladder | PASS | bookRoot | default | 31 | false | 2.9167 |

## Blind/Stress Generalization Gates

| Case | Gate | Required For Directional Lock | Required For Production | Min Margin | Collapse |
| --- | --- | --- | --- | ---: | --- |
| blind-holdout | FAIL | false | true | -15.5 | false |
| stress-100 | FAIL | false | true | -28.6444 | false |

These gates are not required for the directional proof lock. They are required before claiming production generalization.

## Full Head Ranking

### book-root
| Rank | Head | Accepted | Role | Min Margin | Collapse | Avg Patches |
| ---: | --- | --- | --- | ---: | --- | ---: |
| 1 | bookRoot | true | candidate | 8 | false | 3 |
| 2 | default | false | fallback | -2.5 | false | 3 |
| 3 | governance | false | other | -3.5 | false | 3 |

### governance-adversarial
| Rank | Head | Accepted | Role | Min Margin | Collapse | Avg Patches |
| ---: | --- | --- | --- | ---: | --- | ---: |
| 1 | governance | true | candidate | 3.5 | false | 2.8333 |
| 2 | default | false | fallback | -1 | false | 2.8333 |
| 3 | bookRoot | false | other | -31 | false | 2.8333 |

### archive-pressure
| Rank | Head | Accepted | Role | Min Margin | Collapse | Avg Patches |
| ---: | --- | --- | --- | ---: | --- | ---: |
| 1 | governance | true | candidate | 8 | false | 3 |
| 2 | default | true | fallback | 1.5 | false | 3 |
| 3 | bookRoot | false | other | -11 | false | 3 |

### booklike
| Rank | Head | Accepted | Role | Min Margin | Collapse | Avg Patches |
| ---: | --- | --- | --- | ---: | --- | ---: |
| 1 | governance | false | other | -12.5 | false | 3 |
| 2 | default | false | candidate | -18.5 | false | 3 |
| 3 | bookRoot | false | other | -23.5 | false | 3 |

### mega-book-ladder
| Rank | Head | Accepted | Role | Min Margin | Collapse | Avg Patches |
| ---: | --- | --- | --- | ---: | --- | ---: |
| 1 | default | true | fallback | 31 | false | 2.9167 |
| 2 | bookRoot | false | candidate | 33.0833 | true | 2.9167 |
| 3 | governance | false | other | 31.25 | true | 2.9167 |

## Claims Allowed

- v19 is locked as a reproducible directional proof baseline.
- Known book-root, governance, archive, and mega-book ladder routes preserve fold shape without signature collapse.
- Full-head ranking is recorded for the configured v19 heads.

## Claims Not Allowed

- Production router proof.
- Broad tokenizer superiority over current tokenizers.
- Blind/stress semantic generalization unless the generalization gates pass.
- 99.99% raw-source reduction or Library of Congress to 1.25 GB claims.

## Artifacts

- book-root: bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20/reports/book-root-v19-validated-routed.json
- governance-adversarial: bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20/reports/governance-adversarial-v19-validated-routed.json
- archive-pressure: bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20/reports/archive-pressure-v19-validated-routed.json
- booklike: bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20/reports/booklike-v19-validated-routed.json
- mega-book-ladder: bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20/reports/mega-book-ladder-v19-validated-routed.json
- blind-holdout: bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20/generalization/blind-holdout-v19-validated-routed.json
- stress-100: bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20/generalization/stress-100-v19-validated-routed.json
- doc: bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20/docs/docs__status.md
- doc: bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20/docs/docs__proofs__current-proof-dossier.md
- doc: bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20/docs/docs__failures__current-failures.md
- doc: bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20/docs/docs__ledger__2026-05-07-v19-validated-routing-round.md
- doc: bench/proof-locks/2026-05-08-041825293z-v19-lock-post-v20/docs/data__release__v19-lock-checkpoints.json

## Upward Experiment Boundary

Use `npm run sandbox:create -- --from-lock <this-lock-dir>` before testing above this baseline.
Do not overwrite this lock package with upward experiments.

