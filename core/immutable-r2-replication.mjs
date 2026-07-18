const encoder = new TextEncoder();

function toBytes(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (typeof value === "string") return encoder.encode(value);
  throw new TypeError("value must be a string, ArrayBuffer, or ArrayBufferView");
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeMetadata(metadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [String(key), String(value)]),
  );
}

export async function sha256Bytes(value) {
  const bytes = toBytes(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return { bytes, digest, hex: toHex(digest) };
}

function inspectObject(object, expected) {
  if (!object) return { ok: false, reasons: ["missing"], actual: null };
  const metadata = object.customMetadata || {};
  const actualChecksum = object.checksums?.sha256 ? toHex(object.checksums.sha256) : null;
  const reasons = [];
  if (Number(object.size) !== expected.size) reasons.push("size");
  if (metadata.sha256 !== expected.sha256) reasons.push("metadata-sha256");
  if (metadata.contentIdentity !== expected.contentIdentity) reasons.push("content-identity");
  if (actualChecksum !== expected.sha256) {
    reasons.push(actualChecksum ? "stored-checksum" : "missing-stored-checksum");
  }
  return {
    ok: reasons.length === 0,
    reasons,
    actual: {
      size: Number(object.size),
      metadataSha256: metadata.sha256 || null,
      contentIdentity: metadata.contentIdentity || null,
      checksumSha256: actualChecksum,
    },
  };
}

async function putImmutable(bucket, tier, key, bytes, expected, metadata) {
  const headers = new Headers({ "If-None-Match": "*" });
  const result = await bucket.put(key, bytes, {
    onlyIf: headers,
    sha256: expected.digest,
    httpMetadata: { contentType: "application/octet-stream" },
    customMetadata: {
      ...metadata,
      tier,
      sha256: expected.sha256,
      contentIdentity: expected.contentIdentity,
      immutable: "true",
    },
  });

  if (result) {
    const inspection = inspectObject(result, expected);
    if (!inspection.ok) {
      throw new Error(
        `${tier} write verification failed for ${key}: ${inspection.reasons.join(",")}`,
      );
    }
    return {
      tier,
      key,
      status: "written",
      size: result.size,
      etag: result.etag || null,
      checksumSha256: inspection.actual.checksumSha256,
    };
  }

  const existing = await bucket.head(key);
  const inspection = inspectObject(existing, expected);
  if (!inspection.ok) {
    throw new Error(
      `${tier} immutable key collision or unverifiable object for ${key}: ${inspection.reasons.join(",")}`,
    );
  }
  return {
    tier,
    key,
    status: "confirmed-existing",
    size: existing.size,
    etag: existing.etag || null,
    checksumSha256: inspection.actual.checksumSha256,
  };
}

export async function verifyImmutableReplica(bucket, tier, key, expected) {
  const object = await bucket.head(key);
  const inspection = inspectObject(object, expected);
  if (!inspection.ok) {
    return {
      tier,
      key,
      ok: false,
      reason: inspection.reasons.join(","),
      actual: inspection.actual,
    };
  }
  return {
    tier,
    key,
    ok: true,
    size: object.size,
    etag: object.etag || null,
    checksumSha256: inspection.actual.checksumSha256,
  };
}

export async function replicateImmutableThreeTier({
  buckets,
  key,
  value,
  contentIdentity,
  metadata = {},
} = {}) {
  if (!buckets?.live || !buckets?.fallback || !buckets?.vault) {
    throw new Error("live, fallback, and vault buckets are required");
  }
  if (typeof key !== "string" || !key.trim()) throw new Error("key is required");
  if (typeof contentIdentity !== "string" || !contentIdentity.trim()) {
    throw new Error("contentIdentity is required");
  }

  const hashed = await sha256Bytes(value);
  const expected = {
    size: hashed.bytes.byteLength,
    sha256: hashed.hex,
    digest: hashed.digest,
    contentIdentity,
  };
  const commonMetadata = normalizeMetadata({
    ...metadata,
    contentIdentity,
    replicatedAt: new Date().toISOString(),
    verificationPolicy: "r2-sha256-v1",
  });
  const tiers = [
    ["live", buckets.live],
    ["fallback", buckets.fallback],
    ["vault", buckets.vault],
  ];

  const settled = await Promise.allSettled(
    tiers.map(([tier, bucket]) =>
      putImmutable(bucket, tier, key, hashed.bytes, expected, commonMetadata),
    ),
  );
  const writes = settled.map((result, index) => {
    const tier = tiers[index][0];
    return result.status === "fulfilled"
      ? result.value
      : { tier, key, status: "failed", error: String(result.reason?.message || result.reason) };
  });
  const verification = await Promise.all(
    tiers.map(([tier, bucket]) => verifyImmutableReplica(bucket, tier, key, expected)),
  );
  const complete = verification.every((item) => item.ok === true);

  return {
    ok: complete,
    complete,
    key,
    contentIdentity,
    sha256: expected.sha256,
    size: expected.size,
    writes,
    verification,
    policy: {
      appendOnly: true,
      rollbackDeletes: false,
      requiredTiers: ["live", "fallback", "vault"],
      verification: "r2-stored-sha256-plus-metadata",
    },
  };
}
