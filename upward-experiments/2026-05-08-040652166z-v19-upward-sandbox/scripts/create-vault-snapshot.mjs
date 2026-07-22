import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_SNAPSHOT_PATHS,
  createVaultSnapshot,
} from "../core/vault-snapshot.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function resolveProjectPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(projectRoot, target);
}

function relativeProjectPath(target) {
  return path.relative(projectRoot, target).replace(/\\/g, "/");
}

function parseArgs(argv) {
  const out = {
    outputDir: path.join(projectRoot, "vault-snapshots"),
    label: "",
    includePaths: DEFAULT_SNAPSHOT_PATHS.slice(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output-dir" && argv[index + 1]) {
      out.outputDir = resolveProjectPath(argv[index + 1]);
      index += 1;
    } else if (arg === "--label" && argv[index + 1]) {
      out.label = String(argv[index + 1]);
      index += 1;
    } else if (arg === "--include" && argv[index + 1]) {
      out.includePaths.push(String(argv[index + 1]).replace(/\\/g, "/"));
      index += 1;
    }
  }

  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const snapshot = await createVaultSnapshot({
    projectRoot,
    outputDir: args.outputDir,
    includePaths: args.includePaths,
    label: args.label,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        snapshotId: snapshot.snapshotId,
        snapshotRoot: relativeProjectPath(snapshot.snapshotRoot),
        manifest: relativeProjectPath(snapshot.manifestPath),
        fileCount: snapshot.manifest.fileCount,
        totalBytes: snapshot.manifest.totalBytes,
        criticalArtifacts: snapshot.manifest.criticalArtifacts,
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
