import fs from 'fs';

const jo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const aIdx = jo.indexOf('function getKlausul11Asumsi');
if (aIdx !== -1) {
  console.log(jo.substring(aIdx, aIdx + 2000));
}
