import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const BOOK_ROOT_METADATA = {
  economics_book_root: {
    id: "economics_book_root_training",
    domain: "book_root",
    description:
      "Long-form storage economics and operational archive discipline phrasing for synthetic book-root supervision.",
    extras: [
      "archive economics depend on compact replicated units and preserved evidence artifacts",
      "long form storage margin survives only when macro codes stay small before durability copies",
    ],
  },
  systems_book_root: {
    id: "systems_book_root_training",
    domain: "book_root",
    description:
      "Long-form retrieval and edge-compute compatibility phrasing for synthetic book-root supervision.",
    extras: [
      "edge retrieval stays plausible only when long passages remain compact under exact binary comparison",
      "hardware friendly archive search needs macro plus residual compression instead of window explosion",
    ],
  },
  control_book_root: {
    id: "control_book_root_training",
    domain: "book_root",
    description:
      "Long-form multilingual equity and governance evidence phrasing for synthetic book-root supervision.",
    extras: [
      "book scale archives need language neutral patches and evidence bound ledgers to stay trustworthy",
      "multilingual fairness and governance discipline both require stable long form representation",
    ],
  },
};

const SUPPORT_GROUPS = [
  {
    id: "control_bridge_training",
    domain: "control_bridge",
    description:
      "Short bridge phrases that intentionally bind multilingual fairness, governance, and archival evidence without using the frozen book-root passages directly.",
    items: [
      "language neutral evidence ledger",
      "multilingual governance archive",
      "cross-script audit trail",
      "script-neutral compliance record",
      "governed multilingual evidence set",
      "archive evidence across languages",
      "language-fair records policy",
      "cross-language preservation rule",
    ],
  },
  {
    id: "storage_resilience_support_training",
    domain: "storage_support",
    description:
      "Short storage resilience phrasing to defend the paraphrase holdout while long-form book-root supervision is added.",
    items: [
      "resilient archive copy plan",
      "replica restore procedure",
      "vault mirror preservation",
      "durable backup copy rule",
      "archive redundancy workflow",
      "failover copy retention",
      "redundant vault replica",
      "backup archive recovery step",
    ],
  },
  {
    id: "storage_multilingual_support_training",
    domain: "multilingual_support",
    description:
      "Training-only multilingual storage phrasing across the scripts that are weakest in the frozen controlled suite.",
    items: [
      "durable storage rule",
      "regla de almacenamiento durable",
      "règle de stockage durable",
      "dauerhafte speicherregel",
      "قاعدة تخزين متينة",
      "टिकाऊ संग्रहण नियम",
      "耐久存储规则",
    ],
  },
  {
    id: "search_multilingual_support_training",
    domain: "multilingual_support",
    description:
      "Training-only multilingual search phrasing across the scripts that are weakest in the frozen controlled suite.",
    items: [
      "visual signature lookup",
      "búsqueda de firma visual",
      "recherche de signature visuelle",
      "visuelle signatursuche",
      "بحث عن توقيع بصري",
      "दृश्य हस्ताक्षर खोज",
      "视觉签名检索",
    ],
  },
];

const SUPPORT_NEGATIVE_PAIRS = [
  ["control_bridge_training", "economics_book_root_training"],
  ["control_bridge_training", "systems_book_root_training"],
  ["control_bridge_training", "storage_training"],
  ["control_bridge_training", "retrieval_training"],
  ["control_bridge_training", "finance_training"],
  ["storage_resilience_support_training", "launch_training"],
  ["storage_resilience_support_training", "planning_training"],
  ["storage_resilience_support_training", "finance_training"],
  ["storage_resilience_support_training", "support_training"],
  ["storage_resilience_support_training", "retrieval_training"],
  ["storage_multilingual_support_training", "launch_training"],
  ["storage_multilingual_support_training", "retrieval_training"],
  ["storage_multilingual_support_training", "finance_training"],
  ["storage_multilingual_support_training", "support_training"],
  ["search_multilingual_support_training", "launch_training"],
  ["search_multilingual_support_training", "storage_training"],
  ["search_multilingual_support_training", "finance_training"],
  ["search_multilingual_support_training", "support_training"],
  ["storage_multilingual_support_training", "search_multilingual_support_training"],
  ["storage_resilience_support_training", "control_bridge_training"],
];

