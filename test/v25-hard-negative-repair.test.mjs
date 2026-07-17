import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  buildMinedHardNegativeTrainingSpec,
  extractNearestOutsideConfusionPairs,
} from "../core/v25-hard-negative-miner.mjs";
import { buildV25ProbeSuitePlan } from "../core/v25-proof-probe.mjs";

test("extractNearestOutsideConfusionPairs extracts deterministic confusion pairs", () => {
  const report = {
    semantic: {
      separation: [
        {
          group: "truth_quotes",
          separationMargin: -9.6,
          examples: [
            {
              text: "Say the plain thing.",
              nearestOutside: {
                text: "Wait, then move.",
                signatureDistance: 59,
              },
            },
            {
              text: "Truth survives delay.",
              nearestOutside: {
                text: "Choose the hard truth.",
                signatureDistance: 56,
              },
            },
          ],
        },
        {
          group: "craft_quotes",
          separationMargin: -12.8,
          examples: [
            {
              text: "Measure twice, ship once.",
              nearestOutside: {
                text: "Finish what you begin.",
                signatureDistance: 59,
              },
            },
          ],
        },
      ],
    },
  };

  const pairs = extractNearestOutsideConfusionPairs(report, {
    sourceId: "quote",
    maxPairsPerGroup: 1,
  });

  assert.deepEqual(pairs, [
    {
      sourceId: "quote",
      group: "craft_quotes",
      left: "Measure twice, ship once.",
      right: "Finish what you begin.",
      signatureDistance: 59,
      separationMargin: -12.8,
    },
    {
      sourceId: "quote",
      group: "truth_quotes",
      left: "Say the plain thing.",
      right: "Wait, then move.",
      signatureDistance: 59,
      separationMargin: -9.6,
    },
  ]);
});

test("extractNearestOutsideConfusionPairs rejects malformed reports", () => {
  assert.throws(
    () => extractNearestOutsideConfusionPairs({}, { sourceId: "bad" }),
    /semantic separation/
  );
});

test("buildMinedHardNegativeTrainingSpec adds direct negatives without holdout positives", () => {
  const spec = buildMinedHardNegativeTrainingSpec({
    baseSpec: {
      version: 24,
      groups: [
        {
          id: "existing_training",
          items: ["existing alpha", "existing beta"],
        },
      ],
      hardNegativeGroupPairs: [],
    },
    confusionPairs: [
      {
        sourceId: "quote",
        group: "truth_quotes",
        left: "Say the plain thing.",
        right: "Wait, then move.",
        signatureDistance: 59,
        separationMargin: -9.6,
      },
    ],
  });

  const positiveItems = spec.groups.flatMap((group) => group.items);
  assert.equal(positiveItems.includes("Say the plain thing."), false);
  assert.equal(positiveItems.includes("Wait, then move."), false);
  assert.deepEqual(spec.explicitNegativePairs, [
    {
      left: "Say the plain thing.",
      right: "Wait, then move.",
      sourceId: "quote",
      group: "truth_quotes",
      reason: "nearest-outside-confusion",
    },
  ]);
});

test("buildV25ProbeSuitePlan includes repair targets and v23 primary lanes", () => {
  const plan = buildV25ProbeSuitePlan({
    outputDir: path.join("C:\\tmp", "v25"),
    v25Model: "./models/v25.json",
  });
  const primaryIds = plan.primaryCases.map((item) => item.caseId);
  const targetIds = plan.targetCases.map((item) => item.caseId);

  assert.deepEqual(primaryIds, [
    "book-root",
    "governance-adversarial",
    "archive-pressure",
    "booklike",
    "mega-book-ladder",
  ]);
  assert.deepEqual(targetIds, ["quote", "quote-paragraph", "blind-holdout", "stress-100"]);
  assert.equal(plan.heads.at(-1).id, "quoteRepairV25");
  assert.equal(plan.storedHeadCount, 6);
});
