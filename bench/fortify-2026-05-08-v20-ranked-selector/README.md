# V20 Ranked Selector Fortify Pass

- `date`: `2026-05-08`
- `policy`: `ranked-accepted-head`
- `baseline`: `v19-lock`
- `purpose`: Test whether choosing the best passing full-ranked head improves outward cases without destabilizing the locked v19 cases.

## Results

| Case | Route | Selected Head | Min Margin | Collapse | Avg Patches | Read |
| --- | --- | --- | ---: | --- | ---: | --- |
| `book-root` | `bookRoot` | `bookRoot` | `8` | false | `3` | preserves v19 |
| `governance-adversarial` | `governance` | `governance` | `3.5` | false | `2.8333` | preserves v19 |
| `archive-pressure` | `archive` | `governance` | `8` | false | `3` | preserves v19 |
| `booklike` | `default` | `default` | `-18.5` | false | `3` | unresolved failure preserved |
| `mega-book-ladder` | `bookRoot` | `default` | `31` | false | `2.9167` | preserves v19 fallback safety |
| `paraphrase-holdout` | `archive` | `bookRoot` | `17.2` | false | `1` | improves over v19 selected margin `7.4` |
| `multilingual-longform` | `default` | `default` | `38.5` | false | `3` | stable |
| `blind-holdout` | `default` | `default` | `-15.5` | false | `1` | still fails production generalization |
| `stress-100` | `default` | `default` | `-28.6444` | false | `1` | still fails production generalization |

## Read

The ranked selector is a useful v20 candidate because it improves the paraphrase route-selection miss without breaking the locked primary cases. It is not a new production lock because `booklike`, `blind-holdout`, and `stress-100` remain negative.

## Artifacts

- [book-root](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v20-ranked-selector\book-root-v20-ranked-selector.json)
- [governance-adversarial](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v20-ranked-selector\governance-adversarial-v20-ranked-selector.json)
- [archive-pressure](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v20-ranked-selector\archive-pressure-v20-ranked-selector.json)
- [booklike](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v20-ranked-selector\booklike-v20-ranked-selector.json)
- [mega-book-ladder](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v20-ranked-selector\mega-book-ladder-v20-ranked-selector.json)
- [paraphrase-holdout](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v20-ranked-selector\paraphrase-holdout-v20-ranked-selector.json)
- [multilingual-longform](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v20-ranked-selector\multilingual-longform-v20-ranked-selector.json)
- [blind-holdout](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v20-ranked-selector\blind-holdout-v20-ranked-selector.json)
- [stress-100](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-08-v20-ranked-selector\stress-100-v20-ranked-selector.json)
