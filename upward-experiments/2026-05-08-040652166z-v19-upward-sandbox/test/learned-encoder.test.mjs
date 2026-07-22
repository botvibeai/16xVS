import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runBenchmark } from "../scripts/benchmark.mjs";
import {
  createLearnedEncoderAdapter,
  evaluateModelOnPair,
  trainLearnedEncoder,
} from "../core/learned-encoder.mjs";
import { tokenizeExperimentalVisualPatches } from "../core/experimental-tokenizer.mjs";

test("trainLearnedEncoder improves seen positive similarity over seen negative similarity", () => {
  const dataset = {
    summary: {},
    groups: [],
    positives: [
      {
        label: "positive",
        groupId: "launch_training",
        left: "release readiness checklist",
        right: "deployment go-live plan",
        pairKey: "a",
      },
      {
        label: "positive",
        groupId: "storage_training",
        left: "triple copy retention plan",
        right: "secondary archive replication",
        pairKey: "b",
      },
    ],
    negatives: [
      {
        label: "negative",
        leftGroupId: "launch_training",
        rightGroupId: "storage_training",
        left: "release readiness checklist",
        right: "secondary archive replication",
        pairKey: "c",
      },
      {
        label: "negative",
        leftGroupId: "launch_training",
        rightGroupId: "storage_training",
        left: "deployment go-live plan",
        right: "triple copy retention plan",
        pairKey: "d",
      },
    ],
  };

  const model = trainLearnedEncoder(dataset, {
    dimensions: 64,
    epochs: 20,
    learningRate: 0.08,
    negativeMargin: 0.2,
    seed: 7,
  });

  const positiveEval = evaluateModelOnPair(
    model,
    "release readiness checklist",
    "deployment go-live plan"
  );
  const negativeEval = evaluateModelOnPair(
    model,
    "release readiness checklist",
    "secondary archive replication"
  );

  assert.equal(model.dimensions, 64);
  assert.ok(positiveEval.similarity > negativeEval.similarity);
  assert.equal(positiveEval.left.signatureHex.length, 16);
  assert.equal(negativeEval.left.signatureHex.length, 16);
});

test("runBenchmark can evaluate a learned encoder adapter", async () => {
  const dataset = {
    summary: {},
    groups: [],
    positives: [
      {
        label: "positive",
        groupId: "retrieval_training",
        left: "exact hamming retrieval",
        right: "binary glyph lookup",
        pairKey: "p1",
      },
    ],
    negatives: [
      {
        label: "negative",
        leftGroupId: "retrieval_training",
        rightGroupId: "password_training",
        left: "exact hamming retrieval",
        right: "forgot password recovery",
        pairKey: "n1",
      },
    ],
  };

  const model = trainLearnedEncoder(dataset, {
    dimensions: 64,
    epochs: 12,
    learningRate: 0.08,
    seed: 11,
  });

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "16xvs-learned-test-"));
  const inputPath = path.join(tempDir, "tiny-corpus.txt");
  const outputPath = path.join(tempDir, "tiny-report.json");

  await fs.writeFile(
    inputPath,
    "exact hamming retrieval\nbinary glyph lookup\nforgot password recovery\n",
    "utf8"
  );

  const report = await runBenchmark({
    input: inputPath,
    output: outputPath,
    encoder: createLearnedEncoderAdapter(model),
  });

  assert.equal(report.experimentalEncoder.stage, "learned-feature-prototype");
  assert.equal(report.summary.entries, 3);
  assert.equal(report.samples[0].experimentalBsqDimensions, 64);
});

