import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const pTabIdx = content.indexOf('function pilihTabUtama');
console.log(content.substring(pTabIdx, pTabIdx + 1500));
