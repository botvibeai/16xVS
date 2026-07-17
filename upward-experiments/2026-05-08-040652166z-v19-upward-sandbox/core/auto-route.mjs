const ROUTE_HEADS = {
  default: "default",
  bookRoot: "bookRoot",
  governance: "governance",
  archive: "governance",
};

const DEFAULT_CONFIDENCE_GUARD = {
  bookRootMinimumAverageWordsPerEntry: 240,
  bookRootMinimumMinWordsPerEntry: 220,
};

const ROUTE_PATTERNS = {
  bookRoot: [
    ["16xvs", 9],
    ["tokenizer", 7],
    ["visual patch", 7],
    ["language should not dictate", 8],
    ["legacy tokenizers", 6],
    ["book-scale", 6],
    ["book scale", 6],
    ["book-root", 8],
    ["book root", 8],
    ["chapter-sized", 5],
    ["chapter-scale", 5],
    ["multilingual equity", 6],
    ["language neutral", 5],
    ["compute cost", 4],
    ["context-window", 4],
    ["hardware-and-edge", 5],
    ["edge-native", 5],
    ["binary code", 3],
    ["hamming comparison", 3],
  ],
  governance: [
    ["retention policy", 8],
    ["retention class", 6],
    ["legal hold", 9],
    ["hold release", 7],
    ["custodians", 5],
    ["audit evidence", 8],
    ["audit packet", 7],
    ["access review", 8],
    ["entitlement review", 7],
    ["deletion exception", 8],
    ["compliance attestation", 8],
    ["governance certification", 7],
    ["certify compliance", 5],
    ["control owners", 5],
    ["preservation notice", 5],
    ["ordinary retention", 4],
  ],
  archive: [
    ["archive catalog", 9],
    ["catalog index", 7],
    ["inventory manifest", 7],
    ["replication", 6],
    ["replica", 5],
    ["repair", 5],
    ["degraded", 5],
    ["shard", 5],
    ["vault", 5],
    ["fallback", 4],
    ["recovery path", 5],
    ["retrieval operations", 8],
    ["search locality", 5],
    ["object count", 5],
    ["fetch fan-out", 6],
    ["long-form archive", 4],
    ["archive pressure", 6],
  ],
};

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function countOccurrences(text, pattern) {
  if (!pattern) return 0;
  let count = 0;
  let index = 0;
  while (index < text.length) {
    const foundAt = text.indexOf(pattern, index);
    if (foundAt === -1) break;
    count += 1;
    index = foundAt + pattern.length;
  }
  return count;
}

function wordCount(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function summarizeCorpusShape(lines = []) {
  const normalizedLines = Array.isArray(lines)
    ? lines.map((line) => String(line || "").trim()).filter(Boolean)
    : String(lines || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
  const wordCounts = normalizedLines.map((line) => wordCount(line));
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
  const entries = normalizedLines.length;

  return {
    entries,
    totalWords,
    averageWordsPerEntry: entries ? Number((totalWords / entries).toFixed(4)) : 0,
    minWordsPerEntry: entries ? Math.min(...wordCounts) : 0,
    maxWordsPerEntry: entries ? Math.max(...wordCounts) : 0,
  };
}

function resolveConfidenceGuard(candidateRouteId, corpusShape, options = {}) {
  const enabled = options.enableConfidenceGuard !== false;
  const thresholds = {
    bookRootMinimumAverageWordsPerEntry: Number.isFinite(
      Number(options.bookRootMinimumAverageWordsPerEntry)
    )
      ? Number(options.bookRootMinimumAverageWordsPerEntry)
      : DEFAULT_CONFIDENCE_GUARD.bookRootMinimumAverageWordsPerEntry,
    bookRootMinimumMinWordsPerEntry: Number.isFinite(
      Number(options.bookRootMinimumMinWordsPerEntry)
    )
      ? Number(options.bookRootMinimumMinWordsPerEntry)
      : DEFAULT_CONFIDENCE_GUARD.bookRootMinimumMinWordsPerEntry,
  };

  if (!enabled || !corpusShape || candidateRouteId !== "bookRoot") {
    return {
      enabled,
      accepted: true,
      reason: enabled ? "no corpus shape guard required" : "confidence guard disabled",
      thresholds,
      corpusShape: corpusShape || null,
    };
  }

  const shapeAccepted =
    corpusShape.averageWordsPerEntry >= thresholds.bookRootMinimumAverageWordsPerEntry &&
    corpusShape.minWordsPerEntry >= thresholds.bookRootMinimumMinWordsPerEntry;

  return {
    enabled,
    accepted: shapeAccepted,
    reason: shapeAccepted
      ? "bookRoot corpus shape passed"
      : "bookRoot corpus shape below folded-entry threshold",
    thresholds,
    corpusShape,
  };
}

export function scoreRouteText(text) {
  const normalized = normalizeText(text);
  const scores = {};

  for (const [routeId, patterns] of Object.entries(ROUTE_PATTERNS)) {
    let total = 0;
    for (const [pattern, weight] of patterns) {
      total += countOccurrences(normalized, pattern) * weight;
    }
    scores[routeId] = total;
  }

  return scores;
}

export function inferRouteIdForText(text, options = {}) {
  const minimumScore = Number.isFinite(Number(options.minimumScore))
    ? Number(options.minimumScore)
    : 6;
  const corpusShape = options.corpusShape || null;
  const scores = scoreRouteText(text);
  const ranked = Object.entries(scores)
    .sort((left, right) => right[1] - left[1])
    .map(([routeId, score]) => ({ routeId, score }));
  const winner = ranked[0] || { routeId: "default", score: 0 };
  const candidateRouteId = winner.score >= minimumScore ? winner.routeId : "default";
  const confidenceGuard = resolveConfidenceGuard(candidateRouteId, corpusShape, options);
  const routeId = confidenceGuard.accepted ? candidateRouteId : "default";

  return {
    routeId,
    candidateRouteId,
    selectedHead: ROUTE_HEADS[routeId] || ROUTE_HEADS.default,
    scores,
    ranked,
    minimumScore,
    confidenceGuard,
  };
}

export function inferRouteIdForCorpus(lines = [], options = {}) {
  const normalizedLines = Array.isArray(lines)
    ? lines.map((line) => String(line || "").trim()).filter(Boolean)
    : String(lines || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
  const joined = normalizedLines.join("\n");
  return inferRouteIdForText(joined, {
    ...options,
    corpusShape: summarizeCorpusShape(normalizedLines),
  });
}
