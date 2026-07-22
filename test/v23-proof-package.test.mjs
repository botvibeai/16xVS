import assert from "node:assert/strict";
import test from "node:test";

import {
  buildV23SuitePlan,
  evaluateV23ProofSummary,
} from "../core/v23-proof-package.mjs";

function report({
  routeId = "default",
  lexicalSelectedHead = "default",
  selectedHead = "default",
  semanticAllPositive = true,
  minSemanticMargin = 1,
  signatureCollapse = false,
  avgPatchesPerEntry = 1,
} = {}) {
  return {
    input: "bench/example.txt",
    autoRoute: {
      routeId,
      lexicalSelectedHead,
      selectedHead,
      selectedModel: "models/example.json",
    },
    summary: {
      avgExperimentalPatchesPerEntry: avgPatchesPerEntry,
      experimentalBinaryVsSourceRatio: 0.1,
    },
    evidenceAssessment: {
      semanticSignal: {
        allMarginsPositive: semanticAllPositive,
        minSeparationMargin: minSemanticMargin,
      },
      collapseChecks: {
        signatureCollapse,
      },
    },
    headValidation: {
      fullHeadRanking: [
        { rank: 1, headId: selectedHead, accepted: true, routeFitRole: "candidate", metrics: {} },
        { rank: 2, headId: "default", accepted: true, routeFitRole: "fallback", metrics: {} },
        { rank: 3, headId: "bookRoot", accepted: true, routeFitRole: "other", metrics: {} },
        { rank: 4, headId: "governance", accepted: true, routeFitRole: "other", metrics: {} },
      ],
    },
  };
}

test("buildV23SuitePlan defines booklike as a passing booklikeRepair specialist case", () => {
  const plan = buildV23SuitePlan({ outputDir: "bench/example-v23" });
  const booklike = plan.primaryCases.find((item) => item.caseId === "booklike");

  assert.equal(plan.heads.length, 4);
  assert.equal(plan.storedHeadCount, 4);
  assert.equal(booklike.expectation.expectedSelectedHead, "booklikeRepair");
  assert.equal(booklike.expectation.requireSemanticPass, true);
  assert.equal(booklike.reportPath.endsWith("booklike-v23-four-head-ranked.json"), true);
});

test("evaluateV23ProofSummary locks directionally when primary passes and blind stress fail", () => {
  const summary = evaluateV23ProofSummary({
    label: "v23-test",
    tests: { passed: true },
    primaryReportsByCase: {
      "book-root": report({
        routeId: "bookRoot",
        lexicalSelectedHead: "bookRoot",
        selectedHead: "bookRoot",
        minSemanticMargin: 8,
        avgPatchesPerEntry: 3,
      }),
      "governance-adversarial": report({
        routeId: "governance",
        lexicalSelectedHead: "governance",
        selectedHead: "governance",
        minSemanticMargin: 3.5,
        avgPatchesPerEntry: 2.8333,
      }),
      "archive-pressure": report({
        routeId: "archive",
        lexicalSelectedHead: "governance",
        selectedHead: "governance",
        minSemanticMargin: 8,
        avgPatchesPerEntry: 3,
      }),
      booklike: report({
        routeId: "default",
        lexicalSelectedHead: "default",
        selectedHead: "booklikeRepair",
        minSemanticMargin: 7.5,
        avgPatchesPerEntry: 3,
      }),
      "mega-book-ladder": report({
        routeId: "bookRoot",
        lexicalSelectedHead: "bookRoot",
        selectedHead: "default",
        minSemanticMargin: 31,
        avgPatchesPerEntry: 2.9167,
      }),
    },
    generalizationReportsByCase: {
      "blind-holdout": report({
        semanticAllPositive: false,
        minSemanticMargin: -15.5,
      }),
      "stress-100": report({
        semanticAllPositive: false,
        minSemanticMargin: -28.6444,
      }),
    },
  });

  assert.equal(summary.claimLevel, "directional-specialist-proof");
  assert.equal(summary.gates.primary.booklike.passed, true);
  assert.equal(summary.gates.generalization["blind-holdout"].passed, false);
  assert.match(summary.claimsNotAllowed.join("\n"), /production/i);
});
