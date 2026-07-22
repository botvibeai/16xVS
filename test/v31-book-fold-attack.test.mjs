import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  V31_ATTACK_TARGETS,
  buildV31BartSidecarReport,
  buildV31BookFoldFixture,
  buildV31NoMarkerFixture,
  evaluateMeaningPurification,
  evaluateV31BookFold,
  evaluateV31NoMarkerSuite,
  runV31LocalAttack,
  validateV31TestingOnlyConfig,
} from "../core/v31-book-fold-attack.mjs";

const repoRoot = process.cwd();

async function readJson(file) {
  return JSON.parse(await readFile(path.join(repoRoot, file), "utf8"));
}

test("V31 no-marker fixtures hit 249 500 and 707 BPE bands without magic markers", () => {
  for (const targetBpe of V31_ATTACK_TARGETS) {
    const entries = buildV31NoMarkerFixture({ targetBpe });

    assert.equal(entries.length, 100);
    assert.equal(new Set(entries.map((entry) => entry.groupId)).size, 10);
    for (const entry of entries) {
      assert.ok(entry.bpeTokens >= targetBpe, `${entry.id} is under target`);
      assert.ok(entry.bpeTokens <= targetBpe + 16, `${entry.id} overshot target`);
      assert.equal(entry.magicMarkerFree, true);
      assert.doesNotMatch(entry.text, /\bv31\b|_kernel|group-|marker/i);
    }
  }
});

test("V31 local no-marker suites pass 100/100 root-handle retrieval at each target", () => {
  for (const targetBpe of V31_ATTACK_TARGETS) {
    const report = evaluateV31NoMarkerSuite({ targetBpe });

    assert.equal(report.summary.correct, 100);
    assert.equal(report.summary.total, 100);
    assert.equal(report.summary.tiedOrWrongCount, 0);
    assert.equal(report.summary.averageEquivalentOutputTokens, 1);
    assert.equal(report.summary.allMagicMarkerFree, true);
    assert.equal(report.summary.allRootHandleOnly, true);
    assert.equal(report.summary.passed, true);
  }
});

test("V31 sub-10000 token suites do not overclaim the 99.99 percent gate", () => {
  const report707 = evaluateV31NoMarkerSuite({ targetBpe: 707 });

  assert.equal(report707.summary.passed, true);
  assert.equal(report707.summary.ultraReductionPassed, false);
  assert.ok(report707.summary.averageReductionPercent < 99.99);
});

test("V31 book fold keeps parent nodes closer to own children and clears synthetic 99.99 gate", () => {
  const fixture = buildV31BookFoldFixture();
  const report = evaluateV31BookFold({ fixture });

  assert.equal(report.summary.allMarginsPositive, true);
  assert.ok(report.summary.minMargin > 0);
  assert.equal(report.summary.bookRootCount, 4);
  assert.ok(report.summary.minBookSourceBpe >= 10000);
  assert.equal(report.summary.ultraReductionPassed, true);
});

test("V31 meaning purification preserves required anchors and catches dropped negation", () => {
  const good = evaluateMeaningPurification();

  assert.equal(good.summary.localPurificationPassed, true);

  const bad = evaluateMeaningPurification({
    cases: [
      {
        id: "missing-negation",
        raw: "Nora said chapter 6 is not safe because route lineage number 17 matters.",
        purified: "Nora said chapter 6 is safe because route lineage number 17 matters.",
      },
    ],
  });

  assert.equal(bad.summary.localPurificationPassed, false);
  assert.deepEqual(bad.results[0].purified.missingAnchors, ["negation"]);
});

test("V31 Cloudflare sidecar validates testing-only config and rejects non-testing config", async () => {
  const testingConfig = await readJson("wrangler.testing.jsonc");
  const primaryConfig = await readJson("wrangler.jsonc");

  assert.equal(validateV31TestingOnlyConfig(testingConfig).ok, true);
  assert.equal(validateV31TestingOnlyConfig(primaryConfig).ok, false);

  const report = buildV31BartSidecarReport({ testingConfig });
  assert.equal(report.ok, true);
  assert.equal(report.executed, false);
  assert.equal(report.noExternalCalls, true);
  assert.equal(report.testingOnly.ok, true);
});

test("V31 scripts do not reference production configs, URLs, or bucket names", async () => {
  const files = [
    "scripts/run-v31-book-fold-attack.mjs",
    "scripts/run-v31-bart-sidecar.mjs",
  ];
  const banned = [
    "wrangler.jsonc",
    "wrangler.secondary.jsonc",
    "16xvs-poc-live",
    "16xvs-poc-fallback",
    "16xvs-poc-vault",
    "16xvs-poc-secondary.michael-38d.workers.dev",
    "16xvs-poc.michael-38d.workers.dev",
  ];

  for (const file of files) {
    const content = await readFile(path.join(repoRoot, file), "utf8");
    for (const value of banned) {
      assert.equal(content.includes(value), false, `${file} contains ${value}`);
    }
  }
});

test("V31 local attack summary preserves V30 and keeps production claims blocked", () => {
  const summary = runV31LocalAttack();

  assert.equal(summary.ok, true);
  assert.equal(summary.noDeploy, true);
  assert.equal(summary.noExternalCalls, true);
  assert.equal(summary.testingWorkerOnly, true);
  assert.equal(summary.gates.v30Regression, true);
  assert.equal(summary.gates.commercialOvermatch249, true);
  assert.equal(summary.gates.stretch500, true);
  assert.equal(summary.gates.stretch707, true);
  assert.equal(summary.gates.bookFold, true);
  assert.equal(summary.gates.ultraReduction9999, true);
  assert.match(summary.claimsNotAllowed.join("\n"), /production/i);
});
