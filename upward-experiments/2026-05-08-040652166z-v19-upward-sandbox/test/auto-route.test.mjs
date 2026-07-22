import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  inferRouteIdForCorpus,
  inferRouteIdForText,
} from "../core/auto-route.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");

function readCorpus(relativePath) {
  return fs
    .readFileSync(path.join(projectRoot, relativePath), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

test("inferRouteIdForText chooses bookRoot for tokenizer and book-scale folding language", () => {
  const route = inferRouteIdForText(
    "A 16xVS visual patch tokenizer should fold book-scale multilingual chapters into compact macro records."
  );

  assert.equal(route.routeId, "bookRoot");
  assert.equal(route.selectedHead, "bookRoot");
});

test("inferRouteIdForText separates governance and archive operations", () => {
  const governance = inferRouteIdForText(
    "The legal hold and retention policy require audit evidence, access review, deletion exception handling, and compliance attestation."
  );
  const archive = inferRouteIdForText(
    "Archive catalog rebuild, replication repair, degraded shard recovery, vault fallback, and retrieval operations keep the long-form archive healthy."
  );

  assert.equal(governance.routeId, "governance");
  assert.equal(governance.selectedHead, "governance");
  assert.equal(archive.routeId, "archive");
  assert.equal(archive.selectedHead, "governance");
});

test("inferRouteIdForCorpus falls back to default for weak route evidence", () => {
  const route = inferRouteIdForCorpus([
    "A general customer-service appointment setter answers basic questions.",
    "The user can schedule a call or receive an email follow-up.",
  ]);

  assert.equal(route.routeId, "default");
  assert.equal(route.selectedHead, "default");
});

test("inferRouteIdForCorpus keeps folded book-root entries on the bookRoot specialist", () => {
  const route = inferRouteIdForCorpus(readCorpus("bench/book-root-corpus-2026-05-06.txt"));

  assert.equal(route.routeId, "bookRoot");
  assert.equal(route.selectedHead, "bookRoot");
  assert.equal(route.confidenceGuard.accepted, true);
});

test("inferRouteIdForCorpus rejects split booklike entries as unsafe for the bookRoot specialist", () => {
  const route = inferRouteIdForCorpus(readCorpus("bench/booklike-corpus-2026-04-25.txt"));

  assert.equal(route.candidateRouteId, "bookRoot");
  assert.equal(route.routeId, "default");
  assert.equal(route.selectedHead, "default");
  assert.equal(route.confidenceGuard.accepted, false);
  assert.match(route.confidenceGuard.reason, /bookRoot corpus shape/i);
});
