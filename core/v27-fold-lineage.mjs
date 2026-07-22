const FOLD_LEVELS = ["patch", "chapter", "book", "mega"];

const LINEAGE_CLUSTERS = [
  {
    id: "lineage-cluster-orbit",
    title: "Orbit visual-token economics",
    books: ["orbit-cost-book", "orbit-routing-book"],
  },
  {
    id: "lineage-cluster-harbor",
    title: "Harbor governance archive",
    books: ["harbor-audit-book", "harbor-retention-book"],
  },
];

function bitCount4(value) {
  return [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4][value & 0xf];
}

function hammingHex(left, right) {
  const lhs = String(left || "");
  const rhs = String(right || "");
  const limit = Math.min(lhs.length, rhs.length);
  let total = 0;
  for (let index = 0; index < limit; index += 1) {
    total += bitCount4(Number.parseInt(lhs[index], 16) ^ Number.parseInt(rhs[index], 16));
  }
  return total + Math.abs(lhs.length - rhs.length) * 4;
}

function average(values) {
  return values.length
    ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(4))
    : 0;
}

function makePatch({ clusterId, bookId, chapterId, patchIndex }) {
  return {
    id: `${chapterId}-patch-${patchIndex + 1}`,
    level: "patch",
    lineageId: clusterId,
    parentId: chapterId,
    childIds: [],
    residualCount: 0,
    text: [
      "lineage-level-patch",
      clusterId,
      bookId,
      chapterId,
      `patch-${patchIndex + 1}`,
      "keeps local wording below a folded parent token instead of pretending the parent is lossless",
    ].join(" "),
  };
}

function makeChapter({ clusterId, bookId, chapterIndex }) {
  const chapterId = `${bookId}-chapter-${chapterIndex + 1}`;
  const patches = [0, 1, 2].map((patchIndex) =>
    makePatch({ clusterId, bookId, chapterId, patchIndex })
  );
  return {
    node: {
      id: chapterId,
      level: "chapter",
      lineageId: clusterId,
      parentId: bookId,
      childIds: patches.map((patch) => patch.id),
      residualCount: 1,
      text: [
        "lineage-level-chapter",
        clusterId,
        bookId,
        chapterId,
        "folds patch children into a chapter root while residual detail protects local distinctions",
        ...patches.map((patch) => patch.text),
      ].join(" "),
    },
    patches,
  };
}

function makeBook({ clusterId, bookId }) {
  const chapters = [0, 1].map((chapterIndex) => makeChapter({ clusterId, bookId, chapterIndex }));
  const chapterNodes = chapters.map((chapter) => chapter.node);
  return {
    node: {
      id: bookId,
      level: "book",
      lineageId: clusterId,
      parentId: clusterId,
      childIds: chapterNodes.map((chapter) => chapter.id),
      residualCount: 2,
      text: [
        "lineage-level-book",
        clusterId,
        bookId,
        "folds chapter roots into a book routing handle with child traversal still available",
        ...chapterNodes.map((chapter) => chapter.text),
      ].join(" "),
    },
    chapters: chapterNodes,
    patches: chapters.flatMap((chapter) => chapter.patches),
  };
}

function makeMega(cluster) {
  const books = cluster.books.map((bookId) => makeBook({ clusterId: cluster.id, bookId }));
  const bookNodes = books.map((book) => book.node);
  return {
    node: {
      id: cluster.id,
      level: "mega",
      lineageId: cluster.id,
      parentId: null,
      childIds: bookNodes.map((book) => book.id),
      residualCount: 2,
      text: [
        "lineage-level-mega",
        cluster.id,
        cluster.title,
        "folds book roots into a higher root handle while books and chapters remain navigable",
        ...bookNodes.map((book) => book.text),
      ].join(" "),
    },
    books: bookNodes,
    chapters: books.flatMap((book) => book.chapters),
    patches: books.flatMap((book) => book.patches),
  };
}

export function buildV27FoldLineageFixture() {
  const clusters = LINEAGE_CLUSTERS.map(makeMega);
  const nodes = clusters.flatMap((cluster) => [
    cluster.node,
    ...cluster.books,
    ...cluster.chapters,
    ...cluster.patches,
  ]);

  return {
    schemaVersion: "v27-fold-lineage-fixture-v1",
    nodes,
  };
}

