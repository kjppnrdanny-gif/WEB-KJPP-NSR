import fs from 'fs';

const c = JSON.parse(fs.readFileSync('data/.master_karyawan_cache.json', 'utf8'));
const r005 = c.roster.find(r => r.nik === 'NSR-2019-005');
console.log('NSR-2019-005 in cache:', r005);

const db = JSON.parse(fs.readFileSync('data/absensi_database.json', 'utf8'));
const k005 = (db.master_karyawan || []).find(r => r.nik === 'NSR-2019-005');
console.log('NSR-2019-005 in absensi_database:', k005);
if (db.master_wfh) {
  const w005 = db.master_wfh.find(w => w.nik === 'NSR-2019-005');
  console.log('NSR-2019-005 in master_wfh:', w005);
}
