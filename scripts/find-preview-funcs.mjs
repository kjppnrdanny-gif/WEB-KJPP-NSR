import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const regex = /function\s+([a-zA-Z0-9_]*(?:Pratinjau|Preview|Tab3|Cetak)[a-zA-Z0-9_]*)/gi;
let m;
const funcs = [];
while ((m = regex.exec(content)) !== null) {
  funcs.push(m[1]);
}
console.log('Functions related to Preview / Tab 3 / Cetak:');
console.log([...new Set(funcs)]);
