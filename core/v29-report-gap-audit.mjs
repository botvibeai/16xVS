import crypto from "node:crypto";

export const V29_CLAIM_STATUSES = {
  PROVEN: "proven",
  DIRECTIONAL: "directional",
  LOCAL_PROOF_ONLY: "local-proof-only",
  DEFERRED: "deferred",
  UNSUPPORTED: "unsupported",
};

export const REQUIRED_REPORT_SECTION_IDS = [
  "architecture-10",
  "bart-pipeline",
  "memory-architecture",
  "scaling-behavior",
  "fold-mechanism",
  "cognitive-stack",
];

const ARCHITECTURE_CLAIMS = [
  {
    id: "hard-route-gating",
    title: "Hard-Constraint Route Gating",
    patterns: ["hard-constraint route gating", "strict hard-gate"],
    status: V29_CLAIM_STATUSES.LOCAL_PROOF_ONLY,
    currentEvidence: "V27 route-gated proof and V28 runtime contract proof cover this locally.",
    nextProofRequired:
      "Implement and test the same lane gate at the Worker entry contract before production use.",
  },
  {
    id: "wasm-simd-hamming",
    title: "SIMD-Accelerated Hamming Distance Kernels",
    patterns: ["simd-accelerated hamming", "wasm simd", "i64x2.popcnt"],
    status: V29_CLAIM_STATUSES.DEFERRED,
    currentEvidence: "No Wasm SIMD kernel is implemented in the current proof harness.",
    nextProofRequired:
      "Add a local Wasm SIMD distance kernel and benchmark it against the JS Hamming path.",
  },
  {
    id: "matryoshka-compaction",
    title: "Matryoshka-Style Embedding Compaction",
    patterns: ["matryoshka-style embedding", "truncate tokens", "full precision"],
    status: V29_CLAIM_STATUSES.DEFERRED,
    currentEvidence: "No nested short/full binary-token representation is implemented.",
    nextProofRequired:
      "Add a compact-vs-full retrieval probe that measures fast-path recall and reconstruction fidelity.",
  },
  {
    id: "h-mhsa",
    title: "Intra-Lane Local-Relationship Modeling",
    patterns: ["intra-lane local-relationship", "hierarchical multi-head self-attention", "h-mhsa"],
    status: V29_CLAIM_STATUSES.DEFERRED,
    currentEvidence: "Current heads are routed specialists, not H-MHSA models.",
    nextProofRequired:
      "Build a controlled local/global relationship probe before changing model architecture.",
  },
  {
    id: "lane-ownership-policies",
    title: "Explicit Lane-Ownership Policies",
    patterns: ["explicit lane-ownership", "head", "whitelist"],
    status: V29_CLAIM_STATUSES.LOCAL_PROOF_ONLY,
    currentEvidence: "V27 route policy and V28 runtime policy contracts enforce local lane ownership.",
    nextProofRequired:
      "Promote the local policy to a Worker-entry contract only after deployment-specific tests exist.",
  },
  {
    id: "ste-temperature-decay",
    title: "STE Gradient Fine-Tuning",
    patterns: ["straight-through estimator", "temperature decay", "sign_ste"],
    status: V29_CLAIM_STATUSES.LOCAL_PROOF_ONLY,
    currentEvidence: "V28 includes a controlled STE temperature-decay simulation only.",
    nextProofRequired:
      "Apply the temperature schedule to an actual training run and compare holdout drift.",
  },
  {
    id: "zero-copy-typedarray",
    title: "Zero-Copy Typed Array Buffering",
    patterns: ["zero-copy typed array", "arraybuffer", "shared memory"],
    status: V29_CLAIM_STATUSES.DEFERRED,
    currentEvidence: "No zero-copy JS-to-Wasm data path exists yet.",
    nextProofRequired:
      "Add a zero-copy TypedArray fixture and verify no serialization or buffer cloning is used.",
  },
  {
    id: "durable-object-sharding",
    title: "Durable Object Sharded State Coordination",
    patterns: ["durable object sharded", "sqlite-backed durable objects", "lane-locking"],
    status: V29_CLAIM_STATUSES.DEFERRED,
    currentEvidence: "V28 is local only and does not modify Cloudflare Durable Objects.",
    nextProofRequired:
      "Add a local DO-shard design proof, then a Worker integration test before deployment.",
  },
  {
    id: "qjl-error-correction",
    title: "QJL Error-Correction",
    patterns: ["qjl", "johnson-lindenstrauss", "error-correction"],
    status: V29_CLAIM_STATUSES.DEFERRED,
    currentEvidence: "No QJL checker or repair path is implemented.",
    nextProofRequired:
      "Create a QJL-only repair probe for quote, blind, and stress failures without changing V23/V27/V28 locks.",
  },
  {
    id: "cold-path-fallback",
    title: "Cold-Path Failure Fallback",
    patterns: ["cold-path failure fallback", "failed patches", "higher-precision"],
    status: V29_CLAIM_STATUSES.LOCAL_PROOF_ONLY,
    currentEvidence: "V28 proves patch-local fallback in the local harness only.",
    nextProofRequired:
      "Connect fallback to a real high-precision path and prove sequence-level behavior on held-out failures.",
  },
];

