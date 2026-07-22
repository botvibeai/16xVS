import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const BOOKLIKE_BOUNDARY_GROUPS = [
  {
    id: "booklike_multilingual_equity_boundary",
    domain: "booklike_repair",
    description:
      "Training-only support for language-neutral cost, script-neutral rendering, and multilingual archive equity. Does not include the old booklike holdout passages verbatim.",
    items: [
      "language should not dictate compute cost across scripts",
      "script neutral renderer updates avoid repeated tokenizer surgery",
      "mixed enterprise records enter one visual patch grammar",
      "multilingual support notes avoid an english first token tax",
      "regional manuals and symbol streams share a normalized visual representation",
      "out of vocabulary drift becomes renderer maintenance instead of embedding surgery",
      "language neutral patch grammar keeps cost predictable over long archives",
      "cross script records should not fragment meaning differently by language",
    ],
  },
  {
    id: "booklike_storage_economics_boundary",
    domain: "booklike_repair",
    description:
      "Training-only support for replicated storage economics, binary source footprint, and macro/residual byte discipline.",
    items: [
      "replication economics depend on compact units before durability copies",
      "live fallback and vault copies multiply storage unless the macro record is small",
      "source compression and dense vector replacement are separate storage claims",
      "macro code plus residual budget must remain below source size",
      "repair should rebuild degraded tiers without reprocessing full source text",
      "storage margin disappears when each archive copy stores bulky fragments",
      "binary record footprint must be measured after replication overhead",
      "chapter length storage claims need compact durable archive units",
    ],
  },
  {
    id: "booklike_retrieval_boundary",
    domain: "booklike_repair",
    description:
      "Training-only support for exact Hamming retrieval, low object count, and compact search locality.",
    items: [
      "exact hamming retrieval stays cheap when long passages keep few fragments",
      "binary search weakens if every chapter explodes into many windows",
      "macro code plus residual segments should preserve retrieval shape",
      "chapter sized passages stress search locality and object count together",
      "near exact binary comparison depends on compact candidate records",
      "long reference material needs retrieval quality without patch explosion",
      "stored signatures should rerank candidates without rebuilding full windows",
      "archive search succeeds when compact representation and separation coexist",
    ],
  },
  {
    id: "booklike_pricing_operations_boundary",
    domain: "booklike_repair",
    description:
      "Training-only support for operational pricing, evidence discipline, and margin preservation.",
    items: [
      "pricing margin depends on reducing operational units before transfer and retention",
      "disruptive pricing needs storage gains that survive hidden overhead",
      "chapter length benchmarks must not become terminal economics claims",
      "evidence artifacts and reports need preservation across model rounds",
      "proof ledgers keep strategy narratives behind implementation evidence",
      "operating discipline means every claim maps back to stored reports",
      "storage efficiency matters to business model only when gains persist",
      "benchmark artifacts are part of the product evidence trail",
    ],
  },
  {
    id: "booklike_hardware_edge_boundary",
    domain: "booklike_repair",
    description:
      "Training-only support for edge-native binary comparison, low-power retrieval, and memory-movement limits.",
    items: [
      "edge native retrieval needs compact binary records under realistic sequence length",
      "cheap bitwise comparison fails if long text balloons into many fragments",
      "memory movement can erase arithmetic efficiency before accelerators matter",
      "one bit reasoning claims depend on representation shape staying compact",
      "low power search requires small macro records and controlled residuals",
      "hardware friendly retrieval begins with object count discipline",
      "chapter like passages reveal whether compression is structural or short line luck",
      "edge compute remains plausible only when long text keeps compact signatures",
    ],
  },
  {
    id: "booklike_governance_evidence_boundary",
    domain: "booklike_repair",
    description:
      "Training-only support for claim governance, dated ledgers, snapshot preservation, and audit-grade evidence records.",
    items: [
      "proof ledgers prevent directional results from being described as proven",
      "dated reports and holdout failures must stay attached to every claim",
      "snapshot preservation keeps winning and losing rounds reproducible",
      "archive evidence must survive across models ledgers and derived variants",
      "claim boundaries are technical controls for benchmark honesty",
      "governed evidence records stop theory and implementation from blending",
      "long form results require preserved artifacts before larger claims",
      "audit grade benchmark history makes future comparisons trustworthy",
    ],
  },
];

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function parseArgs(argv) {
  const out = {
    baseSpec: path.join(projectRoot, "data", "training", "embedding-training-spec-v6-book-root.json"),
    output: path.join(projectRoot, "data", "training", "embedding-training-spec-v21-booklike-repair.json"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-spec" && argv[index + 1]) {
      out.baseSpec = resolveProjectPath(argv[++index]);
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = resolveProjectPath(argv[++index]);
    }
  }

  return out;
}

function buildAllCrossPairs(groupIds) {
  const pairs = [];
  for (let left = 0; left < groupIds.length; left += 1) {
    for (let right = left + 1; right < groupIds.length; right += 1) {
      pairs.push([groupIds[left], groupIds[right]]);
    }
  }
  return pairs;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseSpec = JSON.parse(await fs.readFile(args.baseSpec, "utf8"));
  const basePairs = Array.isArray(baseSpec.hardNegativeGroupPairs)
    ? baseSpec.hardNegativeGroupPairs
    : [];
  const boundaryIds = BOOKLIKE_BOUNDARY_GROUPS.map((group) => group.id);
  const boundaryPairs = buildAllCrossPairs(boundaryIds);
  const anchorPairs = [
    ["booklike_multilingual_equity_boundary", "control_book_root_training"],
    ["booklike_governance_evidence_boundary", "control_book_root_training"],
    ["booklike_storage_economics_boundary", "economics_book_root_training"],
    ["booklike_pricing_operations_boundary", "economics_book_root_training"],
    ["booklike_retrieval_boundary", "systems_book_root_training"],
    ["booklike_hardware_edge_boundary", "systems_book_root_training"],
  ];

  const output = {
    ...baseSpec,
    version: 21,
    description:
      "V21 booklike repair probe. Starts from v6/v3-style hierarchical geometry and adds training-only booklike boundary support groups to test whether the old booklike semantic failure is trainable without changing the locked v19 proof package.",
    negativeMode: "explicit",
    negativeSampleLimitPerPair: 48,
    groups: [...(baseSpec.groups || []), ...BOOKLIKE_BOUNDARY_GROUPS],
    hardNegativeGroupPairs: [...basePairs, ...boundaryPairs, ...anchorPairs],
    ancestry: {
      ...(baseSpec.ancestry || {}),
      baseSpec: relativeProjectPath(args.baseSpec),
      repairTarget: "booklike-corpus-2026-04-25",
      exactHoldoutTextIncluded: false,
    },
    targetedRound: {
      target: "booklike semantic boundary repair",
      primaryWeakGroup: "multilingual_equity_booklike",
      secondaryWeakGroups: ["governance_evidence_booklike", "hardware_edge_booklike"],
      proofBoundary: "targeted repair probe only; not a new lock baseline",
    },
  };

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseSpec: relativeProjectPath(args.baseSpec),
        output: relativeProjectPath(args.output),
        groupCount: output.groups.length,
        addedGroups: boundaryIds,
        hardNegativeGroupPairCount: output.hardNegativeGroupPairs.length,
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
