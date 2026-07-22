import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = {
    report: null,
    output: null,
    id: null,
    title: null,
    label: "directional",
    method: null,
    corpus: null,
    implementationPath: "experimental core candidate",
    baseline: "tiktoken using cl100k_base",
    nextAction: "Review the draft ledger entry, tighten the claims, and update any proof or failure docs if the evidence status changed.",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--report" && argv[index + 1]) {
      out.report = path.resolve(projectRoot, argv[index + 1]);
      index += 1;
    } else if (arg === "--output" && argv[index + 1]) {
      out.output = path.resolve(projectRoot, argv[index + 1]);
      index += 1;
    } else if (arg === "--id" && argv[index + 1]) {
      out.id = argv[index + 1];
      index += 1;
    } else if (arg === "--title" && argv[index + 1]) {
      out.title = argv[index + 1];
      index += 1;
    } else if (arg === "--label" && argv[index + 1]) {
      out.label = argv[index + 1].toLowerCase();
      index += 1;
    } else if (arg === "--method" && argv[index + 1]) {
      out.method = argv[index + 1];
      index += 1;
    } else if (arg === "--corpus" && argv[index + 1]) {
      out.corpus = argv[index + 1];
      index += 1;
    } else if (arg === "--implementation-path" && argv[index + 1]) {
      out.implementationPath = argv[index + 1];
      index += 1;
    } else if (arg === "--baseline" && argv[index + 1]) {
      out.baseline = argv[index + 1];
      index += 1;
    } else if (arg === "--next-action" && argv[index + 1]) {
      out.nextAction = argv[index + 1];
      index += 1;
    }
  }

  return out;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function startCase(slug) {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferLabel(report) {
  if (report.semantic?.separation?.some((entry) => Number(entry.separationMargin) < 0)) {
    return "failed";
  }
  if (typeof report.summary?.experimentalPatchesPerToken === "number" && report.summary.experimentalPatchesPerToken < 1) {
    return "directional";
  }
  return "proven";
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function windowsLinkPath(target) {
  return path.resolve(target);
}

function summarizeMetrics(report) {
  const lines = [];
  const summary = report.summary || {};
  const preferred = [
    "entries",
    "tiktokenCount",
    "fixtureGlyphCount",
    "experimentalPatchCount",
    "experimentalPatchesPerToken",
    "binaryVsSourceRatio",
    "experimentalBinaryVsSourceRatio",
  ];

  for (const key of preferred) {
    if (summary[key] !== undefined && summary[key] !== null) {
      lines.push(`  - \`${key}\`: \`${summary[key]}\``);
    }
  }

  if (report.retrieval?.avgNearestSignatureDistance !== undefined) {
    lines.push(`  - \`retrieval.avgNearestSignatureDistance\`: \`${report.retrieval.avgNearestSignatureDistance}\``);
  }

  if (report.semantic?.separation?.length) {
    for (const entry of report.semantic.separation.slice(0, 5)) {
      lines.push(`  - \`${entry.group}.separationMargin\`: \`${entry.separationMargin}\``);
    }
  }

  return lines.length > 0 ? lines.join("\n") : "  - `summary`: `add metrics from the report`";
}

function buildMarkdown({
  id,
  title,
  label,
  report,
  reportPath,
  outputPath,
  method,
  corpus,
  implementationPath,
  baseline,
  nextAction,
}) {
  const reportRel = relativeProjectPath(reportPath);
  const reportAbs = windowsLinkPath(reportPath);
  const generatedDate = String(report.generatedAt || new Date().toISOString()).slice(0, 10);

  return `# ${id} ${title}

- \`id\`: \`${id}\`
- \`date\`: \`${generatedDate}\`
- \`corpus\`: \`${corpus}\`
- \`method\`: ${method}
- \`implementation_path\`: \`${implementationPath}\`
- \`baseline\`: \`${baseline}\`
- \`metrics\`:
${summarizeMetrics(report)}
- \`result_label\`: \`${label}\`
- \`claim_supported\`:
  - Replace these bullets with claim-backed statements supported by this report.
- \`claim_not_supported\`:
  - Replace these bullets with the limits or failed claims exposed by this report.
- \`artifacts\`:
  - [${path.basename(reportRel)}](${reportAbs})
- \`notes\`:
  - Generated from \`${reportRel}\`.
  - Review this draft before using it in a proof document.
- \`next_action\`:
  - ${nextAction}
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.report) {
    throw new Error("Missing required --report <path>.");
  }

  const raw = await fs.readFile(args.report, "utf8");
  const report = JSON.parse(raw);

  const generatedDate = String(report.generatedAt || new Date().toISOString()).slice(0, 10);
  const inferredSlug = slugify(args.title || path.basename(args.report, path.extname(args.report)));
  const idSource = args.title || path.basename(args.report, path.extname(args.report));
  const id = args.id || `EXP-${generatedDate}-${slugify(idSource).toUpperCase().replace(/-/g, "_")}`;
  const title = args.title || startCase(inferredSlug);
  const label = args.label || inferLabel(report);
  const corpus = String(args.corpus || report.input || "unknown").replace(/\\/g, "/");
  const method =
    args.method ||
    "Review the linked report and replace this sentence with the exact benchmark method used for the run.";
  const output =
    args.output ||
    path.join(projectRoot, "docs", "ledger", `${generatedDate}-${inferredSlug}.md`);

  const markdown = buildMarkdown({
    id,
    title,
    label,
    report,
    reportPath: args.report,
    outputPath: output,
    method,
    corpus,
    implementationPath: args.implementationPath,
    baseline: args.baseline,
    nextAction: args.nextAction,
  });

  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, markdown, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        report: relativeProjectPath(args.report),
        output: relativeProjectPath(output),
        inferredLabel: label,
        inferredId: id,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
