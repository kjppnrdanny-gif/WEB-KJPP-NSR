import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const pIdx = content.indexOf('id="modal-portal"');
const pStart = content.lastIndexOf('<div', pIdx);
// Find matching closing div or slice 3000 chars
console.log(content.substring(pStart, pStart + 3500));
