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

function objectMatches(object, expected) {
  if (!object) return false;
  const metadata = object.customMetadata || {};
  return (
    Number(object.size) === expected.size &&
    metadata.sha256 === expected.sha256 &&
    metadata.contentIdentity === expected.contentIdentity
  );
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
    if (!objectMatches(result, expected)) {
      throw new Error(`${tier} write returned mismatched metadata for ${key}`);
    }
    return { tier, key, status: "written", size: result.size, etag: result.etag || null };
  }

  const existing = await bucket.head(key);
  if (!objectMatches(existing, expected)) {
    throw new Error(`${tier} immutable key collision for ${key}`);
  }
  return { tier, key, status: "confirmed-existing", size: existing.size, etag: existing.etag || null };
}

export async function verifyImmutableReplica(bucket, tier, key, expected) {
  const object = await bucket.head(key);
  if (!object) return { tier, key, ok: false, reason: "missing" };
  if (!objectMatches(object, expected)) {
    return {
      tier,
      key,
      ok: false,
      reason: "metadata-mismatch",
      actual: {
        size: object.size,
        sha256: object.customMetadata?.sha256 || null,
        contentIdentity: object.customMetadata?.contentIdentity || null,
      },
    };
  }
  return { tier, key, ok: true, size: object.size, etag: object.etag || null };
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
    },
  };
}
