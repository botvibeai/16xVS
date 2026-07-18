import assert from "node:assert/strict";
import test from "node:test";

import { runGovernedPreprocessing } from "../core/governed-preprocess-runner.mjs";

const cacheSource = "Human language contains repetition, transitions, and explanatory filler. Careful preprocessing removes noise while retaining the central meaning and stable facts. ".repeat(3);
const candidate = "Human language contains repetition. Careful preprocessing removes noise while retaining central meaning and stable facts.";

function memoryLayer(name = "memory") {
  const values = new Map();
  return {
    name,
    values,
    async get(key) { return values.get(key) || null; },
    async put(key, value) { values.set(key, value); },
  };
}

test("bypasses exact content without invoking summarizer", async () => {
  let calls = 0;
  const source = "```js\nconst value = 707;\n``` " + cacheSource;
  const result = await runGovernedPreprocessing({
    text: source,
    modelId: "bart",
    summarize: async () => { calls += 1; return "wrong"; },
    semanticVerify: async () => true,
  });
  assert.equal(result.output, source);
  assert.equal(result.usedPreprocessor, false);
  assert.equal(calls, 0);
});

test("accepts verified candidate and reuses layered cache", async () => {
  const cache = memoryLayer();
  let calls = 0;
  const first = await runGovernedPreprocessing({
    text: cacheSource,
    modelId: "bart",
    modelRevision: "r1",
    summarize: async () => { calls += 1; return candidate; },
    semanticVerify: async () => ({ accepted: true, verifier: "test" }),
    cacheLayers: [cache],
  });
  assert.equal(first.usedPreprocessor, true);
  assert.equal(first.cacheHit, false);
  assert.equal(first.output, candidate);
  const second = await runGovernedPreprocessing({
    text: cacheSource,
    modelId: "bart",
    modelRevision: "r1",
    summarize: async () => { calls += 1; return "should not run"; },
    semanticVerify: async () => ({ accepted: true }),
    cacheLayers: [cache],
  });
  assert.equal(second.cacheHit, true);
  assert.equal(second.output, candidate);
  assert.equal(calls, 1);
});

test("fails closed when semantic verifier rejects", async () => {
  const result = await runGovernedPreprocessing({
    text: cacheSource,
    modelId: "bart",
    summarize: async () => candidate,
    semanticVerify: async () => ({ accepted: false, reason: "meaning-loss" }),
  });
  assert.equal(result.usedPreprocessor, false);
  assert.equal(result.output, cacheSource);
  assert.equal(result.reason, "bypass:semantic-gate-failed");
});

test("ignores corrupted cache and refreshes it", async () => {
  const cache = memoryLayer();
  cache.get = async () => ({
    candidate: "poisoned",
    candidateSha256: "bad",
    retention: { accepted: true },
    semantic: { accepted: true },
  });
  let calls = 0;
  const result = await runGovernedPreprocessing({
    text: cacheSource,
    modelId: "bart",
    summarize: async () => { calls += 1; return candidate; },
    semanticVerify: async () => true,
    cacheLayers: [cache],
  });
  assert.equal(result.cacheHit, false);
  assert.equal(result.usedPreprocessor, true);
  assert.equal(calls, 1);
});
