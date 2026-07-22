import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  evaluateColdPathFallback,
  runV28RuntimeHardeningProbe,
  simulateSteTemperatureDecay,
} from "../core/v28-runtime-governance.mjs";

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
    mode: "runtime",
    outputDir: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--mode" && argv[index + 1]) {
      out.mode = argv[++index];
    } else if (arg === "--output-dir" && argv[index + 1]) {
      out.outputDir = resolveProjectPath(argv[++index]);
    }
  }

  if (!["runtime", "ste", "cold-path"].includes(out.mode)) {
    throw new Error("Unsupported --mode. Use runtime, ste, or cold-path.");
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
  const lines = [
    `# ${summary.title}`,
    "",
    `- generatedAt: \`${summary.generatedAt}\``,
    `- claimLevel: \`${summary.claimLevel}\``,
    `- noWorkerDeploy: \`true\``,
    `- noExternalCalls: \`true\``,
    "",
    "## Required Fields",
    "",
    tableRow([
      "laneId",
      "eligibleHeads",
      "confidence",
      "accepted",
      "fallbackUsed",
      "fallbackPatchIds",
      "temperatureSchedule",
      "driftBefore",
      "driftAfter",
    ]),
    tableRow(["---", "---", "---:", "---", "---", "---", "---", "---:", "---:"]),
    tableRow([
      summary.schemaPreview.laneId,
      summary.schemaPreview.eligibleHeads.join(", "),
      summary.schemaPreview.confidence,
      summary.schemaPreview.accepted,
      summary.schemaPreview.fallbackUsed,
      summary.schemaPreview.fallbackPatchIds.join(", "),
      summary.schemaPreview.temperatureSchedule.join(", "),
      summary.schemaPreview.driftBefore,
      summary.schemaPreview.driftAfter,
    ]),
    "",
    "## Deferred Layers",
    "",
    ...summary.deferredLayers.map((item) => `- ${item}`),
    "",
    "## Read",
    "",
    summary.read,
    "",
  ];
  await fs.writeFile(path.join(outputDir, "README.md"), `${lines.join("\n")}\n`, "utf8");
}

function coldPathFixture() {
  return evaluateColdPathFallback({
    patches: [
      {
        id: "patch-governance",
        laneId: "governance-adversarial",
        headId: "governance",
        text: "legal hold custodians audit evidence retention policy deletion exception compliance attestation",
      },
      {
        id: "patch-unknown",
        laneId: "governance-adversarial",
        headId: "governance",
        text: "ambiguous stray tokens without lane evidence",
      },
      {
        id: "patch-quote",
        laneId: "quote",
        headId: "quoteRepair",
        text: "quoted passage speaker attribution paragraph quotation line says remembered phrase",
      },
    ],
  });
}

function steFixture() {
  return simulateSteTemperatureDecay({
    values: [-0.2, -0.04, 0.03, 0.06, -0.01, 0.18],
    perturbations: [0.05, -0.02, 0.03, -0.06],
    temperatureSchedule: [2, 1, 0.5, 0.25],
  });
}

function buildModeReport(mode) {
  if (mode === "runtime") return runV28RuntimeHardeningProbe();
  if (mode === "ste") {
    const ste = steFixture();
    return {
      schemaVersion: "v28-ste-proof-report-v1",
      generatedAt: new Date().toISOString(),
      claimLevel: ste.accepted ? "ste-stability-proof" : "ste-stability-failed",
      ste,
      deferredLayers: ["BART", "Wasm SIMD", "Durable Object sharding", "QJL", "Cloudmersive"],
    };
  }
  const coldPath = coldPathFixture();
  return {
    schemaVersion: "v28-cold-path-proof-report-v1",
    generatedAt: new Date().toISOString(),
    claimLevel:
      coldPath.sequenceAccepted && coldPath.fallbackUsed
        ? "cold-path-proof"
        : "cold-path-failed",
    coldPath,
    deferredLayers: ["BART", "Wasm SIMD", "Durable Object sharding", "QJL", "Cloudmersive"],
  };
}

function buildSummary({ mode, outputDir, reportPath, report }) {
  const contract = report.contracts?.[0] || {};
  const coldPath = report.coldPath || report.coldPath || {};
  const ste = report.ste || report.ste || {};
  return {
    title:
      mode === "runtime"
        ? "V28 Runtime-Governance Hardening Probe"
        : mode === "ste"
          ? "V28 STE Temperature-Decay Probe"
          : "V28 Cold-Path Fallback Probe",
    mode,
    generatedAt: report.generatedAt,
    outputDir: relativeProjectPath(outputDir),
    claimLevel: report.claimLevel,
    report: relativeProjectPath(reportPath),
    schemaPreview: {
      laneId: contract.laneId || report.coldPath?.patchDecisions?.[0]?.laneId || null,
      eligibleHeads: contract.eligibleHeads || report.coldPath?.patchDecisions?.[0]?.eligibleHeads || [],
      confidence: contract.confidence ?? report.coldPath?.patchDecisions?.[0]?.confidence ?? null,
      accepted: contract.accepted ?? report.coldPath?.patchDecisions?.[0]?.accepted ?? null,
      fallbackUsed: report.coldPath?.fallbackUsed ?? null,
      fallbackPatchIds: report.coldPath?.fallbackPatchIds || [],
      temperatureSchedule: report.ste?.temperatureSchedule || [],
      driftBefore: report.ste?.driftBefore ?? null,
      driftAfter: report.ste?.driftAfter ?? null,
    },
    deferredLayers: report.deferredLayers || [],
    read:
      mode === "runtime"
        ? "V28 proves local runtime governance only: hard lane contracts, patch-local cold fallback, and STE temperature-decay simulation. It is not a deployment or production runtime."
        : mode === "ste"
          ? "This is a controlled STE stabilization simulation. It does not train a new model."
          : "This proves fallback is patch-local and does not fail the whole sequence.",
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir =
    args.outputDir ||
    path.join(projectRoot, "bench", `fortify-${dateSlug()}-v28-${args.mode}`);
  const report = buildModeReport(args.mode);
  const reportPath = path.join(outputDir, `${args.mode}-report.json`);
  const summaryPath = path.join(outputDir, "summary.json");
  const summary = buildSummary({ mode: args.mode, outputDir, reportPath, report });

  await writeJson(reportPath, report);
  await writeJson(summaryPath, summary);
  await writeReadme({ outputDir, summary });

  const ok = !String(summary.claimLevel).endsWith("failed");
  console.log(
    JSON.stringify(
      {
        ok,
        outputDir: relativeProjectPath(outputDir),
        claimLevel: summary.claimLevel,
        summary: relativeProjectPath(summaryPath),
        report: relativeProjectPath(reportPath),
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
