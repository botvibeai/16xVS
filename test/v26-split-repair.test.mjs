import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { buildV26SplitProbeSuitePlan } from "../core/v26-split-repair-probe.mjs";

test("buildV26SplitProbeSuitePlan isolates quote, blind, and stress repair heads", () => {
  const plan = buildV26SplitProbeSuitePlan({
    outputDir: path.join("C:\\tmp", "v26"),
    models: {
      quoteSplitV26: "./models/quote.json",
      blindSplitV26: "./models/blind.json",
      stressSplitV26: "./models/stress.json",
    },
  });

  assert.deepEqual(
    plan.splitProbes.map((item) => item.id),
    ["quote-split", "blind-split", "stress-split"]
  );
  assert.deepEqual(
    plan.heads.map((item) => item.id),
    [
      "default",
      "bookRoot",
      "governance",
      "booklikeRepair",
      "quoteRepair",
      "quoteSplitV26",
      "blindSplitV26",
      "stressSplitV26",
    ]
  );
  assert.equal(plan.storedHeadCount, 8);
  assert.deepEqual(
    plan.targetCases.map((item) => item.caseId),
    ["quote", "quote-paragraph", "blind-holdout", "stress-100"]
  );
  assert.equal(plan.targetCases.find((item) => item.caseId === "quote").targetHeadId, "quoteSplitV26");
  assert.equal(
    plan.targetCases.find((item) => item.caseId === "quote-paragraph").targetHeadId,
    "quoteSplitV26"
  );
  assert.equal(
    plan.targetCases.find((item) => item.caseId === "blind-holdout").targetHeadId,
    "blindSplitV26"
  );
  assert.equal(
    plan.targetCases.find((item) => item.caseId === "stress-100").targetHeadId,
    "stressSplitV26"
  );
});
