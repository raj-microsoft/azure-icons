import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
const {icons}=JSON.parse(await fs.readFile('../../public/icons.json','utf8'));
const pages=[];
for(let n=0;n<icons.length;n+=40){const label=`publish-review-${String(n/40+1).padStart(2,'0')}`;const r=spawnSync(process.execPath,['sheet.mjs',label,'96',...icons.slice(n,n+40).map(i=>i.id)],{encoding:'utf8'});if(r.status)throw Error(r.stderr);const p=`sheets/${label}-96.png`;pages.push(p);console.log(p);}
// One complete contact sheet, plus legible page views of every pair.
const metadata=await Promise.all(pages.map(p=>sharp(p).metadata()));const width=Math.max(...metadata.map(m=>m.width));let top=0;const overlays=pages.map((input,n)=>{const entry={input,top,left:0};top+=metadata[n].height;return entry});await sharp({create:{width,height:top,channels:4,background:'#fff'}}).composite(overlays).png().toFile('sheets/publish-review-all-643.png');
await fs.writeFile('sheets/publish-review-manifest.json',JSON.stringify({count:icons.length,pages,ids:icons.map(i=>i.id)},null,2));
