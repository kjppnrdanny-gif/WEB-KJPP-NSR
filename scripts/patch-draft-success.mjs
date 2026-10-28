import fs from 'fs';

let content = fs.readFileSync('portal-nolap.html', 'utf8');

function toCrlf(str) {
  return str.replace(/\r?\n/g, '\r\n');
}

const needle = toCrlf(`        // Buka Modal Sukses
        bukaModalSuksesPengajuan(finalRecord);

        // Reset form hanya setelah berhasil disimpan
        document.getElementById('form-pengajuan-nolap').reset();
        perbaruiIdempotencyKey();
        hitungFinansialNoLap();
        updateLivePreview();
        muatUlangTabel();`);

const replacement = toCrlf(`        if (isDraft) {
          alert('💾 Draf Terpadu Berhasil Disimpan!\\n\\nNomor Permintaan: ' + finalRecord.noPermintaan + '\\nStatus: DRAFT\\n\\nSeluruh data isian Langkah 1 dan Langkah 2 telah tersimpan. Anda dapat melengkapi tautan dokumen dan checklist mitigasi kapan saja sebelum diajukan ke Kepala SPM.');
          muatUlangTabel();
        } else {
          // Buka Modal Sukses & Dual Output
          bukaModalSuksesPengajuan(finalRecord);

          // Reset form hanya setelah berhasil diajukan resmi
          document.getElementById('form-pengajuan-nolap').reset();
          navigasiKeStepWizard(1);
          perbaruiIdempotencyKey();
          hitungFinansialNoLap();
          updateLivePreview();
          muatUlangTabel();
        }`);

if (content.includes(needle)) {
  content = content.replace(needle, replacement);
  fs.writeFileSync('portal-nolap.html', content, 'utf8');
  console.log('✔ Draft vs Submit success behavior successfully updated.');
} else {
  console.error('✘ needle not found!');
}
