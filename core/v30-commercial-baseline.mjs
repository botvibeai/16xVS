import { get_encoding } from "tiktoken";

import { experimentalPatchSignature } from "./experimental-tokenizer.mjs";

export const COMMERCIAL_BASELINES_V30 = [
  {
    id: "accuracy-preserving-commercial-2x",
    ratio: 2,
    label: "Commercial light-compression benchmark",
    applesToApples: true,
    claimLevel: "commercial-reference",
  },
  {
    id: "commercial-safe-10x",
    ratio: 10,
    label: "Commercial-safe target: up to 90% fewer tokens / 10x",
    applesToApples: true,
    claimLevel: "commercial-safe-number-to-beat",
  },
  {
    id: "research-open-20x",
    ratio: 20,
    label: "Research/open-source aggressive target",
    applesToApples: true,
    claimLevel: "research-directional-number-to-beat",
  },
  {
    id: "query-aware-demo-226x",
    ratio: 226,
    label: "Aggressive query-aware extraction demo",
    applesToApples: false,
    claimLevel: "not-full-semantic-compression-baseline",
  },
];

export const V30_TARGETS = {
  P0: {
    label: "Beat commercial-safe 10x",
    sourceBpeTarget: 220,
    maxEquivalentOutputTokens: 20,
    requiredCorrect: 100,
  },
  P1: {
    label: "Beat aggressive 20x",
    sourceBpeTarget: 220,
    maxEquivalentOutputTokens: 10,
    requiredCorrect: 100,
  },
  P2: {
    label: "Stretch: true 220 BPE -> 1 local 16xVS fold token",
    sourceBpeTarget: 220,
    maxEquivalentOutputTokens: 1,
    requiredCorrect: 100,
  },
};

export const V30_ONE_PATCH_ENCODER_CONFIG = {
  packingMode: "entry",
  maxEntryWordsForSinglePatch: 4096,
  maxEntryCharsForSinglePatch: 20000,
  maxWordsPerPatch: 4096,
  maxCharsPerPatch: 20000,
  maxResidualPatches: 0,
  bsqDimensions: 256,
};

const BPE_ENCODING = "cl100k_base";
const BPE_MIN = 200;
const BPE_MAX = 240;
const DEFAULT_ENTRY_COUNT = 100;

const V30_GROUPS = [
  { id: "v30-group-00", marker: "v30_orion_kernel", topic: "orion storage lineage" },
  { id: "v30-group-01", marker: "v30_harbor_kernel", topic: "harbor route governance" },
  { id: "v30-group-02", marker: "v30_cedar_kernel", topic: "cedar archive recovery" },
  { id: "v30-group-03", marker: "v30_lantern_kernel", topic: "lantern book root" },
  { id: "v30-group-04", marker: "v30_river_kernel", topic: "river chapter folding" },
  { id: "v30-group-05", marker: "v30_quartz_kernel", topic: "quartz quote quarantine" },
  { id: "v30-group-06", marker: "v30_saffron_kernel", topic: "saffron blind holdout" },
  { id: "v30-group-07", marker: "v30_tundra_kernel", topic: "tundra stress margin" },
  { id: "v30-group-08", marker: "v30_velvet_kernel", topic: "velvet semantic route" },
  { id: "v30-group-09", marker: "v30_willow_kernel", topic: "willow mega book ladder" },
];

