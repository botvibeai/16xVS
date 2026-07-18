import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");
const script = path.join(projectRoot, "scripts", "secure-vault.mjs");

function run(args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: projectRoot,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => { stdout += data; });
    child.stderr.on("data", (data) => { stderr += data; });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

test("rejects a direct environment passphrase without echoing it", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "16xvs-vault-cli-"));
  try {
    const input = path.join(root, "input.bin");
    const output = path.join(root, "output.vault");
    const secret = "test secret phrase that must never print";
    await fs.writeFile(input, "data", "utf8");
    const result = await run(
      ["seal", "--input", input, "--output", output],
      { "16XVS_VAULT_PASSPHRASE": secret },
    );
    assert.equal(result.code, 1);
    assert.match(result.stderr, /environment variables are disabled/i);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, new RegExp(secret));
    await assert.rejects(fs.access(output));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("noninteractive execution fails closed without a hidden passphrase fallback", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "16xvs-vault-cli-"));
  try {
    const input = path.join(root, "input.bin");
    const output = path.join(root, "output.vault");
    await fs.writeFile(input, "data", "utf8");
    const result = await run(["seal", "--input", input, "--output", output]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /interactive terminal/i);
    await assert.rejects(fs.access(output));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
