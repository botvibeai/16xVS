import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const FORMAT = "16xvs-secure-vault";
const CURRENT_VERSION = 2;
const CIPHER = "aes-256-gcm";
const KDF = "scrypt";
const SCRYPT_PROFILE = Object.freeze({
  N: 1 << 17,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024,
});
const MAX_CONTAINER_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 1024 * 1024;

function assertPassphrase(value) {
  if (typeof value !== "string" || value.length < 20) {
    throw new Error("Vault passphrase must be at least 20 characters.");
  }
  if (Buffer.byteLength(value, "utf8") > 4096) {
    throw new Error("Vault passphrase is too long.");
  }
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function stableHeader(header) {
  return Buffer.from(JSON.stringify(header), "utf8");
}

function assertSupportedScrypt(parameters) {
  const N = Number(parameters?.N);
  const r = Number(parameters?.r);
  const p = Number(parameters?.p);
  if (N !== SCRYPT_PROFILE.N || r !== SCRYPT_PROFILE.r || p !== SCRYPT_PROFILE.p) {
    throw new Error("Unsupported Vault key-derivation parameters.");
  }
  return SCRYPT_PROFILE;
}

function deriveKeyV1(passphrase, salt, parameters) {
  assertPassphrase(passphrase);
  return crypto.scryptSync(passphrase.normalize("NFKC"), salt, 32, parameters);
}

function deriveKeyV2(passphrase, salt, parameters) {
  assertPassphrase(passphrase);
  return crypto.scryptSync(Buffer.from(passphrase, "utf8"), salt, 32, parameters);
}

function buildEncryptedPayload(plaintext, manifest) {
  const manifestBytes = Buffer.from(JSON.stringify(manifest), "utf8");
  if (manifestBytes.length > MAX_MANIFEST_BYTES) {
    throw new Error("Vault metadata is too large.");
  }
  const prefix = Buffer.allocUnsafe(4);
  prefix.writeUInt32BE(manifestBytes.length, 0);
  return Buffer.concat([prefix, manifestBytes, plaintext]);
}

function parseEncryptedPayload(payload) {
  if (payload.length < 4) throw new Error("Vault payload is truncated.");
  const manifestLength = payload.readUInt32BE(0);
  if (manifestLength <= 0 || manifestLength > MAX_MANIFEST_BYTES || 4 + manifestLength > payload.length) {
    throw new Error("Vault encrypted manifest is invalid.");
  }
  let manifest;
  try {
    manifest = JSON.parse(payload.subarray(4, 4 + manifestLength).toString("utf8"));
  } catch {
    throw new Error("Vault encrypted manifest is damaged.");
  }
  return { manifest, plaintext: payload.subarray(4 + manifestLength) };
}

function parseBase64Field(value, label, expectedLength = null) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`Vault ${label} is missing.`);
  const decoded = Buffer.from(value, "base64");
  if (expectedLength !== null && decoded.length !== expectedLength) {
    throw new Error(`Vault ${label} has an invalid length.`);
  }
  if (decoded.toString("base64").replace(/=+$/, "") !== value.replace(/=+$/, "")) {
    throw new Error(`Vault ${label} is not valid base64.`);
  }
  return decoded;
}

function validateCommonEnvelope(envelope) {
  const header = envelope?.header;
  if (!header || header.format !== FORMAT || ![1, 2].includes(header.version)) {
    throw new Error("Unsupported or invalid 16xVS Vault container.");
  }
  if (header.cipher !== CIPHER || header.kdf !== KDF) {
    throw new Error("Unsupported Vault cipher or key derivation function.");
  }
  assertSupportedScrypt(header.scrypt);
  const ciphertext = parseBase64Field(envelope.ciphertext, "ciphertext");
  if (ciphertext.length > MAX_CONTAINER_BYTES) throw new Error("Vault container exceeds the supported size limit.");
  if (sha256(ciphertext) !== envelope.ciphertextSha256) {
    throw new Error("Vault ciphertext hash mismatch. The container may be damaged.");
  }
  return {
    header,
    ciphertext,
    salt: parseBase64Field(header.salt, "salt", 32),
    iv: parseBase64Field(header.iv, "IV", 12),
    authTag: parseBase64Field(envelope.authTag, "authentication tag", 16),
  };
}

