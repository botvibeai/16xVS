import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { inferRouteIdForCorpus } from "../core/auto-route.mjs";
import { createLearnedEncoderAdapter } from "../core/learned-encoder.mjs";
import {
  buildMegaBookLadderFixture,
  evaluateMegaBookLadder,
} from "../core/mega-book-ladder.mjs";
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
    output: resolveProjectPath("bench/2026-05-07-mega-book-ladder-v18-confidence-routed.json"),
    corpusOutput: resolveProjectPath("bench/mega-book-ladder-corpus-2026-05-07.txt"),
    semanticOutput: resolveProjectPath("bench/mega-book-ladder-semantic-2026-05-07.json"),
    heads: {},
    storedHeadCount: null,
    minimumScore: 6,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output" && argv[index + 1]) {
      out.output = resolveProjectPath(argv[++index]);
    } else if (arg === "--corpus-output" && argv[index + 1]) {
      out.corpusOutput = resolveProjectPath(argv[++index]);
    } else if (arg === "--semantic-output" && argv[index + 1]) {
      out.semanticOutput = resolveProjectPath(argv[++index]);
    } else if (arg === "--head" && argv[index + 1]) {
      const { key, value } = parseKeyValue(argv[++index], "--head");
      out.heads[key] = resolveProjectPath(value);
    } else if (arg === "--stored-head-count" && argv[index + 1]) {
      const value = Number(argv[++index]);
      out.storedHeadCount = Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : null;
    } else if (arg === "--minimum-score" && argv[index + 1]) {
      const value = Number(argv[++index]);
      out.minimumScore = Number.isFinite(value) ? value : out.minimumScore;
    }
  }

  if (Object.keys(out.heads).length === 0) throw new Error("At least one --head is required.");
  return out;
}

async function writeFixtureFiles(fixture, args) {
  await fs.mkdir(path.dirname(args.corpusOutput), { recursive: true });
  await fs.writeFile(args.corpusOutput, `${fixture.corpus.join("\n")}\n`, "utf8");
  await fs.writeFile(
    args.semanticOutput,
    `${JSON.stringify(fixture.semanticGroups, null, 2)}\n`,
    "utf8"
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fixture = buildMegaBookLadderFixture();
  await writeFixtureFiles(fixture, args);

  const route = inferRouteIdForCorpus(fixture.corpus, { minimumScore: args.minimumScore });
  const selectedModelPath = args.heads[route.selectedHead] || args.heads.default;
  if (!selectedModelPath) {
    throw new Error(`Auto-selected head '${route.selectedHead}' has no configured model path.`);
  }

  const selectedModel = JSON.parse(await fs.readFile(selectedModelPath, "utf8"));
  const encoder = createLearnedEncoderAdapter(selectedModel);
  const report = await runBenchmark({
    input: args.corpusOutput,
    output: args.output,
    semantic: args.semanticOutput,
    encoder,
  });

  report.autoRoute = {
    routeId: route.routeId,
    candidateRouteId: route.candidateRouteId,
    selectedHead: route.selectedHead,
    scores: route.scores,
    ranked: route.ranked,
    minimumScore: route.minimumScore,
    confidenceGuard: route.confidenceGuard,
    selectedModel: relativeProjectPath(selectedModelPath),
  };
  report.multiHeadStorage = computeMultiHeadStorage(report.summary, {
    storedHeadCount: args.storedHeadCount || Object.keys(args.heads).length,
    codeBytesPerPatch: 32,
  });
  report.megaBookLadder = evaluateMegaBookLadder({
    books: fixture.books,
    encoder,
  });

  await fs.writeFile(args.output, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        output: relativeProjectPath(args.output),
        corpus: relativeProjectPath(args.corpusOutput),
        semantic: relativeProjectPath(args.semanticOutput),
        routeId: route.routeId,
        selectedHead: route.selectedHead,
        entries: report.summary.entries,
        avgPatchesPerEntry: report.summary.avgExperimentalPatchesPerEntry,
        semanticAllPositive:
          report.evidenceAssessment?.semanticSignal?.allMarginsPositive ?? null,
        minSemanticMargin:
          report.evidenceAssessment?.semanticSignal?.minSeparationMargin ?? null,
        ladderAllPositive: report.megaBookLadder.summary.allRootChapterMarginsPositive,
        ladderMinMargin: report.megaBookLadder.summary.minRootChapterMargin,
        allHeadsBinaryVsSourceRatio: report.multiHeadStorage.allHeadsBinaryVsSourceRatio,
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
