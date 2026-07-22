import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildMinedHardNegativeTrainingSpec,
  extractNearestOutsideConfusionPairs,
} from "../core/v25-hard-negative-miner.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_REPORTS = [
  {
    sourceId: "quote",
    report: "./bench/fortify-2026-05-16-v24-quote-repair/quote-v24-quote-repair.json",
    maxPairsPerGroup: 2,
  },
  {
    sourceId: "quote-paragraph",
    report:
      "./bench/fortify-2026-05-16-v24-quote-repair/quote-paragraph-v24-quote-repair.json",
    maxPairsPerGroup: 2,
  },
  {
    sourceId: "blind-holdout",
    report: "./bench/fortify-2026-05-16-v24-quote-repair/blind-holdout-v24-quote-repair.json",
    maxPairsPerGroup: 2,
  },
  {
    sourceId: "stress-100",
    report: "./bench/fortify-2026-05-16-v24-quote-repair/stress-100-v24-quote-repair.json",
    maxPairsPerGroup: 2,
  },
];

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function parseReportArg(value) {
  const splitAt = String(value || "").indexOf("=");
  if (splitAt <= 0) {
    throw new Error("Invalid --report value; expected sourceId=path.");
  }
  return {
    sourceId: value.slice(0, splitAt),
    report: value.slice(splitAt + 1),
    maxPairsPerGroup: 2,
  };
}

function parseArgs(argv) {
  const out = {
    baseSpec: "./data/training/embedding-training-spec-v24-quote-repair.json",
    output: "./data/training/embedding-training-spec-v25-hard-negative-repair.json",
    reports: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-spec" && argv[index + 1]) {
      out.baseSpec = argv[++index];
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = argv[++index];
    } else if (arg === "--report" && argv[index + 1]) {
      out.reports.push(parseReportArg(argv[++index]));
    }
  }

  if (out.reports.length === 0) out.reports = DEFAULT_REPORTS;
  return out;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseSpecPath = resolveProjectPath(args.baseSpec);
  const outputPath = resolveProjectPath(args.output);
  const baseSpec = await readJson(baseSpecPath);
  const confusionPairs = [];
  const minedReports = [];

  for (const reportConfig of args.reports) {
    const reportPath = resolveProjectPath(reportConfig.report);
    const report = await readJson(reportPath);
    const pairs = extractNearestOutsideConfusionPairs(report, {
      sourceId: reportConfig.sourceId,
      maxPairsPerGroup: reportConfig.maxPairsPerGroup,
    });
    confusionPairs.push(...pairs);
    minedReports.push({
      sourceId: reportConfig.sourceId,
      report: relativeProjectPath(reportPath),
      pairCount: pairs.length,
    });
  }

  const outputSpec = buildMinedHardNegativeTrainingSpec({
    baseSpec,
    confusionPairs,
  });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(outputSpec, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseSpec: relativeProjectPath(baseSpecPath),
        output: relativeProjectPath(outputPath),
        minedReports,
        groupCount: outputSpec.groups.length,
        explicitNegativePairCount: outputSpec.explicitNegativePairs.length,
        minedGroupCount: outputSpec.targetedRound.minedGroupCount,
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