export async function sealVaultFile({ inputPath, outputPath, passphrase, metadata = {} } = {}) {
  if (!inputPath || !outputPath) throw new Error("inputPath and outputPath are required.");
  assertPassphrase(passphrase);

  const sourceStats = await fs.stat(inputPath);
  if (!sourceStats.isFile()) throw new Error("Vault source must be a regular file.");
  if (sourceStats.size > MAX_CONTAINER_BYTES) throw new Error("Vault source exceeds the supported size limit.");
  const plaintext = await fs.readFile(inputPath);
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const key = deriveKeyV2(passphrase, salt, SCRYPT_PROFILE);
  const createdAt = new Date().toISOString();
  const manifest = {
    sourceName: path.basename(inputPath),
    sourceBytes: plaintext.length,
    sourceSha256: sha256(plaintext),
    createdAt,
    metadata,
  };
  const encryptedPayload = buildEncryptedPayload(plaintext, manifest);
  const header = {
    format: FORMAT,
    version: CURRENT_VERSION,
    cipher: CIPHER,
    kdf: KDF,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    scrypt: { N: SCRYPT_PROFILE.N, r: SCRYPT_PROFILE.r, p: SCRYPT_PROFILE.p },
  };

  const cipher = crypto.createCipheriv(CIPHER, key, iv);
  cipher.setAAD(stableHeader(header));
  const ciphertext = Buffer.concat([cipher.update(encryptedPayload), cipher.final()]);
  const envelope = {
    header,
    ciphertextSha256: sha256(ciphertext),
    ciphertext: ciphertext.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(envelope)}\n`, { flag: "wx", mode: 0o600 });
  return {
    outputPath,
    sourceBytes: plaintext.length,
    sourceSha256: manifest.sourceSha256,
    ciphertextBytes: ciphertext.length,
    ciphertextSha256: envelope.ciphertextSha256,
    createdAt,
    version: CURRENT_VERSION,
  };
}

function decryptEnvelope({ header, ciphertext, salt, iv, authTag }, passphrase) {
  const key = header.version === 1
    ? deriveKeyV1(passphrase, salt, SCRYPT_PROFILE)
    : deriveKeyV2(passphrase, salt, SCRYPT_PROFILE);
  const decipher = crypto.createDecipheriv(CIPHER, key, iv);
  decipher.setAAD(stableHeader(header));
  decipher.setAuthTag(authTag);
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error("Vault unlock failed: incorrect passphrase or modified container.");
  }
}

export async function openVaultFile({ inputPath, outputPath, passphrase } = {}) {
  if (!inputPath || !outputPath) throw new Error("inputPath and outputPath are required.");
  assertPassphrase(passphrase);
  const containerStats = await fs.stat(inputPath);
  if (!containerStats.isFile()) throw new Error("Vault container must be a regular file.");
  if (containerStats.size > Math.ceil(MAX_CONTAINER_BYTES * 1.5) + MAX_MANIFEST_BYTES) {
    throw new Error("Vault container exceeds the supported size limit.");
  }
  const envelopeText = await fs.readFile(inputPath, "utf8");
  let envelope;
  try {
    envelope = JSON.parse(envelopeText);
  } catch {
    throw new Error("Vault container is not valid JSON.");
  }
  const validated = validateCommonEnvelope(envelope);
  const decrypted = decryptEnvelope(validated, passphrase);

  let manifest;
  let plaintext;
  if (validated.header.version === 1) {
    manifest = {
      sourceName: validated.header.sourceName,
      sourceBytes: validated.header.sourceBytes,
      sourceSha256: validated.header.sourceSha256,
      createdAt: validated.header.createdAt,
      metadata: validated.header.metadata,
    };
    plaintext = decrypted;
  } else {
    ({ manifest, plaintext } = parseEncryptedPayload(decrypted));
  }

  if (!Number.isSafeInteger(manifest.sourceBytes) || manifest.sourceBytes < 0) {
    throw new Error("Vault plaintext length metadata is invalid.");
  }
  if (plaintext.length !== manifest.sourceBytes || sha256(plaintext) !== manifest.sourceSha256) {
    throw new Error("Vault plaintext verification failed.");
  }
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, plaintext, { flag: "wx", mode: 0o600 });
  return {
    outputPath,
    sourceName: manifest.sourceName,
    sourceBytes: plaintext.length,
    sourceSha256: manifest.sourceSha256,
    createdAt: manifest.createdAt,
    metadata: manifest.metadata,
    version: validated.header.version,
  };
}

export const SECURE_VAULT_FORMAT = Object.freeze({
  format: FORMAT,
  version: CURRENT_VERSION,
  readableVersions: [1, 2],
  cipher: CIPHER,
  kdf: KDF,
  scrypt: { N: SCRYPT_PROFILE.N, r: SCRYPT_PROFILE.r, p: SCRYPT_PROFILE.p },
  encryptedManifest: true,
  exactPassphraseBytes: true,
});
