import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {Resvg} from '@resvg/resvg-js';
import {root,repo,icon,escape,atomic} from './lib.mjs';
const [label,sizeArg,...ids]=process.argv.slice(2);const size=Number(sizeArg);
if(!/^[a-zA-Z0-9_-]+$/.test(label||'')||![32,96].includes(size)||!ids.length)throw Error('Usage: node sheet.mjs <label> <32|96> <id> ...');
ids.forEach(icon);const cellW=Math.max(160,size*2+32),cellH=size+78,cols=Math.min(10,ids.length),width=cols*cellW,height=Math.ceil(ids.length/cols)*cellH+36;const composite=[];
let labels=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="12" y="23" font-family="Arial" font-size="16" fill="#1B1B1F">Official left / sketch right — ${size}px — ${escape(label)}</text>`;
for(let n=0;n<ids.length;n++){
 const id=ids[n],x=(n%cols)*cellW,y=Math.floor(n/cols)*cellH+42;
 for(const [j,file]of [path.join(repo,'public/svg',id+'.svg'),path.join(process.env.SKETCH_SVG_DIR||path.join(root,'svg'),id+'.svg')].entries()){
  const svg=await fs.readFile(file);const png=new Resvg(svg,{fitTo:{mode:'width',value:size}}).render().asPng();const square=await sharp(png).resize(size,size,{fit:'contain',background:'#ffffff00'}).png().toBuffer();composite.push({input:square,left:x+Math.floor((cellW-size*2-12)/2)+j*(size+12),top:y});
 }
 const words=icon(id).name.split(' ');const lines=[''];for(const w of words){if((lines.at(-1)+' '+w).length>Math.floor(cellW/6.6))lines.push(w);else lines[lines.length-1]+=(lines.at(-1)?' ':'')+w}
 lines.slice(0,3).forEach((line,k)=>{labels+=`<text x="${x+cellW/2}" y="${y+size+20+k*15}" text-anchor="middle" font-family="Arial" font-size="12" fill="#1B1B1F">${escape(line)}</text>`});
}
labels+='</svg>';composite.push({input:Buffer.from(labels),left:0,top:0});const out=path.join(process.env.SKETCH_SHEET_DIR||path.join(root,'sheets'),`${label}-${size}.png`);await atomic(out,await sharp({create:{width,height,channels:4,background:'#ffffff'}}).composite(composite).png().toBuffer());console.log(out);
