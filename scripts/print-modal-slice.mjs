import fs from 'fs';

const c = fs.readFileSync('index.html', 'utf8');
const start = c.indexOf('id="modal-portal"');
const tagStart = c.lastIndexOf('<div', start);
const formIdx = c.indexOf('id="form-token-portal"', tagStart);
const panelIdx = c.indexOf('id="panel-layanan"', formIdx);

console.log('--- OUTER HEADER ---');
console.log(c.slice(tagStart, formIdx));
console.log('--- FORM TOKEN ---');
console.log(c.slice(formIdx, panelIdx));
