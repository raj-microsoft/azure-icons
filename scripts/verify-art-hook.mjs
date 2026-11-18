import {chromium} from 'playwright-core';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {sanitize} from './sanitize-art.mjs';
const url='http://127.0.0.1:4173/azure-icons/architectures/';
const data=JSON.parse(await readFile('public/architectures/scenes.json','utf8'));
const fixtures={
 smil:sanitize('<svg xmlns="http://www.w3.org/2000/svg"><rect x="30" y="70" width="50" height="50" fill="#1684cf"><animateTransform attributeName="transform" type="translate" values="0 0;140 0;0 0" dur="5s" repeatCount="indefinite"/></rect></svg>'),
 css:sanitize('<svg xmlns="http://www.w3.org/2000/svg"><style>@keyframes move{0%{transform:translateX(0)}50%{transform:translateX(140px)}100%{transform:translateX(0)}}.actor{animation:move 5s infinite}</style><rect class="actor" x="30" y="70" width="50" height="50" fill="#1684cf"/></svg>')
};
const browser=await chromium.launch({executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',headless:true});
try{for(const kind of ['smil','css']){
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
 await page.route('**/architectures/scenes.json',route=>route.fulfill({json:Object.fromEntries(Object.entries(data).map(([id,s])=>[id,{...s,art:'art/hook-test.svg'}]))}));
 await page.route('**/architectures/art/hook-test.svg',route=>route.fulfill({body:fixtures[kind],contentType:'image/svg+xml'}));
 await page.goto(url,{waitUntil:'networkidle'});await page.locator('.architecture-card[data-art=true]').first().waitFor();
 await page.evaluate(()=>window.aacTest.frame(800));const a=await page.locator('.preview').first().screenshot();await page.evaluate(()=>window.aacTest.frame(2400));const b=await page.locator('.preview').first().screenshot();assert(!a.equals(b),`${kind} art animates`);
 const ids=await page.locator('.preview [id]').evaluateAll(els=>els.map(e=>e.id));assert.equal(ids.length,new Set(ids).size,'IDs are scoped to each card');
 await page.locator('#motion-toggle').click();const c=await page.locator('.preview').first().screenshot();await page.waitForTimeout(300);assert(c.equals(await page.locator('.preview').first().screenshot()),`${kind} pauses`);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#motion-toggle').disabled);assert(await page.locator('#motion-toggle').isDisabled());const d=await page.locator('.preview').first().screenshot();await page.waitForTimeout(300);assert(d.equals(await page.locator('.preview').first().screenshot()),`${kind} honors reduced motion`);
 assert.equal(await page.locator('[data-art-error]').count(),0);await context.close();console.log(`Phase 2 hook: sanitized ${kind.toUpperCase()} inline art, isolated IDs, deterministic motion, toggle and reduced motion pass`);
 }}finally{await browser.close()}
