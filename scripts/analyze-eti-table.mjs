import fs from 'fs';

const jo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const fIdx = jo.indexOf('DOKUMEN 3F');
const gIdx = jo.indexOf('DOKUMEN 3G');
console.log(jo.substring(fIdx, gIdx));
