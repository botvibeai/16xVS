export const PRIMARY_PROOF_EXPECTATIONS = {
  "book-root": {
    expectedRouteId: "bookRoot",
    expectedLexicalHead: "bookRoot",
    expectedSelectedHead: "bookRoot",
    requireSemanticPass: true,
    maxAvgPatchesPerEntry: 3,
  },
  "governance-adversarial": {
    expectedRouteId: "governance",
    expectedLexicalHead: "governance",
    expectedSelectedHead: "governance",
    requireSemanticPass: true,
    maxAvgPatchesPerEntry: 3,
  },
  "archive-pressure": {
    expectedRouteId: "archive",
    expectedLexicalHead: "governance",
    expectedSelectedHead: "governance",
    requireSemanticPass: true,
    maxAvgPatchesPerEntry: 3,
  },
  booklike: {
    expectedRouteId: "default",
    expectedLexicalHead: "default",
    expectedSelectedHead: "default",
    knownSemanticFailure: true,
    maxAvgPatchesPerEntry: 3,
  },
  "mega-book-ladder": {
    expectedRouteId: "bookRoot",
    expectedLexicalHead: "bookRoot",
    expectedSelectedHead: "default",
    requireSemanticPass: true,
    maxAvgPatchesPerEntry: 3,
  },
};

export const GENERALIZATION_GATE_CASES = {
  "blind-holdout": {
    requiredForDirectionalLock: false,
    requiredForProductionLock: true,
  },
  "stress-100": {
    requiredForDirectionalLock: false,
    requiredForProductionLock: true,
  },
};

