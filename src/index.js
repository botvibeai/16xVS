import { runV33TestingWorkerBatch } from "./testing-v33-sidecar.js";

const CATALOG_NAME = "16xvs-poc";
const RECORD_PREFIX = "glyph:";
const MAX_LIBRARY_LIMIT = 64;
const MAX_MATCH_LIMIT = 20;
const MAX_R2_FALLBACK_LIMIT = 1000;
const POPCOUNT_NIBBLE = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];
const STORAGE_TIERS = [
  { name: "live", binding: "LIVE_TOKENS", required: true },
  { name: "fallback", binding: "FALLBACK_TOKENS", required: false },
  { name: "vault", binding: "VAULT_TOKENS", required: false, storageClass: "InfrequentAccess" },
];
const LAB_COUNTER_KEY = "lab:counters";
const MAX_PUBLIC_LAB_CHARS = 20_000;
const DEFAULT_ALLOWED_ORIGINS = ["https://16xvs.com", "https://www.16xvs.com"];
const LOCAL_DEV_ORIGINS = ["http://127.0.0.1:8787", "http://localhost:8787", "http://127.0.0.1:5173", "http://localhost:5173"];
const POC_API_PATHS = new Set(["/api/library", "/api/tokenize", "/api/ingest", "/api/ingest-batch", "/api/search", "/api/repair"]);
const SENSITIVE_PUBLIC_PREFIXES = [
  "/.git/",
  "/.github/",
  "/.wrangler/",
  "/bench/",
  "/core/",
  "/data/",
  "/docs/",
  "/models/",
  "/node_modules/",
  "/scripts/",
  "/src/",
  "/test/",
  "/upward-experiments/",
  "/vault-snapshots/",
];
const SENSITIVE_PUBLIC_FILES = new Set([
  "/.dev.vars",
  "/.env",
  "/package-lock.json",
  "/package.json",
  "/readme.md",
  "/wrangler.jsonc",
  "/wrangler.secondary.jsonc",
  "/wrangler.testing.jsonc",
]);
const SECURITY_HEADER_VALUES = {
  "content-security-policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), browsing-topics=()",
  "referrer-policy": "no-referrer",
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

export function runtimeMetadata(env = {}) {
  return {
    role: typeof env.DEPLOYMENT_ROLE === "string" ? env.DEPLOYMENT_ROLE : "primary",
    dataStack: typeof env.DATA_STACK === "string" ? env.DATA_STACK : "production",
    proofBaseline: typeof env.PROOF_BASELINE === "string" ? env.PROOF_BASELINE : "v30",
    catalogRecovery: "durable-object-with-r2-fallback",
  };
}

function addSecurityHeaders(headers) {
  for (const [key, value] of Object.entries(SECURITY_HEADER_VALUES)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return headers;
}

function secureResponse(response) {
  const headers = addSecurityHeaders(new Headers(response.headers));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("content-type")) headers.set("content-type", "application/json; charset=utf-8");
  addSecurityHeaders(headers);
  return new Response(JSON.stringify(data, null, 2), { ...init, headers });
}

function notFound(pathname) {
  return json({ ok: false, error: { message: "Not found", pathname } }, { status: 404 });
}

function badRequest(message, extra = {}) {
  return json({ ok: false, error: { message, ...extra } }, { status: 400 });
}

function redirectTo(pathname, request, status = 302) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return secureResponse(Response.redirect(url.toString(), status));
}

export function estimateBpeTokens(text) {
  const value = String(text || "").trim();
  if (!value) return 0;

  let tokens = 0;
  let latinRun = "";

  function flushLatin() {
    if (!latinRun) return;
    const chunks = latinRun.match(/[A-Za-z0-9_]+|[^\sA-Za-z0-9_]/g) || [];
    for (const chunk of chunks) tokens += Math.max(1, Math.ceil(chunk.length / 4));
    latinRun = "";
  }

  for (const char of value) {
    if (/\s/.test(char)) {
      flushLatin();
      continue;
    }

    const code = char.codePointAt(0) || 0;
    if (code >= 0x4e00 && code <= 0x9fff) {
      flushLatin();
      tokens += 1.4;
    } else if ((code >= 0x3040 && code <= 0x30ff) || (code >= 0xac00 && code <= 0xd7af)) {
      flushLatin();
      tokens += 1.25;
    } else if ((code >= 0x0900 && code <= 0x097f) || (code >= 0x0600 && code <= 0x06ff)) {
      flushLatin();
      tokens += 1.15;
    } else if (code >= 0x0400 && code <= 0x04ff) {
      flushLatin();
      tokens += 1.1;
    } else {
      latinRun += char;
    }
  }

  flushLatin();
  return Math.max(1, Math.ceil(tokens));
}

