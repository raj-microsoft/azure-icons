import './style.css';
import './architectures.css';
import '@fontsource-variable/manrope';
import {sceneSVG,updateScene,escape,archetypes,type Scene} from './scenes';
import {sanitizeArt} from './art-sanitizer';
type Article={id:string;title:string;summary:string;url:string;azure_categories:string[];display_azure_categories:string[];products:string[];display_products:string[];content_type:string;last_modified:string};
const base=import.meta.env.BASE_URL,app=document.querySelector<HTMLDivElement>('#app')!;
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let motion=true;try{localStorage.removeItem('icon-motion')}catch{}
let articles:Article[]=[],scenes:Record<string,Scene>={},observer:IntersectionObserver,frame=0;
const visible=new Set<HTMLElement>(),active=new Set<HTMLElement>();
const loaded=new WeakSet<HTMLElement>();
const params=new URLSearchParams(location.search),qa=params.get('sheet')==='archetypes';
let query=params.get('q')||'',category=params.get('category')||'',type=params.get('type')||'',product=params.get('product')||'',sort=params.get('sort')||'newest';
const running=()=>motion&&!reduced.matches&&!document.hidden;
const icon=(name:string)=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">${name==='search'?'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>':name==='sun'?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>':'<path d="M5 12h14m-5-5 5 5-5 5"/>'}</svg>`;
const date=(s:string)=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(s));
const typeLabel=(s:string)=>s==='solution-idea'?'Solution idea':'Reference architecture';
function renderFrame(card:HTMLElement,time:number,settled=false){
 const svg=card.querySelector<SVGSVGElement>('.preview>svg');if(!svg)return;
 if(!card.dataset.art){updateScene(svg,time,settled);return}
 svg.pauseAnimations?.();svg.setCurrentTime?.(settled?2.5:(time%6000)/1000);
 card.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=settled?2500:time%6000});
}
function tick(time:number){for(const card of active)renderFrame(card,time);if(active.size&&running())frame=requestAnimationFrame(tick);else frame=0}
function sync(){
 document.documentElement.dataset.motion=running()?'on':'off';
 const button=$<HTMLButtonElement>('#motion-toggle');button.setAttribute('aria-checked',String(motion&&!reduced.matches));button.disabled=reduced.matches;button.title=reduced.matches?'Motion is off to respect your system preference':'Animate the ideas currently in view';button.querySelector('.motion-state')!.textContent=motion&&!reduced.matches?'On':'Off';
 active.clear();if(running())for(const card of visible){if(active.size===12)break;active.add(card)}
 document.querySelectorAll<HTMLElement>('.architecture-card').forEach(card=>{card.dataset.playing=String(active.has(card));if(!active.has(card))renderFrame(card,2500,true)});
 if(frame)cancelAnimationFrame(frame);frame=active.size?requestAnimationFrame(tick):0;
}
async function loadArt(card:HTMLElement){
 const scene=scenes[card.dataset.id!];if(!scene?.art||loaded.has(card))return;loaded.add(card);
 try{
  if(!/^art\/[a-zA-Z0-9/_-]+\.svg$/.test(scene.art)||scene.art.includes('..'))throw Error('Art path must stay inside architectures/art/');
  const response=await fetch(`${base}architectures/${scene.art}`);if(!response.ok)throw Error(`Art returned ${response.status}`);
  const svg=sanitizeArt(await response.text(),s=>new DOMParser().parseFromString(s,'image/svg+xml'),e=>new XMLSerializer().serializeToString(e),`art-${card.dataset.id}-`);
  if(!card.isConnected)return;
  card.querySelector('.preview')!.innerHTML=svg;card.dataset.art='true';
  const el=card.querySelector('svg')!;el.setAttribute('role','img');el.setAttribute('aria-label',`Concept illustration for ${articles.find(a=>a.id===card.dataset.id)?.title}`);
  renderFrame(card,2500,true);sync();
 }catch(error){card.dataset.artError='true';console.warn('Using scene fallback:',scene.art,error)}
}
function url(){if(qa)return;const u=new URL(location.href);for(const [key,value] of Object.entries({q:query,category,type,product,sort:sort==='newest'?'':sort}))value?u.searchParams.set(key,value):u.searchParams.delete(key);history.replaceState(null,'',u)}
function card(a:Article){
 const s=scenes[a.id];const categories=a.display_azure_categories.filter(Boolean);
 return `<article class="architecture-card" data-id="${escape(a.id)}" data-archetype="${s.archetype}"><div class="preview">${sceneSVG(s,base)}</div><div class="card-copy"><div class="card-meta"><span>${escape(categories[0]||'Architecture')}</span><span class="type-chip">${typeLabel(a.content_type)}</span></div><h2><a href="${escape(a.url)}" target="_blank" rel="noopener">${escape(a.title)}</a></h2><p class="card-summary" title="${escape(a.summary)}">${escape(a.summary)}</p><div class="card-bottom"><div class="product-actors" aria-label="${escape(a.display_products.join(', '))}">${s.actors.map(actor=>`<img src="${base}svg/${actor.id}.svg" alt="${escape(actor.name)}" title="${escape(actor.name)}" width="21" height="21" loading="lazy">`).join('')}${!s.actors.length?'<span class="product-word">'+escape(a.display_products.filter(x=>x!=='Azure')[0]||'Azure')+'</span>':''}</div><time datetime="${a.last_modified}">${date(a.last_modified)}</time></div><a class="read-link" href="${escape(a.url)}" target="_blank" rel="noopener">Read on Microsoft Learn ${icon('arrow')}<span class="sr-only">: ${escape(a.title)} (opens in a new tab)</span></a></div></article>`;
}
function filter(){
 observer.disconnect();visible.clear();active.clear();if(frame)cancelAnimationFrame(frame);frame=0;
 let found=articles.filter(a=>(!category||a.azure_categories.includes(category))&&(!type||a.content_type===type)&&(!product||a.products.includes(product))&&query.toLowerCase().trim().split(/\s+/).every(term=>[a.title,a.summary,...a.display_products,...a.display_azure_categories].join(' ').toLowerCase().includes(term)));
 found.sort((a,b)=>sort==='az'?a.title.localeCompare(b.title):b.last_modified.localeCompare(a.last_modified)||a.title.localeCompare(b.title));
 if(qa){found=archetypes.map(name=>found.find(a=>scenes[a.id].archetype===name)!).filter(Boolean);document.body.classList.add('contact-mode')}
 $('#architecture-grid').innerHTML=found.map(card).join('');
 $('#result-count').textContent=`${found.length} of ${articles.length} articles`;
 $('#empty').hidden=found.length>0;$('#clear').hidden=!query;
 document.querySelectorAll<HTMLElement>('.architecture-card').forEach(card=>{renderFrame(card,2500,true);observer.observe(card)});
 $('#reset').hidden=!(query||category||type||product);url();sync();
}
function reset(){query='';category='';type='';product='';$<HTMLInputElement>('#search').value='';['category','type','product'].forEach(id=>$<HTMLSelectElement>('#'+id).value='');filter()}
async function start(){try{
 const data=await Promise.all(['articles','scenes'].map(async name=>{const r=await fetch(`${base}architectures/${name}.json`);if(!r.ok)throw Error(`Could not load ${name}`);return r.json()}));[articles,scenes]=data;
 if(!articles.length||articles.some(a=>!scenes[a.id]))throw Error('Incomplete architecture index');
 const categories=new Map<string,string>(),products=new Map<string,string>();
 articles.forEach(a=>{a.azure_categories.forEach((id,i)=>{if(a.display_azure_categories[i])categories.set(id,a.display_azure_categories[i])});a.products.forEach((id,i)=>products.set(id,a.display_products[i]||id))});
 const options=(entries:Map<string,string>,value:string)=>[...entries].sort((a,b)=>a[1].localeCompare(b[1])).map(([id,label])=>`<option value="${escape(id)}"${id===value?' selected':''}>${escape(label)}</option>`).join('');
 app.innerHTML=`<a class="skip" href="#architecture-grid">Skip to architectures</a><header class="topbar"><a class="wordmark" href="${base}">Icon collection<span>Unofficial Azure architecture browser</span></a><nav class="top-actions" aria-label="Main navigation"><a class="nav-link" href="${base}">Icons</a><a class="nav-link current" href="${base}architectures/" aria-current="page">Architectures</a><button class="theme-button" id="theme" aria-label="Switch color theme">${icon('sun')}</button></nav></header><main class="architecture-main"><section class="architecture-intro"><div><h1>Architecture, in motion.</h1><p>Explore the idea. Find your pattern. Build with Azure.</p></div><button id="motion-toggle" class="motion-toggle" role="switch" aria-checked="true" aria-label="Motion"><span class="motion-track" aria-hidden="true"></span>Motion <span class="motion-state">On</span></button></section><section class="architecture-search" aria-label="Find architectures"><div class="search-box">${icon('search')}<label for="search" class="sr-only">Search architecture ideas, services or keywords</label><input id="search" type="search" placeholder="Search ideas, services or keywords…" autocomplete="off" value="${escape(query)}"><button id="clear" aria-label="Clear search" hidden>×</button><kbd>/</kbd></div><div class="architecture-filters"><label>Category<select id="category"><option value="">All categories</option>${options(categories,category)}</select></label><label>Article type<select id="type"><option value="">All types</option><option value="architecture" ${type==='architecture'?'selected':''}>Reference architecture</option><option value="solution-idea" ${type==='solution-idea'?'selected':''}>Solution idea</option></select></label><label>Product<select id="product"><option value="">All products</option>${options(products,product)}</select></label><label>Sort by<select id="sort"><option value="newest">Newest updated</option><option value="az" ${sort==='az'?'selected':''}>Title A–Z</option></select></label></div></section><div class="architecture-results"><p id="result-count" role="status" aria-live="polite"></p><button id="reset" class="text-reset" hidden>Clear search & filters</button><p class="scene-note">Original illustrations. Real architecture guidance.</p></div><section id="architecture-grid" class="architecture-grid" aria-label="Architecture Center articles" tabindex="-1"></section><section id="empty" hidden><h2>No matching architectures</h2><p>Try a different idea or clear your filters.</p><button class="primary" id="empty-reset">Clear search & filters</button></section><p class="architecture-disclosure">The illustrations explain concepts; they are not deployment diagrams. Article titles, summaries and guidance are from <a href="https://learn.microsoft.com/azure/architecture/browse/">Microsoft Learn</a>. Dates show the source article’s last update.</p></main><footer><p>Original vector illustrations · Official service icons © Microsoft, used under <a href="https://learn.microsoft.com/azure/architecture/icons/">Microsoft’s icon terms</a>. Unofficial browser; not a Microsoft product.</p><div><a href="${base}">Back to the icon collection</a><a href="https://github.com/raj-microsoft/azure-icons">GitHub</a></div></footer>`;
 observer=new IntersectionObserver(entries=>{for(const e of entries){const card=e.target as HTMLElement;if(e.isIntersecting){visible.add(card);loadArt(card)}else visible.delete(card)}sync()},{threshold:.05});
 $('#search').addEventListener('input',()=>{query=$<HTMLInputElement>('#search').value;filter()});
 $('#clear').onclick=()=>{query='';$<HTMLInputElement>('#search').value='';filter();$('#search').focus()};
 for(const id of ['category','type','product','sort'])$('#'+id).addEventListener('change',()=>{category=$<HTMLSelectElement>('#category').value;type=$<HTMLSelectElement>('#type').value;product=$<HTMLSelectElement>('#product').value;sort=$<HTMLSelectElement>('#sort').value;filter()});
 $('#reset').onclick=reset;$('#empty-reset').onclick=reset;
 $('#motion-toggle').onclick=()=>{motion=!motion;sync()};
 $('#theme').onclick=()=>{const value=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=value;try{localStorage.setItem('icon-theme',value)}catch{}};
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);window.addEventListener('storage',e=>{if(e.key==='icon-motion'){motion=e.newValue!=='off';sync()}});
 document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName)){e.preventDefault();$('#search').focus()}});
 filter();
 // Deterministic visual verification uses the real scene renderer, never a separate mock.
 Object.assign(window,{aacTest:{frame:(time:number,settled=false)=>{if(frame)cancelAnimationFrame(frame);frame=0;document.querySelectorAll<HTMLElement>('.architecture-card').forEach(c=>renderFrame(c,time,settled))},active:()=>active.size}});
 }catch(error){console.error(error);app.innerHTML=`<main class="load-error"><h1>The architecture index could not load.</h1><p>Check your connection, then reload to try again.</p><button id="reload" class="primary">Reload architectures</button><p><a href="${base}">Return to the icon collection</a></p></main>`;$('#reload').onclick=()=>location.reload()}}
start();
