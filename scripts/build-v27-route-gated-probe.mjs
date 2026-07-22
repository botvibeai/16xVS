import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { summarizeProofReport } from "../core/proof-gates.mjs";
import { V23_PRIMARY_CASES } from "../core/v23-proof-package.mjs";
import { buildV26SplitHeads, V26_TARGET_CASES } from "../core/v26-split-repair-probe.mjs";
import { buildRouteLeakageAudit, resolveEligibleHeadsForLane } from "../core/v27-route-gate.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const EXPECTED_PRIMARY_MARGINS = {
  "book-root": 8,
  "governance-adversarial": 3.5,
  "archive-pressure": 8,
  booklike: 7.5,
  "mega-book-ladder": 31,
};

function resolveProjectPath(target) {
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

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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
      if (code === 0) resolve(result);
      else {
        const error = new Error(`${label} failed with exit code ${code}. See ${result.log}`);
        error.result = result;
        reject(error);
      }
    });
  });
}

function buildHeadArgs({ heads, selectionPolicy, laneId }) {
  const args = [];
  for (const head of heads) {
    args.push("--head", `${head.id}=${head.model}`);
  }
  args.push("--fallback-head", "default");
  args.push("--stored-head-count", String(heads.length));
  args.push("--selection-policy", selectionPolicy);
  if (laneId) args.push("--lane-id", laneId);
  return args;
}

function validatedRoutingArgs({ caseConfig, output, heads, selectionPolicy }) {
  return [
    "./scripts/run-validated-routing-benchmark.mjs",
    "--input",
    caseConfig.input,
    "--semantic",
    caseConfig.semantic,
    "--output",
    output,
    ...buildHeadArgs({ heads, selectionPolicy, laneId: caseConfig.caseId }),
  ];
}

function caseWithOutput(caseConfig, outputDir, suffix) {
  const baseName = caseConfig.reportName
    .replace("v23-four-head-ranked", suffix)
    .replace("v26-split-ranked", suffix);
  return {
    ...caseConfig,
    reportPath: path.join(outputDir, baseName),
  };
}

function nearlyEqual(left, right) {
  return Math.abs(Number(left) - Number(right)) < 0.0001;
}

function checkPrimaryGate(caseConfig, report) {
  const summary = summarizeProofReport(report);
  const expectation = caseConfig.expectation;
  const expectedMargin = EXPECTED_PRIMARY_MARGINS[caseConfig.caseId];
  return {
    caseId: caseConfig.caseId,
    summary,
    expectedMargin,
    eligibleHeads: resolveEligibleHeadsForLane(caseConfig.caseId),
    pass:
      summary.routeId === expectation.expectedRouteId &&
      summary.lexicalHead === expectation.expectedLexicalHead &&
      summary.selectedHead === expectation.expectedSelectedHead &&
      summary.signatureCollapse === false &&
      summary.semanticAllPositive === true &&
      nearlyEqual(summary.minSemanticMargin, expectedMargin) &&
      Number(summary.avgPatchesPerEntry) <= expectation.maxAvgPatchesPerEntry,
  };
}

function checkTargetQuarantine(caseConfig, report) {
  const summary = summarizeProofReport(report);
  const eligibleHeads = resolveEligibleHeadsForLane(caseConfig.caseId);
  const blockedHeads = report.headValidation?.routeGate?.blockedHeads || [];
  return {
    caseId: caseConfig.caseId,
    summary,
    eligibleHeads,
    blockedHeads,
    pass:
      eligibleHeads.includes(summary.selectedHead) &&
      report.headValidation?.routeGate?.eligibleHeads?.join("|") === eligibleHeads.join("|") &&
      !blockedHeads.includes(summary.selectedHead),
  };
}

function tableRow(values) {
  return `| ${values.map((value) => String(value ?? "")).join(" | ")} |`;
}

function metric(value) {
  return Number.isFinite(Number(value)) ? String(value) : "";
}