export function detectLanguageTags(text) {
  const tags = new Set(["latin"]);
  for (const char of String(text || "")) {
    const code = char.codePointAt(0) || 0;
    if (code >= 0x0900 && code <= 0x097f) tags.add("hindi-devanagari");
    if (code >= 0x0600 && code <= 0x06ff) tags.add("arabic");
    if (code >= 0x3040 && code <= 0x30ff) tags.add("japanese-kana");
    if (code >= 0x4e00 && code <= 0x9fff) tags.add("cjk");
    if (code >= 0x0400 && code <= 0x04ff) tags.add("russian-cyrillic");
  }
  return [...tags];
}

export function analyzePublicCompression(text) {
  const value = String(text || "");
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: { message: "Paste text before running the public compression lab." },
    };
  }

  const limitedText = trimmed.slice(0, MAX_PUBLIC_LAB_CHARS);
  const bpeTokens = estimateBpeTokens(limitedText);
  const charCount = Array.from(limitedText).length;
  const languages = detectLanguageTags(limitedText);
  const hasStructure = /[\n.!?;:]/.test(limitedText);
  const hasNumbers = /\d/.test(limitedText);
  const hasCodeRisk = /[{}`<>]|api[_-]?key|secret|password|bearer\s+[a-z0-9._-]+|ghp_[A-Za-z0-9_]{20,}|cfut_[A-Za-z0-9]{20,}/i.test(limitedText);
  const longEnough = bpeTokens >= 180;
  const multilingual = languages.length > 1;

  let effectiveRatio = 320;
  if (bpeTokens >= 700 && hasStructure) effectiveRatio = 420;
  if (bpeTokens >= 1800 && hasStructure && !hasCodeRisk) effectiveRatio = 520;
  if (bpeTokens < 60) effectiveRatio = 180;
  if (hasCodeRisk) effectiveRatio = Math.min(effectiveRatio, 260);
  if (multilingual && longEnough) effectiveRatio += 25;
  if (hasNumbers) effectiveRatio -= 15;
  effectiveRatio = Math.max(120, Math.min(560, effectiveRatio));

  const residualTokens = hasCodeRisk || bpeTokens < 48 ? 1 : 0;
  const rootTokens = Math.max(1, Math.ceil(bpeTokens / effectiveRatio));
  const equivalent16xvsTokens = rootTokens + residualTokens;
  const tokensReduced = Math.max(0, bpeTokens - equivalent16xvsTokens);
  const ratio = equivalent16xvsTokens > 0 ? bpeTokens / equivalent16xvsTokens : 0;
  const reductionPercent = bpeTokens > 0 ? (1 - equivalent16xvsTokens / bpeTokens) * 100 : 0;
  const confidence = hasCodeRisk ? "guarded" : bpeTokens >= 700 ? "strong" : bpeTokens >= 160 ? "medium" : "screening";
  const warnings = [];

  if (hasCodeRisk) {
    warnings.push("Code, secret, or config-like text triggers a residual safety token in the public lab.");
  }
  if (value.length > MAX_PUBLIC_LAB_CHARS) {
    warnings.push(`Public lab input was capped at ${MAX_PUBLIC_LAB_CHARS} characters.`);
  }

  return {
    ok: true,
    source: {
      charCount,
      languages,
      storedPrompt: false,
      publicInputCap: MAX_PUBLIC_LAB_CHARS,
    },
    metrics: {
      bpeTokens,
      rootTokens,
      residualTokens,
      equivalent16xvsTokens,
      tokensReduced,
      ratio: Number(ratio.toFixed(2)),
      reductionPercent: Number(reductionPercent.toFixed(4)),
      effectiveRatio,
      confidence,
      claimLevel: "public-estimate",
    },
    warnings,
  };
}

function emptyLabCounters() {
  return {
    totalRuns: 0,
    totalBpeTokens: 0,
    total16xvsTokens: 0,
    totalTokensReduced: 0,
    averageReductionPercent: 0,
    bestRatio: 0,
    languageCounts: {},
    updatedAt: null,
  };
}

function summarizeLabCounters(counters) {
  const totalBpeTokens = Number(counters?.totalBpeTokens) || 0;
  const total16xvsTokens = Number(counters?.total16xvsTokens) || 0;
  return {
    ...emptyLabCounters(),
    ...counters,
    totalRuns: Number(counters?.totalRuns) || 0,
    totalBpeTokens,
    total16xvsTokens,
    totalTokensReduced: Math.max(0, totalBpeTokens - total16xvsTokens),
    averageReductionPercent:
      totalBpeTokens > 0 ? Number(((1 - total16xvsTokens / totalBpeTokens) * 100).toFixed(4)) : 0,
    bestRatio: Number(counters?.bestRatio) || 0,
    languageCounts: counters?.languageCounts && typeof counters.languageCounts === "object" ? counters.languageCounts : {},
    updatedAt: counters?.updatedAt || null,
  };
}

async function recordLabAnalysis(state, analysis) {
  const current = summarizeLabCounters((await state.storage.get(LAB_COUNTER_KEY)) || emptyLabCounters());
  const next = summarizeLabCounters({
    ...current,
    totalRuns: current.totalRuns + 1,
    totalBpeTokens: current.totalBpeTokens + analysis.metrics.bpeTokens,
    total16xvsTokens: current.total16xvsTokens + analysis.metrics.equivalent16xvsTokens,
    bestRatio: Math.max(current.bestRatio, analysis.metrics.ratio),
    updatedAt: new Date().toISOString(),
    languageCounts: { ...current.languageCounts },
  });

  for (const language of analysis.source.languages || []) {
    next.languageCounts[language] = (next.languageCounts[language] || 0) + 1;
  }

  await state.storage.put(LAB_COUNTER_KEY, next);
  return next;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeGrayscale(input) {
  if ((!Array.isArray(input) && !ArrayBuffer.isView(input)) || input.length !== 256) {
    throw new Error("Expected a grayscale array with exactly 256 values.");
  }

  const pixels = new Uint8Array(256);
  for (let index = 0; index < input.length; index += 1) {
    const value = Number(input[index]);
    if (!Number.isFinite(value)) throw new Error(`Pixel ${index} is not numeric.`);
    pixels[index] = Math.max(0, Math.min(255, Math.round(value)));
  }
  return pixels;
}

function chooseThreshold(grayscale) {
  let total = 0;
  for (const value of grayscale) total += value;
  return Math.round(total / grayscale.length);
}

function bitsToHex(bits) {
  let output = "";
  for (let index = 0; index < bits.length; index += 4) {
    const nibble = (bits[index] << 3) | (bits[index + 1] << 2) | (bits[index + 2] << 1) | bits[index + 3];
    output += nibble.toString(16);
  }
  return output;
}

function glyphFromGrayscale(input) {
  const grayscale = normalizeGrayscale(input);
  const threshold = chooseThreshold(grayscale);
  const bits = new Array(256);
  let onBits = 0;

  for (let index = 0; index < grayscale.length; index += 1) {
    const isDark = grayscale[index] <= threshold ? 1 : 0;
    bits[index] = isDark;
    onBits += isDark;
  }

  return {
    threshold,
    bitstring: bits.join(""),
    hex: bitsToHex(bits),
    onBits,
    density: Number((onBits / 256).toFixed(4)),
  };
}

function hammingHex(leftHex, rightHex) {
  let distance = 0;
  for (let index = 0; index < leftHex.length; index += 1) {
    const xor = parseInt(leftHex[index], 16) ^ parseInt(rightHex[index], 16);
    distance += POPCOUNT_NIBBLE[xor];
  }
  return distance;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const view = new Uint8Array(digest);
  let output = "";
  for (const value of view) output += value.toString(16).padStart(2, "0");
  return output;
}

function limitFromSearchParams(url, fallback, maximum) {
  const value = Number(url.searchParams.get("limit"));
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(maximum, Math.round(value)));
}

function sanitizeSource(input = {}) {
  return {
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim() : "untitled-image",
    mimeType: typeof input.mimeType === "string" && input.mimeType.trim() ? input.mimeType.trim() : "application/octet-stream",
    originalWidth: Number.isFinite(input.originalWidth) ? Math.max(1, Math.round(input.originalWidth)) : 16,
    originalHeight: Number.isFinite(input.originalHeight) ? Math.max(1, Math.round(input.originalHeight)) : 16,
  };
}

function sanitizeMetadata(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  const metadata = {};
  for (const [key, value] of Object.entries(input)) {
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(key)) continue;
    if (typeof value === "string" && value.trim()) metadata[key] = value.trim().slice(0, 280);
    else if (typeof value === "number" && Number.isFinite(value)) metadata[key] = value;
    else if (typeof value === "boolean") metadata[key] = value;
  }

  return metadata;
}

async function buildTokenPayload(body) {
  if (!body || typeof body !== "object") throw new Error("Missing request body.");
  const grayscale = normalizeGrayscale(body.grayscale);
  const glyph = glyphFromGrayscale(grayscale);
  const source = sanitizeSource(body.source);
  const metadata = sanitizeMetadata(body.metadata);
  const sampleDigest = await sha256Hex(grayscale);
  return { glyph, source, metadata, sampleDigest };
}

function isoOrNull(value) {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

function successfulTiers(storage) {
  return STORAGE_TIERS.filter((tier) => storage?.[tier.name]?.ok).map((tier) => tier.name);
}

function durabilityMode(storage) {
  const tiers = successfulTiers(storage);
  if (tiers.length >= 3) return "triple";
  if (tiers.includes("live") && tiers.length >= 2) return "double";
  if (tiers.length >= 1) return "single";
  return "missing";
}

function storageSummary(storage) {
  const tiers = successfulTiers(storage);
  const mode = durabilityMode(storage);
  return {
    mode,
    successfulTiers: tiers,
    copyCount: tiers.length,
    quorumMet: mode === "double" || mode === "triple",
    liveReady: tiers.includes("live"),
  };
}

function isRecordDegraded(record) {
  if (!record?.storage) return true;
  return !record.storage.quorumMet || !record.storage.liveReady;
}

function buildR2FallbackWrite(tier, object) {
  return {
    tier: tier.name,
    binding: tier.binding,
    key: object.key,
    ok: true,
    etag: object.etag || null,
    version: object.version || null,
    uploaded: isoOrNull(object.uploaded),
    storageClass: object.storageClass || tier.storageClass || "Standard",
    error: null,
  };
}

function buildR2FallbackStorage(record, tierWrites) {
  const storage = Object.fromEntries(tierWrites.map((write) => [write.tier, write]));
  const summary = storageSummary(storage);
  return {
    mode: summary.mode,
    successfulTiers: summary.successfulTiers,
    copyCount: summary.copyCount,
    quorumMet: summary.quorumMet,
    liveReady: summary.liveReady,
    key: record?.storage?.key || tierWrites[0]?.key || buildStorageKey(record),
    live: storage.live,
    fallback: storage.fallback,
    vault: storage.vault,
  };
}

async function listRecordsFromTier(env, tier, limit) {
  const bucket = env[tier.binding];
  if (!bucket?.list || !bucket?.get) return [];

  const records = [];
  let cursor;

  do {
    const page = await bucket.list({
      prefix: "glyphs/",
      cursor,
      limit: Math.min(1000, Math.max(1, limit - records.length)),
    });

    for (const object of page.objects || []) {
      try {
        const stored = await bucket.get(object.key);
        if (!stored) continue;
        const record = await stored.json();
        if (!record?.id || !record?.glyph?.hex) continue;
        records.push({ record, tierWrite: buildR2FallbackWrite(tier, object) });
      } catch {
        // Ignore malformed objects during cold catalog recovery.
      }
    }

    cursor = page.truncated ? page.cursor : null;
  } while (cursor && records.length < limit);

  return records;
}

export async function listRecordsFromR2Fallback(env, limit = MAX_LIBRARY_LIMIT) {
  const byId = new Map();

  for (const tier of STORAGE_TIERS) {
    const records = await listRecordsFromTier(env, tier, limit);
    for (const { record, tierWrite } of records) {
      if (!byId.has(record.id)) byId.set(record.id, { record, tierWrites: [] });
      byId.get(record.id).tierWrites.push(tierWrite);
    }
  }

  return [...byId.values()]
    .map(({ record, tierWrites }) => ({
      ...record,
      storage: buildR2FallbackStorage(record, tierWrites),
    }))
    .sort((left, right) => (right.createdAtMs || 0) - (left.createdAtMs || 0))
    .slice(0, limit)
    .map(summarizeRecord);
}

function buildStorageKey(record) {
  const stamp = record.createdAt.slice(0, 10);
  return `glyphs/${stamp}/${record.id}.json`;
}

function buildStoragePayload(record) {
  return JSON.stringify({
    id: record.id,
    createdAt: record.createdAt,
    createdAtMs: record.createdAtMs,
    source: record.source,
    metadata: record.metadata || {},
    glyph: record.glyph,
    sampleDigest: record.sampleDigest,
  });
}

async function writeStorageTier(env, tier, key, payload, record) {
  try {
    const bucket = env[tier.binding];
    const object = await bucket.put(key, payload, {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
      customMetadata: {
        recordId: record.id,
        sampleDigest: record.sampleDigest,
        tier: tier.name,
        sourceName: record.source.name.slice(0, 128),
      },
      ...(tier.storageClass ? { storageClass: tier.storageClass } : {}),
    });

    return {
      tier: tier.name,
      binding: tier.binding,
      key,
      ok: true,
      etag: object?.etag || null,
      version: object?.version || null,
      uploaded: isoOrNull(object?.uploaded),
      storageClass: object?.storageClass || tier.storageClass || "Standard",
      error: null,
    };
  } catch (error) {
    return {
      tier: tier.name,
      binding: tier.binding,
      key,
      ok: false,
      etag: null,
      version: null,
      uploaded: null,
      storageClass: tier.storageClass || "Standard",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function cleanupTier(env, result) {
  if (!result?.ok) return;
  try {
    await env[result.binding].delete(result.key);
  } catch {
    // Best effort cleanup for failed quorum writes.
  }
}

async function replicateRecord(env, record) {
  const key = buildStorageKey(record);
  const payload = buildStoragePayload(record);
  const writes = await Promise.all(
    STORAGE_TIERS.map((tier) => writeStorageTier(env, tier, key, payload, record))
  );

  const storage = Object.fromEntries(writes.map((write) => [write.tier, write]));
  const liveReady = storage.live?.ok === true;
  const secondaryReady = Boolean(storage.fallback?.ok || storage.vault?.ok);
  const summary = storageSummary(storage);

  if (!liveReady || !secondaryReady) {
    await Promise.all(writes.map((write) => cleanupTier(env, write)));
    return {
      ok: false,
      storage,
      summary,
      message: "Storage quorum failed. Live storage and at least one secondary copy are required.",
    };
  }

  return {
    ok: true,
    storage,
    summary,
    key,
  };
}

async function repairRecordStorage(env, record) {
  const payload = buildStoragePayload(record);
  const key = record?.storage?.key || buildStorageKey(record);
  const currentStorage = record?.storage || {};
  const attempted = [];

  for (const tier of STORAGE_TIERS) {
    const existing = currentStorage[tier.name];
    if (existing?.ok) {
      attempted.push(existing);
      continue;
    }
    attempted.push(await writeStorageTier(env, tier, key, payload, record));
  }

  const storage = Object.fromEntries(attempted.map((write) => [write.tier, write]));
  const summary = storageSummary(storage);
  return {
    storage: {
      mode: summary.mode,
      successfulTiers: summary.successfulTiers,
      copyCount: summary.copyCount,
      quorumMet: summary.quorumMet,
      liveReady: summary.liveReady,
      key,
      live: storage.live,
      fallback: storage.fallback,
      vault: storage.vault,
    },
    summary,
  };
}

function summarizeRecord(record) {
  return {
    id: record.id,
    createdAt: record.createdAt,
    createdAtMs: record.createdAtMs,
    source: record.source,
    metadata: record.metadata || {},
    glyph: record.glyph,
    sampleDigest: record.sampleDigest,
    storage: record.storage || null,
  };
}

async function persistTokenRecord(env, state, token) {
  const createdAtMs = Date.now();
  const id = crypto.randomUUID();
  const record = {
    id,
    createdAt: new Date(createdAtMs).toISOString(),
    createdAtMs,
    source: token.source,
    metadata: token.metadata || {},
    glyph: token.glyph,
    sampleDigest: token.sampleDigest,
  };

  const replication = await replicateRecord(env, record);
  if (!replication.ok) {
    return {
      ok: false,
      error: {
        message: replication.message,
        storage: replication.storage,
        summary: replication.summary,
      },
    };
  }

  record.storage = {
    mode: replication.summary.mode,
    successfulTiers: replication.summary.successfulTiers,
    copyCount: replication.summary.copyCount,
    quorumMet: replication.summary.quorumMet,
    key: replication.key,
    live: replication.storage.live,
    fallback: replication.storage.fallback,
    vault: replication.storage.vault,
  };

  const storageKey = `${RECORD_PREFIX}${String(createdAtMs).padStart(13, "0")}:${id}`;
  await state.storage.put(storageKey, record);

  return {
    ok: true,
    record: summarizeRecord(record),
  };
}

function isPublicProduction(env = {}) {
  const meta = runtimeMetadata(env);
  return meta.role === "primary" || meta.role === "secondary" || meta.dataStack === "production";
}

function parseAllowedOrigins(env = {}) {
  const origins = new Set(DEFAULT_ALLOWED_ORIGINS);
  const configured = typeof env.ALLOWED_ORIGINS === "string" ? env.ALLOWED_ORIGINS : "";
  for (const origin of configured.split(",").map((item) => item.trim()).filter(Boolean)) origins.add(origin);
  if (!isPublicProduction(env)) {
    for (const origin of LOCAL_DEV_ORIGINS) origins.add(origin);
  }
  return origins;
}

function isCorsOriginAllowed(request, env = {}) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return parseAllowedOrigins(env).has(origin);
}

function corsHeaders(request, env = {}) {
  const headers = {
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
  const origin = request.headers.get("origin");
  if (origin && isCorsOriginAllowed(request, env)) headers["access-control-allow-origin"] = origin;
  return headers;
}

function withCors(response, request, env = {}) {
  const headers = addSecurityHeaders(new Headers(response.headers));
  const cors = corsHeaders(request, env);
  for (const [key, value] of Object.entries(cors)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function hasAdminApiToken(request, env = {}) {
  const expected = typeof env.ADMIN_API_TOKEN === "string" ? env.ADMIN_API_TOKEN.trim() : "";
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

function isPublicPocEnabled(env = {}) {
  return String(env.ENABLE_PUBLIC_POC || "").toLowerCase() === "true";
}

function canAccessPocApi(request, env = {}) {
  return isPublicPocEnabled(env) || !isPublicProduction(env) || hasAdminApiToken(request, env);
}

function restrictedApiResponse() {
  return json(
    {
      ok: false,
      error: {
        message: "Endpoint restricted before public launch.",
        reason: "public-proof-api-only",
      },
    },
    { status: 403 }
  );
}

function normalizePublicPath(pathname) {
  try {
    return decodeURIComponent(pathname).replace(/\\/g, "/").toLowerCase();
  } catch {
    return pathname.replace(/\\/g, "/").toLowerCase();
  }
}

function isSensitivePublicPath(pathname) {
  const safePath = normalizePublicPath(pathname);
  if (SENSITIVE_PUBLIC_FILES.has(safePath)) return true;
  return SENSITIVE_PUBLIC_PREFIXES.some((prefix) => safePath.startsWith(prefix));
}

function catalogStub(env) {
  const id = env.GLYPH_CATALOG.idFromName(CATALOG_NAME);
  return env.GLYPH_CATALOG.get(id);
}

async function fetchCatalog(request, env, pathname) {
  const url = new URL(request.url);
  const target = new URL(`https://catalog.internal${pathname}`);
  target.search = url.search;

  return catalogStub(env).fetch(target.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
  });
}

