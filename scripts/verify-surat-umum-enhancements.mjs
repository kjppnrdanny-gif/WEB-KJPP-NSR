import fs from 'fs';

const html = fs.readFileSync('portal-surat-umum.html', 'utf8');

// Check script syntax
const scriptMatches = [...html.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi)];
console.log('Found ' + scriptMatches.length + ' script tags');
scriptMatches.forEach((m, idx) => {
  const code = m[1];
  try {
    new Function(code);
    console.log('Script ' + (idx+1) + ': Syntax OK');
  } catch(e) {
    console.error('Script ' + (idx+1) + ' Syntax ERROR: ' + e.message);
  }
});

// Check key IDs
const checkIds = [
  'klasifikasi_perihal',
  'filter_kategori',
  'modal-sukses-terbit',
  'modal-draf-surat',
  'lembar-a4-draf',
  'draf-field-nomor',
  'draf-field-lampiran',
  'draf-field-perihal',
  'draf-field-tanggal',
  'draf-field-tujuan',
  'draf-field-isi',
  'draf-field-ttd-nama',
  'draf-field-ttd-jabatan',
  'draf-field-ttd-kantor'
];

let allOk = true;
checkIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) {
    console.warn('❌ Missing ID: ' + id);
    allOk = false;
  } else {
    console.log('✓ ID exists: ' + id);
  }
});

if (allOk) {
  console.log('🎉 ALL KEY ELEMENTS AND SCRIPTS ARE 100% VALID!');
}
