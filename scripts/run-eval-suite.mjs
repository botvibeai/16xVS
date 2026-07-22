import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildSuitePlan } from "../core/training-pipeline.mjs";
import { createLearnedEncoderAdapter } from "../core/learned-encoder.mjs";
import { runBenchmark } from "./benchmark.mjs";

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
    manifest: path.join(projectRoot, "data", "eval", "frozen-eval-suite.json"),
    outputDir: path.join(projectRoot, "bench", "eval-suite-latest"),
    encoderModel: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--manifest" && argv[index + 1]) {
      out.manifest = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--output-dir" && argv[index + 1]) {
      out.outputDir = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--encoder-model" && argv[index + 1]) {
      out.encoderModel = resolveProjectPath(argv[index + 1]);
      index += 1;
    }
  }

  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(await fs.readFile(args.manifest, "utf8"));
  const plan = buildSuitePlan(manifest, args.outputDir);
  const encoderModel = args.encoderModel
    ? JSON.parse(await fs.readFile(args.encoderModel, "utf8"))
    : null;
  const encoder = encoderModel ? createLearnedEncoderAdapter(encoderModel) : null;

  await fs.mkdir(args.outputDir, { recursive: true });

  const suites = [];
  for (const suite of plan) {
    const report = await runBenchmark({
      input: resolveProjectPath(suite.input),
      output: suite.output,
      limit: suite.limit,
      semantic: suite.semantic ? resolveProjectPath(suite.semantic) : null,
      perturbation: suite.perturbation ? resolveProjectPath(suite.perturbation) : null,
      encoder,
    });

    suites.push({
      id: suite.id,
      label: suite.label,
      input: relativeProjectPath(resolveProjectPath(suite.input)),
      output: relativeProjectPath(suite.output),
      evidenceLabel: report.evidenceAssessment?.resultLabel || null,
      encoderStage: report.experimentalEncoder?.stage || null,
      patchesPerToken: report.summary?.experimentalPatchesPerToken ?? null,
      allSemanticMarginsPositive: report.evidenceAssessment?.semanticSignal?.allMarginsPositive ?? null,
      signatureCollapse: report.evidenceAssessment?.collapseChecks?.signatureCollapse ?? null,
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    manifest: relativeProjectPath(args.manifest),
    encoderModel: args.encoderModel ? relativeProjectPath(args.encoderModel) : null,
    suiteCount: suites.length,
    suites,
  };

  const summaryPath = path.join(args.outputDir, "suite-summary.json");
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        manifest: relativeProjectPath(args.manifest),
        encoderModel: args.encoderModel ? relativeProjectPath(args.encoderModel) : null,
        outputDir: relativeProjectPath(args.outputDir),
        suiteCount: suites.length,
        summary: relativeProjectPath(summaryPath),
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
