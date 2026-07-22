import path from "node:path";

import { summarizeProofReport } from "./proof-gates.mjs";

export const V23_HEADS = [
  {
    id: "default",
    model: "./models/learned-hybrid-prototype-v10-constrained-merge-hierarchical-packer-v2.json",
  },
  {
    id: "bookRoot",
    model: "./models/learned-hybrid-prototype-v8-control-bridge-hierarchical-packer-v2.json",
  },
  {
    id: "governance",
    model: "./models/learned-hybrid-prototype-v13-balanced-triad-hierarchical-packer-v2.json",
  },
  {
    id: "booklikeRepair",
    model:
      "./models/learned-hybrid-prototype-v22-governance-evidence-booklike-hierarchical-packer-v2.json",
  },
];

export const V23_PRIMARY_CASES = [
  {
    caseId: "book-root",
    input: "./bench/book-root-corpus-2026-05-06.txt",
    semantic: "./bench/book-root-semantic-2026-05-06.json",
    reportName: "book-root-v23-four-head-ranked.json",
    expectation: {
      expectedRouteId: "bookRoot",
      expectedLexicalHead: "bookRoot",
      expectedSelectedHead: "bookRoot",
      requireSemanticPass: true,
      maxAvgPatchesPerEntry: 3,
    },
  },
  {
    caseId: "governance-adversarial",
    input: "./bench/governance-adversarial-holdout-2026-04-29.txt",
    semantic: "./bench/governance-adversarial-semantic-2026-04-29.json",
    reportName: "governance-adversarial-v23-four-head-ranked.json",
    expectation: {
      expectedRouteId: "governance",
      expectedLexicalHead: "governance",
      expectedSelectedHead: "governance",
      requireSemanticPass: true,
      maxAvgPatchesPerEntry: 3,
    },
  },
  {
    caseId: "archive-pressure",
    input: "./bench/archive-pressure-corpus-2026-04-29.txt",
    semantic: "./bench/archive-pressure-semantic-2026-04-29.json",
    reportName: "archive-pressure-v23-four-head-ranked.json",
    expectation: {
      expectedRouteId: "archive",
      expectedLexicalHead: "governance",
      expectedSelectedHead: "governance",
      requireSemanticPass: true,
      maxAvgPatchesPerEntry: 3,
    },
  },
  {
    caseId: "booklike",
    input: "./bench/booklike-corpus-2026-04-25.txt",
    semantic: "./bench/booklike-semantic-2026-04-25.json",
    reportName: "booklike-v23-four-head-ranked.json",
    expectation: {
      expectedRouteId: "default",
      expectedLexicalHead: "default",
      expectedSelectedHead: "booklikeRepair",
      requireSemanticPass: true,
      maxAvgPatchesPerEntry: 3,
    },
  },
  {
    caseId: "mega-book-ladder",
    input: "./bench/mega-book-ladder-corpus-2026-05-07.txt",
    semantic: "./bench/mega-book-ladder-semantic-2026-05-07.json",
    reportName: "mega-book-ladder-v23-four-head-ranked.json",
    expectation: {
      expectedRouteId: "bookRoot",
      expectedLexicalHead: "bookRoot",
      expectedSelectedHead: "default",
      requireSemanticPass: true,
      maxAvgPatchesPerEntry: 3,
    },
  },
];

export const V23_GENERALIZATION_CASES = [
  {
    caseId: "blind-holdout",
    input: "./bench/blind-holdout-2026-04-20.txt",
    semantic: "./bench/blind-holdout-semantic-2026-04-20.json",
    reportName: "blind-holdout-v23-four-head-ranked.json",
    requiredForDirectionalLock: false,
    requiredForProductionLock: true,
  },
  {
    caseId: "stress-100",
    input: "./bench/stress-100-phrases-2026-04-23.txt",
    semantic: "./bench/stress-100-groups-2026-04-23.json",
    reportName: "stress-100-v23-four-head-ranked.json",
    requiredForDirectionalLock: false,
    requiredForProductionLock: true,
  },
];

