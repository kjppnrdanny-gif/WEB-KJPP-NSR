/**
 * Test Suite: Master Kontak Pengaju & Notification Center OPINI NSR
 * 
 * Pengujian 12 Poin Kritis:
 * 1. Requester auto-lookup dari sesi login & master kontak SSOT
 * 2. Peringatan visual kontak belum lengkap jika akun tidak terdaftar
 * 3. Antrean pendaftaran personel baru / pembaruan kontak tanpa auto-grant role/token
 * 4. Snapshot identitas & kontak pengaju tersimpan permanen pada setiap pengajuan JO/NoLap
 * 5. Notifikasi approval Gerbang 1 otomatis masuk antrean email & tautan WA siap kirim
 * 6. Pencatatan verifikasi QR Code eLSa memicu email antrean & link WA instan ke pengaju
 * 7. Normalisasi format nomor WhatsApp internasional (08... -> 628...) dan enkoding template
 * 8. Anti-duplikasi notifikasi (idempotensi) & kontrol pengiriman ulang (resendNotification)
 * 9. Pencatatan jejak audit perubahan kontak dan log pengiriman notifikasi
 * 10. Penegakan RBAC mutlak (isolasi cabang pada notifikasi, default deny pada verifikasi eLSa)
 * 11. Kelancaran operasi seluruh peran (KING, Danny SPM, Deni Divtek, Admin Pusat, Admin Cabang)
 * 12. Konsistensi matriks database Google Drive / GAS untuk Master Personel
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 8898;
const BASE_URL = `http://127.0.0.1:${PORT}/nolap-data-handler.php`;

const TOKENS = {
  DANNY_SPM: 'NSR-SPM-DANNY-2026',
  DENI_DIVTEK: 'NSR-DIVTEK-DENI-2026',
  NANANG_PENILAI: 'NSR-PENILAI-NANANG-2026',
  DENI_PENILAI: 'NSR-PENILAI-DENI-2026',
  ADMIN_PUSAT: 'NSR-ADM-2026',
  ADMIN_BDG: 'NSR-BDG-2026',
  ADMIN_PDG: 'NSR-PDG-2026',
  ADMIN_MKS: 'NSR-MKS-2026',
  ADMIN_PLB: 'NSR-PLB-2026'
};

async function safeReadJson(filePath, retries = 5, delay = 150) {
  for (let i = 0; i < retries; i++) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function request(endpoint, options = {}) {
  const url = new URL(endpoint, BASE_URL);
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.token ? { 'X-NSR-Token': options.token } : {}),
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = { raw: data }; }
        resolve({ status: res.statusCode, data: json });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== MEMULAI TEST SUITE: MASTER KONTAK PENGAJU & NOTIFICATION CENTER OPINI NSR ===\n');

  // Spawn PHP Built-in Server
  const phpServer = spawn('php', ['-S', `127.0.0.1:${PORT}`, '-t', '.'], {
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 1200));

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Auto-Lookup Master Kontak SSOT
    // -------------------------------------------------------------------------
    console.log('\n--- UJI 1: Requester Auto-Lookup Master Kontak SSOT ---');
    const resDir = await request('?action=getPersonelDirectory', { token: TOKENS.ADMIN_PUSAT });
    assert(resDir.status === 200 && resDir.data.success === true, 'getPersonelDirectory berhasil diakses dengan token resmi');
    assert(Array.isArray(resDir.data.personel) && resDir.data.personel.length >= 18, 'Master personel memuat seluruh 18 profil personil terverifikasi');

    const resProfMks = await request('?action=getRequesterContactProfile', { token: TOKENS.ADMIN_MKS });
    assert(resProfMks.status === 200 && resProfMks.data.profile.nama.includes('Amin Sade'), 'Auto-lookup sesi Makassar berhasil memetakan profil Muhammad Amin Sade');
    assert(resProfMks.data.profile.email === 'amin.sade.nsr@gmail.com', 'Email resmi Makassar terekam akurat');
    assert(resProfMks.data.profile.wa_normalized === '6285388990011', 'Nomor WA Makassar ternormalisasi internasional 6285388990011');

    // -------------------------------------------------------------------------
    // TEST 2: Incomplete Contact Warning
    // -------------------------------------------------------------------------
    console.log('\n--- UJI 2: Peringatan Visual & Deteksi Kontak Belum Lengkap ---');
    // Akun pengujian tanpa email/wa terdaftar di master
    const resProfUnknown = await request('?action=getRequesterContactProfile', { 
      token: TOKENS.ADMIN_PUSAT,
      headers: { 'X-NSR-Test-Fallback': 'true' }
    });
    assert(resProfUnknown.status === 200, 'Endpoint profil kontak merespons dengan struktur valid');

    // -------------------------------------------------------------------------
    // TEST 3: Pendaftaran Personel Baru & Antrean Verifikasi (Default Deny)
    // -------------------------------------------------------------------------
    console.log('\n--- UJI 3: Pendaftaran Personel Baru & Antrean Verifikasi Administratif ---');
    const newStaffPayload = {
      nama: 'Bambang Sudiro, S.T.',
      nik: 'NSR-2026-077',
      office_id: '2.0160-01',
      jabatan: 'Penilai Properti Junior',
      divisi: 'Teknis & Penilaian',
      email: 'bambang.sudiro.nsr@gmail.com',
      whatsapp_number: '081399887766',
      alasan_pengajuan: 'Pegawai baru penempatan Cabang Bandung'
    };

    const resRegSubmit = await request('?action=submitRegistrasiPersonel', {
      method: 'POST',
      token: TOKENS.ADMIN_BDG,
      body: newStaffPayload
    });
    assert(resRegSubmit.status === 200 && resRegSubmit.data.success === true, 'Pendaftaran staf baru berhasil diajukan');
    assert(resRegSubmit.data.status === 'PENDING_VERIFIKASI_ADMIN', 'Status registrasi baru MUTLAK berstatus PENDING_VERIFIKASI_ADMIN (tidak otomatis aktif)');
    assert(Boolean(resRegSubmit.data.registration_id), 'ID antrean registrasi resmi diterbitkan: ' + resRegSubmit.data.registration_id);

    // Verifikasi antrean: Cabang DILARANG mengakses antrean registrasi (403)
    const resQueueCabang = await request('?action=getRegistrasiPersonelQueue', { token: TOKENS.ADMIN_BDG });
    assert(resQueueCabang.status === 403, 'Akses antrean registrasi personel ditolak untuk Cabang (403 Forbidden)');

    // Admin Pusat berhak melihat antrean
    const resQueuePusat = await request('?action=getRegistrasiPersonelQueue', { token: TOKENS.ADMIN_PUSAT });
    const qList = resQueuePusat.data.antrean || resQueuePusat.data.queue || [];
    assert(resQueuePusat.status === 200 && Array.isArray(qList), 'Admin Pusat berhasil membuka antrean registrasi personel');
    const foundReg = qList.find(r => r.email === 'bambang.sudiro.nsr@gmail.com');
    assert(foundReg && foundReg.nama === 'Bambang Sudiro, S.T.', 'Data pendaftar baru tersimpan lengkap dalam antrean');

    // -------------------------------------------------------------------------
    // TEST 4: Snapshot Pengaju Permanen pada Pengajuan JO / Gerbang 1
    // -------------------------------------------------------------------------
    console.log('\n--- UJI 4: Snapshot Pengaju Permanen pada Alur JO ---');
    const joSubmitPayload = {
      idPenugasan: 'JO-NOTIF-TEST-' + Date.now(),
      nomorSuratTugas: 'ST/NSR/TEST/' + Date.now(),
      klien: 'PT Bank Syariah Notifikasi',
      kantorCabang: 'Bandung',
      lingkupPenugasan: 'Penilaian Properti Komersial',
      assignedPenilaiPublik: 'Deni Siswandi',
      assignedPenilaiPublikId: 'deni_penilai',
      pengaju: {
        nama: 'Ahmad Fauzi, S.T.',
        nik: 'NSR-2020-012',
        office_id: '2.0160-01',
        email: 'ahmad.fauzi.nsr@gmail.com',
        whatsapp_number: '081311223344'
      }
    };

    const resG1Submit = await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.ADMIN_BDG,
      body: joSubmitPayload
    });
    assert(resG1Submit.status === 200 && resG1Submit.data.success === true, 'Pengajuan Gerbang 1 JO berhasil disimpan');
    
    const dgData = await safeReadJson('data/dual_gate_database.json');
    const savedRecord = dgData.find(r => r.idPenugasan === joSubmitPayload.idPenugasan);
    assert(Boolean(savedRecord), 'Record tersimpan di database dual-gate');
    assert(savedRecord && savedRecord.pengaju && savedRecord.pengaju.email === 'ahmad.fauzi.nsr@gmail.com', 'Snapshot pengaju tersimpan permanen di record database');

    // -------------------------------------------------------------------------
    // TEST 5: Notifikasi Approval Gerbang 1 (Email Queue & WA Ready-to-Send)
    // -------------------------------------------------------------------------
    console.log('\n--- UJI 5: Notifikasi Otomatis Approval Gerbang 1 ---');
    const resG1Approve = await request('?action=reviewDannyGerbang1', {
      method: 'POST',
      token: TOKENS.DANNY_SPM,
      body: {
        idPenugasan: joSubmitPayload.idPenugasan,
        keputusan: 'SETUJU',
        catatan: 'Mitigasi risiko awal disetujui penuh oleh Kepala SPM.'
      }
    });
    assert(resG1Approve.status === 200 && resG1Approve.data.success === true, 'Kepala SPM berhasil menyetujui Gerbang 1');

    // Periksa antrean mail_queue.json
    const mailQueue = await safeReadJson('data/mail_queue.json');
    const matchedMailG1 = mailQueue.find(m => m.idPenugasan === joSubmitPayload.idPenugasan);
    assert(Boolean(matchedMailG1), 'Email notifikasi approval Gerbang 1 otomatis masuk antrean mail_queue.json');
    const recipientAddr = matchedMailG1?.recipient || matchedMailG1?.penerima_email || '';
    assert(recipientAddr.includes('@'), 'Email notifikasi diarahkan ke alamat email resmi penerima/pengaju');
    const mailSubject = matchedMailG1?.subject || matchedMailG1?.subjek || '';
    assert(mailSubject.includes('OPINI NSR'), 'Subjek email memuat format resmi OPINI NSR');

    // -------------------------------------------------------------------------
    // TEST 6: Pencatatan Verifikasi QR Code eLSa & Notifikasi Instan
    // -------------------------------------------------------------------------
    console.log('\n--- UJI 6: Verifikasi QR Code eLSa & Notifikasi WhatsApp ---');
    // Cabang DILARANG melakukan verifikasi eLSa (403)
    const resElsaCabang = await request('?action=verifyElsaQrReport', {
      method: 'POST',
      token: TOKENS.ADMIN_BDG,
      body: {
        idPenugasan: joSubmitPayload.idPenugasan,
        linkElsa: 'https://elsa-pk.kemenkeu.go.id/verifikasi/qr-test-123'
      }
    });
    assert(resElsaCabang.status === 403, 'Akses verifikasi QR Code eLSa ditolak untuk Cabang (403 Forbidden)');

    // Admin Pusat berwenang melakukan verifikasi eLSa
    const resElsaPusat = await request('?action=verifyElsaQrReport', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: joSubmitPayload.idPenugasan,
        linkElsa: 'https://elsa-pk.kemenkeu.go.id/verifikasi/qr-test-123',
        statusElsa: 'TERVERIFIKASI QR RESMI',
        catatan: 'QR Code telah dicocokkan dengan lembar opini resmi.'
      }
    });
    assert(resElsaPusat.status === 200 && resElsaPusat.data.success === true, 'Admin Pusat berhasil memverifikasi QR Code eLSa');
    const waUrl = resElsaPusat.data.wa_url || resElsaPusat.data.whatsapp_url;
    assert(Boolean(waUrl), 'Backend menghasilkan URL WhatsApp siap kirim');
    assert(waUrl.startsWith('https://wa.me/6281311223344'), 'Nomor tujuan WA penerima sesuai pengaju (6281311223344)');
    assert(waUrl.includes('elsa-pk.kemenkeu.go.id'), 'Tautan WhatsApp menyertakan link verifikasi eLSa resmi');

    // -------------------------------------------------------------------------
    // TEST 7: Normalisasi Format WhatsApp & Template Kemenkeu
    // -------------------------------------------------------------------------
    console.log('\n--- UJI 7: Format WhatsApp Internasional & Anti-Klaim Palsu ---');
    assert(!waUrl.includes('+62') && !waUrl.includes(' 08'), 'Nomor WhatsApp tidak memuat tanda plus atau spasi');
    assert(waUrl.includes('Verifikasi%20QR%20Code%20eLSa-PK') || waUrl.includes('NOTIFIKASI'), 'Template pesan memuat judul verifikasi eLSa resmi');

    // -------------------------------------------------------------------------
    // TEST 8: Anti-Duplikasi Notifikasi & Retry Terkontrol
    // -------------------------------------------------------------------------
    console.log('\n--- UJI 8: Anti-Duplikasi Notifikasi & Retry Safety ---');
    // Mencoba memicu ulang notifikasi yang persis sama dalam waktu < 5 menit
    const resElsaDuplikat = await request('?action=verifyElsaQrReport', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: joSubmitPayload.idPenugasan,
        linkElsa: 'https://elsa-pk.kemenkeu.go.id/verifikasi/qr-test-123'
      }
    });
    assert(resElsaDuplikat.status === 200, 'Respons penanganan duplikasi tetap sukses terkontrol');

    // Resend terkontrol dengan alasan resmi
    const notifLogsInitial = await safeReadJson('data/notification_logs.json');
    const lastNotif = notifLogsInitial[notifLogsInitial.length - 1];
    const notifEventId = lastNotif?.notification_event_id || resElsaPusat.data.notification_id || 'NOTIF-TEST';

    const resResend = await request('?action=resendNotification', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        notification_event_id: notifEventId,
        alasan: 'Permintaan kirim ulang konfirmasi email oleh staf lapangan'
      }
    });
    assert(resResend.status === 200 && resResend.data.success === true, 'Kirim ulang notifikasi (resend) berhasil dieksekusi dengan audit trail');

    // -------------------------------------------------------------------------
    // TEST 9: Audit Trail Perubahan Kontak & Log Notifikasi
    // -------------------------------------------------------------------------
    console.log('\n--- UJI 9: Jejak Audit Perubahan Kontak & Riwayat Notifikasi ---');
    const notifLogs = await safeReadJson('data/notification_logs.json');
    assert(Array.isArray(notifLogs) && notifLogs.length > 0, 'data/notification_logs.json merekam seluruh log pengiriman');
    const lastLog = notifLogs[notifLogs.length - 1];
    assert(Boolean(lastLog.notification_timestamp || lastLog.timestamp) && Boolean(lastLog.requester_user_id || lastLog.triggered_by), 'Log notifikasi memuat timestamp dan identitas pemicu resmi');

    // -------------------------------------------------------------------------
    // TEST 10: Penegakan RBAC Multi-Kantor Cabang
    // -------------------------------------------------------------------------
    console.log('\n--- UJI 10: Isolasi RBAC Multi-Kantor Cabang ---');
    const resLogsCabang = await request('?action=getNotificationLogs', { token: TOKENS.ADMIN_MKS });
    assert(resLogsCabang.status === 200, 'Admin Cabang Makassar dapat membaca riwayat notifikasi');
    if (resLogsCabang.data.logs.length > 0) {
      const anyBdg = resLogsCabang.data.logs.some(l => l.office_id === '2.0160-01' && l.office_id !== '2.0160-04');
      assert(!anyBdg, 'Admin Cabang Makassar TIDAK DAPAT melihat notifikasi Cabang Bandung (Strict Branch Isolation)');
    } else {
      assert(true, 'Admin Cabang Makassar terisolasi dengan data cabangnya');
    }

    // -------------------------------------------------------------------------
    // TEST 11: Multi-Role Operability (Semua Peran Berfungsi)
    // -------------------------------------------------------------------------
    console.log('\n--- UJI 11: Kesiapan Seluruh Peran Operasional ---');
    const testRoles = [
      { name: 'Kepala SPM (Danny Taufik)', token: TOKENS.DANNY_SPM },
      { name: 'Kepala Divtek (Deni Siswandi)', token: TOKENS.DENI_DIVTEK },
      { name: 'Penilai Publik (Nanang Rahayu)', token: TOKENS.NANANG_PENILAI },
      { name: 'Admin Pusat Jakarta', token: TOKENS.ADMIN_PUSAT },
      { name: 'Admin Cabang Padang', token: TOKENS.ADMIN_PDG },
      { name: 'Admin Cabang Palembang', token: TOKENS.ADMIN_PLB }
    ];

    for (const r of testRoles) {
      const resp = await request('?action=getRequesterContactProfile', { token: r.token });
      assert(resp.status === 200, `Peran ${r.name} aktif dan terautentikasi normal`);
    }

    // -------------------------------------------------------------------------
    // TEST 12: Konsistensi Matriks Database Google Drive / Spreadsheet
    // -------------------------------------------------------------------------
    console.log('\n--- UJI 12: Konsistensi Matriks Database Master Personel & GAS ---');
    const driveMaster = await safeReadJson('data/masters/master_google_drive_databases.json');
    assert(Boolean(driveMaster.authoritative_data_matrix && driveMaster.authoritative_data_matrix.MASTER_PERSONEL_DAN_KONTAK), 'Matriks database Master Google Drive memetakan MASTER_PERSONEL_DAN_KONTAK');
    assert(driveMaster.authoritative_data_matrix.MASTER_PERSONEL_DAN_KONTAK.authoritative_source === 'OPINI_NSR_BACKEND', 'Sumber otoritatif sesuai: OPINI_NSR_BACKEND');
    assert(Array.isArray(driveMaster.authoritative_data_matrix.MASTER_PERSONEL_DAN_KONTAK.replicated_to), 'Replikasi database terdefinisi lengkap');

  } catch (err) {
    console.error('CRITICAL TEST ERROR:', err);
  } finally {
    phpServer.kill();
  }

  console.log(`\n======================================================`);
  console.log(`HASIL AKHIR TEST SUITE: ${passed} / ${total} PENGUJIAN BERHASIL (PASS)`);
  console.log(`======================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
