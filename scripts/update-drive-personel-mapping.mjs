import fs from 'fs';

const path = 'data/masters/master_google_drive_databases.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));

db.authoritative_data_matrix.MASTER_PERSONEL_DAN_KONTAK = {
  authoritative_source: "OPINI_NSR_BACKEND",
  storage_file: "data/masters/master_personel_kontak.json",
  replicated_to: [
    "DB_PENUGASAN_JO_NSR (Master_Personil Tab)",
    "DATABASE ABSENSI KARYAWAN (MASTER_KARYAWAN Tab)"
  ],
  rule: "Seluruh pengaju JO, LP, NoLap dan penerima notifikasi eLSa merujuk ke SSOT master_personel_kontak.json; pendaftaran pegawai baru melalui antrean terverifikasi tanpa bypass hak akses."
};

fs.writeFileSync(path, JSON.stringify(db, null, 2) + '\n', 'utf8');
console.log('Updated master_google_drive_databases.json successfully');
