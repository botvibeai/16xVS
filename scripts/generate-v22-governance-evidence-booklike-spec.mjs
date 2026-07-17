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
      "Training-only support for language-neutral cost, script-neutral rendering, and multilingual archive equity.",
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
  {
    id: "booklike_governance_evidence_longform_boundary",
    domain: "booklike_repair",
    description:
      "Narrow v22 support for the remaining governance-evidence booklike miss. The language is paraphrased and training-only.",
    items: [
      "A proof package should carry the corpus, report, model path, dated ledger, and failure note together so the claim can be checked later instead of remembered from a successful run.",
      "Benchmark governance is a technical control: it separates measured evidence from strategy language, keeps failed holdouts visible, and blocks a directional result from being renamed as production proof.",
      "A reproducible archive of models, reports, scripts, and summaries makes long-form tokenizer work reviewable across time even when later rounds improve one metric and damage another.",
      "Evidence custody matters because a compact representation is not useful proof if the system loses the artifacts that show which corpus, semantic groups, and model variant produced the result.",
      "The release dossier should state what passed, what failed, what stayed directional, and which extreme claims remain outside the locked evidence boundary.",
      "Governed benchmark records describe proof-package discipline, not legal hold disposal, account access review, or compliance attestation workflow.",
      "A long-form evidence chapter is about preserved reports, dated failures, and claim boundaries rather than pricing margin, retrieval speed, or hardware efficiency.",
      "Future comparisons need stable artifacts, hashable files, and negative results so the work can improve without quietly rewriting history.",
    ],
  },
];

const EXISTING_GROUP_ADDITIONS = {
  control_book_root_training: [
    "book scale evidence records keep multilingual claims and proof boundaries attached",
    "long form proof packages preserve failure ledgers before larger tokenizer claims",
    "language neutral archive claims need dated reports and stable model evidence",
    "governance evidence for book scale compression stays inside the locked proof record",
  ],
  audit_evidence_training: [
    "benchmark evidence packet lists model variant corpus report and dated result",
    "proof record shows which semantic gate passed and which gate failed",
    "audit trail for the experiment keeps the negative report attached",
  ],
  retention_policy_training: [
    "retention metadata stays separate from benchmark proof package claims",
    "policy lifecycle evidence should not overwrite measured model failures",
  ],
  archive_catalog_training: [
    "archive catalog keeps model reports and proof artifacts discoverable",
    "stored evidence bundle includes corpus notes report files and claim boundary",
  ],
  compliance_attestation_training: [
    "attestation language remains distinct from tokenizer proof-package evidence",
    "compliance certification is not the same as benchmark claim governance",
  ],
};

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function parseArgs(argv) {
  const out = {
    baseSpec: path.join(projectRoot, "data", "training", "embedding-training-spec-v13-balanced-triad.json"),
    output: path.join(
      projectRoot,
      "data",
      "training",
      "embedding-training-spec-v22-governance-evidence-booklike.json"
    ),
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

function appendExistingGroupAdditions(groups) {
  return groups.map((group) => {
    const additions = EXISTING_GROUP_ADDITIONS[group.id] || [];
    if (additions.length === 0) return group;

    return {
      ...group,
      description: `${group.description} V22 adds narrow governance-evidence replay support while preserving existing hard-negative boundaries.`,
      items: Array.from(new Set([...(group.items || []), ...additions])),
    };
  });
}

function uniquePairs(pairs) {
  const seen = new Set();
  const output = [];
  for (const pair of pairs) {
    if (!Array.isArray(pair) || pair.length !== 2) continue;
    const key = pair.join("\u0000");
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(pair);
  }
  return output;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseSpec = JSON.parse(await fs.readFile(args.baseSpec, "utf8"));
  const boundaryIds = BOOKLIKE_BOUNDARY_GROUPS.map((group) => group.id);
  const boundaryPairs = buildAllCrossPairs(boundaryIds);
  const targetPairs = [
    ["booklike_governance_evidence_longform_boundary", "legal_hold_training"],
    ["booklike_governance_evidence_longform_boundary", "deletion_exception_training"],
    ["booklike_governance_evidence_longform_boundary", "access_review_training"],
    ["booklike_governance_evidence_longform_boundary", "compliance_attestation_training"],
    ["booklike_governance_evidence_longform_boundary", "booklike_pricing_operations_boundary"],
    ["booklike_governance_evidence_longform_boundary", "booklike_storage_economics_boundary"],
    ["booklike_governance_evidence_longform_boundary", "booklike_retrieval_boundary"],
    ["booklike_governance_evidence_longform_boundary", "booklike_hardware_edge_boundary"],
  ];

  const output = {
    ...baseSpec,
    version: 22,
    description:
      "V22 governance-evidence booklike repair probe. Starts from the v13 balanced-triad guardrail specialist, adds v21-style booklike boundaries, and removes v21's risky hard-negative anchors against matching book-root groups.",
    negativeMode: "explicit",
    // V22 starts from a much larger v13 base, so keep negatives bounded.
    negativeSampleLimitPerPair: 16,
    groups: [...appendExistingGroupAdditions(baseSpec.groups || []), ...BOOKLIKE_BOUNDARY_GROUPS],
    hardNegativeGroupPairs: uniquePairs([
      ...(baseSpec.hardNegativeGroupPairs || []),
      ...boundaryPairs,
      ...targetPairs,
    ]),
    ancestry: {
      ...(baseSpec.ancestry || {}),
      baseSpec: relativeProjectPath(args.baseSpec),
      repairSource: "v21 booklike repaired most groups but left governance_evidence_booklike negative",
      riskyV21AnchorPairsRemoved: true,
      exactHoldoutTextIncludedByNewGroups: false,
    },
    targetedRound: {
      target: "governance_evidence_booklike narrow repair",
      expectedPrimaryChange: "repair governance_evidence_booklike without sacrificing v19 guardrail shape",
      proofBoundary: "targeted repair probe only; not a new lock baseline unless guardrails pass",
      addedBoundaryGroups: boundaryIds,
      appendedExistingGroups: Object.keys(EXISTING_GROUP_ADDITIONS),
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
