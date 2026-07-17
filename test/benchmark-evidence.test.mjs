import assert from "node:assert/strict";
import test from "node:test";

import { assessReportEvidence } from "../core/evidence-assessment.mjs";

test("marks a non-collapsed positive semantic run as directional evidence", () => {
  const assessment = assessReportEvidence({
    summary: {
      experimentalPatchesPerToken: 0.5,
    },
    semantic: {
      separation: [
        { group: "launch", separationMargin: 12 },
        { group: "storage", separationMargin: 4 },
      ],
    },
    retrieval: {
      exactNeighborRate: 0,
      lowDistanceRate: 0,
      avgNearestSignatureDistance: 64,
    },
  });

  assert.equal(assessment.resultLabel, "directional");
  assert.equal(assessment.countSignal.beatsTiktokenByPatchCount, true);
  assert.equal(assessment.semanticSignal.allMarginsPositive, true);
  assert.equal(assessment.collapseChecks.signatureCollapse, false);
});

test("marks a collapsed signature run as failed even when margins are positive", () => {
  const assessment = assessReportEvidence({
    summary: {
      experimentalPatchesPerToken: 0.5,
    },
    semantic: {
      separation: [
        { group: "launch", separationMargin: 12 },
      ],
    },
    retrieval: {
      exactNeighborRate: 0.2,
      lowDistanceRate: 0.5,
      avgNearestSignatureDistance: 4,
    },
  });

  assert.equal(assessment.resultLabel, "failed");
  assert.equal(assessment.collapseChecks.signatureCollapse, true);
  assert.match(
    assessment.claimNotSupported.join("\n"),
    /semantic superiority/
  );
});
