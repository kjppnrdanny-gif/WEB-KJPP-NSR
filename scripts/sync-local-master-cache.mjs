import fs from 'fs';
import path from 'path';

const DEPLOYMENT_ID = 'AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn';
const webAppUrl = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;

async function main() {
  console.log('Fetching master roster from Google Apps Script...');
  const res = await fetch(webAppUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'get_master_karyawan' })
  });
  const data = await res.json();
  if (data.status !== 'success') {
    throw new Error('Failed to fetch master karyawan: ' + JSON.stringify(data));
  }

  console.log('Total rows fetched:', data.rows.length);

  // Normalize each row to include pin_presensi and kantor
  const roster = data.rows.map(r => {
    const nik = (r.nik || r.NIK || '').trim().toUpperCase();
    let kantor = (r.kantor || r.cabang || r.Kantor || '').trim();
    if (!kantor) {
      if (nik.includes('MKS')) kantor = 'Cabang Makassar';
      else if (nik.includes('BDG')) kantor = 'Cabang Bandung';
      else if (nik.includes('PDG')) kantor = 'Cabang Padang';
      else if (nik.includes('PLB')) kantor = 'Cabang Palembang';
      else kantor = 'Pusat Jakarta';
    }
    const pin = (r.pin_presensi || r.pin || (nik === 'NSR-2019-005' ? '889900' : '123456'));
    return {
      nik,
      nama: r.nama || r.NAMA || '',
      jabatan: r.jabatan || r.JABATAN || '',
      divisi: r.divisi || r.DIVISI || '',
      status: r.status || r.STATUS || 'Aktif',
      email: r.email || r.EMAIL || '',
      kantor,
      pin_presensi: pin
    };
  });

  const cachePayload = {
    source: 'GOOGLE_SHEETS_MASTER_KARYAWAN',
    sheet_name: 'MASTER_KARYAWAN',
    last_synced: new Date().toISOString(),
    total_karyawan: roster.length,
    roster
  };

  fs.writeFileSync('data/.master_karyawan_cache.json', JSON.stringify(cachePayload, null, 2), 'utf8');
  console.log('✓ data/.master_karyawan_cache.json updated with', roster.length, 'employees');

  // Also update data/absensi_database.json if exists
  if (fs.existsSync('data/absensi_database.json')) {
    try {
      const db = JSON.parse(fs.readFileSync('data/absensi_database.json', 'utf8'));
      db.karyawan = roster;
      fs.writeFileSync('data/absensi_database.json', JSON.stringify(db, null, 2), 'utf8');
      console.log('✓ data/absensi_database.json updated with roster');
    } catch (e) {
      console.warn('Could not update absensi_database.json:', e.message);
    }
  }

  // Delete data/.otp_storage/
  const otpStoragePath = path.resolve('data/.otp_storage');
  if (fs.existsSync(otpStoragePath)) {
    fs.rmSync(otpStoragePath, { recursive: true, force: true });
    console.log('✓ Deleted data/.otp_storage/ successfully');
  } else {
    console.log('data/.otp_storage/ already deleted');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
