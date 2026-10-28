import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const enginePos = html.indexOf('opini-nsr-modal-engine.js');
const inlinePos = html.indexOf('function verifikasiTokenPortal');
console.log('enginePos:', enginePos, 'inlinePos:', inlinePos);
