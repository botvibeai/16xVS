# 16xVS Complete Production System Audit

Date: 2026-07-22

Source test prompt: founder-provided `Complete Production System Audit.pdf`

Scope: safe local repository audit for `16xVS-github`. No deploys, pushes, destructive operations, production writes, live R2 mutations, or cleanup commands were run.

## A. Executive Summary

Overall readiness status: READY WITH DOCUMENTED LIMITATIONS for a staged Worker deployment and public preview. NOT READY FOR FULL PRODUCTION LAUNCH until the remaining live-infrastructure gates are closed.

Release recommendation:

- Proceed to a staging/testing Worker deployment after owner approval.
- Do not declare full production readiness until live `16xVS.com` points at this package, Cloudflare WAF/rate limits are configured, admin secrets are installed, and R2 restore/readback is verified.

Issue counts:

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 1 |
| Medium | 4 |
| Low | 3 |
| Informational | 5 |

Repairs made during this audit: 0 code repairs. This was an audit execution pass. Earlier hardening already present in the working tree was verified.

Largest unresolved risks:

- `16xVS.com` live site is not yet verified as serving this Worker/site package.
- Production rate limiting/WAF/bot controls were not verified live.
- `ADMIN_API_TOKEN` Worker secret was not installed or verified.
- R2 object-level backup/restore readback was not executed in this pass.
- Local `node_modules` is a junction/symlink to a sibling checkout, which makes local dependency-tree inspection noisy.

## B. System Inventory

Application: `16xvs-poc`

Purpose:

- Cloudflare Worker proof package for 16xVS public demo, POC glyph catalog, V30 commercial baseline, and V31-V33 local test harnesses.

Runtime:

- Node local test runtime: `v24.14.1`
- Wrangler: `4.77.0`
- Worker compatibility date: `2026-04-09`

Package manager:

- npm with `package-lock.json`

Frontend:

- Static assets under `assets/`
- Public pages:
  - `/`
  - `/live-compression-lab/`
  - `/llm-token-saving-calculator/`
  - `/proof/`
  - `/poc/`
  - `/hindi/`
  - `/russian/`
  - `/arabic/`

Worker/API routes:

| Route | Method | Purpose | Public Status |
| --- | --- | --- | --- |
| `/api/health` | GET | Catalog health | Public read |
| `/api/lab/counters` | GET | Public aggregate demo counters | Public read |
| `/api/lab/analyze` | POST | Public no-storage compression estimate | Public write to aggregate only |
| `/api/library` | GET | POC catalog records | Admin-gated in production |
| `/api/tokenize` | POST | POC glyph/token payload | Admin-gated in production |
| `/api/ingest` | POST | POC ingest with R2 quorum | Admin-gated in production |
| `/api/ingest-batch` | POST | POC batch ingest | Admin-gated in production |
| `/api/search` | POST | POC exact/near search | Admin-gated in production |
| `/api/repair` | POST | POC repair metadata | Admin-gated in production |

Cloudflare resources in config:

| Config | Worker | Role | Data Stack | R2 Buckets |
| --- | --- | --- | --- | --- |
| `wrangler.jsonc` | `16xvs-poc` | primary | production | `16xvs-poc-live`, `16xvs-poc-fallback`, `16xvs-poc-vault` |
| `wrangler.secondary.jsonc` | `16xvs-poc-secondary` | secondary | production | `16xvs-poc-live`, `16xvs-poc-fallback`, `16xvs-poc-vault` |
| `wrangler.testing.jsonc` | `16xvs-poc-testing` | testing | testing | `16xvs-poc-testing-live`, `16xvs-poc-testing-fallback`, `16xvs-poc-testing-vault` |

Durable Objects:

- `GLYPH_CATALOG` bound to `GlyphCatalog`

Storage:

- R2 live/fallback/vault tiers
- Durable Object SQLite-backed state for hot catalog

Payments:

- None found.

Authentication:

- No user account system.
- Production POC endpoints require `ADMIN_API_TOKEN` or `ENABLE_PUBLIC_POC=true`.

AI providers:

- No external AI provider is called by the public lab.
- BART sidecar exists as a V31 test script only.

## C. Commands Executed

