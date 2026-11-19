// Render transparent large PNGs (default 512; pass a size, e.g. 1024) from the official SVGs (same resvg + sharp pipeline as build-icons.mjs).
import { readdir, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
const size = Number(process.argv[2] || 512), src = 'public/svg', out = path.join('public/png', String(size));
await mkdir(out, { recursive: true });
let count = 0;
for (const file of (await readdir(src)).filter(f => f.endsWith('.svg')).sort()) {
  const png = new Resvg(await readFile(path.join(src, file)), { fitTo: { mode: 'width', value: size } }).render().asPng();
  await sharp(png).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 })
    .withMetadata({ comments: [`Source: Microsoft Azure Architecture Center V25; ${file}; official SVG rasterized with preserved aspect ratio.`] })
    .toFile(path.join(out, file.replace(/\.svg$/, '.png')));
  count++;
}
console.log(JSON.stringify({ size, count }));
