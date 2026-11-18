import * as css from 'css-tree';
/** Shared, fail-closed SVG policy. The CLI supplies an XML parser; browsers use DOMParser. */
export function sanitizeArt(source:string, parse:(s:string)=>Document, serialize:(e:Element)=>string, prefix='art-'):string {
  const bytes=(s:string)=>new TextEncoder().encode(s).length;
  if(bytes(source)>40960)throw Error('SVG exceeds the 40 KB input limit');
  if(/<!DOCTYPE|<!ENTITY|<\?/i.test(source.replace(/^\s*<\?xml[^?]*\?>/,'')))throw Error('DTD, entities and processing instructions are not allowed');
  const doc=parse(source.replace(/^\s*<\?xml[^?]*\?>/,''));
  const root=doc.documentElement;
  if(!root||root.localName!=='svg'||doc.getElementsByTagName('parsererror').length)throw Error('Input must be a well-formed SVG document');
  const tags=new Set('svg g defs path rect circle ellipse line polyline polygon text tspan title desc clipPath mask linearGradient radialGradient stop pattern use image style animate animateTransform animateMotion mpath'.toLowerCase().split(' '));
  const attributes=new Set('id class xmlns xmlns:xlink viewBox width height x y x1 x2 y1 y2 cx cy r rx ry d points fill fill-opacity fill-rule stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-dashoffset stroke-opacity opacity transform transform-origin transform-box clip-path clip-rule mask offset stop-color stop-opacity gradientUnits gradientTransform spreadMethod fx fy fr patternUnits patternContentUnits patternTransform preserveAspectRatio href xlink:href font-family font-size font-weight text-anchor dominant-baseline attributeName type values from to by dur begin repeatCount repeatDur keyTimes keySplines calcMode additive accumulate path keyPoints rotate style'.toLowerCase().split(' '));
  const all=(e:Element):Element[]=>[e,...Array.from(e.getElementsByTagName('*'))];
  for(const el of all(root).slice(1))if(!tags.has(el.localName.toLowerCase())||el.namespaceURI&&el.namespaceURI!=='http://www.w3.org/2000/svg')el.parentNode?.removeChild(el);
  const ids=new Map<string,string>();
  for(const el of all(root)){const id=el.getAttribute('id');if(id){if(ids.has(id))throw Error(`Duplicate SVG id: ${id}`);ids.set(id,`${prefix}${id.replace(/[^a-zA-Z0-9_-]/g,'-')}`)}}
  const rootId=`${prefix}root`;if([...ids.values()].includes(rootId))throw Error('SVG id collides with the reserved root id');if(root.getAttribute('id'))ids.set(root.getAttribute('id')!,rootId);
  const reference=(value:string)=>value.replace(/url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)/g,(_,id)=>`url(#${ids.get(id)||prefix+id})`);
  const safePaint=(v:string)=>!/(?:url\s*\(\s*(?!#|['"]#)|javascript|data:|https?:|@import|expression|\\)/i.test(v);
  const props=new Set('fill fill-opacity stroke stroke-width stroke-opacity stroke-dasharray stroke-dashoffset opacity transform transform-origin transform-box animation animation-name animation-duration animation-delay animation-iteration-count animation-timing-function animation-direction animation-fill-mode animation-play-state'.split(' '));
  const keyframeNames=[...all(root).filter(e=>e.localName==='style').flatMap(e=>[...(e.textContent||'').matchAll(/@(?:-webkit-)?keyframes\s+([\w-]+)/g)].map(m=>m[1]))];
  function cleanCSS(text:string,inline=false){
    let ast:css.CssNode;try{ast=css.parse(text,{context:inline?'declarationList':'stylesheet',parseCustomProperty:false})}catch{throw Error('Malformed SVG CSS')}
    css.walk(ast,{enter(this:css.WalkContext,node:css.CssNode){
      if(node.type==='Atrule'&&!/^(?:-webkit-)?keyframes$/i.test(node.name))throw Error(`CSS @${node.name} is not allowed`);
      if(node.type==='Raw')throw Error('Unparsed SVG CSS is not allowed');
      if(node.type==='Declaration'){
        if(this.atrule&&/keyframes$/i.test(this.atrule.name)&&!['transform','opacity','stroke-dashoffset'].includes(node.property))throw Error('Keyframes may animate only transform, opacity or stroke-dashoffset');
        const val=css.generate(node.value);if(!props.has(node.property.toLowerCase())||!safePaint(val)||node.important)throw Error(`Unsafe CSS property or value: ${node.property}`);
      }
      if(node.type==='Url'&&!node.value.startsWith('#'))throw Error('External CSS URLs are not allowed');
      if(node.type==='IdSelector')node.name=ids.get(node.name)||prefix+node.name;
    }});
    let output=reference(css.generate(ast));
    // Prefix keyframe names and scope all ordinary rules to this one inline illustration.
    const names=keyframeNames;
    for(const name of names)output=output.replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'g'),prefix+name);
    if(!inline){const scoped=css.parse(output);css.walk(scoped,{visit:'Rule',enter(node){if(node.prelude?.type==='SelectorList'){
      const list=node.prelude as css.SelectorList;
      list.children.forEach(item=>{const selector=item as css.Selector;
        const s=css.generate(selector);if(!/^(?:from|to|[\d.]+%)$/.test(s)){
          if(s===`#${rootId}`||s.startsWith(`#${rootId} `))return;
          if(s==='svg'||s===':root')selector.children=(css.parse(`#${rootId}`,{context:'selector'}) as css.Selector).children;
          else selector.children=(css.parse(`#${rootId} ${s}`,{context:'selector'}) as css.Selector).children;
        }
      });
    }}});output=css.generate(scoped)}return output;
  }
  for(const el of all(root)){
    for(const attr of Array.from(el.attributes)){
      const name=attr.name.toLowerCase(),v=attr.value;
      if(name.startsWith('on')||!attributes.has(name)){el.removeAttribute(attr.name);continue}
      if(name==='id'){el.setAttribute('id',ids.get(v)!);continue}
      if(name==='href'||name==='xlink:href'){
        if(!/^#[a-zA-Z_][\w:.-]*$/.test(v))el.removeAttribute(attr.name);else el.setAttribute(attr.name,'#'+(ids.get(v.slice(1))||prefix+v.slice(1)));continue;
      }
      if(name==='style'){el.setAttribute('style',cleanCSS(v,true));continue}
      if(!safePaint(v)){el.removeAttribute(attr.name);continue}
      if(/url\(/i.test(v))el.setAttribute(attr.name,reference(v));
      if(name==='begin'&&!/^\d*(?:\.\d+)?s?$/.test(v))el.setAttribute('begin','0s');
    }
    const tag=el.localName.toLowerCase();
    if(tag==='style')el.textContent=cleanCSS(el.textContent||'');
    if(tag.startsWith('animate')){
      const attribute=el.getAttribute('attributeName');
      if(tag==='animate'&&!['opacity','stroke-dashoffset','transform'].includes(attribute||''))throw Error(`Animation may not change ${attribute||'an unnamed attribute'}`);
      if(tag==='animatetransform')el.setAttribute('attributeName','transform');
      const dur=el.getAttribute('dur');if(dur&&!/^\d+(?:\.\d+)?(?:ms|s)$/.test(dur))throw Error('Animation duration must be a finite number of seconds');
    }
  }
  root.setAttribute('xmlns','http://www.w3.org/2000/svg');root.setAttribute('id',rootId);root.setAttribute('viewBox','0 0 320 200');root.setAttribute('width','320');root.setAttribute('height','200');
  const output=serialize(root);if(bytes(output)>40960)throw Error('Sanitized SVG exceeds the 40 KB limit');return output;
}
