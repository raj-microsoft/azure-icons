// Remove fixed width/height from the root <svg> element so icons scale with their viewBox
// when pasted into PowerPoint, Visio, Figma or draw.io (matches az-icons.com downloads).
// Only the root tag is touched; every other byte (paths, line endings, ids) is preserved.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function sizeFree(buffer) {
  const text = buffer.toString('latin1');
  const match = /<svg\b[^>]*>/.exec(text);
  if (!match || !/\sviewBox\s*=/.test(match[0])) return buffer;
  const root = match[0].replace(/\s+(?:width|height)\s*=\s*(?:"[^"]*"|'[^']*')/g, '');
  if (root === match[0]) return buffer;
  return Buffer.from(text.slice(0, match.index) + root + text.slice(match.index + match[0].length), 'latin1');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dirs = process.argv.slice(2);
  if (!dirs.length) throw Error('Usage: node scripts/svg-size-free.mjs <svg-dir>...');
  for (const dir of dirs) {
    let changed = 0, total = 0;
    for (const file of (await readdir(dir)).filter(f => f.endsWith('.svg'))) {
      total++;
      const before = await readFile(path.join(dir, file)), after = sizeFree(before);
      if (!after.equals(before)) { await writeFile(path.join(dir, file), after); changed++; }
    }
    console.log(JSON.stringify({ dir, total, changed }));
  }
}
