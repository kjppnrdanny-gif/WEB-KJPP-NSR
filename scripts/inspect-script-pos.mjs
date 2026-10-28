import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const pTabIdx = content.indexOf('function pilihTabUtama');
console.log('pilihTabUtama idx:', pTabIdx);
if (pTabIdx !== -1) {
  console.log(content.substring(pTabIdx - 100, pTabIdx + 200));
}
