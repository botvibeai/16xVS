# V31 BART Sidecar Safety Report

- generatedAt: `2026-07-21T05:38:17.875Z`
- model: `@cf/facebook/bart-large-cnn`
- executed: `false`
- noExternalCalls: `true`
- testingOnlyOk: `true`
- ok: `true`

## Read

Sidecar is adapter-ready but does not call Workers AI by default. Live calls require separate explicit approval and must route only through the testing Worker.

This command is intentionally testing-only and no-external-call by default.