const GOVERNANCE_BRIDGE_NEGATIVE_PAIRS = [
  ["control_bridge_training", "retention_policy_training"],
  ["control_bridge_training", "legal_hold_training"],
  ["control_bridge_training", "audit_evidence_training"],
  ["control_bridge_training", "access_review_training"],
  ["control_bridge_training", "deletion_exception_training"],
  ["control_bridge_training", "compliance_attestation_training"],
  ["control_bridge_training", "archive_catalog_training"],
  ["control_bridge_training", "replication_repair_training"],
  ["control_book_root_training", "retention_policy_training"],
  ["control_book_root_training", "legal_hold_training"],
  ["control_book_root_training", "audit_evidence_training"],
  ["control_book_root_training", "compliance_attestation_training"],
  ["control_book_root_training", "archive_catalog_training"],
  ["control_book_root_training", "replication_repair_training"],
  ["economics_book_root_training", "legal_hold_training"],
  ["systems_book_root_training", "legal_hold_training"],
];

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function parseArgs(argv) {
  const out = {
    baseSpec: path.join(projectRoot, "data", "training", "embedding-training-spec-v5.json"),
    bookRootSemantic: path.join(projectRoot, "bench", "book-root-semantic-2026-05-06.json"),
    output: path.join(projectRoot, "data", "training", "embedding-training-spec-v8-merge-bridge-governance.json"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-spec" && argv[index + 1]) {
      out.baseSpec = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--book-root-semantic" && argv[index + 1]) {
      out.bookRootSemantic = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = resolveProjectPath(argv[index + 1]);
      index += 1;
    }
  }

  return out;
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function buildAllCrossPairs(groupIds) {
  const pairs = [];
  for (let leftIndex = 0; leftIndex < groupIds.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < groupIds.length; rightIndex += 1) {
      pairs.push([groupIds[leftIndex], groupIds[rightIndex]]);
    }
  }
  return pairs;
}

function dedupePairs(pairs) {
  const seen = new Set();
  const out = [];
  for (const pair of pairs) {
    const key = [...pair].sort().join("|||");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(pair);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseSpec = JSON.parse(await fs.readFile(args.baseSpec, "utf8"));
  const bookRootSemantic = JSON.parse(await fs.readFile(args.bookRootSemantic, "utf8"));

  const bookRootGroups = bookRootSemantic.map((group) => {
    const metadata = BOOK_ROOT_METADATA[group.group];
    if (!metadata) {
      throw new Error(`Missing book-root metadata for group ${group.group}`);
    }
    return {
      id: metadata.id,
      domain: metadata.domain,
      description: metadata.description,
      items: [...group.items, ...metadata.extras],
    };
  });

  const output = {
    version: 8,
    description:
      "Merge training spec that starts from the v5 governance/archive boundary line and adds the v8 control-bridge, multilingual, and storage-resilience supports plus explicit bridge-versus-governance negatives.",
    negativeMode: "explicit",
    negativeSampleLimitPerPair: Number(baseSpec.negativeSampleLimitPerPair || 24),
    groups: [...baseSpec.groups, ...bookRootGroups, ...SUPPORT_GROUPS],
    hardNegativeGroupPairs: dedupePairs([
      ...(baseSpec.hardNegativeGroupPairs || []),
      ...buildAllCrossPairs(bookRootGroups.map((group) => group.id)),
      ...SUPPORT_NEGATIVE_PAIRS,
      ...GOVERNANCE_BRIDGE_NEGATIVE_PAIRS,
    ]),
    ancestry: {
      baseSpec: relativeProjectPath(args.baseSpec),
      bookRootSemantic: relativeProjectPath(args.bookRootSemantic),
    },
  };

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseSpec: relativeProjectPath(args.baseSpec),
        bookRootSemantic: relativeProjectPath(args.bookRootSemantic),
        output: relativeProjectPath(args.output),
        groupCount: output.groups.length,
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
