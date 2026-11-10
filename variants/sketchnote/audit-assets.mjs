import fs from 'node:fs/promises';
import path from 'node:path';
import {validate} from './validate.mjs';
const {icons}=JSON.parse(await fs.readFile('../../public/icons.json','utf8'));
let total=0;for(const i of icons){const svg=await fs.readFile(`svg/${i.id}.svg`,'utf8');if(/<(?:text|linearGradient|radialGradient|filter|image)\b/.test(svg))throw Error(`House style: ${i.id}`);await validate(svg,i.name);total++}console.log(`Validated ${total}: safe XML, 128 viewBox, nonblank 32/128, no text/gradients/filters/images.`);
