import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root=path.dirname(fileURLToPath(import.meta.url));
export const repo=path.resolve(root,'../..');
export const icons=JSON.parse(await fs.readFile(path.join(repo,'public/icons.json'),'utf8')).icons;
export const catalog=new Map(icons.map(i=>[i.id,i]));
export const progressPath=process.env.SKETCH_PROGRESS||path.join(root,'progress.json');
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function atomic(file,data){await fs.mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+process.pid+'.'+Date.now()+'.tmp';try{await fs.writeFile(tmp,data);await fs.rename(tmp,file)}finally{await fs.rm(tmp,{force:true})}}
export async function locked(fn){const lock=progressPath+'.lock';let h;for(let n=0;n<200;n++){try{h=await fs.open(lock,'wx');break}catch(e){if(e.code!=='EEXIST')throw e;await sleep(75+Math.random()*125)}}if(!h)throw Error('Lock busy after bounded retries; inspect owner before manually clearing stale lock');try{await h.writeFile(JSON.stringify({pid:process.pid,at:new Date().toISOString()}));return await fn()}finally{await h.close();await fs.unlink(lock)}}
export async function loadProgress(){return JSON.parse(await fs.readFile(progressPath,'utf8'))}
export function icon(id){const i=catalog.get(id);if(!i)throw Error('Unknown icon: '+id);return i}
export function requireOwner(p,id,label){icon(id);if(!p[id]?.status?.startsWith('claimed:'))throw Error(id+' is not claimed');if(label&&p[id].status!=='claimed:'+label)throw Error('Claim belongs to another worker');}
export const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
