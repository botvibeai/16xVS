import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  buildTrainingDataset,
  buildSuitePlan,
} from "../core/training-pipeline.mjs";

test("buildTrainingDataset creates positive pairs and explicit hard negatives", () => {
  const dataset = buildTrainingDataset({
    groups: [
      {
        id: "launch_training",
        items: [
          "deployment readiness checklist",
          "release go-live review",
          "production rollout prep",
        ],
      },
      {
        id: "planning_training",
        items: [
          "persistent execution outline",
          "state-aware workflow plan",
        ],
      },
    ],
    hardNegativeGroupPairs: [
      ["launch_training", "planning_training"],
    ],
  });

  assert.equal(dataset.summary.groupCount, 2);
  assert.equal(dataset.summary.itemCount, 5);
  assert.equal(dataset.summary.positivePairCount, 4);
  assert.equal(dataset.summary.negativePairCount, 6);
  assert.equal(dataset.positives[0].label, "positive");
  assert.equal(dataset.negatives[0].label, "negative");
  assert.equal(
    new Set(dataset.positives.map((pair) => pair.pairKey)).size,
    dataset.positives.length
  );
  assert.equal(
    new Set(dataset.negatives.map((pair) => pair.pairKey)).size,
    dataset.negatives.length
  );
});

test("buildTrainingDataset rejects duplicate group ids", () => {
  assert.throws(
    () =>
      buildTrainingDataset({
        groups: [
          { id: "launch_training", items: ["a", "b"] },
          { id: "launch_training", items: ["c", "d"] },
        ],
        hardNegativeGroupPairs: [],
      }),
    /Duplicate group id/
  );
});

test("buildTrainingDataset can generate all cross-group negatives with deterministic sampling", () => {
  const dataset = buildTrainingDataset({
    groups: [
      { id: "a", items: ["a1", "a2", "a3"] },
      { id: "b", items: ["b1", "b2", "b3"] },
      { id: "c", items: ["c1", "c2", "c3"] },
    ],
    negativeMode: "all-cross",
    negativeSampleLimitPerPair: 4,
  });

  assert.equal(dataset.summary.negativeMode, "all-cross");
  assert.equal(dataset.summary.positivePairCount, 9);
  assert.equal(dataset.summary.negativePairCount, 12);
  assert.equal(new Set(dataset.negatives.map((pair) => pair.pairKey)).size, 12);
});

test("buildTrainingDataset can include explicit text negative pairs", () => {
  const dataset = buildTrainingDataset({
    groups: [
      { id: "a", items: ["a1", "a2"] },
      { id: "b", items: ["b1", "b2"] },
    ],
    explicitNegativePairs: [
      {
        left: "held out quote",
        right: "confusing outside quote",
        sourceId: "quote",
        group: "truth_quotes",
      },
    ],
  });

  assert.equal(dataset.summary.explicitNegativePairCount, 1);
  assert.equal(dataset.summary.negativePairCount, 1);
  assert.deepEqual(dataset.negatives, [
    {
      label: "negative",
      leftGroupId: "explicit:quote:truth_quotes",
      rightGroupId: "explicit:quote:truth_quotes",
      left: "held out quote",
      right: "confusing outside quote",
      pairKey: "confusing outside quote|||held out quote",
      sourceId: "quote",
      group: "truth_quotes",
      reason: "explicit-negative-pair",
    },
  ]);
});

test("buildSuitePlan resolves output files for each frozen benchmark suite", () => {
  const plan = buildSuitePlan(
    {
      suites: [
        {
          id: "phrase_controlled",
          input: "bench/phrase-corpus.txt",
          semantic: "bench/semantic-phrases.json",
          perturbation: "bench/perturbation-phrases.json",
          frozen: true,
        },
        {
          id: "blind_holdout",
          input: "bench/blind-holdout-2026-04-20.txt",
          semantic: "bench/blind-holdout-semantic-2026-04-20.json",
          frozen: true,
        },
      ],
    },
    "C:\\repo\\bench\\suite-out"
  );

  assert.equal(plan.length, 2);
  assert.equal(
    plan[0].output,
    path.join("C:\\repo\\bench\\suite-out", "phrase_controlled-report.json")
  );
  assert.equal(plan[1].semantic.endsWith("blind-holdout-semantic-2026-04-20.json"), true);
});

test("buildSuitePlan rejects duplicate suite ids", () => {
  assert.throws(
    () =>
      buildSuitePlan(
        {
          suites: [
            { id: "same", input: "bench/a.txt", frozen: true },
            { id: "same", input: "bench/b.txt", frozen: true },
          ],
        },
        "C:\\tmp\\out"
      ),
    /Duplicate suite id/
  );
});
