const MIN_CHAPTER_WORDS = 230;

const BOOK_SPECS = [
  {
    id: "atlas_multilingual_storage",
    marker: "atlas",
    title: "Atlas multilingual storage book",
    theme:
      "multilingual visual patch storage, script-neutral tokenizer behavior, and compact book-root folding",
    chapters: [
      {
        title: "language-neutral intake",
        focus:
          "English, Arabic, Mandarin, symbols, and support records enter the same visual patch grammar without an English-first token tax",
      },
      {
        title: "storage economics",
        focus:
          "source records fold into macro signatures before replication, repair, and archive copies multiply the stored footprint",
      },
      {
        title: "renderer maintenance",
        focus:
          "new scripts and industry symbols should be handled by renderer updates instead of repeated vocabulary surgery",
      },
    ],
  },
  {
    id: "beacon_edge_retrieval",
    marker: "beacon",
    title: "Beacon edge retrieval book",
    theme:
      "edge-native retrieval, Hamming comparison, low-power search, and compact book-root routing",
    chapters: [
      {
        title: "binary retrieval",
        focus:
          "candidate search uses compact binary signatures so nearest-neighbor ranking stays cheap under long context pressure",
      },
      {
        title: "edge hardware",
        focus:
          "CPU-friendly bit operations and small memory movement matter before any accelerator roadmap can help",
      },
      {
        title: "search locality",
        focus:
          "folded book records preserve enough local retrieval shape to avoid exploding into window-level fragments",
      },
    ],
  },
  {
    id: "cinder_governance_archive",
    marker: "cinder",
    title: "Cinder governance archive book",
    theme:
      "legal hold governance, audit evidence, retention policy, archive catalog, and durable book-root evidence",
    chapters: [
      {
        title: "legal hold boundary",
        focus:
          "custodians, preservation notices, hold release checks, and deletion exceptions must stay separated from ordinary retention",
      },
      {
        title: "audit packet",
        focus:
          "control owners, access review evidence, compliance attestation, and governance certification need stable retrieval",
      },
      {
        title: "archive repair",
        focus:
          "catalog manifests, degraded shard repair, vault fallback, and replication health keep the evidence trail recoverable",
      },
    ],
  },
];

function wordCount(text) {
  const trimmed = String(text || "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function ensureMinimumWords(text, { marker, title, theme }, minWords = MIN_CHAPTER_WORDS) {
  const additions = [];
  while (wordCount([text, ...additions].join(" ")) < minWords) {
    additions.push(
      `The ${marker} ${title} chapter keeps repeating the same book-root identity so the folded 16xVS visual patch record has stable chapter evidence instead of a loose keyword match.`
    );
    additions.push(
      `This ${marker} section still uses distinct domain terms from ${theme} so another book should remain farther away than its own folded root.`
    );
  }
  return [text, ...additions].join(" ");
}

function buildChapter(book, chapter, chapterIndex) {
  const title = `${book.title} ${chapter.title}`;
  const base = [
    `The ${book.marker} ${chapter.title} chapter is part of a 16xVS book-root semantic ladder test.`,
    `It describes ${book.theme} while asking whether a visual patch tokenizer can fold chapter-scale evidence into a compact macro record.`,
    `The chapter focus is ${chapter.focus}.`,
    `This is not a generic paragraph; it is a controlled ${book.marker} chapter with repeated book identity, stable vocabulary, and a known parent book root.`,
    `The test expects the folded ${book.marker} book to stay closer to this chapter than to unrelated chapters from other books.`,
    `A successful result means the book-root signature retained enough chapter meaning to survive the fold instead of becoming an anonymous storage code.`,
    `Chapter ${chapterIndex + 1} also keeps the words tokenizer, visual patch, book-root, chapter-scale, binary code, Hamming comparison, archive evidence, and fold shape visible for routing pressure.`,
  ].join(" ");

  return {
    id: `${book.id}_chapter_${chapterIndex + 1}`,
    title,
    text: ensureMinimumWords(base, {
      marker: book.marker,
      title: chapter.title,
      theme: book.theme,
    }),
  };
}

function buildBook(spec) {
  const chapters = spec.chapters.map((chapter, index) => buildChapter(spec, chapter, index));
  const rootText = chapters.map((chapter) => chapter.text).join(" ");
  return {
    id: spec.id,
    marker: spec.marker,
    title: spec.title,
    root: {
      id: `${spec.id}_root`,
      title: `${spec.title} folded root`,
      text: rootText,
    },
    chapters,
  };
}

export function buildMegaBookLadderFixture() {
  const books = BOOK_SPECS.map(buildBook);
  const corpus = books.flatMap((book) => [
    book.root.text,
    ...book.chapters.map((chapter) => chapter.text),
  ]);
  const semanticGroups = books.map((book) => ({
    group: book.id,
    items: [book.root.text, ...book.chapters.map((chapter) => chapter.text)],
  }));

  return {
    books,
    corpus,
    semanticGroups,
  };
}

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
  return total + Math.abs(left.length - right.length) * 4;
}

