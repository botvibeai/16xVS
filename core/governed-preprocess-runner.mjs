import crypto from "node:crypto";

import {
  POLICY_VERSION,
  planPreprocessing,
  restoreExactSpans,
  verifyPreprocessRetention,
} from "./preprocess-governance.mjs";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function readCacheLayers(cacheKey, cacheLayers = []) {
  for (let index = 0; index < cacheLayers.length; index += 1) {
    const layer = cacheLayers[index];
    if (!layer || typeof layer.get !== "function") continue;
    try {
      const value = await layer.get(cacheKey);
      if (value) return { value, layerName: layer.name || `layer-${index}` };
    } catch {
      // A failed cache layer must never block the exact source path.
    }
  }
  return null;
}

async function writeCacheLayers(cacheKey, value, cacheLayers = []) {
  const writes = [];
  for (let index = 0; index < cacheLayers.length; index += 1) {
    const layer = cacheLayers[index];
    if (!layer || typeof layer.put !== "function") continue;
    try {
      await layer.put(cacheKey, value);
      writes.push({ layer: layer.name || `layer-${index}`, ok: true });
    } catch (error) {
      writes.push({ layer: layer.name || `layer-${index}`, ok: false, error: String(error?.message || error) });
    }
  }
  return writes;
}

function validCachedCandidate(entry, plan) {
  return Boolean(
    entry &&
    entry.policyVersion === POLICY_VERSION &&
    entry.sourceSha256 === plan.sourceSha256 &&
    entry.cacheKey === plan.cacheKey &&
    typeof entry.candidate === "string" &&
    entry.retention?.accepted === true &&
    entry.semantic?.accepted === true &&
    entry.candidateSha256 === sha256(entry.candidate)
  );
}

export async function runGovernedPreprocessing({
  text,
  modelId,
  modelRevision = "unknown",
  parameters = {},
  summarize,
  semanticVerify,
  cacheLayers = [],
} = {}) {
  const source = String(text || "");
  const plan = planPreprocessing({ text: source, modelId, modelRevision, parameters });
  if (!plan.route.bartAllowed) {
    return {
      accepted: true,
      usedPreprocessor: false,
      cacheHit: false,
      output: source,
      plan,
      reason: `bypass:${plan.route.reason}`,
    };
  }
  if (typeof summarize !== "function") throw new Error("summarize callback is required for a BART-eligible route");
  if (typeof semanticVerify !== "function") {
    return {
      accepted: true,
      usedPreprocessor: false,
      cacheHit: false,
      output: source,
      plan,
      reason: "bypass:semantic-verifier-unavailable",
    };
  }

  const cached = await readCacheLayers(plan.cacheKey, cacheLayers);
  if (cached && validCachedCandidate(cached.value, plan)) {
    return {
      accepted: true,
      usedPreprocessor: true,
      cacheHit: true,
      cacheLayer: cached.layerName,
      output: cached.value.candidate,
      plan,
      retention: cached.value.retention,
      semantic: cached.value.semantic,
      reason: "accepted:cache",
    };
  }

  let summarized;
  try {
    summarized = await summarize(plan.protectedText, {
      modelId,
      modelRevision,
      parameters,
      route: plan.route.lane,
      policyVersion: POLICY_VERSION,
    });
  } catch (error) {
    return {
      accepted: true,
      usedPreprocessor: false,
      cacheHit: false,
      output: source,
      plan,
      reason: "bypass:summarizer-error",
      error: String(error?.message || error),
    };
  }

  let restored;
  try {
    restored = restoreExactSpans(String(summarized || ""), plan.literals);
  } catch (error) {
    return {
      accepted: true,
      usedPreprocessor: false,
      cacheHit: false,
      output: source,
      plan,
      reason: "bypass:literal-restoration-failed",
      error: String(error?.message || error),
    };
  }

  const retention = verifyPreprocessRetention({ source, candidate: restored, literals: plan.literals });
  if (!retention.accepted) {
    return {
      accepted: true,
      usedPreprocessor: false,
      cacheHit: false,
      output: source,
      plan,
      retention,
      reason: "bypass:retention-gate-failed",
    };
  }

  let semantic;
  try {
    const semanticResult = await semanticVerify({ source, candidate: restored, plan, retention });
    semantic = typeof semanticResult === "boolean" ? { accepted: semanticResult } : semanticResult;
  } catch (error) {
    semantic = { accepted: false, error: String(error?.message || error) };
  }
  if (!semantic?.accepted) {
    return {
      accepted: true,
      usedPreprocessor: false,
      cacheHit: false,
      output: source,
      plan,
      retention,
      semantic,
      reason: "bypass:semantic-gate-failed",
    };
  }

  const cacheEntry = {
    policyVersion: POLICY_VERSION,
    cacheKey: plan.cacheKey,
    sourceSha256: plan.sourceSha256,
    candidate: restored,
    candidateSha256: sha256(restored),
    modelId,
    modelRevision,
    retention,
    semantic,
  };
  const cacheWrites = await writeCacheLayers(plan.cacheKey, cacheEntry, cacheLayers);
  return {
    accepted: true,
    usedPreprocessor: true,
    cacheHit: false,
    output: restored,
    plan,
    retention,
    semantic,
    cacheWrites,
    reason: "accepted:fresh",
  };
}
