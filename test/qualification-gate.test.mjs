import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import { computeRunEvidenceSha256, qualifyCompression } from "../core/qualification-gate.mjs";

const domains = [
  "natural-language",
  "repetition",
  "special-chars",
  "multilingual",
  "code",
  "numbers",
  "mixed",
  "edge",
  "token-boundary",
  "real-world-prompt",
];
const sha = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

function sealRun(run) {
  return { ...run, evidenceSha256: computeRunEvidenceSha256(run) };
}

function makeRuns({
  ratio,
  count = 100,
  incorrectAt = -1,
  lowRatioAt = -1,
  sameSources = false,
  mixedModelAt = -1,
} = {}) {
  return Array.from({ length: count }, (_, index) => sealRun({
    runId: `run-${index}`,
    fixtureId: `fixture-${sameSources ? index % 2 : index}`,
    domain: domains[index % domains.length],
    sourceSha256: sha(`source-${sameSources ? index % 2 : index}`),
    outputSha256: sha(`output-${index}`),
    modelSha256: sha(index === mixedModelAt ? "model-b" : "model-a"),
    restoredFromSha256: index >= 23 && index < 26 ? sha("vault-artifact") : undefined,
    sourceTokens: index === lowRatioAt ? 299 : ratio,
    outputTokens: 1,
    correct: index !== incorrectAt,
    blind: index < 20,
    restarted: index >= 20 && index < 23,
    restored: index >= 23 && index < 26,
  }));
}

test("qualifies 300:1 only when the worst run clears 300", () => {
  const result = qualifyCompression(makeRuns({ ratio: 315 }));
  assert.equal(result.qualified, true);
  assert.equal(result.publicRatio, 300);
  assert.equal(result.technicalRatioTier, 300);
});

test("drops the public tier when one correct run falls below it", () => {
  const result = qualifyCompression(makeRuns({ ratio: 315, lowRatioAt: 99 }));
  assert.equal(result.qualified, true);
  assert.equal(result.publicRatio, 220);
  assert.equal(result.technicalRatioTier, 220);
  assert.equal(result.conservativeRatio, 299);
});

test("rejects any incorrect result", () => {
  const result = qualifyCompression(makeRuns({ ratio: 707, incorrectAt: 50 }));
  assert.equal(result.qualified, false);
  assert.equal(result.publicRatio, null);
  assert.equal(result.gates.correctness, false);
});

test("707 qualifies as 700", () => {
  const result = qualifyCompression(makeRuns({ ratio: 707 }));
  assert.equal(result.qualified, true);
  assert.equal(result.publicRatio, 700);
  assert.equal(result.technicalRatioTier, 700);
});

test("higher private qualification does not raise initial public launch cap", () => {
  const result = qualifyCompression(makeRuns({ ratio: 80000 }));
  assert.equal(result.qualified, true);
  assert.equal(result.technicalRatioTier, 80000);
  assert.equal(result.publicRatio, 700);
  assert.equal(result.conservativeRatio, 80000);
});

test("rejects duplicate run IDs", () => {
  const runs = makeRuns({ ratio: 707 });
  const duplicate = { ...runs[99], runId: runs[0].runId };
  delete duplicate.evidenceSha256;
  runs[99] = sealRun(duplicate);
  assert.throws(() => qualifyCompression(runs), /duplicate runId/i);
});

test("rejects modified evidence payload", () => {
  const runs = makeRuns({ ratio: 707 });
  runs[0].sourceTokens = 80000;
  assert.throws(() => qualifyCompression(runs), /evidenceSha256 does not match/i);
});

test("rejects cloned fixture sets even with unique run IDs", () => {
  const result = qualifyCompression(makeRuns({ ratio: 707, sameSources: true }));
  assert.equal(result.qualified, false);
  assert.equal(result.gates.sourceDiversity, false);
  assert.equal(result.gates.fixtureDiversity, false);
});

test("rejects mixed model identities", () => {
  const result = qualifyCompression(makeRuns({ ratio: 707, mixedModelAt: 99 }));
  assert.equal(result.qualified, false);
  assert.equal(result.gates.singleModelIdentity, false);
});

test("rejects non-finite token counts before evidence acceptance", () => {
  const runs = makeRuns({ ratio: 707 });
  const payload = { ...runs[0], sourceTokens: Infinity };
  delete payload.evidenceSha256;
  runs[0] = { ...payload, evidenceSha256: computeRunEvidenceSha256(payload) };
  assert.throws(() => qualifyCompression(runs), /finite numbers/i);
});

test("input policy cannot weaken qualification floors", () => {
  const result = qualifyCompression(makeRuns({ ratio: 707 }), {
    minRuns: 1,
    minBlindRuns: 0,
    minRestartRuns: 0,
    minRestoreRuns: 0,
    minUniqueSources: 1,
    minUniqueBlindSources: 1,
    minDomains: 1,
    maxRelativeSpread: 999,
    requiredCorrectness: 0,
    publicLaunchCap: 80000,
  });
  assert.equal(result.policy.minRuns, 100);
  assert.equal(result.policy.minUniqueSources, 80);
  assert.equal(result.policy.minDomains, 8);
  assert.equal(result.policy.maxRelativeSpread, 0.1);
  assert.equal(result.policy.requiredCorrectness, 1);
  assert.equal(result.policy.publicLaunchCap, 700);
  assert.equal(result.policy.weakeningAllowed, false);
});
