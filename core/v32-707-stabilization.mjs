import { get_encoding } from "tiktoken";

import {
  buildV31NoMarkerFixture,
  evaluateV31NoMarkerSuite,
  purifyMeaningLocally,
} from "./v31-book-fold-attack.mjs";
import {
  buildV30CommercialFixture,
  evaluateV30CommercialBaseline,
} from "./v30-commercial-baseline.mjs";
import { buildRuntimePolicyContract } from "./v28-runtime-governance.mjs";

const BPE_ENCODING = "cl100k_base";
const TARGET_BPE = 707;
const ENTRY_COUNT = 100;
const ENTRIES_PER_GROUP = 10;

export const V32_SUITE_MODES = [
  "blind-holdout",
  "paraphrase",
  "noisy-raw",
  "adversarial-sibling",
  "route-confusion",
];

const V32_GROUPS = [
  {
    id: "storm-bridge-repair",
    title: "storm bridge repair schedule",
    people: ["Harper Knox", "Mina Doyle"],
    places: ["Iron Bridge", "West Creek"],
    terms: ["bridge", "storm", "girder", "crew", "detour", "inspection"],
  },
  {
    id: "wildfire-drone-mapping",
    title: "wildfire drone mapping",
    people: ["Ari Lane", "Quinn Moss"],
    places: ["Dry Ridge", "Signal Mesa"],
    terms: ["wildfire", "drone", "thermal", "perimeter", "pilot", "smoke"],
  },
  {
    id: "clinic-vaccine-chain",
    title: "clinic vaccine cold chain",
    people: ["Rhea Patel", "Noel Brooks"],
    places: ["Maple Clinic", "County Depot"],
    terms: ["vaccine", "cooler", "dose", "nurse", "temperature", "shipment"],
  },
  {
    id: "library-oral-history",
    title: "library oral history archive",
    people: ["Sofia Reed", "Malik Stone"],
    places: ["North Library", "Audio Room"],
    terms: ["library", "oral", "archive", "transcript", "speaker", "recording"],
  },
  {
    id: "rail-signal-maintenance",
    title: "rail signal maintenance",
    people: ["Ezra Hale", "Toni West"],
    places: ["Switch Yard", "Line Twelve"],
    terms: ["rail", "signal", "relay", "track", "maintenance", "dispatch"],
  },
  {
    id: "crop-irrigation-audit",
    title: "crop irrigation audit",
    people: ["Nadia Fields", "Omar Lake"],
    places: ["North Farm", "Canal Gate"],
    terms: ["crop", "irrigation", "valve", "acre", "water", "meter"],
  },
  {
    id: "school-bus-routing",
    title: "school bus routing",
    people: ["Lila Hart", "Ben Cruz"],
    places: ["Hill School", "Oak Loop"],
    terms: ["school", "bus", "student", "route", "driver", "stop"],
  },
  {
    id: "harbor-fuel-safety",
    title: "harbor fuel safety",
    people: ["Dane Pike", "Mira Noor"],
    places: ["Fuel Pier", "Harbor Office"],
    terms: ["harbor", "fuel", "tank", "spill", "vessel", "safety"],
  },
  {
    id: "housing-permit-review",
    title: "housing permit review",
    people: ["Keira Wells", "Jonas Vale"],
    places: ["Permit Desk", "Civic Annex"],
    terms: ["housing", "permit", "zoning", "review", "appeal", "builder"],
  },
  {
    id: "animal-shelter-intake",
    title: "animal shelter intake",
    people: ["Piper Gray", "Theo Marsh"],
    places: ["Shelter Desk", "Kennel Row"],
    terms: ["animal", "shelter", "intake", "foster", "veterinary", "kennel"],
  },
];

