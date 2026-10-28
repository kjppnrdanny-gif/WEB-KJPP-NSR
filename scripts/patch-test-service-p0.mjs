import fs from 'fs';

let c = fs.readFileSync('tests/test-service-classification-p0.mjs', 'utf8');

// Test 6
c = c.replace(
  'checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }',
  "nama_pengaju: 'Petugas Pengaju Resmi', email_pengaju: 'petugas.resmi@kjppnanangrahayu.com', wa_pengaju: '081299998888', checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }"
);

// Test 9
const t9 = `penilaiPublikId: 'nanang_penilai',
        appraiser_license_code: '0218',
        checklistAwal: {}`;
const r9 = `penilaiPublikId: 'nanang_penilai',
        appraiser_license_code: '0218',
        nama_pengaju: 'Petugas Pengaju Resmi',
        email_pengaju: 'petugas.resmi@kjppnanangrahayu.com',
        wa_pengaju: '081299998888',
        checklistAwal: {}`;
c = c.replace(t9.replace(/\n/g, '\r\n'), r9.replace(/\n/g, '\r\n'));

// Test 10
const t10 = `penilaiPublikId: 'deni_penilai',
        appraiser_license_code: '00581',
        checklistAwal: {}`;
const r10 = `penilaiPublikId: 'deni_penilai',
        appraiser_license_code: '00581',
        nama_pengaju: 'Petugas Pengaju Resmi',
        email_pengaju: 'petugas.resmi@kjppnanangrahayu.com',
        wa_pengaju: '081299998888',
        checklistAwal: {}`;
c = c.replace(t10.replace(/\n/g, '\r\n'), r10.replace(/\n/g, '\r\n'));

// Test 11
const t11 = "body: { idPenugasan: testIdManualSanitize, checklistAwal: {} }";
const r11 = "body: { idPenugasan: testIdManualSanitize, nama_pengaju: 'Petugas Pengaju Resmi', email_pengaju: 'petugas.resmi@kjppnanangrahayu.com', wa_pengaju: '081299998888', checklistAwal: {} }";
c = c.replace(t11, r11);

fs.writeFileSync('tests/test-service-classification-p0.mjs', c, 'utf8');
console.log('test-service-classification-p0.mjs patched successfully!');
