import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const COPY_PATHS = [
  "core",
  "scripts",
  "test",
  "data",
  "docs",
  "src",
  "assets",
  "package.json",
  "package-lock.json",
  "README.md",
  "wrangler.jsonc",
];

const EXCLUDED_NAMES = new Set([
  ".env",
  ".wrangler",
  ".npm-cache",
  "bench",
  "models",
  "node_modules",
  "vault-snapshots",
]);

function resolveProjectPath(target) {
  if (!target) return null;
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "").replace("T", "-").replace("Z", "z");
}

function parseArgs(argv) {
  const out = {
    label: "v19-upward-sandbox",
    outputDir: null,
    fromLock: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--label" && argv[index + 1]) {
      out.label = argv[++index];
    } else if (arg === "--output-dir" && argv[index + 1]) {
      out.outputDir = resolveProjectPath(argv[++index]);
    } else if (arg === "--from-lock" && argv[index + 1]) {
      out.fromLock = resolveProjectPath(argv[++index]);
    }
  }

  return out;
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function copyFiltered(source, destination) {
  const name = path.basename(source);
  if (EXCLUDED_NAMES.has(name)) return;

  const stat = await fs.stat(source);
  if (stat.isDirectory()) {
    await fs.mkdir(destination, { recursive: true });
    const entries = await fs.readdir(source);
    for (const entry of entries) {
      await copyFiltered(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }

  if (stat.isFile()) {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  }
}

async function copyLockSummary(fromLock, destination) {
  if (!fromLock) return null;
  const summaryPath = path.join(fromLock, "summary.json");
  const readmePath = path.join(fromLock, "README.md");
  const copied = [];

  if (await pathExists(summaryPath)) {
    const target = path.join(destination, "baseline-lock-summary.json");
    await fs.copyFile(summaryPath, target);
    copied.push(relativeProjectPath(target));
  }

  if (await pathExists(readmePath)) {
    const target = path.join(destination, "baseline-lock-README.md");
    await fs.copyFile(readmePath, target);
    copied.push(relativeProjectPath(target));
  }

  return copied;
}

async function writeSandboxReadme({ destination, fromLock, copiedLockFiles }) {
  const lines = [
    "# 16xVS Upward Experiment Sandbox",
    "",
    "This is a copied experiment lane created from the locked v19 proof baseline.",
    "",
    "## Rules",
    "",
    "- Do not edit the original proof-lock folder from this sandbox.",
    "- Do not put API keys or `.env` files in this sandbox.",
    "- Do not claim a new baseline until `npm test` and `npm run proof:package` pass from the source project or an equivalent sandbox with model files available.",
    "- Treat `models` and `bench` as external references unless you intentionally copy them later.",
    "",
    "## Source References",
    "",
    `- source project: ${projectRoot}`,
    `- source lock: ${fromLock ? relativeProjectPath(fromLock) : "not supplied"}`,
    "",
    "## Copied Lock Files",
    "",
    ...(copiedLockFiles?.length ? copiedLockFiles.map((item) => `- ${item}`) : ["- none"]),
    "",
    "## Model References",
    "",
    "- default/v10: models/learned-hybrid-prototype-v10-constrained-merge-hierarchical-packer-v2.json",
    "- bookRoot/v8: models/learned-hybrid-prototype-v8-control-bridge-hierarchical-packer-v2.json",
    "- governance/v13: models/learned-hybrid-prototype-v13-balanced-triad-hierarchical-packer-v2.json",
    "",
    "Large model files are intentionally not copied by this command.",
    "",
  ];

  await fs.writeFile(path.join(destination, "SANDBOX_BASELINE.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const destination =
    args.outputDir ||
    path.join(projectRoot, "upward-experiments", `${timestampSlug()}-${slug(args.label)}`);

  if (await pathExists(destination)) {
    throw new Error(`Sandbox destination already exists: ${relativeProjectPath(destination)}`);
  }

  await fs.mkdir(destination, { recursive: true });

  for (const relative of COPY_PATHS) {
    const source = path.join(projectRoot, relative);
    if (await pathExists(source)) {
      await copyFiltered(source, path.join(destination, relative));
    }
  }

  const copiedLockFiles = await copyLockSummary(args.fromLock, destination);
  await writeSandboxReadme({
    destination,
    fromLock: args.fromLock,
    copiedLockFiles,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        sandbox: relativeProjectPath(destination),
        fromLock: args.fromLock ? relativeProjectPath(args.fromLock) : null,
        excluded: Array.from(EXCLUDED_NAMES).sort(),
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