export class GlyphCatalog {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async listRecords(limit = MAX_LIBRARY_LIMIT) {
    const items = await this.state.storage.list({
      prefix: RECORD_PREFIX,
      reverse: true,
      limit,
    });
    const records = [...items.values()].map(summarizeRecord);
    return records.length > 0 ? records : listRecordsFromR2Fallback(this.env, limit);
  }

  async listAllRecords() {
    const items = await this.state.storage.list({ prefix: RECORD_PREFIX });
    const records = [...items.values()].map(summarizeRecord);
    return records.length > 0 ? records : listRecordsFromR2Fallback(this.env, MAX_R2_FALLBACK_LIMIT);
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      const records = await this.listAllRecords();
      const doubleCount = records.filter((record) => record.storage?.mode === "double").length;
      const tripleCount = records.filter((record) => record.storage?.mode === "triple").length;
      const degradedCount = records.filter((record) => isRecordDegraded(record)).length;
      return json({
        ok: true,
        service: "16xvs-glyph-catalog",
        runtime: runtimeMetadata(this.env),
        recordCount: records.length,
        durability: {
          doubleCount,
          tripleCount,
          degradedCount,
        },
        storagePolicy: {
          tiers: STORAGE_TIERS.map((tier) => tier.name),
          liveRequired: true,
          minimumCopies: 2,
        },
      });
    }

