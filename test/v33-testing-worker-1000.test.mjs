import assert from "node:assert/strict";
import test from "node:test";

import { buildV32StabilizationFixture } from "../core/v32-707-stabilization.mjs";
import {
  buildV33TestingWorkerLanguageEquityEntries,
  buildV33TestingWorkerThousandEntries,
} from "../scripts/run-v33-testing-worker-1000.mjs";
import { runV33TestingWorkerBatch } from "../src/testing-v33-sidecar.js";

test("V33 testing Worker 1000 fixture includes Hindi Russian and Arabic probes", () => {
  const entries = buildV33TestingWorkerThousandEntries();
  const text = entries.map((entry) => entry.meaningText).join("\n");

  assert.equal(entries.length, 1000);
  assert.match(text, /अर्थ वही रहता है/);
  assert.match(text, /смысл сохраняется/);
  assert.match(text, /المعنى محفوظ/);
  assert.ok(entries.every((entry) => entry.bpeTokens >= 707));
  assert.ok(entries.every((entry) => entry.bpeTokens <= 723));
});

test("V33 language-equity fixture is balanced across English Hindi Russian and Arabic", () => {
  const entries = buildV33TestingWorkerLanguageEquityEntries();
  const counts = entries.reduce((accumulator, entry) => {
    accumulator[entry.languageProbe] = (accumulator[entry.languageProbe] || 0) + 1;
    return accumulator;
  }, {});

  assert.equal(entries.length, 1000);
  assert.deepEqual(counts, {
    "english-control": 250,
    hindi: 250,
    russian: 250,
    arabic: 250,
  });
  assert.ok(entries.every((entry) => entry.bpeTokens >= 707));
});

test("V33 testing sidecar rejects primary and secondary runtime envs", () => {
  const entries = buildV32StabilizationFixture({ mode: "blind-holdout" }).slice(0, 10);
  const primary = runV33TestingWorkerBatch(
    { entries },
    { DEPLOYMENT_ROLE: "primary", DATA_STACK: "production" }
  );
  const secondary = runV33TestingWorkerBatch(
    { entries },
    { DEPLOYMENT_ROLE: "secondary", DATA_STACK: "production" }
  );

  assert.equal(primary.status, 404);
  assert.equal(primary.error.reason, "testing-worker-only");
  assert.equal(secondary.status, 404);
  assert.equal(secondary.error.reason, "testing-worker-only");
});

test("V33 testing sidecar accepts a valid 707 testing batch", () => {
  const entries = buildV32StabilizationFixture({ mode: "blind-holdout" });
  const result = runV33TestingWorkerBatch(
    { suiteId: "unit", batchId: "batch-01", entries },
    { DEPLOYMENT_ROLE: "testing", DATA_STACK: "testing" }
  );

  assert.equal(result.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.summary.correct, 100);
  assert.equal(result.summary.total, 100);
  assert.equal(result.summary.averageEquivalentOutputTokens, 1);
  assert.equal(result.summary.coldPathCount, 0);
  assert.equal(result.summary.residualCount, 0);
  assert.ok(result.summary.minOwnVsOutsideMargin > 0);
  assert.equal(result.rawTextStoredInResponse, false);
});

test("V33 testing sidecar rejects oversized batches", () => {
  const entries = buildV33TestingWorkerThousandEntries().slice(0, 101);
  const result = runV33TestingWorkerBatch(
    { suiteId: "unit", batchId: "too-large", entries },
    { DEPLOYMENT_ROLE: "testing", DATA_STACK: "testing" }
  );

  assert.equal(result.status, 400);
  assert.equal(result.ok, false);
  assert.match(result.error.message, /limited to 100 entries/i);
});
