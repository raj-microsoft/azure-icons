import { readFile, writeFile, mkdir, stat, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
// 512/1024 px PNGs are rendered from the synced ChatGPT SVG (same pipeline as scripts/png-512.mjs).
const large = [512, 1024];
async function renderLarge(id, svg) {
  for (const size of large) {
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
    const target = path.join(destination, `png/${size}/${id}.png`);
    await sharp(png).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 })
      .withMetadata({ comments: [`Made with ChatGPT. Sketchnote interpretation of a Microsoft Azure icon, not official Microsoft artwork; ${id}.svg; SVG rasterized with preserved aspect ratio.`] })
      .toFile(target + '.tmp');
    await rename(target + '.tmp', target);
  }
}

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
for (const dir of ['svg', 'png/64', 'png/256', 'png/512', 'png/1024']) await mkdir(path.join(destination, dir), { recursive: true });
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
  let svgChanged = false;
  for (let n = 0; n < files.length; n++) {
    const target = path.join(destination, files[n]);
    let old;
    try { old = await readFile(target); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (!old?.equals(buffers[n])) {
      await writeFile(target + '.tmp', buffers[n]);
      await rename(target + '.tmp', target);
      changed = true;
      if (n === 0) svgChanged = true;
    }
  }
  const missingLarge = (await Promise.all(large.map(s => stat(path.join(destination, `png/${s}/${id}.png`)).then(() => false, () => true)))).some(Boolean);
  if (svgChanged || missingLarge) { await renderLarge(id, buffers[0]); changed = true; }
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