    if (request.method === "GET" && url.pathname === "/library") {
      const limit = limitFromSearchParams(url, 24, MAX_LIBRARY_LIMIT);
      const records = await this.listRecords(limit);
      return json({ ok: true, records, count: records.length });
    }

    if (request.method === "GET" && url.pathname === "/lab-counters") {
      const counters = summarizeLabCounters((await this.state.storage.get(LAB_COUNTER_KEY)) || emptyLabCounters());
      return json({ ok: true, counters });
    }

    const body = request.method === "POST" ? await readJson(request) : null;

    if (request.method === "POST" && url.pathname === "/lab-analyze") {
      const analysis = analyzePublicCompression(body?.text || "");
      if (!analysis.ok) return badRequest(analysis.error.message);

      const counters = await recordLabAnalysis(this.state, analysis);
      return json({
        ...analysis,
        counters,
      });
    }

    if (request.method === "POST" && url.pathname === "/ingest") {
      try {
        const token = await buildTokenPayload(body);
        const persisted = await persistTokenRecord(this.env, this.state, token);
        if (!persisted.ok) return json({ ok: false, error: persisted.error }, { status: 502 });

        const records = await this.listAllRecords();
        return json({
          ok: true,
          record: persisted.record,
          recordCount: records.length,
        });
      } catch (error) {
        return badRequest(error.message);
      }
    }

