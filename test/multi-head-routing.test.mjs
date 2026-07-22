import test from "node:test";
import assert from "node:assert/strict";

import {
  computeMultiHeadStorage,
  resolveRouteHead,
} from "../core/multi-head-routing.mjs";

test("resolveRouteHead selects deterministic specialist heads with default fallback", () => {
  const policy = {
    defaultHead: "v10",
    routes: {
      bookRoot: "v8",
      governance: "v13",
      archive: "v13",
    },
  };

  assert.equal(resolveRouteHead(policy, "bookRoot"), "v8");
  assert.equal(resolveRouteHead(policy, "governance"), "v13");
  assert.equal(resolveRouteHead(policy, "archive"), "v13");
  assert.equal(resolveRouteHead(policy, "unknown"), "v10");
});

test("computeMultiHeadStorage estimates stored multi-head signature overhead", () => {
  const storage = computeMultiHeadStorage(
    {
      sourceBytes: 4096,
      experimentalPatchCount: 6,
      experimentalBinaryBytes: 192,
    },
    {
      storedHeadCount: 3,
      codeBytesPerPatch: 32,
    }
  );

  assert.equal(storage.selectedHeadBinaryBytes, 192);
  assert.equal(storage.allHeadsBinaryBytes, 576);
  assert.equal(storage.allHeadsBinaryVsSourceRatio, 0.1406);
});
