import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createLearnedEncoderAdapter } from "../core/learned-encoder.mjs";
import { runBenchmark } from "./benchmark.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function resolveProjectPath(target) {
  if (!target) return null;
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function parseArgs(argv) {
  const out = {
    input: null,
    output: null,
    semantic: null,
    perturbation: null,
    limit: null,
    encoderModel: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input" && argv[index + 1]) {
      out.input = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--semantic" && argv[index + 1]) {
      out.semantic = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--perturbation" && argv[index + 1]) {
      out.perturbation = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--encoder-model" && argv[index + 1]) {
      out.encoderModel = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--limit" && argv[index + 1]) {
      const value = Number(argv[index + 1]);
      out.limit = Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : null;
      index += 1;
    }
  }

  if (!out.input) {
    throw new Error("Missing --input");
  }
  if (!out.output) {
    throw new Error("Missing --output");
  }
  if (!out.encoderModel) {
    throw new Error("Missing --encoder-model");
  }

  return out;
}

function patchHistogram(samples) {
  const histogram = new Map();
  for (const sample of samples) {
    histogram.set(
      sample.experimentalPatchCount,
      (histogram.get(sample.experimentalPatchCount) || 0) + 1
    );
  }
  return Array.from(histogram.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([patchCount, entries]) => ({ patchCount, entries }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const model = JSON.parse(await fs.readFile(args.encoderModel, "utf8"));
  const encoder = createLearnedEncoderAdapter(model);

  const report = await runBenchmark({
    input: args.input,
    output: args.output,
    semantic: args.semantic,
    perturbation: args.perturbation,
    limit: args.limit,
    encoder,
  });

  const singlePatchCount = report.samples.filter(
    (sample) => sample.experimentalPatchCount === 1
  ).length;

  console.log(
    JSON.stringify(
      {
        ok: true,
        input: relativeProjectPath(args.input),
        output: relativeProjectPath(args.output),
        encoderModel: relativeProjectPath(args.encoderModel),
        entries: report.summary.entries,
        patchesPerToken: report.summary.experimentalPatchesPerToken,
        avgPatchesPerEntry: report.summary.avgExperimentalPatchesPerEntry,
        singlePatchCount,
        singlePatchRate: report.summary.entries
          ? Number((singlePatchCount / report.summary.entries).toFixed(4))
          : 0,
        patchHistogram: patchHistogram(report.samples),
        semanticAllPositive:
          report.evidenceAssessment?.semanticSignal?.allMarginsPositive ?? null,
        minSemanticMargin:
          report.evidenceAssessment?.semanticSignal?.minSeparationMargin ?? null,
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
