import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRuntimePolicyContract,
  classifyLaneWithBloom,
  evaluateColdPathFallback,
  runV28RuntimeHardeningProbe,
  simulateSteTemperatureDecay,
} from "../core/v28-runtime-governance.mjs";

const governanceText =
  "legal hold custodians audit evidence retention policy deletion exception compliance attestation";
const quoteText =
  "quoted passage speaker attribution paragraph quotation line says remembered phrase";

test("V28 runtime contract rejects mismatched lane/head pairs before ranked selection", () => {
  const contract = buildRuntimePolicyContract({
    laneId: "governance-adversarial",
    headId: "stressSplitV26",
    text: governanceText,
  });

  assert.equal(contract.laneId, "governance-adversarial");
  assert.equal(contract.headId, "stressSplitV26");
  assert.equal(contract.accepted, false);
  assert.equal(contract.rejectReason, "head not eligible for lane");
  assert.deepEqual(contract.eligibleHeads, ["governance", "default"]);
});

test("V28 Bloom-style classifier produces deterministic lane confidence", () => {
  const first = classifyLaneWithBloom(governanceText);
  const second = classifyLaneWithBloom(governanceText);

  assert.deepEqual(second, first);
  assert.equal(first.laneId, "governance-adversarial");
  assert.equal(first.accepted, true);
  assert.ok(first.confidence >= 0.5);

  const quote = classifyLaneWithBloom(quoteText);
  assert.equal(quote.laneId, "quote");
  assert.equal(quote.accepted, true);
});

test("V28 cold-path fallback is patch-local, not whole-sequence failure", () => {
  const report = evaluateColdPathFallback({
    patches: [
      {
        id: "patch-governance",
        laneId: "governance-adversarial",
        headId: "governance",
        text: governanceText,
      },
      {
        id: "patch-unknown",
        laneId: "governance-adversarial",
        headId: "governance",
        text: "ambiguous stray tokens without lane evidence",
      },
      {
        id: "patch-quote",
        laneId: "quote",
        headId: "quoteRepair",
        text: quoteText,
      },
    ],
  });

  assert.equal(report.sequenceAccepted, true);
  assert.equal(report.fallbackUsed, true);
  assert.deepEqual(report.fallbackPatchIds, ["patch-unknown"]);
  assert.equal(report.patchDecisions.find((item) => item.patchId === "patch-governance").accepted, true);
  assert.equal(report.patchDecisions.find((item) => item.patchId === "patch-quote").accepted, true);
  assert.equal(report.patchDecisions.find((item) => item.patchId === "patch-unknown").fallbackUsed, true);
});

test("V28 STE temperature decay reduces or equals drift versus fixed hard sign", () => {
  const report = simulateSteTemperatureDecay({
    values: [-0.2, -0.04, 0.03, 0.06, -0.01, 0.18],
    perturbations: [0.05, -0.02, 0.03, -0.06],
    temperatureSchedule: [2, 1, 0.5, 0.25],
  });

  assert.deepEqual(report.temperatureSchedule, [2, 1, 0.5, 0.25]);
  assert.ok(report.driftAfter <= report.driftBefore);
  assert.equal(report.accepted, true);
});

test("runV28RuntimeHardeningProbe preserves route gates and reports required schema", () => {
  const report = runV28RuntimeHardeningProbe();

  assert.equal(report.claimLevel, "runtime-governance-proof");
  assert.equal(report.routeLeakageBlocked, true);
  assert.equal(report.coldPath.fallbackUsed, true);
  assert.ok(report.coldPath.fallbackPatchIds.length > 0);
  assert.ok(report.ste.driftAfter <= report.ste.driftBefore);
  assert.ok(report.contracts.every((item) => Array.isArray(item.eligibleHeads)));
  assert.ok(report.contracts.every((item) => typeof item.confidence === "number"));
});
