function ensureFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function resolveRouteHead(policy = {}, routeId = "") {
  const routes = policy.routes && typeof policy.routes === "object" ? policy.routes : {};
  const directHead = routes[String(routeId || "")];
  if (directHead) return directHead;
  if (policy.defaultHead) return policy.defaultHead;
  throw new Error(`No route head configured for route '${routeId}'.`);
}

export function computeMultiHeadStorage(summary = {}, options = {}) {
  const storedHeadCount = Math.max(1, Math.trunc(ensureFiniteNumber(options.storedHeadCount, 1)));
  const codeBytesPerPatch = Math.max(1, Math.trunc(ensureFiniteNumber(options.codeBytesPerPatch, 32)));
  const sourceBytes = ensureFiniteNumber(summary.sourceBytes, 0);
  const selectedHeadBinaryBytes = ensureFiniteNumber(
    summary.experimentalBinaryBytes,
    ensureFiniteNumber(summary.experimentalPatchCount, 0) * codeBytesPerPatch
  );
  const allHeadsBinaryBytes = selectedHeadBinaryBytes * storedHeadCount;

  return {
    storedHeadCount,
    codeBytesPerPatch,
    selectedHeadBinaryBytes,
    allHeadsBinaryBytes,
    selectedHeadBinaryVsSourceRatio:
      sourceBytes > 0 ? Number((selectedHeadBinaryBytes / sourceBytes).toFixed(4)) : null,
    allHeadsBinaryVsSourceRatio:
      sourceBytes > 0 ? Number((allHeadsBinaryBytes / sourceBytes).toFixed(4)) : null,
  };
}
