import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { buildProofSummary } from "../core/proof-gates.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const HEAD_ARGS = [
  "--head",
  "default=./models/learned-hybrid-prototype-v10-constrained-merge-hierarchical-packer-v2.json",
  "--head",
  "bookRoot=./models/learned-hybrid-prototype-v8-control-bridge-hierarchical-packer-v2.json",
  "--head",
  "governance=./models/learned-hybrid-prototype-v13-balanced-triad-hierarchical-packer-v2.json",
  "--fallback-head",
  "default",
  "--stored-head-count",
  "3",
];

const PRIMARY_CASES = [
  {
    caseId: "book-root",
    input: "./bench/book-root-corpus-2026-05-06.txt",
    semantic: "./bench/book-root-semantic-2026-05-06.json",
    reportName: "book-root-v19-validated-routed.json",
  },
  {
    caseId: "governance-adversarial",
    input: "./bench/governance-adversarial-holdout-2026-04-29.txt",
    semantic: "./bench/governance-adversarial-semantic-2026-04-29.json",
    reportName: "governance-adversarial-v19-validated-routed.json",
  },
  {
    caseId: "archive-pressure",
    input: "./bench/archive-pressure-corpus-2026-04-29.txt",
    semantic: "./bench/archive-pressure-semantic-2026-04-29.json",
    reportName: "archive-pressure-v19-validated-routed.json",
  },
  {
    caseId: "booklike",
    input: "./bench/booklike-corpus-2026-04-25.txt",
    semantic: "./bench/booklike-semantic-2026-04-25.json",
    reportName: "booklike-v19-validated-routed.json",
  },
  {
    caseId: "mega-book-ladder",
    input: "./bench/mega-book-ladder-corpus-2026-05-07.txt",
    semantic: "./bench/mega-book-ladder-semantic-2026-05-07.json",
    reportName: "mega-book-ladder-v19-validated-routed.json",
  },
];

const GENERALIZATION_CASES = [
  {
    caseId: "blind-holdout",
    input: "./bench/blind-holdout-2026-04-20.txt",
    semantic: "./bench/blind-holdout-semantic-2026-04-20.json",
    reportName: "blind-holdout-v19-validated-routed.json",
  },
  {
    caseId: "stress-100",
    input: "./bench/stress-100-phrases-2026-04-23.txt",
    semantic: "./bench/stress-100-groups-2026-04-23.json",
    reportName: "stress-100-v19-validated-routed.json",
  },
];

function resolveProjectPath(target) {
  if (!target) return null;
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "").replace("T", "-").replace("Z", "z");
}

function parseArgs(argv) {
  const out = {
    label: "v19-lock",
    outputDir: null,
    skipTests: false,
    skipBench: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--label" && argv[index + 1]) {
      out.label = argv[++index];
    } else if (arg === "--output-dir" && argv[index + 1]) {
      out.outputDir = resolveProjectPath(argv[++index]);
    } else if (arg === "--skip-tests") {
      out.skipTests = true;
    } else if (arg === "--skip-bench") {
      out.skipBench = true;
    }
  }

  return out;
}

async function runNodeScript({ label, args, logDir }) {
  await fs.mkdir(logDir, { recursive: true });
  const logPath = path.join(logDir, `${slug(label)}.log`);
  const startedAt = new Date().toISOString();

  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const chunks = [];

    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      chunks.push(Buffer.from(chunk));
    });
    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
      chunks.push(Buffer.from(chunk));
    });
    child.on("error", reject);
    child.on("close", async (code) => {
      const endedAt = new Date().toISOString();
      const output = Buffer.concat(chunks).toString("utf8");
      const record = [
        `label=${label}`,
        `startedAt=${startedAt}`,
        `endedAt=${endedAt}`,
        `exitCode=${code}`,
        "",
        output,
      ].join("\n");
      await fs.writeFile(logPath, record, "utf8");
      const result = {
        label,
        args,
        log: relativeProjectPath(logPath),
        exitCode: code,
        startedAt,
        endedAt,
      };
      if (code === 0) {
        resolve(result);
      } else {
        const error = new Error(`${label} failed with exit code ${code}. See ${result.log}`);
        error.result = result;
        reject(error);
      }
    });
  });
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function validatedRoutingArgs({ input, semantic, output }) {
  return [
    "./scripts/run-validated-routing-benchmark.mjs",
    "--input",
    input,
    "--semantic",
    semantic,
    "--output",
    output,
    ...HEAD_ARGS,
  ];
}

