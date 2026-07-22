# EXP-2026-07-17-001 V30 Commercial Token-Reduction Baseline

## Purpose

Create a local commercial-baseline proof for the current 16xVS fold path against practical token-reduction targets.

## Changes

- Added `proof:commercial:v30`.
- Added commercial baseline math for `2x`, `10x`, `20x`, and the non-apples-to-apples `226x` query-aware extraction demo.
- Added a deterministic `100` entry fixture with every entry in the `200-240` BPE token band.
- Added a `100/100` correctness gate where the folded signature must retrieve the correct source group and no outside group may tie or beat it.
- Added compression gates for `P0 <=20`, `P1 <=10`, and `P2 ==1` equivalent output tokens.
- Counted residual and cold-path tokens against the compression ratio.

## Read

V30 locally proves the current controlled fixture can hit `1` equivalent 16xVS token per entry with `100/100` source-group retrieval. This beats the commercial-safe `10x` and aggressive `20x` targets on the controlled fixture.

The `226x` reference remains separated because it is a query-aware extraction demo, not a full meaning-preserving compression baseline. A `220 -> 1` result is `220x`; to strictly beat `226x`, the source must be at least `227` BPE tokens for one output token, or `249` BPE tokens for `10%` better.

## Claims Not Allowed

- Broad tokenizer superiority.
- Production runtime readiness.
- Lossless or reversible unfolding.
- General quote, blind-holdout, or stress-suite repair.
- Commercial API parity against any third-party compressor without direct independent testing.
- Beating the `226x` query-aware demo when the source average is below `227` BPE tokens.

## Reproduce

```powershell
npm test
npm run proof:commercial:v30
```
