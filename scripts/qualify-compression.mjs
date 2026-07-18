import fs from "node:fs/promises";
import path from "node:path";

import { qualifyCompression } from "../core/qualification-gate.mjs";

function parseArgs(argv) {
  const args = { input: "", output: "" };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--input" && argv[index + 1]) args.input = argv[++index];
    else if (argv[index] === "--output" && argv[index + 1]) args.output = argv[++index];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) throw new Error("--input <runs.json> is required");

  const inputPath = path.resolve(args.input);
  const parsed = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const runs = Array.isArray(parsed) ? parsed : parsed.runs;
  const options = Array.isArray(parsed) ? {} : parsed.policy || {};
  const report = qualifyCompression(runs, options);

  const outputPath = args.output
    ? path.resolve(args.output)
    : path.resolve(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}-qualification.json`);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, output: outputPath, ...report }, null, 2));

  if (!report.qualified) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
