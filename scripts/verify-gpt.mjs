import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { unzipSync } from 'fflate';
const origin=process.env.TEST_URL||'http://127.0.0.1:4173/azure-icons/';
const live=origin.startsWith('https:');
const out=`verification/gpt-${live?'live':'local'}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write'],colorScheme:'light'});
const page=await context.newPage();const errors=[],failures=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`)});
const report={origin,errors,failures,checks:[]};
try {
await page.goto(origin+'?style=gpt',{waitUntil:'networkidle'});await page.locator('.icon-card').first().waitFor();
const manifest=await (await context.request.get(origin+'sketchnote-gpt/manifest.json')).json();
const index=await (await context.request.get(origin+'icons.json')).json();report.count=manifest.count;
assert.equal(await page.locator('[data-style=gpt]').getAttribute('aria-pressed'),'true');
assert.equal(await page.locator('#result-count').textContent(),`${manifest.count} icons`);
assert.match(await page.locator('#style-note').textContent(),/Made with ChatGPT/);
assert.equal(await page.locator('#gpt-progress').isVisible(),manifest.count<manifest.total);
assert.equal(await page.locator('[data-category="All icons"] span').textContent(),String(manifest.count));
assert((await page.locator('.icon-card').evaluateAll(nodes=>nodes.map(n=>n.dataset.id))).every(id=>manifest.ids.includes(id)));
assert((await page.locator('.art img').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')))).every(src=>src.includes('/sketchnote-gpt/')));
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.screenshot({path:`${out}/desktop.jpg`,type:'jpeg',quality:92});
if(live){await mkdir('C:/Users/dev/.openclaw/media/outbound',{recursive:true});await page.screenshot({path:'C:/Users/dev/.openclaw/media/outbound/azure-icons-gpt-desktop.jpg',type:'jpeg',quality:92})}
const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.axe=axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));assert.deepEqual(report.axe,[]);
const firstId=await page.locator('.icon-card').first().getAttribute('data-id');const first=index.icons.find(i=>i.id===firstId);
await page.locator('#search').fill(first.name);assert(await page.locator(`.icon-card[data-id="${firstId}"]`).count());await page.locator('#reset').click();
await page.locator(`[data-category="${first.categories[0]}"]`).click();const expected=index.icons.filter(i=>manifest.ids.includes(i.id)&&i.categories.includes(first.categories[0])).length;assert.equal(await page.locator('#result-count').textContent(),`${expected} ${expected===1?'icon':'icons'}`);await page.locator('#reset').click();
await page.locator('.specimen').first().focus();await page.keyboard.press('ArrowRight');assert(await page.locator('.specimen').nth(1).evaluate(e=>e===document.activeElement));await page.keyboard.press('Enter');
await page.locator('#compare').click();assert.deepEqual(await page.locator('#detail-preview figcaption').allTextContents(),['Official','Sketchnote','ChatGPT']);
await page.screenshot({path:`${out}/compare.jpg`});
const detailId=new URL(page.url()).hash.slice(1);
await page.locator('#copy-svg').click();await page.waitForTimeout(300);const copied=await page.evaluate(()=>navigator.clipboard.readText());const expectedSvg=await (await context.request.get(origin+`sketchnote-gpt/svg/${detailId}.svg`)).text();assert.equal(copied.replace(/\r\n/g,'\n'),expectedSvg.replace(/\r\n/g,'\n'));
for(let n=0;n<3;n++){
 const pending=page.waitForEvent('download');await page.locator('#detail-downloads a').nth(n).click();const download=await pending;assert.match(download.suggestedFilename(),/-chatgpt\.(svg|png)$/);const dest=`${out}/${download.suggestedFilename()}`;await download.saveAs(dest);const bytes=await readFile(dest);if(n===0)assert.equal(bytes.toString(),expectedSvg);else {const m=await sharp(bytes).metadata();assert.equal(m.width,n===1?64:256);assert(m.hasAlpha)}
}
await page.keyboard.press('Escape');assert(await page.locator('.specimen').nth(1).evaluate(e=>e===document.activeElement));
for(let n=0;n<3;n++){await page.locator('.icon-card').nth(n).hover();await page.locator('.select-icon').nth(n).click()}
const pending=page.waitForEvent('download');await page.locator('#zip').click();const download=await pending;assert.match(download.suggestedFilename(),/-chatgpt.zip$/);await download.saveAs(`${out}/three-icons.zip`);const files=unzipSync(await readFile(`${out}/three-icons.zip`));assert.equal(Object.keys(files).length,10);for(const [name,bytes] of Object.entries(files)){if(name.endsWith('.svg')){assert.match(name,/-chatgpt.svg$/);assert.match(new TextDecoder().decode(bytes),/<svg/)}if(name.endsWith('.png')){const m=await sharp(bytes).metadata();assert.equal(m.width,name.startsWith('PNG-64/')?64:256)}}
await page.locator('#deselect').click();await page.goto(origin,{waitUntil:'networkidle'});assert.equal(await page.locator('[data-style=gpt]').getAttribute('aria-pressed'),'true');
await page.goto(origin+'?style=gpt#'+firstId,{waitUntil:'networkidle'});assert(await page.locator('#detail').isVisible());assert.match(await page.locator('#detail-downloads a').first().getAttribute('href'),/sketchnote-gpt/);await page.keyboard.press('Escape');
await page.goto(origin+'?style=sketch',{waitUntil:'networkidle'});assert.equal(await page.locator('[data-style=sketch]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#result-count').textContent(),`${index.icons.length} icons`);
await page.locator('[data-style=official]').click();assert.equal(await page.locator('#result-count').textContent(),`${index.icons.length} icons`);
const absent=index.icons.find(i=>!manifest.ids.includes(i.id));if(absent){await page.goto(origin+'?style=official#'+absent.id,{waitUntil:'networkidle'});await page.locator('#compare').click();assert.equal(await page.locator('#detail-preview figure').count(),2);await page.keyboard.press('Escape')}
await page.locator('[data-style=gpt]').click();await page.locator('#theme').click();const dark=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(dark.violations.map(v=>v.id),[]);await page.locator('#theme').click();
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(3300);await page.screenshot({path:`${out}/mobile.jpg`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
const mobile=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(mobile.violations.map(v=>v.id),[]);await page.locator('.specimen').first().click();await page.locator('#compare').click();assert.equal(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth),true);await page.screenshot({path:`${out}/mobile-compare.jpg`});await page.keyboard.press('Escape');
await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.select-icon').first().click();assert.equal(await page.locator('#collection').evaluate(e=>getComputedStyle(e).animationName),'none');
assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);report.checks=['1440 and 390 responsive, no overflow','manifest-only grid and category/search counts','style query, hash and localStorage persistence','SVG, PNG64/256 downloads and copy SVG exact match','three-icon ZIP: nine valid assets plus terms','three-way compare and absent-GPT two-way compare','Official and Sketchnote regression','keyboard navigation and focus return','light/dark/mobile WCAG axe clean','reduced motion','zero JS/console errors and HTTP failures'];report.status='passed';
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close()}
console.log(JSON.stringify(report,null,2));
