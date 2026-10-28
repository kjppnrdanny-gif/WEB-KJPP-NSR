import fs from 'fs';

const filePath = 'portal-surat-umum.html';
let txt = fs.readFileSync(filePath, 'utf8');
const isCrlf = txt.includes('\r\n');
let normalized = txt.replace(/\r\n/g, '\n');

// 1. Remove accidental call from inisialisasiTampilan
const badInitCall = `      // Hitung sequence dan render tampilan
      updateSaranNomorOtomatis();
      bukaModalSuksesTerbit(payloadSurat);
      renderTabelSuratUmum();`;

const goodInitCall = `      // Hitung sequence dan render tampilan
      updateSaranNomorOtomatis();
      renderTabelSuratUmum();`;

if (normalized.includes(badInitCall)) {
  normalized = normalized.replace(badInitCall, goodInitCall);
  console.log('✓ Cleaned up bad bukaModalSuksesTerbit call from inisialisasiTampilan');
}

// 2. Add proper call in handleSimpanSuratUmum
const targetSave = `      // Reset form
      document.getElementById('tujuan_penerima').value = '';
      document.getElementById('perihal').value = '';
      delete document.getElementById('no_surat').dataset.manualEdited;
      updateSaranNomorOtomatis();`;

const replSave = `      // Reset form
      document.getElementById('tujuan_penerima').value = '';
      document.getElementById('perihal').value = '';
      delete document.getElementById('no_surat').dataset.manualEdited;
      updateSaranNomorOtomatis();
      bukaModalSuksesTerbit(payloadSurat);`;

if (normalized.includes(targetSave)) {
  normalized = normalized.replace(targetSave, replSave);
  console.log('✓ Added bukaModalSuksesTerbit to handleSimpanSuratUmum');
}

const out = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, out, 'utf8');
console.log('✓ Successfully fixed hook in portal-surat-umum.html');
