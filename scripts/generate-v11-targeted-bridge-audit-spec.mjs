import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const TARGETED_ITEMS = {
  control_book_root_training: [
    "language neutral audit evidence chapter",
    "cross script governance evidence record",
    "multilingual evidence ledger for archive accountability",
    "script neutral compliance proof trail",
    "book scale evidence ledger across languages",
    "visual patch record keeps multilingual governance proof stable",
    "language fair archive record with verifiable evidence history",
    "governed multilingual record that preserves proof without token bias",
  ],
  audit_evidence_training: [
    "archive audit evidence packet",
    "proof that archive control executed",
    "timestamped control execution evidence",
    "approval trace and review log bundle",
    "evidence packet showing what archive system did",
    "audit proof record with preservation history",
    "verifiable control trail for archive examination",
    "review logs and stored artifacts prove the control path",
  ],
  control_bridge_training: [
    "language neutral audit proof",
    "multilingual evidence trail",
    "cross script control proof",
    "governed records with audit evidence",
  ],
};

const REMOVED_HARD_NEGATIVES = new Set([
  pairKey(["control_bridge_training", "audit_evidence_training"]),
  pairKey(["control_book_root_training", "audit_evidence_training"]),
]);

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function pairKey(pair) {
  return [...pair].sort().join("|||");
}

function parseArgs(argv) {
  const out = {
    baseSpec: path.join(projectRoot, "data", "training", "embedding-training-spec-v8-merge-bridge-governance.json"),
    output: path.join(projectRoot, "data", "training", "embedding-training-spec-v9-targeted-bridge-audit.json"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-spec" && argv[index + 1]) {
      out.baseSpec = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = resolveProjectPath(argv[index + 1]);
      index += 1;
    }
  }

  return out;
}

function appendTargetedItems(groups) {
  return groups.map((group) => {
    const additions = TARGETED_ITEMS[group.id] || [];
    if (additions.length === 0) return group;

    return {
      ...group,
      description: `${group.description} V11 adds narrow bridge/audit support without changing the fold corpus.`,
      items: Array.from(new Set([...(group.items || []), ...additions])),
    };
  });
}

function filterHardNegativePairs(pairs) {
  return (pairs || []).filter((pair) => !REMOVED_HARD_NEGATIVES.has(pairKey(pair)));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseSpec = JSON.parse(await fs.readFile(args.baseSpec, "utf8"));
  const output = {
    ...baseSpec,
    version: 9,
    description:
      "V11 targeted bridge-audit training spec. Starts from the v9 merge spec, adds only narrow control-book-root and audit-evidence support phrases, and removes bridge-vs-audit hard negatives that pulled the control bridge apart under the constrained fold.",
    groups: appendTargetedItems(baseSpec.groups || []),
    hardNegativeGroupPairs: filterHardNegativePairs(baseSpec.hardNegativeGroupPairs),
    ancestry: {
      ...(baseSpec.ancestry || {}),
      baseSpec: relativeProjectPath(args.baseSpec),
    },
    targetedRound: {
      targetGroups: ["control_book_root_training", "audit_evidence_training", "control_bridge_training"],
      removedHardNegatives: Array.from(REMOVED_HARD_NEGATIVES),
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
