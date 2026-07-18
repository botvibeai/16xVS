import assert from "node:assert/strict";
import test from "node:test";

import { qualifyCompression } from "../core/qualification-gate.mjs";

function makeRuns({ ratio, count = 100, incorrectAt = -1, lowRatioAt = -1 } = {}) {
  return Array.from({ length: count }, (_, index) => ({
    sourceTokens: index === lowRatioAt ? 299 : ratio,
    outputTokens: 1,
    correct: index !== incorrectAt,
    blind: index < 