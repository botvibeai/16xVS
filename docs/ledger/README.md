# 16xVS Experiment Ledger

The ledger is the canonical source of truth for benchmark outcomes and claim status.

Every experiment entry should include:

- `id`
- `date`
- `corpus`
- `method`
- `implementation_path`
- `baseline`
- `metrics`
- `result_label`
- `claim_supported`
- `claim_not_supported`
- `artifacts`
- `notes`
- `next_action`

Rules:

- Add a ledger entry for every meaningful benchmark run or interpretation change.
- Keep raw JSON artifacts in `bench/`.
- Prefer dated JSON snapshots for meaningful runs so `latest` reports can move without erasing evidence history.
- Do not promote a claim into `proofs/` without a matching ledger entry.
- Failures stay in the ledger even if the implementation changes later.
- If a report has `evidenceAssessment`, the ledger label must agree with it or explain why it differs.

Helper command:

```bash
npm run ledger:from-report -- --report ./bench/latest-report.json --title "Sample Baseline"
```

This generates a draft ledger entry in `docs/ledger/`. It does not replace human review. You still need to tighten:

- `method`
- `claim_supported`
- `claim_not_supported`
- `notes`
- `next_action`
