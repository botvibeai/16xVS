import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildV33MixedCorpus,
  buildV33MutationSwarm,
  buildV33RouteNoiseSurge,
} from "../core/v33-707-hammer.mjs";
import { buildV32StabilizationFixture } from "../core/v32-707-stabilization.mjs";
import { countV31BpeTokens } from "../core/v31-book-fold-attack.mjs";

const DEFAULT_WORKER_URL = "https://16xvs-poc-testing.michael-38d.workers.dev";
const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_TARGET_COUNT = 1000;
const TARGET_BPE = 707;

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function outputDirForToday(profile) {
  const date = new Date().toISOString().slice(0, 10);
  const suffix = profile === "language-equity" ? "v33-testing-worker-language-equity" : "v33-testing-worker-1000";
  return path.join("bench", `fortify-${date}-${suffix}`);
}

function assertTestingWorkerUrl(value) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  const forbiddenHosts = new Set(["16xvs.com", "www.16xvs.com"]);
  if (url.protocol !== "https:") throw new Error("Testing Worker URL must use https.");
  if (forbiddenHosts.has(host)) throw new Error("Refusing to run V33 Worker hammer against a production domain.");
  if (!host.startsWith("16xvs-poc-testing.")) {
    throw new Error(`Refusing non-testing Worker host: ${host}`);
  }
  if (host.includes("secondary")) throw new Error("Refusing secondary Worker host.");
  return url;
}

function rotateSentences(text, index) {
  const sentences = String(text || "")
    .split(/(?<=\.)\s+/)
    .filter(Boolean);
  if (sentences.length <= 1) return text;
  const pivot = index % sentences.length;
  return [...sentences.slice(pivot), ...sentences.slice(0, pivot)].join(" ");
}

function buildPunctuationJitter() {
  return buildV32StabilizationFixture({ mode: "paraphrase" }).map((entry, index) => ({
    ...entry,
    id: `worker-punctuation-${entry.id}`,
    mode: "worker-punctuation-jitter",
    meaningText: rotateSentences(entry.meaningText, index)
      .replace(/\broute\b/gi, "route")
      .replace(/\bmapping\b/gi, "mapping."),
  }));
}

function buildMultilingualAnchors() {
  const additions = [
    { languageProbe: "hindi", text: "Hindi note: अर्थ वही रहता है, route lineage and book-root mapping stay visible." },
    { languageProbe: "russian", text: "Russian note: смысл сохраняется, route lineage and book-root mapping stay visible." },
    { languageProbe: "arabic", text: "Arabic note: المعنى محفوظ، route lineage and book-root mapping stay visible." },
    { languageProbe: "japanese", text: "Japanese note: 意味は保持される, route lineage and book-root mapping stay visible." },
  ];
  return buildV32StabilizationFixture({ mode: "blind-holdout" }).map((entry, index) => ({
    ...entry,
    id: `worker-multilingual-${entry.id}`,
    mode: "worker-multilingual-anchor",
    languageProbe: additions[index % additions.length].languageProbe,
    meaningText: `${entry.meaningText} ${additions[index % additions.length].text}`,
  }));
}

function buildCausalNegationShuffle() {
  return buildV32StabilizationFixture({ mode: "adversarial-sibling" }).map((entry, index) => ({
    ...entry,
    id: `worker-causal-${entry.id}`,
    mode: "worker-causal-negation-shuffle",
    meaningText: [
      "This is not a quote-repair lane, not a governance lane, and not a stress lane.",
      rotateSentences(entry.meaningText, index),
      "Because the same own group names, numbers, and book-root route terms remain present, the nearest outside sibling should not tie or win.",
    ].join(" "),
  }));
}

export function buildV33TestingWorkerThousandEntries() {
  const entries = [
    ...buildV33MixedCorpus(),
    ...buildV33MutationSwarm(),
    ...buildV33RouteNoiseSurge(),
    ...buildPunctuationJitter(),
    ...buildMultilingualAnchors(),
    ...buildCausalNegationShuffle(),
  ];
  return entries.slice(0, DEFAULT_TARGET_COUNT).map((entry, index) => ({
    id: entry.id || `worker-entry-${index + 1}`,
    groupId: entry.groupId,
    topic: entry.topic,
    mode: entry.mode,
    text: entry.text,
    meaningText: entry.meaningText,
    bpeTokens: entry.bpeTokens,
    bpeEncoding: entry.bpeEncoding,
    magicMarkerFree: entry.magicMarkerFree,
    languageProbe: entry.languageProbe || "english-control",
  }));
}

