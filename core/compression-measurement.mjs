import crypto from "node:crypto";

import { computeRunEvidenceSha256 } from "./qualification-gate.mjs";

const SCHEMA_VERSION = "16xvs-compression-measurement-v1";
const SHA256_RE = /^[a-f0-9]{64}$/i;

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function sha256Canonical(value) {
  return crypto.createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function assertId(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
}

function assertSha(value, label, required = true) {
  if (!required && (value === null || value === undefined || value === "")) return;
  if (typeof value !== "string" || !SHA256_RE.test(value)) {
    throw new Error(`${label} must be a 64-character SHA-256 hex string`);
  }
}

function assertTokenCount(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive safe integer`);
  }
}

function round(value, places = 6) {
  const scale = 10 ** places;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function reductionPercent(before, after) {
  return round((1 - after / before) * 100);
}

export function measureCompressionPipeline(input = {}) {
  for (const [label, value] of [
    ["runId", input.runId],
    ["fixtureId", input.fixtureId],
    ["domain", input.domain],
  ]) {
    assertId(value, label);
  }
  for (const [label, value] of [
    ["sourceSha256", input.sourceSha256],
    ["preprocessedSha256", input.preprocessedSha256],
    ["outputSha256", input.outputSha256],
    ["modelSha256", input.modelSha256],
  ]) {
    assertSha(value, label);
  }
  assertSha(input.retentionSha256, "retentionSha256", !input.preprocessBypassed);
  assertSha(input.semanticSha256, "semanticSha256", !input.preprocessBypassed);
  if (input.restored) assertSha(input.restoredFromSha256, "restoredFromSha256");
  for (const [label, value] of [
    ["sourceTokens", input.sourceTokens],
    ["preprocessedTokens", input.preprocessedTokens],
    ["outputTokens", input.outputTokens],
  ]) {
    assertTokenCount(value, label);
  }
  for (const key of ["correct", "blind", "restarted", "restored", "cacheHit", "preprocessBypassed"]) {
    if (typeof input[key] !== "boolean") throw new Error(`${key} must be boolean`);
  }
  if (input.preprocessBypassed && input.preprocessedTokens !== input.sourceTokens) {
    throw new Error("bypassed preprocessing must preserve the source token count");
  }
  if (
    input.preprocessBypassed &&
    input.preprocessedSha256.toLowerCase() !== input.sourceSha256.toLowerCase()
  ) {
    throw new Error("bypassed preprocessing must preserve the source hash");
  }
  if (!input.preprocessBypassed && input.preprocessedTokens > input.sourceTokens) {
    throw new Error("accepted preprocessing cannot increase token count");
  }
  if (input.cacheHit && input.preprocessBypassed) {
    throw new Error("a preprocessing cache hit cannot be recorded on a bypassed lane");
  }

  const preprocessingRatio = input.sourceTokens / input.preprocessedTokens;
  const tokenizerRatio = input.preprocessedTokens / input.outputTokens;
  const totalRatio = input.sourceTokens / input.outputTokens;
  const product = preprocessingRatio * tokenizerRatio;
  if (Math.abs(product - totalRatio) > Math.max(1e-9, totalRatio * 1e-12)) {
    throw new Error("stage ratios do not reconcile with the total ratio");
  }

  const recordWithoutHash = {
    schemaVersion: SCHEMA_VERSION,
    runId: input.runId,
    fixtureId: input.fixtureId,
    domain: input.domain,
    identities: {
      sourceSha256: input.sourceSha256.toLowerCase(),
      preprocessedSha256: input.preprocessedSha256.toLowerCase(),
      outputSha256: input.outputSha256.toLowerCase(),
      modelSha256: input.modelSha256.toLowerCase(),
      retentionSha256: input.retentionSha256?.toLowerCase() || null,
      semanticSha256: input.semanticSha256?.toLowerCase() || null,
      restoredFromSha256: input.restoredFromSha256?.toLowerCase() || null,
    },
    flags: {
      correct: input.correct,
      blind: input.blind,
      restarted: input.restarted,
      restored: input.restored,
      cacheHit: input.cacheHit,
      preprocessBypassed: input.preprocessBypassed,
    },
    tokens: {
      source: input.sourceTokens,
      afterPreprocessing: input.preprocessedTokens,
      output: input.outputTokens,
    },
    stages: {
      preprocessing: {
        ratio: round(preprocessingRatio),
        reductionPercent: reductionPercent(input.sourceTokens, input.preprocessedTokens),
      },
      tokenizer: {
        ratio: round(tokenizerRatio),
        reductionPercent: reductionPercent(input.preprocessedTokens, input.outputTokens),
      },
      total: {
        ratio: round(totalRatio),
        reductionPercent: reductionPercent(input.sourceTokens, input.outputTokens),
      },
    },
    accounting: {
      cacheHitCountsAsNormalOutput: true,
      stageProduct: round(product),
      totalRatio: round(totalRatio),
      reconciled: true,
      publicClaimAuthorized: false,
    },
  };
  return {
    ...recordWithoutHash,
    measurementSha256: sha256Canonical(recordWithoutHash),
  };
}

export function buildQualificationRun(measurement) {
  if (!measurement || measurement.schemaVersion !== SCHEMA_VERSION) {
    throw new Error("unsupported compression measurement");
  }
  const { measurementSha256: _ignored, ...measurementPayload } = measurement;
  const expectedMeasurementHash = sha256Canonical(measurementPayload);
  if (measurement.measurementSha256 !== expectedMeasurementHash) {
    throw new Error("measurementSha256 does not match the measurement payload");
  }
  const run = {
    runId: measurement.runId,
    fixtureId: measurement.fixtureId,
    domain: measurement.domain,
    sourceSha256: measurement.identities.sourceSha256,
    outputSha256: measurement.identities.outputSha256,
    modelSha256: measurement.identities.modelSha256,
    restoredFromSha256: measurement.identities.restoredFromSha256 || undefined,
    sourceTokens: measurement.tokens.source,
    outputTokens: measurement.tokens.output,
    correct: measurement.flags.correct,
    blind: measurement.flags.blind,
    restarted: measurement.flags.restarted,
    restored: measurement.flags.restored,
    measurementSha256: measurement.measurementSha256,
    preprocessedTokens: measurement.tokens.afterPreprocessing,
    preprocessingRatio: measurement.stages.preprocessing.ratio,
    tokenizerRatio: measurement.stages.tokenizer.ratio,
    totalRatio: measurement.stages.total.ratio,
    cacheHit: measurement.flags.cacheHit,
    preprocessBypassed: measurement.flags.preprocessBypassed,
  };
  return {
    ...run,
    evidenceSha256: computeRunEvidenceSha256(run),
  };
}

export { SCHEMA_VERSION };
