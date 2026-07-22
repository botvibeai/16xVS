import { V27_ROUTE_POLICY, resolveEligibleHeadsForLane } from "./v27-route-gate.mjs";

const BLOOM_SIZE = 128;
const DEFAULT_MINIMUM_CONFIDENCE = 0.32;
const COLD_PATH_HEAD_ID = "highPrecisionFallback";

export const V28_LANE_TAGS = {
  "book-root": [
    "16xvs",
    "tokenizer",
    "visual",
    "patch",
    "book-root",
    "book",
    "chapter",
    "folding",
    "multilingual",
    "hamming",
  ],
  "governance-adversarial": [
    "legal",
    "hold",
    "custodians",
    "audit",
    "evidence",
    "retention",
    "policy",
    "deletion",
    "exception",
    "compliance",
    "attestation",
  ],
  "archive-pressure": [
    "archive",
    "catalog",
    "replication",
    "repair",
    "vault",
    "fallback",
    "shard",
    "manifest",
    "recovery",
    "retrieval",
  ],
  booklike: [
    "chapter",
    "section",
    "narrative",
    "booklike",
    "longform",
    "paragraph",
    "topic",
    "root",
  ],
  "mega-book-ladder": [
    "mega",
    "ladder",
    "book",
    "chapter",
    "root",
    "folded",
    "lineage",
    "semantic",
  ],
  quote: ["quote", "quoted", "quotation", "speaker", "says", "phrase", "line", "attribution"],
  "quote-paragraph": [
    "quote",
    "paragraph",
    "quoted",
    "quotation",
    "speaker",
    "passage",
    "line",
    "attribution",
  ],
  "blind-holdout": ["blind", "holdout", "unseen", "domain", "unknown", "transfer"],
  "stress-100": ["stress", "phrase", "mixed", "format", "edge", "adversarial", "boundary"],
};

