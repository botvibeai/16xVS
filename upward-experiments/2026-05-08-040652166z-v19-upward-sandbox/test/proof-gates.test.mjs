import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProofSummary,
  evaluateGeneralizationGate,
  evaluatePrimaryGate,
} from "../core/proof-gates.mjs";

function routedReport({
  routeId = "bookRoot",
  lexicalSelectedHead = "bookRoot",
  selectedHead = "bookRoot",
  semanticAllPositive = true,
  minSemanticMargin = 8,
  signatureCollapse = false,
  avgPatchesPerEntry = 3,
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
      experimentalBinaryVsSourceRatio: 0.05,
    },
    evidenceAssessment: {
      resultLabel: semanticAllPositive && !signatureCollapse ? "directional" : "failed",
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
        { rank: 1, headId: "bookRoot", accepted: true, routeFitRole: "candidate", metrics: {} },
        { rank: 2, headId: "default", accepted: true, routeFitRole: "fallback", metrics: {} },
        { rank: 3, headId: "governance", accepted: false, routeFitRole: "other", metrics: {} },
      ],
    },
  };
}

test("evaluatePrimaryGate accepts the book-root directional lock shape", () => {
  const gate = evaluatePrimaryGate("book-root", routedReport());

  assert.equal(gate.passed, true);
  assert.equal(gate.summary.selectedHead, "bookRoot");
});

test("evaluatePrimaryGate treats booklike as a preserved known semantic failure", () => {
  const gate = evaluatePrimaryGate(
    "booklike",
    routedReport({
      routeId: "default",
      lexicalSelectedHead: "default",
      selectedHead: "default",
      semanticAllPositive: false,
      minSemanticMargin: -18.5,
    })
  );

  assert.equal(gate.passed, true);
  assert.match(
    gate.checks.find((item) => item.name === "known semantic failure preserved").expected,
    /negative semantic margin/i
  );
});

test("evaluateGeneralizationGate fails semantic generalization cleanly", () => {
  const gate = evaluateGeneralizationGate(
    "blind-holdout",
    routedReport({
      routeId: "default",
      lexicalSelectedHead: "default",
      selectedHead: "default",
      semanticAllPositive: false,
      minSemanticMargin: -12,
    })
  );

  assert.equal(gate.passed, false);
  assert.equal(gate.requiredForDirectionalLock, false);
  assert.equal(gate.requiredForProductionLock, true);
});

test("buildProofSummary locks directionally without production generalization", () => {
  const reportsByCase = {
    "book-root": routedReport(),
    "governance-adversarial": routedReport({
      routeId: "governance",
      lexicalSelectedHead: "governance",
      selectedHead: "governance",
      minSemanticMargin: 3.5,
      avgPatchesPerEntry: 2.8333,
    }),
    "archive-pressure": routedReport({
      routeId: "archive",
      lexicalSelectedHead: "governance",
      selectedHead: "governance",
    }),
    booklike: routedReport({
      routeId: "default",
      lexicalSelectedHead: "default",
      selectedHead: "default",
      semanticAllPositive: false,
      minSemanticMargin: -18.5,
    }),
    "mega-book-ladder": routedReport({
      routeId: "bookRoot",
      lexicalSelectedHead: "bookRoot",
      selectedHead: "default",
      minSemanticMargin: 31,
      avgPatchesPerEntry: 2.9167,
    }),
  };
  const summary = buildProofSummary({
    reportsByCase,
    generalizationReportsByCase: {
      "blind-holdout": routedReport({
        routeId: "default",
        lexicalSelectedHead: "default",
        selectedHead: "default",
        semanticAllPositive: false,
        minSemanticMargin: -12,
      }),
    },
    tests: { passed: true },
  });

  assert.equal(summary.claimLevel, "directional-proof-lock");
  assert.match(summary.claimsNotAllowed.join("\n"), /99\.99%/);
});