function finiteMetric(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function semanticAllPositive(report = {}) {
  const value = report.evidenceAssessment?.semanticSignal?.allMarginsPositive;
  return typeof value === "boolean" ? value : null;
}

function minSemanticMargin(report = {}) {
  return finiteMetric(report.evidenceAssessment?.semanticSignal?.minSeparationMargin);
}

function signatureCollapse(report = {}) {
  const value = report.evidenceAssessment?.collapseChecks?.signatureCollapse;
  return typeof value === "boolean" ? value : null;
}

function avgPatchesPerEntry(report = {}) {
  return finiteMetric(report.summary?.avgExperimentalPatchesPerEntry);
}

function selectedHead(report = {}) {
  return report.autoRoute?.selectedHead ?? report.multiHeadRoute?.selectedHead ?? null;
}

function lexicalHead(report = {}) {
  return report.autoRoute?.lexicalSelectedHead ?? report.autoRoute?.selectedHead ?? null;
}

function routeId(report = {}) {
  return report.autoRoute?.routeId ?? report.multiHeadRoute?.routeId ?? null;
}

function headRanking(report = {}) {
  return Array.isArray(report.headValidation?.fullHeadRanking)
    ? report.headValidation.fullHeadRanking
    : [];
}

function check(name, passed, actual, expected) {
  return {
    name,
    passed: Boolean(passed),
    actual,
    expected,
  };
}

export function summarizeProofReport(report = {}) {
  return {
    input: report.input || null,
    routeId: routeId(report),
    lexicalHead: lexicalHead(report),
    selectedHead: selectedHead(report),
    selectedModel: report.autoRoute?.selectedModel || report.validatedHeadCandidate?.model || null,
    resultLabel: report.evidenceAssessment?.resultLabel ?? null,
    semanticAllPositive: semanticAllPositive(report),
    minSemanticMargin: minSemanticMargin(report),
    signatureCollapse: signatureCollapse(report),
    avgPatchesPerEntry: avgPatchesPerEntry(report),
    experimentalBinaryVsSourceRatio: finiteMetric(report.summary?.experimentalBinaryVsSourceRatio),
    fullHeadRanking: headRanking(report).map((item) => ({
      rank: item.rank,
      headId: item.headId,
      accepted: item.accepted,
      routeFitRole: item.routeFitRole,
      minSemanticMargin: item.metrics?.minSemanticMargin ?? null,
      signatureCollapse: item.metrics?.signatureCollapse ?? null,
      avgPatchesPerEntry: item.metrics?.avgPatchesPerEntry ?? null,
    })),
  };
}

export function evaluatePrimaryGate(caseId, report, expectation = PRIMARY_PROOF_EXPECTATIONS[caseId]) {
  if (!expectation) {
    throw new Error(`No primary proof expectation configured for '${caseId}'.`);
  }

  const summary = summarizeProofReport(report);
  const checks = [
    check("route id", summary.routeId === expectation.expectedRouteId, summary.routeId, expectation.expectedRouteId),
    check(
      "lexical head",
      summary.lexicalHead === expectation.expectedLexicalHead,
      summary.lexicalHead,
      expectation.expectedLexicalHead
    ),
    check(
      "selected head",
      summary.selectedHead === expectation.expectedSelectedHead,
      summary.selectedHead,
      expectation.expectedSelectedHead
    ),
    check("no signature collapse", summary.signatureCollapse === false, summary.signatureCollapse, false),
    check(
      "fold shape",
      Number.isFinite(summary.avgPatchesPerEntry) &&
        summary.avgPatchesPerEntry <= expectation.maxAvgPatchesPerEntry,
      summary.avgPatchesPerEntry,
      `<= ${expectation.maxAvgPatchesPerEntry}`
    ),
    check(
      "full head ranking present",
      summary.fullHeadRanking.length >= 3,
      summary.fullHeadRanking.length,
      ">= 3"
    ),
  ];

  if (expectation.knownSemanticFailure) {
    checks.push(
      check(
        "known semantic failure preserved",
        summary.semanticAllPositive === false || Number(summary.minSemanticMargin) < 0,
        {
          semanticAllPositive: summary.semanticAllPositive,
          minSemanticMargin: summary.minSemanticMargin,
        },
        "negative semantic margin remains visible"
      )
    );
  } else if (expectation.requireSemanticPass) {
    checks.push(
      check(
        "semantic direction",
        summary.semanticAllPositive === true && Number(summary.minSemanticMargin) >= 0,
        {
          semanticAllPositive: summary.semanticAllPositive,
          minSemanticMargin: summary.minSemanticMargin,
        },
        "all margins positive"
      )
    );
  }

  return {
    caseId,
    gate: "primary-directional-lock",
    passed: checks.every((item) => item.passed),
    summary,
    checks,
  };
}

export function evaluateGeneralizationGate(
  caseId,
  report,
  expectation = GENERALIZATION_GATE_CASES[caseId] || {}
) {
  const summary = summarizeProofReport(report);
  const checks = [
    check("no signature collapse", summary.signatureCollapse === false, summary.signatureCollapse, false),
    check(
      "semantic generalization",
      summary.semanticAllPositive === true && Number(summary.minSemanticMargin) >= 0,
      {
        semanticAllPositive: summary.semanticAllPositive,
        minSemanticMargin: summary.minSemanticMargin,
      },
      "all margins positive"
    ),
  ];

  return {
    caseId,
    gate: "production-generalization",
    requiredForDirectionalLock: expectation.requiredForDirectionalLock === true,
    requiredForProductionLock: expectation.requiredForProductionLock !== false,
    passed: checks.every((item) => item.passed),
    summary,
    checks,
  };
}

export function buildProofSummary({
  label,
  generatedAt,
  lockDir,
  reportsByCase = {},
  generalizationReportsByCase = {},
  tests = {},
} = {}) {
  const primaryGates = Object.fromEntries(
    Object.entries(PRIMARY_PROOF_EXPECTATIONS).map(([caseId, expectation]) => [
      caseId,
      evaluatePrimaryGate(caseId, reportsByCase[caseId], expectation),
    ])
  );
  const generalizationGates = Object.fromEntries(
    Object.entries(generalizationReportsByCase).map(([caseId, report]) => [
      caseId,
      evaluateGeneralizationGate(caseId, report),
    ])
  );
  const primaryPassed = Object.values(primaryGates).every((gate) => gate.passed);
  const productionGeneralizationPassed = Object.values(generalizationGates).every(
    (gate) => gate.passed
  );
  const directionalLockPassed =
    primaryPassed &&
    tests.passed !== false &&
    Object.values(generalizationGates)
      .filter((gate) => gate.requiredForDirectionalLock)
      .every((gate) => gate.passed);

  return {
    label: label || "v19-lock",
    generatedAt: generatedAt || new Date().toISOString(),
    lockDir: lockDir || null,
    claimLevel: directionalLockPassed
      ? productionGeneralizationPassed
        ? "production-candidate"
        : "directional-proof-lock"
      : "not-locked",
    gates: {
      unitTests: tests,
      primary: primaryGates,
      generalization: generalizationGates,
    },
    claimsAllowed: directionalLockPassed
      ? [
          "v19 is locked as a reproducible directional proof baseline.",
          "Known book-root, governance, archive, and mega-book ladder routes preserve fold shape without signature collapse.",
          "Full-head ranking is recorded for the configured v19 heads.",
        ]
      : [],
    claimsNotAllowed: [
      "Production router proof.",
      "Broad tokenizer superiority over current tokenizers.",
      "Blind/stress semantic generalization unless the generalization gates pass.",
      "99.99% raw-source reduction or Library of Congress to 1.25 GB claims.",
    ],
  };
}
