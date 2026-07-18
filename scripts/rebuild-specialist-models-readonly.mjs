import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { trainLearnedEncoder } from "../core/learned-encoder.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "recovery", "specialist-model-rebuild-manifest.json");

function parseArgs(argv) {
  const out = {
    headIds: [],
    outputRoot: path.join(projectRoot, "recovery-output", "rebuilt-models"),
    stopAfterFailures: 2,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--head" && argv[index + 1]) out.headIds.push(String(argv[++index]));
    else if (arg === "--output-root" && argv[index + 1]) out.outputRoot = path.resolve(argv[++index]);
    else if (arg === "--stop-after-failures" && argv[index + 1]) out.stopAfterFailures = Number(argv[++index]);
  }
  if (!Number.isInteger(out.stopAfterFailures) || out.stopAfterFailures < 1) {
    throw new Error("--stop-after-failures must be a positive integer");
  }
  return out;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .filter((key) => key !== "generatedAt")
      .sort()
      .map((key) => [key, stableValue(value[key])])
  );
}

function stableHash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function summaryMatches(actual, expected) {
  const mismatches = [];
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (actual?.[key] !== expectedValue) {
      mismatches.push({ key, expected: expectedValue, actual: actual?.[key] ?? null });
    }
  }
  return { pass: mismatches.length === 0, mismatches };
}

async function rebuildHead(head, commonTraining, outputDir) {
  const inputPath = path.join(projectRoot, head.trainingPairs);
  if (!(await pathExists(inputPath))) {
    return { id: head.id, status: "missing-input", input: head.trainingPairs };
  }

  const dataset = await readJson(inputPath);
  const startedAt = new Date().toISOString();
  const trained = trainLearnedEncoder(dataset, {
    ...commonTraining,
    patchConfig: null,
  });
  const summaryCheck = summaryMatches(trained.trainingSummary, head.expectedTrainingSummary);
  const candidate = {
    generatedAt: new Date().toISOString(),
    source: head.trainingPairs,
    ...trained,
    variantName: "hierarchical-packer-v2",
    patchConfig: { ...head.patchConfig },
  };
  const candidateHash = stableHash(candidate);

  const originalPath = path.join(projectRoot, head.originalPath);
  let recoveredOriginal = null;
  if (await pathExists(originalPath)) {
    const original = await readJson(originalPath);
    const originalHash = stableHash(original);
    recoveredOriginal = {
      path: head.originalPath,
      stableSha256: originalHash,
      exactStableMatch: originalHash === candidateHash,
    };
  }

  const result = {
    id: head.id,
    modelName: head.modelName,
    status: summaryCheck.pass ? "rebuilt-summary-match" : "rebuilt-summary-mismatch",
    startedAt,
    finishedAt: new Date().toISOString(),
    input: head.trainingPairs,
    evidenceReport: head.evidenceReport,
    expectedTrainingSummary: head.expectedTrainingSummary,
    actualTrainingSummary: trained.trainingSummary,
    summaryCheck,
    patchConfig: head.patchConfig,
    stableSha256: candidateHash,
    recoveredOriginal,
  };

  await fs.mkdir(outputDir, { recursive: true });
  const resultPath = path.join(outputDir, `${head.id}-result.json`);
  await fs.writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  if (summaryCheck.pass) {
    const candidatePath = path.join(outputDir, `${head.modelName}.json`);
    if (await pathExists(candidatePath)) throw new Error(`refusing to overwrite ${candidatePath}`);
    await fs.writeFile(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
    result.candidatePath = path.relative(projectRoot, candidatePath).replace(/\\/g, "/");
  }

  return result;
}

export async function rebuildSpecialistModels(options = {}) {
  const args = {
    headIds: options.headIds || [],
    outputRoot: path.resolve(options.outputRoot || path.join(projectRoot, "recovery-output", "rebuilt-models")),
    stopAfterFailures: options.stopAfterFailures ?? 2,
  };
  const manifest = await readJson(manifestPath);
  const selected = args.headIds.length > 0
    ? manifest.heads.filter((head) => args.headIds.includes(head.id))
    : manifest.heads;
  const unknown = args.headIds.filter((id) => !manifest.heads.some((head) => head.id === id));
  if (unknown.length > 0) throw new Error(`unknown head ids: ${unknown.join(", ")}`);

  const runDir = path.join(args.outputRoot, timestamp());
  const results = [];
  let failureCount = 0;
  for (const head of selected) {
    const result = await rebuildHead(head, manifest.commonTraining, runDir);
    results.push(result);
    if (result.status !== "rebuilt-summary-match") failureCount += 1;
    if (failureCount >= args.stopAfterFailures) break;
  }

  const report = {
    schemaVersion: "16xvs-specialist-rebuild-run-v1",
    generatedAt: new Date().toISOString(),
    policy: {
      sourceModelsOverwritten: false,
      outputRoot: path.relative(projectRoot, runDir).replace(/\\/g, "/"),
      stopAfterFailures: args.stopAfterFailures,
    },
    requestedHeads: selected.map((head) => head.id),
    completedHeads: results.map((result) => result.id),
    stoppedEarly: results.length < selected.length,
    failureCount,
    allCompletedMatch: results.length === selected.length && failureCount === 0,
    results,
  };
  await fs.mkdir(runDir, { recursive: true });
  await fs.writeFile(path.join(runDir, "rebuild-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await rebuildSpecialistModels(args);
  console.log(JSON.stringify(report, null, 2));
  if (!report.allCompletedMatch) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 1;
  });
}
