import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');

const galeriStart = orig.lastIndexOf('<section', orig.indexOf('id="galeri"'));
const manajemenStart = orig.lastIndexOf('<section', orig.indexOf('id="manajemen"'));
const fullGaleri = orig.substring(galeriStart, manajemenStart);

const flexEndIdx = fullGaleri.indexOf('<!-- Interactive WebGL 3D FlexCarousel Component -->');
console.log('fullGaleri around flexEndIdx (600 chars):');
console.log(fullGaleri.substring(flexEndIdx, flexEndIdx + 600));
