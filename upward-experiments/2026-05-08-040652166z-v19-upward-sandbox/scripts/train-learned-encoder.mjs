import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildTrainingDataset } from "../core/training-pipeline.mjs";
import { trainLearnedEncoder } from "../core/learned-encoder.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function parseArgs(argv) {
  const out = {
    input: path.join(projectRoot, "data", "training", "embedding-training-pairs.json"),
    output: path.join(projectRoot, "models", "learned-feature-prototype.json"),
    dimensions: 256,
    epochs: 36,
    learningRate: 0.05,
    negativeMargin: 0.15,
    seed: 17,
    learnedBlendWeight: 1,
    heuristicBlendWeight: 0,
    prototypeLearningRate: 0,
    prototypeNegativeMargin: 0.2,
    prototypeNegativesPerItem: 2,
    packingMode: null,
    maxWordsPerPatch: null,
    maxCharsPerPatch: null,
    maxEntryWordsForSinglePatch: null,
    maxEntryCharsForSinglePatch: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input" && argv[index + 1]) {
      out.input = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--dimensions" && argv[index + 1]) {
      out.dimensions = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--epochs" && argv[index + 1]) {
      out.epochs = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--learning-rate" && argv[index + 1]) {
      out.learningRate = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--negative-margin" && argv[index + 1]) {
      out.negativeMargin = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--seed" && argv[index + 1]) {
      out.seed = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--learned-blend-weight" && argv[index + 1]) {
      out.learnedBlendWeight = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--heuristic-blend-weight" && argv[index + 1]) {
      out.heuristicBlendWeight = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--prototype-learning-rate" && argv[index + 1]) {
      out.prototypeLearningRate = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--prototype-negative-margin" && argv[index + 1]) {
      out.prototypeNegativeMargin = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--prototype-negatives-per-item" && argv[index + 1]) {
      out.prototypeNegativesPerItem = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--packing-mode" && argv[index + 1]) {
      out.packingMode = String(argv[index + 1]);
      index += 1;
    } else if (arg === "--max-words-per-patch" && argv[index + 1]) {
      out.maxWordsPerPatch = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--max-chars-per-patch" && argv[index + 1]) {
      out.maxCharsPerPatch = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--max-entry-words" && argv[index + 1]) {
      out.maxEntryWordsForSinglePatch = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--max-entry-chars" && argv[index + 1]) {
      out.maxEntryCharsForSinglePatch = Number(argv[index + 1]);
      index += 1;
    }
  }

  return out;
}

function buildPatchConfig(args) {
  if (!args.packingMode) {
    return null;
  }

  const patchConfig = {
    packingMode: args.packingMode,
  };

  if (Number.isFinite(args.maxWordsPerPatch)) {
    patchConfig.maxWordsPerPatch = args.maxWordsPerPatch;
  }
  if (Number.isFinite(args.maxCharsPerPatch)) {
    patchConfig.maxCharsPerPatch = args.maxCharsPerPatch;
  }
  if (Number.isFinite(args.maxEntryWordsForSinglePatch)) {
    patchConfig.maxEntryWordsForSinglePatch = args.maxEntryWordsForSinglePatch;
  }
  if (Number.isFinite(args.maxEntryCharsForSinglePatch)) {
    patchConfig.maxEntryCharsForSinglePatch = args.maxEntryCharsForSinglePatch;
  }

  return patchConfig;
}

async function loadDataset(inputPath) {
  const raw = JSON.parse(await fs.readFile(inputPath, "utf8"));
  if (Array.isArray(raw.positives) || Array.isArray(raw.negatives)) {
    return raw;
  }
  return buildTrainingDataset(raw);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dataset = await loadDataset(args.input);
  const patchConfig = buildPatchConfig(args);
  const model = trainLearnedEncoder(dataset, {
    dimensions: args.dimensions,
    epochs: args.epochs,
    learningRate: args.learningRate,
    negativeMargin: args.negativeMargin,
    seed: args.seed,
    learnedBlendWeight: args.learnedBlendWeight,
    heuristicBlendWeight: args.heuristicBlendWeight,
    prototypeLearningRate: args.prototypeLearningRate,
    prototypeNegativeMargin: args.prototypeNegativeMargin,
    prototypeNegativesPerItem: args.prototypeNegativesPerItem,
    patchConfig,
  });

  const output = {
    generatedAt: new Date().toISOString(),
    source: relativeProjectPath(args.input),
    ...model,
  };

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        input: relativeProjectPath(args.input),
        output: relativeProjectPath(args.output),
        stage: model.stage,
        trainingSummary: model.trainingSummary,
        dimensions: model.dimensions,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
