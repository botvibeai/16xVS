import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { inferRouteIdForCorpus } from "../core/auto-route.mjs";
import {
  rankValidatedHeads,
  selectValidatedHead,
  summarizeHeadReport,
} from "../core/head-validator.mjs";
import { createLearnedEncoderAdapter } from "../core/learned-encoder.mjs";
import { computeMultiHeadStorage } from "../core/multi-head-routing.mjs";
import { runBenchmark } from "./benchmark.mjs";

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

function parseKeyValue(value, label) {
  const splitAt = String(value || "").indexOf("=");
  if (splitAt <= 0) {
    throw new Error(`Invalid ${label}; expected name=value.`);
  }
  return {
    key: value.slice(0, splitAt),
    value: value.slice(splitAt + 1),
  };
}

function parseArgs(argv) {
  const out = {
    input: null,
    output: null,
    semantic: null,
    perturbation: null,
    limit: null,
    heads: {},
    fallbackHead: "default",
    storedHeadCount: null,
    minimumScore: 6,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input" && argv[index + 1]) {
      out.input = resolveProjectPath(argv[++index]);
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = resolveProjectPath(argv[++index]);
    } else if (arg === "--semantic" && argv[index + 1]) {
      out.semantic = resolveProjectPath(argv[++index]);
    } else if (arg === "--perturbation" && argv[index + 1]) {
      out.perturbation = resolveProjectPath(argv[++index]);
    } else if (arg === "--limit" && argv[index + 1]) {
      const value = Number(argv[++index]);
      out.limit = Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : null;
    } else if (arg === "--head" && argv[index + 1]) {
      const { key, value } = parseKeyValue(argv[++index], "--head");
      out.heads[key] = resolveProjectPath(value);
    } else if (arg === "--fallback-head" && argv[index + 1]) {
      out.fallbackHead = argv[++index];
    } else if (arg === "--stored-head-count" && argv[index + 1]) {
      const value = Number(argv[++index]);
      out.storedHeadCount = Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : null;
    } else if (arg === "--minimum-score" && argv[index + 1]) {
      const value = Number(argv[++index]);
      out.minimumScore = Number.isFinite(value) ? value : out.minimumScore;
    }
  }

  if (!out.input) throw new Error("Missing --input");
  if (!out.output) throw new Error("Missing --output");
  if (Object.keys(out.heads).length === 0) throw new Error("At least one --head is required");
  if (!out.heads[out.fallbackHead]) {
    throw new Error(`Missing fallback --head '${out.fallbackHead}'.`);
  }
  return out;
}

async function readCorpus(input, limit) {
  const raw = await fs.readFile(input, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return limit ? lines.slice(0, limit) : lines;
}

async function runHeadBenchmark({ headId, modelPath, args }) {
  const model = JSON.parse(await fs.readFile(modelPath, "utf8"));
  const report = await runBenchmark({
    input: args.input,
    output: args.output,
    semantic: args.semantic,
    perturbation: args.perturbation,
    limit: args.limit,
    encoder: createLearnedEncoderAdapter(model),
  });
  report.validatedHeadCandidate = {
    headId,
    model: relativeProjectPath(modelPath),
  };
  return report;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const corpus = await readCorpus(args.input, args.limit);
  const route = inferRouteIdForCorpus(corpus, { minimumScore: args.minimumScore });
  const candidateHead = route.selectedHead;
  const candidateModelPath = args.heads[candidateHead] || args.heads[args.fallbackHead];
  if (!candidateModelPath) {
    throw new Error(`Auto-selected head '${candidateHead}' has no configured model path.`);
  }

  const headIds = Array.from(
    new Set([candidateHead, args.fallbackHead, ...Object.keys(args.heads)])
  );
  const reportsByHead = {};

  for (const headId of headIds) {
    const modelPath = args.heads[headId];
    if (!modelPath) throw new Error(`Missing --head '${headId}'.`);
    reportsByHead[headId] = await runHeadBenchmark({ headId, modelPath, args });
  }

  const selection = selectValidatedHead({
    candidateHeadId: candidateHead,
    fallbackHeadId: args.fallbackHead,
    reportsByHead,
  });
  const fullHeadRanking = rankValidatedHeads({
    candidateHeadId: candidateHead,
    fallbackHeadId: args.fallbackHead,
    reportsByHead,
  });
  const selectedReport = reportsByHead[selection.selectedHeadId];
  const selectedModelPath = args.heads[selection.selectedHeadId];

  selectedReport.autoRoute = {
    routeId: route.routeId,
    candidateRouteId: route.candidateRouteId,
    lexicalSelectedHead: route.selectedHead,
    selectedHead: selection.selectedHeadId,
    scores: route.scores,
    ranked: route.ranked,
    minimumScore: route.minimumScore,
    confidenceGuard: route.confidenceGuard,
    selectedModel: relativeProjectPath(selectedModelPath),
  };
  selectedReport.headValidation = {
    ...selection,
    fullHeadRanking,
    reports: Object.fromEntries(
      Object.entries(reportsByHead).map(([headId, report]) => [
        headId,
        summarizeHeadReport(report),
      ])
    ),
  };
  selectedReport.multiHeadStorage = computeMultiHeadStorage(selectedReport.summary, {
    storedHeadCount: args.storedHeadCount || Object.keys(args.heads).length,
    codeBytesPerPatch: 32,
  });

  await fs.writeFile(args.output, `${JSON.stringify(selectedReport, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        output: relativeProjectPath(args.output),
        routeId: route.routeId,
        candidateHead,
        selectedHead: selection.selectedHeadId,
        reason: selection.reason,
        fullHeadRanking: fullHeadRanking.map((item) => ({
          rank: item.rank,
          headId: item.headId,
          accepted: item.accepted,
          routeFitRole: item.routeFitRole,
          minSemanticMargin: item.metrics.minSemanticMargin,
          signatureCollapse: item.metrics.signatureCollapse,
          avgPatchesPerEntry: item.metrics.avgPatchesPerEntry,
        })),
        selectedModel: relativeProjectPath(selectedModelPath),
        selectedResult: selectedReport.evidenceAssessment?.resultLabel ?? null,
        selectedMinSemanticMargin:
          selectedReport.evidenceAssessment?.semanticSignal?.minSeparationMargin ?? null,
        selectedSignatureCollapse:
          selectedReport.evidenceAssessment?.collapseChecks?.signatureCollapse ?? null,
        selectedAvgNearestSignatureDistance:
          selectedReport.evidenceAssessment?.collapseChecks?.avgNearestSignatureDistance ?? null,
        avgPatchesPerEntry: selectedReport.summary.avgExperimentalPatchesPerEntry,
        allHeadsBinaryVsSourceRatio:
          selectedReport.multiHeadStorage.allHeadsBinaryVsSourceRatio,
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
