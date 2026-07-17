import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function ensureNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseArgs(argv) {
  const out = {
    reports: [],
    output: path.join(projectRoot, "bench", "storage-projection-latest.json"),
    targetOutputGb: 1.25,
    denseVectorBytes: 6144,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--report" && argv[index + 1]) {
      out.reports.push(resolveProjectPath(argv[index + 1]));
      index += 1;
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--target-output-gb" && argv[index + 1]) {
      out.targetOutputGb = ensureNumber(argv[index + 1], out.targetOutputGb);
      index += 1;
    } else if (arg === "--dense-vector-bytes" && argv[index + 1]) {
      out.denseVectorBytes = ensureNumber(argv[index + 1], out.denseVectorBytes);
      index += 1;
    }
  }

  if (out.reports.length === 0) {
    throw new Error("At least one --report path is required.");
  }

  return out;
}

function bytesToGb(bytes) {
  return bytes / (1024 ** 3);
}

function round(value, digits = 4) {
  return Number(value.toFixed(digits));
}

function assessRawCompression(ratio) {
  if (ratio <= 0.0001) return "proven";
  if (ratio < 1) return "directional";
  return "failed";
}

async function loadReport(reportPath) {
  const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
  const summary = report.summary || {};
  const dimensions =
    report.experimentalEncoder?.dimensions ||
    report.samples?.[0]?.experimentalBsqDimensions ||
    256;
  const binaryCodeBytes = Math.ceil(dimensions / 8);

  return {
    path: reportPath,
    input: report.input || null,
    entries: summary.entries || 0,
    sourceBytes: summary.sourceBytes || 0,
    experimentalBinaryBytes: summary.experimentalBinaryBytes || 0,
    experimentalPatchCount: summary.experimentalPatchCount || 0,
    avgExperimentalPatchesPerEntry: summary.avgExperimentalPatchesPerEntry || 0,
    experimentalPatchesPerToken: summary.experimentalPatchesPerToken || 0,
    experimentalBinaryVsSourceRatio: summary.experimentalBinaryVsSourceRatio || 0,
    dimensions,
    binaryCodeBytes,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const reports = await Promise.all(args.reports.map(loadReport));

  const aggregate = reports.reduce(
    (totals, report) => {
      totals.entries += report.entries;
      totals.sourceBytes += report.sourceBytes;
      totals.experimentalBinaryBytes += report.experimentalBinaryBytes;
      totals.experimentalPatchCount += report.experimentalPatchCount;
      return totals;
    },
    {
      entries: 0,
      sourceBytes: 0,
      experimentalBinaryBytes: 0,
      experimentalPatchCount: 0,
    }
  );

  const aggregateRatio =
    aggregate.sourceBytes > 0
      ? aggregate.experimentalBinaryBytes / aggregate.sourceBytes
      : 0;
  const aggregateReductionPercent = round((1 - aggregateRatio) * 100, 4);
  const aggregateAvgPatchesPerEntry =
    aggregate.entries > 0
      ? round(aggregate.experimentalPatchCount / aggregate.entries, 4)
      : 0;
  const inputGbToReachTargetOutput =
    aggregateRatio > 0 ? round(args.targetOutputGb / aggregateRatio, 4) : null;

  const binaryCodeBytes = reports[0]?.binaryCodeBytes || 32;
  const denseVectorReduction =
    args.denseVectorBytes > 0
      ? 1 - binaryCodeBytes / args.denseVectorBytes
      : 0;

  const output = {
    generatedAt: new Date().toISOString(),
    reports: reports.map((report) => ({
      report: relativeProjectPath(report.path),
      input: report.input,
      entries: report.entries,
      sourceBytes: report.sourceBytes,
      experimentalBinaryBytes: report.experimentalBinaryBytes,
      experimentalPatchCount: report.experimentalPatchCount,
      avgExperimentalPatchesPerEntry: report.avgExperimentalPatchesPerEntry,
      experimentalPatchesPerToken: report.experimentalPatchesPerToken,
      experimentalBinaryVsSourceRatio: report.experimentalBinaryVsSourceRatio,
      binaryCodeBytes: report.binaryCodeBytes,
    })),
    aggregate: {
      entries: aggregate.entries,
      sourceBytes: aggregate.sourceBytes,
      sourceGb: round(bytesToGb(aggregate.sourceBytes), 8),
      experimentalBinaryBytes: aggregate.experimentalBinaryBytes,
      experimentalBinaryGb: round(bytesToGb(aggregate.experimentalBinaryBytes), 8),
      experimentalPatchCount: aggregate.experimentalPatchCount,
      avgPatchesPerEntry: aggregateAvgPatchesPerEntry,
      rawBinaryVsSourceRatio: round(aggregateRatio, 6),
      rawReductionPercent: aggregateReductionPercent,
      rawCompressionAssessment: assessRawCompression(aggregateRatio),
      projectedOutputGbPerInputGb: round(aggregateRatio, 6),
      inputGbNeededForTargetOutputGb: inputGbToReachTargetOutput,
      targetOutputGb: args.targetOutputGb,
    },
    denseVectorComparison: {
      baselineVectorBytes: args.denseVectorBytes,
      binaryCodeBytes,
      reductionPercentPerCode: round(denseVectorReduction * 100, 4),
      assessment: "directional",
      caution:
        "This compares one 256-bit binary code to one dense float32 vector. It is not the same claim as raw-source compression.",
    },
    claims: {
      rawTextCompression99_99Percent: {
        assessment: aggregateRatio <= 0.0001 ? "proven" : "failed",
        note:
          "Using current reports, raw-source storage does not approach 99.99% reduction.",
      },
      rawTextTo1_25Gb: {
        assessment: aggregateRatio < 1 ? "directional" : "failed",
        note:
          inputGbToReachTargetOutput === null
            ? "Current reports do not provide enough signal."
            : `At the current aggregate ratio, an input corpus larger than ${inputGbToReachTargetOutput} GB would exceed ${args.targetOutputGb} GB of binary output.`,
      },
      denseVectorStorageReduction: {
        assessment: "directional",
        note:
          "If a storage layer can replace one 1536-float32 vector with one 256-bit code, the byte reduction is large, but this remains a theoretical storage-model comparison in this repo.",
      },
    },
  };

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        output: relativeProjectPath(args.output),
        aggregate: output.aggregate,
        denseVectorComparison: output.denseVectorComparison,
        claims: output.claims,
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
