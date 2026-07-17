import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildTrainingDataset } from "../core/training-pipeline.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function parseArgs(argv) {
  const out = {
    input: path.join(projectRoot, "data", "training", "embedding-training-spec.json"),
    output: path.join(projectRoot, "data", "training", "embedding-training-pairs.json"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input" && argv[index + 1]) {
      out.input = resolveProjectPath(argv[index + 1]);
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = await fs.readFile(args.input, "utf8");
  const spec = JSON.parse(raw);
  const dataset = buildTrainingDataset(spec);
  const output = {
    generatedAt: new Date().toISOString(),
    source: relativeProjectPath(args.input),
    ...dataset,
  };

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        input: relativeProjectPath(args.input),
        output: relativeProjectPath(args.output),
        summary: dataset.summary,
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