export const V23_EXTRA_CASES = [
  {
    caseId: "code-domain",
    input: "./bench/code-domain-holdout-2026-05-08.txt",
    semantic: "./bench/code-domain-semantic-2026-05-08.json",
    reportName: "code-domain-v23-four-head-ranked.json",
  },
  {
    caseId: "paraphrase-holdout",
    input: "./bench/paraphrase-holdout-2026-04-23.txt",
    semantic: "./bench/paraphrase-holdout-semantic-2026-04-23.json",
    reportName: "paraphrase-holdout-v23-four-head-ranked.json",
  },
  {
    caseId: "multilingual-longform",
    input: "./bench/multilingual-longform-holdout-2026-04-29.txt",
    semantic: "./bench/multilingual-longform-semantic-2026-04-29.json",
    reportName: "multilingual-longform-v23-four-head-ranked.json",
  },
  {
    caseId: "phrase-semantic",
    input: "./bench/phrase-corpus.txt",
    semantic: "./bench/semantic-phrases.json",
    reportName: "phrase-semantic-v23-four-head-ranked.json",
  },
  {
    caseId: "multilingual-phrases",
    input: "./bench/multilingual-phrases.txt",
    semantic: "./bench/multilingual-semantic-phrases.json",
    reportName: "multilingual-phrases-v23-four-head-ranked.json",
  },
  {
    caseId: "protocol-longform",
    input: "./bench/protocol-longform-2026-04-25.txt",
    semantic: "./bench/protocol-longform-semantic-2026-04-25.json",
    reportName: "protocol-longform-v23-four-head-ranked.json",
  },
  {
    caseId: "quote",
    input: "./bench/quote-corpus-2026-04-25.txt",
    semantic: "./bench/quote-semantic-2026-04-25.json",
    reportName: "quote-v23-four-head-ranked.json",
  },
  {
    caseId: "quote-paragraph",
    input: "./bench/quote-paragraph-corpus-2026-04-25.txt",
    semantic: "./bench/quote-paragraph-semantic-2026-04-25.json",
    reportName: "quote-paragraph-v23-four-head-ranked.json",
  },
];

function check(name, passed, actual, expected) {
  return {
    name,
    passed: Boolean(passed),
    actual,
    expected,
  };
}

function positiveSemantic(summary) {
  return summary.semanticAllPositive === true && Number(summary.minSemanticMargin) >= 0;
}

function noCollapse(summary) {
  return summary.signatureCollapse === false;
}

function foldWithin(summary, limit) {
  return Number.isFinite(Number(summary.avgPatchesPerEntry)) && summary.avgPatchesPerEntry <= limit;
}

function caseWithOutput(caseConfig, outputDir) {
  return {
    ...caseConfig,
    reportPath: path.join(outputDir, caseConfig.reportName),
  };
}

export function buildV23HeadArgs({ storedHeadCount = V23_HEADS.length } = {}) {
  const args = [];
  for (const head of V23_HEADS) {
    args.push("--head", `${head.id}=${head.model}`);
  }
  args.push("--fallback-head", "default");
  args.push("--stored-head-count", String(storedHeadCount));
  args.push("--selection-policy", "ranked-accepted-head");
  return args;
}

export function buildV23SuitePlan({ outputDir }) {
  if (!outputDir) throw new Error("Missing outputDir");
  const caseIds = [
    ...V23_PRIMARY_CASES,
    ...V23_GENERALIZATION_CASES,
    ...V23_EXTRA_CASES,
  ].map((item) => item.caseId);
  const duplicateCaseIds = caseIds.filter((caseId, index) => caseIds.indexOf(caseId) !== index);
  if (duplicateCaseIds.length) {
    throw new Error(`Duplicate v23 case ids: ${duplicateCaseIds.join(", ")}`);
  }

  return {
    heads: V23_HEADS,
    storedHeadCount: V23_HEADS.length,
    headArgs: buildV23HeadArgs(),
    primaryCases: V23_PRIMARY_CASES.map((item) => caseWithOutput(item, outputDir)),
    generalizationCases: V23_GENERALIZATION_CASES.map((item) => caseWithOutput(item, outputDir)),
    extraCases: V23_EXTRA_CASES.map((item) => caseWithOutput(item, outputDir)),
  };
}

