#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {DOMParser,XMLSerializer} from '@xmldom/xmldom';
import {sanitizeArt} from '../src/art-sanitizer.ts';
export function sanitize(source,prefix=`art-${createHash('sha256').update(source).digest('hex').slice(0,10)}-`){
  return sanitizeArt(source,s=>new DOMParser({onError:(level,message)=>{throw Error(`Invalid SVG XML (${level}): ${message}`)}}).parseFromString(s,'image/svg+xml'),el=>new XMLSerializer().serializeToString(el),prefix);
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/sanitize-art.mjs')){
  try{const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: node scripts/sanitize-art.mjs <in.svg> <out.svg> (Node 24+)');
    const clean=sanitize(await readFile(input,'utf8'));await mkdir(dirname(output),{recursive:true});await writeFile(output,clean);console.log(`Sanitized SVG: ${Buffer.byteLength(clean)} bytes → ${output}`);
  }catch(error){console.error(`SVG rejected: ${error.message}`);process.exitCode=1}
}
