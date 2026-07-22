import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  buildV33MixedCorpus,
  buildV33MutationSwarm,
  buildV33RouteNoiseSurge,
  evaluateV33Repeatability,
  runV33Hammer,
} from "../core/v33-707-hammer.mjs";

const repoRoot = process.cwd();

test("V33 hammer corpora build expected local-only 707 entries", () => {
  const mixed = buildV33MixedCorpus();
  const mutations = buildV33MutationSwarm();
  const routeNoise = buildV33RouteNoiseSurge();

  assert.equal(mixed.length, 500);
  assert.equal(mutations.length, 100);
  assert.equal(routeNoise.length, 100);

  for (const entry of [...mixed, ...mutations, ...routeNoise]) {
    assert.ok(entry.bpeTokens >= 707, `${entry.id} is under 707`);
    assert.ok(entry.bpeTokens <= 723, `${entry.id} overshot 707 band`);
    assert.doesNotMatch(entry.text, /\bv31\b|\bv32\b|\bv33\b|_kernel|group-|marker|synthetic/i);
    assert.doesNotMatch(entry.meaningText, /\bv31\b|\bv32\b|\bv33\b|_kernel|group-|marker|synthetic/i);
  }
});

test("V33 repeatability returns identical signatures for repeated blind-holdout runs", () => {
  const report = evaluateV33Repeatability();

  assert.equal(report.summary.pass, true);
  assert.equal(report.summary.compared, 100);
  assert.deepEqual(report.summary.mismatches, []);
});

test("V33 hammer passes mixed corpus mutation swarm and route-noise surge", () => {
  const summary = runV33Hammer();

  assert.equal(summary.ok, true);
  assert.equal(summary.claimLevel, "v33-testing-only-707-hammer-pass");
  assert.equal(summary.noDeploy, true);
  assert.equal(summary.noExternalCalls, true);
  assert.equal(summary.noGitPush, true);
  assert.equal(summary.publicReleaseReady, false);
  assert.equal(summary.gates.v32Locked707, true);
  assert.equal(summary.gates.repeatability, true);
  assert.equal(summary.gates.mixedCorpus707, true);
  assert.equal(summary.gates.mutationSwarm707, true);
  assert.equal(summary.gates.routeNoiseSurge707, true);
  assert.equal(summary.mixedCorpus.summary.correct, 500);
  assert.equal(summary.mixedCorpus.summary.averageEquivalentOutputTokens, 1);
  assert.equal(summary.mixedCorpus.summary.coldPathCount, 0);
  assert.equal(summary.mixedCorpus.summary.collapsedSignatureCount, 0);
  assert.ok(summary.minHammerMargin > 0);
  assert.match(summary.blockersBeforePublic.join("\n"), /external blind corpus/i);
});

test("V33 files do not reference production configs URLs or buckets", async () => {
  const files = [
    "core/v33-707-hammer.mjs",
    "scripts/run-v33-707-hammer.mjs",
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
