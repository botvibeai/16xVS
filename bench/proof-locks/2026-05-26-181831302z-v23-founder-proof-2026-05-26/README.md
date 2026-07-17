# V23 Four-Head Ranked Proof Package

- label: `v23-founder-proof-2026-05-26`
- generatedAt: `2026-05-26T18:18:31.303Z`
- claimLevel: `directional-specialist-proof`

## Primary Gates

| Case | Gate | Selected Head | Min Margin | Collapse | Avg Patches |
| --- | --- | --- | ---: | --- | ---: |
| book-root | PASS | bookRoot | 8 | false | 3 |
| governance-adversarial | PASS | governance | 3.5 | false | 2.8333 |
| archive-pressure | PASS | governance | 8 | false | 3 |
| booklike | PASS | booklikeRepair | 7.5 | false | 3 |
| mega-book-ladder | PASS | default | 31 | false | 2.9167 |

## Blind/Stress Gates

| Case | Gate | Required For Production | Selected Head | Min Margin | Collapse | Avg Patches |
| --- | --- | --- | --- | ---: | --- | ---: |
| blind-holdout | FAIL | true | default | -15.5 | false | 1 |
| stress-100 | FAIL | true | default | -28.6444 | false | 1 |

Blind/stress gates are not required for the directional specialist proof. They are required before production-generalization claims.

## Extra Controlled Surfaces

| Case | Gate | Selected Head | Min Margin | Collapse | Avg Patches |
| --- | --- | --- | ---: | --- | ---: |
| code-domain | PASS | governance | 30.5 | false | 1 |
| paraphrase-holdout | PASS | bookRoot | 17.2 | false | 1 |
| multilingual-longform | PASS | default | 38.5 | false | 3 |
| phrase-semantic | PASS | bookRoot | 17 | false | 1 |
| multilingual-phrases | PASS | bookRoot | 2.8095 | false | 1 |
| protocol-longform | PASS | governance | 18.5 | false | 3 |
| quote | FAIL | default | -18.2 | false | 1 |
| quote-paragraph | FAIL | governance | -20.25 | false | 1 |

## Full Head Ranking

### book-root
| Rank | Head | Accepted | Role | Min Margin | Collapse | Avg Patches |
| ---: | --- | --- | --- | ---: | --- | ---: |
| 1 | bookRoot | true | candidate | 8 | false | 3 |
| 2 | default | false | fallback | -2.5 | false | 3 |
| 3 | governance | false | other | -3.5 | false | 3 |
| 4 | booklikeRepair | false | other | -13.5 | false | 3 |

### governance-adversarial
| Rank | Head | Accepted | Role | Min Margin | Collapse | Avg Patches |
| ---: | --- | --- | --- | ---: | --- | ---: |
| 1 | governance | true | candidate | 3.5 | false | 2.8333 |
| 2 | default | false | fallback | -1 | false | 2.8333 |
| 3 | booklikeRepair | false | other | -1.5 | false | 2.8333 |
| 4 | bookRoot | false | other | -31 | false | 2.8333 |

### archive-pressure
| Rank | Head | Accepted | Role | Min Margin | Collapse | Avg Patches |
| ---: | --- | --- | --- | ---: | --- | ---: |
| 1 | governance | true | candidate | 8 | false | 3 |
| 2 | default | true | fallback | 1.5 | false | 3 |
| 3 | booklikeRepair | true | other | 1 | false | 3 |
| 4 | bookRoot | false | other | -11 | false | 3 |

### booklike
| Rank | Head | Accepted | Role | Min Margin | Collapse | Avg Patches |
| ---: | --- | --- | --- | ---: | --- | ---: |
| 1 | booklikeRepair | true | other | 7.5 | false | 3 |
| 2 | governance | false | other | -12.5 | false | 3 |
| 3 | default | false | candidate | -18.5 | false | 3 |
| 4 | bookRoot | false | other | -23.5 | false | 3 |

### mega-book-ladder
| Rank | Head | Accepted | Role | Min Margin | Collapse | Avg Patches |
| ---: | --- | --- | --- | ---: | --- | ---: |
| 1 | default | true | fallback | 31 | false | 2.9167 |
| 2 | bookRoot | false | candidate | 33.0833 | true | 2.9167 |
| 3 | governance | false | other | 31.25 | true | 2.9167 |
| 4 | booklikeRepair | false | other | 28.1667 | true | 2.9167 |

## Claims Allowed

- The four-head ranked selector is a reproducible directional specialist proof.
- Book-root, governance, archive, old booklike, and mega-book ladder primary cases pass with compact fold shape.
- V22 is useful as a booklikeRepair specialist, not as a universal baseline.

## Claims Not Allowed

- Production router proof unless blind/stress generalization passes.
- Broad tokenizer superiority over current tokenizers.
- 99.99% raw-source reduction or Library of Congress to 1.25 GB claims.
- Quote and quote-paragraph semantic grouping unless those extra gates pass.

## Reports

- book-root: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/book-root-v23-four-head-ranked.json
- governance-adversarial: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/governance-adversarial-v23-four-head-ranked.json
- archive-pressure: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/archive-pressure-v23-four-head-ranked.json
- booklike: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/booklike-v23-four-head-ranked.json
- mega-book-ladder: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/mega-book-ladder-v23-four-head-ranked.json
- blind-holdout: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/blind-holdout-v23-four-head-ranked.json
- stress-100: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/stress-100-v23-four-head-ranked.json
- code-domain: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/code-domain-v23-four-head-ranked.json
- paraphrase-holdout: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/paraphrase-holdout-v23-four-head-ranked.json
- multilingual-longform: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/multilingual-longform-v23-four-head-ranked.json
- phrase-semantic: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/phrase-semantic-v23-four-head-ranked.json
- multilingual-phrases: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/multilingual-phrases-v23-four-head-ranked.json
- protocol-longform: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/protocol-longform-v23-four-head-ranked.json
- quote: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/quote-v23-four-head-ranked.json
- quote-paragraph: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/reports/quote-paragraph-v23-four-head-ranked.json

## Logs

- unit-tests: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/unit-tests.log
- primary-book-root: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/primary-book-root.log
- primary-governance-adversarial: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/primary-governance-adversarial.log
- primary-archive-pressure: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/primary-archive-pressure.log
- primary-booklike: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/primary-booklike.log
- primary-mega-book-ladder: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/primary-mega-book-ladder.log
- generalization-blind-holdout: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/generalization-blind-holdout.log
- generalization-stress-100: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/generalization-stress-100.log
- extra-code-domain: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/extra-code-domain.log
- extra-paraphrase-holdout: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/extra-paraphrase-holdout.log
- extra-multilingual-longform: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/extra-multilingual-longform.log
- extra-phrase-semantic: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/extra-phrase-semantic.log
- extra-multilingual-phrases: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/extra-multilingual-phrases.log
- extra-protocol-longform: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/extra-protocol-longform.log
- extra-quote: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/extra-quote.log
- extra-quote-paragraph: bench/proof-locks/2026-05-26-181831302z-v23-founder-proof-2026-05-26/logs/extra-quote-paragraph.log

