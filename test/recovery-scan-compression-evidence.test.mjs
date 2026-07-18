import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { scanCompressionEvidence } from "../scripts/recovery-scan-compression-evidence.mjs";

test("recovers declared and derived compression evidence without changing source files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "16xvs-evidence-scan-"));
  try {
    const benchmarkDir = path.join(root, "bench", "run-707");
    await fs.mkdir(benchmarkDir, { recursive: true });
    const summaryPath = path.join(benchmarkDir, "summary.json");
    const original = `${JSON.stringify({
      averageSourceBpe: 707,
      averageEquivalentOutputTokens: 1,
      averageCompressionRatio: 707,
      correctness: { correct: 100, total: 100 },
    }, null, 2)}\n`;
    await fs.writeFile(summaryPath, original, "utf8");
    await fs.writeFile(path.join(root, "notes.md"), "private probe reached 2400:1 once; not qualified\n", "utf8");

    const report = await scanCompressionEvidence({ root, minRatio: 200 });
    assert.equal(report.matchedFileCount, 2);
    assert.ok(report.thresholds.atLeast700 >= 2);
    assert.ok(report.thresholds.atLeast2400 >= 1);
    assert.ok(report.strongestFindings.some((item) => item.path === "bench/run-707/summary.json" && item.ratio === 707));
    assert.equal(await fs.readFile(summaryPath, "utf8"), original);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("ignores ratios below the requested recovery threshold", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "16xvs-evidence-scan-floor-"));
  try {
    await fs.writeFile(path.join(root, "low.json"), JSON.stringify({ averageCompressionRatio: 199 }), "utf8");
    const report = await scanCompressionEvidence({ root, minRatio: 200 });
    assert.equal(report.findingCount, 0);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
