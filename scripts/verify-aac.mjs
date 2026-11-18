import {chromium} from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {DOMParser} from '@xmldom/xmldom';
import {sanitize} from './sanitize-art.mjs';
import {archetypes} from '../src/scenes.ts';
const origin=process.env.TEST_URL||'http://127.0.0.1:4173/azure-icons/architectures/';
const out='verification/aac';await mkdir(out,{recursive:true});
const articles=JSON.parse(await readFile('public/architectures/articles.json','utf8'));
const scenes=JSON.parse(await readFile('public/architectures/scenes.json','utf8'));
assert.equal(articles.length,187);assert.equal(new Set(articles.map(a=>a.url)).size,187);
for(const a of articles){assert(a.url.startsWith('https://learn.microsoft.com/'));const s=scenes[a.id];assert(s);assert(archetypes.includes(s.archetype));assert(s.reviewed);assert(s.duration>=4000&&s.duration<=6000);for(const actor of s.actors)await stat(`public/svg/${actor.id}.svg`);
 if(s.art){assert(/^art\/[a-zA-Z0-9/_-]+\.svg$/.test(s.art));const source=await readFile('public/architectures/'+s.art,'utf8');assert(Buffer.byteLength(source)<=40960);sanitize(source);new DOMParser().parseFromString(source,'image/svg+xml');assert(!/<script|foreignObject|\son\w+=|(?:href=["'](?:https?:|data:))/i.test(source))}
}
const browser=await chromium.launch({executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1060},colorScheme:'light'});
const page=await context.newPage(),errors=[],failures=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)failures.push(r.status()+' '+r.url())});
const report={origin,entries:articles.length,unique:187,mapped:187,archetypes:archetypes.length,errors,failures,checks:[]};
try{
 await page.goto(origin,{waitUntil:'networkidle'});await page.locator('.architecture-card').first().waitFor();assert.equal(await page.locator('.architecture-card').count(),187);
 await page.waitForTimeout(300);assert(await page.evaluate(()=>window.aacTest.active())<=12);assert(await page.evaluate(()=>window.aacTest.active())>0);
 await page.screenshot({path:out+'/desktop.png'});
 const before=await page.locator('.preview').first().screenshot();await page.waitForTimeout(650);const after=await page.locator('.preview').first().screenshot();assert(!before.equals(after),'Live motion must change visible pixels');
 await page.evaluate(()=>window.aacTest.frame(850));await page.screenshot({path:out+'/frame-0850.png'});
 await page.evaluate(()=>window.aacTest.frame(2850));await page.screenshot({path:out+'/frame-2850.png'});
 assert(!(await readFile(out+'/frame-0850.png')).equals(await readFile(out+'/frame-2850.png')));report.checks.push('Live and deterministic virtual-time motion differ');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.axe=axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));assert.deepEqual(report.axe,[]);
 await page.locator('#search').fill('VWAN');assert(await page.locator('.architecture-card').count()>0);report.checks.push('Search works');
 await page.locator('#search').fill('gibberishxyzunmatched');assert(await page.locator('#empty').isVisible());await page.locator('#empty-reset').click();
 await page.locator('#category').selectOption('networking');assert(await page.locator('.architecture-card').count()>0);assert(await page.locator('.architecture-card').count()<187);await page.locator('#reset').click();
 await page.locator('#type').selectOption('solution-idea');assert((await page.locator('.type-chip').allTextContents()).every(s=>s==='Solution idea'));await page.locator('#reset').click();
 await page.locator('#product').selectOption('azure-virtual-wan');assert(await page.locator('.architecture-card').count()>0);await page.locator('#reset').click();
 await page.locator('#sort').selectOption('az');const titles=await page.locator('.architecture-card h2').allTextContents();assert.deepEqual(titles,[...titles].sort((a,b)=>a.localeCompare(b)));await page.locator('#sort').selectOption('newest');report.checks.push('Category/type/product filters, empty state, sort, clear');
 await page.locator('h1').click();await page.keyboard.press('/');assert(await page.locator('#search').evaluate(e=>e===document.activeElement));report.checks.push('Keyboard search shortcut');
 await page.locator('#motion-toggle').click();const still1=await page.locator('.preview').first().screenshot();await page.waitForTimeout(650);const still2=await page.locator('.preview').first().screenshot();assert(still1.equals(still2));assert.equal(await page.evaluate(()=>window.aacTest.active()),0);report.checks.push('Motion toggle produces identical frames');
 await page.locator('#theme').click();await page.screenshot({path:out+'/dark.png'});const dark=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.axeDark=dark.violations.map(v=>v.id);assert.deepEqual(report.axeDark,[]);await page.locator('#theme').click();
 await page.emulateMedia({reducedMotion:'reduce'});assert(await page.locator('#motion-toggle').isDisabled());const r1=await page.locator('.preview').first().screenshot();await page.waitForTimeout(600);assert(r1.equals(await page.locator('.preview').first().screenshot()));assert.equal(await page.evaluate(()=>window.aacTest.active()),0);report.checks.push('Reduced motion produces identical frames');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/mobile.png'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const mobile=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.axeMobile=mobile.violations.map(v=>v.id);assert.deepEqual(report.axeMobile,[]);
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#motion-toggle').click();
 await page.goto(origin+'?sheet=archetypes',{waitUntil:'networkidle'});await page.locator('.architecture-card').first().waitFor();assert.equal(await page.locator('.architecture-card').count(),24);
 await page.evaluate(()=>{document.querySelectorAll('.architecture-card').forEach(c=>c.querySelector('h2').textContent=c.dataset.archetype);window.aacTest.frame(1700)});
 await page.screenshot({path:out+'/archetypes-mid.png',fullPage:true});
 await page.evaluate(()=>window.aacTest.frame(2500,true));await page.screenshot({path:out+'/archetypes-settled.png',fullPage:true});
 report.checks.push('24 archetypes rendered at mid-animation and settled');
 await page.goto(origin,{waitUntil:'networkidle'});await page.waitForTimeout(250);await page.evaluate(()=>window.aacTest.frame(2000));
 const tiles=[];for(let i=0;i<24;i++){const card=page.locator('.architecture-card').nth(i);await card.scrollIntoViewIfNeeded();await page.evaluate(()=>window.aacTest.frame(2000));const buf=await card.screenshot();tiles.push(await sharp(buf).resize({width:320,height:450,fit:'contain',background:'#f4f7f7'}).toBuffer())}
 const outbound='C:/Users/dev/.openclaw/media/outbound';await mkdir(outbound,{recursive:true});
 await sharp({create:{width:1340,height:2780,channels:3,background:'#f4f7f7'}}).composite(tiles.map((input,i)=>({input,left:18+i%4*332,top:16+Math.floor(i/4)*460}))).png().toFile(outbound+'/aac-cards.png');
 report.checks.push('24 real cards captured');assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2))}
