function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function toNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function summarizeSemanticSignal(separation = []) {
  const groups = separation
    .map((entry) => ({
      group: entry.group,
      separationMargin: toNumber(entry.separationMargin),
    }))
    .filter((entry) => finiteNumber(entry.separationMargin));

  const margins = groups.map((entry) => entry.separationMargin);
  const hasSemanticRun = margins.length > 0;
  const minSeparationMargin = hasSemanticRun ? Math.min(...margins) : null;
  const maxSeparationMargin = hasSemanticRun ? Math.max(...margins) : null;
  const allMarginsPositive = hasSemanticRun ? margins.every((margin) => margin > 0) : null;
  const negativeGroups = groups
    .filter((entry) => entry.separationMargin <= 0)
    .map((entry) => entry.group);

  return {
    hasSemanticRun,
    outsidePool: hasSemanticRun ? "labeled-other-groups" : null,
    groupCount: groups.length,
    groups,
    minSeparationMargin,
    maxSeparationMargin,
    allMarginsPositive,
    negativeGroups,
  };
}

function summarizeCollapseChecks(retrieval = {}) {
  const exactNeighborRate = toNumber(retrieval.exactNeighborRate, 0);
  const lowDistanceRate = toNumber(retrieval.lowDistanceRate, 0);
  const avgNearestSignatureDistance = toNumber(retrieval.avgNearestSignatureDistance, 0);
  const signatureCollapse =
    exactNeighborRate > 0.05 ||
    lowDistanceRate > 0.1 ||
    avgNearestSignatureDistance < 16;

  return {
    exactNeighborRate,
    lowDistanceRate,
    avgNearestSignatureDistance,
    signatureCollapse,
    thresholds: {
      maxExactNeighborRate: 0.05,
      maxLowDistanceRate: 0.1,
      minAvgNearestSignatureDistance: 16,
    },
  };
}

export function assessReportEvidence(report = {}) {
  const summary = report.summary || {};
  const experimentalPatchesPerToken = toNumber(summary.experimentalPatchesPerToken);
  const beatsTiktokenByPatchCount =
    finiteNumber(experimentalPatchesPerToken) && experimentalPatchesPerToken < 1;

  const semanticSignal = summarizeSemanticSignal(report.semantic?.separation || []);
  const collapseChecks = summarizeCollapseChecks(report.retrieval || {});

  const resultLabel =
    collapseChecks.signatureCollapse || !beatsTiktokenByPatchCount
      ? "failed"
      : "directional";

  const claimSupported = [];
  const claimNotSupported = [];

  if (beatsTiktokenByPatchCount) {
    claimSupported.push(
      "The experimental core candidate uses fewer patches than tiktoken tokens on this corpus."
    );
  } else {
    claimNotSupported.push(
      "This run does not show a patch-count advantage over tiktoken."
    );
  }

  if (semanticSignal.allMarginsPositive === true && !collapseChecks.signatureCollapse) {
    claimSupported.push(
      "Controlled labeled semantic groups are closer internally than to other labeled groups in this run."
    );
  } else if (semanticSignal.hasSemanticRun) {
    claimNotSupported.push(
      "This run does not support semantic superiority because at least one controlled group failed separation or the signature space collapsed."
    );
  } else {
    claimNotSupported.push(
      "No semantic-group fixture was included, so semantic behavior is untested in this run."
    );
  }

  if (collapseChecks.signatureCollapse) {
    claimNotSupported.push(
      "The signature space shows collapse risk, so apparent semantic margins are not trustworthy."
    );
  } else {
    claimSupported.push(
      "The retrieval signature space did not trip exact-neighbor or low-distance collapse guardrails."
    );
  }

  claimNotSupported.push(
    "This is not proof of target 16xVS BSQ performance because the embedding source is still a heuristic prototype."
  );
  claimNotSupported.push(
    "This is not broad real-world proof that 16xVS beats regular tokenizers."
  );

  return {
    resultLabel,
    claimLayer: "experimental core candidate",
    countSignal: {
      experimentalPatchesPerToken,
      beatsTiktokenByPatchCount,
    },
    semanticSignal,
    collapseChecks,
    claimSupported,
    claimNotSupported,
  };
}