test("createLearnedEncoderAdapter marks hybrid mode when heuristic blending is enabled", () => {
  const dataset = {
    summary: {},
    groups: [],
    positives: [
      {
        label: "positive",
        groupId: "launch_training",
        left: "release readiness checklist",
        right: "launch approval checklist",
        pairKey: "h1",
      },
    ],
    negatives: [
      {
        label: "negative",
        leftGroupId: "launch_training",
        rightGroupId: "finance_training",
        left: "release readiness checklist",
        right: "margin improvement roadmap",
        pairKey: "h2",
      },
    ],
  };

  const model = trainLearnedEncoder(dataset, {
    dimensions: 64,
    epochs: 8,
    learningRate: 0.05,
    heuristicBlendWeight: 0.6,
    learnedBlendWeight: 1,
    seed: 13,
  });

  const adapter = createLearnedEncoderAdapter(model);
  const signature = adapter.signature("launch approval checklist");

  assert.equal(adapter.metadata.stage, "learned-hybrid-prototype");
  assert.equal(adapter.metadata.heuristicBlendWeight, 0.6);
  assert.equal(signature.signatureHex.length, 16);
});

test("tokenizeExperimentalVisualPatches can collapse an entry into one patch in entry mode", () => {
  const tokenized = tokenizeExperimentalVisualPatches(
    "Clear language removes excuses; when the description sharpens, the decision becomes obvious.",
    {
      packingMode: "entry",
      maxEntryWordsForSinglePatch: 32,
      maxEntryCharsForSinglePatch: 160,
      maxWordsPerPatch: 32,
      maxCharsPerPatch: 160,
    }
  );

  assert.equal(tokenized.patchCount, 1);
  assert.equal(tokenized.patches[0].startsWith("Clear language"), true);
});

test("model patchConfig changes learned patch count without breaking signatures", () => {
  const dataset = {
    summary: {},
    groups: [],
    positives: [
      {
        label: "positive",
        groupId: "craft_training",
        left: "Clear language removes excuses.",
        right: "A direct sentence exposes a weak plan.",
        pairKey: "pc1",
      },
    ],
    negatives: [
      {
        label: "negative",
        leftGroupId: "craft_training",
        rightGroupId: "support_training",
        left: "Clear language removes excuses.",
        right: "Recover account access now.",
        pairKey: "pc2",
      },
    ],
  };

  const model = trainLearnedEncoder(dataset, {
    dimensions: 64,
    epochs: 8,
    learningRate: 0.05,
    heuristicBlendWeight: 0.6,
    learnedBlendWeight: 1,
    patchConfig: {
      packingMode: "entry",
      maxEntryWordsForSinglePatch: 32,
      maxEntryCharsForSinglePatch: 160,
      maxWordsPerPatch: 32,
      maxCharsPerPatch: 160,
    },
    seed: 23,
  });

  const adapter = createLearnedEncoderAdapter(model);
  const signature = adapter.signature(
    "Clear language removes excuses; when the description sharpens, the decision becomes obvious."
  );

  assert.equal(adapter.metadata.patchConfig.packingMode, "entry");
  assert.equal(signature.patchCount, 1);
  assert.equal(signature.signatureHex.length, 16);
});

test("tokenizeExperimentalVisualPatches can use hierarchical packing for longer entries", () => {
  const text =
    "The storage layer keeps live writes immediate, pushes a secondary copy to fallback, and preserves a long-term vault copy so repair never starts from zero. " +
    "The benchmark ledger records the current result, the failure log preserves what broke, and the snapshot flow keeps the evidence from disappearing between iterations.";
  const tokenized = tokenizeExperimentalVisualPatches(
    text,
    {
      packingMode: "hierarchical",
      maxEntryWordsForSinglePatch: 12,
      maxEntryCharsForSinglePatch: 80,
      maxResidualPatches: 2,
      residualMaxWordsPerPatch: 10,
      residualMaxCharsPerPatch: 72,
    }
  );

  assert.equal(tokenized.patchCount, 3);
  assert.equal(tokenized.patches[0].length < text.length, true);
  assert.equal(tokenized.patches[0].includes("storage"), true);
  assert.equal(tokenized.patches[0].includes("vault"), true);
  assert.equal(new Set(tokenized.patches).size, 3);
});
