import {
  experimentalContinuousEmbedding,
  tokenizeExperimentalVisualPatches,
} from "./experimental-tokenizer.mjs";

function ensureNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function foldText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hashString32(text) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
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

function wordTokens(text) {
  return Array.from(String(text || "").matchAll(/[\p{L}\p{N}]+/gu), (match) => match[0]);
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

function addFeature(featureMap, term, weight) {
  featureMap.set(term, (featureMap.get(term) || 0) + weight);
}

export function extractLearnedFeatures(text) {
  const normalized = normalizeText(text);
  const folded = foldText(normalized);
  const compact = folded.replace(/\s+/g, "");
  const words = wordTokens(folded);
  const featureMap = new Map();

  words.forEach((word) => {
    addFeature(featureMap, `w:${word}`, 2);
    addFeature(featureMap, `wp:${word.slice(0, 3)}`, 1);
    addFeature(featureMap, `ws:${word.slice(-3)}`, 1);
  });

  for (let index = 0; index < words.length - 1; index += 1) {
    addFeature(featureMap, `b:${words[index]}_${words[index + 1]}`, 2);
  }

  for (const gram of charNgrams(compact, 3)) {
    addFeature(featureMap, `c3:${gram}`, 1.5);
  }

  for (const gram of charNgrams(compact, 4)) {
    addFeature(featureMap, `c4:${gram}`, 1);
  }

  const scriptCounts = new Map();
  for (const char of Array.from(normalized)) {
    const bucket = scriptBucket(char);
    scriptCounts.set(bucket, (scriptCounts.get(bucket) || 0) + 1);
  }
  for (const [bucket, count] of scriptCounts.entries()) {
    addFeature(featureMap, `script:${bucket}`, Math.max(1, Math.min(4, count)));
  }

  if (/[0-9]/.test(normalized)) addFeature(featureMap, "shape:has_digit", 1.5);
  if (/[A-Z]/.test(normalized)) addFeature(featureMap, "shape:has_upper", 1);
  if (/[^\p{L}\p{N}\s]/u.test(normalized)) addFeature(featureMap, "shape:has_symbol", 1);
  if (normalized.includes("-")) addFeature(featureMap, "shape:dash", 1);
  if (normalized.includes("_")) addFeature(featureMap, "shape:underscore", 1);
  if (normalized.includes(".")) addFeature(featureMap, "shape:dot", 1);
  if (normalized.includes("/")) addFeature(featureMap, "shape:slash", 1);

  const lengthBucket =
    compact.length <= 12 ? "short" : compact.length <= 28 ? "medium" : "long";
  addFeature(featureMap, `len:${lengthBucket}`, 1);
  addFeature(featureMap, `tokens:${Math.min(words.length, 8)}`, 1);

  return {
    normalized,
    features: Array.from(featureMap.entries()).map(([term, weight]) => ({ term, weight })),
  };
}

function deterministicVector(term, dimensions, seed = 1) {
  const vector = new Float32Array(dimensions);
  for (let index = 0; index < dimensions; index += 1) {
    const hash = hashString32(`seed:${seed}:${term}:${index}`);
    const centered = ((hash % 2001) - 1000) / 1000;
    vector[index] = centered * 0.035;
  }
  return vector;
}

function cloneVector(vector) {
  return Float32Array.from(vector);
}

function ensureFeatureVector(model, term) {
  if (!model.featureVectors[term]) {
    model.featureVectors[term] = Array.from(deterministicVector(term, model.dimensions, model.seed));
  }
  return model.featureVectors[term];
}

function buildRawEmbedding(model, featureList) {
  const raw = new Float32Array(model.dimensions);
  let totalWeight = 0;

  for (const feature of featureList) {
    const vector = ensureFeatureVector(model, feature.term);
    const weight = ensureNumber(feature.weight, 1);
    totalWeight += weight;
    for (let index = 0; index < raw.length; index += 1) {
      raw[index] += vector[index] * weight;
    }
  }

  const scale = totalWeight > 0 ? 1 / Math.sqrt(totalWeight) : 1;
  for (let index = 0; index < raw.length; index += 1) {
    raw[index] *= scale;
  }

  return { raw, totalWeight };
}

function normalizeEmbedding(raw) {
  let sumSquares = 0;
  for (const value of raw) {
    sumSquares += value * value;
  }

  const norm = Math.sqrt(sumSquares);
  if (norm === 0) {
    return {
      normalized: new Float32Array(raw.length),
      norm: 0,
    };
  }

  const normalized = new Float32Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    normalized[index] = raw[index] / norm;
  }

  return { normalized, norm };
}

