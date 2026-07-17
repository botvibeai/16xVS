# EXP-2026-05-11-001 V22 Four-Head Extra Sweep

- `id`: `EXP-2026-05-11-001`
- `date`: `2026-05-11`
- `purpose`: Test the v22 four-head ranked selector on additional labeled corpora beyond the primary proof-lock cases.
- `selection policy`: `ranked-accepted-head`

## Results

| Case | Selected Head | Min Margin | Avg Patches | Result |
| --- | --- | ---: | ---: | --- |
| `code-domain` | `governance` | `30.5` | `1` | pass |
| `paraphrase-holdout` | `bookRoot` | `17.2` | `1` | pass |
| `multilingual-longform` | `default` | `38.5` | `3` | pass |
| `phrase-semantic` | `bookRoot` | `17` | `1` | pass |
| `multilingual-phrases` | `bookRoot` | `2.8095` | `1` | pass |
| `protocol-longform` | `governance` | `18.5` | `3` | pass |
| `quote` | `default` | `-18.2` | `1` | fail |
| `quote-paragraph` | `governance` | `-20.25` | `1` | fail |

## Claim Supported

- The v22 fourth head does not destabilize the ranked selector on these additional labeled corpora.
- The ranked specialist architecture continues to outperform a single-head interpretation on several controlled surfaces.
- Code-domain, paraphrase, multilingual, phrase, and protocol-longform cases all remain positive under ranked selection.

## Claim Not Supported

- Quote and quote-paragraph semantic grouping remain unresolved.
- This sweep does not solve blind holdout or stress-100.
- This sweep does not prove production generalization or broad tokenizer superiority.

## Artifacts

- [extra sweep summary](bench\fortify-2026-05-11-v22-four-head-extra\README.md)
- [extra sweep reports](bench\fortify-2026-05-11-v22-four-head-extra)
