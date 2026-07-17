import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { get_encoding } from "tiktoken";
import {
  experimentalPatchSignature,
} from "../core/experimental-tokenizer.mjs";
import { assessReportEvidence } from "../core/evidence-assessment.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = {
    input: path.join(projectRoot, "bench", "sample-corpus.txt"),
    output: path.join(projectRoot, "bench", "latest-report.json"),
    limit: null,
    semantic: null,
    perturbation: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input" && argv[index + 1]) {
      out.input = path.resolve(projectRoot, argv[index + 1]);
      index += 1;
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = path.resolve(projectRoot, argv[index + 1]);
      index += 1;
    } else if (arg === "--limit" && argv[index + 1]) {
      const value = Number(argv[index + 1]);
      out.limit = Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : null;
      index += 1;
    } else if (arg === "--semantic" && argv[index + 1]) {
      out.semantic = path.resolve(projectRoot, argv[index + 1]);
      index += 1;
    } else if (arg === "--perturbation" && argv[index + 1]) {
      out.perturbation = path.resolve(projectRoot, argv[index + 1]);
      index += 1;
    }
  }

  return out;
}

function resolveProjectPath(target) {
  if (!target) return null;
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function utf8Bytes(text) {
  return new TextEncoder().encode(text).length;
}

function fixtureGlyphCount(text) {
  return Array.from(text).length;
}

function fixtureBinaryBytes(text) {
  return fixtureGlyphCount(text) * 32;
}

const DEFAULT_ENCODER = {
  metadata: {
    stage: "bsq-style-prototype",
    embeddingSource: "sparse random projection over heuristic lexical, character-ngram, patch, and script features",
    normalization: "unit-length spherical normalization",
    quantization: "sign bit quantization to 256-bit code",
    dimensions: 256,
  },
  caution:
    "fixtureGlyphCount is the current 16xVS POC character-fixture path. experimentalPatchCount is from a separate 16xVS-core candidate, and retrieval now uses a BSQ-style prototype encoder (continuous embedding -> normalize -> sign) rather than the old heuristic signature path. It is still not the final tokenizer. Use this as directional evidence only.",
  signature(text) {
    return experimentalPatchSignature(text);
  },
};

function bitCount4(value) {
  return [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4][value & 0xf];
}

function hammingHex(left, right) {
  const limit = Math.min(left.length, right.length);
  let total = 0;
  for (let index = 0; index < limit; index += 1) {
    const lhs = Number.parseInt(left[index], 16);
    const rhs = Number.parseInt(right[index], 16);
    total += bitCount4(lhs ^ rhs);
  }
  return total;
}

function sampleMetrics(text, encoding, encoder = DEFAULT_ENCODER) {
  const clean = text.trim();
  const codepoints = Array.from(clean).length;
  const words = clean ? clean.split(/\s+/).length : 0;
  const tokens = encoding.encode(clean);
  const tokenCount = tokens.length;
  const sourceBytes = utf8Bytes(clean);
  const glyphCount = fixtureGlyphCount(clean);
  const glyphBytes = fixtureBinaryBytes(clean);
  const signature = encoder.signature(clean);
  const experimentalPatchCount = signature.patchCount;
  const codeBytesPerPatch = Math.ceil((signature.bsqDimensions || 256) / 8);
  const experimentalBinaryBytes = experimentalPatchCount * codeBytesPerPatch;

  return {
    text: clean,
    words,
    codepoints,
    sourceBytes,
    tiktokenCount: tokenCount,
    fixtureGlyphCount: glyphCount,
    fixtureBinaryBytes: glyphBytes,
    experimentalPatchCount,
    experimentalBinaryBytes,
    glyphsPerToken: tokenCount > 0 ? Number((glyphCount / tokenCount).toFixed(4)) : null,
    binaryBytesPerToken: tokenCount > 0 ? Number((glyphBytes / tokenCount).toFixed(4)) : null,
    binaryVsSourceRatio: sourceBytes > 0 ? Number((glyphBytes / sourceBytes).toFixed(4)) : null,
    experimentalPatchesPerToken: tokenCount > 0 ? Number((experimentalPatchCount / tokenCount).toFixed(4)) : null,
    experimentalBinaryBytesPerToken: tokenCount > 0 ? Number((experimentalBinaryBytes / tokenCount).toFixed(4)) : null,
    experimentalBinaryVsSourceRatio: sourceBytes > 0 ? Number((experimentalBinaryBytes / sourceBytes).toFixed(4)) : null,
    experimentalPatches: signature.patches,
    experimentalBsqDimensions: signature.bsqDimensions,
    experimentalEmbeddingNorm: signature.embeddingNorm,
    experimentalSignatureHex: signature.signatureHex,
  };
}

function summarize(samples) {
  const totals = {
    entries: samples.length,
    words: 0,
    codepoints: 0,
    sourceBytes: 0,
    tiktokenCount: 0,
    fixtureGlyphCount: 0,
    fixtureBinaryBytes: 0,
    experimentalPatchCount: 0,
    experimentalBinaryBytes: 0,
  };

  for (const sample of samples) {
    totals.words += sample.words;
    totals.codepoints += sample.codepoints;
    totals.sourceBytes += sample.sourceBytes;
    totals.tiktokenCount += sample.tiktokenCount;
    totals.fixtureGlyphCount += sample.fixtureGlyphCount;
    totals.fixtureBinaryBytes += sample.fixtureBinaryBytes;
    totals.experimentalPatchCount += sample.experimentalPatchCount;
    totals.experimentalBinaryBytes += sample.experimentalBinaryBytes;
  }

  return {
    ...totals,
    avgTiktokenPerEntry: totals.entries ? Number((totals.tiktokenCount / totals.entries).toFixed(4)) : 0,
    avgGlyphsPerEntry: totals.entries ? Number((totals.fixtureGlyphCount / totals.entries).toFixed(4)) : 0,
    avgExperimentalPatchesPerEntry: totals.entries ? Number((totals.experimentalPatchCount / totals.entries).toFixed(4)) : 0,
    glyphsPerToken: totals.tiktokenCount ? Number((totals.fixtureGlyphCount / totals.tiktokenCount).toFixed(4)) : null,
    binaryBytesPerToken: totals.tiktokenCount ? Number((totals.fixtureBinaryBytes / totals.tiktokenCount).toFixed(4)) : null,
    binaryVsSourceRatio: totals.sourceBytes ? Number((totals.fixtureBinaryBytes / totals.sourceBytes).toFixed(4)) : null,
    experimentalPatchesPerToken: totals.tiktokenCount
      ? Number((totals.experimentalPatchCount / totals.tiktokenCount).toFixed(4))
      : null,
    experimentalBinaryBytesPerToken: totals.tiktokenCount
      ? Number((totals.experimentalBinaryBytes / totals.tiktokenCount).toFixed(4))
      : null,
    experimentalBinaryVsSourceRatio: totals.sourceBytes
      ? Number((totals.experimentalBinaryBytes / totals.sourceBytes).toFixed(4))
      : null,
  };
}

function tokenSet(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

function jaccard(left, right) {
  if (left.size === 0 && right.size === 0) return 1;
  let intersection = 0;
  for (const value of left) {
    if (right.has(value)) intersection += 1;
  }
  const union = new Set([...left, ...right]).size;
  return union > 0 ? intersection / union : 0;
}

function semanticDistance(left, right) {
  return Math.abs(left.experimentalPatchCount - right.experimentalPatchCount);
}

function signatureDistance(left, right) {
  return hammingHex(left.experimentalSignatureHex, right.experimentalSignatureHex);
}

function nearestNeighbor(sample, samples) {
  let best = null;
  for (const candidate of samples) {
    if (candidate.text === sample.text) continue;
    const distance = signatureDistance(sample, candidate);
    if (!best || distance < best.signatureDistance) {
      best = {
        text: candidate.text,
        signatureDistance: distance,
        patchDistance: semanticDistance(sample, candidate),
        tokenOverlap: Number(jaccard(tokenSet(sample.text), tokenSet(candidate.text)).toFixed(4)),
      };
    }
  }
  return best;
}

function analyzeSemanticGroups(groups, samplesByText) {
  const reports = [];

  for (const group of groups) {
    const entries = group.items
      .map((item) => samplesByText.get(item))
      .filter(Boolean);
    if (entries.length < 2) continue;

    let intraPairs = 0;
    let intraDistanceTotal = 0;
    let intraSignatureDistanceTotal = 0;
    let intraOverlapTotal = 0;

    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        intraPairs += 1;
        intraDistanceTotal += semanticDistance(entries[i], entries[j]);
        intraSignatureDistanceTotal += signatureDistance(entries[i], entries[j]);
        intraOverlapTotal += jaccard(tokenSet(entries[i].text), tokenSet(entries[j].text));
      }
    }

    reports.push({
      group: group.group,
      size: entries.length,
      avgPatchDistance: intraPairs ? Number((intraDistanceTotal / intraPairs).toFixed(4)) : 0,
      avgSignatureDistance: intraPairs ? Number((intraSignatureDistanceTotal / intraPairs).toFixed(4)) : 0,
      avgTokenOverlap: intraPairs ? Number((intraOverlapTotal / intraPairs).toFixed(4)) : 0,
      entries: entries.map((entry) => ({
        text: entry.text,
        tiktokenCount: entry.tiktokenCount,
        experimentalPatchCount: entry.experimentalPatchCount,
      })),
    });
  }

  return reports;
}

