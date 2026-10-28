import fs from 'fs';

const jo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

console.log('=== FINDING ANCHORS FOR MODIFICATIONS ===');

// 1. In modal-approval-pusat: where to insert section-operator-king
const apprFormIdx = jo.indexOf('<form id="form-approval-pusat"');
console.log('form-approval-pusat found at:', apprFormIdx);

// 2. In Tab 1 Seksi 04: where to add Tanggal Laporan
const tglPenilaianIdx = jo.indexOf('id="tanggal_penilaian"');
console.log('tanggal_penilaian found at:', tglPenilaianIdx);

// 3. In Tab 1 Seksi 07: where to add opsi_pajak_ppn
const chkPpnIdx = jo.indexOf('id="chk_kena_ppn"');
console.log('chk_kena_ppn found at:', chkPpnIdx);

// 4. In Tab 1 Seksi 05: where to add Interactive Kuesioner ETI
const susunanTimIdx = jo.indexOf('5. SUSUNAN TIM PENILAI & AUTO-VLOOKUP KREDENSIAL');
console.log('SUSUNAN TIM found at:', susunanTimIdx);

// 5. In Dokumen 3F (ETI): where to update questionnaire table
const etiIdx = jo.indexOf('DOKUMEN 3F: EVALUASI TINGKAT INDEPENDENSI (ETI)');
console.log('DOKUMEN 3F found at:', etiIdx);

// 6. In Dokumen 3G (PI): where to update signature and team
const piIdx = jo.indexOf('DOKUMEN 3G: PERNYATAAN INDEPENDENSI (PI)');
console.log('DOKUMEN 3G found at:', piIdx);
