import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { summarizeProofReport } from "../core/proof-gates.mjs";
import {
  buildMinedHardNegativeTrainingSpec,
  extractNearestOutsideConfusionPairs,
} from "../core/v25-hard-negative-miner.mjs";
import { buildV26SplitProbeSuitePlan, V26_SPLIT_PROBES } from "../core/v26-split-repair-probe.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

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
        [`label=${label}`, `startedAt=${startedAt}`, `endedAt=${endedAt}`, `exitCode=${code}`, "", output].join(
          "\n"
        ),
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

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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

async function generateSplitSpec(probe) {
  const baseSpecPath = resolveProjectPath(probe.baseSpec);
  const baseSpec = await readJson(baseSpecPath);
  const confusionPairs = [];
  const minedReports = [];

  for (const reportConfig of probe.reports) {
    const reportPath = resolveProjectPath(reportConfig.report);
    const report = await readJson(reportPath);
    const pairs = extractNearestOutsideConfusionPairs(report, {
      sourceId: reportConfig.sourceId,
      maxPairsPerGroup: reportConfig.maxPairsPerGroup,
    });
    confusionPairs.push(...pairs);
    minedReports.push({
      sourceId: reportConfig.sourceId,
      report: relativeProjectPath(reportPath),
      pairCount: pairs.length,
    });
  }

  const spec = buildMinedHardNegativeTrainingSpec({
    baseSpec,
    confusionPairs,
    version: 26,
    label: `V26 ${probe.id} split hard-negative repair probe`,
    repairTarget: `${probe.id} nearest-outside confusions`,
    domain: "v26_split_hard_negative_repair",
    groupPrefix: `v26_${probe.id}_mined`,
  });
  await writeJson(resolveProjectPath(probe.spec), spec);
  return {
    probeId: probe.id,
    headId: probe.headId,
    baseSpec: relativeProjectPath(baseSpecPath),
    spec: relativeProjectPath(resolveProjectPath(probe.spec)),
    minedReports,
    groupCount: spec.groups.length,
    explicitNegativePairCount: spec.explicitNegativePairs.length,
    minedGroupCount: spec.targetedRound.minedGroupCount,
  };
}

