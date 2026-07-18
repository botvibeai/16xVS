import crypto from "node:crypto";

const POLICY_VERSION = "16xvs-preprocess-governance-v1";
const PLACEHOLDER_RE = /__16XVS_LITERAL_\d{4}_[A-F0-9]{12}__/g;
const EXACT_PATTERNS = [
  { type: "fenced-code", priority: 100, regex: /```[\s\S]*?```/g },
  { type: "inline-code", priority: 90, regex: /`[^`\n]+`/g },
  { type: "url", priority: 80, regex: /\bhttps?:\/\/[^\s<>()]+/gi },
  { type: "email", priority: 80, regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { type: "quoted", priority: 70, regex: /"[^"\n]{2,}"|“[^”\n]{2,}”|'[^'\n]{2,}'/g },
  { type: "number", priority: 60, regex: /(?:[$€£]\s*)?\b\d[\d,]*(?:\.\d+)?(?:%|x|X)?\b/g },
  { type: "identifier", priority: 50, regex: /\b(?:[A-Z]{2,}[A-Z0-9]*|[A-Za-z]+_[A-Za-z0-9_]+|[A-Z][A-Za-z]+\d+)\b/g },
];
const NEGATIONS = ["no", "not", "never", "without", "cannot", "can't", "won't", "isn't", "doesn't", "didn't"];
const OBLIGATIONS = ["must", "shall", "required", "prohibited", "only", "except", "unless"];
const LEGAL_MARKERS = /\b(?:hereby|indemnif(?:y|ication)|liability|warranty|governing law|shall|must not|confidentiality)\b/i;
const CODE_MARKERS = /```|\b(?:function|const|let|var|class|import|export|SELECT|INSERT|UPDATE|DELETE)\b|[{};]\s*$/m;
const EQUATION_MARKERS = /(?:=>|->|===|!==|<=|>=|\b\w+\s*=\s*[^,.;]+|[∑√≈≠≤≥])/;

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function canonicalHash(value) {
  return sha256(JSON.stringify(stableValue(value)));
}

function countTerms(text, terms) {
  const lower = String(text || "").toLowerCase();
  return Object.fromEntries(terms.map((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = lower.match(new RegExp(`(^|[^a-z])${escaped}(?=$|[^a-z])`, "g"));
    return [term, matches?.length || 0];
  }));
}

function extractNumberTokens(text) {
  return Array.from(String(text || "").matchAll(/(?:[$€£]\s*)?\b\d[\d,]*(?:\.\d+)?(?:%|x|X)?\b/g), (match) => match[0]);
}

function criticalNegationProfile(text) {
  const segments = String(text || "")
    .split(/(?<=[.!?;])\s+/)
    .filter((segment) => {
      const hasNumber = extractNumberTokens(segment).length > 0;
      const obligations = countTerms(segment, OBLIGATIONS);
      return hasNumber || Object.values(obligations).some((count) => count > 0);
    });
  return countTerms(segments.join(" "), NEGATIONS);
}

function collectSpans(text) {
  const spans = [];
  for (const pattern of EXACT_PATTERNS) {
    pattern.regex.lastIndex = 0;
    for (const match of text.matchAll(pattern.regex)) {
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        value: match[0],
        type: pattern.type,
        priority: pattern.priority,
      });
    }
  }
  spans.sort((left, right) => left.start - right.start || right.priority - left.priority || (right.end - right.start) - (left.end - left.start));
  const accepted = [];
  for (const span of spans) {
    if (accepted.some((item) => span.start < item.end && span.end > item.start)) continue;
    accepted.push(span);
  }
  return accepted.sort((left, right) => left.start - right.start);
}

export function protectExactSpans(text) {
  const source = String(text || "");
  const spans = collectSpans(source);
  const literals = spans.map((span, index) => ({
    ...span,
    placeholder: `__16XVS_LITERAL_${String(index).padStart(4, "0")}_${sha256(span.value).slice(0, 12).toUpperCase()}__`,
    sha256: sha256(span.value),
  }));
  let cursor = 0;
  let protectedText = "";
  for (const literal of literals) {
    protectedText += source.slice(cursor, literal.start);
    protectedText += literal.placeholder;
    cursor = literal.end;
  }
  protectedText += source.slice(cursor);
  return { protectedText, literals };
}

