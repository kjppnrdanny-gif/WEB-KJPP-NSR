import fs from 'fs';

let c = fs.readFileSync('tests/test-final-master-suite.mjs', 'utf8');

c = c.replaceAll(
  "checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }",
  "nama_pengaju: 'Petugas Pengaju Resmi', email_pengaju: 'petugas.resmi@kjppnanangrahayu.com', wa_pengaju: '081299998888', checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }"
);

c = c.replaceAll(
  "checklistAwal: { konflikKepentingan: false, redFlagLegalitas: true }",
  "nama_pengaju: 'Petugas Pengaju Resmi', email_pengaju: 'petugas.resmi@kjppnanangrahayu.com', wa_pengaju: '081299998888', checklistAwal: { konflikKepentingan: false, redFlagLegalitas: true }"
);

fs.writeFileSync('tests/test-final-master-suite.mjs', c, 'utf8');
console.log('test-final-master-suite.mjs patched successfully!');
