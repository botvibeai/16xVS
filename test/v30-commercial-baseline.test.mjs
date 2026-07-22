import assert from "node:assert/strict";
import test from "node:test";

import {
  COMMERCIAL_BASELINES_V30,
  V30_TARGETS,
  buildV30CommercialFixture,
  buildV30CommercialGapReport,
  calculateCompressionMath,
  evaluateV30CommercialBaseline,
  minimumSourceTokensToBeat,
} from "../core/v30-commercial-baseline.mjs";

test("V30 commercial baseline math records the compression numbers to beat", () => {
  assert.equal(calculateCompressionMath({ sourceTokens: 200, outputTokens: 20 }).ratio, 10);
  assert.equal(calculateCompressionMath({ sourceTokens: 220, outputTokens: 22 }).ratio, 10);
  assert.equal(calculateCompressionMath({ sourceTokens: 220, outputTokens: 11 }).ratio, 20);

  const stretch = calculateCompressionMath({ sourceTokens: 220, outputTokens: 1 });
  assert.equal(stretch.ratio, 220);
  assert.equal(stretch.reductionPercent, 99.5455);

  assert.equal(
    Math.round(calculateCompressionMath({ sourceTokens: 112552, outputTokens: 498 }).ratio),
    226
  );
  assert.equal(minimumSourceTokensToBeat({ baselineRatio: 226, outputTokens: 1 }), 227);
  assert.equal(
    minimumSourceTokensToBeat({ baselineRatio: 226, outputTokens: 1, improvementRatio: 0.1 }),
    249
  );
});

test("V30 fixture has exactly 100 entries inside the 200-240 BPE band", () => {
  const entries = buildV30CommercialFixture();

  assert.equal(entries.length, 100);
  assert.equal(new Set(entries.map((entry) => entry.groupId)).size, 10);

  for (const entry of entries) {
    assert.ok(entry.bpeTokens >= 200, `${entry.id} has too few BPE tokens: ${entry.bpeTokens}`);
    assert.ok(entry.bpeTokens <= 240, `${entry.id} has too many BPE tokens: ${entry.bpeTokens}`);
    assert.match(entry.text, new RegExp(entry.groupMarker));
  }
});

test("V30 local proof passes 100/100 correctness while counting residuals against compression", () => {
  const evaluation = evaluateV30CommercialBaseline({
    entries: buildV30CommercialFixture(),
  });

  assert.equal(evaluation.summary.entryCount, 100);
  assert.equal(evaluation.correctness.correct, 100);
  assert.equal(evaluation.correctness.total, 100);
  assert.equal(evaluation.correctness.tiedOrWrong.length, 0);
  assert.equal(evaluation.summary.averageEquivalentOutputTokens, 1);
  assert.equal(evaluation.targets.P0.pass, true);
  assert.equal(evaluation.targets.P1.pass, true);
  assert.equal(evaluation.targets.P2.pass, true);
  assert.equal(evaluation.targets.P0.maxEquivalentOutputTokens, V30_TARGETS.P0.maxEquivalentOutputTokens);
  assert.ok(evaluation.summary.averageCompressionRatio >= 200);
});

test("V30 commercial gap report separates safe commercial wins from the 226x query-aware demo", () => {
  const evaluation = evaluateV30CommercialBaseline({
    entries: buildV30CommercialFixture(),
  });
  const report = buildV30CommercialGapReport({ evaluation });

  assert.equal(COMMERCIAL_BASELINES_V30.find((item) => item.id === "commercial-safe-10x").ratio, 10);
  assert.equal(report.baselineDeltas.find((item) => item.id === "commercial-safe-10x").beats, true);
  assert.equal(report.baselineDeltas.find((item) => item.id === "research-open-20x").beats, true);
  assert.equal(
    report.baselineDeltas.find((item) => item.id === "query-aware-demo-226x").applesToApples,
    false
  );
  assert.equal(report.compresr226xMath.sourceTokensForOneTokenToBeat, 227);
  assert.equal(report.compresr226xMath.sourceTokensForOneTokenToBeatBy10Percent, 249);
  assert.equal(report.compresr226xMath.sourceTokensForOneTokenToBeatBy20Percent, 272);
  assert.match(report.claimLevel, /commercial/);
});
