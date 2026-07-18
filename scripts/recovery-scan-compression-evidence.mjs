import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const SKIP_DIRS = new Set([".git", "node_modules", ".npm-cache", ".wrangler", "recovery-output"]);
const TEXT_EXTENSIONS = new Set([".json", ".jsonc", ".md", ".txt", ".log", ".csv", ".mjs", ".js"]);
const RATIO_KEYS = new Set([
  "ratio",
  "compressionratio",
  "averagecompressionratio",
  "effectivecompressionratio",
  "foldratio",
  "bperatio",
]);
const SOURCE_KEYS = ["sourceTokens", "sourceBpe", "averageSourceBpe", "inputTokens", "bpeTokens"];
const OUTPUT_KEYS = ["outputTokens", "equivalentOutputTokens", "averageEquivalentOutputTokens", "foldTokens"];

function parseArgs(argv) {
  const args = {
    root: projectRoot,
    output: path.join(projectRoot, "recovery-output", "compression-evidence-scan.json"),
    minRatio: 200,
    maxBytes: 64 * 1024 * 1024,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--root" && argv[index + 1]) args.root = path.resolve(argv[++index]);
    else if (current === "--output" && argv[index + 1]) args.output = path.resolve(argv[++index]);
    else if (current === "--min-ratio" && argv[index + 1]) args.minRatio = Number(argv[++index]);
    else if (current === "--max-bytes" && argv[index + 1]) args.maxBytes = Number(argv[++index]);
  }
  if (!Number.isFinite(args.minRatio) || args.minRatio <= 0) throw new Error("--min-ratio must be positive");
  if (!Number.isFinite(args.maxBytes) || args.maxBytes <= 0) throw new Error("--max-bytes must be positive");
  return args;
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function sha256File(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function walk(root, current = root, out = []) {
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) await walk(root, fullPath, out);
    } else if (entry.isFile()) {
      out.push(fullPath);
    }
  }
  return out;
}

