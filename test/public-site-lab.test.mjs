import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import worker, { analyzePublicCompression, detectLanguageTags, estimateBpeTokens } from "../src/index.js";

const repoRoot = process.cwd();

async function readAsset(file) {
  return readFile(path.join(repoRoot, "assets", file), "utf8");
}

test("public lab estimates BPE and 16xVS counts without storing prompt text", () => {
  const text = "Chapter 1: This is a measured compression proof. ".repeat(80);
  const result = analyzePublicCompression(text);

  assert.equal(result.ok, true);
  assert.equal(result.source.storedPrompt, false);
  assert.ok(result.metrics.bpeTokens > 700);
  assert.ok(result.metrics.equivalent16xvsTokens >= 1);
  assert.ok(result.metrics.ratio >= 300);
  assert.equal(result.metrics.claimLevel, "public-estimate");
});

test("public lab adds residual safety token for code or secret-like text", () => {
  const result = analyzePublicCompression("api_key = secret_token_value; do not deploy this { config }".repeat(10));

  assert.equal(result.ok, true);
  assert.equal(result.metrics.residualTokens, 1);
  assert.equal(result.metrics.confidence, "guarded");
  assert.match(result.warnings.join(" "), /residual safety token/i);
});

test("language detector covers Hindi Arabic Japanese and Russian examples", () => {
  assert.ok(detectLanguageTags("मुझे कल परामर्श बुक करना है").includes("hindi-devanagari"));
  assert.ok(detectLanguageTags("أحتاج إلى حجز استشارة").includes("arabic"));
  assert.ok(detectLanguageTags("明日の午後に相談したいです").includes("japanese-kana"));
  assert.ok(detectLanguageTags("Клиент хочет перенести встречу").includes("russian-cyrillic"));
});

test("BPE estimate returns a useful positive count for multilingual text", () => {
  assert.ok(estimateBpeTokens("Book a consultation tomorrow") > 0);
  assert.ok(estimateBpeTokens("मुझे कल परामर्श बुक करना है") > 0);
  assert.ok(estimateBpeTokens("أحتاج إلى حجز استشارة") > 0);
  assert.ok(estimateBpeTokens("Клиент хочет перенести встречу") > 0);
});

test("public marketing pages include live lab calculator proof and audit CTAs", async () => {
  const home = await readAsset("index.html");
  const lab = await readAsset("live-compression-lab/index.html");
  const calculator = await readAsset("llm-token-saving-calculator/index.html");
  const proof = await readAsset("proof/index.html");
  const hindi = await readAsset("hindi/index.html");
  const russian = await readAsset("russian/index.html");
  const arabic = await readAsset("arabic/index.html");

  assert.match(home, /Run the live compression proof/i);
  assert.match(home, /300x-400x/i);
  assert.match(home, /Private Compression Audit/i);
  assert.match(lab, /BPE to 16xVS count, live/i);
  assert.match(lab, /Copy-paste examples/i);
  assert.match(calculator, /LLM token saving calculator/i);
  assert.match(proof, /Proof boundary/i);
  assert.match(hindi, /Hindi and Hinglish AI token cost reduction/i);
  assert.match(russian, /Russian AI token savings/i);
  assert.match(arabic, /Arabic AI token savings/i);
});

test("localized launch pages declare route locale security copy and hreflang", async () => {
  const hindi = await readAsset("hindi/index.html");
  const russian = await readAsset("russian/index.html");
  const arabic = await readAsset("arabic/index.html");

  assert.match(hindi, /data-locale="hindi"/);
  assert.match(hindi, /hreflang="hi"/);
  assert.match(hindi, /No raw prompt storage in public lab/i);
  assert.match(hindi, /Patent pending/i);

  assert.match(russian, /data-locale="russian"/);
  assert.match(russian, /hreflang="ru"/);
  assert.match(russian, /Cyrillic detection/i);
  assert.match(russian, /Audit before production claims/i);

  assert.match(arabic, /lang="ar" dir="rtl"/);
  assert.match(arabic, /data-locale="arabic"/);
  assert.match(arabic, /hreflang="ar"/);
  assert.match(arabic, /RTL page support/i);
});

