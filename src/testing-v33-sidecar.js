import { experimentalPatchSignature } from "../core/experimental-tokenizer.mjs";
import { buildRuntimePolicyContract } from "../core/v28-runtime-governance.mjs";

const TARGET_BPE = 707;
const MAX_BATCH_ENTRIES = 100;
const TESTING_ROLE = "testing";
const TESTING_STACK = "testing";

const V33_WORKER_ENCODER_CONFIG = {
  packingMode: "entry",
  maxEntryWordsForSinglePatch: 250000,
  maxEntryCharsForSinglePatch: 1600000,
  maxWordsPerPatch: 250000,
  maxCharsPerPatch: 1600000,
  maxResidualPatches: 2,
  residualMaxWordsPerPatch: 24,
  residualMaxCharsPerPatch: 160,
  macroSketchMaxClauses: 2,
  macroSketchMaxWords: 42,
  macroSketchMaxChars: 260,
  bsqDimensions: 256,
};

function round(value, decimals = 4) {
  const scale = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function bitCount8(value) {
  let count = value & 0xff;
  count = count - ((count >> 1) & 0x55);
  count = (count & 0x33) + ((count >> 2) & 0x33);
  return (count + (count >> 4)) & 0x0f;
}

function hammingHex(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) {
    throw new Error("Cannot compare invalid or mismatched signatures.");
  }

  let distance = 0;
  for (let index = 0; index < left.length; index += 2) {
    const leftByte = Number.parseInt(left.slice(index, index + 2), 16);
    const rightByte = Number.parseInt(right.slice(index, index + 2), 16);
    distance += bitCount8(leftByte ^ rightByte);
  }
  return distance;
}

function compressionFor(sourceBpe, equivalentOutputTokens) {
  return {
    sourceBpe,
    equivalentOutputTokens,
    ratio: round(sourceBpe / equivalentOutputTokens),
    reductionPercent: round((1 - equivalentOutputTokens / sourceBpe) * 100),
  };
}

function magicMarkerFree(text) {
  return !/\bv31\b|\bv32\b|\bv33\b|_kernel|group-|marker|synthetic/i.test(String(text || ""));
}

function sanitizeEntry(entry, index) {
  if (!entry || typeof entry !== "object") throw new Error(`Entry ${index} is missing.`);
  const id = typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `entry-${index + 1}`;
  const groupId = typeof entry.groupId === "string" && entry.groupId.trim() ? entry.groupId.trim() : null;
  const text = typeof entry.text === "string" ? entry.text : "";
  const meaningText = typeof entry.meaningText === "string" && entry.meaningText.trim() ? entry.meaningText : text;
  const bpeTokens = Number(entry.bpeTokens);
  if (!groupId) throw new Error(`Entry ${id} is missing groupId.`);
  if (!meaningText.trim()) throw new Error(`Entry ${id} is missing meaning text.`);
  if (!Number.isFinite(bpeTokens) || bpeTokens < TARGET_BPE) {
    throw new Error(`Entry ${id} is below the ${TARGET_BPE} BPE target.`);
  }

  return {
    id,
    groupId,
    mode: typeof entry.mode === "string" ? entry.mode : "unknown",
    languageProbe: typeof entry.languageProbe === "string" ? entry.languageProbe : "english-control",
    topic: typeof entry.topic === "string" ? entry.topic : groupId,
    bpeTokens,
    text,
    meaningText,
    magicMarkerFree: Boolean(entry.magicMarkerFree) && magicMarkerFree(text) && magicMarkerFree(meaningText),
  };
}

function foldEntry(entry) {
  const signature = experimentalPatchSignature(entry.meaningText, V33_WORKER_ENCODER_CONFIG);
  const contract = buildRuntimePolicyContract({
    laneId: "book-root",
    headId: "bookRoot",
    text: entry.meaningText,
    minimumConfidence: 0.05,
  });
  const residualCount = Math.max(0, signature.patchCount - 1);
  const coldPathCount = contract.accepted ? 0 : 1;
  const supportTokenCount = 0;
  const equivalentOutputTokens = signature.patchCount + residualCount + coldPathCount + supportTokenCount;

  return {
    id: entry.id,
    groupId: entry.groupId,
    mode: entry.mode,
    languageProbe: entry.languageProbe,
    topic: entry.topic,
    bpeTokens: entry.bpeTokens,
    signatureHex: signature.signatureHex,
    patchCount: signature.patchCount,
    residualCount,
    coldPathCount,
    supportTokenCount,
    equivalentOutputTokens,
    rootHandleOnly: signature.patchCount === 1 && residualCount === 0 && coldPathCount === 0,
    magicMarkerFree: entry.magicMarkerFree,
    runtimeContract: {
      laneId: contract.laneId,
      classifiedLaneId: contract.classifiedLaneId,
      headId: contract.headId,
      eligibleHeads: contract.eligibleHeads,
      confidence: contract.confidence,
      accepted: contract.accepted,
      rejectReason: contract.rejectReason,
    },
    compression: compressionFor(entry.bpeTokens, equivalentOutputTokens),
  };
}

