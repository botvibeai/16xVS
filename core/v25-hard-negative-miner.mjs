function ensureText(value, label) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) throw new Error(`Missing ${label}.`);
  return text;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function canonicalPairKey(left, right) {
  return [left, right].sort().join("|||");
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 72);
}

function themeWords(group) {
  const words = slug(group)
    .split("_")
    .filter((word) => word && !["quotes", "paragraphs", "blind", "stress", "group"].includes(word));
  return words.length ? words.join(" ") : "semantic boundary";
}

function boundaryItems({ sourceId, group }) {
  const theme = themeWords(group);
  const source = String(sourceId || "repair").replace(/[-_]+/g, " ");
  return [
    `${theme} ${source} semantic repair anchor`,
    `${theme} meaning boundary for ${source}`,
    `${theme} grouped retrieval distinction`,
    `${theme} nearest neighbor confusion guard`,
  ];
}

function uniquePairs(pairs) {
  const seen = new Set();
  const out = [];
  for (const pair of pairs) {
    const key = `${pair[0]}\u0000${pair[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(pair);
  }
  return out;
}

export function extractNearestOutsideConfusionPairs(
  report = {},
  { sourceId = "unknown", maxPairsPerGroup = 3 } = {}
) {
  const separation = report.semantic?.separation;
  if (!Array.isArray(separation) || separation.length === 0) {
    throw new Error("Report does not contain semantic separation examples.");
  }

  const pairs = [];
  const seen = new Set();
  for (const groupEntry of separation) {
    const group = ensureText(groupEntry.group, "semantic group");
    const examples = Array.isArray(groupEntry.examples) ? groupEntry.examples : [];
    const candidates = examples
      .map((example) => {
        const left = String(example?.text || "").replace(/\s+/g, " ").trim();
        const right = String(example?.nearestOutside?.text || "").replace(/\s+/g, " ").trim();
        if (!left || !right || left === right) return null;
        return {
          sourceId,
          group,
          left,
          right,
          signatureDistance: numberOrNull(example.nearestOutside.signatureDistance),
          separationMargin: numberOrNull(groupEntry.separationMargin),
        };
      })
      .filter(Boolean)
      .slice(0, Math.max(1, Math.trunc(Number(maxPairsPerGroup) || 1)));

    for (const candidate of candidates) {
      const key = canonicalPairKey(candidate.left, candidate.right);
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push(candidate);
    }
  }

  return pairs.sort((left, right) => {
    const marginDelta =
      (left.separationMargin ?? Number.POSITIVE_INFINITY) -
      (right.separationMargin ?? Number.POSITIVE_INFINITY);
    if (marginDelta !== 0) return marginDelta;
    const groupDelta = left.group.localeCompare(right.group);
    if (groupDelta !== 0) return groupDelta;
    return canonicalPairKey(left.left, left.right).localeCompare(
      canonicalPairKey(right.left, right.right)
    );
  });
}

export function buildMinedHardNegativeTrainingSpec({
  baseSpec = {},
  confusionPairs = [],
  version = 25,
  label = "V25 hard-negative repair probe",
  repairTarget = "quote, quote-paragraph, blind-holdout, and stress nearest-outside confusions",
  domain = "v25_hard_negative_repair",
  groupPrefix = `v${version}_mined`,
} = {}) {
  if (!Array.isArray(baseSpec.groups) || baseSpec.groups.length === 0) {
    throw new Error("V25 base spec needs at least one group.");
  }
  if (!Array.isArray(confusionPairs) || confusionPairs.length === 0) {
    throw new Error("V25 repair needs at least one confusion pair.");
  }

  const holdoutTexts = new Set(
    confusionPairs.flatMap((pair) => [ensureText(pair.left, "confusion left"), ensureText(pair.right, "confusion right")])
  );
  const groupsById = new Map((baseSpec.groups || []).map((group) => [group.id, group]));
  const minedGroups = [];
  const minedGroupIdsBySource = new Map();

  for (const pair of confusionPairs) {
    const sourceId = ensureText(pair.sourceId, "confusion sourceId");
    const group = ensureText(pair.group, "confusion group");
    const id = `${slug(groupPrefix)}_${slug(sourceId)}_${slug(group)}`;
    if (!groupsById.has(id)) {
      const items = boundaryItems({ sourceId, group }).filter((item) => !holdoutTexts.has(item));
      const entry = {
        id,
        domain,
        description: `Training-only mined boundary support for ${sourceId}/${group}. Does not include holdout text as positive examples.`,
        items,
      };
      groupsById.set(id, entry);
      minedGroups.push(entry);
    }
    if (!minedGroupIdsBySource.has(sourceId)) minedGroupIdsBySource.set(sourceId, new Set());
    minedGroupIdsBySource.get(sourceId).add(id);
  }

  const minedGroupPairs = [];
  for (const ids of minedGroupIdsBySource.values()) {
    const list = Array.from(ids).sort();
    for (let left = 0; left < list.length; left += 1) {
      for (let right = left + 1; right < list.length; right += 1) {
        minedGroupPairs.push([list[left], list[right]]);
      }
    }
  }

  const explicitNegativePairs = confusionPairs.map((pair) => ({
    left: ensureText(pair.left, "confusion left"),
    right: ensureText(pair.right, "confusion right"),
    sourceId: ensureText(pair.sourceId, "confusion sourceId"),
    group: ensureText(pair.group, "confusion group"),
    reason: "nearest-outside-confusion",
  }));

  return {
    ...baseSpec,
    version,
    description: `${label}. Adds mined nearest-outside confusion negatives without adding holdout strings as positive training items.`,
    negativeMode: "explicit",
    negativeSampleLimitPerPair: Math.max(12, Number(baseSpec.negativeSampleLimitPerPair) || 0),
    groups: [...(baseSpec.groups || []), ...minedGroups],
    hardNegativeGroupPairs: uniquePairs([
      ...(baseSpec.hardNegativeGroupPairs || []),
      ...minedGroupPairs,
    ]),
    explicitNegativePairs: [
      ...(Array.isArray(baseSpec.explicitNegativePairs) ? baseSpec.explicitNegativePairs : []),
      ...explicitNegativePairs,
    ],
    ancestry: {
      ...(baseSpec.ancestry || {}),
      baseSpecVersion: baseSpec.version ?? null,
      repairTarget,
      exactHoldoutTextIncludedAsPositiveTraining: false,
    },
    targetedRound: {
      target: "hard-negative repair",
      sourceCount: new Set(confusionPairs.map((pair) => pair.sourceId)).size,
      confusionPairCount: confusionPairs.length,
      minedGroupCount: minedGroups.length,
      proofBoundary: "specialist repair probe only; not a universal baseline",
    },
  };
}
