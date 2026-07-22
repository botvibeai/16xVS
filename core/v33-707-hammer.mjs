import {
  buildV32StabilizationFixture,
  evaluateV32AnchorMutationGuard,
  evaluateV32RouteConfusionGuard,
  evaluateV32StabilizationSuite,
  runV32Stabilization,
  V32_SUITE_MODES,
} from "./v32-707-stabilization.mjs";
import { evaluateV31NoMarkerSuite } from "./v31-book-fold-attack.mjs";

const TARGET_BPE = 707;
const EXPECTED_PER_MODE = 100;

function round(value, decimals = 4) {
  const scale = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function summarizeReport({ id, report, expectedCount }) {
  const margins = report.rankings.map((ranking) =>
    round((ranking.nearestOutside?.distance ?? 0) - (ranking.nearestOwn?.distance ?? 0))
  );
  const correct = report.rankings.filter((ranking) => ranking.correct).length;
  const signatureGroups = new Map();
  for (const entry of report.foldedEntries) {
    if (!signatureGroups.has(entry.signatureHex)) signatureGroups.set(entry.signatureHex, new Set());
    signatureGroups.get(entry.signatureHex).add(entry.groupId);
  }
  const uniqueSignatureCount = signatureGroups.size;
  const crossGroupSignatureCollisionCount = [...signatureGroups.values()].filter(
    (groupIds) => groupIds.size > 1
  ).length;
  const duplicateWithinGroupSignatureCount =
    report.foldedEntries.length -
    [...signatureGroups.values()].reduce((sum, groupIds) => sum + groupIds.size, 0);
  const coldPathCount = report.foldedEntries.filter((entry) => entry.coldPathCount > 0).length;
  const residualCount = report.foldedEntries.filter((entry) => entry.residualCount > 0).length;
  const tiedOrWrongCount = report.rankings.length - correct;
  const averageSourceBpe = round(
    report.foldedEntries.reduce((sum, entry) => sum + entry.bpeTokens, 0) / report.foldedEntries.length
  );
  const averageEquivalentOutputTokens = round(
    report.foldedEntries.reduce((sum, entry) => sum + entry.equivalentOutputTokens, 0) /
      report.foldedEntries.length
  );
  const pass =
    report.foldedEntries.length === expectedCount &&
    correct === expectedCount &&
    tiedOrWrongCount === 0 &&
    coldPathCount === 0 &&
    residualCount === 0 &&
    averageEquivalentOutputTokens === 1 &&
    report.foldedEntries.every((entry) => entry.rootHandleOnly && entry.magicMarkerFree) &&
    margins.every((margin) => margin > 0) &&
    crossGroupSignatureCollisionCount === 0;

  return {
    id,
    pass,
    correct,
    total: report.foldedEntries.length,
    expectedCount,
    tiedOrWrongCount,
    coldPathCount,
    residualCount,
    averageSourceBpe,
    averageEquivalentOutputTokens,
    averageCompressionRatio: round(averageSourceBpe / averageEquivalentOutputTokens),
    averageReductionPercent: round((1 - averageEquivalentOutputTokens / averageSourceBpe) * 100),
    minOwnVsOutsideMargin: margins.length ? Math.min(...margins) : null,
    uniqueSignatureCount,
    duplicateWithinGroupSignatureCount,
    crossGroupSignatureCollisionCount,
    collapsedSignatureCount: crossGroupSignatureCollisionCount,
  };
}

function evaluateEntries({ id, entries }) {
  const report = evaluateV31NoMarkerSuite({
    targetBpe: TARGET_BPE,
    entries,
  });
  return {
    schemaVersion: "v33-707-hammer-report-v1",
    id,
    targetBpe: TARGET_BPE,
    summary: summarizeReport({ id, report, expectedCount: entries.length }),
    report,
  };
}

export function evaluateV33Repeatability() {
  const first = evaluateV32StabilizationSuite({ mode: "blind-holdout" });
  const second = evaluateV32StabilizationSuite({ mode: "blind-holdout" });
  const firstSignatures = first.report.foldedEntries.map((entry) => [entry.id, entry.signatureHex]);
  const secondSignatures = Object.fromEntries(
    second.report.foldedEntries.map((entry) => [entry.id, entry.signatureHex])
  );
  const mismatches = firstSignatures
    .filter(([id, signature]) => secondSignatures[id] !== signature)
    .map(([id]) => id);

  return {
    schemaVersion: "v33-repeatability-report-v1",
    summary: {
      pass: first.summary.pass && second.summary.pass && mismatches.length === 0,
      firstPass: first.summary.pass,
      secondPass: second.summary.pass,
      compared: firstSignatures.length,
      mismatches,
    },
  };
}

export function buildV33MixedCorpus() {
  return V32_SUITE_MODES.flatMap((mode) =>
    buildV32StabilizationFixture({ mode }).map((entry) => ({
      ...entry,
      id: `mixed-${entry.id}`,
      mode: `mixed-${mode}`,
    }))
  );
}

function mutateMeaningText(text, index) {
  const sentences = String(text || "")
    .split(/(?<=\.)\s+/)
    .filter(Boolean);
  const reordered = index % 2 === 0 ? [...sentences].reverse() : sentences;
  return reordered
    .join(" ")
    .replace(/\bcoordinate\b/gi, "manage")
    .replace(/\bkeeps\b/gi, "preserves")
    .replace(/\bcomplete\b/gi, "validated")
    .replace(/\bvisible\b/gi, "measurable")
    .replace(/\bprotects\b/gi, "guards");
}

export function buildV33MutationSwarm() {
  return buildV32StabilizationFixture({ mode: "blind-holdout" }).map((entry, index) => ({
    ...entry,
    id: `mutation-${entry.id}`,
    mode: "mutation-swarm",
    meaningText: mutateMeaningText(entry.meaningText, index),
  }));
}

export function buildV33RouteNoiseSurge() {
  return buildV32StabilizationFixture({ mode: "route-confusion" }).map((entry, index) => ({
    ...entry,
    id: `route-noise-${entry.id}`,
    mode: "route-noise-surge",
    meaningText: [
      entry.meaningText,
      "Quote archive governance legal retention blind stress repair fallback words are present as noise only.",
      `The accepted 16xvs tokenizer book-root folding route still dominates chapter ${index + 1} with visual patch hamming margin, parent child mapping, names, numbers, negation, causality, and quote attribution preserved.`,
    ].join(" "),
  }));
}

export function runV33Hammer() {
  const v32 = runV32Stabilization();
  const repeatability = evaluateV33Repeatability();
  const mixedCorpus = evaluateEntries({
    id: "mixed-corpus-all-v32-modes",
    entries: buildV33MixedCorpus(),
  });
  const mutationSwarm = evaluateEntries({
    id: "mutation-swarm",
    entries: buildV33MutationSwarm(),
  });
  const routeNoiseSurge = evaluateEntries({
    id: "route-noise-surge",
    entries: buildV33RouteNoiseSurge(),
  });
  const anchorMutationGuard = evaluateV32AnchorMutationGuard();
  const routeConfusionGuard = evaluateV32RouteConfusionGuard();

  const gates = {
    v32Locked707: v32.ok,
    repeatability: repeatability.summary.pass,
    mixedCorpus707: mixedCorpus.summary.pass,
    mutationSwarm707: mutationSwarm.summary.pass,
    routeNoiseSurge707: routeNoiseSurge.summary.pass,
    anchorMutationGuard: anchorMutationGuard.summary.pass,
    routeConfusionGuard: routeConfusionGuard.summary.pass,
  };
  const ok = Object.values(gates).every(Boolean);
  const minMargins = [
    mixedCorpus.summary.minOwnVsOutsideMargin,
    mutationSwarm.summary.minOwnVsOutsideMargin,
    routeNoiseSurge.summary.minOwnVsOutsideMargin,
  ].filter((value) => typeof value === "number");

  return {
    schemaVersion: "v33-707-hammer-summary-v1",
    generatedAt: new Date().toISOString(),
    claimLevel: ok ? "v33-testing-only-707-hammer-pass" : "v33-testing-only-707-near-miss",
    noDeploy: true,
    noExternalCalls: true,
    noGitPush: true,
    targetBpe: TARGET_BPE,
    publicReleaseReady: false,
    v32Baseline: {
      claimLevel: v32.claimLevel,
      pass: v32.ok,
      publicReleaseReady: v32.publicReleaseReady,
    },
    repeatability,
    mixedCorpus,
    mutationSwarm,
    routeNoiseSurge,
    anchorMutationGuard,
    routeConfusionGuard,
    gates,
    ok,
    minHammerMargin: minMargins.length ? Math.min(...minMargins) : null,
    blockersBeforePublic: [
      "external blind corpus",
      "real documents outside generated fixtures",
      "live testing Worker sidecar readback",
      "independent reproduction from a clean checkout",
    ],
  };
}