export function evaluateV23PrimaryGate(caseConfig, report) {
  const summary = summarizeProofReport(report);
  const expectation = caseConfig.expectation;
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
    check("semantic direction", positiveSemantic(summary), {
      semanticAllPositive: summary.semanticAllPositive,
      minSemanticMargin: summary.minSemanticMargin,
    }, "all margins positive"),
    check("no signature collapse", noCollapse(summary), summary.signatureCollapse, false),
    check(
      "fold shape",
      foldWithin(summary, expectation.maxAvgPatchesPerEntry),
      summary.avgPatchesPerEntry,
      `<= ${expectation.maxAvgPatchesPerEntry}`
    ),
    check(
      "four-head ranking present",
      summary.fullHeadRanking.length >= V23_HEADS.length,
      summary.fullHeadRanking.length,
      `>= ${V23_HEADS.length}`
    ),
  ];

  return {
    caseId: caseConfig.caseId,
    gate: "v23-primary-specialist-directional",
    passed: checks.every((item) => item.passed),
    summary,
    checks,
  };
}

export function evaluateV23GeneralizationGate(caseConfig, report) {
  const summary = summarizeProofReport(report);
  const checks = [
    check("no signature collapse", noCollapse(summary), summary.signatureCollapse, false),
    check("semantic generalization", positiveSemantic(summary), {
      semanticAllPositive: summary.semanticAllPositive,
      minSemanticMargin: summary.minSemanticMargin,
    }, "all margins positive"),
  ];

  return {
    caseId: caseConfig.caseId,
    gate: "production-generalization",
    requiredForDirectionalLock: caseConfig.requiredForDirectionalLock === true,
    requiredForProductionLock: caseConfig.requiredForProductionLock !== false,
    passed: checks.every((item) => item.passed),
    summary,
    checks,
  };
}

export function evaluateV23ExtraGate(caseConfig, report) {
  const summary = summarizeProofReport(report);
  const checks = [
    check("no signature collapse", noCollapse(summary), summary.signatureCollapse, false),
    check("semantic direction", positiveSemantic(summary), {
      semanticAllPositive: summary.semanticAllPositive,
      minSemanticMargin: summary.minSemanticMargin,
    }, "all margins positive"),
  ];

  return {
    caseId: caseConfig.caseId,
    gate: "extra-controlled-surface",
    passed: checks.every((item) => item.passed),
    summary,
    checks,
  };
}

export function evaluateV23ProofSummary({
  label = "v23-four-head-ranked",
  generatedAt = new Date().toISOString(),
  lockDir = null,
  tests = {},
  primaryReportsByCase = {},
  generalizationReportsByCase = {},
  extraReportsByCase = {},
} = {}) {
  const primaryGates = Object.fromEntries(
    V23_PRIMARY_CASES.map((caseConfig) => [
      caseConfig.caseId,
      evaluateV23PrimaryGate(caseConfig, primaryReportsByCase[caseConfig.caseId]),
    ])
  );
  const generalizationGates = Object.fromEntries(
    V23_GENERALIZATION_CASES.map((caseConfig) => [
      caseConfig.caseId,
      evaluateV23GeneralizationGate(caseConfig, generalizationReportsByCase[caseConfig.caseId]),
    ])
  );
  const extraGates = Object.fromEntries(
    V23_EXTRA_CASES.map((caseConfig) => [
      caseConfig.caseId,
      evaluateV23ExtraGate(caseConfig, extraReportsByCase[caseConfig.caseId]),
    ])
  );
  const primaryPassed = Object.values(primaryGates).every((gate) => gate.passed);
  const productionGeneralizationPassed = Object.values(generalizationGates).every(
    (gate) => gate.passed
  );
  const directionalPassed =
    primaryPassed &&
    tests.passed !== false &&
    Object.values(generalizationGates)
      .filter((gate) => gate.requiredForDirectionalLock)
      .every((gate) => gate.passed);

  return {
    label,
    generatedAt,
    lockDir,
    claimLevel: directionalPassed
      ? productionGeneralizationPassed
        ? "production-candidate"
        : "directional-specialist-proof"
      : "not-locked",
    gates: {
      unitTests: tests,
      primary: primaryGates,
      generalization: generalizationGates,
      extra: extraGates,
    },
    claimsAllowed: directionalPassed
      ? [
          "The four-head ranked selector is a reproducible directional specialist proof.",
          "Book-root, governance, archive, old booklike, and mega-book ladder primary cases pass with compact fold shape.",
          "V22 is useful as a booklikeRepair specialist, not as a universal baseline.",
        ]
      : [],
    claimsNotAllowed: [
      "Production router proof unless blind/stress generalization passes.",
      "Broad tokenizer superiority over current tokenizers.",
      "99.99% raw-source reduction or Library of Congress to 1.25 GB claims.",
      "Quote and quote-paragraph semantic grouping unless those extra gates pass.",
    ],
  };
}