function summarizeSignature(encoder, node) {
  const signature = encoder.signature(node.text);
  return {
    signatureHex: signature.signatureHex,
    patchCount: Number(signature.patchCount) || 0,
  };
}

function validateNodes(nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error("nodes are required.");
  }
  const ids = new Set();
  for (const node of nodes) {
    if (!node?.id) throw new Error("Every fold node needs an id.");
    if (!FOLD_LEVELS.includes(node.level)) {
      throw new Error(`Unsupported fold level '${node.level}' for node '${node.id}'.`);
    }
    if (ids.has(node.id)) throw new Error(`Duplicate fold node id '${node.id}'.`);
    ids.add(node.id);
  }
}

function summarizeLevels(checks) {
  const out = {};
  for (const level of ["chapter", "book", "mega"]) {
    const levelChecks = checks.filter((check) => check.level === level);
    const margins = levelChecks.map((check) => check.margin);
    out[level] = {
      parentCount: levelChecks.length,
      allMarginsPositive: levelChecks.every((check) => check.pass),
      minMargin: margins.length ? Math.min(...margins) : null,
      avgMargin: average(margins),
      avgPatchCount: average(levelChecks.map((check) => check.patchCount)),
      residualCount: levelChecks.reduce((sum, check) => sum + check.residualCount, 0),
    };
  }
  return out;
}

export function evaluateFoldLineage({ nodes, encoder } = {}) {
  validateNodes(nodes);
  if (!encoder || typeof encoder.signature !== "function") {
    throw new Error("encoder.signature is required.");
  }

  const nodesById = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const signaturesById = Object.fromEntries(
    nodes.map((node) => [node.id, summarizeSignature(encoder, node)])
  );
  const checks = [];

  for (const parent of nodes.filter((node) => Array.isArray(node.childIds) && node.childIds.length)) {
    const children = parent.childIds.map((childId) => {
      const child = nodesById[childId];
      if (!child) throw new Error(`Missing child '${childId}' for parent '${parent.id}'.`);
      return child;
    });
    const childLevel = children[0].level;
    const outsideSiblings = nodes.filter(
      (node) =>
        node.level === childLevel &&
        !parent.childIds.includes(node.id) &&
        (!parent.lineageId || !node.lineageId || node.lineageId !== parent.lineageId)
    );
    if (outsideSiblings.length === 0) {
      throw new Error(`Parent '${parent.id}' has no outside siblings for fold-lineage audit.`);
    }

    const parentSignature = signaturesById[parent.id];
    const ownDistances = children.map((child) =>
      hammingHex(parentSignature.signatureHex, signaturesById[child.id].signatureHex)
    );
    const outsideDistances = outsideSiblings.map((sibling) =>
      hammingHex(parentSignature.signatureHex, signaturesById[sibling.id].signatureHex)
    );
    const nearestOwnDistance = Math.min(...ownDistances);
    const farthestOwnDistance = Math.max(...ownDistances);
    const nearestOutsideDistance = Math.min(...outsideDistances);
    const margin = Number((nearestOutsideDistance - farthestOwnDistance).toFixed(4));

    checks.push({
      level: parent.level,
      parentId: parent.id,
      childLevel,
      childIds: [...parent.childIds],
      nearestOwnDistance,
      farthestOwnDistance,
      nearestOutsideDistance,
      margin,
      patchCount: parentSignature.patchCount,
      residualCount: Number(parent.residualCount) || 0,
      pass: margin > 0,
    });
  }

  const margins = checks.map((check) => check.margin);
  return {
    schemaVersion: "v27-fold-lineage-report-v1",
    generatedAt: new Date().toISOString(),
    summary: {
      nodeCount: nodes.length,
      parentCount: checks.length,
      allMarginsPositive: checks.every((check) => check.pass),
      minMargin: margins.length ? Math.min(...margins) : null,
      avgMargin: average(margins),
      totalResidualCount: checks.reduce((sum, check) => sum + check.residualCount, 0),
      parentLevels: summarizeLevels(checks),
    },
    checks,
  };
}