async function writeReadme({ outputDir, summary, logs }) {
  const lines = [
    "# V27 Route-Gated Repair Probe",
    "",
    `- generatedAt: \`${summary.generatedAt}\``,
    `- claimLevel: \`${summary.claimLevel}\``,
    `- v23PrimaryPreserved: \`${summary.v23PrimaryPreserved}\``,
    `- cloudmersive: \`disabled; optional external audit only\``,
    "",
    "## V26 Leakage Audit",
    "",
    `- unrestrictedSelectedHead: \`${summary.v26LeakageAudit.unrestricted.selectedHead}\``,
    `- gatedSelectedHead: \`${summary.v26LeakageAudit.gated.selectedHead}\``,
    `- leakReproduced: \`${summary.v26LeakageAudit.leakReproduced}\``,
    `- leakBlocked: \`${summary.v26LeakageAudit.leakBlocked}\``,
    "",
    "## Primary Gates",
    "",
    tableRow(["Case", "Selected Head", "Expected Margin", "Actual Margin", "Avg Patches", "Pass"]),
    tableRow(["---", "---", "---:", "---:", "---:", "---"]),
    ...Object.values(summary.primaryGates).map((gate) =>
      tableRow([
        gate.caseId,
        gate.summary.selectedHead,
        metric(gate.expectedMargin),
        metric(gate.summary.minSemanticMargin),
        metric(gate.summary.avgPatchesPerEntry),
        String(gate.pass),
      ])
    ),
    "",
    "## Target Quarantine",
    "",
    tableRow(["Case", "Selected Head", "Eligible Heads", "Min Margin", "Pass"]),
    tableRow(["---", "---", "---", "---:", "---"]),
    ...Object.values(summary.targetQuarantineGates).map((gate) =>
      tableRow([
        gate.caseId,
        gate.summary.selectedHead,
        gate.eligibleHeads.join(", "),
        metric(gate.summary.minSemanticMargin),
        String(gate.pass),
      ])
    ),
    "",
    "## Read",
    "",
    summary.read,
    "",
    "## Claims Not Allowed",
    "",
    ...summary.claimsNotAllowed.map((claim) => `- ${claim}`),
    "",
    "## Logs",
    "",
    ...logs.map((item) => `- ${item.label}: ${item.log}`),
    "",
  ];
  await fs.writeFile(path.join(outputDir, "README.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir =
    args.outputDir || path.join(projectRoot, "bench", `fortify-${dateSlug()}-v27-route-gated`);
  const gatedDir = path.join(outputDir, "v27-gated-ranked");
  const auditDir = path.join(outputDir, "audit");
  const logsDir = path.join(outputDir, "logs");
  const logs = [];
  const heads = buildV26SplitHeads();

  await fs.mkdir(gatedDir, { recursive: true });
  await fs.mkdir(auditDir, { recursive: true });
  await fs.mkdir(logsDir, { recursive: true });

  const primaryCases = V23_PRIMARY_CASES.map((item) =>
    caseWithOutput(item, gatedDir, "v27-route-gated")
  );
  const targetCases = V26_TARGET_CASES.map((item) =>
    caseWithOutput(item, gatedDir, "v27-route-gated")
  );
  const unrestrictedGovernanceOutput = path.join(
    auditDir,
    "governance-adversarial-v26-unrestricted-ranked.json"
  );
  const governanceCase = V23_PRIMARY_CASES.find((item) => item.caseId === "governance-adversarial");

  logs.push(
    await runNodeScript({
      label: "audit-governance-unrestricted-ranked",
      args: validatedRoutingArgs({
        caseConfig: governanceCase,
        output: unrestrictedGovernanceOutput,
        heads,
        selectionPolicy: "ranked-accepted-head",
      }),
      logDir: logsDir,
    })
  );

  const reportsByCase = {};
  for (const caseConfig of [...primaryCases, ...targetCases]) {
    logs.push(
      await runNodeScript({
        label: `v27-gated-${caseConfig.caseId}`,
        args: validatedRoutingArgs({
          caseConfig,
          output: caseConfig.reportPath,
          heads,
          selectionPolicy: "v27-route-gated-ranked",
        }),
        logDir: logsDir,
      })
    );
    reportsByCase[caseConfig.caseId] = await readJson(caseConfig.reportPath);
  }

  const primaryGates = Object.fromEntries(
    primaryCases.map((caseConfig) => [
      caseConfig.caseId,
      checkPrimaryGate(caseConfig, reportsByCase[caseConfig.caseId]),
    ])
  );
  const targetQuarantineGates = Object.fromEntries(
    targetCases.map((caseConfig) => [
      caseConfig.caseId,
      checkTargetQuarantine(caseConfig, reportsByCase[caseConfig.caseId]),
    ])
  );
  const unrestrictedGovernanceReport = await readJson(unrestrictedGovernanceOutput);
  const v26LeakageAudit = buildRouteLeakageAudit({
    laneId: "governance-adversarial",
    unrestrictedReport: unrestrictedGovernanceReport,
    gatedReport: reportsByCase["governance-adversarial"],
  });
  const v23PrimaryPreserved = Object.values(primaryGates).every((gate) => gate.pass);
  const targetQuarantinePassed = Object.values(targetQuarantineGates).every((gate) => gate.pass);
  const routeLeakBlocked = v26LeakageAudit.leakReproduced && v26LeakageAudit.leakBlocked;
  const summary = {
    label: "v27-route-gated-repair-probe",
    generatedAt: new Date().toISOString(),
    outputDir: relativeProjectPath(outputDir),
    claimLevel:
      v23PrimaryPreserved && targetQuarantinePassed && routeLeakBlocked
        ? "route-gated-proof"
        : "not-locked-route-gate",
    v23PrimaryPreserved,
    targetQuarantinePassed,
    routeLeakBlocked,
    cloudmersive: {
      enabled: false,
      note: "Cloudmersive perceptual image similarity remains optional external audit only; this probe makes no network calls.",
    },
    v26LeakageAudit,
    primaryGates,
    targetQuarantineGates,
    read:
      "V27 bans universal repair-head competition by applying lane ownership before ranked selection. This is route-governance evidence, not a new semantic repair baseline.",
    claimsNotAllowed: [
      "V27 as a production router.",
      "Quote, blind, or stress semantic repair unless those margins cross zero on independent holdouts.",
      "Broad tokenizer superiority, 99.99% raw-source reduction, or 1.25 GB corpus-collapse claims.",
      "Cloudmersive-backed proof; no external API was called.",
    ],
  };

  await writeJson(path.join(outputDir, "summary.json"), summary);
  await writeJson(path.join(auditDir, "v26-governance-leakage-audit.json"), v26LeakageAudit);
  await writeReadme({ outputDir, summary, logs });

  console.log(
    JSON.stringify(
      {
        ok: summary.claimLevel === "route-gated-proof",
        outputDir: relativeProjectPath(outputDir),
        claimLevel: summary.claimLevel,
        v23PrimaryPreserved,
        targetQuarantinePassed,
        routeLeakBlocked,
        summary: relativeProjectPath(path.join(outputDir, "summary.json")),
        readme: relativeProjectPath(path.join(outputDir, "README.md")),
      },
      null,
      2
    )
  );

  if (summary.claimLevel !== "route-gated-proof") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