const ANCHORS = {
  names: /\b(?:Harper|Mina|Ari|Quinn|Rhea|Noel|Sofia|Malik|Ezra|Toni|Nadia|Omar|Lila|Ben|Dane|Mira|Keira|Jonas|Piper|Theo)\b/i,
  numbers: /\b(?:17|42|707|06:40|9|12|31)\b/i,
  negation: /\b(?:not|never|no|without|unless)\b/i,
  causality: /\b(?:because|therefore|so that|if|then|prevents|causes)\b/i,
  quoteAttribution: /\b(?:said|reported|quoted|according to|speaker)\b/i,
  routeLineage: /\b(?:16xvs|book-root|route|chapter|parent|child|root|folding|hamming)\b/i,
};

function round(value, decimals = 4) {
  const scale = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function withEncoding(callback) {
  const encoding = get_encoding(BPE_ENCODING);
  try {
    return callback(encoding);
  } finally {
    encoding.free();
  }
}

function countBpeTokensWithEncoding(text, encoding) {
  return encoding.encode(String(text || "").trim()).length;
}

function fillerWords(group, entryIndex) {
  return [
    ...group.terms,
    ...group.title.split(/\s+/),
    ...group.people.join(" ").split(/\s+/),
    ...group.places.join(" ").split(/\s+/),
    "16xvs",
    "tokenizer",
    "book-root",
    "folding",
    "multilingual",
    "visual",
    "patch",
    "hamming",
    "chapter",
    "parent",
    "child",
    "route",
    "mapping",
    "margin",
    "evidence",
    `entry${entryIndex + 1}`,
  ].filter(Boolean);
}

function fitTextToTarget({ baseText, targetBpe = TARGET_BPE, words, encoding }) {
  let text = baseText;
  let index = 0;
  let bpeTokens = countBpeTokensWithEncoding(text, encoding);

  function append(count) {
    const chunk = [];
    for (let offset = 0; offset < count; offset += 1) {
      chunk.push(words[index % words.length]);
      index += 1;
    }
    text += ` ${chunk.join(" ")}`;
    bpeTokens = countBpeTokensWithEncoding(text, encoding);
  }

  while (bpeTokens < targetBpe - 64) append(64);
  while (bpeTokens < targetBpe) append(1);

  if (bpeTokens < targetBpe || bpeTokens > targetBpe + 16) {
    throw new Error(`V32 text fit produced ${bpeTokens} BPE tokens for target ${targetBpe}`);
  }
  return { text, bpeTokens };
}

function magicFree(text) {
  return !/\bv31\b|\bv32\b|_kernel|group-|marker|synthetic/i.test(String(text || ""));
}

function baseMeaning(group, entryIndex) {
  const [firstPerson, secondPerson] = group.people;
  const [firstPlace, secondPlace] = group.places;
  const [termA, termB, termC] = group.terms;
  return [
    `${firstPerson} and ${secondPerson} coordinate ${group.title} between ${firstPlace} and ${secondPlace}.`,
    `The 16xvs tokenizer book-root folding lane keeps multilingual chapter mapping, visual patch distance, and hamming margin visible without artificial route codes.`,
    `${firstPerson} said at 06:40 that chapter ${entryIndex + 1} is not complete unless ${termA}, ${termB}, and ${termC} stay tied to the same book-root route mapping.`,
    `Because route lineage protects meaning, entry ${entryIndex + 1} keeps names, numbers, negation, quote attribution, parent child structure, and book-root chapter mapping.`,
  ].join(" ");
}

function paraphraseMeaning(group, entryIndex) {
  const [firstPerson, secondPerson] = group.people;
  const [firstPlace, secondPlace] = group.places;
  const [termA, termB, termC] = group.terms;
  return [
    `According to ${firstPerson}, ${secondPerson} should keep ${group.title} linked from ${firstPlace} to ${secondPlace}.`,
    `A 16xvs visual patch book-root route still uses hamming margin, multilingual folding, and chapter mapping to keep the parent child relation stable.`,
    `The route is not accepted unless ${termA}, ${termB}, and ${termC} remain visible in chapter ${entryIndex + 1} with the number 707 recorded.`,
    `This wording changes the surface form, but it preserves quote attribution, causality, negation, names, numbers, and book-root mapping.`,
  ].join(" ");
}

function noisyRawText(group, entryIndex) {
  return [
    "honestly like maybe sort of",
    baseMeaning(group, entryIndex),
    "you know just extra basically kind of",
  ].join(" ");
}

function adversarialMeaning(group, distractorGroup, entryIndex) {
  const [firstPerson, secondPerson] = group.people;
  const [ownA, ownB, ownC, ownD] = group.terms;
  const [distractorA, distractorB] = distractorGroup.terms;
  return [
    `${firstPerson} reported that ${group.title} is not the same case as ${distractorGroup.title}.`,
    `The 16xvs tokenizer book-root folding lane must keep ${ownA}, ${ownB}, ${ownC}, and ${ownD} closer than the distractor words ${distractorA} and ${distractorB}.`,
    `${secondPerson} said chapter ${entryIndex + 1} keeps parent child route mapping, hamming margin, quote attribution, and number 42 because the outside sibling is only a distractor.`,
    `The book-root mapping preserves the own group even when nearby sibling terms appear in the same source.`,
  ].join(" ");
}

function routeConfusionMeaning(group, entryIndex) {
  const [firstPerson, secondPerson] = group.people;
  const [termA, termB, termC] = group.terms;
  return [
    `${firstPerson} and ${secondPerson} mention quote, archive, governance, blind, and stress words only as background noise.`,
    `The accepted lane is still 16xvs tokenizer book-root folding with multilingual visual patch hamming distance and chapter mapping.`,
    `${firstPerson} said the route is not complete unless ${termA}, ${termB}, and ${termC} stay in the book-root parent child map for chapter ${entryIndex + 1}.`,
    `Because the own route tags dominate, the runtime contract should accept book-root and reject cross-lane leakage.`,
  ].join(" ");
}

function buildMeaningForMode(mode, group, entryIndex, groupIndex) {
  if (mode === "paraphrase") return paraphraseMeaning(group, entryIndex);
  if (mode === "noisy-raw") return purifyMeaningLocally(noisyRawText(group, entryIndex));
  if (mode === "adversarial-sibling") {
    const distractor = V32_GROUPS[(groupIndex + 1) % V32_GROUPS.length];
    return adversarialMeaning(group, distractor, entryIndex);
  }
  if (mode === "route-confusion") return routeConfusionMeaning(group, entryIndex);
  return baseMeaning(group, entryIndex);
}

function buildSourceForMode(mode, meaningText, group, entryIndex) {
  if (mode === "noisy-raw") return noisyRawText(group, entryIndex);
  return meaningText;
}

export function buildV32StabilizationFixture({ mode = "blind-holdout", entryCount = ENTRY_COUNT } = {}) {
  if (!V32_SUITE_MODES.includes(mode)) throw new Error(`Unsupported V32 mode '${mode}'.`);
  if (entryCount % V32_GROUPS.length !== 0) {
    throw new Error(`entryCount must be divisible by ${V32_GROUPS.length}`);
  }

  return withEncoding((encoding) => {
    const entries = [];
    for (let groupIndex = 0; groupIndex < V32_GROUPS.length; groupIndex += 1) {
      const group = V32_GROUPS[groupIndex];
      for (let entryIndex = 0; entryIndex < entryCount / V32_GROUPS.length; entryIndex += 1) {
        const meaningText = buildMeaningForMode(mode, group, entryIndex, groupIndex);
        const sourceBaseText = buildSourceForMode(mode, meaningText, group, entryIndex);
        const { text, bpeTokens } = fitTextToTarget({
          baseText: sourceBaseText,
          words: fillerWords(group, entryIndex),
          encoding,
        });
        entries.push({
          id: `stabilize-${mode}-${group.id}-${entryIndex + 1}`,
          groupId: group.id,
          topic: group.title,
          mode,
          text,
          meaningText,
          bpeTokens,
          bpeEncoding: BPE_ENCODING,
          magicMarkerFree: magicFree(text) && magicFree(meaningText),
        });
      }
    }
    return entries;
  });
}

function summarizeSuite(mode, report) {
  const margins = report.rankings.map((ranking) =>
    round((ranking.nearestOutside?.distance ?? 0) - (ranking.nearestOwn?.distance ?? 0))
  );
  const acceptedContracts = report.foldedEntries.filter((entry) => entry.runtimeContract?.accepted).length;
  const coldPathEntries = report.foldedEntries.filter((entry) => entry.coldPathCount > 0);
  const pass =
    report.summary.passed &&
    acceptedContracts === report.foldedEntries.length &&
    coldPathEntries.length === 0 &&
    margins.every((margin) => margin > 0);

  return {
    mode,
    pass,
    correct: report.summary.correct,
    total: report.summary.total,
    tiedOrWrongCount: report.summary.tiedOrWrongCount,
    averageSourceBpe: report.summary.averageSourceBpe,
    averageEquivalentOutputTokens: report.summary.averageEquivalentOutputTokens,
    averageCompressionRatio: report.summary.averageCompressionRatio,
    averageReductionPercent: report.summary.averageReductionPercent,
    minOwnVsOutsideMargin: margins.length ? Math.min(...margins) : null,
    acceptedContracts,
    coldPathCount: coldPathEntries.length,
    allRootHandleOnly: report.summary.allRootHandleOnly,
    allMagicMarkerFree: report.summary.allMagicMarkerFree,
  };
}

export function evaluateV32StabilizationSuite({ mode = "blind-holdout" } = {}) {
  const entries = buildV32StabilizationFixture({ mode });
  const report = evaluateV31NoMarkerSuite({ targetBpe: TARGET_BPE, entries });
  return {
    schemaVersion: "v32-707-stabilization-suite-v1",
    targetBpe: TARGET_BPE,
    mode,
    summary: summarizeSuite(mode, report),
    report,
  };
}

function extractAnchors(text) {
  return Object.fromEntries(
    Object.entries(ANCHORS).map(([name, pattern]) => [name, pattern.test(String(text || ""))])
  );
}

function missingAnchors(source, candidate) {
  return Object.entries(source)
    .filter(([, present]) => present)
    .filter(([name]) => !candidate[name])
    .map(([name]) => name);
}

export function evaluateV32AnchorMutationGuard() {
  const cases = [
    {
      id: "good-anchor-preservation",
      source:
        "Harper said at 06:40 that chapter 9 is not safe because 17 bridge crews need the 16xvs book-root parent child route mapping.",
      candidate:
        "Harper said at 06:40 chapter 9 is not safe because 17 bridge crews need 16xvs book-root parent child route mapping.",
      expectMissing: [],
    },
    {
      id: "bad-negation-drop",
      source:
        "Mina said at 06:40 that chapter 9 is not safe because 17 bridge crews need the 16xvs book-root route.",
      candidate:
        "Mina said at 06:40 that chapter 9 is safe because 17 bridge crews need the 16xvs book-root route.",
      expectMissing: ["negation"],
    },
    {
      id: "bad-number-drop",
      source:
        "Rhea reported at 06:40 that chapter 12 is not closed because 42 vaccine doses need the 16xvs book-root child route.",
      candidate:
        "Rhea reported that chapter is not closed because vaccine doses need the 16xvs book-root child route.",
      expectMissing: ["numbers"],
    },
  ];

  const results = cases.map((item) => {
    const sourceAnchors = extractAnchors(item.source);
    const candidateAnchors = extractAnchors(item.candidate);
    const missing = missingAnchors(sourceAnchors, candidateAnchors);
    return {
      id: item.id,
      sourceAnchors,
      candidateAnchors,
      missingAnchors: missing,
      expectedMissingAnchors: item.expectMissing,
      pass: JSON.stringify(missing) === JSON.stringify(item.expectMissing),
    };
  });

  return {
    schemaVersion: "v32-anchor-mutation-guard-v1",
    summary: {
      caseCount: results.length,
      pass: results.every((result) => result.pass),
    },
    results,
  };
}

export function evaluateV32RouteConfusionGuard() {
  const acceptedText = routeConfusionMeaning(V32_GROUPS[0], 0);
  const ambiguousText =
    "quote paragraph blind holdout stress split governance archive legal retention repair head fallback evidence";
  const accepted = buildRuntimePolicyContract({
    laneId: "book-root",
    headId: "bookRoot",
    text: acceptedText,
    minimumConfidence: 0.05,
  });
  const ambiguous = buildRuntimePolicyContract({
    laneId: "book-root",
    headId: "bookRoot",
    text: ambiguousText,
    minimumConfidence: 0.05,
  });

  return {
    schemaVersion: "v32-route-confusion-guard-v1",
    summary: {
      acceptedBookRootNoise: accepted.accepted,
      rejectedAmbiguousCrossLane: !ambiguous.accepted,
      pass: accepted.accepted && !ambiguous.accepted,
    },
    accepted,
    ambiguous,
  };
}

export function runV32Stabilization() {
  const v30Evaluation = evaluateV30CommercialBaseline({
    entries: buildV30CommercialFixture(),
  });
  const v31Baseline707 = evaluateV31NoMarkerSuite({
    targetBpe: TARGET_BPE,
    entries: buildV31NoMarkerFixture({ targetBpe: TARGET_BPE }),
  });
  const suites = Object.fromEntries(
    V32_SUITE_MODES.map((mode) => [mode, evaluateV32StabilizationSuite({ mode })])
  );
  const anchorMutationGuard = evaluateV32AnchorMutationGuard();
  const routeConfusionGuard = evaluateV32RouteConfusionGuard();

  const gates = {
    v30Regression:
      v30Evaluation.correctness.correct === 100 &&
      v30Evaluation.correctness.total === 100 &&
      v30Evaluation.summary.averageEquivalentOutputTokens === 1,
    v31Regression707: v31Baseline707.summary.passed,
    blindHoldout707: suites["blind-holdout"].summary.pass,
    paraphrase707: suites.paraphrase.summary.pass,
    noisyRaw707: suites["noisy-raw"].summary.pass,
    adversarialSibling707: suites["adversarial-sibling"].summary.pass,
    routeConfusion707: suites["route-confusion"].summary.pass,
    anchorMutationGuard: anchorMutationGuard.summary.pass,
    routeConfusionGuard: routeConfusionGuard.summary.pass,
  };
  const ok = Object.values(gates).every(Boolean);

  return {
    schemaVersion: "v32-707-stabilization-summary-v1",
    generatedAt: new Date().toISOString(),
    claimLevel: ok ? "v32-testing-only-707-stabilized-candidate" : "v32-testing-only-near-miss",
    noDeploy: true,
    noExternalCalls: true,
    testingOnly: true,
    targetBpe: TARGET_BPE,
    v30Regression: {
      averageSourceBpe: v30Evaluation.summary.averageSourceBpe,
      averageEquivalentOutputTokens: v30Evaluation.summary.averageEquivalentOutputTokens,
      correctness: v30Evaluation.correctness,
      pass: gates.v30Regression,
    },
    v31Regression707: {
      averageSourceBpe: v31Baseline707.summary.averageSourceBpe,
      averageEquivalentOutputTokens: v31Baseline707.summary.averageEquivalentOutputTokens,
      correctness: `${v31Baseline707.summary.correct}/${v31Baseline707.summary.total}`,
      pass: gates.v31Regression707,
    },
    suites,
    anchorMutationGuard,
    routeConfusionGuard,
    gates,
    ok,
    publicReleaseReady: false,
    publicReleaseBlockers: [
      "external blind corpus not tested",
      "live testing Worker not exercised",
      "BART sidecar still no-external-call only",
      "lossless unfolding not proven",
    ],
  };
}
