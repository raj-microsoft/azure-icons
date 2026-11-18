import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const source='https://learn.microsoft.com/api/contentbrowser/search/architectures?locale=en-us&$orderby=title';
const rows=[];let expectedCount;
for(let skip=0;skip<3000;skip+=30){
  const response=await fetch(`${source}&$top=30&$skip=${skip}`,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`Architecture source returned ${response.status}; committed data was not changed`);
  const data=await response.json();
  if(!Array.isArray(data.results))throw Error('Unexpected Architecture Center response');
  expectedCount??=data.count;rows.push(...data.results);
  if(data.results.length<30)break;
}
if(!rows.length||rows.length>=3000)throw Error('Empty or unexpectedly unbounded architecture index');
const occurrences=new Map();
const articles=rows.map(row=>{
  const url=new URL(row.url,'https://learn.microsoft.com').href;
  if(!url.startsWith('https://learn.microsoft.com/'))throw Error(`Unexpected article origin: ${url}`);
  const n=(occurrences.get(url)||0)+1;occurrences.set(url,n);
  const {thumbnail_url,...rest}=row;
  return {...rest,url,id:`${createHash('sha256').update(url).digest('hex').slice(0,12)}${n>1?`-${n}`:''}`};
});
if(occurrences.size!==articles.length||expectedCount!==articles.length)throw Error(`Incomplete or unstable source pagination: ${articles.length} rows, ${occurrences.size} unique, expected ${expectedCount}. Committed data was not changed.`);
await mkdir('public/architectures',{recursive:true});
await writeFile('public/architectures/articles.json',JSON.stringify(articles,null,2)+'\n');
console.log(`Fetched ${articles.length} entries / ${occurrences.size} distinct Learn articles. No Microsoft thumbnails retained.`);
