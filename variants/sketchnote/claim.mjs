import fs from 'node:fs/promises';
import path from 'node:path';
import {root,icons,icon,locked,atomic,loadProgress,progressPath,requireOwner} from './lib.mjs';
const [cmd,...args]=process.argv.slice(2);
try { await locked(async()=>{
 let p;try{p=await loadProgress()}catch(e){if(e.code!=='ENOENT')throw e;p=Object.fromEntries(icons.map(i=>[i.id,{status:'todo',by:null,at:null}]))}
 let result;const at=new Date().toISOString();
 if(cmd==='init'){if(Object.keys(p).length!==icons.length)throw Error('Progress/catalog mismatch');result={count:Object.keys(p).length}}
 else if(cmd==='claim'){
  const [label,num,...preferred]=args;const n=Number(num);if(!/^[a-zA-Z0-9_-]+$/.test(label||'')||!Number.isInteger(n)||n<1||n>20)throw Error('Usage: claim <label> <1..20> [preferred ids...]');
  preferred.forEach(icon);const candidates=preferred.length?[...new Set(preferred)]:icons.map(i=>i.id);result=candidates.filter(id=>p[id].status==='todo').slice(0,n);
  for(const id of result)p[id]={status:'claimed:'+label,by:label,at};
 }else if(cmd==='done'||cmd==='failed'){
  const [id,...reason]=args;if(!process.env.SKETCH_LABEL)throw Error('Set SKETCH_LABEL to your claim label before done/failed');requireOwner(p,id,process.env.SKETCH_LABEL);
  if(cmd==='done'){for(const rel of ['svg/'+id+'.svg','png/64/'+id+'.png','png/256/'+id+'.png'])await fs.access(path.join(root,rel));}
  if(cmd==='failed'&&!reason.length)throw Error('failed requires reason');
  p[id]={...p[id],status:cmd,at,...(cmd==='failed'?{reason:reason.join(' ')}:{})};result={id,...p[id]};
 }else if(cmd==='release'){
  const [label]=args;if(!label)throw Error('release requires label');result=[];for(const [id,v]of Object.entries(p))if(v.status==='claimed:'+label){p[id]={status:'todo',by:null,at};result.push(id)}
 }else throw Error('Usage: init | claim <label> <N> [ids...] | done <id> | failed <id> <reason> | release <label>');
 await atomic(progressPath,JSON.stringify(p,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}) }catch(e){console.error(e.message);process.exitCode=1}
