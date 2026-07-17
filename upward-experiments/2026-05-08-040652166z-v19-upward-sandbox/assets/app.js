const state = {
  prepared: null,
  tokenized: null,
  lastDigest: null,
};

const refs = {
  fileInput: document.querySelector("#source-file"),
  storeButton: document.querySelector("#store-button"),
  searchButton: document.querySelector("#search-button"),
  refreshLibrary: document.querySelector("#refresh-library"),
  repairLibrary: document.querySelector("#repair-library"),
  statusLine: document.querySelector("#status-line"),
  sourcePreview: document.querySelector("#source-preview"),
  sourceMeta: document.querySelector("#source-meta"),
  glyphMeta: document.querySelector("#glyph-meta"),
  preparedGlyph: document.querySelector("#prepared-glyph"),
  fixtureSummary: document.querySelector("#fixture-summary"),
  fixtureText: document.querySelector("#fixture-text"),
  fixtureLabel: document.querySelector("#fixture-label"),
  fixtureLimit: document.querySelector("#fixture-limit"),
  fixtureBatchButton: document.querySelector("#fixture-batch-button"),
  healthService: document.querySelector("#health-service"),
  healthPolicy: document.querySelector("#health-policy"),
  healthCount: document.querySelector("#health-count"),
  healthDurability: document.querySelector("#health-durability"),
  healthDegraded: document.querySelector("#health-degraded"),
  healthDigest: document.querySelector("#health-digest"),
  librarySummary: document.querySelector("#library-summary"),
  libraryList: document.querySelector("#library-list"),
  matchesSummary: document.querySelector("#matches-summary"),
  matchesList: document.querySelector("#matches-list"),
};

function setStatus(message, tone = "neutral") {
  refs.statusLine.textContent = message;
  refs.statusLine.dataset.tone = tone;
}

function setPreparedState(enabled) {
  refs.storeButton.disabled = !enabled;
  refs.searchButton.disabled = !enabled;
}

function resetPreparedGlyph() {
  refs.preparedGlyph.innerHTML = "";
  refs.preparedGlyph.className = "glyph-frame glyph-empty";
  refs.glyphMeta.textContent = "No glyph yet";
}

function hexToBits(hex) {
  const bits = [];
  for (const character of hex) {
    const value = parseInt(character, 16);
    bits.push((value >> 3) & 1, (value >> 2) & 1, (value >> 1) & 1, value & 1);
  }
  return bits;
}

function buildGlyphElement(hex) {
  const root = document.createElement("div");
  root.className = "glyph-frame";

  const bits = hexToBits(hex);
  for (const bit of bits) {
    const cell = document.createElement("span");
    cell.className = bit ? "glyph-cell glyph-cell-on" : "glyph-cell glyph-cell-off";
    root.appendChild(cell);
  }

  return root;
}

function updatePreparedGlyph(tokenized) {
  const nextGlyph = buildGlyphElement(tokenized.glyph.hex);
  refs.preparedGlyph.replaceWith(nextGlyph);
  refs.preparedGlyph = nextGlyph;
  refs.glyphMeta.textContent = `${tokenized.glyph.onBits} dark pixels / threshold ${tokenized.glyph.threshold}`;
}

function metricText(record) {
  return `${record.glyph.onBits} dark bits / density ${record.glyph.density}`;
}

function storageText(storage) {
  if (!storage) return "storage pending";
  const tiers = Array.isArray(storage.successfulTiers) ? storage.successfulTiers.join(" + ") : "none";
  return `${storage.mode} / ${tiers}`;
}