function languageProbeText(languageProbe) {
  if (languageProbe === "hindi") {
    return "Hindi route note: अर्थ वही रहता है। नाम, संख्या, नकार, कारण, quote attribution, और book-root lineage सुरक्षित रहते हैं।";
  }
  if (languageProbe === "russian") {
    return "Russian route note: смысл сохраняется. Имена, числа, отрицание, причина, quote attribution, and book-root lineage stay protected.";
  }
  if (languageProbe === "arabic") {
    return "Arabic route note: المعنى محفوظ. الأسماء والأرقام والنفي والسبب وquote attribution وbook-root lineage تبقى محمية.";
  }
  return "English route note: meaning stays stable; names, numbers, negation, causality, quote attribution, and book-root lineage remain protected.";
}

function baseLanguageEquityPool() {
  return [
    ...buildV32StabilizationFixture({ mode: "blind-holdout" }),
    ...buildV32StabilizationFixture({ mode: "paraphrase" }),
    ...buildV32StabilizationFixture({ mode: "adversarial-sibling" }),
  ];
}

export function buildV33TestingWorkerLanguageEquityEntries() {
  const basePool = baseLanguageEquityPool();
  const languages = ["english-control", "hindi", "russian", "arabic"];
  const entries = [];
  for (const languageProbe of languages) {
    for (let index = 0; index < 250; index += 1) {
      const base = basePool[index % basePool.length];
      const note = languageProbeText(languageProbe);
      const meaningText = `${base.meaningText} ${note}`;
      const text = `${base.text} ${note}`;
      entries.push({
        id: `equity-${languageProbe}-${String(index + 1).padStart(3, "0")}-${base.id}`,
        groupId: base.groupId,
        topic: base.topic,
        mode: `language-equity-${languageProbe}`,
        text,
        meaningText,
        bpeTokens: countV31BpeTokens(text),
        bpeEncoding: base.bpeEncoding,
        magicMarkerFree: base.magicMarkerFree,
        languageProbe,
      });
    }
  }
  return entries;
}

function bitCount8(value) {
  let count = value & 0xff;
  count = count - ((count >> 1) & 0x55);
  count = (count & 0x33) + ((count >> 2) & 0x33);
  return (count + (count >> 4)) & 0x0f;
}

function hammingHex(left, right) {
  if (left.length !== right.length) throw new Error("Cannot compare mismatched signatures.");
  let distance = 0;
  for (let index = 0; index < left.length; index += 2) {
    const leftByte = Number.parseInt(left.slice(index, index + 2), 16);
    const rightByte = Number.parseInt(right.slice(index, index + 2), 16);
    distance += bitCount8(leftByte ^ rightByte);
  }
  return distance;
}

