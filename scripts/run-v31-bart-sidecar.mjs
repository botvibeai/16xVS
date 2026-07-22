import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  V31_TESTING_ONLY_CLOUDFLARE,
  buildV31BartSidecarReport,
} from "../core/v31-book-fold-attack.mjs";

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

async function writeReadme({ outputDir, report }) {
  const lines = [
    "# V31 BART Sidecar Safety Report",
    "",
    `- generatedAt: \`${report.generatedAt}\``,
    `- model: \`${report.model}\``,
    `- executed: \`${report.executed}\``,
    `- noExternalCalls: \`${report.noExternalCalls}\``,
    `- testingOnlyOk: \`${report.testingOnly.ok}\``,
    `- ok: \`${report.ok}\``,
    "",
    "## Read",
    "",
    report.reason,
    "",
    "This command is intentionally testing-only and no-external-call by default.",
    "",
  ];
  await fs.writeFile(path.join(outputDir, "README.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir =
    args.outputDir || path.join(projectRoot, "bench", `fortify-${dateSlug()}-v31-bart-sidecar`);
  const configPath = path.join(projectRoot, V31_TESTING_ONLY_CLOUDFLARE.configPath);
  const testingConfig = JSON.parse(await fs.readFile(configPath, "utf8"));
  const report = buildV31BartSidecarReport({ testingConfig });

  await fs.mkdir(outputDir, { recursive: true });
  await writeJson(path.join(outputDir, "bart-sidecar-report.json"), report);
  await writeReadme({ outputDir, report });

  console.log(
    JSON.stringify(
      {
        ok: report.ok,
        executed: report.executed,
        noExternalCalls: report.noExternalCalls,
        outputDir: relativeProjectPath(outputDir),
        report: relativeProjectPath(path.join(outputDir, "bart-sidecar-report.json")),
        readme: relativeProjectPath(path.join(outputDir, "README.md")),
      },
      null,
      2
    )
  );

  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