function degradedText(storage) {
  if (!storage) return "degraded";
  return storage.quorumMet && storage.liveReady ? "healthy" : "degraded";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEmpty(container, message) {
  container.className = "card-grid empty-state";
  container.innerHTML = "";
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  container.appendChild(paragraph);
}

function metadataText(metadata = {}) {
  const parts = [];
  if (metadata.label) parts.push(String(metadata.label));
  if (Number.isFinite(metadata.itemIndex)) parts.push(`#${Number(metadata.itemIndex) + 1}`);
  if (metadata.characterName) parts.push(String(metadata.characterName));
  return parts.join(" / ");
}

function buildRecordCard(record, options = {}) {
  const card = document.createElement("article");
  card.className = "record-card";

  const header = document.createElement("div");
  header.className = "record-head";

  const title = document.createElement("h3");
  title.textContent = record.source.name;

  const subtitle = document.createElement("p");
  subtitle.className = "mini-copy";
  subtitle.textContent = new Date(record.createdAt).toLocaleString();

  header.append(title, subtitle);

  const glyph = buildGlyphElement(record.glyph.hex);

  const meta = document.createElement("div");
  meta.className = "record-meta";
  const fixtureMeta = metadataText(record.metadata);
  meta.innerHTML = `
    <p>${escapeHtml(metricText(record))}</p>
    <p>${escapeHtml(`Storage: ${storageText(record.storage)}`)}</p>
    <p>${escapeHtml(`Durability: ${degradedText(record.storage)}`)}</p>
    ${fixtureMeta ? `<p>${escapeHtml(`Fixture: ${fixtureMeta}`)}</p>` : ""}
    <p>${escapeHtml(`${record.source.originalWidth} x ${record.source.originalHeight} / ${record.source.mimeType}`)}</p>
  `;

  card.append(header, glyph, meta);

  if (typeof options.distance === "number") {
    const matchBar = document.createElement("div");
    matchBar.className = "match-bar";
    matchBar.innerHTML = `
      <strong>${options.distance} bit flips</strong>
      <span>${Math.round((options.similarity || 0) * 100)}% similarity</span>
    `;
    card.append(matchBar);
  }

  return card;
}

async function postJson(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  if (!response.ok || !body.ok) {
    throw new Error(body?.error?.message || `Request failed for ${path}`);
  }
  return body;
}

async function postJsonAllowPartial(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || `Request failed for ${path}`);
  }
  return body;
}

async function getJson(path) {
  const response = await fetch(path);
  const body = await response.json();
  if (!response.ok || !body.ok) {
    throw new Error(body?.error?.message || `Request failed for ${path}`);
  }
  return body;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to decode image."));
    image.src = dataUrl;
  });
}

function fitImage(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const x = Math.floor((targetWidth - width) / 2);
  const y = Math.floor((targetHeight - height) / 2);
  return { width, height, x, y };
}

function visualizeCharacter(char) {
  if (char === " ") return { render: "SP", name: "space" };
  if (char === "\n") return { render: "NL", name: "newline" };
  if (char === "\t") return { render: "TB", name: "tab" };
  return { render: char, name: char };
}

function grayscaleFromCanvas(canvas) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const pixels = context.getImageData(0, 0, 16, 16).data;
  const grayscale = [];
  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    grayscale.push(Math.round(red * 0.299 + green * 0.587 + blue * 0.114));
  }
  return grayscale;
}

async function prepareFile(file) {
  const dataUrl = await fileToDataUrl(file);
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 16, 16);
  context.imageSmoothingEnabled = true;

  const frame = fitImage(image.width, image.height, 16, 16);
  context.drawImage(image, frame.x, frame.y, frame.width, frame.height);

  return {
    file,
    dataUrl,
    grayscale: grayscaleFromCanvas(canvas),
    source: {
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      originalWidth: image.width,
      originalHeight: image.height,
    },
  };
}

