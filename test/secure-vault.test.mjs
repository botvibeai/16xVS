import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { sealVaultFile, openVaultFile } from "../core/secure-vault.mjs";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "16xvs-vault-test-"));
const source = path.join(root, "source.bin");
const sealed = path.join(root, "source.16xvsvault");
const opened = path.join(root, "opened.bin");
const wrongOutput = path.join(root, "wrong.bin");
const passphrase = "test-only exact vault phrase 16xVS 2026";
const payload = Buffer.from("16xVS secure vault round-trip\n\u0000\u0001\u0002", "utf8");

try {
  await fs.writeFile(source, payload);
  const sealResult = await sealVaultFile({
    inputPath: source,
    outputPath: sealed,
    passphrase,
    metadata: { purpose: "automated-test" },
  });
  assert.equal(sealResult.sourceBytes, payload.length);

  const openResult = await openVaultFile({
    inputPath: sealed,
    outputPath: opened,
    passphrase,
  });
  assert.equal(openResult.sourceBytes, payload.length);
  assert.deepEqual(await fs.readFile(opened), payload);

  await assert.rejects(
    openVaultFile({
      inputPath: sealed,
      outputPath: wrongOutput,
      passphrase: "wrong passphrase that is definitely long enough",
    }),
    /incorrect passphrase|modified container/i,
  );

  await assert.rejects(
    sealVaultFile({ inputPath: source, outputPath: sealed, passphrase }),
    /exist/i,
  );

  console.log("secure-vault: pass");
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
