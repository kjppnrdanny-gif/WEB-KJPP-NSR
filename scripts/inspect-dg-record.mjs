import fs from 'fs';

const dg = JSON.parse(fs.readFileSync('data/dual_gate_database.json', 'utf8'));
const recs = dg.records || [];
console.log('Dual gate records count:', recs.length);
if (recs.length > 0) {
  const r = recs[recs.length - 1];
  console.log('Sample record keys:', Object.keys(r));
  console.log('Sample record summary:', {
    idPenugasan: r.idPenugasan,
    nomorJo: r.nomorJo,
    nomorLp: r.nomorLp,
    nomorLaporan: r.nomorLaporan,
    cabang: r.cabang,
    statusGerbang1: r.statusGerbang1,
    statusGerbang2: r.statusGerbang2,
    penilaiPublikId: r.penilaiPublikId,
    appraiserLicenseCode: r.appraiserLicenseCode
  });
}