function nearestFor(entry, candidates, sameGroup) {
  return candidates
    .filter((candidate) => candidate.id !== entry.id)
    .filter((candidate) => (sameGroup ? candidate.groupId === entry.groupId : candidate.groupId !== entry.groupId))
    .map((candidate) => ({
      entryId: candidate.id,
      groupId: candidate.groupId,
      mode: candidate.mode,
      distance: hammingHex(entry.signatureHex, candidate.signatureHex),
    }))
    .sort((left, right) => left.distance - right.distance || left.entryId.localeCompare(right.entryId))[0] || null;
}

function rankEntryAgainstCorpus(entry, foldedEntries) {
  const nearestOwn = nearestFor(entry, foldedEntries, true);
  const nearestOutside = nearestFor(entry, foldedEntries, false);
  const correct = Boolean(nearestOwn) && Boolean(nearestOutside) && nearestOwn.distance < nearestOutside.distance;
  return {
    entryId: entry.id,
    groupId: entry.groupId,
    mode: entry.mode,
    nearestOwn,
    nearestOutside,
    margin:
      nearestOwn && nearestOutside ? round(nearestOutside.distance - nearestOwn.distance) : null,
    correct,
  };
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function summarize(foldedEntries, rankings) {
  const tiedOrWrong = rankings.filter((ranking) => !ranking.correct);
  const averageSourceBpe = round(average(foldedEntries.map((entry) => entry.bpeTokens)));
  const averageEquivalentOutputTokens = round(
    average(foldedEntries.map((entry) => entry.equivalentOutputTokens))
  );
  const margins = rankings
    .map((ranking) => ranking.margin)
    .filter((value) => typeof value === "number");
  const signatureGroups = new Map();
  for (const entry of foldedEntries) {
    if (!signatureGroups.has(entry.signatureHex)) signatureGroups.set(entry.signatureHex, new Set());
    signatureGroups.get(entry.signatureHex).add(entry.groupId);
  }
  const crossGroupSignatureCollisionCount = [...signatureGroups.values()].filter(
    (groupIds) => groupIds.size > 1
  ).length;

  const pass =
    foldedEntries.length > 0 &&
    tiedOrWrong.length === 0 &&
    foldedEntries.every((entry) => entry.rootHandleOnly && entry.magicMarkerFree) &&
    foldedEntries.every((entry) => entry.runtimeContract.accepted) &&
    averageEquivalentOutputTokens === 1 &&
    crossGroupSignatureCollisionCount === 0 &&
    margins.every((margin) => margin > 0);

  return {
    pass,
    correct: foldedEntries.length - tiedOrWrong.length,
    total: foldedEntries.length,
    tiedOrWrongCount: tiedOrWrong.length,
    coldPathCount: foldedEntries.filter((entry) => entry.coldPathCount > 0).length,
    residualCount: foldedEntries.filter((entry) => entry.residualCount > 0).length,
    averageSourceBpe,
    averageEquivalentOutputTokens,
    averageCompressionRatio: round(averageSourceBpe / averageEquivalentOutputTokens),
    averageReductionPercent: round((1 - averageEquivalentOutputTokens / averageSourceBpe) * 100),
    minOwnVsOutsideMargin: margins.length ? Math.min(...margins) : null,
    crossGroupSignatureCollisionCount,
    allRootHandleOnly: foldedEntries.every((entry) => entry.rootHandleOnly),
    allMagicMarkerFree: foldedEntries.every((entry) => entry.magicMarkerFree),
  };
}

export function isTestingV33SidecarAllowed(env = {}) {
  return env?.DEPLOYMENT_ROLE === TESTING_ROLE && env?.DATA_STACK === TESTING_STACK;
}

export function runV33TestingWorkerBatch(body = {}, env = {}) {
  if (!isTestingV33SidecarAllowed(env)) {
    return {
      ok: false,
      status: 404,
      error: {
        message: "V33 testing sidecar is only available on the isolated testing Worker.",
        reason: "testing-worker-only",
      },
    };
  }

  const entries = Array.isArray(body.entries) ? body.entries : [];
  if (entries.length === 0) {
    return {
      ok: false,
      status: 400,
      error: { message: "Batch requires a non-empty entries array." },
    };
  }
  if (entries.length > MAX_BATCH_ENTRIES) {
    return {
      ok: false,
      status: 400,
      error: { message: `Batch is limited to ${MAX_BATCH_ENTRIES} entries.` },
    };
  }

  const sanitized = entries.map(sanitizeEntry);
  const foldedEntries = sanitized.map(foldEntry);
  const rankings = foldedEntries.map((entry) => rankEntryAgainstCorpus(entry, foldedEntries));
  const summary = summarize(foldedEntries, rankings);

  return {
    ok: summary.pass,
    status: summary.pass ? 200 : 422,
    schemaVersion: "v33-testing-worker-batch-v1",
    generatedAt: new Date().toISOString(),
    suiteId: typeof body.suiteId === "string" ? body.suiteId : "v33-testing-worker-1000",
    batchId: typeof body.batchId === "string" ? body.batchId : "batch",
    claimLevel: summary.pass ? "v33-testing-worker-707-batch-pass" : "v33-testing-worker-707-batch-near-miss",
    targetBpe: TARGET_BPE,
    testingWorkerOnly: true,
    noPrimarySecondary: true,
    rawTextStoredInResponse: false,
    summary,
    foldedEntries,
    rankings,
  };
}