function blendEmbeddings(parts, dimensions) {
  const mixed = new Float32Array(dimensions);

  for (const part of parts) {
    if (!part || !part.vector) continue;
    const weight = ensureNumber(part.weight, 0);
    if (weight === 0) continue;
    for (let index = 0; index < dimensions; index += 1) {
      mixed[index] += part.vector[index] * weight;
    }
  }

  return mixed;
}

function dot(left, right) {
  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    total += left[index] * right[index];
  }
  return total;
}

function averageVectors(vectors, dimensions) {
  const out = new Float32Array(dimensions);
  if (vectors.length === 0) return out;

  for (const vector of vectors) {
    for (let index = 0; index < dimensions; index += 1) {
      out[index] += vector[index];
    }
  }

  const scale = 1 / vectors.length;
  for (let index = 0; index < dimensions; index += 1) {
    out[index] *= scale;
  }

  return out;
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

function encodeContinuous(model, text) {
  const patchConfig =
    model.patchConfig && typeof model.patchConfig === "object"
      ? model.patchConfig
      : undefined;
  const tokenized = tokenizeExperimentalVisualPatches(text, patchConfig);
  const extracted = extractLearnedFeatures(tokenized.normalized);
  const { raw, totalWeight } = buildRawEmbedding(model, extracted.features);
  const { normalized: learnedNormalized } = normalizeEmbedding(raw);
  const heuristic = experimentalContinuousEmbedding(text, {
    bsqDimensions: model.dimensions,
    ...(patchConfig || {}),
  });
  const mixed = blendEmbeddings(
    [
      { vector: learnedNormalized, weight: model.learnedBlendWeight },
      { vector: heuristic.normalizedVector, weight: model.heuristicBlendWeight },
    ],
    model.dimensions
  );
  const { normalized, norm } = normalizeEmbedding(mixed);

  return {
    ...tokenized,
    normalizedText: tokenized.normalized,
    features: extracted.features,
    featureCount: extracted.features.length,
    totalFeatureWeight: Number(totalWeight.toFixed(6)),
    raw,
    learnedVector: learnedNormalized,
    heuristicVector: heuristic.normalizedVector,
    mixedVector: mixed,
    normalizedVector: normalized,
    embeddingNorm: Number(norm.toFixed(6)),
  };
}

function clipFeatureVector(vector) {
  for (let index = 0; index < vector.length; index += 1) {
    if (vector[index] > 4) vector[index] = 4;
    else if (vector[index] < -4) vector[index] = -4;
  }
}

function applyDirectionalUpdate(model, features, direction, scale) {
  let totalWeight = 0;
  for (const feature of features) {
    totalWeight += ensureNumber(feature.weight, 1);
  }
  const divisor = totalWeight > 0 ? totalWeight : 1;

  for (const feature of features) {
    const vector = ensureFeatureVector(model, feature.term);
    const weight = ensureNumber(feature.weight, 1) / divisor;
    for (let index = 0; index < vector.length; index += 1) {
      vector[index] += direction[index] * scale * weight;
    }
    clipFeatureVector(vector);
  }
}

function createRandom(seedValue) {
  let seed = seedValue >>> 0;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function shufflePairs(pairs, seed) {
  const random = createRandom(seed);
  const out = pairs.slice();
  for (let index = out.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [out[index], out[swapIndex]] = [out[swapIndex], out[index]];
  }
  return out;
}

function buildInitialModel(options = {}) {
  const heuristicBlendWeight = ensureNumber(options.heuristicBlendWeight, 0);
  const learnedBlendWeight = ensureNumber(options.learnedBlendWeight, 1);
  const stage =
    heuristicBlendWeight > 0 ? "learned-hybrid-prototype" : "learned-feature-prototype";

  return {
    kind: "learned-feature-bsq",
    stage,
    dimensions: Math.max(8, Math.trunc(ensureNumber(options.dimensions, 256))),
    seed: Math.trunc(ensureNumber(options.seed, 1)),
    epochs: Math.max(1, Math.trunc(ensureNumber(options.epochs, 24))),
    learningRate: ensureNumber(options.learningRate, 0.05),
    negativeMargin: ensureNumber(options.negativeMargin, 0.15),
    prototypeLearningRate: ensureNumber(options.prototypeLearningRate, 0),
    prototypeNegativeMargin: ensureNumber(options.prototypeNegativeMargin, 0.2),
    prototypeNegativesPerItem: Math.max(1, Math.trunc(ensureNumber(options.prototypeNegativesPerItem, 2))),
    learnedBlendWeight,
    heuristicBlendWeight,
    patchConfig:
      options.patchConfig && typeof options.patchConfig === "object"
        ? { ...options.patchConfig }
        : null,
    featureVectors: {},
    trainingSummary: null,
  };
}

function precomputeFeatureCache(dataset) {
  const cache = new Map();
  const texts = new Set();

  for (const pair of [...(dataset.positives || []), ...(dataset.negatives || [])]) {
    texts.add(pair.left);
    texts.add(pair.right);
  }

  for (const text of texts) {
    cache.set(text, extractLearnedFeatures(text).features);
  }

  return cache;
}

function buildGroupTextMap(dataset) {
  const groupMap = new Map();

  for (const group of dataset.groups || []) {
    groupMap.set(group.id, Array.isArray(group.items) ? group.items.slice() : []);
  }

  for (const pair of dataset.positives || []) {
    if (!groupMap.has(pair.groupId)) {
      groupMap.set(pair.groupId, []);
    }
    const items = groupMap.get(pair.groupId);
    if (!items.includes(pair.left)) items.push(pair.left);
    if (!items.includes(pair.right)) items.push(pair.right);
  }

  return groupMap;
}

function applyPrototypeRegularization(model, dataset, featureCache) {
  if (!(model.prototypeLearningRate > 0)) {
    return;
  }

  const groupTextMap = buildGroupTextMap(dataset);
  if (groupTextMap.size < 2) {
    return;
  }

  const centroids = new Map();
  for (const [groupId, texts] of groupTextMap.entries()) {
    const vectors = texts.map((text) => encodeContinuous(model, text).normalizedVector);
    const centroidRaw = averageVectors(vectors, model.dimensions);
    const { normalized } = normalizeEmbedding(centroidRaw);
    centroids.set(groupId, normalized);
  }

  for (const [groupId, texts] of groupTextMap.entries()) {
    const ownCentroid = centroids.get(groupId);
    const otherCentroids = Array.from(centroids.entries())
      .filter(([otherGroupId]) => otherGroupId !== groupId);

    for (const text of texts) {
      const features = featureCache.get(text);
      if (!features) continue;

      const encoding = encodeContinuous(model, text);
      const ownSimilarity = dot(encoding.normalizedVector, ownCentroid);
      const attractScale =
        model.prototypeLearningRate * Math.max(0, 1 - ownSimilarity);

      if (attractScale > 0) {
        applyDirectionalUpdate(model, features, ownCentroid, attractScale);
      }

      const rankedNegatives = otherCentroids
        .map(([otherGroupId, centroid]) => ({
          otherGroupId,
          centroid,
          similarity: dot(encoding.normalizedVector, centroid),
        }))
        .sort((left, right) => right.similarity - left.similarity)
        .slice(0, model.prototypeNegativesPerItem);

      for (const negative of rankedNegatives) {
        if (negative.similarity <= model.prototypeNegativeMargin) continue;
        const repelScale =
          model.prototypeLearningRate *
          (negative.similarity - model.prototypeNegativeMargin);
        applyDirectionalUpdate(model, features, negative.centroid, -repelScale);
      }
    }
  }
}

export function trainLearnedEncoder(dataset, options = {}) {
  const model = buildInitialModel(options);
  const featureCache = precomputeFeatureCache(dataset);
  const pairs = [
    ...(dataset.positives || []).map((pair) => ({ ...pair, label: "positive" })),
    ...(dataset.negatives || []).map((pair) => ({ ...pair, label: "negative" })),
  ];

  if (pairs.length === 0) {
    throw new Error("Training dataset has no pairs.");
  }

  for (const epoch of Array.from({ length: model.epochs }, (_, index) => index)) {
    const epochPairs = shufflePairs(pairs, model.seed + epoch + 1);

    for (const pair of epochPairs) {
      const leftFeatures = featureCache.get(pair.left);
      const rightFeatures = featureCache.get(pair.right);
      const leftEncoding = encodeContinuous(
        model,
        pair.left
      );
      const rightEncoding = encodeContinuous(
        model,
        pair.right
      );
      const similarity = dot(leftEncoding.normalizedVector, rightEncoding.normalizedVector);

      if (pair.label === "positive") {
        const scale = model.learningRate * Math.max(0, 1 - similarity);
        if (scale === 0) continue;
        applyDirectionalUpdate(model, leftFeatures, rightEncoding.normalizedVector, scale);
        applyDirectionalUpdate(model, rightFeatures, leftEncoding.normalizedVector, scale);
      } else if (similarity > model.negativeMargin) {
        const scale = model.learningRate * (similarity - model.negativeMargin);
        applyDirectionalUpdate(model, leftFeatures, rightEncoding.normalizedVector, -scale);
        applyDirectionalUpdate(model, rightFeatures, leftEncoding.normalizedVector, -scale);
      }
    }

    applyPrototypeRegularization(model, dataset, featureCache);
  }

  const positiveScores = (dataset.positives || []).map((pair) =>
    evaluateModelOnPair(model, pair.left, pair.right).similarity
  );
  const negativeScores = (dataset.negatives || []).map((pair) =>
    evaluateModelOnPair(model, pair.left, pair.right).similarity
  );

  const average = (values) =>
    values.length > 0
      ? Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(6))
      : null;

  model.trainingSummary = {
    positivePairCount: dataset.positives?.length || 0,
    negativePairCount: dataset.negatives?.length || 0,
    averagePositiveSimilarity: average(positiveScores),
    averageNegativeSimilarity: average(negativeScores),
    learnedBlendWeight: model.learnedBlendWeight,
    heuristicBlendWeight: model.heuristicBlendWeight,
    prototypeLearningRate: model.prototypeLearningRate,
    prototypeNegativeMargin: model.prototypeNegativeMargin,
  };

  return model;
}

export function learnedPatchSignature(text, model) {
  const encoding = encodeContinuous(model, text);
  const bytes = signQuantize(encoding.normalizedVector);

  return {
    normalized: encoding.normalizedText,
    patches: encoding.patches,
    patchCount: encoding.patchCount,
    strategy: "learned-feature-bsq-encoder",
    config: { dimensions: model.dimensions },
    bsqDimensions: model.dimensions,
    embeddingNorm: encoding.embeddingNorm,
    signatureHex: bytesToHex(bytes),
    featureCount: encoding.featureCount,
  };
}

export function evaluateModelOnPair(model, leftText, rightText) {
  const left = learnedPatchSignature(leftText, model);
  const right = learnedPatchSignature(rightText, model);
  const leftContinuous = encodeContinuous(model, leftText);
  const rightContinuous = encodeContinuous(model, rightText);

  return {
    similarity: Number(dot(leftContinuous.normalizedVector, rightContinuous.normalizedVector).toFixed(6)),
    left,
    right,
  };
}

export function createLearnedEncoderAdapter(model) {
  const isHybrid = ensureNumber(model.heuristicBlendWeight, 0) > 0;

  return {
    metadata: {
      stage: model.stage || (isHybrid ? "learned-hybrid-prototype" : "learned-feature-prototype"),
      embeddingSource: isHybrid
        ? "learned additive feature vectors trained from positive and hard-negative phrase pairs, blended with the heuristic experimental embedding as a fixed prior"
        : "learned additive feature vectors trained from positive and hard-negative phrase pairs",
      normalization: "unit-length spherical normalization",
      quantization: "sign bit quantization to binary code",
      dimensions: model.dimensions,
      learnedBlendWeight: ensureNumber(model.learnedBlendWeight, 1),
      heuristicBlendWeight: ensureNumber(model.heuristicBlendWeight, 0),
      prototypeLearningRate: ensureNumber(model.prototypeLearningRate, 0),
      prototypeNegativeMargin: ensureNumber(model.prototypeNegativeMargin, 0.2),
      patchConfig:
        model.patchConfig && typeof model.patchConfig === "object"
          ? model.patchConfig
          : null,
      trainingSummary: model.trainingSummary || null,
    },
    caution: isHybrid
      ? "experimentalPatchCount still comes from the current patch packer. This hybrid prototype blends a learned embedding source with the existing heuristic experimental embedding before normalize -> sign, and it remains an experimental core candidate until the frozen holdouts pass."
      : "experimentalPatchCount still comes from the current patch packer. The learned encoder only replaces the continuous embedding source before normalize -> sign, and it remains a prototype until the frozen holdouts pass.",
    signature(text) {
      return learnedPatchSignature(text, model);
    },
  };
}
