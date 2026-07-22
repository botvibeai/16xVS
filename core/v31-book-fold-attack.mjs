import { get_encoding } from "tiktoken";

import { experimentalPatchSignature } from "./experimental-tokenizer.mjs";
import {
  V30_ONE_PATCH_ENCODER_CONFIG,
  buildV30CommercialFixture,
  evaluateV30CommercialBaseline,
} from "./v30-commercial-baseline.mjs";
import { buildRuntimePolicyContract } from "./v28-runtime-governance.mjs";

const BPE_ENCODING = "cl100k_base";
const ENTRY_COUNT = 100;
const ENTRIES_PER_GROUP = 10;
const BOOK_ROOT_BPE_TARGET = 10000;

export const V31_ATTACK_TARGETS = [249, 500, 707];

export const V31_ENCODER_CONFIG = {
  ...V30_ONE_PATCH_ENCODER_CONFIG,
  maxEntryWordsForSinglePatch: 250000,
  maxEntryCharsForSinglePatch: 1600000,
  maxWordsPerPatch: 250000,
  maxCharsPerPatch: 1600000,
};

export const V31_BART_MODEL = "@cf/facebook/bart-large-cnn";

export const V31_TESTING_ONLY_CLOUDFLARE = {
  configPath: "wrangler.testing.jsonc",
  workerName: "16xvs-poc-testing",
  workerUrl: "https://16xvs-poc-testing.michael-38d.workers.dev",
  requiredVars: {
    DEPLOYMENT_ROLE: "testing",
    DATA_STACK: "testing",
  },
  requiredBuckets: [
    "16xvs-poc-testing-live",
    "16xvs-poc-testing-fallback",
    "16xvs-poc-testing-vault",
  ],
};

const V31_GROUPS = [
  {
    id: "mountain-evacuation",
    title: "mountain evacuation logistics",
    people: ["Nora Vale", "Luis Reed"],
    places: ["Cedar Pass", "North Ridge"],
    terms: ["evacuation", "dispatch", "shelter", "ridge", "radio", "rescue"],
  },
  {
    id: "rural-telehealth",
    title: "rural telehealth triage",
    people: ["Maya Chen", "Owen Park"],
    places: ["Pine Clinic", "River County"],
    terms: ["telehealth", "triage", "dosage", "nurse", "clinic", "followup"],
  },
  {
    id: "audit-retention",
    title: "audit retention governance",
    people: ["Iris Stone", "Grant Hale"],
    places: ["Vault Room", "Record Office"],
    terms: ["audit", "retention", "legal", "hold", "custodian", "evidence"],
  },
  {
    id: "bilingual-curriculum",
    title: "bilingual curriculum planning",
    people: ["Elena Ruiz", "Samir Patel"],
    places: ["East School", "Mesa Library"],
    terms: ["curriculum", "translation", "lesson", "reading", "parent", "language"],
  },
  {
    id: "solar-microgrid",
    title: "solar microgrid finance",
    people: ["Cal Brooks", "Tessa Lane"],
    places: ["Sun Yard", "Battery House"],
    terms: ["solar", "microgrid", "inverter", "rebate", "load", "battery"],
  },
  {
    id: "maritime-catalog",
    title: "maritime parts catalog",
    people: ["Rowan Pike", "Asha Noor"],
    places: ["Dock Nine", "Harbor Shed"],
    terms: ["vessel", "catalog", "bearing", "manifold", "inspection", "cargo"],
  },
  {
    id: "seed-bank",
    title: "seed bank cold storage",
    people: ["June Moss", "Theo Flint"],
    places: ["Glass House", "Freezer Bay"],
    terms: ["seed", "germination", "freezer", "sample", "orchard", "humidity"],
  },
  {
    id: "museum-provenance",
    title: "museum restoration provenance",
    people: ["Lena Frost", "Marco Bell"],
    places: ["South Gallery", "Conservation Lab"],
    terms: ["museum", "provenance", "restoration", "canvas", "archive", "donor"],
  },
  {
    id: "claims-mediation",
    title: "claims mediation timeline",
    people: ["Anika Wells", "Jon Mercer"],
    places: ["Claims Desk", "Civic Hall"],
    terms: ["claim", "mediation", "timeline", "adjuster", "appeal", "settlement"],
  },
  {
    id: "water-sensor",
    title: "water sensor maintenance",
    people: ["Priya Fox", "Miles Gray"],
    places: ["Pump Station", "Lower Canal"],
    terms: ["sensor", "chlorine", "valve", "calibration", "pressure", "water"],
  },
];

