import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const SKIP_DIRS = new Set([".git", "node_modules", ".npm-cache"]);
const MAX_TRACKED_ARTIFACT_BYTES = 50 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set([".md", ".json", ".jsonc", ".mjs", ".js", ".txt"]);

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

test("package README is public-safe and evidence-bound", async () => {
  const readme = await readFile(path.join(repoRoot, "README.md"), "utf8");

  assert.doesNotMatch(readme, /C:\\Users\\BotVi|C:\/Users\/BotVi/);
  assert.match(readme, /not a production tokenizer claim/i);
  assert.match(readme, /does not prove yet/i);
  assert.match(readme, /220\.49/);
  assert.match(readme, /100\/100/);
  assert.match(readme, /226x[\s\S]*current `220\.49x` V30 fixture/i);
});

test("package excludes secrets and heavyweight generated artifacts", async () => {
  const gitignore = await readFile(path.join(repoRoot, ".gitignore"), "utf8");

  for (const requiredPattern of [".env", ".dev.vars", "node_modules/", "models/", "vault-snapshots/", ".wrangler/"]) {
    assert.match(gitignore, new RegExp(requiredPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("package contains no token values or local machine paths", async () => {
  const files = await walkFiles(repoRoot);
  const secretPattern = /(ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|cfut_[A-Za-z0-9]{20,})/;
  const localPathPattern = /C:\\Users\\BotVi|C:\/Users\/BotVi/;
  const offenders = [];

  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
    const text = await readFile(file, "utf8");
    if (secretPattern.test(text) || localPathPattern.test(text)) {
      offenders.push(path.relative(repoRoot, file));
    }
  }

  assert.deepEqual(offenders, []);
});

test("package has no tracked oversized raw artifact candidates", async () => {
  const files = await walkFiles(repoRoot);
  const oversized = [];

  for (const file of files) {
    const fileStat = await stat(file);
    if (fileStat.size > MAX_TRACKED_ARTIFACT_BYTES) {
      oversized.push({
        file: path.relative(repoRoot, file),
        mb: Number((fileStat.size / 1024 / 1024).toFixed(2)),
      });
    }
  }

  assert.deepEqual(oversized, []);
});
