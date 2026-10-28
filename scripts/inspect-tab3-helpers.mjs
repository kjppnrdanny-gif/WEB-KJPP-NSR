import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idxInd = content.indexOf('function perbaruiIndikatorTab3');
console.log('--- perbaruiIndikatorTab3 ---');
console.log(content.slice(idxInd, idxInd + 1500));

const idxBukaTab3 = content.indexOf('function bukaPratinjauTab3');
if (idxBukaTab3 > -1) {
  console.log('--- bukaPratinjauTab3 ---');
  console.log(content.slice(idxBukaTab3, idxBukaTab3 + 1000));
}
