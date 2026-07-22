import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const QUOTE_THEME_GROUPS = [
  {
    id: "quote_theme_discipline_boundary",
    domain: "quote_repair",
    description:
      "Training-only support for discipline/routine aphorisms and short paragraph variants. Avoids old quote holdout lines verbatim.",
    items: [
      "Begin before certainty appears.",
      "Do the unpleasant task early.",
      "Habits carry work through low moods.",
      "Repeated effort beats dramatic intention.",
      "Keep the promise after excitement fades.",
      "Routine turns a hard aim into a normal action that can be repeated.",
      "The first useful hour belongs to deliberate work rather than drift.",
      "A durable practice makes progress less dependent on motivation.",
      "Small disciplined actions keep large work moving when attention weakens.",
      "Consistent effort is the operating system behind finished projects.",
    ],
  },
  {
    id: "quote_theme_truth_boundary",
    domain: "quote_repair",
    description:
      "Training-only support for truth/clarity aphorisms and short paragraph variants.",
    items: [
      "Speak the direct fact.",
      "Honest words remove fog.",
      "Evidence stays useful after pride leaves.",
      "A clear name exposes the real problem.",
      "Numbers resist comfortable memory.",
      "Plain diagnosis prevents expensive confusion later.",
      "A precise sentence can reveal a weak plan quickly.",
      "Facts should be written down before the story gets edited.",
      "Clear language narrows the decision by removing excuses.",
      "Truthful description is the shortest path to a useful choice.",
    ],
  },
  {
    id: "quote_theme_patience_boundary",
    domain: "quote_repair",
    description:
      "Training-only support for patience/timing aphorisms and short paragraph variants.",
    items: [
      "Pause before the costly move.",
      "Delay can protect good judgment.",
      "Haste often creates the second repair.",
      "Time reveals which problem deserves permanence.",
      "Careful pacing keeps pressure from steering.",
      "Waiting for the second effect can make the next action more accurate.",
      "A slow repair may be faster than a rushed failure that returns.",
      "Deliberate attention protects systems when urgency invites shortcuts.",
      "Some weak ideas only become visible after time has tested them.",
      "Patience is not avoidance when it preserves the quality of the decision.",
    ],
  },
  {
    id: "quote_theme_courage_boundary",
    domain: "quote_repair",
    description:
      "Training-only support for courage/risk/action aphorisms and short paragraph variants.",
    items: [
      "Move when the risk becomes real.",
      "Bravery is action after fear speaks.",
      "The first attempt teaches more than hiding.",
      "Difficult conversations are cheaper early.",
      "Choose the mission over comfort.",
      "Courage can be quiet and still carry the decision forward.",
      "Public effort feels uncomfortable before it becomes useful evidence.",
      "The hard call protects the work when comfort asks for delay.",
      "Fear gets smaller only after the first committed step.",
      "Risk matters most when avoiding it would damage the larger purpose.",
    ],
  },
  {
    id: "quote_theme_craft_boundary",
    domain: "quote_repair",
    description:
      "Training-only support for craft/design/quality aphorisms and short paragraph variants.",
    items: [
      "Check the measure before release.",
      "Clean thinking makes reliable systems.",
      "Design proves itself under use.",
      "Quality compounds through correction.",
      "Judgment decides when tools help.",
      "A strong demo matters less than repeated use without failure.",
      "Each careful revision removes an error from the future.",
      "Good systems are built by small corrections that remain in place.",
      "Tools save time only when judgment gives them the right job.",
      "Craft is the habit of making the work survive contact with reality.",
    ],
  },
];

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function parseArgs(argv) {
  const out = {
    baseSpec: path.join(projectRoot, "data", "training", "embedding-training-spec-v13-balanced-triad.json"),
    output: path.join(projectRoot, "data", "training", "embedding-training-spec-v24-quote-repair.json"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-spec" && argv[index + 1]) {
      out.baseSpec = resolveProjectPath(argv[++index]);
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = resolveProjectPath(argv[++index]);
    }
  }

  return out;
}

function buildAllCrossPairs(groupIds) {
  const pairs = [];
  for (let left = 0; left < groupIds.length; left += 1) {
    for (let right = left + 1; right < groupIds.length; right += 1) {
      pairs.push([groupIds[left], groupIds[right]]);
    }
  }
  return pairs;
}

function uniquePairs(pairs) {
  const seen = new Set();
  const output = [];
  for (const pair of pairs) {
    if (!Array.isArray(pair) || pair.length !== 2) continue;
    const key = pair.join("\u0000");
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(pair);
  }
  return output;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseSpec = JSON.parse(await fs.readFile(args.baseSpec, "utf8"));
  const quoteThemeIds = QUOTE_THEME_GROUPS.map((group) => group.id);
  const quoteThemePairs = buildAllCrossPairs(quoteThemeIds);
  const anchorPairs = [
    ["quote_theme_discipline_boundary", "planning_training"],
    ["quote_theme_truth_boundary", "audit_evidence_training"],
    ["quote_theme_patience_boundary", "replication_repair_training"],
    ["quote_theme_courage_boundary", "legal_hold_training"],
    ["quote_theme_craft_boundary", "archive_catalog_training"],
  ];

  const output = {
    ...baseSpec,
    version: 24,
    description:
      "V24 quote repair probe. Starts from v13 balanced-triad and adds training-only quote-theme support for discipline, truth, patience, courage, and craft without including old quote holdout lines verbatim.",
    negativeMode: "explicit",
    negativeSampleLimitPerPair: 12,
    groups: [...(baseSpec.groups || []), ...QUOTE_THEME_GROUPS],
    hardNegativeGroupPairs: uniquePairs([
      ...(baseSpec.hardNegativeGroupPairs || []),
      ...quoteThemePairs,
      ...anchorPairs,
    ]),
    ancestry: {
      ...(baseSpec.ancestry || {}),
      baseSpec: relativeProjectPath(args.baseSpec),
      repairTarget: "quote and quote-paragraph semantic grouping",
      exactHoldoutTextIncludedByNewGroups: false,
    },
    targetedRound: {
      target: "quote and quote-paragraph repair",
      quoteThemeGroups: quoteThemeIds,
      proofBoundary: "specialist repair probe only; not a universal baseline",
    },
  };

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseSpec: relativeProjectPath(args.baseSpec),
        output: relativeProjectPath(args.output),
        groupCount: output.groups.length,
        addedGroups: quoteThemeIds,
        hardNegativeGroupPairCount: output.hardNegativeGroupPairs.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
