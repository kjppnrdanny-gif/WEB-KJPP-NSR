import fs from 'fs';

let c = fs.readFileSync('tests/test-dual-gate-production-integration.mjs', 'utf8');

c = c.replace(
  "checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }",
  "nama_pengaju: 'Petugas Pengaju Resmi', email_pengaju: 'petugas.resmi@kjppnanangrahayu.com', wa_pengaju: '081299998888', checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }"
);

c = c.replace(
  "checklistAwal: { konflikKepentingan: false, redFlagLegalitas: true }",
  "nama_pengaju: 'Petugas Pengaju Resmi', email_pengaju: 'petugas.resmi@kjppnanangrahayu.com', wa_pengaju: '081299998888', checklistAwal: { konflikKepentingan: false, redFlagLegalitas: true }"
);

fs.writeFileSync('tests/test-dual-gate-production-integration.mjs', c, 'utf8');
console.log('test-dual-gate-production-integration.mjs patched successfully!');
