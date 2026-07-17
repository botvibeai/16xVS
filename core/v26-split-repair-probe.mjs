import path from "node:path";

import { V23_HEADS, V23_PRIMARY_CASES } from "./v23-proof-package.mjs";

export const V26_SPLIT_PROBES = [
  {
    id: "quote-split",
    headId: "quoteSplitV26",
    baseSpec: "./data/training/embedding-training-spec-v24-quote-repair.json",
    spec: "./data/training/embedding-training-spec-v26-quote-split-repair.json",
    pairs: "./data/training/embedding-training-pairs-v26-quote-split-repair.json",
    baseModel: "./models/learned-hybrid-prototype-v26-quote-split-repair-base.json",
    model: "./models/learned-hybrid-prototype-v26-quote-split-repair-hierarchical-packer-v2.json",
    seed: 61,
    reports: [
      {
        sourceId: "quote",
        report: "./bench/fortify-2026-05-16-v24-quote-repair/quote-v24-quote-repair.json",
        maxPairsPerGroup: 2,
      },
      {
        sourceId: "quote-paragraph",
        report:
          "./bench/fortify-2026-05-16-v24-quote-repair/quote-paragraph-v24-quote-repair.json",
        maxPairsPerGroup: 2,
      },
    ],
    targetCaseIds: ["quote", "quote-paragraph"],
  },
  {
    id: "blind-split",
    headId: "blindSplitV26",
    baseSpec: "./data/training/embedding-training-spec-v13-balanced-triad.json",
    spec: "./data/training/embedding-training-spec-v26-blind-split-repair.json",
    pairs: "./data/training/embedding-training-pairs-v26-blind-split-repair.json",
    baseModel: "./models/learned-hybrid-prototype-v26-blind-split-repair-base.json",
    model: "./models/learned-hybrid-prototype-v26-blind-split-repair-hierarchical-packer-v2.json",
    seed: 67,
    reports: [
      {
        sourceId: "blind-holdout",
        report:
          "./bench/fortify-2026-05-16-v24-quote-repair/blind-holdout-v24-quote-repair.json",
        maxPairsPerGroup: 2,
      },
    ],
    targetCaseIds: ["blind-holdout"],
  },
  {
    id: "stress-split",
    headId: "stressSplitV26",
    baseSpec: "./data/training/embedding-training-spec-v13-balanced-triad.json",
    spec: "./data/training/embedding-training-spec-v26-stress-split-repair.json",
    pairs: "./data/training/embedding-training-pairs-v26-stress-split-repair.json",
    baseModel: "./models/learned-hybrid-prototype-v26-stress-split-repair-base.json",
    model: "./models/learned-hybrid-prototype-v26-stress-split-repair-hierarchical-packer-v2.json",
    seed: 71,
    reports: [
      {
        sourceId: "stress-100",
        report: "./bench/fortify-2026-05-16-v24-quote-repair/stress-100-v24-quote-repair.json",
        maxPairsPerGroup: 2,
      },
    ],
    targetCaseIds: ["stress-100"],
  },
];

export const V26_TARGET_CASES = [
  {
    caseId: "quote",
    input: "./bench/quote-corpus-2026-04-25.txt",
    semantic: "./bench/quote-semantic-2026-04-25.json",
    reportName: "quote-v26-split-ranked.json",
    previousBestMargin: -12.8,
    targetHeadId: "quoteSplitV26",
  },
  {
    caseId: "quote-paragraph",
    input: "./bench/quote-paragraph-corpus-2026-04-25.txt",
    semantic: "./bench/quote-paragraph-semantic-2026-04-25.json",
    reportName: "quote-paragraph-v26-split-ranked.json",
    previousBestMargin: -10.3333,
    targetHeadId: "quoteSplitV26",
  },
  {
    caseId: "blind-holdout",
    input: "./bench/blind-holdout-2026-04-20.txt",
    semantic: "./bench/blind-holdout-semantic-2026-04-20.json",
    reportName: "blind-holdout-v26-split-ranked.json",
    previousBestMargin: -14.6667,
    targetHeadId: "blindSplitV26",
  },
  {
    caseId: "stress-100",
    input: "./bench/stress-100-phrases-2026-04-23.txt",
    semantic: "./bench/stress-100-groups-2026-04-23.json",
    reportName: "stress-100-v26-split-ranked.json",
    previousBestMargin: -24.0667,
    targetHeadId: "stressSplitV26",
  },
];

function caseWithOutput(caseConfig, outputDir) {
  return {
    ...caseConfig,
    reportPath: path.join(outputDir, caseConfig.reportName),
  };
}

export function buildV26SplitHeads({ models = {} } = {}) {
  return [
    ...V23_HEADS,
    {
      id: "quoteRepair",
      model: "./models/learned-hybrid-prototype-v24-quote-repair-hierarchical-packer-v2.json",
    },
    ...V26_SPLIT_PROBES.map((probe) => ({
      id: probe.headId,
      model: models[probe.headId] || models[probe.id] || probe.model,
    })),
  ];
}

export function buildV26SplitHeadArgs({ models, storedHeadCount } = {}) {
  const heads = buildV26SplitHeads({ models });
  const args = [];
  for (const head of heads) {
    args.push("--head", `${head.id}=${head.model}`);
  }
  args.push("--fallback-head", "default");
  args.push("--stored-head-count", String(storedHeadCount || heads.length));
  args.push("--selection-policy", "ranked-accepted-head");
  return args;
}

export function buildV26SplitProbeSuitePlan({ outputDir, models } = {}) {
  if (!outputDir) throw new Error("Missing outputDir");
  const heads = buildV26SplitHeads({ models });
  return {
    splitProbes: V26_SPLIT_PROBES,
    heads,
    storedHeadCount: heads.length,
    headArgs: buildV26SplitHeadArgs({ models, storedHeadCount: heads.length }),
    primaryCases: V23_PRIMARY_CASES.map((item) =>
      caseWithOutput(
        {
          ...item,
          reportName: item.reportName.replace("v23-four-head-ranked", "v26-split-ranked"),
        },
        outputDir
      )
    ),
    targetCases: V26_TARGET_CASES.map((item) => caseWithOutput(item, outputDir)),
  };
}
