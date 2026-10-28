import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idxInd = content.indexOf('function perbaruiIndikatorTab3');
console.log(content.slice(idxInd + 1000, idxInd + 3000));
