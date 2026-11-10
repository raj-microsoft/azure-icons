import { readFile, writeFile, mkdir, stat, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'variants/sketchnote-gpt');
const destination = path.join(root, 'public/sketchnote-gpt');
const manifestPath = path.join(destination, 'manifest.json');
const index = JSON.parse(await readFile(path.join(root, 'public/icons.json'), 'utf8'));
let previous;
try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const ids = new Set(previous?.ids || []);
let changed = false;
const cutoff = Date.now() - 60_000;
for (const dir of ['svg', 'png/64', 'png/256']) await mkdir(path.join(destination, dir), { recursive: true });
for (const { id } of index.icons) {
  if (!/^[\w-]+$/.test(id)) throw Error(`Unsafe icon ID: ${id}`);
  const files = [`svg/${id}.svg`, `png/64/${id}.png`, `png/256/${id}.png`];
  let before, buffers;
  try {
    before = await Promise.all(files.map(f => stat(path.join(source, f))));
    if (before.some(s => !s.isFile() || !s.size) || before[0].mtimeMs >= cutoff) continue;
    buffers = await Promise.all(files.map(f => readFile(path.join(source, f))));
    const after = await Promise.all(files.map(f => stat(path.join(source, f))));
    if (after.some((s, n) => s.mtimeMs !== before[n].mtimeMs || s.size !== before[n].size)) continue;
  } catch (e) { if (e.code === 'ENOENT') continue; throw e; }
  for (let n = 0; n < files.length; n++) {
    const target = path.join(destination, files[n]);
    let old;
    try { old = await readFile(target); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (!old?.equals(buffers[n])) {
      await writeFile(target + '.tmp', buffers[n]);
      await rename(target + '.tmp', target);
      changed = true;
    }
  }
  ids.add(id);
}
const sorted = [...ids].sort();
const manifest = { count: sorted.length, total: 643, updated: changed || !previous ? new Date().toISOString() : previous.updated, ids: sorted };
await writeFile(manifestPath + '.tmp', JSON.stringify(manifest, null, 2) + '\n');
await rename(manifestPath + '.tmp', manifestPath);
// Invoke Vite/TypeScript directly to avoid Windows shell quoting and npm.cmd portability issues.
for (const args of [['node_modules/typescript/bin/tsc', '--noEmit'], ['node_modules/vite/bin/vite.js', 'build']]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(JSON.stringify({ count: manifest.count, total: manifest.total }));