function checkTargetGate(caseConfig, singleReport, rankedReport) {
  const singleSummary = summarizeProofReport(singleReport);
  const rankedSummary = summarizeProofReport(rankedReport);
  const bestRanked = rankedSummary.fullHeadRanking[0] || null;
  const targetRanked =
    rankedSummary.fullHeadRanking.find((item) => item.headId === caseConfig.targetHeadId) || null;
  const bestMargin = Number(bestRanked?.minSemanticMargin);
  const singleMargin = Number(singleSummary.minSemanticMargin);
  const selectedMargin = Number(rankedSummary.minSemanticMargin);
  const previous = Number(caseConfig.previousBestMargin);

  return {
    caseId: caseConfig.caseId,
    targetHeadId: caseConfig.targetHeadId,
    previousBestMargin: previous,
    singleHead: singleSummary,
    ranked: rankedSummary,
    bestRankedHead: bestRanked?.headId || null,
    bestRankedMargin: Number.isFinite(bestMargin) ? bestMargin : null,
    targetRankedMargin: Number.isFinite(Number(targetRanked?.minSemanticMargin))
      ? Number(targetRanked.minSemanticMargin)
      : null,
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
    "# V26 Split Hard-Negative Repair Probe",
    "",
    `- generatedAt: \`${summary.generatedAt}\``,
    `- claimLevel: \`${summary.claimLevel}\``,
    `- v23BaselinePreserved: \`${summary.v23BaselinePreserved}\``,
    "",
    "## Split Specs",
    "",
    tableRow(["Probe", "Head", "Base Spec", "Explicit Negatives", "Mined Groups"]),
    tableRow(["---", "---", "---", "---:", "---:"]),
    ...summary.splitSpecs.map((item) =>
      tableRow([
        item.probeId,
        item.headId,
        item.baseSpec,
        metric(item.explicitNegativePairCount),
        metric(item.minedGroupCount),
      ])
    ),
    "",
    "## Target Gates",
    "",
    tableRow([
      "Case",
      "Target Head",
      "Previous Best",
      "Single Margin",
      "Best Ranked Head",
      "Best Ranked Margin",
      "Selected Head",
      "Selected Margin",
      "Improved",
      "Pass",
    ]),
    tableRow(["---", "---", "---:", "---:", "---", "---:", "---", "---:", "---", "---"]),
    ...Object.values(summary.targetGates).map((gate) =>
      tableRow([
        gate.caseId,
        gate.targetHeadId,
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
    path.join(projectRoot, "bench", `fortify-${dateSlug()}-v26-split-hard-negative-repair`);
  const singleDir = path.join(outputDir, "single-head");
  const rankedDir = path.join(outputDir, "eight-head-ranked");
  const logsDir = path.join(outputDir, "logs");
  const logs = [];

  await fs.mkdir(singleDir, { recursive: true });
  await fs.mkdir(rankedDir, { recursive: true });
  await fs.mkdir(logsDir, { recursive: true });

  const splitSpecs = [];
  if (!args.skipTraining) {
    for (const probe of V26_SPLIT_PROBES) {
      const specSummary = await generateSplitSpec(probe);
      splitSpecs.push(specSummary);
      await fs.writeFile(
        path.join(logsDir, `${slug(`generate-${probe.id}-spec`)}.log`),
        `${JSON.stringify(specSummary, null, 2)}\n`,
        "utf8"
      );
      logs.push({
        label: `generate-${probe.id}-spec`,
        log: relativeProjectPath(path.join(logsDir, `${slug(`generate-${probe.id}-spec`)}.log`)),
      });
      logs.push(
        await runNodeScript({
          label: `build-${probe.id}-training-data`,
          args: ["./scripts/build-training-data.mjs", "--input", probe.spec, "--output", probe.pairs],
          logDir: logsDir,
        })
      );
      logs.push(
        await runNodeScript({
          label: `train-${probe.id}-model`,
          args: [
            "./scripts/train-learned-encoder.mjs",
            "--input",
            probe.pairs,
            "--output",
            probe.baseModel,
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
            String(probe.seed),
          ],
          logDir: logsDir,
        })
      );
      logs.push(
        await runNodeScript({
          label: `derive-${probe.id}-hierarchical`,
          args: [
            "./scripts/derive-model-variant.mjs",
            "--input",
            probe.baseModel,
            "--output",
            probe.model,
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
            `${probe.id}-hierarchical-packer-v2`,
          ],
          logDir: logsDir,
        })
      );
    }
  } else {
    for (const probe of V26_SPLIT_PROBES) {
      splitSpecs.push({
        probeId: probe.id,
        headId: probe.headId,
        baseSpec: relativeProjectPath(resolveProjectPath(probe.baseSpec)),
        spec: relativeProjectPath(resolveProjectPath(probe.spec)),
        explicitNegativePairCount: null,
        minedGroupCount: null,
      });
    }
  }

  const modelMap = Object.fromEntries(V26_SPLIT_PROBES.map((probe) => [probe.headId, probe.model]));
  const plan = buildV26SplitProbeSuitePlan({
    outputDir: rankedDir,
    models: modelMap,
  });
  const targetSingleReports = {};
  const targetRankedReports = {};
  const primaryReports = {};

  if (!args.skipBench) {
    for (const caseConfig of plan.targetCases) {
      const output = path.join(
        singleDir,
        `${caseConfig.caseId}-v26-${caseConfig.targetHeadId}-single-head.json`
      );
      logs.push(
        await runNodeScript({
          label: `single-${caseConfig.caseId}-${caseConfig.targetHeadId}`,
          args: benchmarkWithModelArgs({
            input: caseConfig.input,
            semantic: caseConfig.semantic,
            output,
            model: modelMap[caseConfig.targetHeadId],
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
  const anyTargetImproves = Object.values(targetGates).some((gate) => gate.improvedBeyondPrevious);
  const allTargetsImprove = Object.values(targetGates).every((gate) => gate.improvedBeyondPrevious);
  const v23BaselinePreserved = Object.values(primaryGates).every((gate) => gate.pass);
  const summary = {
    label: "v26-split-hard-negative-repair",
    generatedAt: new Date().toISOString(),
    outputDir: relativeProjectPath(outputDir),
    claimLevel:
      allTargetsPass && v23BaselinePreserved
        ? "repair-success-candidate"
        : anyTargetImproves && v23BaselinePreserved
          ? "directional-split-probe"
          : "negative-or-mixed-probe",
    v23BaselinePreserved,
    allTargetsImprove,
    allTargetsPass,
    splitSpecs,
    targetGates,
    primaryGates,
    read:
      allTargetsPass && v23BaselinePreserved
        ? "V26 split heads clear all target gates while preserving v23 primary lanes. Independent holdout verification is still required because mined failure pairs were used as training negatives."
        : "V26 tests whether V25 failed from over-mixing repair pressure. Treat it as split-head repair evidence only, not as a baseline.",
    claimsNotAllowed: [
      "V26 as the locked baseline unless all target gates pass and independent holdout verification is added.",
      "Production proof from mined failure-pair repair.",
      "Broad tokenizer superiority, 99.99% raw-source reduction, or 1.25 GB corpus-collapse claims.",
    ],
  };

  await writeJson(path.join(outputDir, "summary.json"), summary);
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
