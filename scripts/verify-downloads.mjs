import { chromium } from 'playwright-core';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { unzipSync } from 'fflate';
const origin = process.env.TEST_URL || 'http://127.0.0.1:4173/azure-icons/';
const out = '.impeccable/review/downloads'; await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
const report = {};
try {
  await page.goto(origin + '#azure-openai', { waitUntil: 'networkidle' });
  if (!await page.locator('#detail').isVisible()) { await page.locator('#search').fill('azure openai'); await page.locator('[data-open="azure-openai"]').click(); }
  await page.locator('#detail').waitFor();
  report.links = await page.locator('#detail-downloads a').evaluateAll(a => a.map(x => ({ text: x.textContent.trim(), href: x.getAttribute('href'), download: x.getAttribute('download') })));
  report.buttons = await page.locator('#detail button').allTextContents();
  const label = s => s.trim().replace(/^PNG\s+\S+\s+/, 'PNG ');
  assert.deepEqual(report.links.map(l => l.text).map(label), ['Download SVG', 'PNG 64 px', 'PNG 256 px', 'PNG 512 px', 'PNG 1024 px']);
  const files = {};
  for (let n = 0; n < 5; n++) {
    const ev = page.waitForEvent('download'); await page.locator('#detail-downloads a').nth(n).click(); const d = await ev;
    const dest = `${out}/${d.suggestedFilename()}`; await d.saveAs(dest); files[d.suggestedFilename()] = await readFile(dest);
  }
  report.downloads = {};
  for (const [name, b] of Object.entries(files)) {
    if (name.endsWith('.svg')) { const root = b.toString().match(/<svg\b[^>]*>/)[0]; assert(!/\s(width|height)=/.test(root)); assert(/viewBox="0 0 18 18"/.test(root)); report.downloads[name] = { bytes: b.length, root }; }
    else { const m = await sharp(b).metadata(); report.downloads[name] = { bytes: b.length, w: m.width, h: m.height, alpha: m.hasAlpha }; }
  }
  assert.equal(report.downloads['Azure OpenAI-512.png'].w, 512);
  assert.equal(report.downloads['Azure OpenAI-1024.png'].w, 1024); assert.equal(report.downloads['Azure OpenAI-1024.png'].h, 1024);
  await page.locator('#copy-svg').click(); await page.waitForTimeout(300);
  const copied = await page.evaluate(() => navigator.clipboard.readText()); assert.equal(copied, files['Azure OpenAI.svg'].toString()); report.copySvg = 'matches size-free download';
  await page.locator('#copy-png').click(); await page.waitForTimeout(800);
  report.copyPng = await page.evaluate(async () => { const items = await navigator.clipboard.read(); const t = items[0].types; const blob = await items[0].getType('image/png'); const bmp = await createImageBitmap(blob); return { types: t, w: bmp.width, h: bmp.height }; });
  assert.equal(report.copyPng.w, 512); assert.equal(report.copyPng.h, 512);
  report.toast = await page.locator('#toast').textContent();
  await page.screenshot({ path: `${out}/detail.png` });
  await page.locator('#detail-select').click(); await page.keyboard.press('Escape');
  const z = page.waitForEvent('download'); await page.locator('#zip').click(); const zd = await z; await zd.saveAs(`${out}/sel.zip`);
  report.zip = Object.keys(unzipSync(await readFile(`${out}/sel.zip`)));
  assert(report.zip.includes('PNG-512/Azure OpenAI-512.png'));
  assert(report.zip.includes('PNG-1024/Azure OpenAI-1024.png'));
  // ChatGPT style: same four PNG sizes as official, rendered from the ChatGPT SVGs
  await page.goto(origin + '?style=gpt#azure-openai', { waitUntil: 'networkidle' }); await page.locator('#detail').waitFor();
  report.gptLinks = await page.locator('#detail-downloads a').allTextContents();
  assert.deepEqual(report.gptLinks.map(label), ['Download ChatGPT SVG', 'PNG 64 px', 'PNG 256 px', 'PNG 512 px', 'PNG 1024 px']);
  report.gptDownloads = {};
  for (const n of [3, 4]) {
    const ev = page.waitForEvent('download'); await page.locator('#detail-downloads a').nth(n).click(); const d = await ev;
    const dest = `${out}/${d.suggestedFilename()}`; await d.saveAs(dest); const m = await sharp(await readFile(dest)).metadata();
    report.gptDownloads[d.suggestedFilename()] = { w: m.width, h: m.height, alpha: m.hasAlpha };
  }
  assert.deepEqual(report.gptDownloads['Azure OpenAI-512-chatgpt.png'], { w: 512, h: 512, alpha: true });
  assert.deepEqual(report.gptDownloads['Azure OpenAI-1024-chatgpt.png'], { w: 1024, h: 1024, alpha: true });
  await page.locator('#copy-png').click(); await page.waitForTimeout(800);
  report.gptCopyPng = await page.evaluate(async () => { const items = await navigator.clipboard.read(); const bmp = await createImageBitmap(await items[0].getType('image/png')); return { w: bmp.width, h: bmp.height }; });
  assert.equal(report.gptCopyPng.w, 512);
  await page.locator('#detail-select').click(); await page.keyboard.press('Escape');
  const gz = page.waitForEvent('download'); await page.locator('#zip').click(); const gzd = await gz; await gzd.saveAs(`${out}/sel-gpt.zip`);
  report.gptZip = Object.keys(unzipSync(await readFile(`${out}/sel-gpt.zip`)));
  assert(report.gptZip.includes('PNG-512/Azure OpenAI-512-chatgpt.png')); assert(report.gptZip.includes('PNG-1024/Azure OpenAI-1024-chatgpt.png'));
  // Sketch style assets (no UI toggle today): check files directly
  report.sketchAssets = {};
  for (const z of [512, 1024]) { const r = await context.request.get(origin + `sketchnote/png/${z}/azure-openai.png`); assert.equal(r.status(), 200); const m = await sharp(await r.body()).metadata(); report.sketchAssets[z] = { w: m.width, h: m.height }; assert.equal(m.width, z); assert.equal(m.height, z); }
  report.errors = errors; assert.deepEqual(errors, []);
  console.log(JSON.stringify(report, null, 1));
} finally { await browser.close(); }
