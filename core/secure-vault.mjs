import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const FORMAT = "16xvs-secure-vault";
const VERSION = 1;
const CIPHER = "aes-256-gcm";
const KDF = "scrypt";
const DEFAULT_SCRYPT = Object.freeze({
  N: 1 << 17,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024,
});

function assertPassphrase(value) {
  if (typeof value !== "string" || value.length < 20) {
    throw new Error("Vault passphrase must be at least 20 characters.");
  }
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function stableHeader(header) {
  return Buffer.from(JSON.stringify(header), "utf8");
}

function deriveKey(passphrase, salt, parameters = DEFAULT_SCRYPT) {
  assertPassphrase(passphrase);
  return crypto.scryptSync(passphrase.normalize("NFKC"), salt, 32, parameters);
}

export async function sealVaultFile({
  inputPath,
  outputPath,
  passphrase,
  metadata = {},
  scrypt = DEFAULT_SCRYPT,
} = {}) {
  if (!inputPath || !outputPath) throw new Error("inputPath and outputPath are required.");
  assertPassphrase(passphrase);

  const plaintext = await fs.readFile(inputPath);
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(passphrase, salt, scrypt);

  const header = {
    format: FORMAT,
    version: VERSION,
    cipher: CIPHER,
    kdf: KDF,
    createdAt: new Date().toISOString(),
    sourceName: path.basename(inputPath),
    sourceBytes: plaintext.length,
    sourceSha256: sha256(plaintext),
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    scrypt: { N: scrypt.N, r: scrypt.r, p: scrypt.p },
    metadata,
  };

  const cipher = crypto.createCipheriv(CIPHER, key, iv);
  cipher.setAAD(stableHeader(header));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const envelope = {
    header,
    ciphertextSha256: sha256(ciphertext),
    ciphertext: ciphertext.toString("base64"),
    authTag: authTag.toString("base64"),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(envelope)}\n`, { flag: "wx", mode: 0o600 });

  return {
    outputPath,
    sourceBytes: plaintext.length,
    sourceSha256: header.sourceSha256,
    ciphertextBytes: ciphertext.length,
    ciphertextSha256: envelope.ciphertextSha256,
    createdAt: header.createdAt,
  };
}

export async function openVaultFile({ inputPath, outputPath, passphrase } = {}) {
  if (!inputPath || !outputPath) throw new Error("inputPath and outputPath are required.");
  assertPassphrase(passphrase);

  const envelope = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const header = envelope?.header;
  if (!header || header.format !== FORMAT || header.version !== VERSION) {
    throw new Error("Unsupported or invalid 16xVS Vault container.");
  }
  if (header.cipher !== CIPHER || header.kdf !== KDF) {
    throw new Error("Unsupported Vault cipher or key derivation function.");
  }

  const ciphertext = Buffer.from(envelope.ciphertext, "base64");
  if (sha256(ciphertext) !== envelope.ciphertextSha256) {
    throw new Error("Vault ciphertext hash mismatch. The container may be damaged.");
  }

  const salt = Buffer.from(header.salt, "base64");
  const iv = Buffer.from(header.iv, "base64");
  const key = deriveKey(passphrase, salt, {
    N: Number(header.scrypt.N),
    r: Number(header.scrypt.r),
    p: Number(header.scrypt.p),
    maxmem: DEFAULT_SCRYPT.maxmem,
  });

  const decipher = crypto.createDecipheriv(CIPHER, key, iv);
  decipher.setAAD(stableHeader(header));
  decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));

  let plaintext;
  try {
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error("Vault unlock failed: incorrect passphrase or modified container.");
  }

  if (plaintext.length !== header.sourceBytes || sha256(plaintext) !== header.sourceSha256) {
    throw new Error("Vault plaintext verification failed.");
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, plaintext, { flag: "wx", mode: 0o600 });

  return {
    outputPath,
    sourceName: header.sourceName,
    sourceBytes: plaintext.length,
    sourceSha256: header.sourceSha256,
    createdAt: header.createdAt,
    metadata: header.metadata,
  };
}

export const SECURE_VAULT_FORMAT = Object.freeze({
  format: FORMAT,
  version: VERSION,
  cipher: CIPHER,
  kdf: KDF,
  scrypt: { N: DEFAULT_SCRYPT.N, r: DEFAULT_SCRYPT.r, p: DEFAULT_SCRYPT.p },
});
