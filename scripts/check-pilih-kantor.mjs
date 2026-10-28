import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const pStart = content.indexOf('function pilihKantorPeta(');
console.log(content.substring(pStart, pStart + 1800));
