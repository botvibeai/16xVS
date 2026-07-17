import assert from "node:assert/strict";
import test from "node:test";

import {
  V30_ONE_PATCH_ENCODER_CONFIG,
  buildV30CommercialFixture,
  evaluateV30CommercialBaseline,
} from "../core/v30-commercial-baseline.mjs";

test("V30 pressure gate rejects collapsed identical signatures instead of overclaiming", () => {
  const collapsedEntries = buildV30CommercialFixture().map((entry) => ({
    ...entry,
    text:
      "shared collapsed commercial baseline text with no group-specific route handle and no useful lineage separation.",
    bpeTokens: 220,
  }));

  const evaluation = evaluateV30CommercialBaseline({ entries: collapsedEntries });

  assert.equal(evaluation.correctness.correct, 0);
  assert.equal(evaluation.correctness.tiedOrWrong.length, 100);
  assert.equal(evaluation.targets.P0.pass, false);
  assert.equal(evaluation.targets.P1.pass, false);
  assert.equal(evaluation.targets.P2.pass, false);
  assert.equal(evaluation.claimLevel, "failed-commercial-baseline-proof");
});

test("V30 pressure gate counts residual patch cost against the one-token claim", () => {
  const evaluation = evaluateV30CommercialBaseline({
    entries: buildV30CommercialFixture(),
    encoderConfig: {
      ...V30_ONE_PATCH_ENCODER_CONFIG,
      packingMode: "window",
      maxWordsPerPatch: 3,
      maxCharsPerPatch: 18,
    },
  });

  assert.ok(evaluation.summary.averageEquivalentOutputTokens > 1);
  assert.equal(evaluation.targets.P2.pass, false);
});