    if (request.method === "POST" && url.pathname === "/ingest-batch") {
      if (!Array.isArray(body?.items) || body.items.length === 0) {
        return badRequest("Batch ingest requires a non-empty items array.");
      }

      if (body.items.length > 512) {
        return badRequest("Batch ingest is limited to 512 items per request.");
      }

      const results = [];
      for (let index = 0; index < body.items.length; index += 1) {
        try {
          const token = await buildTokenPayload(body.items[index]);
          const persisted = await persistTokenRecord(this.env, this.state, token);
          if (!persisted.ok) {
            results.push({
              index,
              ok: false,
              error: persisted.error,
            });
            continue;
          }

          results.push({
            index,
            ok: true,
            record: persisted.record,
          });
        } catch (error) {
          results.push({
            index,
            ok: false,
            error: { message: error instanceof Error ? error.message : String(error) },
          });
        }
      }

      const records = await this.listAllRecords();
      const successCount = results.filter((item) => item.ok).length;
      const failureCount = results.length - successCount;
      return json({
        ok: failureCount === 0,
        attempted: results.length,
        successCount,
        failureCount,
        recordCount: records.length,
        results,
      });
    }

    if (request.method === "POST" && url.pathname === "/search") {
      try {
        const token = await buildTokenPayload(body);
        const excludeRecordId = typeof body?.excludeRecordId === "string" ? body.excludeRecordId : null;
        const limit = Number.isFinite(body?.limit)
          ? Math.max(1, Math.min(MAX_MATCH_LIMIT, Math.round(body.limit)))
          : 5;
        const records = await this.listAllRecords();

        const matches = records
          .filter((record) => record.id !== excludeRecordId)
          .map((record) => {
            const distance = hammingHex(token.glyph.hex, record.glyph.hex);
            return {
              record,
              distance,
              similarity: Number((1 - distance / 256).toFixed(4)),
            };
          })
          .sort((left, right) => {
            if (left.distance !== right.distance) return left.distance - right.distance;
            return right.record.createdAtMs - left.record.createdAtMs;
          })
          .slice(0, limit);

        return json({
          ok: true,
          query: {
            source: token.source,
            glyph: token.glyph,
            sampleDigest: token.sampleDigest,
          },
          totalCandidates: records.length,
          matches,
        });
      } catch (error) {
        return badRequest(error.message);
      }
    }

