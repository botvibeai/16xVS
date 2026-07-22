# V30 Commercial Token-Reduction Baseline

- generatedAt: `2026-07-21T05:37:46.873Z`
- claimLevel: `local-commercial-stretch-proof`
- entryCount: `100`
- averageSourceBpe: `220.49`
- averageEquivalentOutputTokens: `1`
- averageCompressionRatio: `220.49x`
- correctness: `100/100`
- noDeploy: `true`
- noExternalCalls: `true`

## Gates

| Gate | Max Output Tokens | Pass |
| --- | ---: | ---: |
| P0 | 20 | true |
| P1 | 10 | true |
| P2 | 1 | true |

## Commercial Gap

| Baseline | Ratio | Apples-to-Apples | Delta | Beats |
| --- | ---: | ---: | ---: | ---: |
| accuracy-preserving-commercial-2x | 2x | true | 218.49x | true |
| commercial-safe-10x | 10x | true | 210.49x | true |
| research-open-20x | 20x | true | 200.49x | true |
| query-aware-demo-226x | 226x | false | -5.51x | false |

## 226x Math

- sourceTokensForOneTokenToBeat: `227`
- sourceTokensForOneTokenToBeatBy10Percent: `249`
- sourceTokensForOneTokenToBeatBy20Percent: `272`
- target220To1Beats226x: `false`

## Artifacts

- `fixture.json`
- `evaluation.json`
- `commercial-gap-report.json`
- `summary.json`

## Read

V30 is a local commercial-baseline proof harness. It tests a 100-entry 200-240 BPE fixture, counts residual/cold-path tokens against compression, and reports the gap to 2x, 10x, 20x, and 226x references.

