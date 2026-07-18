import { access, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "src/index.js",
  "wrangler.jsonc",
  "package.json",
  "package-lock.json",
  "core/v23-proof-package.mjs",
  "scripts/build-v23-four-head-proof-package.mjs",
  "scripts/create-vault-snapshot.mjs",
  "test/all-tests.mjs",
  "docs/status.md",
  "docs/artifact-policy.md",
  "recovery/critical-assets.json",
];

const criticalModels = [
  "models/learned-hybrid-prototype-v10-constrained-merge-hierarchical-packer-v2.json",
  "models/learned-hybrid-prototype-v8-control-bridge-hierarchical-packer-v2.json",
  "models/learned-hybrid-prototype-v13-balanced-triad-hierarchical-packer-v2.json",
  "models/learned-hybrid-prototype-v22-governance-evidence-booklike-hierarchical-packer-v2.json",
];

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function countFiles(dir) {
  if (!(await exists(dir))) return 0;
  let count = 0;
  for (const entry of await readdir(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) count += await countFiles(relative);
    else if (entry.isFile()) count += 1;
  }
  return count;
}

async function fileSize(relativePath) {
  if (!(await exists(relativePath))) return null;
  return (await stat(path.join(root, relativePath))).size;
}

const tracked = await Promise.all(
  requiredFiles.map(async (file) => ({ file, present: await exists(file) }))
);
const models = await Promise.all(
  criticalModels.map(async (file) => ({
    file,
    present: await exists(file),
    sizeBytes: await fileSize(file),
  }))
);

const vaultSnapshotFileCount = await countFiles("vault-snapshots");
const missingTracked = tracked.filter((item) => !item.present);
const missingModels = models.filter((item) => !item.present);

const result = {
  ok: missingTracked.length === 0 && missingModels.length === 0 && vaultSnapshotFileCount > 0,
  mode: "read-only-recovery-audit",
  sourceModified: false,
  tracked,
  criticalModels: models,
  vaultSnapshots: {
    present: vaultSnapshotFileCount > 0,
    fileCount: vaultSnapshotFileCount,
  },
  externalChecksStillRequired: [
    "Export Durable Object catalog",
    "Inventory R2 live/fallback/vault buckets",
    "Compare record IDs and hashes across tiers",
    "Verify sealed vault manifests",
    "Run restore drill from an isolated copy",
  ],
  blockers: [
    ...missingTracked.map((item) => `Missing tracked asset: ${item.file}`),
    ...missingModels.map((item) => `Missing critical model: ${item.file}`),
    ...(vaultSnapshotFileCount === 0 ? ["No local vault-snapshot files found"] : []),
  ],
};

console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 2;
