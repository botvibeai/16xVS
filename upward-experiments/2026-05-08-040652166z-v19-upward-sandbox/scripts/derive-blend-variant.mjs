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
    variantName: null,
    learnedBlendWeight: null,
    heuristicBlendWeight: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input" && argv[index + 1]) {
      out.input = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--variant-name" && argv[index + 1]) {
      out.variantName = String(argv[index + 1]);
      index += 1;
    } else if (arg === "--learned-blend-weight" && argv[index + 1]) {
      out.learnedBlendWeight = ensureNumber(argv[index + 1], null);
      index += 1;
    } else if (arg === "--heuristic-blend-weight" && argv[index + 1]) {
      out.heuristicBlendWeight = ensureNumber(argv[index + 1], null);
      index += 1;
    }
  }

  if (!out.input) throw new Error("Missing --input");
  if (!out.output) throw new Error("Missing --output");
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const model = JSON.parse(await fs.readFile(args.input, "utf8"));
  const variant = {
    ...model,
    variantName: args.variantName || model.variantName || null,
    learnedBlendWeight:
      args.learnedBlendWeight === null ? model.learnedBlendWeight : args.learnedBlendWeight,
    heuristicBlendWeight:
      args.heuristicBlendWeight === null ? model.heuristicBlendWeight : args.heuristicBlendWeight,
  };

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(variant, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        input: relativeProjectPath(args.input),
        output: relativeProjectPath(args.output),
        variantName: variant.variantName,
        learnedBlendWeight: variant.learnedBlendWeight,
        heuristicBlendWeight: variant.heuristicBlendWeight,
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