| Command | Result |
| --- | --- |
| PDF metadata via bundled `pdfinfo.exe` | 47 pages, not encrypted, no JavaScript |
| PDF text extraction via bundled Python + `pypdf` | Extracted to `_tmp/complete-production-system-audit-extracted.txt` |
| `git status --short --branch` | Working tree has expected uncommitted site/V33 changes and audit temp files |
| `rg --files` inventory | Completed; repo contains assets, core, scripts, tests, docs, bench artifacts |
| TODO/debug keyword scan | Completed; material hits were placeholders in UI, test fixtures, scripts, and historical bench fixtures |
| Redacted secret scan on launch/source/config paths | One false-positive test fixture: `api_key = secret_token_value`; no real secret pattern found in launch/source/config scope |
| `npm audit --omit=dev --json` | Passed; 0 vulnerabilities |
| `npm ls --all --omit=dev` | Failed due local `node_modules` junction/symlink and extraneous sibling packages; see issue `MED-001` |
| `node --check src/index.js assets/site.js assets/app.js selected scripts` | Passed |
| `npx wrangler deploy -c wrangler.jsonc --dry-run` | Passed; no deploy; primary bindings verified |
| `npx wrangler deploy -c wrangler.secondary.jsonc --dry-run` | Passed; no deploy; secondary bindings verified |
| `npx wrangler deploy -c wrangler.testing.jsonc --dry-run` | Passed; no deploy; testing bindings verified |
| First `npm test` audit run | Timed out at 7 minutes before output |
| Second `npm test` audit run with longer timeout | Passed 105/105 |
| Local public lab micro-load script, 1,000 analyzer calls | Passed 1,000/1,000; p50 0.8442 ms, p95 1.4256 ms, p99 2.8546 ms, max 12.1095 ms |

## D. Test Results

| Test Area | Tests Run | Passed | Failed | Blocked | Evidence |
| --- | ---: | ---: | ---: | ---: | --- |
| Unit/integration suite | 105 | 105 | 0 | 0 | `npm test` second run |
| Public site/security tests | 13 | 13 | 0 | 0 | Included in `npm test` |
| Syntax checks | 5 selected files | 5 | 0 | 0 | `node --check` |
| Dependency vulnerability audit | npm production audit | 1 | 0 | 0 | 0 vulnerabilities |
| Wrangler primary dry-run | 1 | 1 | 0 | 0 | Upload package 36.81 KiB, bindings shown |
| Wrangler secondary dry-run | 1 | 1 | 0 | 0 | Upload package 36.81 KiB, bindings shown |
| Wrangler testing dry-run | 1 | 1 | 0 | 0 | Testing buckets shown |
| Secret scan | launch/source/config scope | 1 | 0 | 0 | Only false-positive fixture |
| Local micro-load | 1,000 analyzer runs | 1,000 | 0 | 0 | p95 1.4256 ms |
| Live production browser verification | 0 | 0 | 0 | 1 | Current live `https://16xvs.com/` redirects to external Leap staging site, not this package |
| Live Cloudflare WAF/rate limit verification | 0 | 0 | 0 | 1 | Requires Cloudflare dashboard/API approval |
| Live R2 restore/readback | 0 | 0 | 0 | 1 | Requires approved R2 read/write validation |

## E. Issue Register

