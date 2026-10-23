import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

console.log('===============================================================');
console.log('🧪 TEST SUITE: NOTIFIKASI APPROVAL SPK/JO (WHATSAPP & EMAIL)');
console.log('===============================================================');

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    pass++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    fail++;
  }
}

// -------------------------------------------------------------
// 1. PENGUJIAN DOM & UI KOMPONEN PORTAL JO
// -------------------------------------------------------------
console.log('\n--- 1. PENGUJIAN ELEMEN UI PORTAL JO ---');
const joHtml = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

assert(joHtml.includes('id="modal-notifikasi-approval-jo"'), 'Modal Notifikasi Approval SPK/JO terpasang di DOM');
assert(joHtml.includes('id="btn-modal-kirim-wa"'), 'Tombol Kirim WA di Modal Notifikasi terpasang');
assert(joHtml.includes('id="btn-tab3-notif-wa"'), 'Tombol Notifikasi WA di Toolbar Tab 3 terpasang');
assert(joHtml.includes('id="notif-jo-spk"'), 'Elemen Nomor SPK Resmi terpasang di modal');
assert(joHtml.includes('id="notif-jo-adm"'), 'Elemen Nomor JO Resmi terpasang di modal');
assert(joHtml.includes('id="notif-jo-wilayah"'), 'Elemen Kantor Cabang terpasang di modal');
assert(joHtml.includes('id="notif-jo-email-badge"'), 'Badge status email terpasang di modal');
assert(joHtml.includes('kirimNotifikasiWaPengaju'), 'Fungsi kirimNotifikasiWaPengaju terpasang pada aksi dashboard');
assert(joHtml.includes('kirimNotifikasiApprovalJoServer'), 'Fungsi kirimNotifikasiApprovalJoServer terpasang');
assert(joHtml.includes('formatPesanWhatsAppJo'), 'Fungsi formatPesanWhatsAppJo terpasang');
assert(joHtml.includes('normalisasiNomorWa'), 'Fungsi normalisasiNomorWa terpasang');

// -------------------------------------------------------------
// 2. PENGUJIAN FORMAT PESAN WHATSAPP & NORMALISASI NOMOR WA
// -------------------------------------------------------------
console.log('\n--- 2. PENGUJIAN FORMAT PESAN & NORMALISASI NOMOR WA ---');

