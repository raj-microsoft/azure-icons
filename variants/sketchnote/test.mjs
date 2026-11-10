import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import sharp from 'sharp';
import {validate} from './validate.mjs';
import {root,icons} from './lib.mjs';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sketch-test-'));
const env={...process.env,SKETCH_PROGRESS:path.join(dir,'progress.json')};
function run(args,label){return new Promise((resolve,reject)=>{const c=spawn(process.execPath,[path.join(root,'claim.mjs'),...args],{env:{...env,...(label?{SKETCH_LABEL:label}:{})}});let out='',err='';c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>err+=d);c.on('error',reject);c.on('close',code=>code?reject(Error(err)):resolve(JSON.parse(out)))})}
const good='<svg viewBox="0 0 128 128"><path fill="#0078D4" d="M20 20H90V90H20Z"/><circle cx="95" cy="30" r="10" fill="#FFC83D"/><path d="M20 100H110" stroke="#1B1B1F" stroke-width="4"/></svg>';
let rejected=0;
try{
 assert.equal((await run(['init'])).count,643);
 const batches=await Promise.all(Array.from({length:5},(_,n)=>run(['claim','test-'+n,'10'])));assert.equal(new Set(batches.flat()).size,50);
 await assert.rejects(run(['failed',batches[0][0],'wrong owner'],'test-1'));
 await run(['failed',batches[0][0],'fixture failure'],'test-0');
 await Promise.all(Array.from({length:5},(_,n)=>run(['release','test-'+n])));
 const p=JSON.parse(await fs.readFile(env.SKETCH_PROGRESS));assert.equal(Object.values(p).filter(v=>v.status==='todo').length,642);assert.equal(Object.values(p).filter(v=>v.status==='failed').length,1);
 const ok=await validate('```svg\n'+good+'\n```','Fixture & test');assert.match(ok.normalized,/<title>Fixture &amp; test \(sketch\)<\/title>/);assert.equal(ok.shapes,3);assert.deepEqual(Object.keys(ok.pngs),['32','64','128','256']);
 const bad=[good.replace('128 128','64 64'),good.replace('</svg>','<image href="x"/></svg>'),good.replace('</svg>','<text>X</text></svg>'),good.replace('</svg>','<script/></svg>'),good.replace('</svg>','<foreignObject/></svg>'),good.replace('</svg>','<style>@font-face{}</style></svg>'),good.replace('<path fill','<path href="https://bad.example/x" fill'),good.replace('<path fill','<path onclick="bad()" fill'),good.replace('#0078D4','url(https://bad.example/x)'),good.replace('</svg>','</g></svg>'),good.replace('<svg','<!DOCTYPE svg><svg'),'<svg viewBox="0 0 128 128"><path/><path/><path/></svg>',good.replace('<circle','<g opacity="0"><circle').replace('</svg>','</g></svg>').replace('<path fill','#INVALID'),good+' '.repeat(41000),'<svg viewBox="0 0 128 128"><path d="M0 0L1 1"/></svg>'];
 for(const source of bad){await assert.rejects(validate(source,'Bad'));rejected++}
 await fs.writeFile(path.join(dir,'virtual-machine.svg'),ok.normalized);
 for(const size of [32,96]){
  await new Promise((resolve,reject)=>{const c=spawn(process.execPath,[path.join(root,'sheet.mjs'),'TEST-FIXTURE',String(size),'virtual-machine'],{env:{...process.env,SKETCH_SVG_DIR:dir,SKETCH_SHEET_DIR:dir}});let err='';c.stderr.on('data',d=>err+=d);c.on('error',reject);c.on('close',code=>code?reject(Error(err)):resolve())});
  const meta=await sharp(path.join(dir,`TEST-FIXTURE-${size}.png`)).metadata();assert(meta.width>size*2&&meta.height>size);
 }
 console.log(JSON.stringify({ok:true,catalog:icons.length,concurrentWorkers:5,uniqueClaims:50,rejectedInvalidFixtures:rejected,renderSizes:[32,64,128,256],fixtureComparisonSheets:[32,96]},null,2));
}finally{await fs.rm(dir,{recursive:true,force:true})}
