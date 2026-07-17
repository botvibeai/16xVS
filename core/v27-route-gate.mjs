import { rankValidatedHeads, selectRankedValidatedHead } from "./head-validator.mjs";

export const V27_ROUTE_POLICY = {
  "book-root": {
    laneId: "book-root",
    eligibleHeads: ["bookRoot", "default"],
    expectedSelectedHead: "bookRoot",
  },
  "governance-adversarial": {
    laneId: "governance-adversarial",
    eligibleHeads: ["governance", "default"],
    expectedSelectedHead: "governance",
  },
  "archive-pressure": {
    laneId: "archive-pressure",
    eligibleHeads: ["governance", "default"],
    expectedSelectedHead: "governance",
  },
  booklike: {
    laneId: "booklike",
    eligibleHeads: ["booklikeRepair", "default"],
    expectedSelectedHead: "booklikeRepair",
  },
  "mega-book-ladder": {
    laneId: "mega-book-ladder",
    eligibleHeads: ["default", "bookRoot"],
    expectedSelectedHead: "default",
  },
  quote: {
    laneId: "quote",
    eligibleHeads: ["quoteRepair", "quoteSplitV26", "default"],
    expectedSelectedHead: null,
  },
  "quote-paragraph": {
    laneId: "quote-paragraph",
    eligibleHeads: ["quoteRepair", "quoteSplitV26", "default"],
    expectedSelectedHead: null,
  },
  "blind-holdout": {
    laneId: "blind-holdout",
    eligibleHeads: ["blindSplitV26", "default"],
    expectedSelectedHead: null,
  },
  "stress-100": {
    laneId: "stress-100",
    eligibleHeads: ["stressSplitV26", "default"],
    expectedSelectedHead: null,
  },
};

export function resolveEligibleHeadsForLane(laneId, policy = V27_ROUTE_POLICY) {
  const lanePolicy = policy[String(laneId || "")];
  return Array.isArray(lanePolicy?.eligibleHeads) && lanePolicy.eligibleHeads.length
    ? [...lanePolicy.eligibleHeads]
    : ["default"];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function filterReportsByHead(reportsByHead, eligibleHeads) {
  const eligible = new Set(eligibleHeads);
  return Object.fromEntries(
    Object.entries(reportsByHead || {}).filter(([headId]) => eligible.has(headId))
  );
}

function firstConfiguredHead(headIds, reportsByHead) {
  return headIds.find((headId) => reportsByHead && reportsByHead[headId]) || null;
}

export function selectRouteGatedValidatedHead({
  laneId,
  candidateHeadId,
  fallbackHeadId = "default",
  reportsByHead = {},
  policy = V27_ROUTE_POLICY,
} = {}) {
  if (!candidateHeadId) {
    throw new Error("candidateHeadId is required.");
  }

  const unrestrictedSelection = selectRankedValidatedHead({
    candidateHeadId,
    fallbackHeadId,
    reportsByHead,
  });
  const fullHeadRanking = rankValidatedHeads({
    candidateHeadId,
    fallbackHeadId,
    reportsByHead,
  });
  const eligibleHeads = unique(resolveEligibleHeadsForLane(laneId, policy));
  const eligibleReportsByHead = filterReportsByHead(reportsByHead, eligibleHeads);
  const configuredEligibleHeads = eligibleHeads.filter((headId) => eligibleReportsByHead[headId]);

  if (configuredEligibleHeads.length === 0) {
    throw new Error(
      `No configured heads are eligible for lane '${laneId || "unknown"}'. Eligible heads: ${eligibleHeads.join(", ")}`
    );
  }

  const gatedCandidateHeadId = eligibleReportsByHead[candidateHeadId]
    ? candidateHeadId
    : firstConfiguredHead([fallbackHeadId, ...configuredEligibleHeads], eligibleReportsByHead);
  const gatedFallbackHeadId = eligibleReportsByHead[fallbackHeadId]
    ? fallbackHeadId
    : gatedCandidateHeadId;
  const eligibleHeadRanking = rankValidatedHeads({
    candidateHeadId: gatedCandidateHeadId,
    fallbackHeadId: gatedFallbackHeadId,
    reportsByHead: eligibleReportsByHead,
  });
  const bestAccepted = eligibleHeadRanking.find((item) => item.accepted);
  const selectedHeadId = bestAccepted?.headId || gatedFallbackHeadId || gatedCandidateHeadId;
  const blockedHeads = Object.keys(reportsByHead || {}).filter(
    (headId) => !eligibleHeads.includes(headId)
  );

  return {
    selectedHeadId,
    policy: "v27-route-gated-ranked",
    reason: bestAccepted
      ? bestAccepted.headId === unrestrictedSelection.selectedHeadId
        ? "best unrestricted head is eligible under v27 route gate"
        : "v27 route gate selected best eligible accepted head"
      : "no eligible head passed; preserving gated fallback for inspection",
    candidateHeadId,
    fallbackHeadId,
    unrestrictedSelection,
    selectedValidation: bestAccepted
      ? {
          accepted: bestAccepted.accepted,
          reasons: bestAccepted.reasons,
          metrics: bestAccepted.metrics,
        }
      : null,
    routeGate: {
      laneId: laneId || null,
      eligibleHeads,
      configuredEligibleHeads,
      blockedHeads,
      gatedCandidateHeadId,
      gatedFallbackHeadId,
    },
    fullHeadRanking,
    eligibleHeadRanking,
  };
}

export function buildRouteLeakageAudit({ laneId, unrestrictedReport, gatedReport } = {}) {
  const unrestrictedSummary = unrestrictedReport?.autoRoute || {};
  const gatedSummary = gatedReport?.autoRoute || {};
  const unrestrictedRanking = unrestrictedReport?.headValidation?.fullHeadRanking || [];
  const gatedRanking = gatedReport?.headValidation?.eligibleHeadRanking || [];
  const unrestrictedWinner = unrestrictedRanking[0] || null;
  const gatedWinner = gatedRanking[0] || null;

  return {
    laneId,
    issue:
      "Unrestricted ranked selection sorts by accepted margin before route ownership, so a repair head can steal a lane it does not own.",
    unrestricted: {
      selectedHead: unrestrictedSummary.selectedHead || null,
      selectedMargin:
        unrestrictedReport?.evidenceAssessment?.semanticSignal?.minSeparationMargin ?? null,
      topRankedHead: unrestrictedWinner?.headId || null,
      topRankedMargin: unrestrictedWinner?.metrics?.minSemanticMargin ?? null,
      routeFitRole: unrestrictedWinner?.routeFitRole || null,
    },
    gated: {
      selectedHead: gatedSummary.selectedHead || null,
      selectedMargin: gatedReport?.evidenceAssessment?.semanticSignal?.minSeparationMargin ?? null,
      topEligibleHead: gatedWinner?.headId || null,
      topEligibleMargin: gatedWinner?.metrics?.minSemanticMargin ?? null,
      eligibleHeads: gatedReport?.headValidation?.routeGate?.eligibleHeads || [],
      blockedHeads: gatedReport?.headValidation?.routeGate?.blockedHeads || [],
    },
    leakReproduced:
      unrestrictedSummary.selectedHead &&
      gatedSummary.selectedHead &&
      unrestrictedSummary.selectedHead !== gatedSummary.selectedHead,
    leakBlocked:
      gatedReport?.headValidation?.routeGate?.blockedHeads?.includes(
        unrestrictedSummary.selectedHead
      ) === true,
  };
}