function buildTextFixtureItems(text, label, limit) {
  const normalized = text.replace(/\r\n/g, "\n");
  const characters = Array.from(normalized).slice(0, limit);
  const batchId = crypto.randomUUID();

  const items = characters.map((char, index) => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 16, 16);
    context.fillStyle = "#111111";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "12px 'Courier New', monospace";

    const visual = visualizeCharacter(char);
    context.fillText(visual.render, 8, 8.5);

    const codePoint = char.codePointAt(0);
    return {
      grayscale: grayscaleFromCanvas(canvas),
      source: {
        name: `${label}-${String(index + 1).padStart(5, "0")}`,
        mimeType: "text/plain+fixture",
        originalWidth: 16,
        originalHeight: 16,
      },
      metadata: {
        fixtureType: "text-character",
        batchId,
        itemIndex: index,
        label,
        characterName: visual.name,
        codePoint: codePoint ? `U+${codePoint.toString(16).toUpperCase()}` : "U+0000",
        sourceTextLength: characters.length,
      },
    };
  });

  return { batchId, totalCharacters: characters.length, items };
}

async function refreshHealth() {
  const health = await getJson("/api/health");
  refs.healthService.textContent = health.service;
  refs.healthCount.textContent = String(health.recordCount);
  refs.healthPolicy.textContent = `${health.storagePolicy.tiers.join(" / ")} with live + 1 secondary minimum`;
  refs.healthDurability.textContent = `${health.durability.tripleCount} triple / ${health.durability.doubleCount} double`;
  refs.healthDegraded.textContent = String(health.durability.degradedCount || 0);
}

async function refreshLibrary() {
  const library = await getJson("/api/library?limit=24");
  refs.healthCount.textContent = String(library.count);
  refs.librarySummary.textContent = `${library.count} glyphs in the isolated catalog`;

  if (!library.records.length) {
    renderEmpty(refs.libraryList, "No glyphs stored.");
    return;
  }

  refs.libraryList.className = "card-grid";
  refs.libraryList.innerHTML = "";
  for (const record of library.records) {
    refs.libraryList.appendChild(buildRecordCard(record));
  }
}

async function handleRepairLibrary() {
  refs.repairLibrary.disabled = true;
  setStatus("Repairing degraded token records.", "busy");

  try {
    const result = await postJson("/api/repair", {
      degradedOnly: true,
    });
    setStatus(`Repair complete. ${result.repairedCount} records reconciled.`, "good");
    await refreshHealth();
    await refreshLibrary();
  } catch (error) {
    setStatus(error.message, "bad");
  } finally {
    refs.repairLibrary.disabled = false;
  }
}

async function tokenizePrepared() {
  if (!state.prepared) return;
  const tokenized = await postJson("/api/tokenize", {
    grayscale: state.prepared.grayscale,
    source: state.prepared.source,
  });

  state.tokenized = tokenized;
  state.lastDigest = tokenized.sampleDigest;
  refs.healthDigest.textContent = `${tokenized.sampleDigest.slice(0, 12)}...`;
  updatePreparedGlyph(tokenized);
}

async function handleFileSelection(event) {
  const [file] = event.target.files || [];
  state.prepared = null;
  state.tokenized = null;
  state.lastDigest = null;
  refs.healthDigest.textContent = "None";
  resetPreparedGlyph();

  if (!file) {
    setPreparedState(false);
    refs.sourcePreview.removeAttribute("src");
    refs.sourceMeta.textContent = "No image loaded";
    setStatus("Waiting for an image.");
    return;
  }

  setStatus("Preparing the sample image.", "busy");
  setPreparedState(false);

  try {
    state.prepared = await prepareFile(file);
    refs.sourcePreview.src = state.prepared.dataUrl;
    refs.sourcePreview.alt = `${file.name} source preview`;
    refs.sourceMeta.textContent = `${state.prepared.source.originalWidth} x ${state.prepared.source.originalHeight} / ${state.prepared.source.mimeType}`;
    await tokenizePrepared();
    setPreparedState(true);
    setStatus(`Prepared ${file.name}. Ready to store or search.`, "good");
  } catch (error) {
    setStatus(error.message, "bad");
    setPreparedState(false);
  }
}

