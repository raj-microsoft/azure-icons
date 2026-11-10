import fs from 'node:fs/promises';
import path from 'node:path';
import {DOMParser,XMLSerializer} from '@xmldom/xmldom';
import {Resvg} from '@resvg/resvg-js';
import sharp from 'sharp';
import {root,icon,locked,atomic,loadProgress,requireOwner} from './lib.mjs';
export async function validate(input,name){
 if(Buffer.byteLength(input)>=40960)throw Error('Input must be <40 KB');
 if(/<!DOCTYPE|<!ENTITY/i.test(input))throw Error('DTD/entities forbidden');
 const fenced=[...input.matchAll(/```(?:svg|xml|html)?\s*([\s\S]*?)```/gi)];
 let source=fenced.length?fenced.find(m=>m[1].includes('<svg'))?.[1]:input;
 if(!source)throw Error('Missing SVG code block');
 const start=source.indexOf('<svg'),end=source.lastIndexOf('</svg>');
 if(start<0||end<start)throw Error('Missing complete SVG root');source=source.slice(start,end+6);
 const errors=[];const doc=new DOMParser({onError:(level,message)=>errors.push(level+': '+message)}).parseFromString(source,'image/svg+xml');
 if(errors.length)throw Error('XML: '+errors.join('; '));
 const svg=doc.documentElement;if(svg.tagName!=='svg'||doc.getElementsByTagName('parsererror').length)throw Error('Not SVG XML');
 if(svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number).join(' ')!=='0 0 128 128')throw Error('viewBox must be 0 0 128 128');
 const allowed=new Set(['svg','g','defs','path','rect','circle','ellipse','line','polyline','polygon','title','desc','clipPath','mask','linearGradient','radialGradient','stop']);let shapes=0;
 for(const el of [svg,...Array.from(svg.getElementsByTagName('*'))]){
  if(!allowed.has(el.tagName))throw Error('Forbidden element: '+el.tagName);
  if(el.namespaceURI&&el.namespaceURI!=='http://www.w3.org/2000/svg')throw Error('Foreign namespace');
  if(/^(path|rect|circle|ellipse|line|polyline|polygon)$/.test(el.tagName))shapes++;
  for(const a of Array.from(el.attributes)){
   if(/^on/i.test(a.name)||/href$/i.test(a.name)&&!/^#[\w.-]+$/.test(a.value))throw Error('Unsafe attribute '+a.name);
   if(/@font-face|@import|expression\s*\(|javascript:|data:|https?:|file:/i.test(a.value)&&!/^xmlns(?::\w+)?$/.test(a.name))throw Error('External/active content');
   for(const m of a.value.matchAll(/url\s*\(([^)]*)\)/gi))if(!/^['"]?#[\w.-]+['"]?$/.test(m[1].trim()))throw Error('External URL');
  }
 }
 if(shapes<3)throw Error('Need at least 3 shape elements');
 for(const t of Array.from(svg.getElementsByTagName('title')))t.parentNode.removeChild(t);
 svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('viewBox','0 0 128 128');svg.setAttribute('width','128');svg.setAttribute('height','128');
 const title=doc.createElement('title');title.appendChild(doc.createTextNode(name+' (sketch)'));svg.insertBefore(title,svg.firstChild);
 const normalized=new XMLSerializer().serializeToString(svg)+'\n';if(Buffer.byteLength(normalized)>=40960)throw Error('Normalized SVG >=40KB');
 const pngs={},checks={};
 for(const size of [32,128,64,256]){
  const png=new Resvg(normalized,{fitTo:{mode:'width',value:size}}).render().asPng();
  if(size===32||size===128){const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});let visible=0,ink=0;for(let n=0;n<data.length;n+=4){if(data[n+3]>16)visible++;if(data[n+3]>32&&Math.min(data[n],data[n+1],data[n+2])<235)ink++}checks[size]={visible,ink};if(visible/(info.width*info.height)<.01||ink/(info.width*info.height)<.005)throw Error('Blank/near-blank at '+size);}
  pngs[size]=png;
 }
 return {normalized,pngs,checks,shapes};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.join(root,'validate.mjs')){
 try{const [id,file,label]=process.argv.slice(2);const i=icon(id);if(!file||!label)throw Error('Usage: node validate.mjs <id> <raw-file> <claim-label>');const result=await validate(await fs.readFile(file,'utf8'),i.name);
 await locked(async()=>{const p=await loadProgress();requireOwner(p,id,label);await atomic(path.join(root,'svg',id+'.svg'),result.normalized);for(const size of [64,256])await atomic(path.join(root,'png',String(size),id+'.png'),result.pngs[size]);await atomic(path.join(root,'qa',id+'.json'),JSON.stringify({id,by:label,at:new Date().toISOString(),shapes:result.shapes,checks:result.checks},null,2));});console.log(JSON.stringify({id,ok:true,checks:result.checks}));
 }catch(e){console.error(e.message);process.exitCode=1}
}
