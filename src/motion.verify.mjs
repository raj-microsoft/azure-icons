import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import ts from 'typescript';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const origin=process.env.TEST_URL||'http://127.0.0.1:4173/azure-icons/';
const out='.impeccable/review/motion';
await mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),origin,assets:0,failures:[],rasterDifferences:[],checks:[],samples:[],errors:[]};
const browser=await chromium.launch({executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',headless:true,args:['--headless=new']});
const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light'});
const page=await context.newPage();
page.on('pageerror',e=>report.errors.push(e.message));
const samples=['virtual-networks','azure-cosmos-db','key-vaults','container-instances','analysis-services','azure-machine-learning','api-connections','all-resources'];
const index=JSON.parse(await readFile('public/icons.json','utf8'));
async function ready(){await page.locator('#detail-preview[aria-busy="false"]').waitFor();assert.equal(await page.locator('[data-motion-status="fallback"]').count(),0)}
async function seek(time){await page.evaluate(async time=>{const root=document.querySelector('#detail-preview');root.getAnimations({subtree:true}).forEach(a=>{if(time>=1200)a.finish();else{a.pause();a.currentTime=time}});if(time>=1200)await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))},time)}
async function open(id,variant='official'){
  await page.goto(`${origin}?style=${variant}#${id}`);await ready();
  await page.locator('#replay').click();await seek(300);
}
const pixelDifference=async(a,b)=>{const aa=await sharp(a).ensureAlpha().raw().toBuffer(),bb=await sharp(b).ensureAlpha().raw().toBuffer();assert.equal(aa.length,bb.length);let pixels=0;for(let i=0;i<aa.length;i+=4)if(aa.subarray(i,i+4).compare(bb.subarray(i,i+4)))pixels++;return pixels};
try{
  await page.goto(origin);await page.locator('.icon-card').first().waitFor();
  await page.screenshot({path:`${out}/desktop.png`});
  if(!process.argv.includes('--samples-only')){
  const test=await context.newPage();await test.goto(origin);await test.locator('.icon-card').first().waitFor();
  const code=ts.transpileModule(await readFile('src/motion.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  await test.evaluate(async source=>{window.motion=await import(URL.createObjectURL(new Blob([source],{type:'text/javascript'})));document.body.innerHTML='<div id="fixture"></div>';const style=document.createElement('style');style.textContent='#fixture>svg{width:160px;height:160px}';document.head.append(style)},code);
  const assets=[];
  for(const icon of index.icons)for(const variant of ['official','gpt'])assets.push({...icon,variant,source:await readFile(`public/${variant==='gpt'?'sketchnote-gpt/':''}svg/${icon.id}.svg`,'utf8')});
  assert.equal(assets.length,1286);
  for(let start=0;start<assets.length;start+=32){
    const batch=await test.evaluate(async assets=>{
      const failures=[],rasterDifferences=[];let checked=0,maxParts=0;
      async function raster(source){
        const url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml'}));
        try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=160;const ctx=canvas.getContext('2d');const scale=Math.min(160/img.naturalWidth,160/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;ctx.drawImage(img,(160-w)/2,(160-h)/2,w,h);return ctx.getImageData(0,0,160,160).data}finally{URL.revokeObjectURL(url)}
      }
      for(const asset of assets){
        let clip;
        try{
          const svg=window.motion.sanitizeSvg(asset.source);document.querySelector('#fixture').replaceChildren(svg);
          const before=svg.outerHTML;const partCount=window.motion.artParts(svg).length;if(!partCount)throw Error('No parts');maxParts=Math.max(maxParts,partCount);
          clip=window.motion.animateParts(svg,window.motion.signature(asset.categories));clip.play();
          for(const animation of clip.animations){animation.pause();animation.currentTime=1200;const frame=animation.effect.getKeyframes().at(-1);if(frame.transform!=='none'||frame.opacity!=='1')throw Error('Nonidentity final frame')}
          clip.settle();
          for(const element of svg.querySelectorAll('[data-motion-part]')){const style=getComputedStyle(element);if(style.transform!=='none'||style.opacity!=='1'||element.style.length>0)throw Error('Nonidentity settled part')}
          clip.dispose();if(svg.outerHTML!==before)throw Error('Source DOM changed after dispose');
          const [original,sanitized]=await Promise.all([raster(asset.source),raster(svg.outerHTML)]);
          let differences=0,maxDelta=0;
          for(let n=0;n<original.length;n++){const delta=Math.abs(original[n]-sanitized[n]);if(delta){differences++;maxDelta=Math.max(maxDelta,delta)}}
          if(differences)rasterDifferences.push({id:asset.id,variant:asset.variant,differences,maxDelta});
          checked++;
        }catch(error){failures.push({id:asset.id,variant:asset.variant,error:String(error)})}finally{clip?.dispose();document.querySelector('#fixture').replaceChildren()}
      }
      return {checked,failures,rasterDifferences,maxParts};
    },assets.slice(start,start+32));
    report.assets+=batch.checked;report.failures.push(...batch.failures);report.rasterDifferences.push(...batch.rasterDifferences);report.maxParts=Math.max(report.maxParts||0,batch.maxParts);
    if(start%256===0)console.log(`SVG checks: ${report.assets}/1286`);
  }
  report.checks.push('1286 SVG parse/parts, native transforms preserved, final identity and exact source raster comparison');
  report.sanitizer=await test.evaluate(()=>{
    const input=`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" onload="window.pwned=1"><script>window.pwned=1</script><foreignObject><iframe src="https://example.com"/></foreignObject><defs><linearGradient id="paint"><stop stop-color="#123456"/></linearGradient></defs><style>.x{fill:url(#paint);stroke:url(https://example.com/a)}</style><path class="x" id="part" onclick="alert(1)" d="M1 1H10V10Z"/><use href="https://example.com/a.svg#x"/><use href="javascript:alert(1)"/><animate attributeName="opacity" from="0" to="1"/></svg>`;
    const a=window.motion.sanitizeSvg(input),b=window.motion.sanitizeSvg(input);
    const unsafe=a.querySelector('script,foreignObject,iframe,style,animate,[onload],[onclick]');
    const urls=[...a.querySelectorAll('*')].flatMap(e=>[...e.attributes].map(a=>a.value)).filter(v=>/https:|javascript:/.test(v));
    const ids=[a,b].flatMap(root=>[...root.querySelectorAll('[id]')].map(e=>e.id));
    let invalidRejected=false;try{window.motion.sanitizeSvg('<svg><path>')}catch{invalidRejected=true}
    return {activeContentRemoved:!unsafe,externalReferencesRemoved:!urls.length,uniqueIds:new Set(ids).size===ids.length,invalidRejected};
  });
  assert(Object.values(report.sanitizer).every(Boolean));
  await test.close();
  assert.deepEqual(report.failures,[]);
  assert.deepEqual(report.rasterDifferences,[]);
  }

  // Two scrubbable time points for eight services in both styles, plus a source control.
  const sheet=[];
  for(const id of samples)for(const variant of ['official','gpt']){
    await open(id,variant);
    const icon=index.icons.find(i=>i.id===id),move=await page.locator('#detail-preview').getAttribute('data-move');
    const host=page.locator('.motion-host');
    const mid=await host.screenshot({path:`${out}/${id}-${variant}-mid-art.png`});
    await page.locator('#detail').screenshot({path:`${out}/${id}-${variant}-mid.png`});
    await seek(1200);
    const settled=await host.screenshot({path:`${out}/${id}-${variant}-settled-art.png`});
    await page.locator('#detail').screenshot({path:`${out}/${id}-${variant}-settled.png`});
    // Compare untouched source in the same inline rendering context: IMG SVG rasterization
    // has different edge antialiasing at fractional dialog coordinates in Chromium.
    const original=await readFile(`public/${variant==='gpt'?'sketchnote-gpt/':''}svg/${id}.svg`,'utf8');
    await host.evaluate((host,source)=>{const svg=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;svg.setAttribute('class','motion-svg');host.replaceChildren(document.importNode(svg,true))},original);
    const source=await host.screenshot({path:`${out}/${id}-${variant}-source-art.png`});
    const sourceDifference=await pixelDifference(settled,source),midDifference=await pixelDifference(mid,settled);
    assert.equal(sourceDifference,0,`${id}/${variant}: source fidelity`);assert(midDifference>0,`${id}/${variant}: visible mid-frame move`);
    report.samples.push({id,variant,move,sourceDifference,midDifference});
    const title=Buffer.from(`<svg width="360" height="54"><rect width="360" height="54" fill="#fff"/><text x="12" y="20" font-family="Arial" font-size="13" fill="#173b40">${icon.name.replaceAll('&','&amp;')} · ${variant}</text><text x="12" y="41" font-family="Arial" font-size="12" fill="#526c70">${move}: 300ms → 1200ms (source-exact)</text></svg>`);
    const cell=await sharp({create:{width:360,height:224,channels:4,background:'#f4f7f7'}}).composite([{input:title,left:0,top:0},{input:mid,left:10,top:58},{input:settled,left:190,top:58}]).png().toBuffer();
    sheet.push({input:cell,left:(sheet.length%4)*360,top:Math.floor(sheet.length/4)*224});
  }
  await sharp({create:{width:1440,height:896,channels:4,background:'#fff'}}).composite(sheet).png().toFile(`${out}/category-motion-contact-sheet.png`);
  report.checks.push('32 detail captures: 8 categories × 2 styles × 2 time points; 16 source-exact settled screenshots');

  await open('virtual-networks');await page.locator('#compare').click();await ready();await seek(300);
  assert.equal(await page.locator('.motion-svg').count(),2);
  const ids=await page.locator('#detail-preview [id]').evaluateAll(es=>es.map(e=>e.id));assert.equal(new Set(ids).size,ids.length);
  await page.locator('#detail').screenshot({path:`${out}/compare-mid.png`});await seek(1200);await page.locator('#detail').screenshot({path:`${out}/compare-settled.png`});
  // Keyboard replay and interruption must not compound original transforms.
  await page.locator('#replay').focus();await page.keyboard.press('Enter');await seek(300);
  assert(await page.locator('#detail-preview').evaluate(e=>e.getAnimations({subtree:true}).length)>0);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('#detail-preview').evaluate(e=>e.getAnimations({subtree:true}).length),0);
  assert(await page.locator('#replay').isDisabled());await page.locator('#detail').screenshot({path:`${out}/reduced-motion.png`});
  await page.keyboard.press('Escape');assert.equal(await page.locator('#motion-toggle').getAttribute('aria-checked'),'false');
  await page.locator('.specimen').first().focus();assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
  await page.reload();await page.locator('.icon-card').first().waitFor();assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
  report.reducedMotion='passed: initial load, live preference change, replay, grid focus, comparison; zero animations';
  await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#motion-toggle').click();assert.equal(await page.locator('#motion-toggle').getAttribute('aria-checked'),'false');
  await page.reload();await page.locator('.icon-card').first().waitFor();assert.equal(await page.locator('#motion-toggle').getAttribute('aria-checked'),'false');assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
  await page.locator('#motion-toggle').click();assert.equal(await page.locator('#motion-toggle').getAttribute('aria-checked'),'true');
  await page.locator('.specimen').first().hover();
  assert(await page.locator('.icon-motion-thumb').first().evaluate(e=>e.getAnimations().length)>0);
  await page.evaluate(()=>window.scrollTo(0,2000));await page.waitForTimeout(100);
  const offscreen=await page.evaluate(()=>[...document.querySelectorAll('.icon-card')].filter(e=>{const r=e.getBoundingClientRect();return r.bottom<=0||r.top>=innerHeight}).reduce((n,e)=>n+e.getAnimations({subtree:true}).length,0));assert.equal(offscreen,0);
  await page.waitForTimeout(700);await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(100);
  assert.equal(await page.locator('.icon-card').first().evaluate(e=>e.getAnimations().length),0);
  report.checks.push('Motion switch persists; grid hover and focus; offscreen cancellation; visible-card entrance once; keyboard Replay; isolated compare IDs');

  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(500);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:`${out}/${name}-finished.png`});
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    report[`${name}Axe`]=result.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));assert.deepEqual(report[`${name}Axe`],[]);
    await page.locator('.specimen').first().click();await ready();await seek(1200);assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth));await page.locator('#detail').screenshot({path:`${out}/${name}-detail-finished.png`});await page.keyboard.press('Escape');
  }
  await page.locator('#theme').click();await page.waitForTimeout(500);
  const dark=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.darkAxe=dark.violations.map(v=>({id:v.id,impact:v.impact}));assert.deepEqual(report.darkAxe,[]);
  await page.screenshot({path:`${out}/mobile-dark.png`});await page.locator('#theme').click();await page.setViewportSize({width:1440,height:1000});
  // Measure the real animation, not screenshot throughput.
  await open('azure-machine-learning','gpt');await page.locator('#replay').click();
  report.frameTiming=await page.evaluate(()=>new Promise(resolve=>{const times=[];let last=performance.now(),start=last;function tick(now){times.push(now-last);last=now;if(now-start<1400)requestAnimationFrame(tick);else{const sorted=times.slice(1).sort((a,b)=>a-b);resolve({frames:sorted.length,medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],over34ms:sorted.filter(t=>t>34).length})}}requestAnimationFrame(tick)}));
  report.checks.push('Desktop/mobile no overflow, light/dark WCAG AA, finite playback frame timing');

  if(process.argv.includes('--demo')){
    const frames=`${out}/demo-frames`;await mkdir(frames,{recursive:true});let count=0;
    for(const id of samples.slice(0,6)){
      await open(id);await page.locator('#compare').click();await ready();await page.locator('#replay').click();await seek(0);
      for(let frame=0;frame<60;frame++){await seek(frame*1000/30);await page.screenshot({path:`${frames}/${String(count++).padStart(4,'0')}.png`,clip:{x:470,y:70,width:500,height:860}})}
    }
    const demo='C:\\Users\\dev\\.openclaw\\media\\outbound\\azure-icons-motion';
    const run=args=>{const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr||'ffmpeg failed')};
    run(['-framerate','30','-i',`${frames}/%04d.png`,'-c:v','libx264','-pix_fmt','yuv420p','-crf','22','-movflags','+faststart',`${demo}.mp4`]);
    run(['-i',`${demo}.mp4`,'-vf','fps=12,scale=400:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse','-loop','0',`${demo}.gif`]);
    report.demo={mp4:`${demo}.mp4`,gif:`${demo}.gif`};
  }
  assert.deepEqual(report.errors,[]);report.status='passed';
}catch(error){report.status='failed';report.error=String(error);throw error}
finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close()}
console.log(JSON.stringify(report,null,2));
