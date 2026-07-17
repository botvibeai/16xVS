# V29 Report Gap Audit

- generatedAt: `2026-06-18T07:33:47.617Z`
- claimLevel: `evidence-governance-gap-audit`
- source: `external-source:16xVS 6-13-2026.md`
- rawSha256: `fee76ccb42e792faeca8e2a231293f6246e035ae00fcd8837374d0b3575711f9`
- noDeploy: `true`
- noExternalCalls: `true`

## Section Detection

- detectedSections: `architecture-10, bart-pipeline, memory-architecture, scaling-behavior, fold-mechanism, cognitive-stack`
- missingSections: `none`
- architectureItems: `10`

## Claim Status Counts

| Status | Count |
| --- | ---: |
| proven | 0 |
| directional | 1 |
| local-proof-only | 4 |
| deferred | 10 |
| unsupported | 1 |

## Claims Not Allowed Yet

- `reversibility`: Fold-lineage currently shows routing/root-handle behavior, not lossless reversal.
- `lossless-unfolding`: No independent unfold-quality benchmark exists.
- `broad-tokenizer-superiority`: Current results are controlled and directional, with blind/stress/quote failures still negative.
- `99.99-storage-reduction`: Current status explicitly does not support this raw-source storage claim.
- `1.25gb-collapse`: The repo only supports a smaller directional storage envelope, not the broad corpus-collapse claim.
- `bart-preserves-meaning`: BART has not been tested against quote, legal, code, blind, or stress fixtures in this repo.

## Artifacts

- `raw-report.md`
- `normalized-report.md`
- `gap-audit.json`
- `summary.json`

## Read

V29 maps the supplied report to current evidence. It is an audit layer only and does not implement deferred report ideas.