function analyzeSemanticSeparation(groups, samplesByText, samples) {
  const reports = [];
  const labeledTexts = new Set();

  for (const group of groups) {
    for (const item of group.items || []) {
      if (samplesByText.has(item)) labeledTexts.add(item);
    }
  }

  for (const group of groups) {
    const entries = group.items.map((item) => samplesByText.get(item)).filter(Boolean);
    if (entries.length < 2) continue;

    const groupTexts = new Set(entries.map((entry) => entry.text));
    let intraPairs = 0;
    let intraSignatureTotal = 0;
    let nearestOutsideTotal = 0;
    const examples = [];

    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        intraPairs += 1;
        intraSignatureTotal += signatureDistance(entries[i], entries[j]);
      }
    }

    for (const entry of entries) {
      let nearestOutside = null;
      for (const candidate of samples) {
        if (groupTexts.has(candidate.text)) continue;
        if (!labeledTexts.has(candidate.text)) continue;
        const distance = signatureDistance(entry, candidate);
        if (!nearestOutside || distance < nearestOutside.signatureDistance) {
          nearestOutside = {
            text: candidate.text,
            signatureDistance: distance,
          };
        }
      }

      if (nearestOutside) {
        nearestOutsideTotal += nearestOutside.signatureDistance;
        examples.push({
          text: entry.text,
          nearestOutside,
        });
      }
    }

    const avgIntraSignatureDistance = intraPairs ? Number((intraSignatureTotal / intraPairs).toFixed(4)) : 0;
    const avgNearestOutsideSignatureDistance = entries.length
      ? Number((nearestOutsideTotal / entries.length).toFixed(4))
      : 0;

    reports.push({
      group: group.group,
      size: entries.length,
      outsidePool: "labeled-other-groups",
      avgIntraSignatureDistance,
      avgNearestOutsideSignatureDistance,
      separationMargin: Number((avgNearestOutsideSignatureDistance - avgIntraSignatureDistance).toFixed(4)),
      examples,
    });
  }

  return reports;
}

