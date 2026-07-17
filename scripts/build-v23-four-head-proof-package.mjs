import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  buildV23SuitePlan,
  evaluateV23ProofSummary,
} from "../core/v23-proof-package.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

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
    label: "v23-four-head-ranked",
    outputDir: null,
    skipTests: false,
    skipBench: false,
    includeExtra: true,
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
    } else if (arg === "--skip-extra") {
      out.includeExtra = false;
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
      await fs.writeFile(
        logPath,
        [
          `label=${label}`,
          `startedAt=${startedAt}`,
          `endedAt=${endedAt}`,
          `exitCode=${code}`,
          "",
          output,
        ].join("\n"),
        "utf8"
      );
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

function validatedRoutingArgs({ input, semantic, output, headArgs }) {
  return [
    "./scripts/run-validated-routing-benchmark.mjs",
    "--input",
    input,
    "--semantic",
    semantic,
    "--output",
    output,
    ...headArgs,
  ];
}

function tableRow(values) {
  return `| ${values.map((value) => String(value ?? "")).join(" | ")} |`;
}

function metric(value) {
  return Number.isFinite(Number(value)) ? String(value) : "";
}

function passFail(value) {
  return value ? "PASS" : "FAIL";
}

function gateTable(gates, includeRequired = false) {
  const header = includeRequired
    ? ["Case", "Gate", "Required For Production", "Selected Head", "Min Margin", "Collapse", "Avg Patches"]
    : ["Case", "Gate", "Selected Head", "Min Margin", "Collapse", "Avg Patches"];
  const aligns = includeRequired
    ? ["---", "---", "---", "---", "---:", "---", "---:"]
    : ["---", "---", "---", "---:", "---", "---:"];
  const lines = [tableRow(header), tableRow(aligns)];

  for (const [caseId, gate] of Object.entries(gates)) {
    const base = [
      caseId,
      passFail(gate.passed),
      gate.summary.selectedHead,
      metric(gate.summary.minSemanticMargin),
      String(gate.summary.signatureCollapse),
      metric(gate.summary.avgPatchesPerEntry),
    ];
    lines.push(
      tableRow(
        includeRequired
          ? [base[0], base[1], String(gate.requiredForProductionLock), ...base.slice(2)]
          : base
      )
    );
  }

  return lines.join("\n");
}

function rankingSection(gates) {
  const lines = [];
  for (const [caseId, gate] of Object.entries(gates)) {
    lines.push(`### ${caseId}`);
    lines.push(tableRow(["Rank", "Head", "Accepted", "Role", "Min Margin", "Collapse", "Avg Patches"]));
    lines.push(tableRow(["---:", "---", "---", "---", "---:", "---", "---:"]));
    for (const item of gate.summary.fullHeadRanking || []) {
      lines.push(
        tableRow([
          item.rank,
          item.headId,
          String(item.accepted),
          item.routeFitRole,
          metric(item.minSemanticMargin),
          String(item.signatureCollapse),
          metric(item.avgPatchesPerEntry),
        ])
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function writeReadme({ outputDir, summary, reportPaths, runLogs }) {
  const lines = [
    "# V23 Four-Head Ranked Proof Package",
    "",
    `- label: \`${summary.label}\``,
    `- generatedAt: \`${summary.generatedAt}\``,
    `- claimLevel: \`${summary.claimLevel}\``,
    "",
    "## Primary Gates",
    "",
    gateTable(summary.gates.primary),
    "",
    "## Blind/Stress Gates",
    "",
    gateTable(summary.gates.generalization, true),
    "",
    "Blind/stress gates are not required for the directional specialist proof. They are required before production-generalization claims.",
    "",
    "## Extra Controlled Surfaces",
    "",
    gateTable(summary.gates.extra),
    "",
    "## Full Head Ranking",
    "",
    rankingSection(summary.gates.primary),
    "## Claims Allowed",
    "",
    ...summary.claimsAllowed.map((claim) => `- ${claim}`),
    "",
    "## Claims Not Allowed",
    "",
    ...summary.claimsNotAllowed.map((claim) => `- ${claim}`),
    "",
    "## Reports",
    "",
    ...Object.entries(reportPaths).map(([caseId, reportPath]) => `- ${caseId}: ${reportPath}`),
    "",
    "## Logs",
    "",
    ...runLogs.map((item) => `- ${item.label}: ${item.log}`),
    "",
  ];

  await fs.writeFile(path.join(outputDir, "README.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir =
    args.outputDir ||
    path.join(projectRoot, "bench", "proof-locks", `${timestampSlug()}-${slug(args.label)}`);
  const reportsDir = path.join(outputDir, "reports");
  const logsDir = path.join(outputDir, "logs");
  const generatedAt = new Date().toISOString();

  await fs.mkdir(reportsDir, { recursive: true });
  await fs.mkdir(logsDir, { recursive: true });

  const plan = buildV23SuitePlan({ outputDir: reportsDir });
  const runLogs = [];
  let tests = { passed: true, skipped: true };

  if (!args.skipTests) {
    const testRun = await runNodeScript({
      label: "unit-tests",
      args: ["./test/all-tests.mjs"],
      logDir: logsDir,
    });
    runLogs.push(testRun);
    tests = { passed: testRun.exitCode === 0, skipped: false, log: testRun.log };
  }

  const suites = [
    { key: "primary", cases: plan.primaryCases },
    { key: "generalization", cases: plan.generalizationCases },
    ...(args.includeExtra ? [{ key: "extra", cases: plan.extraCases }] : []),
  ];
  const reportPaths = {};

  if (!args.skipBench) {
    for (const suite of suites) {
      for (const caseConfig of suite.cases) {
        const run = await runNodeScript({
          label: `${suite.key}-${caseConfig.caseId}`,
          args: validatedRoutingArgs({
            input: caseConfig.input,
            semantic: caseConfig.semantic,
            output: caseConfig.reportPath,
            headArgs: plan.headArgs,
          }),
          logDir: logsDir,
        });
        runLogs.push(run);
        reportPaths[caseConfig.caseId] = relativeProjectPath(caseConfig.reportPath);
      }
    }
  }

  const primaryReportsByCase = {};
  const generalizationReportsByCase = {};
  const extraReportsByCase = {};

  for (const caseConfig of plan.primaryCases) {
    primaryReportsByCase[caseConfig.caseId] = await readJson(caseConfig.reportPath);
  }
  for (const caseConfig of plan.generalizationCases) {
    generalizationReportsByCase[caseConfig.caseId] = await readJson(caseConfig.reportPath);
  }
  for (const caseConfig of args.includeExtra ? plan.extraCases : []) {
    extraReportsByCase[caseConfig.caseId] = await readJson(caseConfig.reportPath);
  }

  const summary = evaluateV23ProofSummary({
    label: args.label,
    generatedAt,
    lockDir: relativeProjectPath(outputDir),
    tests,
    primaryReportsByCase,
    generalizationReportsByCase,
    extraReportsByCase,
  });

  await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeReadme({ outputDir, summary, reportPaths, runLogs });

  console.log(
    JSON.stringify(
      {
        ok: true,
        outputDir: relativeProjectPath(outputDir),
        claimLevel: summary.claimLevel,
        primaryPassed: Object.values(summary.gates.primary).every((gate) => gate.passed),
        generalizationPassed: Object.values(summary.gates.generalization).every((gate) => gate.passed),
        extraPassed: Object.values(summary.gates.extra).filter(Boolean).every((gate) => gate.passed),
        summary: relativeProjectPath(path.join(outputDir, "summary.json")),
        readme: relativeProjectPath(path.join(outputDir, "README.md")),
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
