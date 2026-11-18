/** Finite, deterministic icon motion. Original SVG geometry is never changed. */
export type Move = 'route'|'stack'|'close'|'slot'|'draw'|'connect'|'link'|'assemble';
export function signature(categories: readonly string[]): Move {
  // Specific categories beat umbrella memberships such as New Icons and Other.
  const groups: [Move, string[]][] = [
    ['route', ['Networking']], ['stack', ['Databases', 'Storage']],
    ['close', ['Security', 'Identity', 'Intune']], ['slot', ['Compute', 'Containers']],
    ['draw', ['Monitor', 'Analytics']], ['connect', ['AI + Machine Learning']],
    ['link', ['Integration']],
  ];
  return groups.find(([, names]) => names.some(name => categories.includes(name)))?.[0] ?? 'assemble';
}
const ns = 'http://www.w3.org/2000/svg';
const tags = new Set('svg g path rect circle ellipse line polyline polygon text tspan defs linearGradient radialGradient stop clipPath mask pattern marker symbol use title desc'.split(' '));
const attributes = new Set(('id viewBox width height x y x1 y1 x2 y2 cx cy r rx ry fx fy d points transform preserveAspectRatio gradientUnits gradientTransform spreadMethod offset patternUnits patternContentUnits patternTransform markerWidth markerHeight refX refY orient markerUnits clipPathUnits maskUnits maskContentUnits pathLength dx dy textLength lengthAdjust href aria-labelledby aria-describedby role').split(' '));
const presentation = new Set(('fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity clip-path clip-rule mask isolation color stop-color stop-opacity font-family font-size font-weight text-anchor dominant-baseline paint-order vector-effect visibility display').split(' '));
let instance = 0;

/** No active tags, event handlers, external hrefs/URLs, global styles or shared IDs. */
export function sanitizeSvg(source: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg' || doc.documentElement.namespaceURI !== ns) throw Error('Invalid SVG');
  const root = doc.documentElement as unknown as SVGSVGElement;
  const prefix = `icon-motion-${++instance}-`;
  // Parse CSS without inserting it into the page; apply presentation declarations only.
  // The pack contains one class-based stylesheet. This also prevents selector leakage.
  for (const style of root.querySelectorAll('style')) {
    const sheet = new CSSStyleSheet();
    try {
      sheet.replaceSync(style.textContent ?? '');
      for (const rule of sheet.cssRules) {
        if (!(rule instanceof CSSStyleRule)) continue;
        for (const element of root.querySelectorAll<SVGElement>(rule.selectorText)) {
          for (const name of rule.style) if (presentation.has(name)) {
            element.style.setProperty(name, rule.style.getPropertyValue(name), rule.style.getPropertyPriority(name));
          }
        }
      }
    } catch { throw Error('Unsupported SVG stylesheet'); }
    style.remove();
  }
  for (const element of [...root.querySelectorAll('*')]) {
    if (element.namespaceURI !== ns || !tags.has(element.localName)) element.remove();
  }
  const elements = [root, ...root.querySelectorAll<SVGElement>('*')];
  const ids = new Map<string, string>();
  for (const element of elements) if (element.id) {
    if (ids.has(element.id)) throw Error('Duplicate SVG ID');
    ids.set(element.id, prefix + ids.size);
  }
  function safeValue(value: string): string | null {
    // Escapes/control characters can disguise URLs in CSS. No pack asset needs them.
    if (/[\\\u0000-\u001f]|@import|expression\s*\(/i.test(value)) return null;
    let invalid = false;
    const rewritten = value.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_, _quote, target: string) => {
      if (!target.startsWith('#') || !ids.has(target.slice(1))) { invalid = true; return ''; }
      return `url(#${ids.get(target.slice(1))})`;
    });
    return invalid ? null : rewritten;
  }
  for (const element of elements) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.localName, value = attribute.value;
      if (attribute.name === 'xmlns' || attribute.name === 'xmlns:xlink') continue;
      if (name === 'id') { element.id = ids.get(value)!; continue; }
      if (name === 'href') {
        element.removeAttributeNode(attribute);
        if (value.startsWith('#') && ids.has(value.slice(1))) element.setAttribute('href', `#${ids.get(value.slice(1))}`);
        continue;
      }
      if (name === 'aria-labelledby' || name === 'aria-describedby') {
        element.setAttribute(name, value.split(/\s+/).map(id => ids.get(id)).filter(Boolean).join(' '));
        continue;
      }
      if (name === 'style') {
        const declarations = [...element.style].map(key => [key, element.style.getPropertyValue(key)] as const);
        element.removeAttribute('style');
        for (const [key, val] of declarations) {
          const safe = safeValue(val);
          if (presentation.has(key) && safe !== null) element.style.setProperty(key, safe);
        }
        continue;
      }
      const safe = safeValue(value);
      if (name.toLowerCase().startsWith('on') || (!attributes.has(name) && !presentation.has(name)) || safe === null) element.removeAttributeNode(attribute);
      else element.setAttribute(attribute.name, safe);
    }
  }
  if (!root.hasAttribute('viewBox')) {
    const width = parseFloat(root.getAttribute('width') ?? ''), height = parseFloat(root.getAttribute('height') ?? '');
    if (!(width > 0 && height > 0)) throw Error('Missing SVG dimensions');
    root.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
  if (!artParts(root).length) throw Error('No animatable geometry');
  root.classList.add('motion-svg');
  root.setAttribute('focusable', 'false');
  return document.importNode(root, true);
}

