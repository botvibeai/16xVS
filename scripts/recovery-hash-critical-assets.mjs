import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const targets = [
  'models/learned-hybrid-prototype-v10-constrained-merge-hierarchical-packer-v2.json',
  'models/learned-hybrid-prototype-v8-control-bridge-hierarchical-packer-v2.json',
  'models/learned-hybrid-prototype-v13-balanced-triad-hierarchical-packer-v2.json',
  'models/learned-hybrid-prototype-v22-governance-evidence-booklike-hierarchical-packer-v2.json',
  'vault-snapshots',
];

async function walk(target) {
  const full = path.resolve(root, target);
  try {
    const st = await fs.stat(full);
    if (st.isFile()) return [full];
    if (!st.isDirectory()) return [];
  } catch {
    return [];
  }

  const out = [];
  for (const entry of await fs.readdir(full, { withFileTypes: true })) {
    const child = path.join(full, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path.relative(root, child)));
    else if (entry.isFile()) out.push(child);
  }
  return out;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

const files = [];
for (const target of targets) files.push(...await walk(target));
files.sort();

const records = [];
for (const file of files) {
  const data = await fs.readFile(file);
  const st = await fs.stat(file);
  records.push({
    path: path.relative(root, file).replaceAll('\\', '/'),
    sizeBytes: st.size,
    modifiedUtc: st.mtime.toISOString(),
    sha256: sha256(data),
  });
}

const outputDir = path.join(root, 'recovery-output');
await fs.mkdir(outputDir, { recursive: true });
const output = path.join(outputDir, 'critical-assets-sha256.json');
await fs.writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(), records }, null, 2) + '\n');

console.log(JSON.stringify({ ok: records.length > 0, output: path.relative(root, output).replaceAll('\\', '/'), count: records.length }, null, 2));
process.exitCode = records.length > 0 ? 0 : 2;
