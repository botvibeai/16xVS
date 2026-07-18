import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { openVaultFile, sealVaultFile, SECURE_VAULT_FORMAT } from "../core/secure-vault.mjs";

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "16xvs-vault-v2-"));
  const source = path.join(root, "secret-model-name.json");
  const sealed = path.join(root, "sealed.16xvsvault");
  const opened = path.join(root, "opened.json");
  await fs.writeFile(source, Buffer.concat([Buffer.from("private model bytes\n", "utf8"), Buffer.from([0, 1])]));
  return { root, source, sealed, opened };
}

const passphrase = "Michael test phrase only 06/11/1974 extra";

test("Vault v2 round-trip encrypts filename and metadata", async () => {
  const f = await fixture();
  try {
    await sealVaultFile({
      inputPath: f.source,
      outputPath: f.sealed,
      passphrase,
      metadata: { model: "private-v707" },
    });
    const raw = await fs.readFile(f.sealed, "utf8");
    assert.doesNotMatch(raw, /secret-model-name|private-v707|sourceSha256|sourceBytes|createdAt/);
    const opened = await openVaultFile({ inputPath: f.sealed, outputPath: f.opened, passphrase });
    assert.equal(opened.sourceName, "secret-model-name.json");
    assert.deepEqual(opened.metadata, { model: "private-v707" });
    assert.deepEqual(await fs.readFile(f.opened), await fs.readFile(f.source));
    assert.equal(opened.version, 2);
    assert.equal(SECURE_VAULT_FORMAT.encryptedManifest, true);
  } finally {
    await fs.rm(f.root, { recursive: true, force: true });
  }
});

test("Vault v2 passphrase uses exact UTF-8 bytes", async () => {
  const f = await fixture();
  try {
    const composed = "exact phrase caf\u00e9 with enough characters 123";
    const decomposed = "exact phrase cafe\u0301 with enough characters 123";
    await sealVaultFile({ inputPath: f.source, outputPath: f.sealed, passphrase: composed });
    await assert.rejects(
      openVaultFile({ inputPath: f.sealed, outputPath: f.opened, passphrase: decomposed }),
      /unlock failed/i,
    );
  } finally {
    await fs.rm(f.root, { recursive: true, force: true });
  }
});

test("Vault rejects hostile scrypt parameters before derivation", async () => {
  const f = await fixture();
  try {
    await sealVaultFile({ inputPath: f.source, outputPath: f.sealed, passphrase });
    const envelope = JSON.parse(await fs.readFile(f.sealed, "utf8"));
    envelope.header.scrypt.N = 2 ** 30;
    await fs.writeFile(f.sealed, JSON.stringify(envelope), "utf8");
    await assert.rejects(
      openVaultFile({ inputPath: f.sealed, outputPath: f.opened, passphrase }),
      /key-derivation parameters/i,
    );
  } finally {
    await fs.rm(f.root, { recursive: true, force: true });
  }
});

test("Vault rejects malformed base64 and invalid field lengths", async () => {
  const f = await fixture();
  try {
    await sealVaultFile({ inputPath: f.source, outputPath: f.sealed, passphrase });
    const envelope = JSON.parse(await fs.readFile(f.sealed, "utf8"));
    envelope.header.iv = "!!!!";
    await fs.writeFile(f.sealed, JSON.stringify(envelope), "utf8");
    await assert.rejects(
      openVaultFile({ inputPath: f.sealed, outputPath: f.opened, passphrase }),
      /IV/i,
    );
  } finally {
    await fs.rm(f.root, { recursive: true, force: true });
  }
});

test("Vault refuses overwrite on seal and open", async () => {
  const f = await fixture();
  try {
    await sealVaultFile({ inputPath: f.source, outputPath: f.sealed, passphrase });
    await assert.rejects(
      sealVaultFile({ inputPath: f.source, outputPath: f.sealed, passphrase }),
      /exist/i,
    );
    await fs.writeFile(f.opened, "do not overwrite", "utf8");
    await assert.rejects(
      openVaultFile({ inputPath: f.sealed, outputPath: f.opened, passphrase }),
      /exist/i,
    );
    assert.equal(await fs.readFile(f.opened, "utf8"), "do not overwrite");
  } finally {
    await fs.rm(f.root, { recursive: true, force: true });
  }
});

test("Vault reads legacy v1 containers without writing new v1 containers", async () => {
  const f = await fixture();
  try {
    const plaintext = await fs.readFile(f.source);
    const salt = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const header = {
      format: "16xvs-secure-vault",
      version: 1,
      cipher: "aes-256-gcm",
      kdf: "scrypt",
      createdAt: "2026-07-17T00:00:00.000Z",
      sourceName: path.basename(f.source),
      sourceBytes: plaintext.length,
      sourceSha256: crypto.createHash("sha256").update(plaintext).digest("hex"),
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
      scrypt: { N: 1 << 17, r: 8, p: 1 },
      metadata: { legacy: true },
    };
    const key = crypto.scryptSync(passphrase.normalize("NFKC"), salt, 32, {
      N: 1 << 17,
      r: 8,
      p: 1,
      maxmem: 256 * 1024 * 1024,
    });
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    cipher.setAAD(Buffer.from(JSON.stringify(header), "utf8"));
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    await fs.writeFile(f.sealed, JSON.stringify({
      header,
      ciphertextSha256: crypto.createHash("sha256").update(ciphertext).digest("hex"),
      ciphertext: ciphertext.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
    }));
    const opened = await openVaultFile({ inputPath: f.sealed, outputPath: f.opened, passphrase });
    assert.equal(opened.version, 1);
    assert.deepEqual(opened.metadata, { legacy: true });
    assert.deepEqual(await fs.readFile(f.opened), plaintext);
  } finally {
    await fs.rm(f.root, { recursive: true, force: true });
  }
});

test("Vault rejects authenticated-header tampering", async () => {
  const f = await fixture();
  try {
    await sealVaultFile({ inputPath: f.source, outputPath: f.sealed, passphrase });
    const envelope = JSON.parse(await fs.readFile(f.sealed, "utf8"));
    envelope.header.version = 1;
    await fs.writeFile(f.sealed, JSON.stringify(envelope), "utf8");
    await assert.rejects(
      openVaultFile({ inputPath: f.sealed, outputPath: f.opened, passphrase }),
      /unlock failed/i,
    );
  } finally {
    await fs.rm(f.root, { recursive: true, force: true });
  }
});
