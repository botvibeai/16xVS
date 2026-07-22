import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const TARGETED_ITEMS = {
  control_book_root_training: [
    "book scale language neutral governance evidence",
    "cross script archive proof stays bound to the record",
    "multilingual policy book with stable evidence trail",
    "language fair archive record with accountable retention history",
  ],
  audit_evidence_training: [
    "audit evidence packet for archive control",
    "proof record showing retention control executed",
    "timestamped archive control evidence trail",
    "review log bundle proving the governed record path",
  ],
  retention_policy_training: [
    "retention metadata stays attached to compact archive record",
    "policy lifecycle evidence follows the stored passage",
    "retention class and audit history travel with archive unit",
    "governed retention schedule for long form archive records",
  ],
  legal_hold_training: [
    "legal hold scope remains attached to preserved archive unit",
    "hold release evidence stays linked to retained record",
    "preservation override record with compact evidence trail",
  ],
  compliance_attestation_training: [
    "attestation proof links policy retention to archive evidence",
    "compliance record confirms governed storage lifecycle",
    "certified archive control with retention evidence",
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
    baseSpec: path.join(projectRoot, "data", "training", "embedding-training-spec-v8-merge-bridge-governance.json"),
    output: path.join(projectRoot, "data", "training", "embedding-training-spec-v13-balanced-triad.json"),
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
      description: `${group.description} V13 adds narrow balanced support while preserving existing hard-negative boundaries.`,
      items: Array.from(new Set([...(group.items || []), ...additions])),
    };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseSpec = JSON.parse(await fs.readFile(args.baseSpec, "utf8"));
  const output = {
    ...baseSpec,
    version: 13,
    description:
      "V13 balanced triad training spec. Starts from the v8 merge spec, adds small support to the control-book-root, audit-evidence, and retention-governance boundary, and keeps the existing hard negatives so the added support cannot erase neighboring governance/archive distinctions.",
    groups: appendTargetedItems(baseSpec.groups || []),
    hardNegativeGroupPairs: baseSpec.hardNegativeGroupPairs || [],
    ancestry: {
      ...(baseSpec.ancestry || {}),
      baseSpec: relativeProjectPath(args.baseSpec),
    },
    targetedRound: {
      targetGroups: [
        "control_book_root_training",
        "audit_evidence_training",
        "retention_policy_training",
        "legal_hold_training",
        "compliance_attestation_training",
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
