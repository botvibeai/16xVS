import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildV30CommercialFixture,
  buildV30CommercialGapReport,
  evaluateV30CommercialBaseline,
} from "../core/v30-commercial-baseline.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

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
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output-dir" && argv[index + 1]) {
      out.outputDir = resolveProjectPath(argv[++index]);
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

function buildSummary({ outputDir, fixturePath, evaluationPath, gapReportPath, evaluation, gapReport }) {
  return {
    title: "V30 Commercial Token-Reduction Baseline",
    generatedAt: evaluation.generatedAt,
    outputDir: relativeProjectPath(outputDir),
    claimLevel: evaluation.claimLevel,
    fixture: relativeProjectPath(fixturePath),
    evaluation: relativeProjectPath(evaluationPath),
    gapReport: relativeProjectPath(gapReportPath),
    entryCount: evaluation.summary.entryCount,
    averageSourceBpe: evaluation.summary.averageSourceBpe,
    averageEquivalentOutputTokens: evaluation.summary.averageEquivalentOutputTokens,
    averageCompressionRatio: evaluation.summary.averageCompressionRatio,
    averageReductionPercent: evaluation.summary.averageReductionPercent,
    correctness: evaluation.correctness,
    targets: evaluation.targets,
    compresr226xMath: gapReport.compresr226xMath,
    noDeploy: true,
    noExternalCalls: true,
    read:
      "V30 is a local commercial-baseline proof harness. It tests a 100-entry 200-240 BPE fixture, counts residual/cold-path tokens against compression, and reports the gap to 2x, 10x, 20x, and 226x references.",
  };
}

async function writeReadme({ outputDir, summary, gapReport }) {
  const lines = [
    "# V30 Commercial Token-Reduction Baseline",
    "",
    `- generatedAt: \`${summary.generatedAt}\``,
    `- claimLevel: \`${summary.claimLevel}\``,
    `- entryCount: \`${summary.entryCount}\``,
    `- averageSourceBpe: \`${summary.averageSourceBpe}\``,
    `- averageEquivalentOutputTokens: \`${summary.averageEquivalentOutputTokens}\``,
    `- averageCompressionRatio: \`${summary.averageCompressionRatio}x\``,
    `- correctness: \`${summary.correctness.correct}/${summary.correctness.total}\``,
    `- noDeploy: \`${summary.noDeploy}\``,
    `- noExternalCalls: \`${summary.noExternalCalls}\``,
    "",
    "## Gates",
    "",
    tableRow(["Gate", "Max Output Tokens", "Pass"]),
    tableRow(["---", "---:", "---:"]),
    ...Object.entries(summary.targets).map(([id, target]) =>
      tableRow([id, target.maxEquivalentOutputTokens, target.pass])
    ),
    "",
    "## Commercial Gap",
    "",
    tableRow(["Baseline", "Ratio", "Apples-to-Apples", "Delta", "Beats"]),
    tableRow(["---", "---:", "---:", "---:", "---:"]),
    ...gapReport.baselineDeltas.map((baseline) =>
      tableRow([
        baseline.id,
        `${baseline.ratio}x`,
        baseline.applesToApples,
        `${baseline.deltaRatio}x`,
        baseline.beats,
      ])
    ),
    "",
    "## 226x Math",
    "",
    `- sourceTokensForOneTokenToBeat: \`${summary.compresr226xMath.sourceTokensForOneTokenToBeat}\``,
    `- sourceTokensForOneTokenToBeatBy10Percent: \`${summary.compresr226xMath.sourceTokensForOneTokenToBeatBy10Percent}\``,
    `- sourceTokensForOneTokenToBeatBy20Percent: \`${summary.compresr226xMath.sourceTokensForOneTokenToBeatBy20Percent}\``,
    `- target220To1Beats226x: \`${summary.compresr226xMath.target220To1Beats226x}\``,
    "",
    "## Artifacts",
    "",
    "- `fixture.json`",
    "- `evaluation.json`",
    "- `commercial-gap-report.json`",
    "- `summary.json`",
    "",
    "## Read",
    "",
    summary.read,
    "",
  ];
  await fs.writeFile(path.join(outputDir, "README.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir =
    args.outputDir || path.join(projectRoot, "bench", `fortify-${dateSlug()}-v30-commercial-baseline`);
  const fixturePath = path.join(outputDir, "fixture.json");
  const evaluationPath = path.join(outputDir, "evaluation.json");
  const gapReportPath = path.join(outputDir, "commercial-gap-report.json");
  const summaryPath = path.join(outputDir, "summary.json");

  const fixture = buildV30CommercialFixture();
  const evaluation = evaluateV30CommercialBaseline({ entries: fixture });
  const gapReport = buildV30CommercialGapReport({ evaluation });
  const summary = buildSummary({
    outputDir,
    fixturePath,
    evaluationPath,
    gapReportPath,
    evaluation,
    gapReport,
  });

  await fs.mkdir(outputDir, { recursive: true });
  await writeJson(fixturePath, fixture);
  await writeJson(evaluationPath, evaluation);
  await writeJson(gapReportPath, gapReport);
  await writeJson(summaryPath, summary);
  await writeReadme({ outputDir, summary, gapReport });

  const ok =
    evaluation.correctness.correct === 100 &&
    evaluation.correctness.total === 100 &&
    evaluation.targets.P0.pass &&
    evaluation.targets.P1.pass &&
    evaluation.targets.P2.pass;

  console.log(
    JSON.stringify(
      {
        ok,
        outputDir: relativeProjectPath(outputDir),
        claimLevel: evaluation.claimLevel,
        averageSourceBpe: evaluation.summary.averageSourceBpe,
        averageEquivalentOutputTokens: evaluation.summary.averageEquivalentOutputTokens,
        averageCompressionRatio: evaluation.summary.averageCompressionRatio,
        correctness: `${evaluation.correctness.correct}/${evaluation.correctness.total}`,
        summary: relativeProjectPath(summaryPath),
        evaluation: relativeProjectPath(evaluationPath),
        gapReport: relativeProjectPath(gapReportPath),
        readme: relativeProjectPath(path.join(outputDir, "README.md")),
      },
      null,
      2
    )
  );

  if (!ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
