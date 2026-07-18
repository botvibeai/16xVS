import assert from "node:assert/strict";
import test from "node:test";

import {
  replicateImmutableThreeTier,
  sha256Bytes,
} from "../core/immutable-r2-replication.mjs";

class FakeBucket {
  constructor({ failWrites = false } = {}) {
    this.failWrites = failWrites;
    this.objects = new Map();
    this.deleteCalls = 0;
  }

  async put(key, value, options = {}) {
    if (this.failWrites) throw new Error("simulated write failure");
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
    const ifNoneMatch = options.onlyIf instanceof Headers
      ? options.onlyIf.get("If-None-Match")
      : null;
    if (ifNoneMatch === "*" && this.objects.has(key)) return null;

    const digest = options.sha256 instanceof ArrayBuffer
      ? options.sha256
      : options.sha256?.buffer;
    const object = {
      key,
      size: bytes.byteLength,
      etag: `etag-${this.objects.size + 1}`,
      customMetadata: { ...(options.customMetadata || {}) },
      checksums: { sha256: digest },
      bytes: new Uint8Array(bytes),
    };
    this.objects.set(key, object);
    return object;
  }

  async head(key) {
    return this.objects.get(key) || null;
  }

  async delete() {
    this.deleteCalls += 1;
  }
}

function buckets(options = {}) {
  return {
    live: new FakeBucket(options.live),
    fallback: new FakeBucket(options.fallback),
    vault: new FakeBucket(options.vault),
  };
}

test("writes and verifies R2 checksums across all three tiers", async () => {
  const stores = buckets();
  const result = await replicateImmutableThreeTier({
    buckets: stores,
    key: "vault/2026-07-17/recovery.vault",
    value: "encrypted recovery bytes",
    contentIdentity: "snapshot-001",
  });
  assert.equal(result.ok, true);
  assert.equal(result.verification.every((item) => item.checksumSha256 === result.sha256), true);
  assert.deepEqual(result.writes.map((item) => item.status), ["written", "written", "written"]);
});

test("an identical retry confirms existing checksummed objects", async () => {
  const stores = buckets();
  const input = {
    buckets: stores,
    key: "vault/retry.vault",
    value: "same encrypted bytes",
    contentIdentity: "snapshot-002",
  };
  await replicateImmutableThreeTier(input);
  const result = await replicateImmutableThreeTier(input);
  assert.equal(result.ok, true);
  assert.deepEqual(
    result.writes.map((item) => item.status),
    ["confirmed-existing", "confirmed-existing", "confirmed-existing"],
  );
});

test("matching metadata alone cannot forge a valid existing replica", async () => {
  const stores = buckets();
  const key = "vault/forged.vault";
  const desired = await sha256Bytes("desired encrypted bytes");
  for (const bucket of Object.values(stores)) {
    bucket.objects.set(key, {
      key,
      size: desired.bytes.byteLength,
      etag: "forged",
      customMetadata: {
        sha256: desired.hex,
        contentIdentity: "snapshot-003",
      },
      checksums: {},
      bytes: new TextEncoder().encode("different bytes"),
    });
  }
  const result = await replicateImmutableThreeTier({
    buckets: stores,
    key,
    value: "desired encrypted bytes",
    contentIdentity: "snapshot-003",
  });
  assert.equal(result.ok, false);
  assert.equal(result.writes.every((item) => item.status === "failed"), true);
  assert.equal(
    result.verification.every((item) => item.reason.includes("missing-stored-checksum")),
    true,
  );
});

test("a collision with different bytes fails without deleting a successful copy", async () => {
  const stores = buckets();
  const key = "vault/collision.vault";
  await replicateImmutableThreeTier({
    buckets: stores,
    key,
    value: "first encrypted bytes",
    contentIdentity: "snapshot-004",
  });
  const result = await replicateImmutableThreeTier({
    buckets: stores,
    key,
    value: "different encrypted bytes",
    contentIdentity: "snapshot-005",
  });
  assert.equal(result.ok, false);
  assert.equal(stores.live.deleteCalls + stores.fallback.deleteCalls + stores.vault.deleteCalls, 0);
});

test("preserves successful Vault and live writes when fallback fails", async () => {
  const stores = buckets({ fallback: { failWrites: true } });
  const result = await replicateImmutableThreeTier({
    buckets: stores,
    key: "vault/partial.vault",
    value: "encrypted bytes survive partial failure",
    contentIdentity: "snapshot-006",
  });
  assert.equal(result.ok, false);
  assert.equal(result.verification.find((item) => item.tier === "live").ok, true);
  assert.equal(result.verification.find((item) => item.tier === "vault").ok, true);
  assert.equal(result.verification.find((item) => item.tier === "fallback").ok, false);
  assert.equal(stores.live.deleteCalls + stores.fallback.deleteCalls + stores.vault.deleteCalls, 0);
});