| ID | Severity | Component | Problem | Root Cause | Repair Status |
| --- | --- | --- | --- | --- | --- |
| HIGH-001 | High | Production launch | Live `16xVS.com` was not verified as serving this Worker/site package. | Domain currently redirects to a Leap staging URL; local package not deployed in this audit. | Remaining. Must deploy/route only after approval. |
| MED-001 | Medium | Local dependency environment | `npm ls --all --omit=dev` fails because local `node_modules` is a junction/symlink to sibling `16xvs-poc` modules with extraneous packages. | Local dev environment shares dependencies outside this checkout. | Remaining. Not committed, but should be cleaned with a fresh install before release packaging. |
| MED-002 | Medium | Abuse resistance | Production WAF, bot rules, and API rate limits were not live-verified. | Cloudflare control-plane changes require explicit approval and were not performed. | Remaining. |
| MED-003 | Medium | Admin protection | Production POC endpoints are code-gated, but `ADMIN_API_TOKEN` was not installed/verified as a Worker secret. | Secret management is outside repo and was not changed. | Remaining. |
| MED-004 | Medium | Disaster recovery | Live R2 restore/readback and vault recovery were not verified in this audit. | Avoided live Cloudflare storage writes/reads without explicit approval. | Remaining. |
| LOW-001 | Low | Audit temp files | `.audit-public-lab-load.mjs` and extracted PDF text were created as audit artifacts. | No-delete rule; files left in place. | Remaining by design. |
| LOW-002 | Low | Wrangler version | Wrangler reports update available from `4.77.0` to `4.113.0`. | Current dependency pins `4.77.0`. | Remaining; update only after controlled test. |
| LOW-003 | Low | Public copy | Historical proof docs mention unsupported claims only as unsupported, not as marketing claims. | Evidence-bound docs preserve claim boundaries. | Accepted; continue monitoring public-facing copy. |

## F. Security Findings

Verified protections:

- Security headers are present in Worker responses:
  - Content-Security-Policy
  - Strict-Transport-Security
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
  - Permissions-Policy
- Browser bundle does not expose local proof estimator fallback.
- CORS allows `https://16xvs.com` and blocks hostile origins in tests.
- Sensitive repo paths are blocked before asset serving:
  - `/src/`
  - `/core/`
  - `/bench/`
  - `/data/`
  - `/scripts/`
  - `/test/`
  - `.git`
  - Wrangler/package files
- Public lab reports `storedPrompt: false`.
- POC mutation/search endpoints are production-gated.
- Secret scan found no real secrets in launch/source/config scope.

Attacks attempted locally:

| Attack | Outcome |
| --- | --- |
| Hostile CORS origin preflight | Blocked with 403 and no reflected hostile origin |
| Production `/api/ingest` without admin token | Blocked with 403 |
| Static fetch for `/core/v33-707-hammer.mjs` | 404 |
| Static fetch for `/src/index.js` | 404 |
| Secret-like prompt in public lab | Residual safety token added; confidence guarded |

Remaining security risks:

- No live WAF/rate-limit verification yet.
- No live admin secret verification yet.
- No live penetration/browser test against the final deployed Worker route yet.

## G. Performance Results

Local micro-load results for `analyzePublicCompression`:

| Metric | Result |
| --- | ---: |
| Runs | 1,000 |
| Failures | 0 |
| p50 | 0.8442 ms |
| p95 | 1.4256 ms |
| p99 | 2.8546 ms |
| Max | 12.1095 ms |

Interpretation:

- Local CPU-only analyzer path is fast.
- This does not prove Cloudflare Worker latency, DO contention, R2 latency, or global edge performance.

## H. Load-Test Results

Safe local-only load was run against the analyzer function, not live Cloudflare.

Blocked:

- Live load/stress/spike/soak testing was not run. It requires approved staging Worker target and explicit rate/cost limits.

## I. Accessibility Results

Automated accessibility tooling was not available in this pass.

Manual/static checks performed through file inspection and tests:

- Pages use semantic headings/sections.
- Buttons are real buttons for lab actions.
- Links are normal anchors.
- Arabic page declares `lang="ar" dir="rtl"`.
- Mobile responsive CSS exists for key grid layouts.

Remaining:

- Run browser-based keyboard navigation and axe/Lighthouse against deployed staging.
- Verify contrast and focus states visually on desktop and mobile.

## J. Database and Migration Results

Database/storage model:

- Durable Object SQLite-backed state through `new_sqlite_classes`.
- R2 live/fallback/vault copies for persisted token records.

Verified locally:

- Tests cover R2 fallback rebuilding records from live storage.
- Tests cover quorum behavior across live/fallback/vault.
- Wrangler dry-runs show correct Durable Object and R2 bindings.

Not verified:

- Live Durable Object migration from clean account state.
- Live R2 write/read/delete rollback behavior.
- Live vault restore in isolated environment.

## K. Billing Results

No billing, Stripe, subscription, entitlement, cancellation, or webhook billing flow exists in this repo.

Status: Not applicable.

## L. AI and Generated-File Results

