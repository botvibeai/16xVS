import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const DEFAULT_SNAPSHOT_PATHS = [
  "README.md",
  "package.json",
  "package-lock.json",
  "wrangler.jsonc",
  "core",
  "scripts",
  "models",
  "bench",
  "docs",
  "data/eval",
  "data/training",
  "test",
];

function sanitizeLabel(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function formatSnapshotStamp(input) {
  return input.toISOString().replace(/[:.]/g, "-");
}

async function sha256File(filePath) {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function collectFilesFromPath(projectRoot, relativePath) {
  const sourcePath = path.join(projectRoot, relativePath);
  const stats = await fs.stat(sourcePath);

  if (stats.isFile()) {
    return [relativePath.replace(/\\/g, "/")];
  }

  const entries = await fs.readdir(sourcePath, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    const childRelative = path.posix.join(relativePath.replace(/\\/g, "/"), entry.name);
    if (entry.isDirectory()) {
      out.push(...(await collectFilesFromPath(projectRoot, childRelative)));
    } else if (entry.isFile()) {
      out.push(childRelative);
    }
  }

  return out;
}

export async function collectSnapshotFiles(projectRoot, includePaths = DEFAULT_SNAPSHOT_PATHS) {
  const normalizedRoot = path.resolve(projectRoot);
  const found = [];

  for (const includePath of includePaths) {
    const normalized = includePath.replace(/\\/g, "/");
    const sourcePath = path.join(normalizedRoot, normalized);
    if (!(await pathExists(sourcePath))) continue;
    found.push(...(await collectFilesFromPath(normalizedRoot, normalized)));
  }

  return Array.from(new Set(found)).sort((left, right) => left.localeCompare(right));
}

export async function createVaultSnapshot({
  projectRoot,
  outputDir,
  includePaths = DEFAULT_SNAPSHOT_PATHS,
  label = "",
  now = new Date(),
} = {}) {
  if (!projectRoot) {
    throw new Error("projectRoot is required.");
  }
  if (!outputDir) {
    throw new Error("outputDir is required.");
  }

  const snapshotLabel = sanitizeLabel(label);
  const snapshotId = snapshotLabel
    ? `${formatSnapshotStamp(now)}-${snapshotLabel}`
    : formatSnapshotStamp(now);
  const snapshotRoot = path.join(outputDir, snapshotId);
  const payloadRoot = path.join(snapshotRoot, "payload");
  const files = await collectSnapshotFiles(projectRoot, includePaths);

  await fs.mkdir(payloadRoot, { recursive: true });

  const manifestFiles = [];
  let totalBytes = 0;

  for (const relativePath of files) {
    const sourcePath = path.join(projectRoot, relativePath);
    const destinationPath = path.join(payloadRoot, relativePath);
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(sourcePath, destinationPath);

    const stats = await fs.stat(sourcePath);
    const sha256 = await sha256File(sourcePath);
    totalBytes += stats.size;

    manifestFiles.push({
      path: relativePath,
      bytes: stats.size,
      sha256,
    });
  }

  const manifest = {
    generatedAt: now.toISOString(),
    snapshotId,
    label: snapshotLabel || null,
    includePaths,
    fileCount: manifestFiles.length,
    totalBytes,
    files: manifestFiles,
    criticalArtifacts: [
      "docs/status.md",
      "docs/proofs/current-proof-dossier.md",
      "docs/failures/current-failures.md",
      "models/learned-hybrid-prototype-v3.json",
      "models/learned-hybrid-prototype-v3-macro-packer-v1.json",
      "models/learned-hybrid-prototype-v3-macro-trained-v1.json",
      "models/learned-hybrid-prototype-v3-hierarchical-packer-v1.json",
      "models/learned-hybrid-prototype-v3-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v4-governance-base.json",
      "models/learned-hybrid-prototype-v4-governance-hierarchical-packer-v1.json",
      "models/learned-hybrid-prototype-v5-mixed-objective-base.json",
      "models/learned-hybrid-prototype-v5-mixed-objective-hierarchical-packer-v1.json",
      "models/learned-hybrid-prototype-v6-legalhold-archive-base.json",
      "models/learned-hybrid-prototype-v6-legalhold-archive-hierarchical-packer-v1.json",
      "models/learned-hybrid-prototype-v7-book-root-base.json",
      "models/learned-hybrid-prototype-v7-book-root-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v8-control-bridge-base.json",
      "models/learned-hybrid-prototype-v8-control-bridge-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v9-merge-bridge-governance-base.json",
      "models/learned-hybrid-prototype-v9-merge-bridge-governance-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v10-constrained-merge-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v11-targeted-bridge-audit-base.json",
      "models/learned-hybrid-prototype-v11-targeted-bridge-audit-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v12-blend-h04-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v12-blend-h05-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v12-blend-h055-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v12-blend-h056-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v12-blend-h057-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v12-blend-h058-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v12-blend-h059-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v13-balanced-triad-base.json",
      "models/learned-hybrid-prototype-v13-balanced-triad-hierarchical-packer-v2.json",
      "models/learned-hybrid-prototype-v14-book-root-balance-base.json",
      "models/learned-hybrid-prototype-v14-book-root-balance-hierarchical-packer-v2.json",
      "bench/eval-suite-learned-hybrid-v3/suite-summary.json",
      "bench/eval-suite-learned-hybrid-v3-macro-packer-v1/suite-summary.json",
      "bench/eval-suite-learned-hybrid-v3-macro-trained-v1/suite-summary.json",
      "bench/eval-suite-learned-hybrid-v3-hierarchical-packer-v1/suite-summary.json",
      "bench/eval-suite-learned-hybrid-v3-hierarchical-packer-v2/suite-summary.json",
      "bench/eval-suite-learned-hybrid-v4-governance-hierarchical-packer-v1/suite-summary.json",
      "bench/eval-suite-learned-hybrid-v5-mixed-objective-hierarchical-packer-v1/suite-summary.json",
      "bench/eval-suite-learned-hybrid-v6-legalhold-archive-hierarchical-packer-v1/suite-summary.json",
      "bench/eval-suite-learned-hybrid-v7-book-root-hierarchical-packer-v2/suite-summary.json",
      "bench/eval-suite-learned-hybrid-v8-control-bridge-hierarchical-packer-v2/suite-summary.json",
      "bench/eval-suite-learned-hybrid-v9-merge-bridge-governance-hierarchical-packer-v2/suite-summary.json",
      "bench/eval-suite-learned-hybrid-v10-constrained-merge-hierarchical-packer-v2/suite-summary.json",
      "bench/eval-suite-learned-hybrid-v11-targeted-bridge-audit-hierarchical-packer-v2/suite-summary.json",
      "bench/2026-04-25-storage-projection-v3-hierarchical-packer-v1.json",
      "bench/2026-04-25-booklike-benchmark-v3-hierarchical-packer-v1.json",
      "bench/2026-04-25-storage-projection-v3-hierarchical-packer-v1-booklike.json",
      "bench/2026-04-25-protocol-longform-benchmark-v3-hierarchical-packer-v2.json",
      "bench/2026-04-25-booklike-benchmark-v3-hierarchical-packer-v2.json",
      "bench/2026-04-25-storage-projection-v3-hierarchical-packer-v2-booklike.json",
      "bench/2026-05-06-book-root-benchmark-v3-hierarchical-packer-v2.json",
      "bench/2026-05-06-mega-book-benchmark-v3-hierarchical-packer-v2.json",
      "bench/2026-05-06-book-folding-storage-projection-v3-hierarchical-packer-v2.json",
      "bench/2026-05-06-book-root-benchmark-v7-book-root-hierarchical-packer-v2.json",
      "bench/2026-05-06-mega-book-benchmark-v7-book-root-hierarchical-packer-v2.json",
      "bench/2026-05-06-booklike-benchmark-v7-book-root-hierarchical-packer-v2.json",
      "bench/2026-05-06-book-folding-storage-projection-v7-book-root-hierarchical-packer-v2.json",
      "bench/2026-05-06-book-root-benchmark-v8-control-bridge-hierarchical-packer-v2.json",
      "bench/2026-05-06-mega-book-benchmark-v8-control-bridge-hierarchical-packer-v2.json",
      "bench/2026-05-06-booklike-benchmark-v8-control-bridge-hierarchical-packer-v2.json",
      "bench/2026-05-06-book-folding-storage-projection-v8-control-bridge-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v8-control-bridge-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v9-merge-bridge-governance-hierarchical-packer-v2.json",
      "bench/2026-05-07-booklike-benchmark-v9-merge-bridge-governance-hierarchical-packer-v2.json",
      "bench/2026-05-07-mega-book-benchmark-v9-merge-bridge-governance-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-folding-storage-projection-v9-merge-bridge-governance-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v9-merge-bridge-governance-hierarchical-packer-v2.json",
      "bench/2026-05-07-archive-pressure-v9-merge-bridge-governance-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v10-constrained-merge-hierarchical-packer-v2.json",
      "bench/2026-05-07-booklike-benchmark-v10-constrained-merge-hierarchical-packer-v2.json",
      "bench/2026-05-07-mega-book-benchmark-v10-constrained-merge-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-folding-storage-projection-v10-constrained-merge-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v10-constrained-merge-hierarchical-packer-v2.json",
      "bench/2026-05-07-archive-pressure-v10-constrained-merge-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v11-targeted-bridge-audit-hierarchical-packer-v2.json",
      "bench/2026-05-07-booklike-benchmark-v11-targeted-bridge-audit-hierarchical-packer-v2.json",
      "bench/2026-05-07-mega-book-benchmark-v11-targeted-bridge-audit-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v11-targeted-bridge-audit-hierarchical-packer-v2.json",
      "bench/2026-05-07-archive-pressure-v11-targeted-bridge-audit-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v12-blend-h04-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v12-blend-h04-hierarchical-packer-v2.json",
      "bench/2026-05-07-archive-pressure-v12-blend-h04-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v12-blend-h05-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v12-blend-h05-hierarchical-packer-v2.json",
      "bench/2026-05-07-archive-pressure-v12-blend-h05-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v12-blend-h055-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v12-blend-h055-hierarchical-packer-v2.json",
      "bench/2026-05-07-archive-pressure-v12-blend-h055-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v12-blend-h056-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v12-blend-h056-hierarchical-packer-v2.json",
      "bench/2026-05-07-archive-pressure-v12-blend-h056-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v12-blend-h057-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v12-blend-h057-hierarchical-packer-v2.json",
      "bench/2026-05-07-archive-pressure-v12-blend-h057-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v12-blend-h058-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v12-blend-h058-hierarchical-packer-v2.json",
      "bench/2026-05-07-archive-pressure-v12-blend-h058-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v12-blend-h059-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v12-blend-h059-hierarchical-packer-v2.json",
      "bench/2026-05-07-archive-pressure-v12-blend-h059-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v13-balanced-triad-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v13-balanced-triad-hierarchical-packer-v2.json",
      "bench/2026-05-07-archive-pressure-v13-balanced-triad-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v14-book-root-balance-hierarchical-packer-v2.json",
      "bench/2026-05-07-governance-adversarial-v14-book-root-balance-hierarchical-packer-v2.json",
      "bench/2026-05-07-archive-pressure-v14-book-root-balance-hierarchical-packer-v2.json",
      "bench/2026-05-07-book-root-benchmark-v15-multihead-routed.json",
      "bench/2026-05-07-governance-adversarial-v15-multihead-routed.json",
      "bench/2026-05-07-archive-pressure-v15-multihead-routed.json",
      "bench/2026-05-07-booklike-benchmark-v15-multihead-default-route.json",
      "bench/2026-05-07-book-root-benchmark-v16-auto-routed.json",
      "bench/2026-05-07-governance-adversarial-v16-auto-routed.json",
      "bench/2026-05-07-archive-pressure-v16-auto-routed.json",
      "bench/2026-05-07-booklike-benchmark-v16-auto-routed.json",
      "bench/2026-05-07-book-root-benchmark-v17-confidence-routed.json",
      "bench/2026-05-07-governance-adversarial-v17-confidence-routed.json",
      "bench/2026-05-07-archive-pressure-v17-confidence-routed.json",
      "bench/2026-05-07-booklike-benchmark-v17-confidence-routed.json",
      "bench/2026-05-07-mega-book-benchmark-v17-confidence-routed.json",
      "bench/mega-book-ladder-corpus-2026-05-07.txt",
      "bench/mega-book-ladder-semantic-2026-05-07.json",
      "bench/2026-05-07-mega-book-ladder-v18-confidence-routed.json",
      "bench/2026-05-07-mega-book-ladder-v18-v10-head-comparison.json",
      "bench/2026-05-07-mega-book-ladder-v18-v13-head-comparison.json",
      "bench/2026-05-07-book-root-benchmark-v19-validated-routed.json",
      "bench/2026-05-07-governance-adversarial-v19-validated-routed.json",
      "bench/2026-05-07-archive-pressure-v19-validated-routed.json",
      "bench/2026-05-07-booklike-benchmark-v19-validated-routed.json",
      "bench/2026-05-07-mega-book-ladder-v19-validated-routed.json",
      "bench/eval-suite-v15-selected-head-bookroot-v8/suite-summary.json",
      "bench/eval-suite-v15-selected-head-governance-v13/suite-summary.json",
      "bench/2026-05-07-model-role-audit.json",
      "bench/2026-05-07-oracle-specialist-routing-audit.json",
      "bench/2026-04-29-multilingual-longform-holdout-v3-hierarchical-packer-v2.json",
      "bench/2026-04-29-archive-pressure-v3-hierarchical-packer-v2.json",
      "bench/2026-04-29-storage-projection-v3-hierarchical-packer-v2-expanded.json",
      "bench/2026-04-29-governance-adversarial-v4-governance-hierarchical-packer-v1.json",
      "bench/2026-04-29-archive-pressure-v4-governance-hierarchical-packer-v1.json",
      "bench/2026-05-05-governance-adversarial-v5-mixed-objective-hierarchical-packer-v1.json",
      "bench/2026-05-05-archive-pressure-v5-mixed-objective-hierarchical-packer-v1.json",
      "bench/2026-05-05-governance-adversarial-v6-legalhold-archive-hierarchical-packer-v1.json",
      "bench/2026-05-05-archive-pressure-v6-legalhold-archive-hierarchical-packer-v1.json",
      "data/training/embedding-training-spec-v3.json",
      "data/training/embedding-training-pairs-v3.json",
      "data/training/embedding-training-spec-v4.json",
      "data/training/embedding-training-pairs-v4.json",
      "data/training/embedding-training-spec-v5.json",
      "data/training/embedding-training-pairs-v5.json",
      "data/training/embedding-training-spec-v6-book-root.json",
      "data/training/embedding-training-pairs-v6-book-root.json",
      "data/training/embedding-training-spec-v7-control-bridge.json",
      "data/training/embedding-training-pairs-v7-control-bridge.json",
      "data/training/embedding-training-spec-v8-merge-bridge-governance.json",
      "data/training/embedding-training-pairs-v8-merge-bridge-governance.json",
      "data/training/embedding-training-spec-v9-targeted-bridge-audit.json",
      "data/training/embedding-training-pairs-v9-targeted-bridge-audit.json",
      "data/training/embedding-training-spec-v13-balanced-triad.json",
      "data/training/embedding-training-pairs-v13-balanced-triad.json",
      "data/training/embedding-training-spec-v14-book-root-balance.json",
      "data/training/embedding-training-pairs-v14-book-root-balance.json",
      "docs/ledger/2026-04-25-booklike-storage-pressure.md",
      "docs/ledger/2026-04-25-hierarchical-packer-v2-residual-selection.md",
      "docs/ledger/2026-04-29-multilingual-longform-holdout.md",
      "docs/ledger/2026-04-29-archive-pressure.md",
      "docs/ledger/2026-04-29-governance-trained-v4-round.md",
      "docs/ledger/2026-05-05-mixed-objective-v5-round.md",
      "docs/ledger/2026-05-05-v6-legalhold-archive-round.md",
      "docs/ledger/2026-05-06-book-folding-round.md",
      "docs/ledger/2026-05-06-v7-book-root-round.md",
      "docs/ledger/2026-05-07-v8-control-bridge-round.md",
      "docs/ledger/2026-05-07-v9-merge-bridge-governance-round.md",
      "docs/ledger/2026-05-07-v10-constrained-merge-round.md",
      "docs/ledger/2026-05-07-v11-v12-targeted-merge-round.md",
      "docs/ledger/2026-05-07-v13-v14-balanced-triad-round.md",
      "docs/ledger/2026-05-07-hardening-audit.md",
      "docs/ledger/2026-05-07-v15-multihead-routed-round.md",
      "docs/ledger/2026-05-07-v16-auto-routed-round.md",
      "docs/ledger/2026-05-07-v17-confidence-routed-round.md",
      "docs/ledger/2026-05-07-v18-mega-book-semantic-ladder.md",
      "docs/ledger/2026-05-07-v19-validated-routing-round.md",
      "docs/ledger/2026-04-29-vault-snapshot-multilingual-archive-round.md",
      "docs/ledger/2026-04-29-vault-snapshot-governance-trained-v4-round.md",
    ].filter((target) => manifestFiles.some((file) => file.path === target)),
  };

  const manifestPath = path.join(snapshotRoot, "manifest.json");
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await fs.writeFile(
    path.join(outputDir, "latest.json"),
    `${JSON.stringify(
      {
        generatedAt: manifest.generatedAt,
        snapshotId,
        manifest: path.relative(outputDir, manifestPath).replace(/\\/g, "/"),
        fileCount: manifest.fileCount,
        totalBytes: manifest.totalBytes,
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  return {
    snapshotId,
    snapshotRoot,
    payloadRoot,
    manifestPath,
    manifest,
  };
}