const graphics = new Set('g path rect circle ellipse line polyline polygon text use svg'.split(' '));
/** Keep top-level groups intact; unwrap only a single structural group. */
export function artParts(svg: SVGElement): SVGGraphicsElement[] {
  const parts = [...svg.children].filter(e => graphics.has(e.localName)) as SVGGraphicsElement[];
  if (parts.length === 1 && parts[0].localName === 'g') {
    const inner = artParts(parts[0]);
    if (inner.length) return inner;
  }
  return parts;
}

export type Part = { x: number; y: number; width: number; height: number; index: number; count: number; unit: number; side: number };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
/** Critically damped: monotone, normalized, with no overshoot. */
export const spring = (t: number) => {
  const p = clamp(t);
  return p === 1 ? 1 : (1 - (1 + 8 * p) * Math.exp(-8 * p)) / (1 - 9 * Math.exp(-8));
};
export function frameAt(move: Move, time: number, part: Part, duration = 1200): { transform: string; opacity: number } {
  if (time >= duration) return { transform: 'none', opacity: 1 };
  const delay = part.count > 1 ? part.index / (part.count - 1) * .34 : 0;
  const t = clamp((time / duration - delay) / .66), p = spring(t), remaining = 1 - p;
  const distance = part.unit * .2;
  let x = 0, y = 0, sx = 1, sy = 1;
  switch (move) {
    // A curved incoming route, not a rotating/spinning specimen.
    case 'route': x = -distance * remaining; y = -distance * 1.1 * remaining * p; break;
    case 'stack': y = -distance * (1 + part.index / Math.max(1, part.count)) * remaining; break;
    case 'close': x = part.side * distance * .75 * remaining; sx = 1 - .18 * remaining; break;
    case 'slot': if (part.index % 2) x = part.side * distance * remaining; else y = -distance * remaining; break;
    case 'draw': if (part.width > part.height * 2) sx = .04 + .96 * p; else sy = .04 + .96 * p; break;
    case 'connect':
      if (part.width > part.height * 2) sx = .08 + .92 * p;
      else { x = part.side * distance * remaining; y = (part.index % 2 ? 1 : -1) * distance * .5 * remaining; sx = sy = .8 + .2 * p; }
      break;
    case 'link': x = part.side * distance * 1.1 * remaining; break;
    case 'assemble': x = part.side * distance * .35 * remaining; y = distance * .6 * remaining; break;
  }
  // A finite entrance, never a crossfade between two artworks.
  return { transform: `translate(${x}px, ${y}px) scale(${sx}, ${sy})`, opacity: .18 + .82 * p };
}

export type MotionClip = { play(): void; settle(): void; animations: Animation[]; dispose(): void };
export function animateParts(svg: SVGSVGElement, move: Move): MotionClip {
  const raw = artParts(svg), view = svg.viewBox.baseVal;
  const svgMatrix = svg.getCTM();
  // All geometry reads happen together, before wrappers/styles/animations are written.
  const measured = raw.map((element, index) => {
    const box = element.getBBox();
    const matrix = element.getCTM();
    const rootMatrix = matrix && svgMatrix ? svgMatrix.inverse().multiply(matrix) : null;
    const center = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2);
    const position = rootMatrix ? center.matrixTransform(rootMatrix) : center;
    return { element, box, position, index };
  });
  const reading = [...measured].sort((a, b) => {
    const rowA = Math.round((a.position.y - view.y) / (view.height * .14));
    const rowB = Math.round((b.position.y - view.y) / (view.height * .14));
    return rowA - rowB || a.position.x - b.position.x || a.index - b.index;
  });
  const layers = measured.map(item => {
    const wrapper = document.createElementNS(ns, 'g');
    wrapper.dataset.motionPart = '';
    item.element.before(wrapper);
    wrapper.append(item.element);
    const { box, position } = item;
    const part: Part = { x: box.x, y: box.y, width: box.width, height: box.height,
      index: reading.indexOf(item), count: raw.length, unit: Math.max(box.width, box.height, view.width * .35),
      side: position.x < view.x + view.width / 2 ? -1 : 1 };
    // CSS transform-origin is in the wrapper's untransformed user coordinate system.
    const origin = move === 'draw' || (move === 'connect' && box.width > box.height * 2)
      ? `${box.x}px ${box.y + box.height}px` : `${box.x + box.width / 2}px ${box.y + box.height / 2}px`;
    return { wrapper, part, origin };
  });
  const animations: Animation[] = [];
  const settle = () => {
    animations.splice(0).forEach(animation => animation.cancel());
    layers.forEach(({ wrapper }) => wrapper.removeAttribute('style'));
  };
  return {
    animations,
    settle,
    play() {
      settle();
      const clock = document.timeline.currentTime;
      for (const { wrapper, part, origin } of layers) {
        wrapper.style.transformOrigin = origin;
        const frames = Array.from({ length: 81 }, (_, index) => ({ ...frameAt(move, index * 15, part), offset: index / 80 }));
        const animation = wrapper.animate(frames, { duration: 1200, fill: 'both' });
        animation.startTime = clock;
        animation.onfinish = () => { animation.cancel(); wrapper.removeAttribute('style'); };
        animations.push(animation);
      }
    },
    dispose() { settle(); layers.forEach(({ wrapper }) => wrapper.replaceWith(...wrapper.childNodes)); },
  };
}

/** Short compositor-only shorthand; SVGs are never inlined in the grid. */
export function animateThumbnail(target: HTMLElement, move: Move): Animation {
  target.getAnimations().forEach(animation => animation.cancel());
  const part: Part = { x: 0, y: 0, width: 56, height: 56, index: 0, count: 1, unit: 40, side: -1 };
  const animation = target.animate(Array.from({ length: 41 }, (_, index) => ({ ...frameAt(move, index * 10, part, 400), offset: index / 40 })), { duration: 400 });
  animation.onfinish = () => animation.cancel();
  return animation;
}
