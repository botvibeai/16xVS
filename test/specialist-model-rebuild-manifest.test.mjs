import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(projectRoot, relativePath), "utf8"));
}

test("specialist rebuild manifest matches preserved benchmark metadata", async () => {
  const manifest = await readJson("recovery/specialist-model-rebuild-manifest.json");
  assert.deepEqual(manifest.heads.map((head) => head.id), ["bookRoot", "default", "governance", "booklikeRepair"]);

  for (const head of manifest.heads) {
    await fs.access(path.join(projectRoot, head.trainingPairs));
    const evidence = await readJson(head.evidenceReport);
    const encoder = evidence.experimentalEncoder;
    assert.equal(encoder.dimensions, manifest.commonTraining.dimensions, `${head.id}: dimensions`);
    assert.equal(encoder.learnedBlendWeight, manifest.commonTraining.learnedBlendWeight, `${head.id}: learned blend`);
    assert.equal(encoder.heuristicBlendWeight, manifest.commonTraining.heuristicBlendWeight, `${head.id}: heuristic blend`);
    assert.equal(encoder.prototypeLearningRate, manifest.commonTraining.prototypeLearningRate, `${head.id}: prototype rate`);
    assert.equal(encoder.prototypeNegativeMargin, manifest.commonTraining.prototypeNegativeMargin, `${head.id}: prototype margin`);
    assert.deepEqual(encoder.patchConfig, head.patchConfig, `${head.id}: patch config`);
    for (const [key, expected] of Object.entries(head.expectedTrainingSummary)) {
      assert.equal(encoder.trainingSummary[key], expected, `${head.id}: ${key}`);
    }
  }
});

test("rebuild outputs are isolated from original model paths", async () => {
  const manifest = await readJson("recovery/specialist-model-rebuild-manifest.json");
  assert.match(manifest.policy.outputRoot, /^recovery-output\//);
  assert.equal(manifest.policy.sourceModelsAreNeverOverwritten, true);
  for (const head of manifest.heads) {
    assert.match(head.originalPath, /^models\//);
    assert.ok(!head.originalPath.startsWith(manifest.policy.outputRoot));
  }
});