async function handleStore() {
  if (!state.prepared) return;
  refs.storeButton.disabled = true;
  setStatus("Writing the glyph into the isolated catalog.", "busy");

  try {
    const result = await postJson("/api/ingest", {
      grayscale: state.prepared.grayscale,
      source: state.prepared.source,
    });
    refs.healthCount.textContent = String(result.recordCount);
    setStatus(`Stored ${result.record.source.name} as ${result.record.id.slice(0, 8)}.`, "good");
    await refreshLibrary();
    await handleSearch(result.record.id);
  } catch (error) {
    setStatus(error.message, "bad");
  } finally {
    refs.storeButton.disabled = false;
  }
}

async function handleSearch(excludeRecordId = null) {
  if (!state.prepared) return;
  refs.searchButton.disabled = true;
  setStatus("Running exact Hamming-distance search.", "busy");

  try {
    const result = await postJson("/api/search", {
      grayscale: state.prepared.grayscale,
      source: state.prepared.source,
      limit: 6,
      excludeRecordId,
    });

    refs.matchesSummary.textContent = `${result.matches.length} matches from ${result.totalCandidates} stored glyphs`;
    if (!result.matches.length) {
      renderEmpty(refs.matchesList, "No neighbors yet. Store more glyphs to create a search surface.");
    } else {
      refs.matchesList.className = "card-grid";
      refs.matchesList.innerHTML = "";
      for (const match of result.matches) {
        refs.matchesList.appendChild(buildRecordCard(match.record, match));
      }
    }
    setStatus("Search complete.", "good");
  } catch (error) {
    setStatus(error.message, "bad");
  } finally {
    refs.searchButton.disabled = false;
  }
}

async function handleFixtureBatch() {
  const text = refs.fixtureText.value || "";
  const label = (refs.fixtureLabel.value || "pasted-corpus").trim() || "pasted-corpus";
  const limitValue = Number(refs.fixtureLimit.value);
  const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(512, Math.round(limitValue))) : 128;

  if (!text.trim()) {
    setStatus("Paste a larger prompt or book fragment before running the fixture batch.", "bad");
    return;
  }

  refs.fixtureBatchButton.disabled = true;
  setStatus("Building fixture glyphs from pasted text.", "busy");

  try {
    const batch = buildTextFixtureItems(text, label, limit);
    refs.fixtureSummary.textContent = `${batch.totalCharacters} fixture glyphs prepared from pasted text`;

    const result = await postJsonAllowPartial("/api/ingest-batch", {
      items: batch.items,
    });

    setStatus(
      `Batch ingest complete. ${result.successCount}/${result.attempted} stored with storage quorum.`,
      result.failureCount > 0 ? "bad" : "good"
    );
    refs.fixtureSummary.textContent = `${result.successCount} stored / ${result.failureCount} failed / batch ${batch.batchId.slice(0, 8)}`;
    await refreshHealth();
    await refreshLibrary();
  } catch (error) {
    setStatus(error.message, "bad");
  } finally {
    refs.fixtureBatchButton.disabled = false;
  }
}

async function initialize() {
  setPreparedState(false);
  refs.fileInput.addEventListener("change", handleFileSelection);
  refs.storeButton.addEventListener("click", handleStore);
  refs.searchButton.addEventListener("click", () => handleSearch());
  refs.fixtureBatchButton.addEventListener("click", handleFixtureBatch);
  refs.repairLibrary.addEventListener("click", handleRepairLibrary);
  refs.refreshLibrary.addEventListener("click", async () => {
    setStatus("Refreshing isolated catalog view.", "busy");
    try {
      await refreshHealth();
      await refreshLibrary();
      setStatus("Catalog refreshed.", "good");
    } catch (error) {
      setStatus(error.message, "bad");
    }
  });

  try {
    await refreshHealth();
    await refreshLibrary();
    setStatus("POC ready. Upload an image to begin.");
  } catch (error) {
    setStatus(error.message, "bad");
  }
}

initialize();
