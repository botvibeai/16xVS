function metric(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function truthRank(value) {
  return value === true ? 1 : 0;
}

function descendingMetric(value) {
  return Number.isFinite(Number(value)) ? Number(value) : Number.NEGATIVE_INFINITY;
}

function ascendingMetric(value) {
  return Number.isFinite(Number(value)) ? Number(value) : Number.POSITIVE_INFINITY;
}

function compareBy(left, right, selectors = []) {
  for (const selector of selectors) {
    const value = selector(left, right);
    if (value !== 0) return value;
  }
  return String(left.headId).localeCompare(String(right.headId));
}

export function summarizeHeadReport(report = {}) {
  return {
    model: report.validatedHeadCandidate?.model || null,
    summary: {
      resultLabel: report.evidenceAssessment?.resultLabel ?? null,
      semanticAllPositive:
        report.evidenceAssessment?.semanticSignal?.allMarginsPositive ?? null,
      minSemanticMargin:
        report.evidenceAssessment?.semanticSignal?.minSeparationMargin ?? null,
      signatureCollapse:
        report.evidenceAssessment?.collapseChecks?.signatureCollapse ?? null,
      avgNearestSignatureDistance:
        report.evidenceAssessment?.collapseChecks?.avgNearestSignatureDistance ?? null,
      avgPatchesPerEntry: report.summary?.avgExperimentalPatchesPerEntry ?? null,
      experimentalBinaryVsSourceRatio: report.summary?.experimentalBinaryVsSourceRatio ?? null,
    },
  };
}

export function validateHeadReport(report = {}) {
  const evidence = report.evidenceAssessment || {};
  const semantic = evidence.semanticSignal || {};
  const collapse = evidence.collapseChecks || {};
  const ladder = report.megaBookLadder?.summary || null;
  const reasons = [];

  if (collapse.signatureCollapse === true) {
    reasons.push("signature collapse guard failed");
  }

  if (semantic.hasSemanticRun === true && semantic.allMarginsPositive !== true) {
    reasons.push("semantic margins are not all positive");
  }

  if (ladder && ladder.allRootChapterMarginsPositive !== true) {
    reasons.push("mega-book ladder margins are not all positive");
  }

  return {
    accepted: reasons.length === 0,
    reasons,
    metrics: {
      resultLabel: evidence.resultLabel || null,
      semanticAllPositive:
        typeof semantic.allMarginsPositive === "boolean" ? semantic.allMarginsPositive : null,
      minSemanticMargin: metric(semantic.minSeparationMargin),
      signatureCollapse:
        typeof collapse.signatureCollapse === "boolean" ? collapse.signatureCollapse : null,
      avgNearestSignatureDistance: metric(collapse.avgNearestSignatureDistance),
      ladderAllPositive: ladder
        ? Boolean(ladder.allRootChapterMarginsPositive)
        : null,
      ladderMinMargin: ladder ? metric(ladder.minRootChapterMargin) : null,
      avgPatchesPerEntry: metric(report.summary?.avgExperimentalPatchesPerEntry),
      experimentalBinaryVsSourceRatio: metric(report.summary?.experimentalBinaryVsSourceRatio),
    },
  };
}

export function rankValidatedHeads({
  candidateHeadId,
  fallbackHeadId = "default",
  reportsByHead = {},
} = {}) {
  const ranking = Object.entries(reportsByHead).map(([headId, report]) => {
    const validation = validateHeadReport(report);
    const routeFitRole =
      headId === candidateHeadId ? "candidate" : headId === fallbackHeadId ? "fallback" : "other";
    const routeFitScore = routeFitRole === "candidate" ? 2 : routeFitRole === "fallback" ? 1 : 0;

    return {
      headId,
      routeFitRole,
      routeFitScore,
      accepted: validation.accepted,
      reasons: validation.reasons,
      metrics: validation.metrics,
      report: summarizeHeadReport(report),
    };
  });

  ranking.sort((left, right) =>
    compareBy(left, right, [
      (a, b) => truthRank(b.accepted) - truthRank(a.accepted),
      (a, b) =>
        truthRank(b.metrics.semanticAllPositive) - truthRank(a.metrics.semanticAllPositive),
      (a, b) =>
        descendingMetric(b.metrics.minSemanticMargin) -
        descendingMetric(a.metrics.minSemanticMargin),
      (a, b) =>
        truthRank(b.metrics.ladderAllPositive) - truthRank(a.metrics.ladderAllPositive),
      (a, b) =>
        descendingMetric(b.metrics.ladderMinMargin) -
        descendingMetric(a.metrics.ladderMinMargin),
      (a, b) =>
        descendingMetric(b.metrics.avgNearestSignatureDistance) -
        descendingMetric(a.metrics.avgNearestSignatureDistance),
      (a, b) => b.routeFitScore - a.routeFitScore,
      (a, b) =>
        ascendingMetric(a.metrics.avgPatchesPerEntry) -
        ascendingMetric(b.metrics.avgPatchesPerEntry),
    ])
  );

  return ranking.map((item, index) => ({
    rank: index + 1,
    ...item,
  }));
}

export function selectValidatedHead({
  candidateHeadId,
  fallbackHeadId = "default",
  reportsByHead = {},
} = {}) {
  if (!candidateHeadId) {
    throw new Error("candidateHeadId is required.");
  }

  const candidateReport = reportsByHead[candidateHeadId];
  if (!candidateReport) {
    throw new Error(`Missing report for candidate head '${candidateHeadId}'.`);
  }

  const candidateValidation = validateHeadReport(candidateReport);
  const fallbackReport = reportsByHead[fallbackHeadId] || null;
  const fallbackValidation = fallbackReport ? validateHeadReport(fallbackReport) : null;

  if (candidateValidation.accepted) {
    return {
      selectedHeadId: candidateHeadId,
      reason: "candidate head passed validation",
      candidateHeadId,
      fallbackHeadId,
      candidateValidation,
      fallbackValidation,
    };
  }

  if (fallbackValidation?.accepted) {
    return {
      selectedHeadId: fallbackHeadId,
      reason: "candidate head failed validation; fallback passed",
      candidateHeadId,
      fallbackHeadId,
      candidateValidation,
      fallbackValidation,
    };
  }

  return {
    selectedHeadId: candidateHeadId,
    reason: "candidate and fallback failed validation; preserving routed candidate for inspection",
    candidateHeadId,
    fallbackHeadId,
    candidateValidation,
    fallbackValidation,
  };
}
