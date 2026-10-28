import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const idxTab3 = content.indexOf('id="tab-3"');
console.log(content.slice(idxTab3 + 3000, idxTab3 + 7000));
