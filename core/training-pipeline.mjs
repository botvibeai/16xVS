import path from "node:path";

function ensureNonEmptyString(value, label) {
  const text = String(value || "").trim();
  if (!text) {
    throw new Error(`Missing ${label}.`);
  }
  return text;
}

function ensureOptionalNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function canonicalPairKey(left, right) {
  const [first, second] = [left, right].map((value) => ensureNonEmptyString(value, "pair text")).sort();
  return `${first}|||${second}`;
}

function hashString32(text) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function materializeItems(group) {
  const seen = new Set();
  const items = [];

  for (const rawItem of group.items || []) {
    const item = ensureNonEmptyString(rawItem, `item in group ${group.id}`);
    if (seen.has(item)) continue;
    seen.add(item);
    items.push(item);
  }

  if (items.length < 2) {
    throw new Error(`Group ${group.id} needs at least 2 unique items.`);
  }

  return items;
}

function materializeNegativePairs(groupPairs, groupMap, limitPerPair) {
  const negatives = [];
  const negativeKeys = new Set();

  for (const pair of groupPairs) {
    if (!Array.isArray(pair) || pair.length !== 2) {
      throw new Error("Each hard negative pair entry must have exactly two group ids.");
    }

    const [leftId, rightId] = pair.map((value) => ensureNonEmptyString(value, "hard negative group id"));
    const leftGroup = groupMap.get(leftId);
    const rightGroup = groupMap.get(rightId);

    if (!leftGroup || !rightGroup) {
      throw new Error(`Unknown hard negative group pair: ${leftId} vs ${rightId}`);
    }
    if (leftId === rightId) {
      throw new Error(`Hard negative group pair cannot reference the same group twice: ${leftId}`);
    }

    const rawPairs = [];
    for (const left of leftGroup.items) {
      for (const right of rightGroup.items) {
        const pairKey = canonicalPairKey(left, right);
        if (negativeKeys.has(pairKey)) continue;
        rawPairs.push({
          label: "negative",
          leftGroupId: leftId,
          rightGroupId: rightId,
          left,
          right,
          pairKey,
          pairHash: hashString32(`${leftId}|${rightId}|${pairKey}`),
        });
      }
    }

    const selectedPairs =
      Number.isFinite(limitPerPair) && limitPerPair > 0 && rawPairs.length > limitPerPair
        ? rawPairs.sort((left, right) => left.pairHash - right.pairHash).slice(0, limitPerPair)
        : rawPairs;

    for (const pairEntry of selectedPairs) {
      negativeKeys.add(pairEntry.pairKey);
      const { pairHash, ...finalPair } = pairEntry;
      negatives.push(finalPair);
    }
  }

  return negatives;
}

function explicitPairLabel(pair) {
  const sourceId = String(pair.sourceId || "manual").trim() || "manual";
  const group = String(pair.group || "ungrouped").trim() || "ungrouped";
  return `explicit:${sourceId}:${group}`;
}

function materializeExplicitNegativePairs(explicitPairs, existingKeys = new Set()) {
  const negatives = [];
  const seen = new Set(existingKeys);

  for (const rawPair of explicitPairs) {
    if (!rawPair || typeof rawPair !== "object") {
      throw new Error("Each explicit negative pair must be an object.");
    }

    const left = ensureNonEmptyString(rawPair.left, "explicit negative left text");
    const right = ensureNonEmptyString(rawPair.right, "explicit negative right text");
    const pairKey = canonicalPairKey(left, right);
    if (seen.has(pairKey)) continue;
    seen.add(pairKey);

    const label = explicitPairLabel(rawPair);
    negatives.push({
      label: "negative",
      leftGroupId: label,
      rightGroupId: label,
      left,
      right,
      pairKey,
      sourceId: String(rawPair.sourceId || "manual"),
      group: String(rawPair.group || "ungrouped"),
      reason: String(rawPair.reason || "explicit-negative-pair"),
    });
  }

  return negatives;
}

