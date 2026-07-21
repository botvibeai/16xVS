# V32 707 Stabilization

Generated: 2026-07-21T06:38:09.689Z

Claim level: `v32-testing-only-707-stabilized-candidate`

This is a testing-only stabilization harness for `707 -> 1`. It does not deploy, call external APIs, or touch primary/secondary Workers.

## Gates

| Gate | Result |
| --- | --- |
| v30Regression | pass |
| v31Regression707 | pass |
| blindHoldout707 | pass |
| paraphrase707 | pass |
| noisyRaw707 | pass |
| adversarialSibling707 | pass |
| routeConfusion707 | pass |
| anchorMutationGuard | pass |
| routeConfusionGuard | pass |

## Suites

| Mode | Result | Correct | Avg BPE | Output Tokens | Min Margin |
| --- | --- | ---: | ---: | ---: | ---: |
| blind-holdout | pass | 100/100 | 707.2 | 1 | 18 |
| paraphrase | pass | 100/100 | 707 | 1 | 24 |
| noisy-raw | pass | 100/100 | 707.5 | 1 | 18 |
| adversarial-sibling | pass | 100/100 | 708.2 | 1 | 17 |
| route-confusion | pass | 100/100 | 709.9 | 1 | 12 |

## Public Release Boundary

Public release ready: `false`

Blockers:
- external blind corpus not tested
- live testing Worker not exercised
- BART sidecar still no-external-call only
- lossless unfolding not proven
