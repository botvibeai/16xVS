import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'recovery-output');
const endpoints = [
  'https://demo.16xvs.com',
  'https://16xvs-poc.michael-38d.workers.dev',
];
const buckets = ['16xvs-poc-live', '16xvs-poc-fallback', '16xvs-poc-vault'];

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: root, windowsHide: true, shell: process.platform === 'win32' });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => { stdout += d; });
    child.stderr?.on('data', (d) => { stderr += d; });
    child.on('error', (error) => resolve({ ok: false, code: null, stdout, stderr, error: error.message }));
    child.on('close', (code) => resolve({ ok: code === 0, code, stdout, stderr }));
  });
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const text = await response.text();
    let body = text;
    try { body = JSON.parse(text); } catch {}
    return { ok: response.ok, status: response.status, url: response.url, body };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), url };
  }
}

await fs.mkdir(outputDir, { recursive: true });

const whoami = await run('npx', ['wrangler', 'whoami']);
if (!whoami.ok) {
  console.error('Cloudflare login is required. Run: npx wrangler login');
  console.error('Then rerun this script. No Cloudflare changes were made.');
  await fs.writeFile(path.join(outputDir, 'cloudflare-login-required.json'), JSON.stringify({ generatedAt: new Date().toISOString(), whoami }, null, 2) + '\n');
  process.exit(2);
}

const bucketInventory = {};
for (const bucket of buckets) {
  // r2 object list is read-only. If unavailable in the installed Wrangler version, preserve the error.
  bucketInventory[bucket] = await run('npx', ['wrangler', 'r2', 'object', 'list', bucket, '--remote']);
}

const endpointInventory = {};
for (const base of endpoints) {
  endpointInventory[base] = {
    root: await fetchJson(base),
    health: await fetchJson(`${base}/api/health`),
    library: await fetchJson(`${base}/api/library`),
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: 'read-only',
  mutationsPerformed: false,
  whoami,
  buckets: bucketInventory,
  endpoints: endpointInventory,
};

const output = path.join(outputDir, 'cloudflare-latest.json');
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ok: true, output: path.relative(root, output).replaceAll('\\', '/') }, null, 2));
