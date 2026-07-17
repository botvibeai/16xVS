import assert from "node:assert/strict";
import test from "node:test";

import { selectRankedValidatedHead } from "../core/head-validator.mjs";
import {
  V27_ROUTE_POLICY,
  resolveEligibleHeadsForLane,
  selectRouteGatedValidatedHead,
} from "../core/v27-route-gate.mjs";

function report({ minSeparationMargin = 1, allMarginsPositive = true, signatureCollapse = false } = {}) {
  return {
    evidenceAssessment: {
      semanticSignal: {
        hasSemanticRun: true,
        allMarginsPositive,
        minSeparationMargin,
      },
      collapseChecks: {
        signatureCollapse,
        avgNearestSignatureDistance: 32,
      },
    },
    summary: {
      avgExperimentalPatchesPerEntry: 2.8333,
      experimentalBinaryVsSourceRatio: 0.1,
    },
  };
}

test("V27 policy quarantines repair heads to their owned lanes", () => {
  assert.deepEqual(resolveEligibleHeadsForLane("governance-adversarial"), [
    "governance",
    "default",
  ]);
  assert.deepEqual(resolveEligibleHeadsForLane("quote"), [
    "quoteRepair",
    "quoteSplitV26",
    "default",
  ]);
  assert.deepEqual(resolveEligibleHeadsForLane("blind-holdout"), [
    "blindSplitV26",
    "default",
  ]);
  assert.deepEqual(resolveEligibleHeadsForLane("stress-100"), [
    "stressSplitV26",
    "default",
  ]);
  assert.deepEqual(resolveEligibleHeadsForLane("not-a-known-lane"), ["default"]);
  assert.equal(V27_ROUTE_POLICY["mega-book-ladder"].expectedSelectedHead, "default");
});

test("unrestricted V26 ranking reproduces the governance leak", () => {
  const reportsByHead = {
    governance: report({ minSeparationMargin: 3.5 }),
    stressSplitV26: report({ minSeparationMargin: 4.5 }),
    blindSplitV26: report({ minSeparationMargin: 1.5 }),
    default: report({ minSeparationMargin: -1, allMarginsPositive: false }),
  };

  const selected = selectRankedValidatedHead({
    candidateHeadId: "governance",
    fallbackHeadId: "default",
    reportsByHead,
  });

  assert.equal(selected.selectedHeadId, "stressSplitV26");
  assert.equal(selected.legacySelection.selectedHeadId, "governance");
});

test("route-gated V27 ranking blocks the V26 governance leak", () => {
  const reportsByHead = {
    governance: report({ minSeparationMargin: 3.5 }),
    stressSplitV26: report({ minSeparationMargin: 4.5 }),
    blindSplitV26: report({ minSeparationMargin: 1.5 }),
    default: report({ minSeparationMargin: -1, allMarginsPositive: false }),
  };

  const selected = selectRouteGatedValidatedHead({
    laneId: "governance-adversarial",
    candidateHeadId: "governance",
    fallbackHeadId: "default",
    reportsByHead,
  });

  assert.equal(selected.selectedHeadId, "governance");
  assert.equal(selected.policy, "v27-route-gated-ranked");
  assert.deepEqual(selected.routeGate.eligibleHeads, ["governance", "default"]);
  assert.ok(selected.routeGate.blockedHeads.includes("stressSplitV26"));
  assert.equal(selected.fullHeadRanking[0].headId, "stressSplitV26");
  assert.equal(selected.eligibleHeadRanking[0].headId, "governance");
});

test("unknown V27 lanes fall back to locked default instead of global repair heads", () => {
  const selected = selectRouteGatedValidatedHead({
    laneId: "unknown-lane",
    candidateHeadId: "default",
    fallbackHeadId: "default",
    reportsByHead: {
      default: report({ minSeparationMargin: -12, allMarginsPositive: false }),
      quoteSplitV26: report({ minSeparationMargin: 9 }),
      stressSplitV26: report({ minSeparationMargin: 8 }),
    },
  });

  assert.equal(selected.selectedHeadId, "default");
  assert.deepEqual(selected.routeGate.eligibleHeads, ["default"]);
  assert.deepEqual(selected.eligibleHeadRanking.map((item) => item.headId), ["default"]);
});

