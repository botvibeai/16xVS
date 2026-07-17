const DEFAULTS = {
  packingMode: "window",
  maxWordsPerPatch: 3,
  maxCharsPerPatch: 18,
  maxEntryWordsForSinglePatch: 32,
  maxEntryCharsForSinglePatch: 160,
  maxResidualPatches: 2,
  residualMaxWordsPerPatch: 24,
  residualMaxCharsPerPatch: 160,
  macroSketchMaxClauses: 2,
  macroSketchMaxWords: 42,
  macroSketchMaxChars: 260,
  bsqDimensions: 256,
};

const SEMANTIC_ANCHORS = [
  {
    concept: "launch_domain",
    weight: 8,
    aliases: [
      "launch",
      "release",
      "go live",
      "lanzamiento",
      "lancement",
      "startcheckliste",
      "الإطلاق",
      "लॉन्च",
      "发布",
    ],
  },
  {
    concept: "checklist_artifact",
    weight: 7,
    aliases: [
      "checklist",
      "plan",
      "lista",
      "liste",
      "checkliste",
      "清单",
      "चेकलिस्ट",
    ],
  },
  {
    concept: "storage_domain",
    weight: 8,
    aliases: [
      "storage",
      "token",
      "triple",
      "live",
      "durable",
      "repair",
      "degraded",
      "fallback",
      "vault",
      "almacenamiento",
      "stockage",
      "speicher",
      "التخزين",
      "स्टोरेज",
      "存储",
    ],
  },
  {
    concept: "policy_artifact",
    weight: 7,
    aliases: [
      "policy",
      "strategie",
      "strategy",
      "politica",
      "política",
      "politique",
      "richtlinie",
      "سياسة",
      "नीति",
      "策略",
    ],
  },
  {
    concept: "search_domain",
    weight: 8,
    aliases: [
      "search",
      "lookup",
      "retrieval",
      "nearest",
      "exact",
      "hamming",
      "distance",
      "similarity",
      "búsqueda",
      "recherche",
      "suche",
      "بحث",
      "सर्च",
      "搜索",
    ],
  },
  {
    concept: "visual_domain",
    weight: 6,
    aliases: [
      "visual",
      "glyph",
      "visuelle",
      "بصري",
      "विजुअल",
      "视觉",
    ],
  },
  {
    concept: "binary_domain",
    weight: 6,
    aliases: [
      "binary",
      "binaria",
      "binaire",
      "binäre",
      "ثنائي",
      "बाइनरी",
      "二进制",
    ],
  },
  {
    concept: "planning_domain",
    weight: 8,
    aliases: [
      "execution",
      "planning",
      "plan",
      "operational",
      "stateful",
      "memory first",
      "memory",
      "strategy",
    ],
  },
  {
    concept: "finance_domain",
    weight: 8,
    aliases: [
      "cost",
      "control",
      "margin",
      "pricing",
      "optimization",
      "improvement",
    ],
  },
];