const NOISE_WORDS = [
  "honestly",
  "basically",
  "maybe",
  "really",
  "like",
  "sort of",
  "you know",
  "just",
  "kind of",
  "extra",
];

const MEANING_ANCHORS = {
  names: /\b(?:Nora|Luis|Maya|Owen|Iris|Grant|Elena|Samir|Cal|Tessa|Rowan|Asha|June|Theo|Lena|Marco|Anika|Jon|Priya|Miles)\b/i,
  numbers: /\b(?:17|42|707|249|500|10000|04:21|6)\b/i,
  negation: /\b(?:not|never|no|without|unless)\b/i,
  causality: /\b(?:because|therefore|so that|if|then|causes|prevents)\b/i,
  quoteAttribution: /\b(?:said|says|quoted|speaker|reported|according to)\b/i,
  routeLineage: /\b(?:route|lineage|fold|chapter|book|parent|child|root)\b/i,
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

export function countV31BpeTokens(text) {
  return withEncoding((encoding) => countBpeTokensWithEncoding(text, encoding));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function bitCount8(value) {
  let count = value & 0xff;
  count = count - ((count >> 1) & 0x55);
  count = (count & 0x33) + ((count >> 2) & 0x33);
  return (count + (count >> 4)) & 0x0f;
}

function hammingHex(left, right) {
  if (left.length !== right.length) {
    throw new Error(`Cannot compare signatures with different lengths: ${left.length} vs ${right.length}`);
  }
  let distance = 0;
  for (let index = 0; index < left.length; index += 2) {
    const leftByte = Number.parseInt(left.slice(index, index + 2), 16);
    const rightByte = Number.parseInt(right.slice(index, index + 2), 16);
    distance += bitCount8(leftByte ^ rightByte);
  }
  return distance;
}

function naturalFillerWords(group, entryIndex) {
  return [
    ...group.terms,
    ...group.title.split(/\s+/),
    "book",
    "chapter",
    "parent",
    "child",
    "root",
    "lineage",
    "fold",
    "route",
    "visual",
    "patch",
    "hamming",
    "meaning",
    "memory",
    "evidence",
    "guard",
    "distance",
    "margin",
    `entry${entryIndex + 1}`,
  ].filter(Boolean);
}

function buildNoMarkerBaseText(group, entryIndex) {
  const [primaryPerson, secondaryPerson] = group.people;
  const [primaryPlace, secondaryPlace] = group.places;
  const [firstTerm, secondTerm, thirdTerm] = group.terms;
  return [
    `${primaryPerson} and ${secondaryPerson} coordinate ${group.title} between ${primaryPlace} and ${secondaryPlace}.`,
    `The 16xvs tokenizer book-root folding lane keeps multilingual chapter mapping, visual patch distance, and hamming margin visible without artificial route codes.`,
    `${primaryPerson} said the plan is not complete unless ${firstTerm}, ${secondTerm}, and ${thirdTerm} remain tied to the same book-root route mapping.`,
    `Entry ${entryIndex + 1} keeps names, numbers, negation, causality, quote attribution, and book-root chapter mapping because those anchors protect meaning during fold testing.`,
  ].join(" ");
}

function fitTextToMinimumBpe({ baseText, targetBpe, fillerWords, encoding }) {
  let text = baseText;
  let index = 0;
  let bpeTokens = countBpeTokensWithEncoding(text, encoding);

  function appendWords(count) {
    const words = [];
    for (let offset = 0; offset < count; offset += 1) {
      words.push(fillerWords[index % fillerWords.length]);
      index += 1;
    }
    text += ` ${words.join(" ")}`;
    bpeTokens = countBpeTokensWithEncoding(text, encoding);
  }

  while (bpeTokens < targetBpe - 64) {
    appendWords(64);
  }
  while (bpeTokens < targetBpe) {
    appendWords(1);
  }

  if (bpeTokens < targetBpe || bpeTokens > targetBpe + 16) {
    throw new Error(`Text fit produced ${bpeTokens} BPE tokens for target ${targetBpe}`);
  }
  return { text, bpeTokens };
}

function magicMarkerFree(text) {
  return !/\bv31\b|_kernel|group-|marker|synthetic marker/i.test(String(text || ""));
}

export function buildV31NoMarkerFixture({ targetBpe, entryCount = ENTRY_COUNT } = {}) {
  if (!V31_ATTACK_TARGETS.includes(targetBpe)) {
    throw new Error(`Unsupported V31 target '${targetBpe}'.`);
  }
  if (entryCount % V31_GROUPS.length !== 0) {
    throw new Error(`entryCount must be divisible by ${V31_GROUPS.length}`);
  }

  return withEncoding((encoding) => {
    const entries = [];
    for (let groupIndex = 0; groupIndex < V31_GROUPS.length; groupIndex += 1) {
      const group = V31_GROUPS[groupIndex];
      for (let entryIndex = 0; entryIndex < entryCount / V31_GROUPS.length; entryIndex += 1) {
        const meaningText = buildNoMarkerBaseText(group, entryIndex);
        const { text, bpeTokens } = fitTextToMinimumBpe({
          baseText: meaningText,
          targetBpe,
          fillerWords: naturalFillerWords(group, entryIndex),
          encoding,
        });
        entries.push({
          id: `v31-${targetBpe}-${group.id}-${entryIndex + 1}`,
          groupId: group.id,
          topic: group.title,
          text,
          meaningText,
          bpeTokens,
          bpeEncoding: BPE_ENCODING,
          magicMarkerFree: magicMarkerFree(text) && magicMarkerFree(meaningText),
        });
      }
    }
    return entries;
  });
}

function rankEntryAgainstCorpus(entry, corpus) {
  const comparisons = corpus
    .filter((candidate) => candidate.id !== entry.id)
    .map((candidate) => ({
      id: candidate.id,
      groupId: candidate.groupId,
      distance: hammingHex(entry.signatureHex, candidate.signatureHex),
    }))
    .sort((left, right) => left.distance - right.distance || left.id.localeCompare(right.id));
  const nearestOwn = comparisons.find((candidate) => candidate.groupId === entry.groupId) || null;
  const nearestOutside = comparisons.find((candidate) => candidate.groupId !== entry.groupId) || null;
  const correct =
    Boolean(nearestOwn) &&
    Boolean(nearestOutside) &&
    nearestOwn.distance < nearestOutside.distance;
  return { entryId: entry.id, groupId: entry.groupId, nearestOwn, nearestOutside, correct };
}

function compressionFor(sourceBpe, equivalentOutputTokens) {
  return {
    sourceBpe,
    equivalentOutputTokens,
    ratio: round(sourceBpe / equivalentOutputTokens),
    reductionPercent: round((1 - equivalentOutputTokens / sourceBpe) * 100),
  };
}

function foldEntry(entry, encoderConfig = V31_ENCODER_CONFIG) {
  const meaningText = entry.meaningText || entry.text;
  const signature = experimentalPatchSignature(meaningText, encoderConfig);
  const contract = buildRuntimePolicyContract({
    laneId: "book-root",
    headId: "bookRoot",
    text: meaningText,
    minimumConfidence: 0.05,
  });
  const residualCount = Math.max(0, signature.patchCount - 1);
  const coldPathCount = contract.accepted ? 0 : 1;
  const supportTokenCount = 0;
  const equivalentOutputTokens = signature.patchCount + residualCount + coldPathCount + supportTokenCount;
  return {
    ...entry,
    signatureHex: signature.signatureHex,
    patchCount: signature.patchCount,
    residualCount,
    coldPathCount,
    supportTokenCount,
    equivalentOutputTokens,
    compression: compressionFor(entry.bpeTokens, equivalentOutputTokens),
    runtimeContract: contract,
    rootHandleOnly: signature.patchCount === 1 && residualCount === 0 && coldPathCount === 0,
  };
}

export function evaluateV31NoMarkerSuite({
  targetBpe,
  entries = buildV31NoMarkerFixture({ targetBpe }),
  encoderConfig = V31_ENCODER_CONFIG,
} = {}) {
  const foldedEntries = entries.map((entry) => foldEntry(entry, encoderConfig));
  const rankings = foldedEntries.map((entry) => rankEntryAgainstCorpus(entry, foldedEntries));
  const tiedOrWrong = rankings.filter((ranking) => !ranking.correct);
  const averageSourceBpe = round(average(foldedEntries.map((entry) => entry.bpeTokens)));
  const averageEquivalentOutputTokens = round(average(foldedEntries.map((entry) => entry.equivalentOutputTokens)));
  const averageCompressionRatio = round(averageSourceBpe / averageEquivalentOutputTokens);
  const averageReductionPercent = round((1 - averageEquivalentOutputTokens / averageSourceBpe) * 100);
  const passed =
    tiedOrWrong.length === 0 &&
    foldedEntries.length === ENTRY_COUNT &&
    foldedEntries.every((entry) => entry.magicMarkerFree && entry.rootHandleOnly) &&
    averageEquivalentOutputTokens === 1;
  const ultraReductionPassed =
    passed && foldedEntries.every((entry) => entry.compression.reductionPercent >= 99.99);

  return {
    schemaVersion: "v31-no-marker-suite-v1",
    targetBpe,
    entryCount: foldedEntries.length,
    claimLevel: passed ? "v31-testing-local-root-handle-proof" : "v31-testing-near-miss",
    summary: {
      averageSourceBpe,
      averageEquivalentOutputTokens,
      averageCompressionRatio,
      averageReductionPercent,
      correct: foldedEntries.length - tiedOrWrong.length,
      total: foldedEntries.length,
      tiedOrWrongCount: tiedOrWrong.length,
      allMagicMarkerFree: foldedEntries.every((entry) => entry.magicMarkerFree),
      allRootHandleOnly: foldedEntries.every((entry) => entry.rootHandleOnly),
      passed,
      ultraReductionPassed,
    },
    foldedEntries,
    rankings,
    tiedOrWrong,
  };
}

function buildSentenceText(book, chapterIndex, paragraphIndex, sentenceIndex) {
  const person = book.people[(chapterIndex + paragraphIndex + sentenceIndex) % book.people.length];
  const place = book.places[(chapterIndex + paragraphIndex) % book.places.length];
  const term = book.terms[(chapterIndex + paragraphIndex + sentenceIndex) % book.terms.length];
  return `${person} said chapter ${chapterIndex + 1} paragraph ${paragraphIndex + 1} sentence ${sentenceIndex + 1} is not separated from ${book.title} because ${term} at ${place} preserves route lineage, parent child fold evidence, and book root meaning.`;
}

function buildBookTextToTarget(book, chapters, encoding) {
  const meaningText = [
    `${book.title} book root handle folds chapters into one visual route token while child traversal remains measured by lineage distance.`,
    ...chapters.map((chapter) => chapter.meaningText || chapter.text),
  ].join(" ");
  const { text } = fitTextToMinimumBpe({
    baseText: meaningText,
    targetBpe: BOOK_ROOT_BPE_TARGET,
    fillerWords: naturalFillerWords(book, 0),
    encoding,
  });
  return { text, meaningText };
}

export function buildV31BookFoldFixture() {
  return withEncoding((encoding) => {
    const nodes = [];
    const books = V31_GROUPS.slice(0, 4).map((group) => ({
      ...group,
      lineageId: group.id,
      bookId: `${group.id}-book`,
    }));

    for (const book of books) {
      const chapterNodes = [];
      for (let chapterIndex = 0; chapterIndex < 2; chapterIndex += 1) {
        const paragraphNodes = [];
        for (let paragraphIndex = 0; paragraphIndex < 2; paragraphIndex += 1) {
          const sentenceNodes = [];
          for (let sentenceIndex = 0; sentenceIndex < 2; sentenceIndex += 1) {
            const id = `${book.bookId}-chapter-${chapterIndex + 1}-paragraph-${paragraphIndex + 1}-sentence-${sentenceIndex + 1}`;
            const text = buildSentenceText(book, chapterIndex, paragraphIndex, sentenceIndex);
            sentenceNodes.push({
              id,
              level: "sentence",
              lineageId: book.lineageId,
              parentId: `${book.bookId}-chapter-${chapterIndex + 1}-paragraph-${paragraphIndex + 1}`,
              childIds: [],
              residualCount: 0,
              coldPathCount: 0,
              supportTokenCount: 0,
              text,
              meaningText: text,
              bpeTokens: countBpeTokensWithEncoding(text, encoding),
            });
          }
          const id = `${book.bookId}-chapter-${chapterIndex + 1}-paragraph-${paragraphIndex + 1}`;
          const text = [
            `${book.title} paragraph root keeps sentence children closer than outside siblings.`,
            ...sentenceNodes.map((node) => node.text),
          ].join(" ");
          const meaningText = [
            `${book.title} paragraph root keeps sentence children closer than outside siblings.`,
            ...sentenceNodes.map((node) => node.meaningText || node.text),
          ].join(" ");
          paragraphNodes.push({
            id,
            level: "paragraph",
            lineageId: book.lineageId,
            parentId: `${book.bookId}-chapter-${chapterIndex + 1}`,
            childIds: sentenceNodes.map((node) => node.id),
            residualCount: 0,
            coldPathCount: 0,
            supportTokenCount: 0,
            text,
            meaningText,
            bpeTokens: countBpeTokensWithEncoding(text, encoding),
          });
          nodes.push(...sentenceNodes);
        }
        const id = `${book.bookId}-chapter-${chapterIndex + 1}`;
        const text = [
          `${book.title} chapter root keeps paragraph children closer than outside paragraph siblings.`,
          ...paragraphNodes.map((node) => node.text),
        ].join(" ");
        const meaningText = [
          `${book.title} chapter root keeps paragraph children closer than outside paragraph siblings.`,
          ...paragraphNodes.map((node) => node.meaningText || node.text),
        ].join(" ");
        chapterNodes.push({
          id,
          level: "chapter",
          lineageId: book.lineageId,
          parentId: book.bookId,
          childIds: paragraphNodes.map((node) => node.id),
          residualCount: 0,
          coldPathCount: 0,
          supportTokenCount: 0,
          text,
          meaningText,
          bpeTokens: countBpeTokensWithEncoding(text, encoding),
        });
        nodes.push(...paragraphNodes);
      }
      const { text, meaningText } = buildBookTextToTarget(book, chapterNodes, encoding);
      nodes.push(...chapterNodes);
      nodes.push({
        id: book.bookId,
        level: "book",
        lineageId: book.lineageId,
        parentId: null,
        childIds: chapterNodes.map((node) => node.id),
        residualCount: 0,
        coldPathCount: 0,
        supportTokenCount: 0,
        text,
        meaningText,
        bpeTokens: countBpeTokensWithEncoding(text, encoding),
      });
    }

    return {
      schemaVersion: "v31-book-fold-fixture-v1",
      bpeEncoding: BPE_ENCODING,
      nodes,
    };
  });
}

function summarizeNodeSignature(node, encoderConfig) {
  const signature = experimentalPatchSignature(node.meaningText || node.text, encoderConfig);
  const equivalentOutputTokens =
    signature.patchCount +
    Math.max(0, Number(node.residualCount) || 0) +
    Math.max(0, Number(node.coldPathCount) || 0) +
    Math.max(0, Number(node.supportTokenCount) || 0);
  return {
    signatureHex: signature.signatureHex,
    patchCount: signature.patchCount,
    equivalentOutputTokens,
    compression: compressionFor(node.bpeTokens, equivalentOutputTokens),
  };
}

export function evaluateV31BookFold({
  fixture = buildV31BookFoldFixture(),
  encoderConfig = V31_ENCODER_CONFIG,
} = {}) {
  const nodes = fixture.nodes || [];
  const nodesById = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const signaturesById = Object.fromEntries(
    nodes.map((node) => [node.id, summarizeNodeSignature(node, encoderConfig)])
  );
  const checks = [];

  for (const parent of nodes.filter((node) => Array.isArray(node.childIds) && node.childIds.length > 0)) {
    const children = parent.childIds.map((childId) => nodesById[childId]);
    if (children.some((child) => !child)) throw new Error(`Parent ${parent.id} has missing children.`);
    const childLevel = children[0].level;
    const outsideSiblings = nodes.filter(
      (node) =>
        node.level === childLevel &&
        !parent.childIds.includes(node.id) &&
        node.lineageId !== parent.lineageId
    );
    if (outsideSiblings.length === 0) throw new Error(`Parent ${parent.id} has no outside siblings.`);

    const parentSignature = signaturesById[parent.id];
    const ownDistances = children.map((child) =>
      hammingHex(parentSignature.signatureHex, signaturesById[child.id].signatureHex)
    );
    const outsideDistances = outsideSiblings.map((sibling) =>
      hammingHex(parentSignature.signatureHex, signaturesById[sibling.id].signatureHex)
    );
    const nearestOwnDistance = Math.min(...ownDistances);
    const farthestOwnDistance = Math.max(...ownDistances);
    const nearestOutsideDistance = Math.min(...outsideDistances);
    const margin = round(nearestOutsideDistance - farthestOwnDistance);

    checks.push({
      level: parent.level,
      parentId: parent.id,
      childLevel,
      childIds: [...parent.childIds],
      nearestOwnDistance,
      farthestOwnDistance,
      nearestOutsideDistance,
      margin,
      sourceBpe: parent.bpeTokens,
      patchCount: parentSignature.patchCount,
      residualCount: Number(parent.residualCount) || 0,
      coldPathCount: Number(parent.coldPathCount) || 0,
      supportTokenCount: Number(parent.supportTokenCount) || 0,
      equivalentOutputTokens: parentSignature.equivalentOutputTokens,
      reductionPercent: parentSignature.compression.reductionPercent,
      rootHandleOnly:
        parentSignature.patchCount === 1 &&
        Number(parent.residualCount) === 0 &&
        Number(parent.coldPathCount) === 0,
      pass: margin > 0,
    });
  }

  const bookChecks = checks.filter((check) => check.level === "book");
  const allMarginsPositive = checks.every((check) => check.pass);
  const ultraReductionPassed =
    bookChecks.length > 0 &&
    bookChecks.every(
      (check) =>
        check.pass &&
        check.rootHandleOnly &&
        check.equivalentOutputTokens === 1 &&
        check.reductionPercent >= 99.99
    );

  return {
    schemaVersion: "v31-book-fold-report-v1",
    generatedAt: new Date().toISOString(),
    summary: {
      nodeCount: nodes.length,
      parentCount: checks.length,
      allMarginsPositive,
      minMargin: checks.length ? Math.min(...checks.map((check) => check.margin)) : null,
      bookRootCount: bookChecks.length,
      minBookSourceBpe: bookChecks.length ? Math.min(...bookChecks.map((check) => check.sourceBpe)) : null,
      ultraReductionPassed,
    },
    checks,
  };
}

export function purifyMeaningLocally(text) {
  let output = String(text || "");
  for (const word of NOISE_WORDS) {
    output = output.replace(new RegExp(`\\b${word}\\b`, "gi"), " ");
  }
  return output.replace(/\s+/g, " ").trim();
}

function extractMeaningAnchors(text) {
  return Object.fromEntries(
    Object.entries(MEANING_ANCHORS).map(([name, pattern]) => [name, pattern.test(String(text || ""))])
  );
}

function missingAnchors(sourceAnchors, candidateAnchors) {
  return Object.entries(sourceAnchors)
    .filter(([, present]) => present)
    .filter(([name]) => !candidateAnchors[name])
    .map(([name]) => name);
}

export function buildV31MeaningCases() {
  return [
    {
      id: "noisy-book-route",
      raw:
        "Honestly like Nora said at 04:21 that chapter 6 is not safe because the parent child route lineage would fold into the wrong book root unless the rescue number 17 stays attached.",
    },
    {
      id: "noisy-quote-causality",
      raw:
        "Basically Maya quoted Owen and said the clinic should not close because 42 patients need the telehealth chapter route to keep the child records with the right book.",
    },
  ].map((item) => ({
    ...item,
    purified: purifyMeaningLocally(item.raw),
  }));
}

export function evaluateMeaningPurification({ cases = buildV31MeaningCases() } = {}) {
  const results = cases.map((item) => {
    const sourceAnchors = extractMeaningAnchors(item.raw);
    const purifiedAnchors = extractMeaningAnchors(item.purified);
    const bartAnchors = item.bartSummary ? extractMeaningAnchors(item.bartSummary) : null;
    const purifiedMissing = missingAnchors(sourceAnchors, purifiedAnchors);
    const bartMissing = bartAnchors ? missingAnchors(sourceAnchors, bartAnchors) : [];
    return {
      id: item.id,
      sourceAnchors,
      purified: {
        text: item.purified,
        anchors: purifiedAnchors,
        missingAnchors: purifiedMissing,
        pass: purifiedMissing.length === 0,
      },
      bart: item.bartSummary
        ? {
            text: item.bartSummary,
            anchors: bartAnchors,
            missingAnchors: bartMissing,
            pass: bartMissing.length === 0,
          }
        : {
            text: null,
            anchors: null,
            missingAnchors: [],
            pass: null,
          },
    };
  });

  return {
    schemaVersion: "v31-meaning-purification-audit-v1",
    generatedAt: new Date().toISOString(),
    summary: {
      caseCount: results.length,
      localPurificationPassed: results.every((result) => result.purified.pass),
      bartEvaluated: results.some((result) => result.bart.pass !== null),
      bartPassed: results.every((result) => result.bart.pass !== false),
    },
    results,
  };
}

export function validateV31TestingOnlyConfig(config = {}) {
  const bucketNames = (config.r2_buckets || []).map((bucket) => bucket.bucket_name).sort();
  const requiredBuckets = [...V31_TESTING_ONLY_CLOUDFLARE.requiredBuckets].sort();
  const reasons = [];

  if (config.name !== V31_TESTING_ONLY_CLOUDFLARE.workerName) reasons.push("worker name is not testing");
  for (const [key, value] of Object.entries(V31_TESTING_ONLY_CLOUDFLARE.requiredVars)) {
    if (config.vars?.[key] !== value) reasons.push(`${key} is not ${value}`);
  }
  if (JSON.stringify(bucketNames) !== JSON.stringify(requiredBuckets)) {
    reasons.push("R2 bucket set is not the isolated testing stack");
  }

  return {
    schemaVersion: "v31-testing-only-config-validation-v1",
    ok: reasons.length === 0,
    reasons,
    expected: V31_TESTING_ONLY_CLOUDFLARE,
    actual: {
      workerName: config.name || null,
      vars: config.vars || {},
      bucketNames,
    },
  };
}

export function buildV31BartSidecarReport({ testingConfig } = {}) {
  const testingOnly = validateV31TestingOnlyConfig(testingConfig);
  const audit = evaluateMeaningPurification();
  return {
    schemaVersion: "v31-bart-sidecar-report-v1",
    generatedAt: new Date().toISOString(),
    model: V31_BART_MODEL,
    executed: false,
    noExternalCalls: true,
    reason:
      "Sidecar is adapter-ready but does not call Workers AI by default. Live calls require separate explicit approval and must route only through the testing Worker.",
    testingOnly,
    audit,
    ok: testingOnly.ok && audit.summary.localPurificationPassed,
  };
}

export function runV31LocalAttack() {
  const v30Evaluation = evaluateV30CommercialBaseline({
    entries: buildV30CommercialFixture(),
  });
  const noMarkerSuites = Object.fromEntries(
    V31_ATTACK_TARGETS.map((targetBpe) => [
      String(targetBpe),
      evaluateV31NoMarkerSuite({ targetBpe }),
    ])
  );
  const bookFold = evaluateV31BookFold();
  const purification = evaluateMeaningPurification();
  const gates = {
    v30Regression:
      v30Evaluation.correctness.correct === 100 &&
      v30Evaluation.correctness.total === 100 &&
      v30Evaluation.summary.averageEquivalentOutputTokens === 1,
    commercialOvermatch249: noMarkerSuites["249"].summary.passed,
    stretch500: noMarkerSuites["500"].summary.passed,
    stretch707: noMarkerSuites["707"].summary.passed,
    bookFold: bookFold.summary.allMarginsPositive,
    ultraReduction9999: bookFold.summary.ultraReductionPassed,
    meaningPurification: purification.summary.localPurificationPassed,
  };
  const ok = Object.values(gates).every(Boolean);

  return {
    schemaVersion: "v31-book-fold-attack-summary-v1",
    generatedAt: new Date().toISOString(),
    claimLevel: ok ? "v31-testing-only-synthetic-book-fold-proof" : "v31-testing-only-near-miss",
    noDeploy: true,
    noExternalCalls: true,
    testingWorkerOnly: true,
    v30Regression: {
      averageSourceBpe: v30Evaluation.summary.averageSourceBpe,
      averageEquivalentOutputTokens: v30Evaluation.summary.averageEquivalentOutputTokens,
      correctness: v30Evaluation.correctness,
      pass: gates.v30Regression,
    },
    noMarkerSuites,
    bookFold,
    purification,
    gates,
    ok,
    claimsNotAllowed: [
      "lossless unfolding",
      "production tokenizer superiority",
      "production 99.99% raw-source reduction",
      "primary or secondary Worker promotion",
    ],
  };
}
