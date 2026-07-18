import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { sealVaultFile, openVaultFile } from "../core/secure-vault.mjs";

function parseArgs(argv) {
  const out = { command: argv[0] || "", input: "", output: "", label: "" };
  for (let index = 1; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--input") out.input = argv[++index] || "";
    else if (value === "--output") out.output = argv[++index] || "";
    else if (value === "--label") out.label = argv[++index] || "";
    else throw new Error(`Unknown argument: ${value}`);
  }
  return out;
}

function rejectDirectPassphraseEnvironment() {
  if (Object.prototype.hasOwnProperty.call(process.env, "16XVS_VAULT_PASSPHRASE")) {
    throw new Error(
      "Direct passphrase environment variables are disabled. Enter the Vault phrase through the hidden terminal prompt.",
    );
  }
}

async function hiddenPrompt(message) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Vault passphrase entry requires an interactive terminal.");
  }

  process.stdout.write(message);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  return await new Promise((resolve, reject) => {
    let value = "";
    const finish = (error) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") return finish(new Error("Cancelled."));
        if (character === "\r" || character === "\n") return finish();
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
        } else if (character >= " ") {
          value += character;
        }
      }
    };
    process.stdin.on("data", onData);
  });
}

async function getPassphrase({ confirm = false } = {}) {
  rejectDirectPassphraseEnvironment();
  const first = await hiddenPrompt("Vault passphrase: ");
  if (!confirm) return first;
  const second = await hiddenPrompt("Repeat Vault passphrase: ");
  if (first !== second) throw new Error("Passphrases do not match.");
  return first;
}

async function ensureReadable(filePath) {
  const stats = await fs.stat(filePath);
  if (!stats.isFile()) throw new Error(`Not a file: ${filePath}`);
}

function safeSealResult(result) {
  return {
    ok: true,
    action: "sealed",
    output: path.basename(result.outputPath),
    sourceBytes: result.sourceBytes,
    ciphertextBytes: result.ciphertextBytes,
    version: result.version,
  };
}

function safeOpenResult(result) {
  return {
    ok: true,
    action: "opened",
    output: path.basename(result.outputPath),
    sourceBytes: result.sourceBytes,
    version: result.version,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.command || !args.input || !args.output) {
    throw new Error(
      "Usage: node scripts/secure-vault.mjs <seal|open> --input <file> --output <file> [--label <text>]",
    );
  }

  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);
  await ensureReadable(inputPath);

  if (args.command === "seal") {
    const passphrase = await getPassphrase({ confirm: true });
    const result = await sealVaultFile({
      inputPath,
      outputPath,
      passphrase,
      metadata: { label: args.label || null },
    });
    console.log(JSON.stringify(safeSealResult(result), null, 2));
    return;
  }

  if (args.command === "open") {
    const passphrase = await getPassphrase();
    const result = await openVaultFile({ inputPath, outputPath, passphrase });
    console.log(JSON.stringify(safeOpenResult(result), null, 2));
    return;
  }

  throw new Error(`Unknown command: ${args.command}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