function tableRow(values) {
  return `| ${values.map((value) => String(value ?? "")).join(" | ")} |`;
}

function gateStatus(passed) {
  return passed ? "PASS" : "FAIL";
}

function formatMetric(value) {
  return Number.isFinite(Number(value)) ? String(value) : "";
}

function writePrimaryTable(summary) {
  const lines = [
    tableRow(["Case", "Gate", "Route", "Selected Head", "Min Margin", "Collapse", "Avg Patches"]),
    tableRow(["---", "---", "---", "---", "---:", "---", "---:"]),
  ];

  for (const [caseId, gate] of Object.entries(summary.gates.primary)) {
    lines.push(
      tableRow([
        caseId,
        gateStatus(gate.passed),
        gate.summary.routeId,
        gate.summary.selectedHead,
        formatMetric(gate.summary.minSemanticMargin),
        String(gate.summary.signatureCollapse),
        formatMetric(gate.summary.avgPatchesPerEntry),
      ])
    );
  }

  return lines.join("\n");
}

function writeGeneralizationTable(summary) {
  const lines = [
    tableRow(["Case", "Gate", "Required For Directional Lock", "Required For Production", "Min Margin", "Collapse"]),
    tableRow(["---", "---", "---", "---", "---:", "---"]),
  ];

  for (const [caseId, gate] of Object.entries(summary.gates.generalization)) {
    lines.push(
      tableRow([
        caseId,
        gateStatus(gate.passed),
        String(gate.requiredForDirectionalLock),
        String(gate.requiredForProductionLock),
        formatMetric(gate.summary.minSemanticMargin),
        String(gate.summary.signatureCollapse),
      ])
    );
  }

  return lines.join("\n");
}

function writeRankingSection(summary) {
  const blocks = [];
  for (const [caseId, gate] of Object.entries(summary.gates.primary)) {
    const ranking = gate.summary.fullHeadRanking || [];
    blocks.push(`### ${caseId}`);
    blocks.push(
      tableRow(["Rank", "Head", "Accepted", "Role", "Min Margin", "Collapse", "Avg Patches"])
    );
    blocks.push(tableRow(["---:", "---", "---", "---", "---:", "---", "---:"]));
    for (const item of ranking) {
      blocks.push(
        tableRow([
          item.rank,
          item.headId,
          String(item.accepted),
          item.routeFitRole,
          formatMetric(item.minSemanticMargin),
          String(item.signatureCollapse),
          formatMetric(item.avgPatchesPerEntry),
        ])
      );
    }
    blocks.push("");
  }

  return blocks.join("\n");
}

async function writeReadme({ lockDir, summary, reportPaths, docsCopied }) {
  const lines = [
    "# 16xVS V19 Proof Lock Package",
    "",
    `- label: \`${summary.label}\``,
    `- generatedAt: \`${summary.generatedAt}\``,
    `- claimLevel: \`${summary.claimLevel}\``,
    "",
    "## Primary Directional Lock Gates",
    "",
    writePrimaryTable(summary),
    "",
    "## Blind/Stress Generalization Gates",
    "",
    writeGeneralizationTable(summary),
    "",
    "These gates are not required for the directional proof lock. They are required before claiming production generalization.",
    "",
    "## Full Head Ranking",
    "",
    writeRankingSection(summary),
    "## Claims Allowed",
    "",
    ...summary.claimsAllowed.map((claim) => `- ${claim}`),
    "",
    "## Claims Not Allowed",
    "",
    ...summary.claimsNotAllowed.map((claim) => `- ${claim}`),
    "",
    "## Artifacts",
    "",
    ...Object.entries(reportPaths).map(([caseId, reportPath]) => `- ${caseId}: ${reportPath}`),
    ...docsCopied.map((docPath) => `- doc: ${docPath}`),
    "",
    "## Upward Experiment Boundary",
    "",
    "Use `npm run sandbox:create -- --from-lock <this-lock-dir>` before testing above this baseline.",
    "Do not overwrite this lock package with upward experiments.",
    "",
  ];

  await fs.writeFile(path.join(lockDir, "README.md"), `${lines.join("\n")}\n`, "utf8");
}

async function copyDocs(lockDir) {
  const docsDir = path.join(lockDir, "docs");
  await fs.mkdir(docsDir, { recursive: true });
  const docs = [
    "docs/status.md",
    "docs/proofs/current-proof-dossier.md",
    "docs/failures/current-failures.md",
    "docs/ledger/2026-05-07-v19-validated-routing-round.md",
    "data/release/v19-lock-checkpoints.json",
  ];
  const copied = [];

  for (const relative of docs) {
    const source = path.join(projectRoot, relative);
    const destination = path.join(docsDir, relative.replace(/[\\/]/g, "__"));
    await fs.copyFile(source, destination);
    copied.push(relativeProjectPath(destination));
  }

  return copied;
}