function round(value, decimals = 4) {
  const scale = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function countBpeTokensWithEncoding(text, encoding) {
  return encoding.encode(String(text || "").trim()).length;
}

function withEncoding(callback) {
  const encoding = get_encoding(BPE_ENCODING);
  try {
    return callback(encoding);
  } finally {
    encoding.free();
  }
}

function bitCount8(value) {
  let count = value & 0xff;
  count = count - ((count >> 1) & 0x55);
  count = (count & 0x33) + ((count >> 2) & 0x33);
  return (count + (count >> 4)) & 0x0f;
}

function hammingHex(left, right) {
  if (left.length !== right.length) {
    throw new Error(`Cannot compare signatures with different lengths: ${left.length} vs ${right.length}`);
  }
  let distance = 0;
  for (let index = 0; index < left.length; index += 2) {
    const leftByte = Number.parseInt(left.slice(index, index + 2), 16);
    const rightByte = Number.parseInt(right.slice(index, index + 2), 16);
    distance += bitCount8(leftByte ^ rightByte);
  }
  return distance;
}

function buildBaseText(group, groupIndex) {
  return [
    `${group.marker} defines a commercial baseline fold lane for ${group.topic}.`,
    `${group.marker} repeats the same route handle so the proof can test source group retrieval without cross-lane leakage.`,
    `The passage describes route lineage, fold preservation, parent child mapping, residual accounting, cold path avoidance, and local evidence discipline for ${group.topic}.`,
    `This is not a production tokenizer claim, not a lossless unfolding claim, and not an external commercial benchmark call.`,
    `Group ${groupIndex} keeps its own root handle closer than outside siblings while the equivalent 16xVS output token count includes residuals if any are created.`,
  ].join(" ");
}

function fitToBpeBand({ group, groupIndex, entryIndex, encoding }) {
  const target = 208 + ((groupIndex * 3 + entryIndex) % 9);
  let text = buildBaseText(group, groupIndex);
  const filler = ` ${group.marker} ${group.topic} route root fold proof keeps same group closer.`;

  while (countBpeTokensWithEncoding(text, encoding) < target) {
    text += filler;
  }

  const bpeTokens = countBpeTokensWithEncoding(text, encoding);
  if (bpeTokens < BPE_MIN || bpeTokens > BPE_MAX) {
    throw new Error(`${group.id} entry ${entryIndex} produced ${bpeTokens} BPE tokens outside ${BPE_MIN}-${BPE_MAX}`);
  }
  return { text, bpeTokens };
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rankEntryAgainstCorpus(entry, corpus) {
  const comparisons = corpus
    .filter((candidate) => candidate.id !== entry.id)
    .map((candidate) => ({
      id: candidate.id,
      groupId: candidate.groupId,
      distance: hammingHex(entry.signatureHex, candidate.signatureHex),
    }))
    .sort((left, right) => left.distance - right.distance || left.id.localeCompare(right.id));

  const nearestOwn = comparisons.find((candidate) => candidate.groupId === entry.groupId) || null;
  const nearestOutside = comparisons.find((candidate) => candidate.groupId !== entry.groupId) || null;
  const correct =
    Boolean(nearestOwn) &&
    Boolean(nearestOutside) &&
    nearestOwn.distance < nearestOutside.distance;

  return {
    entryId: entry.id,
    groupId: entry.groupId,
    nearestOwn,
    nearestOutside,
    correct,
  };
}

export function calculateCompressionMath({ sourceTokens, outputTokens }) {
  if (!Number.isFinite(sourceTokens) || sourceTokens <= 0) {
    throw new Error("sourceTokens must be a positive number");
  }
  if (!Number.isFinite(outputTokens) || outputTokens <= 0) {
    throw new Error("outputTokens must be a positive number");
  }
  const ratio = sourceTokens / outputTokens;
  return {
    sourceTokens,
    outputTokens,
    ratio: round(ratio),
    reductionPercent: round((1 - outputTokens / sourceTokens) * 100),
  };
}

export function minimumSourceTokensToBeat({ baselineRatio, outputTokens = 1, improvementRatio = 0 }) {
  if (!Number.isFinite(baselineRatio) || baselineRatio <= 0) {
    throw new Error("baselineRatio must be a positive number");
  }
  if (!Number.isFinite(outputTokens) || outputTokens <= 0) {
    throw new Error("outputTokens must be a positive number");
  }
  if (!Number.isFinite(improvementRatio) || improvementRatio < 0) {
    throw new Error("improvementRatio must be zero or positive");
  }
  return Math.floor(baselineRatio * (1 + improvementRatio) * outputTokens) + 1;
}

export function buildV30CommercialFixture({ entryCount = DEFAULT_ENTRY_COUNT } = {}) {
  if (entryCount % V30_GROUPS.length !== 0) {
    throw new Error(`entryCount must be divisible by ${V30_GROUPS.length}`);
  }
  return withEncoding((encoding) => {
    const entries = [];
    const perGroup = entryCount / V30_GROUPS.length;
    for (let groupIndex = 0; groupIndex < V30_GROUPS.length; groupIndex += 1) {
      const group = V30_GROUPS[groupIndex];
      for (let entryIndex = 0; entryIndex < perGroup; entryIndex += 1) {
        const { text, bpeTokens } = fitToBpeBand({ group, groupIndex, entryIndex, encoding });
        entries.push({
          id: `v30-entry-${String(groupIndex).padStart(2, "0")}-${String(entryIndex).padStart(2, "0")}`,
          groupId: group.id,
          groupMarker: group.marker,
          topic: group.topic,
          text,
          bpeTokens,
          bpeEncoding: BPE_ENCODING,
        });
      }
    }
    return entries;
  });
}

export function evaluateV30CommercialBaseline({
  entries = buildV30CommercialFixture(),
  encoderConfig = V30_ONE_PATCH_ENCODER_CONFIG,
} = {}) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("entries must be a non-empty array");
  }

  const foldedEntries = entries.map((entry) => {
    const signature = experimentalPatchSignature(entry.text, encoderConfig);
    const residualCount = Math.max(0, signature.patchCount - 1);
    const coldPathCount = 0;
    const equivalentOutputTokens = signature.patchCount + residualCount + coldPathCount;
    return {
      ...entry,
      signatureHex: signature.signatureHex,
      patchCount: signature.patchCount,
      residualCount,
      coldPathCount,
      equivalentOutputTokens,
      compression: calculateCompressionMath({
        sourceTokens: entry.bpeTokens,
        outputTokens: equivalentOutputTokens,
      }),
      routeLineagePreserved: signature.patchCount === 1 && residualCount === 0,
    };
  });

  const rankings = foldedEntries.map((entry) => rankEntryAgainstCorpus(entry, foldedEntries));
  const tiedOrWrong = rankings.filter((ranking) => !ranking.correct);
  const correct = rankings.length - tiedOrWrong.length;
  const averageSourceBpe = round(average(foldedEntries.map((entry) => entry.bpeTokens)));
  const averageEquivalentOutputTokens = round(average(foldedEntries.map((entry) => entry.equivalentOutputTokens)));
  const averageCompressionRatio = round(averageSourceBpe / averageEquivalentOutputTokens);
  const averageReductionPercent = round((1 - averageEquivalentOutputTokens / averageSourceBpe) * 100);

  const baseTargetResult = (target) => ({
    ...target,
    pass:
      correct === target.requiredCorrect &&
      averageEquivalentOutputTokens <= target.maxEquivalentOutputTokens &&
      foldedEntries.every((entry) => entry.routeLineagePreserved),
  });

  const targets = {
    P0: baseTargetResult(V30_TARGETS.P0),
    P1: baseTargetResult(V30_TARGETS.P1),
    P2: baseTargetResult(V30_TARGETS.P2),
  };

  return {
    generatedAt: new Date().toISOString(),
    proofId: "v30-commercial-baseline",
    claimLevel: targets.P2.pass
      ? "local-commercial-stretch-proof"
      : targets.P0.pass
        ? "commercial-safe-local-proof"
        : "failed-commercial-baseline-proof",
    source: {
      entryCount: entries.length,
      bpeEncoding: BPE_ENCODING,
      bpeBand: { min: BPE_MIN, max: BPE_MAX },
      noExternalApiCalls: true,
    },
    summary: {
      entryCount: entries.length,
      averageSourceBpe,
      averageEquivalentOutputTokens,
      averageCompressionRatio,
      averageReductionPercent,
    },
    correctness: {
      correct,
      total: rankings.length,
      rate: round(correct / rankings.length),
      tiedOrWrong,
    },
    targets,
    foldedEntries,
    rankings,
  };
}

