import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runV31LocalAttack } from "../core/v31-book-fold-attack.mjs";

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
  const out = { outputDir: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output-dir" && argv[index + 1]) out.outputDir = resolveProjectPath(argv[++index]);
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

async function writeReadme({ outputDir, summary }) {
  const suiteRows = Object.entries(summary.noMarkerSuites).map(([target, suite]) =>
    tableRow([
      target,
      suite.summary.averageSourceBpe,
      suite.summary.averageEquivalentOutputTokens,
      `${suite.summary.averageCompressionRatio}x`,
      `${suite.summary.correct}/${suite.summary.total}`,
      suite.summary.passed,
      suite.summary.ultraReductionPassed,
    ])
  );
  const gateRows = Object.entries(summary.gates).map(([gate, pass]) => tableRow([gate, pass]));
  const lines = [
    "# V31 Testing-Only Book-Fold Attack",
    "",
    `- generatedAt: \`${summary.generatedAt}\``,
    `- claimLevel: \`${summary.claimLevel}\``,
    `- ok: \`${summary.ok}\``,
    `- noDeploy: \`${summary.noDeploy}\``,
    `- noExternalCalls: \`${summary.noExternalCalls}\``,
    `- testingWorkerOnly: \`${summary.testingWorkerOnly}\``,
    "",
    "## Gates",
    "",
    tableRow(["Gate", "Pass"]),
    tableRow(["---", "---:"]),
    ...gateRows,
    "",
    "## No-Marker Suites",
    "",
    tableRow(["Target BPE", "Avg Source BPE", "Output Tokens", "Ratio", "Correct", "Pass", "99.99% Pass"]),
    tableRow(["---:", "---:", "---:", "---:", "---:", "---:", "---:"]),
    ...suiteRows,
    "",
    "## Book Fold",
    "",
    `- allMarginsPositive: \`${summary.bookFold.summary.allMarginsPositive}\``,
    `- minMargin: \`${summary.bookFold.summary.minMargin}\``,
    `- minBookSourceBpe: \`${summary.bookFold.summary.minBookSourceBpe}\``,
    `- ultraReductionPassed: \`${summary.bookFold.summary.ultraReductionPassed}\``,
    "",
    "## Read",
    "",
    "V31 is a testing-only synthetic attack harness. It does not promote production claims, does not deploy Workers, and does not call external APIs.",
    "",
    "## Artifacts",
    "",
    "- `summary.json`",
    "- `no-marker-249.json`",
    "- `no-marker-500.json`",
    "- `no-marker-707.json`",
    "- `book-fold-report.json`",
    "- `meaning-purification-audit.json`",
    "",
  ];
  await fs.writeFile(path.join(outputDir, "README.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir =
    args.outputDir || path.join(projectRoot, "bench", `fortify-${dateSlug()}-v31-book-fold-attack`);
  const summary = runV31LocalAttack();

  await fs.mkdir(outputDir, { recursive: true });
  await writeJson(path.join(outputDir, "summary.json"), {
    ...summary,
    noMarkerSuites: Object.fromEntries(
      Object.entries(summary.noMarkerSuites).map(([target, suite]) => [target, {
        schemaVersion: suite.schemaVersion,
        targetBpe: suite.targetBpe,
        entryCount: suite.entryCount,
        claimLevel: suite.claimLevel,
        summary: suite.summary,
      }])
    ),
  });
  for (const [target, suite] of Object.entries(summary.noMarkerSuites)) {
    await writeJson(path.join(outputDir, `no-marker-${target}.json`), suite);
  }
  await writeJson(path.join(outputDir, "book-fold-report.json"), summary.bookFold);
  await writeJson(path.join(outputDir, "meaning-purification-audit.json"), summary.purification);
  await writeReadme({ outputDir, summary });

  console.log(
    JSON.stringify(
      {
        ok: summary.ok,
        claimLevel: summary.claimLevel,
        outputDir: relativeProjectPath(outputDir),
        summary: relativeProjectPath(path.join(outputDir, "summary.json")),
        readme: relativeProjectPath(path.join(outputDir, "README.md")),
        gates: summary.gates,
      },
      null,
      2
    )
  );

  if (!summary.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