function normalisasiNomorWa(rawPhone) {
  if (!rawPhone) return '';
  let clean = String(rawPhone).replace(/[^0-9]/g, '');
  if (clean.startsWith('08')) {
    clean = '62' + clean.substring(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

function formatPesanWhatsAppJo(p) {
  const namaPengaju = p.pengaju_nama || p.namaPemohon || 'Rekan Penilai';
  const kantorCabang = p.kantor_wilayah || p.pengaju_kantor || 'Kantor Cabang';
  const namaPenugasan = p.pemberi_tugas_nama || p.debitur_nama || 'Penugasan Penilaian';
  const noSpk = p.nomor_lp || '-';
  const noJo = p.nomor_adm || '-';
  const tglSurat = '23 Oktober 2026';
  const portalUrl = 'https://kjppnanangrahayu.com/portal-penugasan-jo.html';

  let msg = 'Yth. Rekan Penilai / Admin Pengaju *' + namaPengaju + '*,\n\n';
  msg += '🔔 *[OPINI NSR] Pemberitahuan Penerbitan Nomor SPK & Job Order (JO) Resmi*\n';
  msg += '--------------------------------------\n';
  msg += 'Permohonan Lingkup Penugasan & Job Order Anda telah *DISETUJUI* oleh Kantor Pusat.\n\n';
  msg += '• ID Penugasan : *' + (p.id || '-') + '*\n';
  msg += '• Kantor Cabang: ' + kantorCabang + '\n';
  msg += '• Penugasan    : ' + namaPenugasan + '\n';
  msg += '• No. SPK Resmi: *' + noSpk + '*\n';
  msg += '• No. JO Resmi : *' + noJo + '*\n';
  msg += '• Tgl Disetujui: ' + tglSurat + '\n';
  msg += '• Status       : *DISETUJUI*\n';
  msg += '• Keterangan   : Dokumen resmi telah disahkan dan siap dicetak melalui Portal JO.\n';
  msg += '--------------------------------------\n';
  msg += 'Silakan buka Portal Penugasan & JO resmi untuk mencetak dan mengunduh berkas lengkap:\n';
  msg += portalUrl + '\n\n';
  msg += 'Salam hormat,\n_Sekretariat & Administrasi Penugasan KJPP NSR_';

  const cleanWa = normalisasiNomorWa(p.pengaju_wa || p.waPemohon);
  return {
    pesan: msg,
    phone: cleanWa,
    waUrl: cleanWa ? ('https://wa.me/' + cleanWa + '?text=' + encodeURIComponent(msg)) : ''
  };
}

assert(normalisasiNomorWa('0812-3456-7890') === '6281234567890', 'Nomor 0812... ternormalisasi ke 62812...');
assert(normalisasiNomorWa('6281298765432') === '6281298765432', 'Nomor 628... tetap 628...');
assert(normalisasiNomorWa('+62 851-1051-3157') === '6285110513157', 'Nomor +62 format terpisah ternormalisasi');

const sampleProyek = {
  id: 'NSR-2026-REQ-9901',
  nomor_lp: '0416/NSR/PN-APP/X/2026',
  nomor_adm: '0416/JO/NSR/X/2026',
  kantor_wilayah: 'Kantor Cabang Padang',
  pemberi_tugas_nama: 'PT. Bank Mandiri (Persero) Tbk',
  pengaju_nama: 'Ahmad Fauzi, S.T.',
  pengaju_wa: '0812-9876-5432',
  pengaju_email: 'ahmad.padang@kjppnanangrahayu.com'
};

const waResult = formatPesanWhatsAppJo(sampleProyek);
assert(waResult.pesan.includes('Ahmad Fauzi, S.T.'), 'Pesan memuat Nama Petugas Pengaju');
assert(waResult.pesan.includes('Kantor Cabang Padang'), 'Pesan memuat Kantor Cabang');
assert(waResult.pesan.includes('PT. Bank Mandiri (Persero) Tbk'), 'Pesan memuat Nama Penugasan');
assert(waResult.pesan.includes('0416/NSR/PN-APP/X/2026'), 'Pesan memuat Nomor SPK Resmi');
assert(waResult.pesan.includes('0416/JO/NSR/X/2026'), 'Pesan memuat Nomor JO Resmi');
assert(waResult.pesan.includes('DISETUJUI'), 'Pesan memuat status DISETUJUI');
assert(waResult.waUrl.startsWith('https://wa.me/6281298765432?text='), 'URL wa.me terbuat dengan nomor dan teks yang tepat');
assert(!waResult.pesan.includes('NSR8899') && !waResult.pesan.includes('token') && !waResult.pesan.includes('hash'), 'Keamanan: Tidak ada token atau hash dalam pesan');

// -------------------------------------------------------------
// 3. PENGUJIAN BACKEND API nolap-data-handler.php
// -------------------------------------------------------------
console.log('\n--- 3. PENGUJIAN BACKEND API (PHP BUILT-IN SERVER) ---');

// Buat sesi aktif terverifikasi langsung di active_sessions.json untuk pengujian terisolasi
const testSessionToken = 'nsr_sess_test_jo_notif_' + Date.now();
const activeSessPath = 'data/sessions/active_sessions.json';
const currentSessions = fs.existsSync(activeSessPath) ? JSON.parse(fs.readFileSync(activeSessPath, 'utf8')) : {};

currentSessions[testSessionToken] = {
  user: {
    sub: 'super_admin_king',
    branch: 'PUSAT',
    displayName: 'SUPER ADMIN (KING)',
    nama: 'Super Admin Operasional (KING)',
    role: 'SUPER_ADMIN',
    roleLabel: 'SUPER ADMIN • KING (Otoritas Sistem Tertinggi)',
    title: 'Super Admin (KING)',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: true,
    isKing: true,
    isCabang: false,
    canAccessKwitansi: true,
    canApprove: true,
    canSubmit: true,
    seeFee: true,
    mode: 'PUSAT'
  },
  createdAt: Math.floor(Date.now() / 1000),
  expiresAt: Date.now() + 28800000,
  ip: '127.0.0.1'
};
fs.writeFileSync(activeSessPath, JSON.stringify(currentSessions, null, 2), 'utf8');

const PORT = 8600 + Math.floor(Math.random() * 200);
const phpServer = spawn('php', ['-S', `127.0.0.1:${PORT}`, '-t', '.']);

for (let i = 0; i < 25; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/index.html`);
    if (res.status) break;
  } catch (e) {
    await new Promise(r => setTimeout(r, 150));
  }
}

try {
  // 3.1 Cek Akses Tanpa Sesi (Harus 401 Unauthorized)
  const unauthRes = await fetch(`http://127.0.0.1:${PORT}/nolap-data-handler.php?action=kirimNotifikasiApprovalJo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idPenugasan: 'TEST-01', nomorLp: '0416/NSR' })
  });
  assert(unauthRes.status === 401, 'Endpoint kirimNotifikasiApprovalJo menolak akses tanpa sesi login (HTTP 401)');

  // 3.2 Validasi Parameter Wajib (Missing fields -> HTTP 400)
  const invalidParamRes = await fetch(`http://127.0.0.1:${PORT}/nolap-data-handler.php?action=kirimNotifikasiApprovalJo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `NSR_SESSION_TOKEN=${testSessionToken}`,
      'X-NSR-Session-Token': testSessionToken
    },
    body: JSON.stringify({ action: 'kirimNotifikasiApprovalJo' })
  });
  assert(invalidParamRes.status === 400, 'Payload tanpa ID Penugasan dan No SPK ditolak dengan HTTP 400');

  // 3.3 Pengiriman Notifikasi Sah Berhasil
  const validPayload = {
    action: 'kirimNotifikasiApprovalJo',
    idPenugasan: 'NSR-2026-TEST-NOTIF-01',
    nomorLp: '0416/NSR/PN-APP/X/2026',
    nomorAdm: '0416/JO/NSR/X/2026',
    kantorCabang: 'Kantor Cabang Padang',
    namaPenugasan: 'Penilaian Pabrik Kelapa Sawit PT Sawit Nusantara',
    tanggalApproval: '2026-10-23',
    pengajuNama: 'Budi Hartono, S.T.',
    pengajuEmail: 'budi.hartono@kjppnanangrahayu.com',
    pengajuWa: '0813-8899-7766'
  };

  const dispatchRes = await fetch(`http://127.0.0.1:${PORT}/nolap-data-handler.php?action=kirimNotifikasiApprovalJo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `NSR_SESSION_TOKEN=${testSessionToken}`,
      'X-NSR-Session-Token': testSessionToken
    },
    body: JSON.stringify(validPayload)
  });
  const dispatchJson = await dispatchRes.json();
  assert(dispatchRes.status === 200 && dispatchJson.success === true, 'Eksekusi kirimNotifikasiApprovalJo sah berhasil (HTTP 200)');
  assert(dispatchJson.email_status === 'QUEUED', 'Email berhasil diantrekan (status: QUEUED)');
  assert(dispatchJson.whatsapp_url && dispatchJson.whatsapp_url.includes('https://wa.me/6281388997766'), 'URL WhatsApp terbuat dengan nomor ternormalisasi');
  assert(!!dispatchJson.event_id, `Audit Event ID terbit: ${dispatchJson.event_id}`);

  // 3.4 Cek Idempotensi & Anti-Duplikasi (Panggilan kedua untuk data yang sama dicegah)
  const secondDispatchRes = await fetch(`http://127.0.0.1:${PORT}/nolap-data-handler.php?action=kirimNotifikasiApprovalJo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `NSR_SESSION_TOKEN=${testSessionToken}`,
      'X-NSR-Session-Token': testSessionToken
    },
    body: JSON.stringify(validPayload)
  });
  const secondJson = await secondDispatchRes.json();
  assert(secondJson.duplicate_prevented === true, 'Anti-Duplikasi Idempoten aktif: Pengiriman ulang berulang diblokir');

  // 3.5 Verifikasi catatan masuk di notification_logs.json dan mail_queue.json
  const notifLogs = JSON.parse(fs.readFileSync('data/notification_logs.json', 'utf8'));
  const foundLog = notifLogs.find(l => l.id_penugasan === 'NSR-2026-TEST-NOTIF-01');
  assert(!!foundLog, 'Record notifikasi tercatat di data/notification_logs.json');
  assert(foundLog.event_type === 'PENERBITAN_LP', 'Event type tercatat PENERBITAN_LP');
  assert(foundLog.whatsapp_number === '6281388997766', 'Nomor WhatsApp pengaju tercatat ternormalisasi');

  const mailQueue = JSON.parse(fs.readFileSync('data/mail_queue.json', 'utf8'));
  const foundMail = mailQueue.find(m => m.recipient === 'budi.hartono@kjppnanangrahayu.com');
  assert(!!foundMail, 'Email pengaju tercatat di data/mail_queue.json');
  assert(foundMail.status === 'QUEUED', 'Status email dalam queue adalah QUEUED');
  assert(foundMail.body.includes('0416/NSR/PN-APP/X/2026'), 'Body email memuat Nomor SPK Resmi');
  assert(foundMail.body.includes('0416/JO/NSR/X/2026'), 'Body email memuat Nomor JO Resmi');

} finally {
  phpServer.kill();
  // Bersihkan test session
  if (fs.existsSync(activeSessPath)) {
    const after = JSON.parse(fs.readFileSync(activeSessPath, 'utf8'));
    delete after[testSessionToken];
    fs.writeFileSync(activeSessPath, JSON.stringify(after, null, 2), 'utf8');
  }
}

console.log('\n===============================================================');
console.log(`📊 REKAP HASIL TEST: ${pass} PASS / ${fail} FAIL`);
console.log('===============================================================');

if (fail > 0) {
  process.exit(1);
}