function analyzePerturbations(cases, samplesByText) {
  const reports = [];
  for (const item of cases) {
    const base = samplesByText.get(item.base);
    if (!base) continue;

    const variants = item.variants
      .map((text) => samplesByText.get(text))
      .filter(Boolean)
      .map((variant) => ({
        text: variant.text,
        patchDistance: semanticDistance(base, variant),
        signatureDistance: signatureDistance(base, variant),
        tokenDelta: variant.tiktokenCount - base.tiktokenCount,
        patchDelta: variant.experimentalPatchCount - base.experimentalPatchCount,
        overlap: Number((jaccard(tokenSet(base.text), tokenSet(variant.text))).toFixed(4)),
      }));

    reports.push({
      base: base.text,
      baseTiktokenCount: base.tiktokenCount,
      baseExperimentalPatchCount: base.experimentalPatchCount,
      variants,
    });
  }
  return reports;
}

function analyzeRetrieval(samples) {
  const entries = samples
    .map((sample) => ({
      text: sample.text,
      experimentalPatchCount: sample.experimentalPatchCount,
      nearestNeighbor: nearestNeighbor(sample, samples),
    }))
    .filter((sample) => sample.nearestNeighbor);

  let exactNeighborCount = 0;
  let lowDistanceCount = 0;
  let totalSignatureDistance = 0;
  let totalTokenOverlap = 0;

  for (const entry of entries) {
    const distance = entry.nearestNeighbor.signatureDistance;
    if (distance === 0) exactNeighborCount += 1;
    if (distance <= 8) lowDistanceCount += 1;
    totalSignatureDistance += distance;
    totalTokenOverlap += entry.nearestNeighbor.tokenOverlap;
  }

  return {
    entries: entries.length,
    exactNeighborRate: entries.length ? Number((exactNeighborCount / entries.length).toFixed(4)) : 0,
    lowDistanceRate: entries.length ? Number((lowDistanceCount / entries.length).toFixed(4)) : 0,
    avgNearestSignatureDistance: entries.length ? Number((totalSignatureDistance / entries.length).toFixed(4)) : 0,
    avgNearestTokenOverlap: entries.length ? Number((totalTokenOverlap / entries.length).toFixed(4)) : 0,
    examples: entries.slice(0, 20),
  };
}

