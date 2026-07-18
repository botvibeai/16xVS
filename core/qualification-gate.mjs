import crypto from "node:crypto";

const QUALIFIED_TIERS = Object.freeze([
  220,
  300,
  500,
  700,
  1000,
  1500,
  2400,
  5000,
  10000,
  20000,
  40000,
  80000,
]);
const POLICY_FLOOR = Object.freeze({
  minRuns: 100,
  minBlindRuns: 20,
  minRestartRuns: 3,
  minRestoreRuns: 3,
  minUniqueSources: 80,
  minUniqueBlindSources: 20,
  minDomains: 8,
  maxRelativeSpread: 0.1,
  requiredCorrectness: 1,
  publicLaunchCap: 700,
});
const SHA256_RE = /^[a-f0-9]{64}$/i;

function round(value, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function hashCanonical(value) {
  return crypto.createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function integerAtLeast(value, floor) {
  return Number.isInteger(value) ? Math.max(value, floor) : floor;
}

function strictPolicy(options = {}) {
  return {
    minRuns: integerAtLeast(options.minRuns, POLICY_FLOOR.minRuns),
    minBlindRuns: integerAtLeast(options.minBlindRuns, POLICY_FLOOR.minBlindRuns),
    minRestartRuns: integerAtLeast(options.minRestartRuns, POLICY_FLOOR.minRestartRuns),
    minRestoreRuns: integerAtLeast(options.minRestoreRuns, POLICY_FLOOR.minRestoreRuns),
    minUniqueSources: integerAtLeast(options.minUniqueSources, POLICY_FLOOR.minUniqueSources),
    minUniqueBlindSources: integerAtLeast(options.minUniqueBlindSources, POLICY_FLOOR.minUniqueBlindSources),
    minDomains: integerAtLeast(options.minDomains, POLICY_FLOOR.minDomains),
    maxRelativeSpread:
      Number.isFinite(options.maxRelativeSpread) && options.maxRelativeSpread >= 0
        ? Math.min(options.maxRelativeSpread, POLICY_FLOOR.maxRelativeSpread)
        : POLICY_FLOOR.maxRelativeSpread,
    requiredCorrectness: POLICY_FLOOR.requiredCorrectness,
    publicLaunchCap:
      Number.isFinite(options.publicLaunchCap) && options.publicLaunchCap > 0
        ? Math.min(options.publicLaunchCap, POLICY_FLOOR.publicLaunchCap)
        : POLICY_FLOOR.publicLaunchCap,
  };
}

function assertSha256(value, label, index) {
  if (typeof value !== "string" || !SHA256_RE.test(value)) {
    throw new Error(`run ${index} ${label} must be a 64-character SHA-256 hex string`);
  }
}

function evidencePayload(run) {
  const { evidenceSha256: _ignored, ...payload } = run;
  return payload;
}

export function computeRunEvidenceSha256(run) {
  return hashCanonical(evidencePayload(run));
}

function assertRun(run, index) {
  if (!run || typeof run !== "object") throw new Error(`run ${index} must be an object`);
  for (const key of [
    "runId",
    "fixtureId",
    "domain",
    "sourceSha256",
    "outputSha256",
    "modelSha256",
    "evidenceSha256",
    "sourceTokens",
    "outputTokens",
    "correct",
    "blind",
    "restored",
    "restarted",
  ]) {
    if (!(key in run)) throw new Error(`run ${index} missing ${key}`);
  }
  if (typeof run.runId !== "string" || !run.runId.trim()) throw new Error(`run ${index} runId must be a non-empty string`);
  if (typeof run.fixtureId !== "string" || !run.fixtureId.trim()) throw new Error(`run ${index} fixtureId must be a non-empty string`);
  if (typeof run.domain !== "string" || !run.domain.trim()) throw new Error(`run ${index} domain must be a non-empty string`);
  assertSha256(run.sourceSha256, "sourceSha256", index);
  assertSha256(run.outputSha256, "outputSha256", index);
  assertSha256(run.modelSha256, "modelSha256", index);
  assertSha256(run.evidenceSha256, "evidenceSha256", index);
  if (run.restored) assertSha256(run.restoredFromSha256, "restoredFromSha256", index);
  if (!Number.isFinite(run.sourceTokens) || !Number.isFinite(run.outputTokens)) {
    throw new Error(`run ${index} token counts must be finite numbers`);
  }
  if (!(run.sourceTokens > 0) || !(run.outputTokens > 0)) throw new Error(`run ${index} token counts must be positive`);
  for (const key of ["correct", "blind", "restored", "restarted"]) {
    if (typeof run[key] !== "boolean") throw new Error(`run ${index} ${key} must be boolean`);
  }
  const expectedEvidence = computeRunEvidenceSha256(run);
  if (run.evidenceSha256.toLowerCase() !== expectedEvidence) {
    throw new Error(`run ${index} evidenceSha256 does not match the run payload`);
  }
}

function assertUnique(values, label) {
  const seen = new Set();
  for (const [index, value] of values.entries()) {
    if (seen.has(value)) throw new Error(`duplicate ${label} at run ${index}: ${value}`);
    seen.add(value);
  }
}

function highestTierAtOrBelow(value) {
  return QUALIFIED_TIERS.filter((tier) => tier <= value).at(-1) ?? null;
}

export function qualifyCompression(runs, options = {}) {
  const policy = strictPolicy(options);
  if (!Array.isArray(runs) || runs.length < policy.minRuns) {
    return { qualified: false, reason: `requires at least ${policy.minRuns} runs`, runCount: runs?.length ?? 0 };
  }

  runs.forEach(assertRun);
  assertUnique(runs.map((run) => run.runId), "runId");
  assertUnique(runs.map((run) => run.evidenceSha256), "evidenceSha256");

  const ratios = runs.map((run) => run.sourceTokens / run.outputTokens);
  const sorted = ratios.slice().sort((a, b) => a - b);
  const minimum = sorted[0];
  const median = sorted[Math.floor(sorted.length / 2)];
  const maximum = sorted[sorted.length - 1];
  const average = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
  const correctness = runs.filter((run) => run.correct).length / runs.length;
  const blindRuns = runs.filter((run) => run.blind);
  const restartRuns = runs.filter((run) => run.restarted);
  const restoreRuns = runs.filter((run) => run.restored);
  const sourceHashes = new Set(runs.map((run) => run.sourceSha256));
  const blindSourceHashes = new Set(blindRuns.map((run) => run.sourceSha256));
  const fixtureIds = new Set(runs.map((run) => run.fixtureId));
  const domains = new Set(runs.map((run) => run.domain));
  const modelHashes = new Set(runs.map((run) => run.modelSha256));
  const relativeSpread = median > 0 ? (maximum - minimum) / median : Infinity;

  const gates = {
    runCount: runs.length >= policy.minRuns,
    correctness: correctness >= policy.requiredCorrectness,
    blindCoverage: blindRuns.length >= policy.minBlindRuns && blindRuns.every((run) => run.correct),
    restartCoverage: restartRuns.length >= policy.minRestartRuns && restartRuns.every((run) => run.correct),
    restoreCoverage: restoreRuns.length >= policy.minRestoreRuns && restoreRuns.every((run) => run.correct),
    sourceDiversity: sourceHashes.size >= policy.minUniqueSources,
    blindSourceDiversity: blindSourceHashes.size >= policy.minUniqueBlindSources,
    fixtureDiversity: fixtureIds.size >= policy.minUniqueSources,
    domainCoverage: domains.size >= policy.minDomains,
    singleModelIdentity: modelHashes.size === 1,
    stability: relativeSpread <= policy.maxRelativeSpread,
  };

  const allGatesPass = Object.values(gates).every(Boolean);
  const conservativeRatio = minimum;
  const technicalRatioTier = allGatesPass ? highestTierAtOrBelow(conservativeRatio) : null;
  const publicRatio = allGatesPass
    ? highestTierAtOrBelow(Math.min(conservativeRatio, policy.publicLaunchCap))
    : null;

  const report = {
    schemaVersion: "16xvs-compression-qualification-v2",
    qualified: allGatesPass && technicalRatioTier !== null,
    publicRatio,
    technicalRatioTier,
    conservativeRatio: round(conservativeRatio),
    metrics: {
      runCount: runs.length,
      uniqueRunCount: new Set(runs.map((run) => run.runId)).size,
      uniqueEvidenceCount: new Set(runs.map((run) => run.evidenceSha256)).size,
      uniqueSourceCount: sourceHashes.size,
      uniqueBlindSourceCount: blindSourceHashes.size,
      uniqueFixtureCount: fixtureIds.size,
      domainCount: domains.size,
      modelCount: modelHashes.size,
      blindRunCount: blindRuns.length,
      restartRunCount: restartRuns.length,
      restoreRunCount: restoreRuns.length,
      correctness: round(correctness),
      minimumRatio: round(minimum),
      medianRatio: round(median),
      averageRatio: round(average),
      maximumRatio: round(maximum),
      relativeSpread: round(relativeSpread),
    },
    identities: {
      modelSha256: modelHashes.size === 1 ? [...modelHashes][0] : null,
      restoredArtifactSha256: [...new Set(restoreRuns.map((run) => run.restoredFromSha256))],
    },
    gates,
    policy: {
      ...policy,
      promotionRule: "Technical qualification uses the highest approved tier not exceeding the worst successful run.",
      publicRule: "Initial public launch recommendation is capped at 700:1 even when private technical qualification is higher.",
      weakeningAllowed: false,
    },
  };
  return { ...report, reportSha256: hashCanonical(report) };
}

export { QUALIFIED_TIERS, POLICY_FLOOR };