const ADDITIONAL_CLAIMS = [
  {
    id: "bart-preprocessing",
    title: "BART Preprocessing Pipeline",
    patterns: ["bart", "linguistic noise", "raw input"],
    status: V29_CLAIM_STATUSES.DEFERRED,
    currentEvidence: "No BART dependency, command, or measured preprocessing probe exists in the repo.",
    nextProofRequired:
      "Run a controlled BART-vs-no-BART fingerprint test across quotes, legal text, code, and long-form passages.",
  },
  {
    id: "tokentax0-normalizer",
    title: "TokenTax0 Normalizer Pipeline",
    patterns: ["tokentax0", "normalizer", "code"],
    status: V29_CLAIM_STATUSES.DEFERRED,
    currentEvidence: "TokenTax0 is described in the report but not wired into this proof harness.",
    nextProofRequired:
      "Add a normalizer-only fixture and verify code/morphology preservation before 16xVS folding.",
  },
  {
    id: "keeper-throwaway-memory",
    title: "Keepers vs Throwaways Memory Architecture",
    patterns: ["keepers", "throwaways", "permanent storage"],
    status: V29_CLAIM_STATUSES.DEFERRED,
    currentEvidence: "The repo has proof artifacts and snapshots, but not the described two-tier semantic memory runtime.",
    nextProofRequired:
      "Define a local memory schema and test keeper/throwaway routing without external systems.",
  },
  {
    id: "data-growth-scaling",
    title: "Data Growth Scaling Behavior",
    patterns: ["unique meanings", "compression ratio", "routing accuracy"],
    status: V29_CLAIM_STATUSES.UNSUPPORTED,
    currentEvidence: "Current corpora are too small and controlled to prove asymptotic scaling behavior.",
    nextProofRequired:
      "Run a multi-size corpus sweep and show unique-fingerprint flattening, compression, and routing trends.",
  },
  {
    id: "fold-mechanism",
    title: "Fold Mechanism",
    patterns: ["fold mechanism", "unfolded", "semantic skeleton"],
    status: V29_CLAIM_STATUSES.DIRECTIONAL,
    currentEvidence:
      "V18/V27 fold-lineage evidence supports parent-child retrieval shape in controlled fixtures.",
    nextProofRequired:
      "Prove unfolding quality on independent held-out content before claiming reversible reconstruction.",
  },
  {
    id: "cognitive-stack",
    title: "Cognitive Stack",
    patterns: ["cognitive stack", "linea-1", "rememory"],
    status: V29_CLAIM_STATUSES.DEFERRED,
    currentEvidence: "This is architecture strategy, not implemented in the local 16xVS proof harness.",
    nextProofRequired:
      "Define local interfaces before connecting 16xVS evidence to agent memory or orchestration layers.",
  },
];

const CLAIMS_NOT_ALLOWED = [
  {
    id: "reversibility",
    title: "Reversible Fold",
    status: V29_CLAIM_STATUSES.UNSUPPORTED,
    reason: "Fold-lineage currently shows routing/root-handle behavior, not lossless reversal.",
  },
  {
    id: "lossless-unfolding",
    title: "Lossless Unfolding",
    status: V29_CLAIM_STATUSES.UNSUPPORTED,
    reason: "No independent unfold-quality benchmark exists.",
  },
  {
    id: "broad-tokenizer-superiority",
    title: "Broad Tokenizer Superiority",
    status: V29_CLAIM_STATUSES.UNSUPPORTED,
    reason: "Current results are controlled and directional, with blind/stress/quote failures still negative.",
  },
  {
    id: "99.99-storage-reduction",
    title: "99.99% Storage Reduction",
    status: V29_CLAIM_STATUSES.UNSUPPORTED,
    reason: "Current status explicitly does not support this raw-source storage claim.",
  },
  {
    id: "1.25gb-collapse",
    title: "1.25 GB Corpus Collapse",
    status: V29_CLAIM_STATUSES.UNSUPPORTED,
    reason: "The repo only supports a smaller directional storage envelope, not the broad corpus-collapse claim.",
  },
  {
    id: "bart-preserves-meaning",
    title: "BART Preserves Meaning Without Measured Loss",
    status: V29_CLAIM_STATUSES.UNSUPPORTED,
    reason: "BART has not been tested against quote, legal, code, blind, or stress fixtures in this repo.",
  },
];

function lower(text) {
  return String(text || "").toLowerCase();
}

function containsAll(text, patterns) {
  const haystack = lower(text);
  return patterns.every((pattern) => haystack.includes(lower(pattern)));
}

function containsAny(text, patterns) {
  const haystack = lower(text);
  return patterns.some((pattern) => haystack.includes(lower(pattern)));
}