function round(value, decimals = 4) {
  const scale = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function nearestFor(entry, candidates, sameGroup) {
  return candidates
    .filter((candidate) => candidate.id !== entry.id)
    .filter((candidate) => (sameGroup ? candidate.groupId === entry.groupId : candidate.groupId !== entry.groupId))
    .map((candidate) => ({
      entryId: candidate.id,
      groupId: candidate.groupId,
      mode: candidate.mode,
      distance: hammingHex(entry.signatureHex, candidate.signatureHex),
    }))
    .sort((left, right) => left.distance - right.distance || left.entryId.localeCompare(right.entryId))[0] || null;
}

function rankGlobally(foldedEntries) {
  return foldedEntries.map((entry) => {
    const nearestOwn = nearestFor(entry, foldedEntries, true);
    const nearestOutside = nearestFor(entry, foldedEntries, false);
    const correct = Boolean(nearestOwn) && Boolean(nearestOutside) && nearestOwn.distance < nearestOutside.distance;
    return {
      entryId: entry.id,
      groupId: entry.groupId,
      mode: entry.mode,
      nearestOwn,
      nearestOutside,
      margin:
        nearestOwn && nearestOutside ? round(nearestOutside.distance - nearestOwn.distance) : null,
      correct,
    };
  });
}

function summarizeGlobal({ batches, foldedEntries, rankings, workerUrl }) {
  const tiedOrWrong = rankings.filter((ranking) => !ranking.correct);
  const batchFailures = batches.filter((batch) => !batch.ok);
  const averageSourceBpe = round(
    foldedEntries.reduce((sum, entry) => sum + entry.bpeTokens, 0) / foldedEntries.length
  );
  const averageEquivalentOutputTokens = round(
    foldedEntries.reduce((sum, entry) => sum + entry.equivalentOutputTokens, 0) / foldedEntries.length
  );
  const margins = rankings
    .map((ranking) => ranking.margin)
    .filter((value) => typeof value === "number");
  const pass =
    foldedEntries.length === DEFAULT_TARGET_COUNT &&
    batchFailures.length === 0 &&
    tiedOrWrong.length === 0 &&
    averageEquivalentOutputTokens === 1 &&
    foldedEntries.every((entry) => entry.rootHandleOnly && entry.magicMarkerFree) &&
    foldedEntries.every((entry) => entry.runtimeContract?.accepted) &&
    margins.every((margin) => margin > 0);

  const byId = new Map(foldedEntries.map((entry) => [entry.id, entry]));
  const languageProbeSummary = {};
  for (const ranking of rankings) {
    const entry = byId.get(ranking.entryId);
    const probe = entry?.languageProbe || "english-control";
    if (!languageProbeSummary[probe]) {
      languageProbeSummary[probe] = {
        total: 0,
        correct: 0,
        tiedOrWrongCount: 0,
        coldPathCount: 0,
        residualCount: 0,
        minOwnVsOutsideMargin: null,
      };
    }
    const summary = languageProbeSummary[probe];
    summary.total += 1;
    if (ranking.correct) summary.correct += 1;
    else summary.tiedOrWrongCount += 1;
    summary.coldPathCount += entry?.coldPathCount || 0;
    summary.residualCount += entry?.residualCount || 0;
    if (typeof ranking.margin === "number") {
      summary.minOwnVsOutsideMargin =
        summary.minOwnVsOutsideMargin === null
          ? ranking.margin
          : Math.min(summary.minOwnVsOutsideMargin, ranking.margin);
    }
  }
  for (const summary of Object.values(languageProbeSummary)) {
    summary.pass =
      summary.total > 0 &&
      summary.correct === summary.total &&
      summary.tiedOrWrongCount === 0 &&
      summary.coldPathCount === 0 &&
      summary.residualCount === 0 &&
      typeof summary.minOwnVsOutsideMargin === "number" &&
      summary.minOwnVsOutsideMargin > 0;
  }

  return {
    schemaVersion: "v33-testing-worker-1000-summary-v1",
    generatedAt: new Date().toISOString(),
    claimLevel: pass ? "v33-testing-worker-707-1000-pass" : "v33-testing-worker-707-1000-near-miss",
    pass,
    testingWorkerOnly: true,
    noPrimarySecondary: true,
    noRawPromptStoredInReport: true,
    workerUrl,
    targetBpe: TARGET_BPE,
    requestedRuns: DEFAULT_TARGET_COUNT,
    completedRuns: foldedEntries.length,
    batchCount: batches.length,
    batchFailures: batchFailures.map((batch) => batch.batchId),
    correct: foldedEntries.length - tiedOrWrong.length,
    total: foldedEntries.length,
    tiedOrWrongCount: tiedOrWrong.length,
    coldPathCount: foldedEntries.filter((entry) => entry.coldPathCount > 0).length,
    residualCount: foldedEntries.filter((entry) => entry.residualCount > 0).length,
    averageSourceBpe,
    averageEquivalentOutputTokens,
    averageCompressionRatio: round(averageSourceBpe / averageEquivalentOutputTokens),
    averageReductionPercent: round((1 - averageEquivalentOutputTokens / averageSourceBpe) * 100),
    minOwnVsOutsideMargin: margins.length ? Math.min(...margins) : null,
    languageProbeSummary,
    modes: [...new Set(foldedEntries.map((entry) => entry.mode))].sort(),
  };
}

function readme(summary) {
  return `# V33 Testing Worker 707x1000 Hammer

Generated: ${summary.generatedAt}

Claim level: \`${summary.claimLevel}\`

This suite ran through the isolated testing Worker endpoint only. It rejects production domains, primary Workers, secondary Workers, and non-testing hosts.

## Result

- Pass: \`${summary.pass}\`
- Worker: \`${summary.workerUrl}\`
- Completed runs: \`${summary.completedRuns}/${summary.requestedRuns}\`
- Correct global ranking: \`${summary.correct}/${summary.total}\`
- Tied or wrong: \`${summary.tiedOrWrongCount}\`
- Average source BPE: \`${summary.averageSourceBpe}\`
- Average equivalent 16xVS tokens: \`${summary.averageEquivalentOutputTokens}\`
- Average compression ratio: \`${summary.averageCompressionRatio}x\`
- Average reduction: \`${summary.averageReductionPercent}%\`
- Minimum global own-vs-outside margin: \`${summary.minOwnVsOutsideMargin}\`
- Cold-path count: \`${summary.coldPathCount}\`
- Residual count: \`${summary.residualCount}\`

## Language Probe Breakout

${Object.entries(summary.languageProbeSummary)
  .map(
    ([language, item]) =>
      `- ${language}: \`${item.correct}/${item.total}\`, min margin \`${item.minOwnVsOutsideMargin}\`, pass \`${item.pass}\``
  )
  .join("\n")}

## Modes

${summary.modes.map((mode) => `- ${mode}`).join("\n")}

## Boundary

