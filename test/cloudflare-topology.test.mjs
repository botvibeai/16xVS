import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { listRecordsFromR2Fallback, runtimeMetadata } from "../src/index.js";

const repoRoot = process.cwd();

async function readJson(file) {
  return JSON.parse(await readFile(path.join(repoRoot, file), "utf8"));
}

test("Cloudflare topology keeps primary and secondary on the shared production bucket stack", async () => {
  const primary = await readJson("wrangler.jsonc");
  const secondary = await readJson("wrangler.secondary.jsonc");

  assert.equal(primary.name, "16xvs-poc");
  assert.equal(secondary.name, "16xvs-poc-secondary");
  assert.equal(primary.vars.DEPLOYMENT_ROLE, "primary");
  assert.equal(secondary.vars.DEPLOYMENT_ROLE, "secondary");
  assert.equal(primary.vars.PROOF_BASELINE, "v30");
  assert.equal(secondary.vars.PROOF_BASELINE, "v30");
  assert.deepEqual(
    secondary.r2_buckets.map((bucket) => bucket.bucket_name),
    primary.r2_buckets.map((bucket) => bucket.bucket_name)
  );
});

test("Cloudflare testing Worker is isolated from production buckets", async () => {
  const primary = await readJson("wrangler.jsonc");
  const testing = await readJson("wrangler.testing.jsonc");
  const prodBuckets = new Set(primary.r2_buckets.map((bucket) => bucket.bucket_name));

  assert.equal(testing.name, "16xvs-poc-testing");
  assert.equal(testing.vars.DEPLOYMENT_ROLE, "testing");
  assert.equal(testing.vars.DATA_STACK, "testing");

  for (const bucket of testing.r2_buckets) {
    assert.match(bucket.bucket_name, /^16xvs-poc-testing-/);
    assert.equal(prodBuckets.has(bucket.bucket_name), false);
  }
});

test("runtime metadata defaults to V30 primary and reflects configured roles", () => {
  assert.deepEqual(runtimeMetadata({}), {
    role: "primary",
    dataStack: "production",
    proofBaseline: "v30",
    catalogRecovery: "durable-object-with-r2-fallback",
  });

  assert.equal(
    runtimeMetadata({
      DEPLOYMENT_ROLE: "testing",
      DATA_STACK: "testing",
      PROOF_BASELINE: "v30-plus-experiments",
    }).role,
    "testing"
  );
});

test("R2 fallback can rebuild records from live storage when Durable Object state is empty", async () => {
  const storedRecord = {
    id: "record-1",
    createdAt: "2026-07-21T00:00:00.000Z",
    createdAtMs: 1784592000000,
    source: { name: "fixture", mimeType: "application/json", originalWidth: 16, originalHeight: 16 },
    metadata: { lane: "v30" },
    glyph: { hex: "0".repeat(64), threshold: 127, bitstring: "0".repeat(256), onBits: 0, density: 0 },
    sampleDigest: "a".repeat(64),
  };

  const fakeBucket = {
    async list() {
      return { objects: [{ key: "glyphs/2026-07-21/record-1.json" }], truncated: false };
    },
    async get() {
      return { async json() { return storedRecord; } };
    },
  };

  const records = await listRecordsFromR2Fallback({ LIVE_TOKENS: fakeBucket }, 10);

  assert.equal(records.length, 1);
  assert.equal(records[0].id, "record-1");
  assert.equal(records[0].storage.mode, "single");
  assert.equal(records[0].storage.copyCount, 1);
  assert.equal(records[0].storage.quorumMet, false);
});

test("R2 fallback merges live fallback and vault copies into a quorum", async () => {
  const storedRecord = {
    id: "record-1",
    createdAt: "2026-07-21T00:00:00.000Z",
    createdAtMs: 1784592000000,
    source: { name: "fixture", mimeType: "application/json", originalWidth: 16, originalHeight: 16 },
    metadata: { lane: "v30" },
    glyph: { hex: "0".repeat(64), threshold: 127, bitstring: "0".repeat(256), onBits: 0, density: 0 },
    sampleDigest: "a".repeat(64),
  };

  function fakeBucket(storageClass = "Standard") {
    return {
      async list() {
        return {
          objects: [{
            key: "glyphs/2026-07-21/record-1.json",
            etag: "etag-1",
            version: "version-1",
            uploaded: "2026-07-21T00:00:01.000Z",
            storageClass,
          }],
          truncated: false,
        };
      },
      async get() {
        return { async json() { return storedRecord; } };
      },
    };
  }

  const records = await listRecordsFromR2Fallback({
    LIVE_TOKENS: fakeBucket(),
    FALLBACK_TOKENS: fakeBucket(),
    VAULT_TOKENS: fakeBucket("InfrequentAccess"),
  }, 10);

  assert.equal(records.length, 1);
  assert.equal(records[0].storage.mode, "triple");
  assert.deepEqual(records[0].storage.successfulTiers, ["live", "fallback", "vault"]);
  assert.equal(records[0].storage.copyCount, 3);
  assert.equal(records[0].storage.quorumMet, true);
  assert.equal(records[0].storage.liveReady, true);
});
