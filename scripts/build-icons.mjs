import { readdir, readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
const root = path.resolve('src/raw/Azure_Public_Service_Icons/Icons');
const out = path.resolve('public');
for (const d of ['svg','png/64','png/256']) await mkdir(path.join(out,d),{recursive:true});
const pretty = s => s.replace(/\b(ai|iot|sql|api|vm|ip)\b/gi, s=>s.toUpperCase()).replace(/\b[a-z]/g,s=>s.toUpperCase());
const aliases = [
 [/container apps|ACA/i,['ACA','Azure Container Apps']], [/kubernetes/i,['AKS','Azure Kubernetes Service','k8s']], [/virtual machine/i,['VM','VMs','compute']], [/virtual network/i,['VNet','network']], [/sql/i,['SQL','database']], [/entra|active directory/i,['AAD','Entra','Azure Active Directory','identity']], [/key vault/i,['KV','Key Vault','secrets']], [/container registr/i,['ACR','Azure Container Registry']], [/api management/i,['APIM']], [/openai/i,['AOAI','OpenAI','Azure OpenAI']], [/foundry/i,['Foundry','AI Studio','Azure AI']], [/fabric/i,['Fabric']], [/cosmos/i,['NoSQL']], [/storage account/i,['blob','ADLS']], [/function/i,['serverless']], [/app service/i,['web app']], [/event hub/i,['streaming']], [/service bus/i,['messaging']]
];
const novNames = ['Azure Confidential Clean Rooms','Azure Container Apps Sandboxes','Azure Device Registry','Azure HorizonDB'];
const normalize = s => s.toLowerCase().replace(/^azure\s+/,'').replace(/[^a-z0-9]/g,'');
const byName = new Map(); let sourceCount=0; const provenance=[];
for (const category of (await readdir(root)).sort()) {
 for (const file of (await readdir(path.join(root,category))).filter(f=>f.endsWith('.svg')).sort()) {
  sourceCount++;
  const derived=file.replace(/^\d+\s*-\s*/,'').replace(/^icon-service-/i,'').replace(/\.svg$/i,'').replace(/-/g,' ').replace(/\s+/g,' ').trim();
  const name=derived==='ACA Sandboxes'?'Azure Container Apps Sandboxes':derived;
  const key=name.toLowerCase(); const cat=pretty(category);
  const bytes=await readFile(path.join(root,category,file));
  if (byName.has(key)) { const existing=byName.get(key); if(!existing.categories.includes(cat)) existing.categories.push(cat); existing.sources++; provenance.push({file:`${category}/${file}`,id:existing.id,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}); continue; }
  const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const keywords = [...new Set([name,...name.split(/\s+/),cat,...aliases.filter(([re])=>re.test(name)).flatMap(([,a])=>a)])];
  const icon={id,name,categories:[cat],keywords,sources:1,...(novNames.some(n=>normalize(n)===normalize(name))?{isNew:true}:{})};
  byName.set(key,icon);
  await copyFile(path.join(root,category,file),path.join(out,'svg',`${id}.svg`));
  // Render the complete SVG viewBox, then contain it in a transparent square. No crop, rotation or distortion.
  for(const size of [64,256]) {
   const svg=new Resvg(bytes,{fitTo:{mode:'width',value:size}}).render().asPng();
   await sharp(svg).resize(size,size,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().withMetadata({comments:[`Source: Microsoft Azure Architecture Center V25; ${category}/${file}; unmodified SVG rasterized with preserved aspect ratio.`]}).toFile(path.join(out,'png',String(size),`${id}.png`));
  }
  provenance.push({file:`${category}/${file}`,id,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
}
const icons=[...byName.values()].sort((a,b)=>a.name.localeCompare(b.name));
for(const icon of icons) icon.keywords=[...new Set([...icon.keywords,...icon.categories])];
await writeFile(path.join(out,'icons.json'),JSON.stringify({version:'V25',updated:'November 2026',sourceCount,icons}));
await writeFile('scripts/provenance.json',JSON.stringify({source:'https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V25.zip',retrieved:'2026-11-10',rasterization:'resvg and sharp; transparent contain; full original viewBox; SVG files copied byte-for-byte',sourceCount,uniqueCount:icons.length,files:provenance},null,2));
console.log(JSON.stringify({sourceCount,uniqueCount:icons.length,categories:new Set(icons.flatMap(i=>i.categories)).size,newIcons:icons.filter(i=>i.isNew).map(i=>i.name)},null,2));
