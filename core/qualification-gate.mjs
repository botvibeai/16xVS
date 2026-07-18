import crypto from "node:crypto";

const PUBLIC_TIERS = Object.freeze([220, 300, 500, 700, 1000, 2400, 80000]);
const POLICY_FLOOR = Object.freeze({
  minRuns: 100,
  minBlindRuns: 20,
  minRestartRuns: 3,
  minRestoreRuns: 3,
  maxRelativeSpread: 0.1,
  requiredCorrectness: 1,
});

function round(value, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function hashCanonical(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
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
    maxRelativeSpread:
      Number.isFinite(options.maxRelativeSpread) && options.maxRelativeSpread >= 0
        ? Math.min(options.maxRelativeSpread, POLICY_FLOOR.maxRelativeSpread)
        : POLICY_FLOOR.maxRelativeSpread,
    requiredCorrectness: POLICY_FLOOR.requiredCorrectness,
  };
}

function assertRun(run, index) {
  if (!run || typeof run !== "object") throw new Error(`run ${index} must be an object`);
  for (const key of ["runId", "sourceTokens", "outputTokens", "correct", "blind", "restored", "restarted"]) {
    if (!(key in run)) throw new Error(`run ${index} missing ${key}`);
  }
  if (typeof run.runId !== "string" || !run.runId.trim()) {
    throw new Error(`run ${index} runId must be a non-empty string`);
  }
  if (!Number.isFinite(run.sourceTokens) || !Number.isFinite(run.outputTokens)) {
    throw new Error(`run ${index} token counts must be finite numbers`);
  }
  if (!(run.sourceTokens > 0) || !(run.outputTokens > 0)) {
    throw new Error(`run ${index} token counts must be positive`);
  }
  for (const key of ["correct", "blind", "restored", "restarted"]) {
    if (typeof run[key] !== "boolean") throw new Error(`run ${index} ${key} must be boolean`);
  }
}

function assertUniqueRunIds(runs) {
  const seen = new Set();
  for (const [index, run] of runs.entries()) {
    if (seen.has(run.runId)) throw new Error(`duplicate runId at run ${index}: ${run.runId}`);
    seen.add(run.runId);
  }
}

export function qualifyCompression(runs, options = {}) {
  const policy = strictPolicy(options);
  const { minRuns, minBlindRuns, minRestartRuns, minRestoreRuns, maxRelativeSpread, requiredCorrectness } = policy;

  if (!Array.isArray(runs) || runs.length < minRuns) {
    return { qualified: false, reason: `requires at least ${minRuns} runs`, runCount: runs?.length ?? 0 };
  }

  runs.forEach(assertRun);
  assertUniqueRunIds(runs);
  const ratios = runs.map((run) => run.sourceTokens / run.outputTokens);
  const sorted = ratios.slice().sort((a, b) => a - b);
  const minimum = sorted[0];
  const median = sorted[Math.floor(sorted.length / 2)];
  const maximum = sorted[sorted.length - 1];
  const average = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
  const correctness = runs.filter((run) => run.correct === true).length / runs.length;
  const blindRuns = runs.filter((run) => run.blind === true);
  const restartRuns = runs.filter((run) => run.restarted === true);
  const restoreRuns = runs.filter((run) => run.restored === true);
  const relativeSpread = median > 0 ? (maximum - minimum) / median : Infinity;

  const gates = {
    runCount: runs.length >= minRuns,
    correctness: correctness >= requiredCorrectness,
    blindCoverage: blindRuns.length >= minBlindRuns && blindRuns.every((run) => run.correct === true),
    restartCoverage: restartRuns.length >= minRestartRuns && restartRuns.every((run) => run.correct === true),
    restoreCoverage: restoreRuns.length >= minRestoreRuns && restoreRuns.every((run) => run.correct === true),
    stability: relativeSpread <= maxRelativeSpread,
  };

  const allGatesPass = Object.values(gates).every(Boolean);
  const conservativeRatio = minimum;
  const publicRatio = allGatesPass
    ? PUBLIC_TIERS.filter((tier) => tier <= conservativeRatio).at(-1) ?? null
    : null;

  const report = {
    qualified: allGatesPass && publicRatio !== null,
    publicRatio,
    conservativeRatio: round(conservativeRatio),
    metrics: {
      runCount: runs.length,
      uniqueRunCount: new Set(runs.map((run) => run.runId)).size,
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
    gates,
    policy: {
      ...policy,
      promotionRule: "Public claim uses the highest approved tier not exceeding the worst successful run.",
      weakeningAllowed: false,
    },
  };

  return { ...report, evidenceSha256: hashCanonical(report) };
}

export { PUBLIC_TIERS, POLICY_FLOOR };
