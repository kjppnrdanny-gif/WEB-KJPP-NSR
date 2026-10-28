/**
 * FAST TRACK INTEGRATION TEST — 5 PORTAL UTAMA KJPP NSR
 * Menguji 6 Fungsi Inti secara Terintegrasi:
 * 1. Login & Hak Akses Pusat/Cabang
 * 2. Penugasan JO (Input, Simpan, & Sinkronisasi)
 * 3. NoLap (Pengajuan & Penerbitan Nomor Laporan)
 * 4. Kwitansi (Penyimpanan, Pengesahan Nomor Resmi, Cetak)
 * 5. Surat Umum (Pembuatan, Penomoran, & Isolasi Cabang)
 * 6. Presensi (OTP, Kehadiran Haversine, Anti-Duplikasi, Riwayat)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Import Handlers / Proxies & Auth
import absensiHandler from '../netlify/functions/absensi-data-proxy.mjs';
import kwitansiHandler from '../netlify/functions/kwitansi-data-proxy.mjs';
import nolapHandler, { _setTransactionalSimulationMode } from '../netlify/functions/nolap-data-proxy.mjs';
import { handler as suratUmumHandler } from '../netlify/functions/surat-umum-data-proxy.mjs';
import { createSessionToken } from '../netlify/functions/lib/auth-core.mjs';

console.log('===============================================================');
console.log('   PENGUJIAN INTEGRASI INTI 5 PORTAL KJPP NSR (FAST TRACK)     ');
console.log('===============================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✅ PASS: ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function callModule(modHandler, method, body = {}, headers = {}, query = '') {
  if (modHandler === suratUmumHandler) {
    const event = {
      httpMethod: method,
      headers: {
        'content-type': 'application/json',
        ...headers
      },
      queryStringParameters: query ? Object.fromEntries(new URLSearchParams(query)) : {},
      body: method === 'POST' ? JSON.stringify(body) : undefined
    };
    const res = await modHandler(event);
    let parsed = null;
    try { parsed = JSON.parse(res.body); } catch { parsed = res.body; }
    return { status: res.statusCode, data: parsed };
  }

  const url = `http://localhost/api/test${query ? '?' + query : ''}`;
  const req = new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: method === 'POST' ? JSON.stringify(body) : undefined
  });
  const res = await modHandler(req);
  const json = await res.json();
  return { status: res.status, data: json };
}

async function runFastTrackIntegration() {
  // Generate valid test session tokens for different roles
  const tokenPusat = createSessionToken({ role: 'ADMIN_PUSAT', branch: 'Pusat' });
  const tokenBandung = createSessionToken({ role: 'ADMIN_CABANG', branch: 'Bandung' });
  const tokenKeuangan = createSessionToken({ role: 'KEUANGAN', branch: 'Pusat' });

  // -------------------------------------------------------------------------
  // 1. LOGIN & HAK AKSES PUSAT / CABANG (RBAC)
  // -------------------------------------------------------------------------
  console.log('[1/6] PENGUJIAN LOGIN & HAK AKSES PUSAT / CABANG:');
  {
    // Akses Surat Umum oleh Cabang Bandung (Harus Ditolak Mutlak)
    const suCabang = await callModule(suratUmumHandler, 'POST', {
      action: 'bacaDaftarSurat'
    }, { 'authorization': `Bearer ${tokenBandung}`, 'x-nsr-token': tokenBandung });
    check('Surat Umum menolak akses Akun Cabang (403 Forbidden)', () => {
      assert.strictEqual(suCabang.status, 403);
      assert.strictEqual(suCabang.data.success, false);
    });

    // Akses Surat Umum oleh Admin Pusat (Harus Diizinkan)
    const suPusat = await callModule(suratUmumHandler, 'POST', {
      action: 'bacaDaftarSurat'
    }, { 'authorization': `Bearer ${tokenPusat}`, 'x-nsr-token': tokenPusat });
    check('Surat Umum mengizinkan akses Admin Pusat (200 OK)', () => {
      assert.strictEqual(suPusat.status, 200);
      assert.strictEqual(suPusat.data.success, true);
    });
  }

  // -------------------------------------------------------------------------
  // 2. PENUGASAN JO: INPUT, SIMPAN, & SINKRONISASI
  // -------------------------------------------------------------------------
  console.log('\n[2/6] PENGUJIAN PENUGASAN JO:');
  {
    const htmlJO = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
    check('Form Penugasan JO memiliki input field esensial (SPK, Klien, Objek)', () => {
      assert.ok(htmlJO.includes('pemberi_tugas_nama'));
      assert.ok(htmlJO.includes('debitur_nama'));
      assert.ok(htmlJO.includes('biaya_total'));
    });
    check('Penugasan JO memiliki fungsi transmisi sinkronisasi ke backend', () => {
      assert.ok(htmlJO.includes('kirimDataKeGasServer'));
      assert.ok(htmlJO.includes('mapProjectToSheetPayload'));
    });
  }

  // -------------------------------------------------------------------------
  // 3. NOLAP: PENGAJUAN & PENERBITAN NOMOR LAPORAN
  // -------------------------------------------------------------------------
  console.log('\n[3/6] PENGUJIAN NOLAP:');
  {
    _setTransactionalSimulationMode(true);

    // Penerbitan nomor laporan resmi
    const dummyApprove = {
      action: 'approveRequest',
      idPermohonan: 'REQ-DUMMY-003',
      nomorLaporanResmi: '00532/2.0160-04/PI/07/00581/1/X/2026',
      penilai: 'Ahmad Fauzi, S.T.'
    };
    const resApprove = await callModule(nolapHandler, 'POST', dummyApprove, { 'authorization': `Bearer ${tokenPusat}`, 'x-nsr-token': tokenPusat });
    check('Penerbitan nomor laporan resmi berhasil diproses (200 OK)', () => {
      assert.strictEqual(resApprove.status, 200);
      assert.strictEqual(resApprove.data.success, true);
    });

    // Anti-duplikasi nomor laporan: Coba nomor laporan yang sama persis
    const dummyDup = {
      action: 'approveRequest',
      idPermohonan: 'REQ-DUMMY-002',
      nomorLaporanResmi: '00532/2.0160-04/PI/07/00581/1/X/2026', // Duplikat
      penilai: 'Tedi Setiadi'
    };
    const resDup = await callModule(nolapHandler, 'POST', dummyDup, { 'authorization': `Bearer ${tokenPusat}`, 'x-nsr-token': tokenPusat });
    check('Penerbitan nomor laporan ganda dicegah secara atomik (HTTP 409 Conflict)', () => {
      assert.strictEqual(resDup.status, 409);
      assert.strictEqual(resDup.data.violation, 'DUPLICATE_NUMBER_REJECTED');
    });
  }

  // -------------------------------------------------------------------------
  // 4. KWITANSI: PENYIMPANAN, APPROVAL, & CETAK
  // -------------------------------------------------------------------------
  console.log('\n[4/6] PENGUJIAN KWITANSI:');
  {
    // Simpan Draft Pengajuan Kwitansi
    const draftPayload = {
      action: 'simpanPengajuanKwitansi',
      data: {
        idKwitansi: 'KW-TEST-FAST-01',
        noSPK: 'SPK/NSR/X/2026/099',
        namaKlien: 'PT Bank Mandiri (Persero) Tbk',
        nominalTagihan: 25000000,
        keperluan: 'Pembayaran Termin I Jasa Penilaian'
      }
    };
    const resDraft = await callModule(kwitansiHandler, 'POST', draftPayload, { 'authorization': `Bearer ${tokenBandung}`, 'x-nsr-token': tokenBandung });
    check('Pengajuan draft kwitansi berhasil disimpan (200 OK)', () => {
      assert.strictEqual(resDraft.status, 200);
      assert.strictEqual(resDraft.data.success, true);
    });

    // Approval Kwitansi oleh Keuangan / Admin Pusat
    const approvePayload = {
      action: 'approveKwitansi',
      idKwitansi: 'KW-TEST-FAST-01',
      noKwitansiResmi: '099/KW-NSR/X/2026'
    };
    const resApproveKW = await callModule(kwitansiHandler, 'POST', approvePayload, { 'authorization': `Bearer ${tokenKeuangan}`, 'x-nsr-token': tokenKeuangan });
    check('Approval pengesahan kwitansi resmi berhasil (200 OK)', () => {
      assert.strictEqual(resApproveKW.status, 200);
      assert.strictEqual(resApproveKW.data.success, true);
    });

    // Verifikasi fitur cetak PDF di UI
    const htmlKW = fs.readFileSync('portal-kwitansi.html', 'utf8');
    check('Portal Kwitansi memiliki komponen cetak PDF resmi (#print-area)', () => {
      assert.ok(htmlKW.includes('print-area'));
      assert.ok(htmlKW.includes('cetakPDFKwitansi'));
    });
  }

  // -------------------------------------------------------------------------
  // 5. SURAT UMUM: PEMBUATAN & PENOMORAN
  // -------------------------------------------------------------------------
  console.log('\n[5/6] PENGUJIAN SURAT UMUM:');
  {
    const suPayload = {
      action: 'buatSuratUmum',
      data: {
        tanggalSurat: '2026-10-20',
        tujuanPenerima: 'Kementerian Keuangan RI - DJKN',
        perihal: 'Penyampaian Laporan Berkala Penilaian Properti',
        klasifikasiPerihal: 'Laporan Berkala',
        penandatangan: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert)'
      }
    };
    const resSU = await callModule(suratUmumHandler, 'POST', suPayload, { 'authorization': `Bearer ${tokenPusat}`, 'x-nsr-token': tokenPusat });
    check('Pembuatan Surat Umum baru berhasil menerbitkan nomor agenda resmi (200 OK / 201 Created)', () => {
      assert.ok(resSU.status === 200 || resSU.status === 201);
      assert.strictEqual(resSU.data.success, true);
      assert.ok(resSU.data.noSurat);
    });
  }

  // -------------------------------------------------------------------------
  // 6. PRESENSI: OTP, MASUK/PULANG, & RIWAYAT
  // -------------------------------------------------------------------------
  console.log('\n[6/6] PENGUJIAN PRESENSI:');
  {
    // Permintaan OTP untuk Danny Taufik Hidayat
    const resOTP = await callModule(absensiHandler, 'POST', { action: 'mintaOTP', nik: 'NSR-2019-005' });
    check('Permintaan OTP presensi karyawan terkirim ke email terdaftar (200 OK)', () => {
      assert.strictEqual(resOTP.status, 200);
      assert.strictEqual(resOTP.data.success, true);
      assert.ok(resOTP.data.test_otp_hint);
    });

    const otpCode = resOTP.data.test_otp_hint;
    const resAuth = await callModule(absensiHandler, 'POST', { action: 'verifikasiOTP', nik: 'NSR-2019-005', otp: otpCode });
    check('Verifikasi OTP menerbitkan sessionToken 12 jam (200 OK)', () => {
      assert.strictEqual(resAuth.status, 200);
      assert.ok(resAuth.data.sessionToken);
    });

    const token = resAuth.data.sessionToken;

    // Presensi Masuk di Kantor Pusat (Radius < 150m)
    const resPresensiIn = await callModule(absensiHandler, 'POST', {
      action: 'simpanAbsensi',
      nik: 'NSR-2019-005',
      sessionToken: token,
      gps: '-6.287972658138783,106.82477864308436',
      lokasi: 'KANTOR',
      jenis: 'Masuk'
    });
    check('Pencatatan Presensi Masuk diverifikasi VALID dalam radius 150m', () => {
      assert.strictEqual(resPresensiIn.status, 200);
      assert.strictEqual(resPresensiIn.data.statusValidasi, 'VALID');
    });

    // Anti Double Submission (Masuk kedua kali di hari yang sama harus ditolak)
    const resPresensiDup = await callModule(absensiHandler, 'POST', {
      action: 'simpanAbsensi',
      nik: 'NSR-2019-005',
      sessionToken: token,
      gps: '-6.287972658138783,106.82477864308436',
      lokasi: 'KANTOR',
      jenis: 'Masuk'
    });
    check('Presensi Masuk kedua kali pada tanggal yang sama ditolak (HTTP 409 DUPLICATE_PRESENSI)', () => {
      assert.strictEqual(resPresensiDup.status, 409);
      assert.strictEqual(resPresensiDup.data.code, 'DUPLICATE_PRESENSI');
    });

    // Presensi Pulang di hari yang sama
    const resPresensiOut = await callModule(absensiHandler, 'POST', {
      action: 'simpanAbsensi',
      nik: 'NSR-2019-005',
      sessionToken: token,
      gps: '-6.287972658138783,106.82477864308436',
      lokasi: 'KANTOR',
      jenis: 'Pulang'
    });
    check('Pencatatan Presensi Pulang berhasil dicatat (200 OK)', () => {
      assert.strictEqual(resPresensiOut.status, 200);
      assert.strictEqual(resPresensiOut.data.statusValidasi, 'VALID');
    });

    // Baca Riwayat Presensi
    const resRiwayat = await callModule(absensiHandler, 'POST', {
      action: 'getRiwayatPresensi',
      nik: 'NSR-2019-005',
      sessionToken: token
    });
    check('Riwayat presensi menyajikan rekap data kehadiran karyawan yang sah', () => {
      assert.strictEqual(resRiwayat.status, 200);
      assert.ok(resRiwayat.data.rekap.total_presensi >= 2);
    });
  }

  console.log('\n===============================================================');
  console.log(`HASIL AKHIR FAST TRACK INTEGRASI: ${passedChecks} / ${totalChecks} PASS`);
  console.log('===============================================================');

  if (passedChecks !== totalChecks) {
    process.exit(1);
  }
}

runFastTrackIntegration().catch(console.error);
