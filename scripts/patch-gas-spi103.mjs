import fs from 'node:fs';

let content = fs.readFileSync('gas-job-tracking.gs', 'utf8');
let isCRLF = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

const oldPublicData = `  const publicData = {
    id: idJo,
    jo_number: idJo,
    kode_lacak: (colMap['kode_lacak'] !== undefined && foundRow[colMap['kode_lacak']]) ? String(foundRow[colMap['kode_lacak']]) : '',
    spk_number: foundRow[colMap['nomor_spk']],
    instansi: foundRow[colMap['nama_klien']],`;

const newPublicData = `  const publicData = {
    id: idJo,
    jo_number: idJo,
    kode_lacak: (colMap['kode_lacak'] !== undefined && foundRow[colMap['kode_lacak']]) ? String(foundRow[colMap['kode_lacak']]) : '',
    spk_number: foundRow[colMap['nomor_spk']],
    pemberi_tugas: (colMap['pemberi_tugas'] !== undefined && foundRow[colMap['pemberi_tugas']]) ? foundRow[colMap['pemberi_tugas']] : foundRow[colMap['nama_klien']],
    pengguna_laporan: (colMap['pengguna_laporan'] !== undefined && foundRow[colMap['pengguna_laporan']]) ? foundRow[colMap['pengguna_laporan']] : foundRow[colMap['nama_klien']],
    instansi: (colMap['pemberi_tugas'] !== undefined && foundRow[colMap['pemberi_tugas']]) ? foundRow[colMap['pemberi_tugas']] : foundRow[colMap['nama_klien']],
    client_pic_name: (colMap['client_pic_name'] !== undefined && foundRow[colMap['client_pic_name']]) ? foundRow[colMap['client_pic_name']] : (foundRow[colMap['pic_pemohon']] || 'PIC Pemberi Tugas'),
    client_pic_phone: foundRow[colMap['telepon_pic']],
    tujuan_penilaian: (colMap['tujuan_penilaian'] !== undefined && foundRow[colMap['tujuan_penilaian']]) ? foundRow[colMap['tujuan_penilaian']] : 'Penjaminan Utang / Agunan Kredit',
    dokumen_kepemilikan: (colMap['dokumen_kepemilikan'] !== undefined && foundRow[colMap['dokumen_kepemilikan']]) ? foundRow[colMap['dokumen_kepemilikan']] : 'SHM / Bukti Hak',`;

if (norm.includes(oldPublicData)) {
  norm = norm.replace(oldPublicData, newPublicData);
  const res = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
  fs.writeFileSync('gas-job-tracking.gs', res, 'utf8');
  console.log('✓ gas-job-tracking.gs updated successfully');
} else {
  console.log('Normalized pattern not matched');
}