    if (request.method === "POST" && url.pathname === "/repair") {
      const requestedId = typeof body?.recordId === "string" ? body.recordId : null;
      const degradedOnly = body?.degradedOnly !== false;
      const records = await this.state.storage.list({ prefix: RECORD_PREFIX });
      const results = [];

      for (const [key, value] of records.entries()) {
        if (requestedId && value.id !== requestedId) continue;
        if (degradedOnly && !isRecordDegraded(value)) continue;

        const repaired = await repairRecordStorage(this.env, value);
        value.storage = repaired.storage;
        await this.state.storage.put(key, value);
        results.push({
          id: value.id,
          sourceName: value.source?.name || "unknown",
          storage: value.storage,
        });
      }

      return json({
        ok: true,
        repairedCount: results.length,
        requestedId,
        degradedOnly,
        results,
      });
    }

    return notFound(url.pathname);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const normalizedPath = url.pathname.replace(/\/$/, "");

    if (normalizedPath === "/bpe-to-16xvs-token-counter" || normalizedPath === "/ai-token-compression-demo") {
      return redirectTo("/live-compression-lab/", request);
    }

    if (
      normalizedPath === "/ai-token-compression-calculator" ||
      normalizedPath === "/llm-token-savings-calculator" ||
      normalizedPath === "/token-savings-calculator"
    ) {
      return redirectTo("/llm-token-saving-calculator/", request);
    }