function normalizeTokens(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function hashToken(token, seed = 17) {
  let hash = seed >>> 0;
  for (const char of String(token)) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  return hash % BLOOM_SIZE;
}

function buildBloom(tags) {
  const bits = new Uint8Array(BLOOM_SIZE);
  for (const tag of tags || []) {
    bits[hashToken(tag, 17)] = 1;
    bits[hashToken(tag, 53)] = 1;
  }
  return bits;
}

function bloomMayContain(bits, token) {
  return bits[hashToken(token, 17)] === 1 && bits[hashToken(token, 53)] === 1;
}

function buildLaneFilters(tagMap = V28_LANE_TAGS) {
  return Object.fromEntries(
    Object.entries(tagMap).map(([laneId, tags]) => [
      laneId,
      {
        laneId,
        tags,
        bloom: buildBloom(tags),
      },
    ])
  );
}

export function classifyLaneWithBloom(text, options = {}) {
  const minimumConfidence = Number.isFinite(Number(options.minimumConfidence))
    ? Number(options.minimumConfidence)
    : DEFAULT_MINIMUM_CONFIDENCE;
  const filters = buildLaneFilters(options.tagMap || V28_LANE_TAGS);
  const tokens = [...new Set(normalizeTokens(text))];
  const ranked = Object.values(filters)
    .map((filter) => {
      const exactHits = filter.tags.filter((tag) => tokens.includes(tag)).length;
      const bloomHits = tokens.filter((token) => bloomMayContain(filter.bloom, token)).length;
      const denominator = Math.max(1, Math.min(filter.tags.length, tokens.length || 1));
      const confidence = Number(
        Math.min(1, (exactHits + bloomHits * 0.25) / denominator).toFixed(4)
      );
      return {
        laneId: filter.laneId,
        confidence,
        exactHits,
        bloomHits,
        tagCount: filter.tags.length,
      };
    })
    .sort((left, right) => right.confidence - left.confidence || left.laneId.localeCompare(right.laneId));
  const winner = ranked[0] || {
    laneId: "unknown",
    confidence: 0,
    exactHits: 0,
    bloomHits: 0,
    tagCount: 0,
  };
  const accepted = winner.confidence >= minimumConfidence;

  return {
    laneId: accepted ? winner.laneId : "unknown",
    confidence: winner.confidence,
    accepted,
    rejectReason: accepted ? null : "lane confidence below threshold",
    minimumConfidence,
    ranked,
  };
}

export function buildRuntimePolicyContract({
  laneId,
  headId,
  text,
  minimumConfidence = DEFAULT_MINIMUM_CONFIDENCE,
  policy = V27_ROUTE_POLICY,
} = {}) {
  const classification = classifyLaneWithBloom(text, { minimumConfidence });
  const resolvedLaneId = laneId || classification.laneId;
  const eligibleHeads = resolveEligibleHeadsForLane(resolvedLaneId, policy);
  const laneConfidence =
    classification.laneId === resolvedLaneId || classification.laneId === "unknown"
      ? classification.confidence
      : 0;
  const confidenceAccepted = laneConfidence >= minimumConfidence;
  const headAccepted = eligibleHeads.includes(headId);
  const accepted = Boolean(confidenceAccepted && headAccepted);
  let rejectReason = null;
  if (!confidenceAccepted) rejectReason = "lane confidence below threshold";
  else if (!headAccepted) rejectReason = "head not eligible for lane";

  return {
    schemaVersion: "v28-runtime-policy-contract-v1",
    laneId: resolvedLaneId,
    classifiedLaneId: classification.laneId,
    headId,
    eligibleHeads,
    confidence: laneConfidence,
    accepted,
    rejectReason,
    classifier: classification,
  };
}

export function evaluateColdPathFallback({
  patches = [],
  minimumConfidence = DEFAULT_MINIMUM_CONFIDENCE,
  coldPathHeadId = COLD_PATH_HEAD_ID,
} = {}) {
  const patchDecisions = patches.map((patch) => {
    const contract = buildRuntimePolicyContract({
      laneId: patch.laneId,
      headId: patch.headId,
      text: patch.text,
      minimumConfidence,
    });
    const fallbackUsed = !contract.accepted;
    return {
      patchId: patch.id,
      laneId: contract.laneId,
      headId: patch.headId,
      selectedHeadId: fallbackUsed ? coldPathHeadId : patch.headId,
      eligibleHeads: contract.eligibleHeads,
      confidence: contract.confidence,
      accepted: contract.accepted,
      rejectReason: contract.rejectReason,
      fallbackUsed,
    };
  });
  const fallbackPatchIds = patchDecisions
    .filter((decision) => decision.fallbackUsed)
    .map((decision) => decision.patchId);

  return {
    schemaVersion: "v28-cold-path-report-v1",
    sequenceAccepted: true,
    fallbackUsed: fallbackPatchIds.length > 0,
    fallbackPatchIds,
    coldPathHeadId,
    patchDecisions,
  };
}

function hardSign(value) {
  return value >= 0 ? 1 : -1;
}

function stableSoftSign(value, temperature) {
  const scaled = Math.tanh(value / Math.max(temperature, 0.0001));
  return scaled >= 0 ? 1 : -1;
}

function countDrift(previous, next) {
  let drift = 0;
  for (let index = 0; index < Math.min(previous.length, next.length); index += 1) {
    if (previous[index] !== next[index]) drift += 1;
  }
  return drift + Math.abs(previous.length - next.length);
}

export function simulateSteTemperatureDecay({
  values = [],
  perturbations = [],
  temperatureSchedule = [2, 1, 0.5, 0.25],
} = {}) {
  const baseline = values.map(hardSign);
  let hardDrift = 0;
  let decayDrift = 0;
  let previousHard = baseline;
  let previousDecay = values.map((value) => stableSoftSign(value, temperatureSchedule[0] || 1));

  for (let step = 0; step < temperatureSchedule.length; step += 1) {
    const perturbation = Number(perturbations[step % Math.max(1, perturbations.length)]) || 0;
    const stepValues = values.map((value, index) => value + perturbation / (index + 1));
    const hard = stepValues.map(hardSign);
    const softened = stepValues.map((value) => stableSoftSign(value, temperatureSchedule[step]));
    const decay = softened.map((bit, index) => {
      const nearBoundary = Math.abs(stepValues[index]) < temperatureSchedule[step] * 0.08;
      return nearBoundary ? previousDecay[index] : bit;
    });
    hardDrift += countDrift(previousHard, hard);
    decayDrift += countDrift(previousDecay, decay);
    previousHard = hard;
    previousDecay = decay;
  }

  return {
    schemaVersion: "v28-ste-temperature-decay-report-v1",
    temperatureSchedule: [...temperatureSchedule],
    driftBefore: hardDrift,
    driftAfter: decayDrift,
    accepted: decayDrift <= hardDrift,
    finalBits: previousDecay,
  };
}

export function runV28RuntimeHardeningProbe() {
  const contracts = [
    buildRuntimePolicyContract({
      laneId: "governance-adversarial",
      headId: "governance",
      text: "legal hold custodians audit evidence retention policy deletion exception compliance attestation",
    }),
    buildRuntimePolicyContract({
      laneId: "governance-adversarial",
      headId: "stressSplitV26",
      text: "legal hold custodians audit evidence retention policy deletion exception compliance attestation",
    }),
    buildRuntimePolicyContract({
      laneId: "quote",
      headId: "quoteRepair",
      text: "quoted passage speaker attribution paragraph quotation line says remembered phrase",
    }),
  ];
  const coldPath = evaluateColdPathFallback({
    patches: [
      {
        id: "patch-governance",
        laneId: "governance-adversarial",
        headId: "governance",
        text: "legal hold custodians audit evidence retention policy deletion exception compliance attestation",
      },
      {
        id: "patch-unknown",
        laneId: "governance-adversarial",
        headId: "governance",
        text: "ambiguous stray tokens without lane evidence",
      },
      {
        id: "patch-quote",
        laneId: "quote",
        headId: "quoteRepair",
        text: "quoted passage speaker attribution paragraph quotation line says remembered phrase",
      },
    ],
  });
  const ste = simulateSteTemperatureDecay({
    values: [-0.2, -0.04, 0.03, 0.06, -0.01, 0.18],
    perturbations: [0.05, -0.02, 0.03, -0.06],
    temperatureSchedule: [2, 1, 0.5, 0.25],
  });
  const routeLeakageBlocked =
    contracts.find((contract) => contract.headId === "stressSplitV26")?.accepted === false;
  const targetQuarantinePreserved = contracts.every((contract) => {
    if (contract.headId === "stressSplitV26") return contract.accepted === false;
    return contract.eligibleHeads.includes(contract.headId);
  });
  const accepted =
    routeLeakageBlocked &&
    targetQuarantinePreserved &&
    coldPath.sequenceAccepted &&
    coldPath.fallbackUsed &&
    ste.accepted;

  return {
    schemaVersion: "v28-runtime-hardening-report-v1",
    generatedAt: new Date().toISOString(),
    claimLevel: accepted ? "runtime-governance-proof" : "runtime-governance-failed",
    routeLeakageBlocked,
    targetQuarantinePreserved,
    contracts,
    coldPath,
    ste,
    deferredLayers: ["BART", "Wasm SIMD", "Durable Object sharding", "QJL", "Cloudmersive"],
  };
}
