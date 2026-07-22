# V31 Testing-Only Book-Fold Attack

- generatedAt: `2026-07-21T05:38:08.998Z`
- claimLevel: `v31-testing-only-synthetic-book-fold-proof`
- ok: `true`
- noDeploy: `true`
- noExternalCalls: `true`
- testingWorkerOnly: `true`

## Gates

| Gate | Pass |
| --- | ---: |
| v30Regression | true |
| commercialOvermatch249 | true |
| stretch500 | true |
| stretch707 | true |
| bookFold | true |
| ultraReduction9999 | true |
| meaningPurification | true |

## No-Marker Suites

| Target BPE | Avg Source BPE | Output Tokens | Ratio | Correct | Pass | 99.99% Pass |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 249 | 250.4 | 1 | 250.4x | 100/100 | true | false |
| 500 | 501.2 | 1 | 501.2x | 100/100 | true | false |
| 707 | 707.5 | 1 | 707.5x | 100/100 | true | false |

## Book Fold

- allMarginsPositive: `true`
- minMargin: `12`
- minBookSourceBpe: `10000`
- ultraReductionPassed: `true`

## Read

V31 is a testing-only synthetic attack harness. It does not promote production claims, does not deploy Workers, and does not call external APIs.

## Artifacts

- `summary.json`
- `no-marker-249.json`
- `no-marker-500.json`
- `no-marker-707.json`
- `book-fold-report.json`
- `meaning-purification-audit.json`

