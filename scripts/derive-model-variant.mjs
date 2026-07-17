import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function ensureNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseArgs(argv) {
  const out = {
    input: null,
    output: null,
    packingMode: "entry",
    maxWordsPerPatch: 96,
    maxCharsPerPatch: 512,
    maxEntryWordsForSinglePatch: 96,
    maxEntryCharsForSinglePatch: 512,
    maxResidualPatches: 2,
    residualMaxWordsPerPatch: 24,
    residualMaxCharsPerPatch: 160,
    variantName: "macro-packer-v1",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input" && argv[index + 1]) {
      out.input = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--packing-mode" && argv[index + 1]) {
      out.packingMode = String(argv[index + 1]);
      index += 1;
    } else if (arg === "--max-words-per-patch" && argv[index + 1]) {
      out.maxWordsPerPatch = ensureNumber(argv[index + 1], out.maxWordsPerPatch);
      index += 1;
    } else if (arg === "--max-chars-per-patch" && argv[index + 1]) {
      out.maxCharsPerPatch = ensureNumber(argv[index + 1], out.maxCharsPerPatch);
      index += 1;
    } else if (arg === "--max-entry-words" && argv[index + 1]) {
      out.maxEntryWordsForSinglePatch = ensureNumber(argv[index + 1], out.maxEntryWordsForSinglePatch);
      index += 1;
    } else if (arg === "--max-entry-chars" && argv[index + 1]) {
      out.maxEntryCharsForSinglePatch = ensureNumber(argv[index + 1], out.maxEntryCharsForSinglePatch);
      index += 1;
    } else if (arg === "--max-residual-patches" && argv[index + 1]) {
      out.maxResidualPatches = ensureNumber(argv[index + 1], out.maxResidualPatches);
      index += 1;
    } else if (arg === "--residual-max-words" && argv[index + 1]) {
      out.residualMaxWordsPerPatch = ensureNumber(argv[index + 1], out.residualMaxWordsPerPatch);
      index += 1;
    } else if (arg === "--residual-max-chars" && argv[index + 1]) {
      out.residualMaxCharsPerPatch = ensureNumber(argv[index + 1], out.residualMaxCharsPerPatch);
      index += 1;
    } else if (arg === "--variant-name" && argv[index + 1]) {
      out.variantName = String(argv[index + 1]);
      index += 1;
    }
  }

  if (!out.input) {
    throw new Error("Missing --input");
  }
  if (!out.output) {
    throw new Error("Missing --output");
  }

  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const model = JSON.parse(await fs.readFile(args.input, "utf8"));

  const variant = {
    ...model,
    variantName: args.variantName,
    patchConfig: {
      packingMode: args.packingMode,
      maxWordsPerPatch: args.maxWordsPerPatch,
      maxCharsPerPatch: args.maxCharsPerPatch,
      maxEntryWordsForSinglePatch: args.maxEntryWordsForSinglePatch,
      maxEntryCharsForSinglePatch: args.maxEntryCharsForSinglePatch,
      maxResidualPatches: args.maxResidualPatches,
      residualMaxWordsPerPatch: args.residualMaxWordsPerPatch,
      residualMaxCharsPerPatch: args.residualMaxCharsPerPatch,
    },
  };

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(variant, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        input: relativeProjectPath(args.input),
        output: relativeProjectPath(args.output),
        variantName: args.variantName,
        patchConfig: variant.patchConfig,
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
