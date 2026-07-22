# V33 Testing Worker 707x1000 Hammer

Generated: 2026-07-22T02:53:21.525Z

Claim level: `v33-testing-worker-707-1000-pass`

This suite ran through the isolated testing Worker endpoint only. It rejects production domains, primary Workers, secondary Workers, and non-testing hosts.

## Result

- Pass: `true`
- Worker: `https://16xvs-poc-testing.michael-38d.workers.dev`
- Completed runs: `1000/1000`
- Correct global ranking: `1000/1000`
- Tied or wrong: `0`
- Average source BPE: `707.93`
- Average equivalent 16xVS tokens: `1`
- Average compression ratio: `707.93x`
- Average reduction: `99.8587%`
- Minimum global own-vs-outside margin: `3`
- Cold-path count: `0`
- Residual count: `0`

## Language Probe Breakout

- english-control: `900/900`, min margin `3`, pass `true`
- hindi: `25/25`, min margin `13`, pass `true`
- russian: `25/25`, min margin `14`, pass `true`
- arabic: `25/25`, min margin `12`, pass `true`
- japanese: `25/25`, min margin `12`, pass `true`

## Modes

- mixed-adversarial-sibling
- mixed-blind-holdout
- mixed-noisy-raw
- mixed-paraphrase
- mixed-route-confusion
- mutation-swarm
- route-noise-surge
- worker-causal-negation-shuffle
- worker-multilingual-anchor
- worker-punctuation-jitter

## Boundary

This is still a testing-only 707 root-handle hammer. It does not prove broad tokenizer replacement, lossless unfolding, or book-to-one-token public claims.
