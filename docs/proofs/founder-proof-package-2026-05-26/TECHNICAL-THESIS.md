# Current Technical Thesis

Date: `2026-05-26`

## Thesis

16xVS is currently best understood as a compact hierarchical representation plus routed specialist-head proof, not as a finished universal tokenizer.

The strongest working shape is:

```text
input corpus
  -> hierarchical packer
  -> compact visual/signature patches
  -> route classifier
  -> specialist semantic head
  -> validation/ranking gate
```

## What The Evidence Suggests

### 1. Fold shape is real enough to keep testing

The repo repeatedly preserves compact patch shape on controlled long-form and synthetic book-fold cases. V23 keeps primary long-form cases around `3` average patches per entry while preserving positive semantic margins on the locked primary lanes.

This does not prove the final extreme compression goal. It does show the fold direction is not random noise.

### 2. Specialist heads are currently stronger than one universal head

The strongest current proof uses multiple heads:

- `default`: v10 constrained merge
- `bookRoot`: v8 control bridge
- `governance`: v13 balanced triad
- `booklikeRepair`: v22 governance-evidence booklike repair

That combination passes the current primary lanes together. Single universal candidates repeatedly trade one success for another failure.

### 3. Route governance is now a first-class problem

V26 exposed a key issue: a repair head can score better on a lane it should not own. `stressSplitV26` beat the governance head on governance-adversarial and broke strict v23 lane preservation.

This means future repair heads need route gating. A quote/stress/blind repair head should not be allowed to steal governance, archive, book-root, or booklike lanes unless explicitly promoted through separate acceptance gates.

### 4. Hard-negative pressure alone is not enough

V25 used mined nearest-outside failures across quote, quote-paragraph, blind, and stress. It improved stress but worsened quote, quote-paragraph, and blind.

V26 split that pressure. Direct quote improved slightly, but no target cleared and route leakage appeared.

The next repair should be smaller and route-gated, not broader.

## Current Best Claim

The current best claim is:

> 16xVS has a reproducible directional specialist proof showing compact fold-preserving behavior across controlled primary lanes.

## Current Non-Claim

The current non-claim is:

> 16xVS is not yet proven as a production-grade general-purpose tokenizer replacement.

## Next Research Step

The next technical step should be `V27 route-gated repair`.

Design constraints:

- keep V23 locked
- do not let repair heads compete outside their allowed lanes
- quote repair competes only on quote and quote-paragraph surfaces
- blind repair competes only on blind-holdout surfaces
- stress repair competes only on stress surfaces
- primary lanes must remain selected by their V23 expected heads
- promotion requires positive margins and independent non-mined holdouts

## Decision

Package V23 now as the current proof baseline.

Keep V24, V25, and V26 as documented repair evidence.

Run V27 only in a sandbox after the proof package is clean.
