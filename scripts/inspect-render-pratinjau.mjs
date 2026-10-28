import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idx = content.indexOf('function renderPratinjauDokumen');
console.log('--- renderPratinjauDokumen ---');
console.log(content.slice(idx, idx + 2000));

const idxSemua = content.indexOf('function renderSemuaDokumen');
console.log('\n--- renderSemuaDokumen ---');
console.log(content.slice(idxSemua, idxSemua + 2000));
