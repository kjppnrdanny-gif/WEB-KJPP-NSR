import fs from 'fs';

const jo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const kIdx = jo.indexOf('function kalkulasiBiaya');
if (kIdx !== -1) {
  console.log(jo.substring(kIdx, kIdx + 1200));
}
