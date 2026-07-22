# EXP-2026-05-25-001 V26 Split Hard-Negative Repair Probe

- `id`: `EXP-2026-05-25-001`
- `date`: `2026-05-25`
- `purpose`: Test whether the v25 failure came from mixing quote, blind, and stress repair pressure into one head.
- `implementation_path`: `v26-split-hard-negative-repair`
- `baseline`: `v23 four-head proof package`
- `status`: `negative-or-mixed-probe`

## Method

- Kept `v23` as the locked proof baseline.
- Split the mined hard-negative repair into three focused heads:
  - `quoteSplitV26` for quote and quote-paragraph failures.
  - `blindSplitV26` for blind-holdout failures.
  - `stressSplitV26` for stress-100 failures.
- Kept `quoteRepair` v24 in the ranked set for comparison.
- Tested the new heads as single heads on their intended target surfaces.
- Tested all heads together in an eight-head ranked probe.
- Did not deploy Workers, change Cloudflare, or change production API behavior.

## Split Specs

| Probe | Head | Base Spec | Explicit Negatives | Mined Groups |
| --- | --- | --- | ---: | ---: |
| `quote-split` | `quoteSplitV26` | `v24 quote repair` | `17` | `10` |
| `blind-split` | `blindSplitV26` | `v13 balanced triad` | `8` | `5` |
| `stress-split` | `stressSplitV26` | `v13 balanced triad` | `9` | `5` |

## Target Gates

| Case | Target Head | Previous Best | Single Margin | Best Ranked Head | Best Ranked Margin | Selected Head | Selected Margin | Result |
| --- | --- | ---: | ---: | --- | ---: | --- | ---: | --- |
| `quote` | `quoteSplitV26` | `-12.8` | `-10.8` | `quoteSplitV26` | `-10.8` | `default` | `-18.2` | fail |
| `quote-paragraph` | `quoteSplitV26` | `-10.3333` | `-15` | `quoteRepair` | `-10.3333` | `governance` | `-20.25` | fail |
| `blind-holdout` | `blindSplitV26` | `-14.6667` | `-17.5` | `quoteSplitV26` | `-13.5833` | `default` | `-15.5` | fail |
| `stress-100` | `stressSplitV26` | `-24.0667` | `-26.8111` | `blindSplitV26` | `-25.8889` | `default` | `-28.6444` | fail |

## Primary Lane Stability

| Case | Selected Head | Min Margin | Avg Patches | Result |
| --- | --- | ---: | ---: | --- |
| `book-root` | `bookRoot` | `8` | `3` | pass |
| `governance-adversarial` | `stressSplitV26` | `4.5` | `2.8333` | fail, selected wrong lane |
| `archive-pressure` | `governance` | `8` | `3` | pass |
| `booklike` | `booklikeRepair` | `7.5` | `3` | pass |
| `mega-book-ladder` | `default` | `31` | `2.9167` | pass |

## Claim Supported

- Splitting repair pressure helps the direct quote target: quote improves from the v24 quoteRepair margin `-12.8` to `-10.8`.
- The quote split does not help quote-paragraph; v24 quoteRepair remains better on quote-paragraph at `-10.3333`.
- The blind and stress focused heads do not solve their intended targets.
- The eight-head ranked run exposes route leakage: `stressSplitV26` beats the governance head on governance-adversarial and becomes selected, which breaks strict v23 baseline preservation even though the selected semantic margin is positive.

## Claim Not Supported

- V26 is not a new baseline.
- V26 does not clear quote, quote-paragraph, blind-holdout, or stress-100.
- V26 does not preserve the v23 primary lanes under unrestricted ranked selection.
- Split hard-negative mining alone is not enough to solve the remaining quote/blind/stress semantic wall.
- This does not support production-proof, broad tokenizer-superiority, `99.99%`, or `1.25 GB` claims.

## Artifacts

- [v26 probe summary](bench\fortify-2026-05-25-v26-split-hard-negative-repair\README.md)
- [v26 summary json](bench\fortify-2026-05-25-v26-split-hard-negative-repair\summary.json)
- [v26 split probe builder](scripts\build-v26-split-hard-negative-probe.mjs)
- [v26 split plan](core\v26-split-repair-probe.mjs)
- [quote split model](models\learned-hybrid-prototype-v26-quote-split-repair-hierarchical-packer-v2.json)
- [blind split model](models\learned-hybrid-prototype-v26-blind-split-repair-hierarchical-packer-v2.json)
- [stress split model](models\learned-hybrid-prototype-v26-stress-split-repair-hierarchical-packer-v2.json)
