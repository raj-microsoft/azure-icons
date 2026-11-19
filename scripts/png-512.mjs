// Render transparent large PNGs (default 512; pass a size, e.g. 1024) from size-free SVGs (same resvg + sharp pipeline as build-icons.mjs).
// Usage: node scripts/png-512.mjs [size] [official|sketch|gpt]   (style defaults to official)
import { readdir, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
const size = Number(process.argv[2] || 512), style = process.argv[3] || 'official';
const dirs = { official: 'public', sketch: 'public/sketchnote', gpt: 'public/sketchnote-gpt' };
const notes = {
  official: f => `Source: Microsoft Azure Architecture Center V25; ${f}; official SVG rasterized with preserved aspect ratio.`,
  sketch: f => `Sketchnote interpretation of a Microsoft Azure icon, not official Microsoft artwork; ${f}; sketch SVG rasterized with preserved aspect ratio.`,
  gpt: f => `Made with ChatGPT. Sketchnote interpretation of a Microsoft Azure icon, not official Microsoft artwork; ${f}; SVG rasterized with preserved aspect ratio.`,
};
if (!dirs[style] || !(size > 0)) throw Error(`usage: node scripts/png-512.mjs [size] [official|sketch|gpt]`);
const src = path.join(dirs[style], 'svg'), out = path.join(dirs[style], 'png', String(size));
await mkdir(out, { recursive: true });
let count = 0;
for (const file of (await readdir(src)).filter(f => f.endsWith('.svg')).sort()) {
  const svg = await readFile(path.join(src, file));
  if (/<image\b/i.test(svg.toString())) throw Error(`${file} embeds a raster; refusing to upscale`);
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  await sharp(png).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 })
    .withMetadata({ comments: [notes[style](file)] })
    .toFile(path.join(out, file.replace(/\.svg$/, '.png')));
  count++;
}
console.log(JSON.stringify({ style, size, count }));
