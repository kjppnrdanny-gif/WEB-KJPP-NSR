import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const pStart = content.indexOf('id="modal-portal"');
console.log(content.substring(pStart - 10, pStart + 2200));