test("public site copy avoids unsupported universal 700-to-1 marketing claim", async () => {
  const files = [
    await readAsset("index.html"),
    await readAsset("live-compression-lab/index.html"),
    await readAsset("llm-token-saving-calculator/index.html"),
    await readAsset("proof/index.html"),
    await readAsset("hindi/index.html"),
    await readAsset("russian/index.html"),
    await readAsset("arabic/index.html"),
    await readAsset("site.js"),
  ].join("\n");

  assert.doesNotMatch(files, /700\s*(?:to|->|:)?\s*1/i);
  assert.doesNotMatch(files, /48,?000x/i);
  assert.doesNotMatch(files, /universal tokenizer replacement/i);
});

test("browser bundle does not expose local proof estimator fallback", async () => {
  const site = await readAsset("site.js");

  assert.doesNotMatch(site, /estimateBpeTokensLocal/);
  assert.doesNotMatch(site, /detectLanguagesLocal/);
  assert.doesNotMatch(site, /analyzeLocal/);
  assert.doesNotMatch(site, /let effectiveRatio\s*=/);
});

test("advertising URL aliases redirect to the public lab and calculator pages", async () => {
  const labResponse = await worker.fetch(new Request("https://16xvs.com/bpe-to-16xvs-token-counter"), {});
  const calcResponse = await worker.fetch(new Request("https://16xvs.com/ai-token-compression-calculator"), {});

  assert.equal(labResponse.status, 302);
  assert.equal(labResponse.headers.get("location"), "https://16xvs.com/live-compression-lab/");
  assert.equal(calcResponse.status, 302);
  assert.equal(calcResponse.headers.get("location"), "https://16xvs.com/llm-token-saving-calculator/");
});

test("production CORS allows 16xvs origins and blocks hostile origins", async () => {
  const allowed = await worker.fetch(
    new Request("https://16xvs.com/api/lab/analyze", {
      method: "OPTIONS",
      headers: {
        origin: "https://16xvs.com",
        "access-control-request-method": "POST",
      },
    }),
    {}
  );
  const hostile = await worker.fetch(
    new Request("https://16xvs.com/api/lab/analyze", {
      method: "OPTIONS",
      headers: {
        origin: "https://evil.example",
        "access-control-request-method": "POST",
      },
    }),
    {}
  );

  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("access-control-allow-origin"), "https://16xvs.com");
  assert.equal(hostile.status, 403);
  assert.notEqual(hostile.headers.get("access-control-allow-origin"), "https://evil.example");
});

test("production POC endpoints require admin access before public launch", async () => {
  const response = await worker.fetch(
    new Request("https://16xvs.com/api/ingest", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://16xvs.com",
      },
      body: "{}",
    }),
    {}
  );
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.ok, false);
  assert.equal(body.error.reason, "public-proof-api-only");
});

test("sensitive repository paths cannot be served as static assets", async () => {
  const env = {
    ASSETS: {
      fetch: async () => new Response("should not be public", { status: 200 }),
    },
  };

  for (const pathname of [
    "/core/v33-707-hammer.mjs",
    "/bench/private/summary.json",
    "/src/index.js",
    "/data/private.json",
    "/wrangler.jsonc",
    "/.git/config",
  ]) {
    const response = await worker.fetch(new Request(`https://16xvs.com${pathname}`), env);
    assert.equal(response.status, 404, pathname);
  }
});

test("public responses include launch security headers", async () => {
  const env = {
    ASSETS: {
      fetch: async () => new Response("<!doctype html><title>16xVS</title>", { headers: { "content-type": "text/html" } }),
    },
  };

  const assetResponse = await worker.fetch(new Request("https://16xvs.com/"), env);
  const jsonResponse = await worker.fetch(new Request("https://16xvs.com/core/v33-707-hammer.mjs"), env);

  assert.match(assetResponse.headers.get("content-security-policy") || "", /frame-ancestors 'none'/);
  assert.equal(assetResponse.headers.get("x-frame-options"), "DENY");
  assert.equal(assetResponse.headers.get("x-content-type-options"), "nosniff");
  assert.match(jsonResponse.headers.get("content-security-policy") || "", /default-src 'self'/);
});
