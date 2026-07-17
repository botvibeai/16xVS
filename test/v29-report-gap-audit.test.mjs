import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  REQUIRED_REPORT_SECTION_IDS,
  V29_CLAIM_STATUSES,
  buildV29GapAudit,
  classifyReportClaims,
  extractReportSections,
  normalizeReportText,
} from "../core/v29-report-gap-audit.mjs";

const reportPath = "C:\\Users\\BotVi\\Downloads\\16xVS 6-13-2026.md";

async function loadReport() {
  return await readFile(reportPath, "utf8");
}

test("V29 auditor detects all required report sections from the full report", async () => {
  const normalized = normalizeReportText(await loadReport());
  const sections = extractReportSections(normalized);

  assert.deepEqual(sections.missingSectionIds, []);
  assert.deepEqual(
    sections.detectedSectionIds.sort(),
    REQUIRED_REPORT_SECTION_IDS.slice().sort()
  );
  assert.equal(sections.architectureItems.length, 10);
});

test("V29 claim classification keeps V28-covered items out of production-proven", async () => {
  const claims = classifyReportClaims(normalizeReportText(await loadReport()));
  const localOnlyIds = [
    "hard-route-gating",
    "lane-ownership-policies",
    "ste-temperature-decay",
    "cold-path-fallback",
  ];

  for (const id of localOnlyIds) {
    const claim = claims.find((item) => item.id === id);
    assert.ok(claim, `missing claim ${id}`);
    assert.equal(claim.status, V29_CLAIM_STATUSES.LOCAL_PROOF_ONLY);
    assert.notEqual(claim.status, V29_CLAIM_STATUSES.PROVEN);
    assert.match(claim.currentEvidence, /V27|V28/);
  }
});

test("V29 blocks unsupported strategic claims from proven or directional status", async () => {
  const audit = buildV29GapAudit({
    rawText: await loadReport(),
    sourcePath: reportPath,
    generatedAt: "2026-06-18T00:00:00.000Z",
  });
  const forbiddenStatuses = new Set([
    V29_CLAIM_STATUSES.PROVEN,
    V29_CLAIM_STATUSES.DIRECTIONAL,
  ]);

  assert.equal(audit.source.rawSha256.length, 64);
  assert.ok(audit.claimsNotAllowed.length >= 6);
  for (const claim of audit.claimsNotAllowed) {
    assert.equal(claim.allowed, false);
    assert.equal(forbiddenStatuses.has(claim.status), false, claim.id);
  }
});

test("V29 deferred layers include explicit next-proof requirements", async () => {
  const claims = classifyReportClaims(normalizeReportText(await loadReport()));
  const deferredIds = [
    "wasm-simd-hamming",
    "zero-copy-typedarray",
    "durable-object-sharding",
    "matryoshka-compaction",
    "h-mhsa",
    "qjl-error-correction",
    "bart-preprocessing",
    "tokentax0-normalizer",
  ];

  for (const id of deferredIds) {
    const claim = claims.find((item) => item.id === id);
    assert.ok(claim, `missing claim ${id}`);
    assert.equal(claim.status, V29_CLAIM_STATUSES.DEFERRED);
    assert.match(claim.nextProofRequired, /\S/);
  }
});
