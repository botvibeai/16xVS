import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { runV32Stabilization } from "../core/v32-707-stabilization.mjs";

function datedOutputDir() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join("bench", `fortify-${date}-v32-707-stabilization`);
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function buildReadme(summary) {
  const suiteRows = Object.entries(summary.suites)
    .map(
      ([mode, suite]) =>
        `| ${mode} | ${suite.summary.pass ? "pass" : "fail"} | ${suite.summary.correct}/${suite.summary.total} | ${suite.summary.averageSourceBpe} | ${suite.summary.averageEquivalentOutputTokens} | ${suite.summary.minOwnVsOutsideMargin} |`
    )
    .join("\n");

  return `# V32 707 Stabilization

Generated: ${summary.generatedAt}

Claim level: \`${summary.claimLevel}\`

This is a testing-only stabilization harness for \`707 -> 1\`. It does not deploy, call external APIs, or touch primary/secondary Workers.

## Gates

| Gate | Result |
| --- | --- |
${Object.entries(summary.gates)
  .map(([name, pass]) => `| ${name} | ${pass ? "pass" : "fail"} |`)
  .join("\n")}

## Suites

| Mode | Result | Correct | Avg BPE | Output Tokens | Min Margin |
| --- | --- | ---: | ---: | ---: | ---: |
${suiteRows}

## Public Release Boundary

Public release ready: \`${summary.publicReleaseReady}\`

Blockers:
${summary.publicReleaseBlockers.map((item) => `- ${item}`).join("\n")}
`;
}

async function main() {
  const outputDir = datedOutputDir();
  await mkdir(outputDir, { recursive: true });

  const summary = runV32Stabilization();
  await writeJson(path.join(outputDir, "summary.json"), summary);
  for (const [mode, suite] of Object.entries(summary.suites)) {
    await writeJson(path.join(outputDir, `${mode}.json`), suite);
  }
  await writeJson(path.join(outputDir, "anchor-mutation-guard.json"), summary.anchorMutationGuard);
  await writeJson(path.join(outputDir, "route-confusion-guard.json"), summary.routeConfusionGuard);
  await writeFile(path.join(outputDir, "README.md"), buildReadme(summary), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: summary.ok,
        claimLevel: summary.claimLevel,
        publicReleaseReady: summary.publicReleaseReady,
        outputDir,
        summary: path.join(outputDir, "summary.json"),
        gates: summary.gates,
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
