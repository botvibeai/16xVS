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

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function parseArgs(argv) {
  const out = {
    baseSpec: path.join(projectRoot, "data", "training", "embedding-training-spec-v2.json"),
    bookRootSemantic: path.join(projectRoot, "bench", "book-root-semantic-2026-05-06.json"),
    output: path.join(projectRoot, "data", "training", "embedding-training-spec-v6-book-root.json"),
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

  const baseGroupIds = (baseSpec.groups || []).map((group) => group.id);
  const bookRootGroupIds = bookRootGroups.map((group) => group.id);

  const output = {
    version: 6,
    description:
      "Direct v2-lineage training spec with frozen synthetic book-root groups added to improve long-form grouped separation while preserving the original hybrid-v3 ancestry.",
    negativeMode: "explicit",
    negativeSampleLimitPerPair: Number(baseSpec.negativeSampleLimitPerPair || 48),
    groups: [...baseSpec.groups, ...bookRootGroups],
    hardNegativeGroupPairs: [
      ...buildAllCrossPairs(baseGroupIds),
      ...buildAllCrossPairs(bookRootGroupIds),
    ],
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