This is still a testing-only 707 root-handle hammer. It does not prove broad tokenizer replacement, lossless unfolding, or book-to-one-token public claims.
`;
}

async function postBatch({ endpoint, suiteId, batchId, entries }) {
  const started = performance.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ suiteId, batchId, entries }),
  });
  const elapsedMs = round(performance.now() - started);
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.ok) {
    return {
      ok: false,
      batchId,
      status: response.status,
      elapsedMs,
      error: body?.error || { message: "Worker batch failed." },
      body,
    };
  }
  return {
    ok: true,
    batchId,
    status: response.status,
    elapsedMs,
    summary: body.summary,
    foldedEntries: body.foldedEntries,
    rankings: body.rankings,
  };
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const workerUrl = assertTestingWorkerUrl(argValue("base-url", DEFAULT_WORKER_URL)).toString().replace(/\/$/, "");
  const batchSize = Number(argValue("batch-size", DEFAULT_BATCH_SIZE));
  const targetCount = Number(argValue("target-count", DEFAULT_TARGET_COUNT));
  const profile = argValue("profile", "mixed-1000");
  if (!Number.isInteger(batchSize) || batchSize <= 0 || batchSize > DEFAULT_BATCH_SIZE) {
    throw new Error(`Batch size must be between 1 and ${DEFAULT_BATCH_SIZE}.`);
  }
  if (targetCount !== DEFAULT_TARGET_COUNT) {
    throw new Error(`This hammer is locked to exactly ${DEFAULT_TARGET_COUNT} runs.`);
  }
  if (!["mixed-1000", "language-equity"].includes(profile)) {
    throw new Error(`Unsupported profile '${profile}'.`);
  }

  const endpoint = `${workerUrl}/api/testing/v33-707-batch`;
  const entries =
    profile === "language-equity"
      ? buildV33TestingWorkerLanguageEquityEntries()
      : buildV33TestingWorkerThousandEntries();
  if (entries.length !== DEFAULT_TARGET_COUNT) {
    throw new Error(`Expected ${DEFAULT_TARGET_COUNT} generated entries, got ${entries.length}.`);
  }

  const suiteId = `v33-testing-worker-${profile}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const batches = [];
  for (let offset = 0; offset < entries.length; offset += batchSize) {
    const batchEntries = entries.slice(offset, offset + batchSize);
    const batchNumber = Math.floor(offset / batchSize) + 1;
    const batchId = `batch-${String(batchNumber).padStart(2, "0")}`;
    const result = await postBatch({ endpoint, suiteId, batchId, entries: batchEntries });
    batches.push(result);
    console.log(
      JSON.stringify({
        batchId,
        ok: result.ok,
        status: result.status,
        elapsedMs: result.elapsedMs,
        correct: result.summary?.correct,
        total: result.summary?.total,
        minOwnVsOutsideMargin: result.summary?.minOwnVsOutsideMargin,
      })
    );
    if (!result.ok) break;
  }

  const foldedEntries = batches.flatMap((batch) => batch.foldedEntries || []);
  const rankings = rankGlobally(foldedEntries);
  const summary = summarizeGlobal({ batches, foldedEntries, rankings, workerUrl });
  const outputDir = outputDirForToday(profile);
  await mkdir(outputDir, { recursive: true });
  await writeJson(path.join(outputDir, "summary.json"), summary);
  await writeJson(
    path.join(outputDir, "batches.json"),
    batches.map((batch) => ({
      ok: batch.ok,
      batchId: batch.batchId,
      status: batch.status,
      elapsedMs: batch.elapsedMs,
      summary: batch.summary,
      error: batch.error,
    }))
  );
  await writeJson(path.join(outputDir, "global-ranking.json"), rankings);
  await writeJson(
    path.join(outputDir, "folded-entry-manifest.json"),
    foldedEntries.map((entry) => ({
      id: entry.id,
      groupId: entry.groupId,
      mode: entry.mode,
      languageProbe: entry.languageProbe || "english-control",
      bpeTokens: entry.bpeTokens,
      signatureHex: entry.signatureHex,
      patchCount: entry.patchCount,
      equivalentOutputTokens: entry.equivalentOutputTokens,
      rootHandleOnly: entry.rootHandleOnly,
      magicMarkerFree: entry.magicMarkerFree,
      runtimeAccepted: entry.runtimeContract?.accepted,
    }))
  );
  await writeFile(path.join(outputDir, "README.md"), readme(summary), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: summary.pass,
        claimLevel: summary.claimLevel,
        outputDir,
        summary: path.join(outputDir, "summary.json"),
        completedRuns: summary.completedRuns,
        correct: `${summary.correct}/${summary.total}`,
        minOwnVsOutsideMargin: summary.minOwnVsOutsideMargin,
      },
      null,
      2
    )
  );

  if (!summary.pass) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