async function writeSandboxSeed(lockDir) {
  const seedDir = path.join(lockDir, "upward-sandbox-seed");
  await fs.mkdir(seedDir, { recursive: true });
  await fs.writeFile(
    path.join(seedDir, "README.md"),
    [
      "# Upward Sandbox Seed",
      "",
      "This lock package is the baseline. Create upward experiments outside this folder with:",
      "",
      "```bash",
      `npm run sandbox:create -- --from-lock ${relativeProjectPath(lockDir)}`,
      "```",
      "",
      "The sandbox command excludes `.env`, `models`, `bench`, `node_modules`, `.wrangler`, and generated vault snapshots.",
      "",
    ].join("\n"),
    "utf8"
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const generatedAt = new Date().toISOString();
  const label = slug(args.label || "v19-lock");
  const lockDir =
    args.outputDir ||
    path.join(projectRoot, "bench", "proof-locks", `${timestampSlug(new Date(generatedAt))}-${label}`);
  const reportsDir = path.join(lockDir, "reports");
  const generalizationDir = path.join(lockDir, "generalization");
  const logsDir = path.join(lockDir, "logs");

  await fs.mkdir(reportsDir, { recursive: true });
  await fs.mkdir(generalizationDir, { recursive: true });
  await fs.mkdir(logsDir, { recursive: true });

  const commandResults = [];
  const tests = args.skipTests
    ? { passed: null, skipped: true }
    : {
        passed: true,
        skipped: false,
        ...(await runNodeScript({
          label: "unit-tests",
          args: ["./test/all-tests.mjs"],
          logDir: logsDir,
        })),
      };
  if (!args.skipTests) commandResults.push(tests);

  const reportsByCase = {};
  const reportPaths = {};
  const generalizationReportsByCase = {};

  if (!args.skipBench) {
    for (const item of PRIMARY_CASES) {
      const output = path.join(reportsDir, item.reportName);
      const relativeOutput = `./${relativeProjectPath(output)}`;
      const result = await runNodeScript({
        label: `primary-${item.caseId}`,
        args: validatedRoutingArgs({
          input: item.input,
          semantic: item.semantic,
          output: relativeOutput,
        }),
        logDir: logsDir,
      });
      commandResults.push(result);
      reportsByCase[item.caseId] = await readJson(output);
      reportPaths[item.caseId] = relativeProjectPath(output);
    }

    for (const item of GENERALIZATION_CASES) {
      const output = path.join(generalizationDir, item.reportName);
      const relativeOutput = `./${relativeProjectPath(output)}`;
      const result = await runNodeScript({
        label: `generalization-${item.caseId}`,
        args: validatedRoutingArgs({
          input: item.input,
          semantic: item.semantic,
          output: relativeOutput,
        }),
        logDir: logsDir,
      });
      commandResults.push(result);
      generalizationReportsByCase[item.caseId] = await readJson(output);
      reportPaths[item.caseId] = relativeProjectPath(output);
    }
  } else {
    throw new Error("--skip-bench is only for future debugging; proof packages require benchmark reports.");
  }

  const summary = buildProofSummary({
    label,
    generatedAt,
    lockDir: relativeProjectPath(lockDir),
    reportsByCase,
    generalizationReportsByCase,
    tests,
  });
  const docsCopied = await copyDocs(lockDir);
  await writeSandboxSeed(lockDir);
  await fs.writeFile(
    path.join(lockDir, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(lockDir, "manifest.json"),
    `${JSON.stringify(
      {
        label,
        generatedAt,
        lockDir: relativeProjectPath(lockDir),
        commands: commandResults,
        reports: reportPaths,
        docs: docsCopied,
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  await writeReadme({ lockDir, summary, reportPaths, docsCopied });

  console.log(
    JSON.stringify(
      {
        ok: summary.claimLevel !== "not-locked",
        claimLevel: summary.claimLevel,
        lockDir: relativeProjectPath(lockDir),
        summary: relativeProjectPath(path.join(lockDir, "summary.json")),
        readme: relativeProjectPath(path.join(lockDir, "README.md")),
      },
      null,
      2
    )
  );

  if (summary.claimLevel === "not-locked") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
