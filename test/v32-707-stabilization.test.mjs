import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  V32_SUITE_MODES,
  buildV32StabilizationFixture,
  evaluateV32AnchorMutationGuard,
  evaluateV32RouteConfusionGuard,
  evaluateV32StabilizationSuite,
  runV32Stabilization,
} from "../core/v32-707-stabilization.mjs";

const repoRoot = process.cwd();

test("V32 fixtures build 100 blind/noisy/paraphrase/adversarial entries in the 707 BPE band", () => {
  for (const mode of V32_SUITE_MODES) {
    const entries = buildV32StabilizationFixture({ mode });

    assert.equal(entries.length, 100);
    assert.equal(new Set(entries.map((entry) => entry.groupId)).size, 10);
    for (const entry of entries) {
      assert.equal(entry.mode, mode);
      assert.ok(entry.bpeTokens >= 707, `${entry.id} is under target`);
      assert.ok(entry.bpeTokens <= 723, `${entry.id} overshot target`);
      assert.equal(entry.magicMarkerFree, true);
      assert.doesNotMatch(entry.text, /\bv31\b|\bv32\b|_kernel|group-|marker|synthetic/i);
      assert.doesNotMatch(entry.meaningText, /\bv31\b|\bv32\b|_kernel|group-|marker|synthetic/i);
    }
  }
});

test("V32 stabilization suites keep 707 to 1 at 100/100 across pressure modes", () => {
  for (const mode of V32_SUITE_MODES) {
    const suite = evaluateV32StabilizationSuite({ mode });

    assert.equal(suite.summary.pass, true, `${mode} failed`);
    assert.equal(suite.summary.correct, 100);
    assert.equal(suite.summary.total, 100);
    assert.equal(suite.summary.averageEquivalentOutputTokens, 1);
    assert.equal(suite.summary.coldPathCount, 0);
    assert.equal(suite.summary.allRootHandleOnly, true);
    assert.equal(suite.summary.allMagicMarkerFree, true);
    assert.ok(suite.summary.minOwnVsOutsideMargin > 0);
  }
});

test("V32 anchor mutation guard catches lost negation and numbers", () => {
  const guard = evaluateV32AnchorMutationGuard();

  assert.equal(guard.summary.pass, true);
  assert.deepEqual(guard.results[0].missingAnchors, []);
  assert.deepEqual(guard.results[1].missingAnchors, ["negation"]);
  assert.deepEqual(guard.results[2].missingAnchors, ["numbers"]);
});

test("V32 route confusion guard accepts dominated book-root and rejects ambiguous cross-lane text", () => {
  const guard = evaluateV32RouteConfusionGuard();

  assert.equal(guard.summary.pass, true);
  assert.equal(guard.summary.acceptedBookRootNoise, true);
  assert.equal(guard.summary.rejectedAmbiguousCrossLane, true);
});

test("V32 summary passes local gates but does not claim public release readiness", () => {
  const summary = runV32Stabilization();

  assert.equal(summary.ok, true);
  assert.equal(summary.claimLevel, "v32-testing-only-707-stabilized-candidate");
  assert.equal(summary.noDeploy, true);
  assert.equal(summary.noExternalCalls, true);
  assert.equal(summary.testingOnly, true);
  assert.equal(summary.publicReleaseReady, false);
  assert.equal(summary.gates.v30Regression, true);
  assert.equal(summary.gates.v31Regression707, true);
  assert.equal(summary.gates.blindHoldout707, true);
  assert.equal(summary.gates.paraphrase707, true);
  assert.equal(summary.gates.noisyRaw707, true);
  assert.equal(summary.gates.adversarialSibling707, true);
  assert.equal(summary.gates.routeConfusion707, true);
  assert.match(summary.publicReleaseBlockers.join("\n"), /external blind corpus/i);
});

test("V32 files do not reference production configs URLs or buckets", async () => {
  const files = [
    "core/v32-707-stabilization.mjs",
    "scripts/run-v32-707-stabilization.mjs",
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
