import fs from 'fs';

const filePath = 'data/official_register_config.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let updatedCount = 0;
for (const reg of data) {
  if (reg.id === 'reg_pusat_lp_spk_2026') {
    reg.nomorTerakhir = 415;
    reg.kandidatBerikutnya = '0416';
    reg.status = 'AKTIF';
    reg.sumberBukti = 'Rekap Resmi DB_PENUGASAN_JO_NSR 2026';
    reg.alasanPenyesuaian = 'Sinkronisasi Baseline Resmi Rekap Operasional Google Sheets 2026';
    reg.updatedAt = new Date().toISOString();
    updatedCount++;
  } else if (reg.id === 'reg_pusat_jo_2026') {
    reg.nomorTerakhir = 415;
    reg.kandidatBerikutnya = '0416';
    reg.status = 'AKTIF';
    reg.sumberBukti = 'Rekap Resmi DB_PENUGASAN_JO_NSR 2026';
    reg.alasanPenyesuaian = 'Sinkronisasi Baseline Resmi Rekap Operasional Google Sheets 2026';
    reg.updatedAt = new Date().toISOString();
    updatedCount++;
  }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
console.log(`Updated ${updatedCount} registers in ${filePath}`);