    if (isSensitivePublicPath(url.pathname)) {
      return notFound(url.pathname);
    }

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      const status = isCorsOriginAllowed(request, env) ? 204 : 403;
      return withCors(new Response(null, { status }), request, env);
    }

    if (POC_API_PATHS.has(url.pathname) && !canAccessPocApi(request, env)) {
      return withCors(restrictedApiResponse(), request, env);
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      const response = await fetchCatalog(request, env, "/health");
      return withCors(response, request, env);
    }

    if (request.method === "GET" && url.pathname === "/api/library") {
      const response = await fetchCatalog(request, env, "/library");
      return withCors(response, request, env);
    }

    if (request.method === "GET" && url.pathname === "/api/lab/counters") {
      const response = await fetchCatalog(request, env, "/lab-counters");
      return withCors(response, request, env);
    }

    if (request.method === "POST" && url.pathname === "/api/lab/analyze") {
      const response = await fetchCatalog(request, env, "/lab-analyze");
      return withCors(response, request, env);
    }

    if (url.pathname === "/api/testing/v33-707-batch") {
      if (request.method !== "POST") return notFound(url.pathname);
      const body = await readJson(request);
      const result = runV33TestingWorkerBatch(body, env);
      if (result.status === 404) return notFound(url.pathname);
      return withCors(json(result, { status: result.status }), request, env);
    }

    if (request.method === "POST" && url.pathname === "/api/tokenize") {
      const body = await readJson(request);
      try {
        const token = await buildTokenPayload(body);
        return withCors(
          json({
            ok: true,
            source: token.source,
            glyph: token.glyph,
            sampleDigest: token.sampleDigest,
          }),
          request,
          env
        );
      } catch (error) {
        return withCors(badRequest(error.message), request, env);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/ingest") {
      const response = await fetchCatalog(request, env, "/ingest");
      return withCors(response, request, env);
    }

    if (request.method === "POST" && url.pathname === "/api/ingest-batch") {
      const response = await fetchCatalog(request, env, "/ingest-batch");
      return withCors(response, request, env);
    }

    if (request.method === "POST" && url.pathname === "/api/search") {
      const response = await fetchCatalog(request, env, "/search");
      return withCors(response, request, env);
    }

    if (request.method === "POST" && url.pathname === "/api/repair") {
      const response = await fetchCatalog(request, env, "/repair");
      return withCors(response, request, env);
    }

    const assetResponse = await env.ASSETS.fetch(request.url, request);
    return assetResponse.status === 404 ? notFound(url.pathname) : secureResponse(assetResponse);
  },
};

