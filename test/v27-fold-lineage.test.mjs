import assert from "node:assert/strict";
import test from "node:test";

import {
  buildV27FoldLineageFixture,
  evaluateFoldLineage,
} from "../core/v27-fold-lineage.mjs";

function hexFromByte(value) {
  return value.toString(16).padStart(2, "0").repeat(32);
}

const fakeEncoder = {
  signature(text) {
    const value = String(text).includes("lineage-cluster-orbit") ? 0x0f : 0x00;
    return {
      signatureHex: hexFromByte(value),
      patchCount: String(text).includes("lineage-level-patch") ? 1 : 3,
    };
  },
};

test("buildV27FoldLineageFixture creates patch to chapter to book to mega nodes", () => {
  const fixture = buildV27FoldLineageFixture();
  const levels = new Set(fixture.nodes.map((node) => node.level));

  assert.deepEqual([...levels].sort(), ["book", "chapter", "mega", "patch"]);
  assert.ok(fixture.nodes.every((node) => node.id && node.text));
  assert.ok(fixture.nodes.filter((node) => node.level === "patch").length > 0);
  assert.ok(fixture.nodes.filter((node) => node.level === "mega").length >= 2);
});

test("evaluateFoldLineage requires every parent to stay closer to own children", () => {
  const fixture = buildV27FoldLineageFixture();
  const report = evaluateFoldLineage({
    nodes: fixture.nodes,
    encoder: fakeEncoder,
  });

  assert.equal(report.summary.allMarginsPositive, true);
  assert.equal(report.summary.parentLevels.chapter.parentCount > 0, true);
  assert.equal(report.summary.parentLevels.book.parentCount > 0, true);
  assert.equal(report.summary.parentLevels.mega.parentCount > 0, true);
  assert.ok(report.checks.every((item) => item.margin > 0));
  assert.ok(
    report.checks.every(
      (item) =>
        item.level &&
        item.parentId &&
        Array.isArray(item.childIds) &&
        Number.isFinite(item.nearestOwnDistance) &&
        Number.isFinite(item.nearestOutsideDistance) &&
        Number.isFinite(item.margin) &&
        Number.isFinite(item.patchCount) &&
        Number.isFinite(item.residualCount)
    )
  );
});
