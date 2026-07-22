import path from "node:path";

import {
  buildV23HeadArgs,
  V23_HEADS,
  V23_PRIMARY_CASES,
} from "./v23-proof-package.mjs";

export const V25_TARGET_CASES = [
  {
    caseId: "quote",
    input: "./bench/quote-corpus-2026-04-25.txt",
    semantic: "./bench/quote-semantic-2026-04-25.json",
    reportName: "quote-v25-six-head-ranked.json",
    previousBestMargin: -12.8,
  },
  {
    caseId: "quote-paragraph",
    input: "./bench/quote-paragraph-corpus-2026-04-25.txt",
    semantic: "./bench/quote-paragraph-semantic-2026-04-25.json",
    reportName: "quote-paragraph-v25-six-head-ranked.json",
    previousBestMargin: -10.3333,
  },
  {
    caseId: "blind-holdout",
    input: "./bench/blind-holdout-2026-04-20.txt",
    semantic: "./bench/blind-holdout-semantic-2026-04-20.json",
    reportName: "blind-holdout-v25-six-head-ranked.json",
    previousBestMargin: -15.5,
  },
  {
    caseId: "stress-100",
    input: "./bench/stress-100-phrases-2026-04-23.txt",
    semantic: "./bench/stress-100-groups-2026-04-23.json",
    reportName: "stress-100-v25-six-head-ranked.json",
    previousBestMargin: -28.6444,
  },
];

function caseWithOutput(caseConfig, outputDir) {
  return {
    ...caseConfig,
    reportPath: path.join(outputDir, caseConfig.reportName),
  };
}

export function buildV25Heads({
  v25Model = "./models/learned-hybrid-prototype-v25-hard-negative-repair-hierarchical-packer-v2.json",
} = {}) {
  return [
    ...V23_HEADS,
    {
      id: "quoteRepair",
      model: "./models/learned-hybrid-prototype-v24-quote-repair-hierarchical-packer-v2.json",
    },
    {
      id: "quoteRepairV25",
      model: v25Model,
    },
  ];
}

export function buildV25HeadArgs({ v25Model, storedHeadCount = 6 } = {}) {
  const heads = buildV25Heads({ v25Model });
  const args = [];
  for (const head of heads) {
    args.push("--head", `${head.id}=${head.model}`);
  }
  args.push("--fallback-head", "default");
  args.push("--stored-head-count", String(storedHeadCount));
  args.push("--selection-policy", "ranked-accepted-head");
  return args;
}

export function buildV25ProbeSuitePlan({ outputDir, v25Model } = {}) {
  if (!outputDir) throw new Error("Missing outputDir");
  const heads = buildV25Heads({ v25Model });
  return {
    heads,
    storedHeadCount: heads.length,
    headArgs: buildV25HeadArgs({ v25Model, storedHeadCount: heads.length }),
    primaryCases: V23_PRIMARY_CASES.map((item) =>
      caseWithOutput(
        {
          ...item,
          reportName: item.reportName.replace("v23-four-head-ranked", "v25-six-head-ranked"),
        },
        outputDir
      )
    ),
    targetCases: V25_TARGET_CASES.map((item) => caseWithOutput(item, outputDir)),
  };
}
