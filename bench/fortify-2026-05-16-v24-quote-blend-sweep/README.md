# V24 Quote Blend Sweep

- `date`: `2026-05-16`
- `purpose`: Check whether changing the heuristic blend weight can push v24 quote or quote-paragraph margins positive.
- `result`: No tested blend passes either target surface.

## Results

| Blend Variant | Quote Margin | Quote-Paragraph Margin | Read |
| --- | ---: | ---: | --- |
| `h0` | `-14.8` | `-13.5833` | fail |
| `h0p2` | `-12` | `-13.8333` | best quote, fail |
| `h0p4` | `-12.6` | `-9.5833` | best quote-paragraph, fail |
| `h0p6` | `-12.8` | `-10.3333` | base v24 setting, fail |
| `h0p8` | `-14.6` | `-14` | fail |
| `h1p0` | `-16.8` | `-17.1667` | fail |
| `h1p2` | `-16.6` | `-13.75` | fail |

## Read

The sweep confirms the remaining quote weakness is not solved by a simple blend-weight adjustment. Lower heuristic weight helps different quote surfaces, but every tested candidate remains below zero.

The best observed target margins were:

- `quote`: `-12` at `h0p2`
- `quote-paragraph`: `-9.5833` at `h0p4`

## Artifacts

- [blend sweep reports](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-16-v24-quote-blend-sweep)
- [h0p2 quote report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-16-v24-quote-blend-sweep\quote-v24-h0p2.json)
- [h0p4 quote-paragraph report](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\fortify-2026-05-16-v24-quote-blend-sweep\quote-paragraph-v24-h0p4.json)
