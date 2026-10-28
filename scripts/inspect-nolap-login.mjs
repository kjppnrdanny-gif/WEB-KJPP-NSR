import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idx1 = content.indexOf('function loginKeServer');
console.log('--- loginKeServer ---');
console.log(content.slice(idx1, idx1 + 1000));

const idx2 = content.indexOf('function inisialisasiSesiPengguna');
console.log('\n--- inisialisasiSesiPengguna ---');
console.log(content.slice(idx2, idx2 + 1000));
