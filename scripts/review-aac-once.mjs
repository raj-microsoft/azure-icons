// One-time review migration. Kept as an auditable record of the supplied brief's order.
import {readFile,writeFile} from 'node:fs/promises';
import {descriptions} from '../src/scenes.ts';
const original=JSON.parse(await readFile(process.argv[2],'utf8'));
const groups={
 'globe-network':[47,51,71,86,87,101,112,135,163,185],
 'gate-vault':[130,176,186],
 'bridge-migration':[0,1,11,12,16,17,41,62,68,81,88,90,91,98,102,107,134,136,140,149,157,177],
 'pipeline-factory':[26,36,58,63,65,77,82,169,171,178,180],
 'brain-agents':[4,59,105,123,138,156,159,170],
 'city-web':[25,54,76,99,132,139,175,179],
 'data-lake':[3,5,46,60,67,70,95,104,160],
 'shield-fortress':[33,44,45,53,106,117,125,127,129,137,148,150,161],
 'hybrid-islands':[21,28,30,37,48,96,108,110,113,119,154,165,174],
 'conveyor-devops':[15,50,57,83,118,120,122,155],
 'satellite-iot':[56,121],
 'stage-media':[94,152],
 'archive-library':[23,24,43,75,100,145,151,168,183],
 'harbor-containers':[18,19,22,55,73,109,111,146,184],
 'switchyard-routing':[6,13,20,29,32,39,40,61,80,89,131,182],
 'observatory-monitoring':[7,69,78,147,172],
 'orchard-analytics':[8,9,49,92,143],
 'document-press':[14,66,72,93,103,116,126,144],
 'cache-pantry':[27,31,79,115,124],
 'recovery-lighthouse':[35,64,84,133,166,167,173,181],
 'compute-workshop':[2,74,85,128,141,158],
 'identity-key':[34,38,42,52,142,153,162,164],
 'quantum-orbits':[97],
 'neighbor-apartments':[10,114]
};
const reviewed={},assigned=new Set();
for(const [archetype,indices] of Object.entries(groups))for(const i of indices){
 if(assigned.has(i))throw Error(`Duplicate assignment ${i}`);assigned.add(i);
 const a=original[i];reviewed[a.title]={archetype,reason:`Editorial review: ${descriptions[archetype].toLowerCase()}.`,label:''};
}
if(assigned.size!==original.length)throw Error('Unreviewed indices: '+original.map((_,i)=>i).filter(i=>!assigned.has(i)));
reviewed['Architectural considerations for a multitenant solution']={archetype:'neighbor-apartments',reason:'Separate tenant homes share a common infrastructure foundation.',label:''};
reviewed['Baseline Microsoft Foundry chat reference architecture']={archetype:'brain-agents',reason:'A coordinated reasoning engine behind an enterprise chat experience.',label:''};
reviewed['Multiregion load balancing']={archetype:'globe-network',reason:'Distribute incoming traffic across multiple regional hubs.',label:''};
for(const [title,item] of Object.entries(reviewed)){
 if(/medallion/i.test(title))item.label='REFINE → SERVE';
 else if(/lakehouse|lake/i.test(title))item.label='SHARED LAKE';
 else if(/data platform/i.test(title))item.label='DATA PLATFORM';
}
await writeFile('scripts/aac-reviewed.json',JSON.stringify(reviewed,null,2)+'\n');
console.log(`Individually mapped ${assigned.size} source rows; ${Object.keys(reviewed).length} unique live titles including 3 recovered entries.`);
