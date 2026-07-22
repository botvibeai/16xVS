# V33 Testing Worker 707x1000 Hammer

Generated: 2026-07-22T03:09:39.392Z

Claim level: `v33-testing-worker-707-1000-pass`

This suite ran through the isolated testing Worker endpoint only. It rejects production domains, primary Workers, secondary Workers, and non-testing hosts.

## Result

- Pass: `true`
- Worker: `https://16xvs-poc-testing.michael-38d.workers.dev`
- Completed runs: `1000/1000`
- Correct global ranking: `1000/1000`
- Tied or wrong: `0`
- Average source BPE: `755.81`
- Average equivalent 16xVS tokens: `1`
- Average compression ratio: `755.81x`
- Average reduction: `99.8677%`
- Minimum global own-vs-outside margin: `9`
- Cold-path count: `0`
- Residual count: `0`

## Language Probe Breakout

- english-control: `250/250`, min margin `15`, pass `true`
- hindi: `250/250`, min margin `9`, pass `true`
- russian: `250/250`, min margin `14`, pass `true`
- arabic: `250/250`, min margin `13`, pass `true`

## Modes

- language-equity-arabic
- language-equity-english-control
- language-equity-hindi
- language-equity-russian

## Boundary

This is still a testing-only 707 root-handle hammer. It does not prove broad tokenizer replacement, lossless unfolding, or book-to-one-token public claims.
