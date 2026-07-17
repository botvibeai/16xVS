import assert from "node:assert/strict";
import test from "node:test";

import {
  rankValidatedHeads,
  selectValidatedHead,
  validateHeadReport,
} from "../core/head-validator.mjs";

function report({
  resultLabel = "directional",
  allMarginsPositive = true,
  signatureCollapse = false,
  minSeparationMargin = 8,
  avgNearestSignatureDistance = 32,
  ladderAllPositive = null,
} = {}) {
  return {
    evidenceAssessment: {
      resultLabel,
      semanticSignal: {
        hasSemanticRun: true,
        allMarginsPositive,
        minSeparationMargin,
      },
      collapseChecks: {
        signatureCollapse,
        avgNearestSignatureDistance,
      },
    },
    megaBookLadder:
      ladderAllPositive === null
        ? null
        : {
            summary: {
              allRootChapterMarginsPositive: ladderAllPositive,
              minRootChapterMargin: ladderAllPositive ? 12 : -2,
            },
          },
  };
}

test("validateHeadReport accepts a non-collapsed positive semantic report", () => {
  const validation = validateHeadReport(report());

  assert.equal(validation.accepted, true);
  assert.deepEqual(validation.reasons, []);
});

test("validateHeadReport rejects collapse even when semantic margins are positive", () => {
  const validation = validateHeadReport(
    report({
      signatureCollapse: true,
      avgNearestSignatureDistance: 15.5,
      minSeparationMargin: 33,
      ladderAllPositive: true,
    })
  );

  assert.equal(validation.accepted, false);
  assert.match(validation.reasons.join("\n"), /signature collapse/i);
});

test("selectValidatedHead falls back when the routed specialist fails validation", () => {
  const selected = selectValidatedHead({
    candidateHeadId: "bookRoot",
    fallbackHeadId: "default",
    reportsByHead: {
      bookRoot: report({ signatureCollapse: true, avgNearestSignatureDistance: 15.5 }),
      default: report({ minSeparationMargin: 31, avgNearestSignatureDistance: 21 }),
    },
  });

  assert.equal(selected.selectedHeadId, "default");
  assert.equal(selected.candidateValidation.accepted, false);
  assert.equal(selected.fallbackValidation.accepted, true);
});

test("selectValidatedHead keeps the routed specialist when it passes validation", () => {
  const selected = selectValidatedHead({
    candidateHeadId: "governance",
    fallbackHeadId: "default",
    reportsByHead: {
      governance: report({ minSeparationMargin: 3.5, avgNearestSignatureDistance: 49.5 }),
      default: report({ minSeparationMargin: 2, avgNearestSignatureDistance: 24 }),
    },
  });

  assert.equal(selected.selectedHeadId, "governance");
  assert.equal(selected.candidateValidation.accepted, true);
});

test("rankValidatedHeads ranks all configured heads by safety before route fit", () => {
  const ranking = rankValidatedHeads({
    candidateHeadId: "bookRoot",
    fallbackHeadId: "default",
    reportsByHead: {
      bookRoot: report({
        signatureCollapse: true,
        minSeparationMargin: 40,
        avgNearestSignatureDistance: 10,
      }),
      default: report({
        minSeparationMargin: 31,
        avgNearestSignatureDistance: 21,
      }),
      governance: report({
        minSeparationMargin: 12,
        avgNearestSignatureDistance: 49,
      }),
    },
  });

  assert.deepEqual(
    ranking.map((item) => item.headId),
    ["default", "governance", "bookRoot"]
  );
  assert.equal(ranking[0].routeFitRole, "fallback");
  assert.equal(ranking[2].accepted, false);
  assert.match(ranking[2].reasons.join("\n"), /collapse/i);
});

test("rankValidatedHeads keeps route fit as metadata when candidate also passes", () => {
  const ranking = rankValidatedHeads({
    candidateHeadId: "governance",
    fallbackHeadId: "default",
    reportsByHead: {
      governance: report({
        minSeparationMargin: 8,
        avgNearestSignatureDistance: 49,
      }),
      default: report({
        minSeparationMargin: 4,
        avgNearestSignatureDistance: 30,
      }),
    },
  });

  assert.equal(ranking[0].headId, "governance");
  assert.equal(ranking[0].routeFitRole, "candidate");
  assert.equal(ranking[0].accepted, true);
});
