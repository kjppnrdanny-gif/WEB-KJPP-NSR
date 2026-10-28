import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const pStart = content.indexOf('id="modal-portal"');
const nextModal = content.indexOf('id="modal-cv-nanang"');
console.log(content.substring(pStart, nextModal));
