import assert from "node:assert/strict";
import test from "node:test";

import { inferRouteIdForCorpus } from "../core/auto-route.mjs";
import {
  buildMegaBookLadderFixture,
  evaluateMegaBookLadder,
} from "../core/mega-book-ladder.mjs";

function hexFromByte(value) {
  return value.toString(16).padStart(2, "0").repeat(32);
}

const fakeEncoder = {
  signature(text) {
    const folded = String(text).toLowerCase();
    if (folded.includes("atlas")) return { signatureHex: hexFromByte(0x00), patchCount: 3 };
    if (folded.includes("beacon")) return { signatureHex: hexFromByte(0x0f), patchCount: 3 };
    if (folded.includes("cinder")) return { signatureHex: hexFromByte(0xf0), patchCount: 3 };
    return { signatureHex: hexFromByte(0xff), patchCount: 3 };
  },
};

test("buildMegaBookLadderFixture creates folded book roots with chapter evidence groups", () => {
  const fixture = buildMegaBookLadderFixture();

  assert.equal(fixture.books.length, 3);
  assert.equal(fixture.corpus.length, 12);
  assert.equal(fixture.semanticGroups.length, 3);
  assert.ok(fixture.corpus.every((entry) => entry.split(/\s+/).length >= 220));

  const route = inferRouteIdForCorpus(fixture.corpus);
  assert.equal(route.routeId, "bookRoot");
  assert.equal(route.confidenceGuard.accepted, true);
});

test("evaluateMegaBookLadder measures root-to-own-chapter separation against outside chapters", () => {
  const fixture = buildMegaBookLadderFixture();
  const ladder = evaluateMegaBookLadder({
    books: fixture.books,
    encoder: fakeEncoder,
  });

  assert.equal(ladder.summary.bookCount, 3);
  assert.equal(ladder.summary.chapterCount, 9);
  assert.equal(ladder.summary.allRootChapterMarginsPositive, true);
  assert.ok(ladder.summary.minRootChapterMargin > 0);
  assert.equal(ladder.books.length, 3);
});