function hashStringToByte(text) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function splitClauses(text) {
  return normalizeText(text)
    .split(/(?<=[,;:.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitWords(clause) {
  return clause
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function scriptBucket(char) {
  const code = char.codePointAt(0) || 0;
  if ((code >= 0x0041 && code <= 0x024f) || (code >= 0x1e00 && code <= 0x1eff)) return "latin";
  if (code >= 0x0400 && code <= 0x04ff) return "cyrillic";
  if (code >= 0x0600 && code <= 0x06ff) return "arabic";
  if (code >= 0x0900 && code <= 0x097f) return "devanagari";
  if (code >= 0x4e00 && code <= 0x9fff) return "han";
  if (code >= 0x3040 && code <= 0x30ff) return "kana";
  return "other";
}

function charNgrams(text, size) {
  const chars = Array.from(text);
  if (chars.length < size) return chars.length > 0 ? [chars.join("")] : [];
  const out = [];
  for (let index = 0; index <= chars.length - size; index += 1) {
    out.push(chars.slice(index, index + size).join(""));
  }
  return out;
}

function foldText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function featureTerms(text, patches) {
  const normalizedText = normalizeText(text).toLowerCase();
  const foldedText = foldText(normalizedText);
  const words = splitWords(normalizedText);
  const compact = Array.from(normalizedText.replace(/\s+/g, ""));
  const features = [];
  const anchorCounts = new Map();

  words.forEach((word) => {
    features.push({ term: `w:${word}`, weight: 2 });
    features.push({ term: `wp:${word.slice(0, 3)}`, weight: 1 });
    features.push({ term: `ws:${word.slice(-3)}`, weight: 1 });
  });

  for (let index = 0; index < words.length - 1; index += 1) {
    features.push({ term: `b:${words[index]}_${words[index + 1]}`, weight: 3 });
  }

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    for (let offset = 0; offset <= Math.max(0, word.length - 3); offset += 1) {
      features.push({ term: `g:${word.slice(offset, offset + 3)}`, weight: 2 });
    }
  }

  for (const gram of charNgrams(compact.join(""), 2)) {
    features.push({ term: `c2:${gram}`, weight: 1 });
  }

  for (const gram of charNgrams(compact.join(""), 3)) {
    features.push({ term: `c3:${gram}`, weight: 2 });
  }

  const scriptCounts = new Map();
  compact.forEach((char) => {
    const bucket = scriptBucket(char);
    scriptCounts.set(bucket, (scriptCounts.get(bucket) || 0) + 1);
  });

  for (const [bucket, count] of scriptCounts.entries()) {
    features.push({ term: `script:${bucket}`, weight: Math.max(1, Math.min(6, count)) });
  }

  for (const anchor of SEMANTIC_ANCHORS) {
    for (const alias of anchor.aliases) {
      const foldedAlias = foldText(alias);
      if (foldedAlias && foldedText.includes(foldedAlias)) {
        features.push({ term: `concept:${anchor.concept}`, weight: anchor.weight });
        features.push({ term: `concept-match:${anchor.concept}:${foldedAlias}`, weight: Math.max(2, anchor.weight - 2) });
        anchorCounts.set(anchor.concept, (anchorCounts.get(anchor.concept) || 0) + 1);
      }
    }
  }

  const launchCount = (anchorCounts.get("launch_domain") || 0) + (anchorCounts.get("checklist_artifact") || 0);
  if (launchCount >= 2) {
    features.push({ term: "bundle:launch_workflow", weight: 8 + launchCount * 2 });
  }

  const storageCount = (anchorCounts.get("storage_domain") || 0) + (anchorCounts.get("policy_artifact") || 0);
  if (storageCount >= 2) {
    features.push({ term: "bundle:storage_workflow", weight: 8 + storageCount * 2 });
  }

  const searchCount =
    (anchorCounts.get("search_domain") || 0) +
    (anchorCounts.get("visual_domain") || 0) +
    (anchorCounts.get("binary_domain") || 0);
  if (searchCount >= 2) {
    features.push({ term: "bundle:search_workflow", weight: 8 + searchCount * 2 });
  }

  const planningCount = (anchorCounts.get("planning_domain") || 0) + (anchorCounts.get("checklist_artifact") || 0);
  if (planningCount >= 2) {
    features.push({ term: "bundle:planning_workflow", weight: 6 + planningCount * 2 });
  }

  const financeCount = anchorCounts.get("finance_domain") || 0;
  if (financeCount >= 1) {
    features.push({ term: "bundle:finance_workflow", weight: 6 + financeCount * 3 });
  }

  const primary = choosePrimaryWorkflow(anchorCounts);
  if (primary) {
    features.push({ term: `primary:${primary}`, weight: 36 });
  }

  patches.forEach((patch) => {
    features.push({ term: `p:${patch.toLowerCase()}`, weight: 3 });
  });

  return features;
}

function choosePrimaryWorkflow(anchorCounts) {
  const launch =
    (anchorCounts.get("launch_domain") || 0) +
    (anchorCounts.get("checklist_artifact") || 0);
  const storage =
    (anchorCounts.get("storage_domain") || 0) +
    (anchorCounts.get("policy_artifact") || 0);
  const search =
    (anchorCounts.get("search_domain") || 0) +
    (anchorCounts.get("visual_domain") || 0) +
    (anchorCounts.get("binary_domain") || 0);
  const planning =
    (anchorCounts.get("planning_domain") || 0) +
    (anchorCounts.get("checklist_artifact") || 0);
  const finance = anchorCounts.get("finance_domain") || 0;

  if (finance > 0) return "finance_workflow";
  if (search >= 2) return "search_workflow";
  if (storage >= 2) return "storage_workflow";
  if ((anchorCounts.get("planning_domain") || 0) >= 2) return "planning_workflow";
  if ((anchorCounts.get("planning_domain") || 0) > 0 && (anchorCounts.get("launch_domain") || 0) === 0) {
    return "planning_workflow";
  }
  if ((anchorCounts.get("launch_domain") || 0) > 0) return "launch_workflow";
  if (planning >= 2) return "planning_workflow";
  return null;
}

function buildContinuousEmbedding(features, dimensions) {
  const embedding = new Float32Array(dimensions);

  features.forEach(({ term, weight }) => {
    if (term.startsWith("primary:") || term.startsWith("bundle:")) {
      const lanes = Math.min(48, Math.max(16, Math.floor(dimensions / 4)));
      for (let lane = 0; lane < lanes; lane += 1) {
        const hash = hashStringToByte(`basis:${lane}:${term}`);
        const dimension = hash % dimensions;
        const sign = (hash & 1) === 0 ? -1 : 1;
        embedding[dimension] += sign * weight;
      }
      return;
    }

    const lanes = Math.min(12, Math.max(4, Math.floor(dimensions / 32)));
    for (let lane = 0; lane < lanes; lane += 1) {
      const hash = hashStringToByte(`lane:${lane}:${term}`);
      const dimension = hash % dimensions;
      const sign = ((hash >>> 8) & 1) === 0 ? -1 : 1;
      const magnitude = 1 + (((hash >>> 9) % 1000) / 1000);
      embedding[dimension] += sign * weight * magnitude;
    }
  });

  return embedding;
}

function normalizeEmbedding(embedding) {
  let sumSquares = 0;
  for (const value of embedding) {
    sumSquares += value * value;
  }

  const norm = Math.sqrt(sumSquares);
  if (norm === 0) {
    return {
      normalized: new Float32Array(embedding.length),
      norm: 0,
    };
  }

  const normalized = new Float32Array(embedding.length);
  for (let index = 0; index < embedding.length; index += 1) {
    normalized[index] = embedding[index] / norm;
  }

  return { normalized, norm };
}

function signQuantize(normalized) {
  const bytes = new Uint8Array(Math.ceil(normalized.length / 8));
  for (let index = 0; index < normalized.length; index += 1) {
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    if (normalized[index] >= 0) {
      bytes[byteIndex] |= 1 << bitIndex;
    }
  }
  return bytes;
}

function bytesToHex(bytes) {
  let hex = "";
  for (const value of bytes) {
    hex += value.toString(16).padStart(2, "0");
  }
  return hex;
}

function packClause(words, options) {
  const patches = [];
  let cursor = [];

  for (const word of words) {
    const next = [...cursor, word];
    const nextText = next.join(" ");
    const exceedsWords = next.length > options.maxWordsPerPatch;
    const exceedsChars = nextText.length > options.maxCharsPerPatch;

    if (cursor.length > 0 && (exceedsWords || exceedsChars)) {
      patches.push(cursor.join(" "));
      cursor = [word];
      continue;
    }

    cursor = next;
  }

  if (cursor.length > 0) patches.push(cursor.join(" "));
  return patches;
}

function packWholeEntry(normalized, words, options) {
  const withinWordLimit = words.length <= options.maxEntryWordsForSinglePatch;
  const withinCharLimit = normalized.length <= options.maxEntryCharsForSinglePatch;
  return withinWordLimit && withinCharLimit ? [normalized] : null;
}

function contentWordSet(text) {
  return new Set(
    splitWords(foldText(text)).filter((word) => word.length >= 5)
  );
}

function anchorHitCount(text) {
  const foldedText = foldText(text);
  let hits = 0;
  for (const anchor of SEMANTIC_ANCHORS) {
    for (const alias of anchor.aliases) {
      const foldedAlias = foldText(alias);
      if (foldedAlias && foldedText.includes(foldedAlias)) {
        hits += 1;
      }
    }
  }
  return hits;
}

function contentOverlap(left, right) {
  const leftSet = contentWordSet(left);
  const rightSet = contentWordSet(right);
  if (leftSet.size === 0 && rightSet.size === 0) return 0;

  let intersection = 0;
  for (const word of leftSet) {
    if (rightSet.has(word)) intersection += 1;
  }

  const union = new Set([...leftSet, ...rightSet]).size;
  return union > 0 ? intersection / union : 0;
}

function scoreResidualCandidate(text, options = {}) {
  const words = splitWords(text);
  const uniqueWords = new Set(words.map((word) => word.toLowerCase())).size;
  const anchorBonus = anchorHitCount(text) * 18;
  const contentBonus = contentWordSet(text).size * 2;
  const symbolBonus = /[^a-zA-Z0-9\s]/.test(text) ? 2 : 0;
  const digitBonus = /\d/.test(text) ? 2 : 0;
  const positionBonus = options.position === 0 ? 6 : options.isEdge ? 3 : 0;
  return uniqueWords * 3 + words.length + anchorBonus + contentBonus + symbolBonus + digitBonus + positionBonus;
}

function chooseDiverseCandidates(candidates, limit) {
  const selected = [];
  const pool = candidates.slice();

  while (selected.length < limit && pool.length > 0) {
    pool.sort((left, right) => {
      if (right.adjustedScore !== left.adjustedScore) {
        return right.adjustedScore - left.adjustedScore;
      }
      if (right.text.length !== left.text.length) return right.text.length - left.text.length;
      return left.text.localeCompare(right.text);
    });

    const next = pool.shift();
    selected.push(next);

    for (const candidate of pool) {
      const overlapPenalty = contentOverlap(next.text, candidate.text) * 14;
      candidate.adjustedScore = candidate.baseScore - overlapPenalty;
    }
  }

  return selected;
}

function buildMacroSketch(normalized, clauses, options) {
  const clauseCandidates = clauses
    .map((clause, index) => ({
      text: clause.trim(),
      position: index,
      isEdge: index === 0 || index === clauses.length - 1,
    }))
    .filter((candidate) => candidate.text);

  if (clauseCandidates.length === 0) {
    return { macroPatch: normalized, selectedTexts: [] };
  }

  const ranked = clauseCandidates.map((candidate) => {
    const baseScore = scoreResidualCandidate(candidate.text, candidate);
    return {
      ...candidate,
      baseScore,
      adjustedScore: baseScore,
    };
  });

  const selected = [];
  let totalWords = 0;
  let totalChars = 0;

  for (const candidate of chooseDiverseCandidates(ranked, ranked.length)) {
    const candidateWords = splitWords(candidate.text).length;
    const nextWords = totalWords + candidateWords;
    const nextChars = totalChars + candidate.text.length + (selected.length > 0 ? 1 : 0);
    if (selected.length >= options.macroSketchMaxClauses) continue;
    if (nextWords > options.macroSketchMaxWords) continue;
    if (nextChars > options.macroSketchMaxChars) continue;
    selected.push(candidate.text);
    totalWords = nextWords;
    totalChars = nextChars;
  }

  if (selected.length === 0) {
    return { macroPatch: clauses[0] || normalized, selectedTexts: [] };
  }

  return {
    macroPatch: selected.join(" "),
    selectedTexts: selected,
  };
}

function buildHierarchicalResiduals(normalized, clauses, wholeWords, options) {
  const residualLimit = Math.max(0, Math.trunc(options.maxResidualPatches || 0));
  const { macroPatch, selectedTexts } = buildMacroSketch(normalized, clauses, options);
  if (residualLimit === 0) return [macroPatch];

  const candidates = [];
  const filteredClauses = clauses
    .map((clause) => clause.trim())
    .filter((clause) => clause && clause !== normalized && !selectedTexts.includes(clause));

  if (filteredClauses.length > 1) {
    for (let index = 0; index < filteredClauses.length; index += 1) {
      const clause = filteredClauses[index];
      const candidateMeta = {
        position: index,
        isEdge: index === 0 || index === filteredClauses.length - 1,
      };
      const baseScore = scoreResidualCandidate(clause, candidateMeta);
      candidates.push({
        text: clause,
        baseScore,
        adjustedScore: baseScore,
      });
    }
  } else {
    const windows = packClause(wholeWords, {
      maxWordsPerPatch: options.residualMaxWordsPerPatch,
      maxCharsPerPatch: options.residualMaxCharsPerPatch,
    });

    windows.forEach((window, index) => {
      const baseScore = scoreResidualCandidate(window, {
        position: index,
        isEdge: index === 0 || index === windows.length - 1,
      });
      candidates.push({
        text: window,
        baseScore,
        adjustedScore: baseScore,
      });
    });
  }

  const residuals = chooseDiverseCandidates(candidates, residualLimit).map((candidate) => candidate.text);

  return [macroPatch, ...Array.from(new Set(residuals))];
}

export function tokenizeExperimentalVisualPatches(text, overrides = {}) {
  const options = { ...DEFAULTS, ...overrides };
  const normalized = normalizeText(text);
  if (!normalized) {
    return {
      normalized,
      patches: [],
      patchCount: 0,
      strategy: "experimental-visual-patch-packer",
      config: options,
    };
  }

  const clauses = splitClauses(normalized);
  const wholeWords = splitWords(normalized);
  if (options.packingMode === "entry") {
    const packedEntry = packWholeEntry(normalized, wholeWords, options);
    if (packedEntry) {
      return {
        normalized,
        patches: packedEntry,
        patchCount: packedEntry.length,
        strategy: "experimental-visual-patch-packer",
        config: options,
      };
    }
  }
  if (options.packingMode === "hierarchical") {
    const packedEntry = packWholeEntry(normalized, wholeWords, options);
    const hierarchicalPatches = packedEntry || buildHierarchicalResiduals(normalized, clauses, wholeWords, options);
    return {
      normalized,
      patches: hierarchicalPatches,
      patchCount: hierarchicalPatches.length,
      strategy: "experimental-visual-patch-packer",
      config: options,
    };
  }

  const patches = [];

  for (const clause of clauses) {
    const words = splitWords(clause);
    if (words.length === 0) continue;
    if (options.packingMode === "clause") {
      const packedClause = packWholeEntry(clause, words, {
        ...options,
        maxEntryWordsForSinglePatch: options.maxWordsPerPatch,
        maxEntryCharsForSinglePatch: options.maxCharsPerPatch,
      });
      if (packedClause) {
        patches.push(...packedClause);
        continue;
      }
    }
    patches.push(...packClause(words, options));
  }

  return {
    normalized,
    patches,
    patchCount: patches.length,
    strategy: "experimental-visual-patch-packer",
    config: options,
  };
}

export function experimentalPatchSignature(text, overrides = {}) {
  const tokenized = tokenizeExperimentalVisualPatches(text, overrides);
  const features = featureTerms(tokenized.normalized, tokenized.patches);
  const dimensions = overrides.bsqDimensions || DEFAULTS.bsqDimensions;
  const embedding = buildContinuousEmbedding(features, dimensions);
  const { normalized, norm } = normalizeEmbedding(embedding);
  const bytes = signQuantize(normalized);
  const hex = bytesToHex(bytes);

  return {
    ...tokenized,
    bsqDimensions: dimensions,
    embeddingNorm: Number(norm.toFixed(6)),
    signatureHex: hex,
  };
}

export function experimentalContinuousEmbedding(text, overrides = {}) {
  const tokenized = tokenizeExperimentalVisualPatches(text, overrides);
  const features = featureTerms(tokenized.normalized, tokenized.patches);
  const dimensions = overrides.bsqDimensions || DEFAULTS.bsqDimensions;
  const embedding = buildContinuousEmbedding(features, dimensions);
  const { normalized, norm } = normalizeEmbedding(embedding);

  return {
    ...tokenized,
    features,
    bsqDimensions: dimensions,
    rawEmbedding: embedding,
    normalizedVector: normalized,
    embeddingNorm: Number(norm.toFixed(6)),
  };
}
