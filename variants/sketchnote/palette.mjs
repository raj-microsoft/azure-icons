// Local source-colour inventory. No geometry is copied; selections feed hand-authored sketches.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DOMParser} from '@xmldom/xmldom';
import {root,repo} from './lib.mjs';
export const normalise=c=>{c=c.trim().toUpperCase();return /^#[0-9A-F]{3}$/.test(c)?'#'+[...c.slice(1)].map(x=>x+x).join(''):c};
const style=(el,key)=>el.getAttribute(key)||el.getAttribute('style')?.split(';').map(x=>x.split(':').map(x=>x.trim())).find(x=>x[0]===key)?.[1];
export function extractPalette(source){
 const doc=new DOMParser().parseFromString(source,'image/svg+xml'),all=Array.from(doc.getElementsByTagName('*'));
 const solids=[...new Set(all.filter(e=>e.tagName!=='stop').map(e=>style(e,'fill')).filter(c=>c&&!/^(none|url\(|currentColor)/i.test(c)).map(normalise))];
 const gradients=all.filter(e=>/^(linearGradient|radialGradient)$/.test(e.tagName)).map(e=>{
  const stops=Array.from(e.getElementsByTagName('stop')).map(s=>({offset:s.getAttribute('offset').includes('%')?parseFloat(s.getAttribute('offset'))/100:Number(s.getAttribute('offset')||0),colour:normalise(style(s,'stop-color')||'#000')}));
  // Nearest actual midpoint stop, rather than inventing a mixed RGB colour; ties favour the first stop.
  const middle=stops.reduce((a,b)=>Math.abs(b.offset-.5)<Math.abs((a?.offset??Infinity)-.5)?b:a,null);
  const light=stops.reduce((a,b)=>{const lum=x=>/^#[0-9A-F]{6}$/.test(x)?parseInt(x.slice(1,3),16)*.2126+parseInt(x.slice(3,5),16)*.7152+parseInt(x.slice(5,7),16)*.0722:0;return !a||lum(b.colour)>lum(a.colour)?b:a},null);
  return {id:e.getAttribute('id'),href:e.getAttribute('href')||e.getAttribute('xlink:href')||undefined,stops,flat:middle?.colour,highlight:light?.colour};
 });
 for(const g of gradients)if(!g.stops.length&&g.href){const base=gradients.find(x=>x.id===g.href.slice(1));if(base){g.stops=base.stops;g.flat=base.flat;g.highlight=base.highlight}}
 return {solids,gradients,colours:[...new Set([...solids,...gradients.flatMap(g=>g.stops.map(s=>s.colour))])]};
}
export async function paletteFor(id){return extractPalette(await fs.readFile(path.join(repo,'public/svg',id+'.svg'),'utf8'))}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const ids=process.argv.slice(2).length?process.argv.slice(2):JSON.parse(await fs.readFile(path.join(root,'raw/pilot-v2/ids.json')));
 const result=Object.fromEntries(await Promise.all(ids.map(async id=>[id,await paletteFor(id)])));
 console.log(JSON.stringify(result,null,2));
}