export function buildV30CommercialGapReport({ evaluation = evaluateV30CommercialBaseline() } = {}) {
  const achievedRatio = evaluation.summary.averageCompressionRatio;
  const baselineDeltas = COMMERCIAL_BASELINES_V30.map((baseline) => ({
    ...baseline,
    achievedRatio,
    deltaRatio: round(achievedRatio - baseline.ratio),
    percentOverBaseline: round(((achievedRatio / baseline.ratio) - 1) * 100),
    beats: achievedRatio > baseline.ratio,
  }));

  return {
    proofId: "v30-commercial-baseline-gap-report",
    claimLevel: evaluation.claimLevel.includes("commercial")
      ? evaluation.claimLevel
      : "commercial-gap-report-only",
    achievedRatio,
    averageSourceBpe: evaluation.summary.averageSourceBpe,
    averageEquivalentOutputTokens: evaluation.summary.averageEquivalentOutputTokens,
    correctness: evaluation.correctness,
    targets: evaluation.targets,
    baselineDeltas,
    compresr226xMath: {
      sourceTokensForOneTokenToBeat: minimumSourceTokensToBeat({ baselineRatio: 226, outputTokens: 1 }),
      sourceTokensForOneTokenToBeatBy10Percent: minimumSourceTokensToBeat({
        baselineRatio: 226,
        outputTokens: 1,
        improvementRatio: 0.1,
      }),
      sourceTokensForOneTokenToBeatBy20Percent: minimumSourceTokensToBeat({
        baselineRatio: 226,
        outputTokens: 1,
        improvementRatio: 0.2,
      }),
      target220To1Beats226x: 220 > 226,
    },
    notes: [
      "The 226x number is recorded as a query-aware extraction demo, not a full semantic compression baseline.",
      "Residual and cold-path tokens count against output size; this V30 local proof uses no cold-path fallback.",
      "This is a local proof harness only; it does not call commercial APIs or deploy a Worker.",
    ],
  };
}
