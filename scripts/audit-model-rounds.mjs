import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const CANDIDATES = [
  {
    id: "v3-storage-baseline",
    role: "storage baseline",
    reports: {
      bookRoot: "bench/2026-05-06-book-root-benchmark-v3-hierarchical-packer-v2.json",
      archive: "bench/2026-04-29-archive-pressure-v3-hierarchical-packer-v2.json",
    },
    suite: "bench/eval-suite-learned-hybrid-v3-hierarchical-packer-v2/suite-summary.json",
  },
  {
    id: "v6-governance-archive-specialist",
    role: "governance/archive specialist",
    reports: {
      governance: "bench/2026-05-05-governance-adversarial-v6-legalhold-archive-hierarchical-packer-v1.json",
      archive: "bench/2026-05-05-archive-pressure-v6-legalhold-archive-hierarchical-packer-v1.json",
    },
    suite: "bench/eval-suite-learned-hybrid-v6-legalhold-archive-hierarchical-packer-v1/suite-summary.json",
  },
  {
    id: "v8-control-bridge-specialist",
    role: "book-root/control bridge specialist",
    reports: {
      bookRoot: "bench/2026-05-06-book-root-benchmark-v8-control-bridge-hierarchical-packer-v2.json",
      governance: "bench/2026-05-07-governance-adversarial-v8-control-bridge-hierarchical-packer-v2.json",
    },
    suite: "bench/eval-suite-learned-hybrid-v8-control-bridge-hierarchical-packer-v2/suite-summary.json",
  },
  {
    id: "v10-constrained-merge",
    role: "best combined constrained merge candidate",
    reports: {
      bookRoot: "bench/2026-05-07-book-root-benchmark-v10-constrained-merge-hierarchical-packer-v2.json",
      booklike: "bench/2026-05-07-booklike-benchmark-v10-constrained-merge-hierarchical-packer-v2.json",
      megaBook: "bench/2026-05-07-mega-book-benchmark-v10-constrained-merge-hierarchical-packer-v2.json",
      governance: "bench/2026-05-07-governance-adversarial-v10-constrained-merge-hierarchical-packer-v2.json",
      archive: "bench/2026-05-07-archive-pressure-v10-constrained-merge-hierarchical-packer-v2.json",
    },
    suite: "bench/eval-suite-learned-hybrid-v10-constrained-merge-hierarchical-packer-v2/suite-summary.json",
  },
  {
    id: "v13-governance-archive-fold-specialist",
    role: "governance/archive fold specialist",
    reports: {
      bookRoot: "bench/2026-05-07-book-root-benchmark-v13-balanced-triad-hierarchical-packer-v2.json",
      governance: "bench/2026-05-07-governance-adversarial-v13-balanced-triad-hierarchical-packer-v2.json",
      archive: "bench/2026-05-07-archive-pressure-v13-balanced-triad-hierarchical-packer-v2.json",
    },
  },
  {
    id: "v14-negative-probe",
    role: "failed book-root reinforcement probe",
    reports: {
      bookRoot: "bench/2026-05-07-book-root-benchmark-v14-book-root-balance-hierarchical-packer-v2.json",
      governance: "bench/2026-05-07-governance-adversarial-v14-book-root-balance-hierarchical-packer-v2.json",
      archive: "bench/2026-05-07-archive-pressure-v14-book-root-balance-hierarchical-packer-v2.json",
    },
  },
];

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.join(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function parseArgs(argv) {
  const out = {
    output: path.join(projectRoot, "bench", "2026-05-07-model-role-audit.json"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output" && argv[index + 1]) {
      out.output = resolveProjectPath(argv[index + 1]);
      index += 1;
    }
  }

  return out;
}

async function readJsonIfExists(relativePath) {
  if (!relativePath) return null;
  try {
    return JSON.parse(await fs.readFile(resolveProjectPath(relativePath), "utf8"));
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

function summarizeReport(report) {
  if (!report) return null;
  const semantic = report.evidenceAssessment?.semanticSignal || null;
  return {
    entries: report.summary?.entries ?? null,
    avgPatchesPerEntry: report.summary?.avgExperimentalPatchesPerEntry ?? null,
    patchesPerToken: report.summary?.experimentalPatchesPerToken ?? null,
    minMargin: semantic?.minSeparationMargin ?? null,
    allMarginsPositive: semantic?.allMarginsPositive ?? null,
    negativeGroups: semantic?.negativeGroups || [],
    groups:
      semantic?.groups?.map((group) => ({
        group: group.group,
        separationMargin: group.separationMargin,
      })) || [],
  };
}

function summarizeSuite(suite) {
  if (!suite) return null;
  const semanticSuites = (suite.suites || []).filter(
    (item) => item.allSemanticMarginsPositive !== null
  );
  return {
    suiteCount: suite.suiteCount ?? suite.suites?.length ?? null,
    semanticPassCount: semanticSuites.filter((item) => item.allSemanticMarginsPositive === true).length,
    semanticFailCount: semanticSuites.filter((item) => item.allSemanticMarginsPositive === false).length,
    failedSemanticSuites: semanticSuites
      .filter((item) => item.allSemanticMarginsPositive === false)
      .map((item) => item.id),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const candidates = [];

  for (const candidate of CANDIDATES) {
    const reports = {};
    for (const [key, relativePath] of Object.entries(candidate.reports || {})) {
      reports[key] = summarizeReport(await readJsonIfExists(relativePath));
      if (reports[key]) {
        reports[key].path = relativePath;
      }
    }

    candidates.push({
      id: candidate.id,
      role: candidate.role,
      reports,
      suite: summarizeSuite(await readJsonIfExists(candidate.suite)),
      suitePath: candidate.suite || null,
    });
  }

  const audit = {
    generatedAt: new Date().toISOString(),
    purpose:
      "Compact role/failure matrix for current 16xVS learned-hybrid rounds. This is an audit artifact, not a promotion decision.",
    candidates,
    conclusion: {
      bestCurrentOverall: "v10-constrained-merge",
      keepAsSpecialists: [
        "v3-storage-baseline",
        "v6-governance-archive-specialist",
        "v8-control-bridge-specialist",
        "v13-governance-archive-fold-specialist",
      ],
      doNotPromote: ["v11-targeted-bridge-audit", "v12-blend-sweep", "v14-negative-probe"],
      nextHypothesis:
        "Use group-aware calibration/guarding on top of v10/v13 instead of broad phrase injection or scalar blend sweeps.",
    },
  };

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        ok: true,
        output: relativeProjectPath(args.output),
        candidateCount: candidates.length,
        bestCurrentOverall: audit.conclusion.bestCurrentOverall,
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
