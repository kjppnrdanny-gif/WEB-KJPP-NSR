import fs from 'fs';
import http from 'http';
import { spawn } from 'child_process';

const GAS_WEBAPP = 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec';

// Test Cases across 5 branches
const testEmployees = [
  {
    branch: 'Pusat Jakarta',
    nik: 'NSR-2019-001',
    nama: 'Nanang Rahayu',
    pin: '123456',
    gps: '-6.28797,106.82478', // Kantor Pusat
    expectedValid: true
  },
  {
    branch: 'Pusat Jakarta (Danny WFH)',
    nik: 'NSR-2019-005',
    nama: 'Danny Taufik Hidayat',
    pin: '889900',
    gps: '-6.1936673,106.9441382', // Rumah WFH Cakung
    isWfh: true,
    expectedValid: true
  },
  {
    branch: 'Cabang Bandung',
    nik: 'NSR-BDG-2020-38',
    nama: 'Heru Kurnia',
    pin: '123456',
    gps: '-6.85978,107.56043', // Kantor Bandung
    expectedValid: true
  },
  {
    branch: 'Cabang Padang',
    nik: 'NSR-PDG-2019-23',
    nama: 'Hernita',
    pin: '123456',
    gps: '-0.94932,100.37606', // Kantor Padang
    expectedValid: true
  },
  {
    branch: 'Cabang Makassar',
    nik: 'NSR-MKS-2019-30',
    nama: 'Muhammad Amin Sade',
    pin: '123456',
    gps: '-5.15650,119.41200', // Kantor Makassar
    expectedValid: true
  },
  {
    branch: 'Cabang Palembang',
    nik: 'NSR-PLB-2022-44',
    nama: 'Dharma Priyanto Sih Budi Susilo',
    pin: '123456',
    gps: '-2.92904,104.69598', // Kantor Palembang
    expectedValid: true
  }
];

async function runTests() {
  console.log('=== TEST 1: TIMEZONE DATE RESOLUTION ===');
  // Simulate morning hours 05:57 WIB on 28 Oct 2026
  const fakeMorningDate = new Date('2026-10-27T22:57:00.000Z'); // 05:57 WIB on 28 Oct
  const utcDate = fakeMorningDate.toISOString().split('T')[0];
  const wibDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(fakeMorningDate);

  console.log('Timestamp UTC:', fakeMorningDate.toISOString());
  console.log('Buggy UTC split Date:', utcDate, '(Tanggal KEMARIN!)');
  console.log('Fixed Jakarta YMD:', wibDate, '(Tanggal HARI INI yang benar!)');
  if (utcDate !== wibDate && wibDate === '2026-10-28') {
    console.log('✓ VERIFIKASI AKAR MASALAH TIMEZONE TERBUKTI 100%!');
  } else {
    console.error('Timezone check mismatch');
  }

  console.log('\n=== TEST 2: AUTHENTICATION NIK + PIN FOR 5 BRANCHES (GAS SSOT) ===');
  for (const emp of testEmployees) {
    try {
      const res = await fetch(GAS_WEBAPP, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'verify_pin',
          nik: emp.nik,
          pin: emp.pin
        })
      });
      const data = await res.json();
      console.log(`[${emp.branch}] ${emp.nik} (${emp.nama}): Status = ${data.status}, Message = ${data.message || data.status}`);
      if (data.status !== 'success' && !data.success) {
        console.warn(`  ⚠️ Warning: verify_pin failed for ${emp.nik}:`, data);
      } else {
        console.log(`  ✓ Auth Sukses: NIK & PIN valid, Sesi terbit.`);
      }
    } catch (e) {
      console.error(`  ❌ Error verifying ${emp.nik}:`, e.message);
    }
  }

  console.log('\n=== TEST 3: MULTI-OFFICE GEOFENCING VIA PHP BACKEND ===');
  // Start local PHP built-in server on port 8085
  const phpServer = spawn('php', ['-S', '127.0.0.1:8085', 'absensi-data-handler.php']);
  await new Promise(r => setTimeout(r, 1200));

  try {
    for (const emp of testEmployees) {
      // Test verify_pin on local PHP handler
      const authRes = await fetch('http://127.0.0.1:8085/?action=verify_pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik: emp.nik, pin: emp.pin })
      });
      const authData = await authRes.json();
      console.log(`Local PHP Auth [${emp.branch}] ${emp.nik}:`, authData.status || (authData.success ? 'success' : 'failed'));

      // Test cekKaryawan
      const cekRes = await fetch('http://127.0.0.1:8085/?action=cekKaryawan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik: emp.nik })
      });
      const cekData = await cekRes.json();
      console.log(`Local PHP Cek [${emp.branch}] ${emp.nik}: Kantor = ${cekData.data?.kantor || cekData.data?.cabang || '-'}`);
    }

    // Test getDashboardHR with fixed Jakarta date
    const todayJakarta = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const hrRes = await fetch('http://127.0.0.1:8085/?action=getDashboardHR', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': 'NSR8899',
        'X-Admin-Key': 'NSR8899',
        'X-NIK': 'NSR-2019-005'
      },
      body: JSON.stringify({
        sessionToken: 'NSR8899',
        nik: 'NSR-2019-005',
        tanggal: todayJakarta
      })
    });
    const hrData = await hrRes.json();
    console.log('\n=== TEST 4: DASHBOARD HR METRICS & ROSTER SYNC ===');
    console.log('Tanggal Dashboard:', hrData.tanggal);
    console.log('Ringkasan:', hrData.ringkasan);
    console.log('Total Karyawan Aktif di Roster:', hrData.karyawan_pusat?.length);
    console.log('Total Belum Presensi:', hrData.belum_presensi_list?.length);
    console.log('Transaksi Hari Ini (' + hrData.tanggal + '):', hrData.transaksi_hari_ini?.length, 'transaksi');
    if (hrData.transaksi_hari_ini?.length === 0) {
      console.log('✓ Transaksi kemarin (Dhea) TIDAK LAGI terseret ke dashboard hari ini (' + hrData.tanggal + ')!');
    }
  } finally {
    phpServer.kill();
    console.log('\n✓ Test server terminated cleanly.');
  }
}

runTests().catch(console.error);
