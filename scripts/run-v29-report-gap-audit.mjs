import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildV29GapAudit, normalizeReportText } from "../core/v29-report-gap-audit.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const defaultReportPath = "C:\\Users\\BotVi\\Downloads\\16xVS 6-13-2026.md";

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
    report: defaultReportPath,
    outputDir: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--report" && argv[index + 1]) {
      out.report = argv[++index];
    } else if (arg === "--output-dir" && argv[index + 1]) {
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

function statusRows(summary) {
  return Object.entries(summary.statusCounts).map(([status, count]) =>
    tableRow([status, count])
  );
}

async function writeReadme({ outputDir, summary, audit }) {
  const lines = [
    "# V29 Report Gap Audit",
    "",
    `- generatedAt: \`${summary.generatedAt}\``,
    `- claimLevel: \`${summary.claimLevel}\``,
    `- source: \`${summary.source.path}\``,
    `- rawSha256: \`${summary.source.rawSha256}\``,
    `- noDeploy: \`${summary.noDeploy}\``,
    `- noExternalCalls: \`${summary.noExternalCalls}\``,
    "",
    "## Section Detection",
    "",
    `- detectedSections: \`${summary.sections.detectedSectionIds.join(", ")}\``,
    `- missingSections: \`${summary.sections.missingSectionIds.join(", ") || "none"}\``,
    `- architectureItems: \`${summary.sections.architectureItems.length}\``,
    "",
    "## Claim Status Counts",
    "",
    tableRow(["Status", "Count"]),
    tableRow(["---", "---:"]),
    ...statusRows(summary),
    "",
    "## Claims Not Allowed Yet",
    "",
    ...audit.claimsNotAllowed.map((claim) => `- \`${claim.id}\`: ${claim.reason}`),
    "",
    "## Artifacts",
    "",
    "- `raw-report.md`",
    "- `normalized-report.md`",
    "- `gap-audit.json`",
    "- `summary.json`",
    "",
    "## Read",
    "",
    summary.read,
    "",
  ];
  await fs.writeFile(path.join(outputDir, "README.md"), `${lines.join("\n")}\n`, "utf8");
}

function buildSummary({ outputDir, rawPath, normalizedPath, auditPath, audit }) {
  return {
    title: "V29 Report Gap Audit",
    generatedAt: audit.generatedAt,
    outputDir: relativeProjectPath(outputDir),
    claimLevel: audit.claimLevel,
    source: audit.source,
    rawReport: relativeProjectPath(rawPath),
    normalizedReport: relativeProjectPath(normalizedPath),
    audit: relativeProjectPath(auditPath),
    sections: audit.sections,
    statusCounts: audit.summary.statusCounts,
    claimsNotAllowedCount: audit.claimsNotAllowed.length,
    noDeploy: audit.summary.noDeploy,
    noExternalCalls: audit.summary.noExternalCalls,
    read:
      "V29 maps the supplied report to current evidence. It is an audit layer only and does not implement deferred report ideas.",
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourcePath = args.report;
  const rawText = await fs.readFile(sourcePath, "utf8");
  const normalizedText = normalizeReportText(rawText);
  const outputDir =
    args.outputDir || path.join(projectRoot, "bench", `fortify-${dateSlug()}-v29-report-gap-audit`);
  const rawPath = path.join(outputDir, "raw-report.md");
  const normalizedPath = path.join(outputDir, "normalized-report.md");
  const auditPath = path.join(outputDir, "gap-audit.json");
  const summaryPath = path.join(outputDir, "summary.json");
  const audit = buildV29GapAudit({
    rawText,
    sourcePath,
  });
  const summary = buildSummary({ outputDir, rawPath, normalizedPath, auditPath, audit });

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(rawPath, rawText, "utf8");
  await fs.writeFile(normalizedPath, `${normalizedText}\n`, "utf8");
  await writeJson(auditPath, audit);
  await writeJson(summaryPath, summary);
  await writeReadme({ outputDir, summary, audit });

  const ok = audit.claimLevel === "evidence-governance-gap-audit";
  console.log(
    JSON.stringify(
      {
        ok,
        outputDir: relativeProjectPath(outputDir),
        claimLevel: audit.claimLevel,
        summary: relativeProjectPath(summaryPath),
        audit: relativeProjectPath(auditPath),
        readme: relativeProjectPath(path.join(outputDir, "README.md")),
      },
      null,
      2
    )
  );

  if (!ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
