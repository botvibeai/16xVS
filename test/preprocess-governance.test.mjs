import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzePreprocessEligibility,
  buildPreprocessCacheKey,
  planPreprocessing,
  protectExactSpans,
  restoreExactSpans,
  verifyPreprocessRetention,
} from "../core/preprocess-governance.mjs";

const longProse = "Human language contains repetition, transitions, and explanatory filler that can often be reduced while retaining the central meaning. A careful preprocessing lane should remove noise only when facts, obligations, numbers, and exact literals remain unchanged. ".repeat(3);

test("routes code and equations to exact preservation", () => {
  const code = "```js\nconst ratio = sourceTokens / outputTokens;\n```\n" + longProse;
  const result = analyzePreprocessEligibility(code);
  assert.equal(result.lane, "exact");
  assert.equal(result.bartAllowed, false);
});

test("routes plain long prose to BART-eligible prose lane", () => {
  const result = analyzePreprocessEligibility(longProse);
  assert.equal(result.lane, "prose");
  assert.equal(result.bartAllowed, true);
});

test("protects and restores mixed-content literals exactly", () => {
  const text = `${longProse} Keep 707:1, $19.99, https://16xvs.com, and "do not overwrite the Vault" unchanged.`;
  const { protectedText, literals } = protectExactSpans(text);
  assert.ok(literals.length >= 4);
  assert.doesNotMatch(protectedText, /https:\/\/16xvs\.com/);
  assert.equal(restoreExactSpans(protectedText, literals), text);
});

test("rejects a missing or duplicated protected placeholder", () => {
  const { protectedText, literals } = protectExactSpans(`${longProse} Use https://16xvs.com.`);
  assert.throws(() => restoreExactSpans(protectedText.replace(literals[0].placeholder, ""), literals), /exactly once/i);
  assert.throws(() => restoreExactSpans(`${protectedText} ${literals[0].placeholder}`, literals), /exactly once/i);
});

test("retention gate rejects number loss", () => {
  const source = "The stable result is 707 to 1 across 100 runs and must remain private.";
  const candidate = "The stable result is strong across runs and must remain private.";
  const result = verifyPreprocessRetention({ source, candidate });
  assert.equal(result.accepted, false);
  assert.ok(result.failures.includes("number-set-changed"));
});

test("retention gate rejects negation and obligation changes", () => {
  const source = "The Vault must not delete a successful copy, and it shall never overwrite an existing key.";
  const candidate = "The Vault must delete a successful copy and it may overwrite an existing key.";
  const result = verifyPreprocessRetention({ source, candidate });
  assert.equal(result.accepted, false);
  assert.ok(result.failures.includes("negation-changed"));
  assert.ok(result.failures.includes("obligation-changed"));
});

test("retention gate accepts conservative shortening with exact facts", () => {
  const source = "The system must retain 707 verified units. Additional explanatory wording repeats that requirement without changing it.";
  const candidate = "The system must retain 707 verified units.";
  const result = verifyPreprocessRetention({ source, candidate });
  assert.equal(result.accepted, true);
  assert.ok(result.characterReductionRatio > 0);
});

test("cache identity is canonical and changes with source or model", () => {
  const first = buildPreprocessCacheKey({ source: longProse, modelId: "bart", modelRevision: "r1", parameters: { b: 2, a: 1 }, route: "prose" });
  const reordered = buildPreprocessCacheKey({ source: longProse, modelId: "bart", modelRevision: "r1", parameters: { a: 1, b: 2 }, route: "prose" });
  const changed = buildPreprocessCacheKey({ source: `${longProse}!`, modelId: "bart", modelRevision: "r1", parameters: { a: 1, b: 2 }, route: "prose" });
  assert.equal(first, reordered);
  assert.notEqual(first, changed);
});

test("planning binds route, model, source hash, and verification requirements", () => {
  const plan = planPreprocessing({ text: longProse, modelId: "@cf/facebook/bart-large-cnn", modelRevision: "configured" });
  assert.equal(plan.route.bartAllowed, true);
  assert.equal(plan.requiresRetentionGate, true);
  assert.equal(plan.requiresSemanticVerifier, true);
  assert.match(plan.cacheKey, /^16xvs:preprocess:[a-f0-9]{64}$/);
});
