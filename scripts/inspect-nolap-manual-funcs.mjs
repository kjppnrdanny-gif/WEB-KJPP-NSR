import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idxOpen = content.indexOf('function bukaModalTerbitkanManual');
console.log('--- bukaModalTerbitkanManual ---');
console.log(content.slice(idxOpen, idxOpen + 2500));

const idxSave = content.indexOf('function simpanPenerbitanManual');
console.log('\n--- simpanPenerbitanManual ---');
console.log(content.slice(idxSave, idxSave + 2500));
