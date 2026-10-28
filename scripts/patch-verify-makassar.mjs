import fs from 'fs';

let c = fs.readFileSync('scripts/verify-addendum-makassar-nolap.mjs', 'utf8');

c = c.replaceAll(
  "checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }",
  "nama_pengaju: 'Petugas Pengaju Makassar', email_pengaju: 'pengaju.mks@kjppnanangrahayu.com', wa_pengaju: '081299998888', checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }"
);

fs.writeFileSync('scripts/verify-addendum-makassar-nolap.mjs', c, 'utf8');
console.log('scripts/verify-addendum-makassar-nolap.mjs patched successfully!');
