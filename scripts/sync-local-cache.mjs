import fs from 'fs';

const DEPLOYMENT_ID = 'AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn';
const GAS_URL = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;

async function syncAll() {
  console.log('1. Mengambil MASTER_KARYAWAN dari GAS...');
  const resMaster = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getMasterKaryawanFull' })
  });
  const dataMaster = await resMaster.json();
  console.log('   Master status:', dataMaster.status, 'Total:', dataMaster.rows?.length);

  console.log('2. Mengambil ABSENSI dari GAS...');
  const resAbsensi = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getAbsensiAll' })
  });
  const dataAbsensi = await resAbsensi.json();
  console.log('   Absensi status:', dataAbsensi.status, 'Total:', dataAbsensi.rows?.length);

  // Parse Master
  const masterHeaders = (dataMaster.headers || []).map(h => String(h || '').toUpperCase().trim());
  const colNik = masterHeaders.indexOf('NIK');
  const colNama = masterHeaders.indexOf('NAMA') !== -1 ? masterHeaders.indexOf('NAMA') : masterHeaders.indexOf('NAMA KARYAWAN');
  const colJabatan = masterHeaders.indexOf('JABATAN');
  const colDivisi = masterHeaders.indexOf('DIVISI');
  const colStatus = masterHeaders.indexOf('STATUS');
  const colAlamatWfh = masterHeaders.indexOf('ALAMAT WFH');
  const colGpsWfh = masterHeaders.indexOf('GPS WFH');
  const colEmail = masterHeaders.findIndex(h => h.includes('EMAIL') || h === 'GMAIL');

  const roster = (dataMaster.rows || []).map(r => ({
    nik: String(r[colNik !== -1 ? colNik : 0] || '').trim(),
    nama: String(r[colNama !== -1 ? colNama : 1] || '').trim(),
    jabatan: String(r[colJabatan !== -1 ? colJabatan : 2] || '').trim(),
    divisi: String(r[colDivisi !== -1 ? colDivisi : 3] || '').trim(),
    cabang: 'Pusat Jakarta',
    status: String(r[colStatus !== -1 ? colStatus : 4] || 'AKTIF').toUpperCase().trim(),
    alamat_wfh: String(r[colAlamatWfh !== -1 ? colAlamatWfh : 5] || '').trim(),
    gps_wfh: String(r[colGpsWfh !== -1 ? colGpsWfh : 6] || '').trim(),
    email: String(r[colEmail !== -1 ? colEmail : 8] || '').trim()
  })).filter(k => k.nik);

  // Parse Absensi
  const absHeaders = (dataAbsensi.headers || []).map(h => String(h || '').toUpperCase().trim());
  const aTime = absHeaders.indexOf('TIMESTAMP');
  const aNik = absHeaders.indexOf('NIK');
  const aNama = absHeaders.indexOf('NAMA KARYAWAN') !== -1 ? absHeaders.indexOf('NAMA KARYAWAN') : absHeaders.indexOf('NAMA');
  const aJab = absHeaders.indexOf('JABATAN');
  const aDiv = absHeaders.indexOf('DIVISI');
  const aJenis = absHeaders.indexOf('JENIS ABSENSI');
  const aLok = absHeaders.indexOf('LOKASI');
  const aGps = absHeaders.indexOf('KOORDINAT GPS');
  const aJarak = absHeaders.indexOf('JARAK');
  const aStatGps = absHeaders.indexOf('STATUS GPS');
  const aJam = absHeaders.indexOf('JAM ABSENSI');
  const aVal = absHeaders.indexOf('VALIDASI LOKASI');
  const aKet = absHeaders.indexOf('KETERANGAN');

  const parsedAbsensi = (dataAbsensi.rows || []).map(r => {
    const ts = String(r[aTime !== -1 ? aTime : 0] || '').trim();
    const jamVal = String(r[aJam !== -1 ? aJam : 10] || '').trim();
    let jam = '';
    const mJam = jamVal.match(/(\d{2}:\d{2}(?::\d{2})?)/) || ts.match(/(\d{2}:\d{2}(?::\d{2})?)/);
    if (mJam) jam = mJam[1];
    if (jam.length === 5) jam += ':00';

    let tgl = '';
    const mTgl = ts.match(/^(\d{4}-\d{2}-\d{2})/);
    if (mTgl) tgl = mTgl[1];

    const jenis = String(r[aJenis !== -1 ? aJenis : 5] || 'Masuk').trim();
    const lokasi = String(r[aLok !== -1 ? aLok : 6] || 'KANTOR').trim();
    const ket = String(r[aKet !== -1 ? aKet : 13] || '').trim();

    let fotoUrl = '';
    const mFoto = ket.match(/(https?:\/\/[^\s]+(?:googleusercontent|drive\.google|cloudinary|img|photo|jpg|jpeg|png|webp)[^\s]*)/i);
    if (mFoto) fotoUrl = mFoto[1];

    return {
      id: 'gs_' + Buffer.from(ts + r[aNik !== -1 ? aNik : 1] + jenis).toString('hex').slice(0, 16),
      nik: String(r[aNik !== -1 ? aNik : 1] || '').trim(),
      nama: String(r[aNama !== -1 ? aNama : 2] || '').trim(),
      jabatan: String(r[aJab !== -1 ? aJab : 3] || '').trim(),
      divisi: String(r[aDiv !== -1 ? aDiv : 4] || '').trim(),
      jenis: jenis,
      tanggal: tgl,
      timestamp: ts,
      jam: jam,
      lokasi: lokasi,
      kantor_terdekat: lokasi === 'WFH' ? 'Rumah WFH' : 'Pusat Jakarta',
      lokasi_label: lokasi === 'WFH' ? 'WFH' : 'Kantor Pusat',
      gps: String(r[aGps !== -1 ? aGps : 7] || '').trim(),
      jarak: String(r[aJarak !== -1 ? aJarak : 8] || '').trim(),
      status_gps: String(r[aStatGps !== -1 ? aStatGps : 9] || 'VALID').trim(),
      status_validasi: String(r[aVal !== -1 ? aVal : 12] || 'VALID').trim(),
      is_terlambat: jenis.toLowerCase().includes('masuk') && jam > '08:30:00',
      keterangan: ket,
      foto_url: fotoUrl,
      source: 'GOOGLE_SHEET_SSOT'
    };
  }).filter(a => a.nik);

  // Write caches
  fs.writeFileSync('data/.master_karyawan_cache.json', JSON.stringify({
    source: 'DATABASE ABSENSI KARYAWAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN',
    sheet_name: 'MASTER_KARYAWAN',
    last_synced: new Date().toISOString(),
    total_karyawan: roster.length,
    roster
  }, null, 2));
  console.log('   ✓ data/.master_karyawan_cache.json updated with', roster.length, 'records');

  fs.writeFileSync('data/.absensi_records_cache.json', JSON.stringify({
    last_synced: new Date().toISOString(),
    total_rows: parsedAbsensi.length,
    records: parsedAbsensi
  }, null, 2));
  console.log('   ✓ data/.absensi_records_cache.json updated with', parsedAbsensi.length, 'records');

  // Also update data/absensi_database.json
  let db = {};
  if (fs.existsSync('data/absensi_database.json')) {
    db = JSON.parse(fs.readFileSync('data/absensi_database.json', 'utf8'));
  }
  db.metadata = db.metadata || {};
  db.metadata.last_sync = new Date().toISOString();
  db.metadata.total_karyawan_pusat = roster.length;
  db.metadata.total_absensi = parsedAbsensi.length;
  db.master_karyawan = roster;
  db.absensi = parsedAbsensi;
  fs.writeFileSync('data/absensi_database.json', JSON.stringify(db, null, 2));
  console.log('   ✓ data/absensi_database.json updated!');
}

syncAll().catch(console.error);
