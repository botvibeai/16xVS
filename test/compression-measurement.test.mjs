import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import {
  buildQualificationRun,
  measureCompressionPipeline,
} from "../core/compression-measurement.mjs";
import { qualifyCompression } from "../core/qualification-gate.mjs";

const sha = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

function measurement(overrides = {}) {
  const index = overrides.index ?? 0;
  const restored = overrides.restored ?? (index >= 23 && index < 26);
  return measureCompressionPipeline({
    runId: `run-${index}`,
    fixtureId: `fixture-${index}`,
    domain: `domain-${index % 10}`,
    sourceSha256: sha(`source-${index}`),
    preprocessedSha256: sha(`preprocessed-${index}`),
    outputSha256: sha(`output-${index}`),
    modelSha256: sha("stable-model"),
    retentionSha256: sha(`retention-${index}`),
    semanticSha256: sha(`semantic-${index}`),
    sourceTokens: 1500,
    preprocessedTokens: 700,
    outputTokens: 1,
    correct: true,
    blind: index < 20,
    restarted: index >= 20 && index < 23,
    restored,
    cacheHit: false,
    preprocessBypassed: false,
    ...overrides,
    restoredFromSha256: restored
      ? (overrides.restoredFromSha256 ?? sha("vault-artifact"))
      : undefined,
  });
}

test("records preprocessing and tokenizer stages without double counting", () => {
  const result = measurement();
  assert.equal(result.stages.preprocessing.ratio, 2.142857);
  assert.equal(result.stages.tokenizer.ratio, 700);
  assert.equal(result.stages.total.ratio, 1500);
  assert.equal(result.accounting.stageProduct, 1500);
  assert.equal(result.accounting.reconciled, true);
});

test("records an exact-bypass 707 to one result", () => {
  const sourceSha256 = sha("same-source");
  const result = measurement({
    sourceTokens: 707,
    preprocessedTokens: 707,
    sourceSha256,
    preprocessedSha256: sourceSha256,
    preprocessBypassed: true,
    retentionSha256: null,
    semanticSha256: null,
  });
  assert.equal(result.stages.preprocessing.ratio, 1);
  assert.equal(result.stages.total.ratio, 707);
});

test("a cache hit still counts normal output tokens", () => {
  const result = measurement({ cacheHit: true });
  assert.equal(result.tokens.output, 1);
  assert.equal(result.stages.total.ratio, 1500);
  assert.equal(result.accounting.cacheHitCountsAsNormalOutput, true);
});

test("rejects invalid or inflated accounting", () => {
  assert.throws(() => measurement({ outputTokens: 0 }), /positive safe integer/i);
  assert.throws(() => measurement({ sourceTokens: Infinity }), /positive safe integer/i);
  assert.throws(() => measurement({ preprocessedTokens: 1600 }), /cannot increase/i);
});

test("rejects bypass token or hash changes", () => {
  assert.throws(
    () => measurement({ preprocessBypassed: true, preprocessedTokens: 700 }),
    /preserve the source token count/i,
  );
});

test("detects measurement tampering before qualification", () => {
  const result = measurement();
  result.tokens.source = 80000;
  assert.throws(() => buildQualificationRun(result), /measurementSha256/i);
});

test("100 diverse 707 runs qualify technically and publicly as 700", () => {
  const runs = Array.from({ length: 100 }, (_, index) => {
    const sourceSha256 = sha(`source-${index}`);
    return buildQualificationRun(measurement({
      index,
      sourceTokens: 707,
      preprocessedTokens: 707,
      sourceSha256,
      preprocessedSha256: sourceSha256,
      preprocessBypassed: true,
      retentionSha256: null,
      semanticSha256: null,
    }));
  });
  const result = qualifyCompression(runs);
  assert.equal(result.qualified, true);
  assert.equal(result.publicRatio, 700);
  assert.equal(result.technicalRatioTier, 700);
});

test("100 diverse 80000 runs remain private above the public 700 cap", () => {
  const runs = Array.from({ length: 100 }, (_, index) => {
    const sourceSha256 = sha(`source-${index}`);
    return buildQualificationRun(measurement({
      index,
      sourceTokens: 80000,
      preprocessedTokens: 80000,
      sourceSha256,
      preprocessedSha256: sourceSha256,
      preprocessBypassed: true,
      retentionSha256: null,
      semanticSha256: null,
    }));
  });
  const result = qualifyCompression(runs);
  assert.equal(result.qualified, true);
  assert.equal(result.publicRatio, 700);
  assert.equal(result.technicalRatioTier, 80000);
});
