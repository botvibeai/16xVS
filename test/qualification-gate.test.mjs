import assert from "node:assert/strict";
import test from "node:test";

import { qualifyCompression } from "../core/qualification-gate.mjs";

function makeRuns({ ratio, count = 100, incorrectAt = -1, lowRatioAt = -1 } = {}) {
  return Array.from({ length: count }, (_, index) => ({
    sourceTokens: index === lowRatioAt ? 299 : ratio,
    outputTokens: 1,
    correct: index !== incorrectAt,
    blind: index < 20,
    restarted: index >= 20 && index < 23,
    restored: index >= 23 && index < 26,
  }));
}

test("qualifies 300:1 only when the worst run clears 300", () => {
  const result = qualifyCompression(makeRuns({ ratio: 315 }));
  assert.equal(result.qualified, true);
  assert.equal(result.publicRatio, 300);
  assert.equal(result.metrics.correctness, 1);
});

test("drops the public tier when one correct run falls below it", () => {
  const result = qualifyCompression(makeRuns({ ratio: 315, lowRatioAt: 99 }));
  assert.equal(result.qualified, true);
  assert.equal(result.publicRatio, 220);
  assert.equal(result.conservativeRatio, 299);
});

test("rejects a run set with any incorrect result", () => {
  const result = qualifyCompression(makeRuns({ ratio: 707, incorrectAt: 50 }));
  assert.equal(result.qualified, false);
  assert.equal(result.publicRatio, null);
  assert.equal(result.gates.correctness, false);
});

test("never rounds a 707 result up to an unsupported claim", () => {
  const result = qualifyCompression(makeRuns({ ratio: 707 }));
  assert.equal(result.qualified, true);
  assert.equal(result.publicRatio, 700);
});

test("can report 80000 only when every required run clears it", () => {
  const result = qualifyCompression(makeRuns({ ratio: 80000 }));
  assert.equal(result.qualified, true);
  assert.equal(result.publicRatio, 80000);
});
