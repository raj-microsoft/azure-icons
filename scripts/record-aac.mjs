import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
const folder='verification/aac/video';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1,colorScheme:'light'});
 await page.goto('http://127.0.0.1:4173/azure-icons/architectures/',{waitUntil:'networkidle'});
 await page.locator('.architecture-card').first().waitFor();
 // A direct capture of the working page, with a deterministic 24fps renderer clock.
 const fps=24,seconds=20;
 for(let i=0;i<fps*seconds;i++){
  const t=i/fps,progress=Math.max(0,Math.min(1,(t-2)/16)),smooth=progress*progress*(3-2*progress);
  await page.evaluate(({y,time})=>{window.scrollTo(0,y);window.aacTest.frame(time)}, {y:Math.round(smooth*3500),time:t*1000});
  await page.screenshot({path:`${folder}/${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:85});
 }
 console.log(`${fps*seconds} direct page frames captured at ${fps}fps; 1280×900.`);
}finally{await browser.close()}
