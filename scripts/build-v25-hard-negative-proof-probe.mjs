import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { summarizeProofReport } from "../core/proof-gates.mjs";
import { buildV25ProbeSuitePlan } from "../core/v25-proof-probe.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const ARTIFACTS = {
  spec: "./data/training/embedding-training-spec-v25-hard-negative-repair.json",
  pairs: "./data/training/embedding-training-pairs-v25-hard-negative-repair.json",
  baseModel: "./models/learned-hybrid-prototype-v25-hard-negative-repair-base.json",
  model: "./models/learned-hybrid-prototype-v25-hard-negative-repair-hierarchical-packer-v2.json",
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
    skipTraining: false,
    skipBench: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output-dir" && argv[index + 1]) {
      out.outputDir = resolveProjectPath(argv[++index]);
    } else if (arg === "--skip-training") {
      out.skipTraining = true;
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

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function benchmarkWithModelArgs({ input, semantic, output, model }) {
  return [
    "./scripts/run-benchmark-with-model.mjs",
    "--input",
    input,
    "--semantic",
    semantic,
    "--output",
    output,
    "--encoder-model",
    model,
  ];
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

function checkTargetGate(caseConfig, singleReport, rankedReport) {
  const singleSummary = summarizeProofReport(singleReport);
  const rankedSummary = summarizeProofReport(rankedReport);
  const bestRanked = rankedSummary.fullHeadRanking[0] || null;
  const bestMargin = Number(bestRanked?.minSemanticMargin);
  const selectedMargin = Number(rankedSummary.minSemanticMargin);
  const singleMargin = Number(singleSummary.minSemanticMargin);
  const previous = Number(caseConfig.previousBestMargin);

  return {
    caseId: caseConfig.caseId,
    previousBestMargin: previous,
    singleHead: singleSummary,
    ranked: rankedSummary,
    bestRankedHead: bestRanked?.headId || null,
    bestRankedMargin: Number.isFinite(bestMargin) ? bestMargin : null,
    improvedBeyondPrevious:
      Number.isFinite(singleMargin) && Number.isFinite(previous) && singleMargin > previous,
    pass:
      rankedSummary.signatureCollapse === false &&
      rankedSummary.semanticAllPositive === true &&
      selectedMargin > 0,
  };
}

function checkPrimaryGate(caseConfig, report) {
  const summary = summarizeProofReport(report);
  const expected = caseConfig.expectation;
  return {
    caseId: caseConfig.caseId,
    summary,
    pass:
      summary.routeId === expected.expectedRouteId &&
      summary.lexicalHead === expected.expectedLexicalHead &&
      summary.selectedHead === expected.expectedSelectedHead &&
      summary.signatureCollapse === false &&
      summary.semanticAllPositive === true &&
      Number(summary.minSemanticMargin) >= 0 &&
      Number(summary.avgPatchesPerEntry) <= expected.maxAvgPatchesPerEntry,
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
    "# V25 Hard-Negative Repair Probe",
    "",
    `- generatedAt: \`${summary.generatedAt}\``,
    `- claimLevel: \`${summary.claimLevel}\``,
    `- v23BaselinePreserved: \`${summary.v23BaselinePreserved}\``,
    "",
    "## Target Gates",
    "",
    tableRow([
      "Case",
      "Previous",
      "Single V25 Margin",
      "Best Ranked Head",
      "Best Ranked Margin",
      "Selected Head",
      "Selected Margin",
      "Improved",
      "Pass",
    ]),
    tableRow(["---", "---:", "---:", "---", "---:", "---", "---:", "---", "---"]),
    ...Object.values(summary.targetGates).map((gate) =>
      tableRow([
        gate.caseId,
        metric(gate.previousBestMargin),
        metric(gate.singleHead.minSemanticMargin),
        gate.bestRankedHead,
        metric(gate.bestRankedMargin),
        gate.ranked.selectedHead,
        metric(gate.ranked.minSemanticMargin),
        String(gate.improvedBeyondPrevious),
        String(gate.pass),
      ])
    ),
    "",
    "## Primary Lane Stability",
    "",
    tableRow(["Case", "Selected Head", "Min Margin", "Avg Patches", "Pass"]),
    tableRow(["---", "---", "---:", "---:", "---"]),
    ...Object.values(summary.primaryGates).map((gate) =>
      tableRow([
        gate.caseId,
        gate.summary.selectedHead,
        metric(gate.summary.minSemanticMargin),
        metric(gate.summary.avgPatchesPerEntry),
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
    args.outputDir ||
    path.join(projectRoot, "bench", `fortify-${dateSlug()}-v25-hard-negative-repair`);
  const singleDir = path.join(outputDir, "single-head");
  const rankedDir = path.join(outputDir, "six-head-ranked");
  const logsDir = path.join(outputDir, "logs");
  const logs = [];

  await fs.mkdir(singleDir, { recursive: true });
  await fs.mkdir(rankedDir, { recursive: true });
  await fs.mkdir(logsDir, { recursive: true });

  const spec = ARTIFACTS.spec;
  const pairs = ARTIFACTS.pairs;
  const baseModel = ARTIFACTS.baseModel;
  const model = ARTIFACTS.model;

  if (!args.skipTraining) {
    logs.push(
      await runNodeScript({
        label: "generate-v25-spec",
        args: ["./scripts/generate-v25-hard-negative-repair-spec.mjs", "--output", spec],
        logDir: logsDir,
      })
    );
    logs.push(
      await runNodeScript({
        label: "build-v25-training-data",
        args: ["./scripts/build-training-data.mjs", "--input", spec, "--output", pairs],
        logDir: logsDir,
      })
    );
    logs.push(
      await runNodeScript({
        label: "train-v25-model",
        args: [
          "./scripts/train-learned-encoder.mjs",
          "--input",
          pairs,
          "--output",
          baseModel,
          "--heuristic-blend-weight",
          "0.6",
          "--learned-blend-weight",
          "1",
          "--prototype-learning-rate",
          "0.03",
          "--prototype-negative-margin",
          "0.25",
          "--prototype-negatives-per-item",
          "2",
          "--epochs",
          "40",
          "--learning-rate",
          "0.05",
          "--negative-margin",
          "0.15",
          "--seed",
          "53",
        ],
        logDir: logsDir,
      })
    );
    logs.push(
      await runNodeScript({
        label: "derive-v25-hierarchical",
        args: [
          "./scripts/derive-model-variant.mjs",
          "--input",
          baseModel,
          "--output",
          model,
          "--packing-mode",
          "hierarchical",
          "--max-words-per-patch",
          "96",
          "--max-chars-per-patch",
          "512",
          "--max-entry-words",
          "96",
          "--max-entry-chars",
          "512",
          "--max-residual-patches",
          "2",
          "--residual-max-words",
          "28",
          "--residual-max-chars",
          "180",
          "--variant-name",
          "hard-negative-repair-hierarchical-packer-v2",
        ],
        logDir: logsDir,
      })
    );
  }

  const plan = buildV25ProbeSuitePlan({
    outputDir: rankedDir,
    v25Model: model,
  });
  const targetSingleReports = {};
  const targetRankedReports = {};
  const primaryReports = {};

  if (!args.skipBench) {
    for (const caseConfig of plan.targetCases) {
      const output = path.join(singleDir, caseConfig.reportName.replace("six-head-ranked", "single-head"));
      logs.push(
        await runNodeScript({
          label: `single-${caseConfig.caseId}`,
          args: benchmarkWithModelArgs({
            input: caseConfig.input,
            semantic: caseConfig.semantic,
            output,
            model,
          }),
          logDir: logsDir,
        })
      );
      targetSingleReports[caseConfig.caseId] = await readJson(output);
    }

    for (const caseConfig of [...plan.primaryCases, ...plan.targetCases]) {
      logs.push(
        await runNodeScript({
          label: `ranked-${caseConfig.caseId}`,
          args: validatedRoutingArgs({
            input: caseConfig.input,
            semantic: caseConfig.semantic,
            output: caseConfig.reportPath,
            headArgs: plan.headArgs,
          }),
          logDir: logsDir,
        })
      );
      const report = await readJson(caseConfig.reportPath);
      if (plan.primaryCases.some((item) => item.caseId === caseConfig.caseId)) {
        primaryReports[caseConfig.caseId] = report;
      } else {
        targetRankedReports[caseConfig.caseId] = report;
      }
    }
  }

  const targetGates = Object.fromEntries(
    plan.targetCases.map((caseConfig) => [
      caseConfig.caseId,
      checkTargetGate(
        caseConfig,
        targetSingleReports[caseConfig.caseId],
        targetRankedReports[caseConfig.caseId]
      ),
    ])
  );
  const primaryGates = Object.fromEntries(
    plan.primaryCases.map((caseConfig) => [
      caseConfig.caseId,
      checkPrimaryGate(caseConfig, primaryReports[caseConfig.caseId]),
    ])
  );
  const allTargetsPass = Object.values(targetGates).every((gate) => gate.pass);
  const allTargetsImprove = Object.values(targetGates).every((gate) => gate.improvedBeyondPrevious);
  const v23BaselinePreserved = Object.values(primaryGates).every((gate) => gate.pass);
  const summary = {
    label: "v25-hard-negative-repair",
    generatedAt: new Date().toISOString(),
    outputDir: relativeProjectPath(outputDir),
    artifacts: Object.fromEntries(
      Object.entries(ARTIFACTS).map(([key, value]) => [key, relativeProjectPath(resolveProjectPath(value))])
    ),
    claimLevel:
      allTargetsPass && v23BaselinePreserved
        ? "repair-success-candidate"
        : allTargetsImprove && v23BaselinePreserved
          ? "directional-near-miss"
          : "negative-or-mixed-probe",
    v23BaselinePreserved,
    targetGates,
    primaryGates,
    read:
      allTargetsPass && v23BaselinePreserved
        ? "V25 clears all target gates while preserving v23 primary lanes. It still needs independent holdout verification because mined failure pairs were used as training negatives."
        : "V25 does not replace v23. Treat it as repair evidence only; mined failure pairs mean the target surfaces are no longer independent blind proof.",
    claimsNotAllowed: [
      "V25 as the locked baseline unless all target gates pass and independent holdout verification is added.",
      "Production proof from mined failure-pair repair.",
      "Broad tokenizer superiority, 99.99% raw-source reduction, or 1.25 GB corpus-collapse claims.",
    ],
  };

  await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeReadme({ outputDir, summary, logs });

  console.log(
    JSON.stringify(
      {
        ok: true,
        outputDir: relativeProjectPath(outputDir),
        claimLevel: summary.claimLevel,
        v23BaselinePreserved,
        allTargetsImprove,
        allTargetsPass,
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