export async function runBenchmark(options = {}) {
  const args = {
    ...parseArgs([]),
    ...options,
  };
  const encoder = args.encoder || DEFAULT_ENCODER;

  args.input = resolveProjectPath(args.input);
  args.output = resolveProjectPath(args.output);
  args.semantic = resolveProjectPath(args.semantic);
  args.perturbation = resolveProjectPath(args.perturbation);

  const raw = await fs.readFile(args.input, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const corpus = args.limit ? lines.slice(0, args.limit) : lines;

  const encoding = get_encoding("cl100k_base");
  try {
    const samples = corpus.map((line) => sampleMetrics(line, encoding, encoder));
    const sampleMap = new Map(samples.map((sample) => [sample.text, sample]));
    let semantic = null;
    let perturbation = null;

    if (args.semantic) {
      const semanticRaw = await fs.readFile(args.semantic, "utf8");
      const groups = JSON.parse(semanticRaw);
      semantic = {
        input: path.relative(projectRoot, args.semantic),
        groups: analyzeSemanticGroups(groups, sampleMap),
        separation: analyzeSemanticSeparation(groups, sampleMap, samples),
      };
    }

    if (args.perturbation) {
      const perturbationRaw = await fs.readFile(args.perturbation, "utf8");
      const cases = JSON.parse(perturbationRaw);
      perturbation = {
        input: path.relative(projectRoot, args.perturbation),
        cases: analyzePerturbations(cases, sampleMap),
      };
    }

    const report = {
      generatedAt: new Date().toISOString(),
      input: path.relative(projectRoot, args.input),
      modelEncoding: "cl100k_base",
      experimentalEncoder: {
        ...(encoder.metadata || {}),
        dimensions: samples[0]?.experimentalBsqDimensions || encoder.metadata?.dimensions || 256,
      },
      caution: encoder.caution || DEFAULT_ENCODER.caution,
      summary: summarize(samples),
      semantic,
      perturbation,
      retrieval: analyzeRetrieval(samples),
      samples,
    };
    report.evidenceAssessment = assessReportEvidence(report);

    await fs.mkdir(path.dirname(args.output), { recursive: true });
    await fs.writeFile(args.output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return report;
  } finally {
    encoding.free();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await runBenchmark(args);
  console.log(JSON.stringify({
    ok: true,
    input: report.input,
    output: path.relative(projectRoot, resolveProjectPath(args.output)),
    summary: report.summary,
    semanticGroups: report.semantic?.groups?.length || 0,
    perturbationCases: report.perturbation?.cases?.length || 0,
    retrievalEntries: report.retrieval?.entries || 0,
    caution: report.caution,
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