export function buildTrainingDataset(spec = {}) {
  const groups = Array.isArray(spec.groups) ? spec.groups : [];
  const hardNegativeGroupPairs = Array.isArray(spec.hardNegativeGroupPairs)
    ? spec.hardNegativeGroupPairs
    : [];
  const explicitNegativePairs = Array.isArray(spec.explicitNegativePairs)
    ? spec.explicitNegativePairs
    : [];
  const negativeMode = String(spec.negativeMode || "explicit").trim().toLowerCase();
  const negativeSampleLimitPerPair = ensureOptionalNumber(spec.negativeSampleLimitPerPair, null);

  if (groups.length === 0) {
    throw new Error("Training spec needs at least one group.");
  }

  const groupMap = new Map();
  const materializedGroups = groups.map((group) => {
    const id = ensureNonEmptyString(group.id, "group id");
    if (groupMap.has(id)) {
      throw new Error(`Duplicate group id: ${id}`);
    }

    const items = materializeItems({ ...group, id });
    const entry = {
      id,
      domain: String(group.domain || id),
      description: String(group.description || ""),
      items,
    };
    groupMap.set(id, entry);
    return entry;
  });

  const positives = [];
  const positiveKeys = new Set();
  for (const group of materializedGroups) {
    for (let index = 0; index < group.items.length; index += 1) {
      for (let next = index + 1; next < group.items.length; next += 1) {
        const left = group.items[index];
        const right = group.items[next];
        const pairKey = canonicalPairKey(left, right);
        if (positiveKeys.has(pairKey)) continue;
        positiveKeys.add(pairKey);
        positives.push({
          label: "positive",
          groupId: group.id,
          left,
          right,
          pairKey,
        });
      }
    }
  }

  const negatives = [];
  const autoNegativePairs = [];
  if (negativeMode === "all-cross") {
    for (let leftIndex = 0; leftIndex < materializedGroups.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < materializedGroups.length; rightIndex += 1) {
        autoNegativePairs.push([
          materializedGroups[leftIndex].id,
          materializedGroups[rightIndex].id,
        ]);
      }
    }
  } else if (negativeMode !== "explicit") {
    throw new Error(`Unsupported negativeMode: ${negativeMode}`);
  }

  negatives.push(
    ...materializeNegativePairs(
      negativeMode === "all-cross" ? autoNegativePairs : hardNegativeGroupPairs,
      groupMap,
      negativeSampleLimitPerPair
    )
  );
  negatives.push(
    ...materializeExplicitNegativePairs(
      explicitNegativePairs,
      new Set(negatives.map((pair) => pair.pairKey))
    )
  );

  const itemCount = materializedGroups.reduce((total, group) => total + group.items.length, 0);

  return {
    summary: {
      groupCount: materializedGroups.length,
      itemCount,
      positivePairCount: positives.length,
      negativePairCount: negatives.length,
      explicitNegativePairCount: explicitNegativePairs.length,
      totalPairCount: positives.length + negatives.length,
      negativeMode,
    },
    groups: materializedGroups,
    positives,
    negatives,
  };
}

export function buildSuitePlan(manifest = {}, outputDir) {
  const suites = Array.isArray(manifest.suites) ? manifest.suites : [];
  if (suites.length === 0) {
    throw new Error("Evaluation suite manifest needs at least one suite.");
  }

  const resolvedOutputDir = ensureNonEmptyString(outputDir, "output directory");
  const seen = new Set();

  return suites.map((suite) => {
    const id = ensureNonEmptyString(suite.id, "suite id");
    if (seen.has(id)) {
      throw new Error(`Duplicate suite id: ${id}`);
    }
    seen.add(id);

    return {
      id,
      label: String(suite.label || id),
      input: ensureNonEmptyString(suite.input, `input for suite ${id}`),
      semantic: suite.semantic ? ensureNonEmptyString(suite.semantic, `semantic path for suite ${id}`) : null,
      perturbation: suite.perturbation
        ? ensureNonEmptyString(suite.perturbation, `perturbation path for suite ${id}`)
        : null,
      limit: Number.isFinite(Number(suite.limit)) ? Number(suite.limit) : null,
      frozen: suite.frozen !== false,
      output: path.join(resolvedOutputDir, `${id}-report.json`),
    };
  });
}