export function restoreExactSpans(candidate, literals) {
  let restored = String(candidate || "");
  const expected = new Set(literals.map((literal) => literal.placeholder));
  const seen = restored.match(PLACEHOLDER_RE) || [];
  const unknown = seen.filter((placeholder) => !expected.has(placeholder));
  if (unknown.length > 0) throw new Error(`Unknown protected literal placeholder: ${unknown[0]}`);
  for (const literal of literals) {
    const matches = restored.split(literal.placeholder).length - 1;
    if (matches !== 1) throw new Error(`Protected literal placeholder must appear exactly once: ${literal.placeholder}`);
    restored = restored.replace(literal.placeholder, literal.value);
  }
  return restored;
}

export function analyzePreprocessEligibility(text) {
  const source = String(text || "").trim();
  if (!source) return { lane: "exact", reason: "empty-input", bartAllowed: false };
  const { literals } = protectExactSpans(source);
  const exactCharacters = literals.reduce((sum, item) => sum + item.value.length, 0);
  const exactShare = source.length > 0 ? exactCharacters / source.length : 1;
  const hasFencedCode = literals.some((item) => item.type === "fenced-code");
  const highRisk = LEGAL_MARKERS.test(source) || CODE_MARKERS.test(source) || EQUATION_MARKERS.test(source);
  if (source.length < 120) return { lane: "exact", reason: "short-input", bartAllowed: false, exactShare };
  if (hasFencedCode || highRisk || exactShare >= 0.35) {
    return { lane: "exact", reason: hasFencedCode ? "fenced-code" : highRisk ? "exact-semantics" : "literal-density", bartAllowed: false, exactShare };
  }
  if (literals.length > 0) return { lane: "mixed", reason: "protected-literals", bartAllowed: true, exactShare };
  return { lane: "prose", reason: "compressible-prose", bartAllowed: true, exactShare: 0 };
}

export function buildPreprocessCacheKey({ source, modelId, modelRevision = "unknown", parameters = {}, route } = {}) {
  if (typeof source !== "string" || !source) throw new Error("source is required");
  if (typeof modelId !== "string" || !modelId) throw new Error("modelId is required");
  return `16xvs:preprocess:${canonicalHash({
    policyVersion: POLICY_VERSION,
    sourceSha256: sha256(source),
    modelId,
    modelRevision,
    parameters,
    route,
  })}`;
}

export function planPreprocessing({ text, modelId, modelRevision = "unknown", parameters = {} } = {}) {
  const source = String(text || "");
  const route = analyzePreprocessEligibility(source);
  const protectedPayload = protectExactSpans(source);
  return {
    policyVersion: POLICY_VERSION,
    sourceSha256: sha256(source),
    route,
    protectedText: route.bartAllowed ? protectedPayload.protectedText : source,
    literals: route.bartAllowed ? protectedPayload.literals : [],
    cacheKey: buildPreprocessCacheKey({ source, modelId, modelRevision, parameters, route: route.lane }),
    requiresRetentionGate: route.bartAllowed,
    requiresSemanticVerifier: route.bartAllowed,
  };
}

export function verifyPreprocessRetention({ source, candidate, literals = [], maxExpansionRatio = 1.05 } = {}) {
  const original = String(source || "").trim();
  const output = String(candidate || "").trim();
  const failures = [];
  if (!output) failures.push("empty-candidate");
  if (original && output.length / original.length > maxExpansionRatio) failures.push("candidate-expanded");
  for (const literal of literals) {
    if (!output.includes(literal.value)) failures.push(`missing-literal:${literal.type}:${literal.sha256.slice(0, 12)}`);
  }
  const sourceNumbers = extractNumberTokens(original);
  const outputNumbers = extractNumberTokens(output);
  if (JSON.stringify(sourceNumbers) !== JSON.stringify(outputNumbers)) failures.push("number-set-changed");
  if (JSON.stringify(criticalNegationProfile(original)) !== JSON.stringify(criticalNegationProfile(output))) failures.push("negation-changed");
  if (JSON.stringify(countTerms(original, OBLIGATIONS)) !== JSON.stringify(countTerms(output, OBLIGATIONS))) failures.push("obligation-changed");
  return {
    accepted: failures.length === 0,
    failures,
    sourceSha256: sha256(original),
    candidateSha256: sha256(output),
    sourceCharacters: original.length,
    candidateCharacters: output.length,
    characterReductionRatio: original.length > 0 ? Number((1 - output.length / original.length).toFixed(6)) : 0,
    policyVersion: POLICY_VERSION,
  };
}

export { POLICY_VERSION };
