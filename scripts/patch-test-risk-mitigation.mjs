import fs from 'fs';

let c = fs.readFileSync('tests/test-integrated-risk-mitigation.mjs', 'utf8');

// Line 134
c = c.replace(
  "origin_branch_id: 'Makassar',",
  "origin_branch_id: 'Makassar',\n        nama_pengaju: 'Petugas Pengaju Resmi',\n        email_pengaju: 'petugas.resmi@kjppnanangrahayu.com',\n        wa_pengaju: '081299998888',"
);

// Line 239
c = c.replace(
  "body: { idPenugasan: testIdDeviasiBesar, checklistAwal: {} }",
  "body: { idPenugasan: testIdDeviasiBesar, nama_pengaju: 'Petugas Pengaju Resmi', email_pengaju: 'petugas.resmi@kjppnanangrahayu.com', wa_pengaju: '081299998888', checklistAwal: {} }"
);

fs.writeFileSync('tests/test-integrated-risk-mitigation.mjs', c.replace(/\n/g, '\r\n'), 'utf8');
console.log('test-integrated-risk-mitigation.mjs patched successfully!');