function average(values) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(4));
}

function summarizeSignature(encoder, text) {
  const signature = encoder.signature(text);
  return {
    signatureHex: signature.signatureHex,
    patchCount: signature.patchCount,
  };
}

export function evaluateMegaBookLadder({ books, encoder } = {}) {
  if (!Array.isArray(books) || books.length === 0) {
    throw new Error("books are required.");
  }
  if (!encoder || typeof encoder.signature !== "function") {
    throw new Error("encoder.signature is required.");
  }

  const chapterEntries = books.flatMap((book) =>
    book.chapters.map((chapter) => ({
      bookId: book.id,
      chapterId: chapter.id,
      title: chapter.title,
      text: chapter.text,
      signature: summarizeSignature(encoder, chapter.text),
    }))
  );

  const reports = books.map((book) => {
    const rootSignature = summarizeSignature(encoder, book.root.text);
    const ownChapterDistances = chapterEntries
      .filter((entry) => entry.bookId === book.id)
      .map((entry) => ({
        chapterId: entry.chapterId,
        title: entry.title,
        distance: hammingHex(rootSignature.signatureHex, entry.signature.signatureHex),
        patchCount: entry.signature.patchCount,
      }));
    const outsideChapterDistances = chapterEntries
      .filter((entry) => entry.bookId !== book.id)
      .map((entry) => ({
        bookId: entry.bookId,
        chapterId: entry.chapterId,
        title: entry.title,
        distance: hammingHex(rootSignature.signatureHex, entry.signature.signatureHex),
      }))
      .sort((left, right) => left.distance - right.distance);
    const ownDistances = ownChapterDistances.map((entry) => entry.distance);
    const ownMax = Math.max(...ownDistances);
    const nearestOutside = outsideChapterDistances[0] || null;
    const nearestOutsideDistance = nearestOutside?.distance ?? 0;
    const rootChapterMargin = Number((nearestOutsideDistance - ownMax).toFixed(4));

    return {
      bookId: book.id,
      title: book.title,
      rootPatchCount: rootSignature.patchCount,
      avgOwnChapterDistance: average(ownDistances),
      maxOwnChapterDistance: ownMax,
      nearestOutsideChapterDistance: nearestOutsideDistance,
      rootChapterMargin,
      pass: rootChapterMargin > 0,
      ownChapterDistances,
      nearestOutside,
    };
  });

  const margins = reports.map((report) => report.rootChapterMargin);
  const rootPatchCounts = reports.map((report) => report.rootPatchCount);
  const chapterPatchCounts = chapterEntries.map((entry) => entry.signature.patchCount);

  return {
    summary: {
      bookCount: books.length,
      chapterCount: chapterEntries.length,
      allRootChapterMarginsPositive: reports.every((report) => report.pass),
      minRootChapterMargin: Math.min(...margins),
      avgRootChapterMargin: average(margins),
      avgRootPatchCount: average(rootPatchCounts),
      avgChapterPatchCount: average(chapterPatchCounts),
      totalRootPatches: rootPatchCounts.reduce((sum, count) => sum + count, 0),
      totalChapterPatches: chapterPatchCounts.reduce((sum, count) => sum + count, 0),
    },
    books: reports,
  };
}
