import {readFile,writeFile} from 'node:fs/promises';
import {archetypes} from '../src/scenes.ts';
const articles=JSON.parse(await readFile('public/architectures/articles.json','utf8'));
const icons=JSON.parse(await readFile('public/icons.json','utf8')).icons;
const reviewed=JSON.parse(await readFile('scripts/aac-reviewed.json','utf8'));
let previous={};try{previous=JSON.parse(await readFile('public/architectures/scenes.json','utf8'))}catch{}
const aliases={
 'azure-kubernetes-service':'kubernetes-services','azure-container-apps':'container-apps','azure-container-registry':'container-registries','azure-virtual-machines':'virtual-machine','azure-vm-scalesets':'vm-scale-sets','azure-files':'storage-azure-files','azure-blob-storage':'storage-accounts','azure-storage':'storage-accounts','azure-data-lake':'data-lake-storage-gen1','azure-sql-database':'sql-database','azure-sql-managed-instance':'sql-managed-instance','azure-cosmos-db':'azure-cosmos-db','azure-synapse-analytics':'azure-synapse-analytics','azure-databricks':'azure-databricks','azure-data-factory':'data-factories','azure-app-service':'app-services','azure-application-gateway':'application-gateways','azure-api-management':'api-management-services','azure-expressroute':'expressroute-circuits','azure-vpn-gateway':'virtual-network-gateways','azure-virtual-network':'virtual-networks','azure-private-link':'private-link','azure-virtual-wan':'virtual-wans','azure-front-door':'front-door-and-cdn-profiles','azure-monitor':'monitor','azure-key-vault':'key-vaults','azure-firewall':'firewalls','azure-devops':'azure-devops','azure-functions':'function-apps','azure-logic-apps':'logic-apps','azure-event-hubs':'event-hubs','azure-event-grid':'event-grid-topics','azure-service-bus':'azure-service-bus','azure-iot-hub':'iot-hub','azure-iot-edge':'iot-edge','microsoft-foundry':'ai-foundry','foundry-tools':'cognitive-services','foundry-agent-service':'foundry-agent-service','azure-cognitive-search':'search-services','azure-machine-learning':'machine-learning','azure-machine-learning-studio':'machine-learning','azure-backup':'recovery-services-vaults','azure-site-recovery':'recovery-services-vaults','azure-netapp-files':'azure-netapp-files','entra-id':'entra-id','azure-dns':'dns-zones','azure-managed-redis':'azure-cache-redis','azure-database-postgresql':'azure-database-postgresql-server','azure-policy':'policy','azure-rbac':'role-based-access-control','azure-bastion':'bastions','microsoft-sentinel':'azure-sentinel','azure-arc':'azure-arc','azure-redhat-openshift':'azure-red-hat-openshift','azure-digital-twins':'digital-twins','azure-data-explorer':'azure-data-explorer-clusters'
};
// Ordered semantic rules: title intent outranks incidental service/category mentions.
const rules=[
 [/quantum/i,'quantum-orbits','Quantum state linked to a classical application'],
 [/noisy neighbor|multitenant solution|requests to tenants/i,'neighbor-apartments','Isolation and fair sharing between tenants'],
 [/private.*upload|valet key|forensics/i,'gate-vault','Controlled handoff into a protected store'],
 [/migrat|rehost|refactor|re-engineer|mainframe/i,'bridge-migration','Move a workload or its data to another environment'],
 [/cache|redis/i,'cache-pantry','Near cache in front of a durable store'],
 [/disaster|recovery|resilien|high availability|highly available|redundant|retry/i,'recovery-lighthouse','Maintain service when a primary location fails'],
 [/document|forms|extract.*text|unstructured|enrichment/i,'document-press','Turn documents into structured information'],
 [/media|video|image classification/i,'stage-media','Analyze and process visual or media content'],
 [/monitor|observab|performance|threat/i,'observatory-monitoring','Observe health, behavior, or threats'],
 [/devops|gitops|apiops|deployment|automation/i,'conveyor-devops','Reproducible build, test, and release workflow'],
 [/identity|authentication|certificate|\bAD DS\b/i,'identity-key','Verify identity before granting access'],
 [/security|secure|defense|protect|compliance|hardened/i,'shield-fortress','Layered protection of a workload'],
 [/iot|sensor|edge device/i,'satellite-iot','Gather and act on device telemetry'],
 [/wan|multiregion|hub.spoke|cdn/i,'globe-network','Connect regional hubs and deliver traffic'],
 [/routing|gateway|\bdns\b|communication|integration|message/i,'switchyard-routing','Route requests or messages to the right service'],
 [/hybrid|azure local|\barc\b/i,'hybrid-islands','Connect and manage local and cloud resources'],
 [/lakehouse|data lake|data platform/i,'data-lake','Unify incoming streams in a common data lake'],
 [/warehouse|analytics|forecast|sustainability|\bBI\b|SAS/i,'orchard-analytics','Grow raw data into actionable insight'],
 [/stream|ETL|batch|factory|manufactur|teamcenter|maximo/i,'pipeline-factory','Process inputs through successive production stages'],
 [/agent|chat|inference|machine learning|AI/i,'brain-agents','Coordinate intelligent models and agents'],
 [/container|kubernetes|aks|microservice/i,'harbor-containers','Orchestrate independently packaged services'],
 [/file|archive|storage|database|SQL|SAP|HANA/i,'archive-library','Organize persistent files and records'],
 [/web|wordpress|app service|moodle|sharepoint|portable applications/i,'city-web','Serve users from a connected application'],
 [/compute|virtual machine|\bVM\b|desktop/i,'compute-workshop','Assemble and run compute workloads']
];
export function classify(a){
 const title=rules.find(([re])=>re.test(a.title));if(title)return {archetype:title[1],reason:title[2]};
 const text=[a.summary,...a.azure_categories,...a.display_products].join(' ');
 const matched=rules.find(([re])=>re.test(text));return matched?{archetype:matched[1],reason:matched[2]}:{archetype:'compute-workshop',reason:'General cloud workload: compute workshop fallback'};
}
const hash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
const output={};
for(const a of articles){
 const seed=hash(a.id),choice=reviewed[a.title],fallback=classify(a),old=previous[a.id];
 const archetype=choice?.archetype||fallback.archetype;
 if(!archetypes.includes(archetype))throw Error(`Unknown archetype for ${a.title}`);
 const actors=[];
 for(let i=0;i<a.products.length;i++){
  const product=a.products[i],name=a.display_products[i];
  const match=icons.find(x=>x.id===aliases[product])||icons.find(x=>x.name.toLowerCase()===name?.toLowerCase())||icons.find(x=>x.id===product);
  if(match&&!actors.some(x=>x.id===match.id))actors.push({id:match.id,name:match.name});
 }
 output[a.id]={archetype,seed,accent:['#328475','#38878d','#417f6b','#2d8196'][seed%4],count:3+seed%3,variant:seed%13,label:choice?.label||'',actors:actors.slice(0,3),duration:4000+seed%2001,reason:choice?.reason||fallback.reason,reviewed:!!choice,...(old?.art?{art:old.art}:{})};
}
await writeFile('public/architectures/scenes.json',JSON.stringify(output,null,2)+'\n');
console.log(`Scenes: ${Object.keys(output).length}/${articles.length}; hand-reviewed ${Object.values(output).filter(x=>x.reviewed).length}; ${new Set(Object.values(output).map(s=>s.archetype)).size} archetypes; ${Object.values(output).filter(x=>x.art).length} bespoke art.`);