function normalizeKey(key) {
  return String(key).replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function finitePositive(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function findFirstNumeric(object, keys) {
  for (const key of keys) {
    const value = finitePositive(object?.[key]);
    if (value !== null) return { key, value };
  }
  return null;
}

function evidenceFromObject(value, pointer = "$", out = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    value.forEach((item, index) => evidenceFromObject(item, `${pointer}[${index}]`, out));
    return out;
  }

  const source = findFirstNumeric(value, SOURCE_KEYS);
  const output = findFirstNumeric(value, OUTPUT_KEYS);
  if (source && output) {
    out.push({
      kind: "derived-token-ratio",
      pointer,
      ratio: source.value / output.value,
      sourceKey: source.key,
      sourceValue: source.value,
      outputKey: output.key,
      outputValue: output.value,
    });
  }

  for (const [key, child] of Object.entries(value)) {
    const normalized = normalizeKey(key);
    if (RATIO_KEYS.has(normalized)) {
      const ratio = finitePositive(child);
      if (ratio !== null) out.push({ kind: "declared-ratio", pointer: `${pointer}.${key}`, ratio, key });
    }
    if (child && typeof child === "object") evidenceFromObject(child, `${pointer}.${key}`, out);
  }
  return out;
}

function evidenceFromText(text) {
  const out = [];
  const patterns = [
    /\b(\d{2,9}(?:\.\d+)?)\s*(?:x|×|:1|to\s+1)\b/gi,
    /\bcompression(?:\s+ratio)?\s*[:=]\s*(\d{2,9}(?:\.\d+)?)/gi,
    /\b(?:source|input)\s*(?:bpe|tokens?)?\s*[:=]\s*(\d{1,12}(?:\.\d+)?)\b[^\n]{0,120}\b(?:output|fold|equivalent)\s*(?:tokens?)?\s*[:=]\s*(\d{1,12}(?:\.\d+)?)/gi,
  ];
  for (const [patternIndex, pattern] of patterns.entries()) {
    for (const match of text.matchAll(pattern)) {
      if (patternIndex < 2) {
        const ratio = finitePositive(match[1]);
        if (ratio !== null) out.push({ kind: "text-ratio", ratio, excerpt: match[0].slice(0, 180) });
      } else {
        const source = finitePositive(match[1]);
        const output = finitePositive(match[2]);
        if (source !== null && output !== null) {
          out.push({ kind: "text-derived-token-ratio", ratio: source / output, sourceValue: source, outputValue: output, excerpt: match[0].slice(0, 180) });
        }
      }
    }
  }
  return out;
}

function classify(relativePath) {
  const lower = relativePath.toLowerCase();
  if (lower.includes("vault-snapshot") || lower.endsWith(".zip") || lower.endsWith(".16xvsvault")) return "vault";
  if (lower.includes("model")) return "model";
  if (lower.includes("bench") || lower.includes("proof") || lower.includes("eval")) return "benchmark";
  if (lower.includes("ledger") || lower.includes("manifest") || lower.includes("report")) return "evidence";
  return "other";
}

function confidence(item, relativePath) {
  let score = 0;
  if (item.kind === "derived-token-ratio") score += 4;
  else if (item.kind === "declared-ratio") score += 3;
  else if (item.kind === "text-derived-token-ratio") score += 2;
  else score += 1;
  const category = classify(relativePath);
  if (category === "benchmark") score += 3;
  if (category === "evidence") score += 2;
  if (/summary|evaluation|manifest|ledger|proof/i.test(relativePath)) score += 2;
  return score;
}

async function scanFile(root, filePath, args) {
  const stats = await fs.stat(filePath);
  if (stats.size > args.maxBytes) return null;
  const extension = path.extname(filePath).toLowerCase();
  if (!TEXT_EXTENSIONS.has(extension)) return null;

  const text = await fs.readFile(filePath, "utf8");
  const relativePath = path.relative(root, filePath).replace(/\\/g, "/");
  let found = [];
  if (extension === ".json") {
    try {
      found.push(...evidenceFromObject(JSON.parse(text)));
    } catch {
      // Keep scanning as text. Damaged or partial JSON may still contain useful evidence.
    }
  }
  found.push(...evidenceFromText(text));
  found = found
    .filter((item) => Number.isFinite(item.ratio) && item.ratio >= args.minRatio)
    .map((item) => ({ ...item, ratio: Math.round(item.ratio * 10000) / 10000 }));
  if (found.length === 0) return null;

  const fileSha256 = await sha256File(filePath);
  return {
    path: relativePath,
    category: classify(relativePath),
    bytes: stats.size,
    modifiedAt: stats.mtime.toISOString(),
    sha256: fileSha256,
    findings: found
      .map((item) => ({ ...item, confidence: confidence(item, relativePath) }))
      .sort((left, right) => right.confidence - left.confidence || right.ratio - left.ratio),
  };
}

export async function scanCompressionEvidence(options = {}) {
  const args = {
    root: path.resolve(options.root || projectRoot),
    output: options.output ? path.resolve(options.output) : null,
    minRatio: options.minRatio ?? 200,
    maxBytes: options.maxBytes ?? 64 * 1024 * 1024,
  };
  if (!(await exists(args.root))) throw new Error(`scan root does not exist: ${args.root}`);
  const files = await walk(args.root);
  const results = [];
  for (const filePath of files) {
    const result = await scanFile(args.root, filePath, args);
    if (result) results.push(result);
  }

  const flat = results.flatMap((file) => file.findings.map((finding) => ({ path: file.path, sha256: file.sha256, category: file.category, ...finding })));
  flat.sort((left, right) => right.confidence - left.confidence || right.ratio - left.ratio || left.path.localeCompare(right.path));
  const report = {
    schemaVersion: "16xvs-compression-evidence-scan-v1",
    generatedAt: new Date().toISOString(),
    root: args.root,
    policy: { readOnly: true, minRatio: args.minRatio, maxBytes: args.maxBytes },
    scannedFileCount: files.length,
    matchedFileCount: results.length,
    findingCount: flat.length,
    thresholds: {
      atLeast220: flat.filter((item) => item.ratio >= 220).length,
      atLeast300: flat.filter((item) => item.ratio >= 300).length,
      atLeast700: flat.filter((item) => item.ratio >= 700).length,
      atLeast2400: flat.filter((item) => item.ratio >= 2400).length,
      atLeast80000: flat.filter((item) => item.ratio >= 80000).length,
    },
    strongestFindings: flat.slice(0, 250),
    files: results,
  };
  if (args.output) {
    await fs.mkdir(path.dirname(args.output), { recursive: true });
    await fs.writeFile(args.output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  return report;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await scanCompressionEvidence(args);
  console.log(JSON.stringify({
    ok: true,
    output: args.output,
    scannedFileCount: report.scannedFileCount,
    matchedFileCount: report.matchedFileCount,
    findingCount: report.findingCount,
    thresholds: report.thresholds,
    strongestFindings: report.strongestFindings.slice(0, 20),
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 1;
  });
}
