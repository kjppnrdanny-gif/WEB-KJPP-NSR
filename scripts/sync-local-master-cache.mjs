import fs from 'fs';
import path from 'path';

const DEPLOYMENT_ID = 'AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn';
const webAppUrl = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;

async function main() {
  console.log('Fetching master roster from Google Apps Script...');
  const res = await fetch(webAppUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getMasterKaryawanFull' })
  });
  const data = await res.json();
  if (data.status !== 'success' && !data.success) {
    throw new Error('Failed to fetch master karyawan: ' + JSON.stringify(data));
  }

  console.log('Total rows fetched:', data.rows.length);

  const headers = (data.headers || []).map(h => String(h || '').toUpperCase().trim());
  const colNik = headers.indexOf('NIK') !== -1 ? headers.indexOf('NIK') : 0;
  const colNama = headers.indexOf('NAMA') !== -1 ? headers.indexOf('NAMA') : (headers.indexOf('NAMA KARYAWAN') !== -1 ? headers.indexOf('NAMA KARYAWAN') : 1);
  const colJabatan = headers.indexOf('JABATAN') !== -1 ? headers.indexOf('JABATAN') : 2;
  const colDivisi = headers.indexOf('DIVISI') !== -1 ? headers.indexOf('DIVISI') : 3;
  const colStatus = headers.indexOf('STATUS') !== -1 ? headers.indexOf('STATUS') : 4;
  const colAlamatWfh = headers.indexOf('ALAMAT WFH') !== -1 ? headers.indexOf('ALAMAT WFH') : 5;
  const colGpsWfh = headers.indexOf('GPS WFH') !== -1 ? headers.indexOf('GPS WFH') : 6;
  const colTglWfh = headers.findIndex(h => h.includes('REGISTRASI WFH'));
  const colEmail = headers.findIndex(h => h.includes('EMAIL') || h === 'GMAIL');
  const colKantor = headers.findIndex(h => h === 'KANTOR' || h === 'CABANG');
  const colPin = headers.findIndex(h => h.includes('PIN'));

  const roster = data.rows.map(r => {
    const isArr = Array.isArray(r);
    const nik = (isArr ? r[colNik] : (r.nik || r.NIK || '') || '').trim().toUpperCase();
    if (!nik) return null;

    let kantor = (isArr && colKantor !== -1 ? r[colKantor] : (r.kantor || r.cabang || '')) || '';
    kantor = kantor.trim();
    if (!kantor) {
      if (nik.includes('MKS')) kantor = 'Cabang Makassar';
      else if (nik.includes('BDG')) kantor = 'Cabang Bandung';
      else if (nik.includes('PDG')) kantor = 'Cabang Padang';
      else if (nik.includes('PLB')) kantor = 'Cabang Palembang';
      else kantor = 'Pusat Jakarta';
    }

    let pin = (isArr && colPin !== -1 ? r[colPin] : (r.pin_presensi || r.pin || '')) || '';
    pin = String(pin).trim();
    if (!pin) {
      pin = (nik === 'NSR-2019-005' ? '889900' : '123456');
    }

    return {
      nik,
      nama: String((isArr ? r[colNama] : (r.nama || r.NAMA || '')) || '').trim(),
      jabatan: String((isArr ? r[colJabatan] : (r.jabatan || r.JABATAN || '')) || '').trim(),
      divisi: String((isArr ? r[colDivisi] : (r.divisi || r.DIVISI || '')) || '').trim(),
      status: String((isArr ? r[colStatus] : (r.status || r.STATUS || 'Aktif')) || 'Aktif').trim(),
      alamat_wfh: String((isArr && colAlamatWfh !== -1 ? r[colAlamatWfh] : (r.alamat_wfh || '')) || '').trim(),
      gps_wfh: String((isArr && colGpsWfh !== -1 ? r[colGpsWfh] : (r.gps_wfh || '')) || '').trim(),
      tgl_reg_wfh: String((isArr && colTglWfh !== -1 ? r[colTglWfh] : (r.tgl_reg_wfh || '')) || '').trim(),
      email: String((isArr && colEmail !== -1 ? r[colEmail] : (r.email || r.EMAIL || '')) || '').trim(),
      kantor,
      cabang: kantor,
      pin_presensi: pin
    };
  }).filter(Boolean);

  const cachePayload = {
    source: 'GOOGLE_SHEETS_MASTER_KARYAWAN',
    sheet_name: 'MASTER_KARYAWAN',
    last_synced: new Date().toISOString(),
    total_karyawan: roster.length,
    roster
  };

  fs.writeFileSync('data/.master_karyawan_cache.json', JSON.stringify(cachePayload, null, 2), 'utf8');
  console.log('✓ data/.master_karyawan_cache.json updated with', roster.length, 'employees');

  // Also clean and update data/absensi_database.json
  if (fs.existsSync('data/absensi_database.json')) {
    try {
      const db = JSON.parse(fs.readFileSync('data/absensi_database.json', 'utf8'));
      db.master_karyawan = roster;
      db.karyawan = roster;
      db.metadata = db.metadata || {};
      db.metadata.total_karyawan = roster.length;
      db.metadata.last_master_sync = new Date().toISOString();
      fs.writeFileSync('data/absensi_database.json', JSON.stringify(db, null, 2), 'utf8');
      console.log('✓ data/absensi_database.json master_karyawan cleaned and updated with', roster.length, 'employees');
    } catch (e) {
      console.warn('Could not update absensi_database.json:', e.message);
    }
  }

  // Delete data/.otp_storage/ if exists
  const otpStoragePath = path.resolve('data/.otp_storage');
  if (fs.existsSync(otpStoragePath)) {
    fs.rmSync(otpStoragePath, { recursive: true, force: true });
    console.log('✓ Deleted data/.otp_storage/ successfully');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
