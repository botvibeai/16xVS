import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createLearnedEncoderAdapter } from "../core/learned-encoder.mjs";
import {
  buildV27FoldLineageFixture,
  evaluateFoldLineage,
} from "../core/v27-fold-lineage.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_MODEL =
  "./models/learned-hybrid-prototype-v10-constrained-merge-hierarchical-packer-v2.json";

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function dateSlug(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const out = {
    outputDir: null,
    model: resolveProjectPath(DEFAULT_MODEL),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output-dir" && argv[index + 1]) {
      out.outputDir = resolveProjectPath(argv[++index]);
    } else if (arg === "--model" && argv[index + 1]) {
      out.model = resolveProjectPath(argv[++index]);
    }
  }

  return out;
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function tableRow(values) {
  return `| ${values.map((value) => String(value ?? "")).join(" | ")} |`;
}

function metric(value) {
  return Number.isFinite(Number(value)) ? String(value) : "";
}

async function writeReadme({ outputDir, model, report }) {
  const lines = [
    "# V27 Fold-Lineage Audit",
    "",
    `- generatedAt: \`${report.generatedAt}\``,
    `- model: \`${relativeProjectPath(model)}\``,
    `- allMarginsPositive: \`${report.summary.allMarginsPositive}\``,
    `- cloudmersive: \`disabled; optional external audit only\``,
    "",
    "## Level Summary",
    "",
    tableRow(["Level", "Parents", "Min Margin", "Avg Margin", "Avg Patch Count", "Residual Count"]),
    tableRow(["---", "---:", "---:", "---:", "---:", "---:"]),
    ...Object.entries(report.summary.parentLevels).map(([level, item]) =>
      tableRow([
        level,
        metric(item.parentCount),
        metric(item.minMargin),
        metric(item.avgMargin),
        metric(item.avgPatchCount),
        metric(item.residualCount),
      ])
    ),
    "",
    "## Interpretation",
    "",
    "This audit treats the top folded token as a routing/root handle. It checks whether chapter, book, and mega parents stay closer to their own child lineage than to outside semantic lineages.",
    "",
    "Cloudmersive perceptual image hash endpoints are intentionally not called here. They can be added later as an external skipped/optional audit if explicitly approved.",
    "",
  ];
  await fs.writeFile(path.join(outputDir, "README.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir =
    args.outputDir || path.join(projectRoot, "bench", `fortify-${dateSlug()}-v27-fold-lineage`);
  const fixturePath = path.join(outputDir, "fixture.json");
  const reportPath = path.join(outputDir, "fold-lineage-report.json");
  const summaryPath = path.join(outputDir, "summary.json");
  const model = JSON.parse(await fs.readFile(args.model, "utf8"));
  const encoder = createLearnedEncoderAdapter(model);
  const fixture = buildV27FoldLineageFixture();
  const report = evaluateFoldLineage({
    nodes: fixture.nodes,
    encoder,
  });
  const summary = {
    label: "v27-fold-lineage-audit",
    generatedAt: report.generatedAt,
    outputDir: relativeProjectPath(outputDir),
    model: relativeProjectPath(args.model),
    claimLevel: report.summary.allMarginsPositive ? "fold-lineage-proof" : "fold-lineage-failed",
    allMarginsPositive: report.summary.allMarginsPositive,
    minMargin: report.summary.minMargin,
    avgMargin: report.summary.avgMargin,
    cloudmersive: {
      enabled: false,
      note: "Cloudmersive perceptual image similarity remains optional external audit only; this probe makes no network calls.",
    },
    report: relativeProjectPath(reportPath),
    fixture: relativeProjectPath(fixturePath),
  };

  await writeJson(fixturePath, fixture);
  await writeJson(reportPath, report);
  await writeJson(summaryPath, summary);
  await writeReadme({ outputDir, model: args.model, report });

  console.log(
    JSON.stringify(
      {
        ok: report.summary.allMarginsPositive,
        outputDir: relativeProjectPath(outputDir),
        claimLevel: summary.claimLevel,
        minMargin: report.summary.minMargin,
        avgMargin: report.summary.avgMargin,
        summary: relativeProjectPath(summaryPath),
        report: relativeProjectPath(reportPath),
      },
      null,
      2
    )
  );

  if (!report.summary.allMarginsPositive) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
