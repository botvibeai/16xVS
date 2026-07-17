# Evidence Map

Date: `2026-05-26`

## Baseline Package

| Evidence | What It Shows | Link |
| --- | --- | --- |
| Fresh V23 founder proof package | Current fresh rebuild of the locked V23 proof package | [README](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-26-181831302z-v23-founder-proof-2026-05-26\README.md) |
| Fresh V23 founder summary JSON | Machine-readable fresh gate results | [summary.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-26-181831302z-v23-founder-proof-2026-05-26\summary.json) |
| V23 proof package | Current locked proof baseline | [README](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\README.md) |
| V23 summary JSON | Machine-readable gate results | [summary.json](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\summary.json) |
| V23 ledger | Human-readable proof history | [ledger](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\ledger\2026-05-16-v23-four-head-proof-package.md) |

## Current Primary Passes

| Case | Status | Evidence |
| --- | --- | --- |
| `book-root` | pass, `8` margin, `3` avg patches | [report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\reports\book-root-v23-four-head-ranked.json) |
| `governance-adversarial` | pass, `3.5` margin, `2.8333` avg patches | [report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\reports\governance-adversarial-v23-four-head-ranked.json) |
| `archive-pressure` | pass, `8` margin, `3` avg patches | [report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\reports\archive-pressure-v23-four-head-ranked.json) |
| `booklike` | pass, `7.5` margin, `3` avg patches | [report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\reports\booklike-v23-four-head-ranked.json) |
| `mega-book-ladder` | pass, `31` margin, `2.9167` avg patches | [report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\reports\mega-book-ladder-v23-four-head-ranked.json) |

## Current Failures

| Case | Status | Evidence |
| --- | --- | --- |
| `blind-holdout` | fail, `-15.5` margin | [report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\reports\blind-holdout-v23-four-head-ranked.json) |
| `stress-100` | fail, `-28.6444` margin | [report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\reports\stress-100-v23-four-head-ranked.json) |
| `quote` | fail, `-18.2` margin under V23, best repair `-10.8` under V26 | [V26 summary](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-25-v26-split-hard-negative-repair\README.md) |
| `quote-paragraph` | fail, V24 remains best at `-10.3333` | [V24 ledger](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\ledger\2026-05-16-v24-quote-repair-probe.md) |

## Repair Probe History

| Probe | Result | Link |
| --- | --- | --- |
| V24 quote repair | quote and quote-paragraph improve but remain negative | [ledger](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\ledger\2026-05-16-v24-quote-repair-probe.md) |
| V25 hard-negative repair | stress improves, quote/blind worsen, not baseline | [ledger](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\ledger\2026-05-20-v25-hard-negative-repair-probe.md) |
| V26 split repair | quote improves slightly, route leakage appears, not baseline | [ledger](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\ledger\2026-05-25-v26-split-hard-negative-repair-probe.md) |

## Claim Boundary

Allowed:

- V23 is a reproducible directional specialist proof.
- Primary controlled lanes pass together under V23.
- Blind/stress/quote remain unresolved.
- Route-gated repair is the next research direction.

Not allowed:

- production tokenizer claim
- broad superiority over BPE/current tokenizers
- blind-generalization proof
- `99.99%` raw-source reduction claim
- `1.25 GB` corpus-collapse claim
