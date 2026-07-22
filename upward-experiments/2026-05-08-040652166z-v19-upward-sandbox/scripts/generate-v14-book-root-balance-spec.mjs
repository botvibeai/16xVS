import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const TARGETED_ITEMS = {
  economics_book_root_training: [
    "book scale storage economics with compact replicated archive units",
    "pricing margin depends on chapter records staying small after durability copies",
    "storage cost control for long form archive books",
    "replication overhead stays low when macro records remain compact",
  ],
  control_book_root_training: [
    "language neutral book archive keeps governance proof attached",
    "cross script policy chapters preserve audit evidence without token bias",
    "multilingual book record with stable compliance evidence",
    "governed language fair archive passage with proof trail",
  ],
  audit_evidence_training: [
    "audit packet proves compact archive control path",
    "evidence bundle connects long form record to governance review",
  ],
  retention_policy_training: [
    "retention class follows compact long form archive record",
    "policy lifecycle stays linked to book scale evidence unit",
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
    output: path.join(projectRoot, "data", "training", "embedding-training-spec-v14-book-root-balance.json"),
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
      description: `${group.description} V14 adds book-root balance reinforcement while keeping hard negatives fixed.`,
      items: Array.from(new Set([...(group.items || []), ...additions])),
    };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseSpec = JSON.parse(await fs.readFile(args.baseSpec, "utf8"));
  const output = {
    ...baseSpec,
    version: 14,
    description:
      "V14 book-root balance training spec. Starts from v13, adds small matched support to economics and control book-root groups, and leaves the hard-negative boundary set unchanged.",
    groups: appendTargetedItems(baseSpec.groups || []),
    hardNegativeGroupPairs: baseSpec.hardNegativeGroupPairs || [],
    ancestry: {
      ...(baseSpec.ancestry || {}),
      baseSpec: relativeProjectPath(args.baseSpec),
    },
    targetedRound: {
      targetGroups: [
        "economics_book_root_training",
        "control_book_root_training",
        "audit_evidence_training",
        "retention_policy_training",
      ],
      hardNegativesPreserved: true,
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
