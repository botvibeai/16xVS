import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { runV33Hammer } from "../core/v33-707-hammer.mjs";

function outputDirForToday() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join("bench", `fortify-${date}-v33-707-hammer`);
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readme(summary) {
  return `# V33 707 Hammer

Generated: ${summary.generatedAt}

Claim level: \`${summary.claimLevel}\`

This is a local-only hammer suite for the locked \`707 -> 1\` candidate. It does not deploy, call external APIs, or push to GitHub.

## Gates

| Gate | Result |
| --- | --- |
${Object.entries(summary.gates)
  .map(([name, pass]) => `| ${name} | ${pass ? "pass" : "fail"} |`)
  .join("\n")}

Minimum hammer margin: \`${summary.minHammerMargin}\`

Public release ready: \`${summary.publicReleaseReady}\`

## Public Blockers

${summary.blockersBeforePublic.map((item) => `- ${item}`).join("\n")}
`;
}

async function main() {
  const outputDir = outputDirForToday();
  await mkdir(outputDir, { recursive: true });

  const summary = runV33Hammer();
  await writeJson(path.join(outputDir, "summary.json"), summary);
  await writeJson(path.join(outputDir, "repeatability.json"), summary.repeatability);
  await writeJson(path.join(outputDir, "mixed-corpus.json"), summary.mixedCorpus);
  await writeJson(path.join(outputDir, "mutation-swarm.json"), summary.mutationSwarm);
  await writeJson(path.join(outputDir, "route-noise-surge.json"), summary.routeNoiseSurge);
  await writeJson(path.join(outputDir, "anchor-mutation-guard.json"), summary.anchorMutationGuard);
  await writeJson(path.join(outputDir, "route-confusion-guard.json"), summary.routeConfusionGuard);
  await writeFile(path.join(outputDir, "README.md"), readme(summary), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: summary.ok,
        claimLevel: summary.claimLevel,
        outputDir,
        summary: path.join(outputDir, "summary.json"),
        gates: summary.gates,
        minHammerMargin: summary.minHammerMargin,
        publicReleaseReady: summary.publicReleaseReady,
      },
      null,
      2
    )
  );

  if (!summary.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