AI/model integrations:

- Public lab uses local deterministic estimator only.
- No external AI provider call is made by public route.
- V31 BART sidecar exists as optional testing script only; not production dependency.

Generated-file/proof claims:

- Tests enforce no unsupported public marketing claim like `700 to 1`, `48,000x`, or `universal tokenizer replacement`.
- Proof docs explicitly label `99.99%` and `1.25 GB` style claims as unsupported/not yet allowed.

## M. Cloudflare Infrastructure Results

Dry-run package checks:

- Primary Worker dry-run passed.
- Secondary Worker dry-run passed.
- Testing Worker dry-run passed.
- Testing buckets are isolated from production buckets.
- Primary and secondary share production bucket stack as intended.

Blocked:

- No deployment.
- No live route verification against deployed Worker.
- No live R2 readback/restore.
- No WAF/rate-limit dashboard changes.

## N. Files Changed

Audit-created files:

| Path | Reason | Risk | Tests |
| --- | --- | --- | --- |
| `_tmp/complete-production-system-audit-extracted.txt` | Extract PDF prompt for reliable local reading | Low; local audit artifact | PDF extraction completed |
| `.audit-public-lab-load.mjs` | Local micro-load script | Low; untracked audit artifact | Ran 1,000 calls successfully |
| `docs/audits/2026-07-22-complete-production-system-audit.md` | This audit report | Low; documentation only | N/A |

No code repair was made during this audit pass.

## O. Remaining Risks

- Current public domain was not switched to or verified against this Worker package.
- Live Cloudflare security controls remain unverified.
- Fresh dependency install from a clean checkout was not performed.
- Browser visual/accessibility testing against deployed staging was not performed.
- Live backup/restore was not performed.
- Production admin secret was not installed.
- No production monitoring alert policy was verified.

## P. Deployment Checklist

Pre-deployment:

1. Create or verify fresh off-machine backup of repo and V30/V33 proof artifacts.
2. Create a fresh clean checkout and run `npm ci`.
3. Run `npm audit --omit=dev`.
4. Run `npm test`.
5. Run all three Wrangler dry-runs.
6. Confirm `ADMIN_API_TOKEN` is set as a Worker secret for primary and secondary.
7. Configure Cloudflare WAF/rate limits/bot protection for public lab endpoints.
8. Confirm no public route exposes repo internals.

Deployment:

1. Deploy testing Worker first.
2. Verify `/`, `/live-compression-lab/`, `/hindi/`, `/russian/`, `/arabic/`, `/proof/`.
3. Run public lab with safe samples only.
4. Verify old POC endpoints return 403 without admin token.
5. Verify admin-only endpoints work only with admin token.
6. Deploy secondary.
7. Deploy primary.
8. Point `16xVS.com` only after primary/secondary pass verification.

Post-deployment:

1. Run browser smoke tests on desktop and mobile.
2. Run header checks.
3. Run CORS checks.
4. Run controlled low-rate load test.
5. Run R2 object readback and restore drill in testing stack.
6. Monitor logs for 24 hours.

Rollback:

1. Repoint route to previous Worker or Leap page.
2. Disable public lab route if abuse starts.
3. Keep R2 buckets untouched during rollback.
4. Preserve logs and audit evidence.

## Q. Final Certification

Conclusive verified:

- Local test suite passes 105/105.
- Public lab security tests pass.
- Production POC endpoints are code-gated.
- CORS hostile-origin reflection is blocked in tests.
- Security headers are present in tested responses.
- Sensitive source/repo paths are blocked in tests.
- Production, secondary, and testing Worker configs package successfully in Wrangler dry-run.
- Dependency vulnerability audit reports 0 vulnerabilities.

Repaired:

- No new repairs during this audit pass. Existing hardening was verified.

Uncertain:

- Whether live `16xVS.com` serves this package.
- Live Cloudflare WAF/rate-limit behavior.
- Live admin secret behavior.
- Live R2 backup/restore behavior.
- Deployed browser accessibility and mobile behavior.

Recommendation:

- Do not call the whole system production-ready yet.
- It is ready for controlled staging/testing deployment after owner approval.
- Full production launch should wait for the remaining live gates above.