function sha256(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

export function normalizeReportText(rawText = "") {
  const replacements = new Map([
    ["\uFEFF", ""],
    ["â€”", "-"],
    ["â€“", "-"],
    ["â€‘", "-"],
    ["â€", "-"],
    ["â€œ", "\""],
    ["â€", "\""],
    ["â€˜", "'"],
    ["â€™", "'"],
    ["â†’", "->"],
    ["â€¦", "..."],
    ["â­", "*"],
    ["â‰ ", "!="],
    ["Â²", "^2"],
    ["âµ", "5"],
    ["â¶", "6"],
    ["Â", ""],
  ]);
  let out = String(rawText || "").normalize("NFKC").replace(/\r\n/g, "\n");
  for (const [from, to] of replacements) {
    out = out.split(from).join(to);
  }
  return out.replace(/[ \t]+\n/g, "\n").trim();
}

export function extractReportSections(normalizedText = "") {
  const architectureItems = ARCHITECTURE_CLAIMS.map((claim) => ({
    id: claim.id,
    title: claim.title,
    detected: containsAny(normalizedText, claim.patterns),
  }));
  const sectionChecks = [
    {
      id: "architecture-10",
      detected: architectureItems.every((item) => item.detected),
    },
    {
      id: "bart-pipeline",
      detected:
        containsAny(normalizedText, ["bart as a linguistic", "bart trims the words"]) &&
        containsAny(normalizedText, ["raw input", "raw prompt"]),
    },
    {
      id: "memory-architecture",
      detected: containsAll(normalizedText, ["memory architecture", "keepers", "throwaways"]),
    },
    {
      id: "scaling-behavior",
      detected: containsAny(normalizedText, [
        "scaling and emergent behavior",
        "unique meanings vs total data",
        "routing accuracy vs data size",
      ]),
    },
    {
      id: "fold-mechanism",
      detected:
        containsAny(normalizedText, ["fold mechanism", "\"fold\" mechanism"]) &&
        containsAll(normalizedText, ["folded", "semantic skeleton"]),
    },
    {
      id: "cognitive-stack",
      detected: containsAll(normalizedText, ["cognitive stack", "linea-1", "16xvs"]),
    },
  ];
  const detectedSectionIds = sectionChecks
    .filter((section) => section.detected)
    .map((section) => section.id);
  const missingSectionIds = REQUIRED_REPORT_SECTION_IDS.filter(
    (id) => !detectedSectionIds.includes(id)
  );

  return {
    schemaVersion: "v29-report-section-detection-v1",
    detectedSectionIds,
    missingSectionIds,
    architectureItems,
  };
}

export function classifyReportClaims(normalizedText = "") {
  const allClaims = [...ARCHITECTURE_CLAIMS, ...ADDITIONAL_CLAIMS];
  return allClaims.map((claim) => ({
    id: claim.id,
    title: claim.title,
    status: claim.status,
    detectedInReport: containsAny(normalizedText, claim.patterns),
    currentEvidence: claim.currentEvidence,
    nextProofRequired: claim.nextProofRequired,
  }));
}

function buildStatusCounts(claims) {
  const counts = Object.fromEntries(Object.values(V29_CLAIM_STATUSES).map((status) => [status, 0]));
  for (const claim of claims) counts[claim.status] = (counts[claim.status] || 0) + 1;
  return counts;
}

export function buildV29GapAudit({
  rawText = "",
  sourcePath = null,
  generatedAt = new Date().toISOString(),
} = {}) {
  const normalizedText = normalizeReportText(rawText);
  const sections = extractReportSections(normalizedText);
  const claims = classifyReportClaims(normalizedText);
  const detectedClaims = claims.filter((claim) => claim.detectedInReport);

  return {
    schemaVersion: "v29-report-gap-audit-v1",
    generatedAt,
    claimLevel:
      sections.missingSectionIds.length === 0
        ? "evidence-governance-gap-audit"
        : "evidence-governance-gap-audit-incomplete",
    source: {
      path: sourcePath,
      rawSha256: sha256(rawText),
      normalizedSha256: sha256(normalizedText),
      rawBytes: Buffer.byteLength(String(rawText), "utf8"),
      normalizedBytes: Buffer.byteLength(normalizedText, "utf8"),
    },
    sections,
    claims,
    summary: {
      detectedClaimCount: detectedClaims.length,
      totalClaimCount: claims.length,
      statusCounts: buildStatusCounts(claims),
      v23Locked: true,
      v27Locked: true,
      v28Locked: true,
      noDeploy: true,
      noExternalCalls: true,
    },
    claimsNotAllowed: CLAIMS_NOT_ALLOWED.map((claim) => ({
      ...claim,
      allowed: false,
    })),
    read:
      "V29 is a proof-vs-claim audit of the supplied report. It does not promote deferred or unsupported report claims into implementation proof.",
  };
}
