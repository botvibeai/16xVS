# Reproduce The Current Proof

Date: `2026-05-26`

Run from:

```powershell
cd "."
```

## Minimum Verification

```powershell
npm test
```

Expected:

- unit tests pass
- no deployment occurs
- no Cloudflare changes occur

## Rebuild The V23 Proof Package

```powershell
npm run proof:package:v23 -- --label v23-founder-proof-2026-05-26
```

This rebuilds:

- primary gates
- blind/stress gates
- extra controlled surfaces
- full-head ranking
- summary JSON
- README

The command creates a new folder under:

```powershell
bench\proof-locks\
```

## Review The Current Locked V23 Package

Fresh package from this review pass:

```powershell
Get-Content ".\bench\proof-locks\2026-05-26-181831302z-v23-founder-proof-2026-05-26\README.md"
```

Fresh machine-readable summary:

```powershell
Get-Content ".\bench\proof-locks\2026-05-26-181831302z-v23-founder-proof-2026-05-26\summary.json"
```

Original May 16 lock:

```powershell
Get-Content ".\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\README.md"
```

Machine-readable summary:

```powershell
Get-Content ".\bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\summary.json"
```

## Optional Repair Probe Reproduction

V24 quote repair has a spec-generation script and preserved ledger artifacts, but no single full-package npm command like V25/V26:

```powershell
npm run training:spec:v24
```

Review the preserved V24 evidence:

```powershell
Get-Content ".\docs\ledger\2026-05-16-v24-quote-repair-probe.md"
```

V25 hard-negative repair:

```powershell
npm run proof:probe:v25
```

V26 split hard-negative repair:

```powershell
npm run proof:probe:v26
```

Use these as research probes only. They are not promoted baselines.

## No Deployments

These proof commands do not deploy Cloudflare Workers.

Do not run:

```powershell
npm run deploy
```

unless the founder explicitly asks for a Worker deployment.

## Evidence Files

- [V23 package README](bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\README.md)
- [V23 package summary](bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\summary.json)
- [Fresh V23 founder package README](bench\proof-locks\2026-05-26-181831302z-v23-founder-proof-2026-05-26\README.md)
- [Fresh V23 founder package summary](bench\proof-locks\2026-05-26-181831302z-v23-founder-proof-2026-05-26\summary.json)
- [Founder proof package README](docs\proofs\founder-proof-package-2026-05-26\README.md)
