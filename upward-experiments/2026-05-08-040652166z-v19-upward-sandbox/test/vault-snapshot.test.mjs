import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { collectSnapshotFiles, createVaultSnapshot } from "../core/vault-snapshot.mjs";

test("collectSnapshotFiles returns stable relative paths", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "16xvs-snapshot-files-"));
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.mkdir(path.join(root, "models"), { recursive: true });
  await fs.writeFile(path.join(root, "README.md"), "readme\n", "utf8");
  await fs.writeFile(path.join(root, "docs", "status.md"), "status\n", "utf8");
  await fs.writeFile(path.join(root, "models", "model.json"), "{}\n", "utf8");

  const files = await collectSnapshotFiles(root, ["README.md", "docs", "models"]);
  assert.deepEqual(new Set(files), new Set(["README.md", "docs/status.md", "models/model.json"]));
});

test("createVaultSnapshot copies files and records hashes", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "16xvs-snapshot-project-"));
  const outputDir = path.join(root, "vault-snapshots");

  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.writeFile(path.join(root, "README.md"), "readme\n", "utf8");
  await fs.writeFile(path.join(root, "docs", "status.md"), "status\n", "utf8");

  const snapshot = await createVaultSnapshot({
    projectRoot: root,
    outputDir,
    includePaths: ["README.md", "docs"],
    label: "proof-set",
    now: new Date("2026-04-25T15:00:00.000Z"),
  });

  assert.equal(snapshot.snapshotId, "2026-04-25T15-00-00-000Z-proof-set");
  assert.equal(snapshot.manifest.fileCount, 2);
  assert.deepEqual(
    new Set(snapshot.manifest.files.map((file) => file.path)),
    new Set(["README.md", "docs/status.md"])
  );

  const copiedStatus = await fs.readFile(
    path.join(snapshot.payloadRoot, "docs", "status.md"),
    "utf8"
  );
  assert.equal(copiedStatus, "status\n");
});
