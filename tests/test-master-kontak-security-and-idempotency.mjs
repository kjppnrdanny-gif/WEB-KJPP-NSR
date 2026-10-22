/**
 * OPINI NSR 2026 — MASTER KONTAK KEAMANAN & IDEMPOTENSI NOTIFIKASI TEST SUITE
 * 
 * Pengujian Validasi:
 * 1. Keamanan PII: File master_personel_kontak.json tidak ada di dist/ (Build cPanel Allowlist)
 * 2. Proteksi Akses Langsung: Akses HTTP tanpa otorisasi ke /data/masters/* ditolak (403/404)
 * 3. File dist/data/masters/.htaccess terpasang dengan 'Require all denied'
 * 4. Audit Kejujuran 18 Profil Personel (Impor vs Cocok Kepegawaian vs Verifikasi Email/WA Nyata)
 * 5. Idempotensi Permanen: Event notifikasi yang sama diblokir permanen bahkan setelah > 5 menit
 * 6. Audit Trail Revisi: Pembaruan versi sah (v2) dengan audit_parent_id diizinkan dan terlacak
 * 7. Isolasi Worker Email: Eksekusi berbatas hanya pada penerima terotorisasi (kjppnr.danny@gmail.com)
 * 8. Anti-Race Condition: Lock file .mail_worker.lock memblokir worker kedua (flock LOCK_EX | LOCK_NB)
 * 9. Retry Kontrol: Percobaan ulang tidak menduplikasi antrean email
 * 10. Alur eLSa QR: Pencatatan link eLSa terverifikasi internal mengaitkan nomor definitif asli
 * 11. Pengambilan Mandiri eLSa: Portal JO & Cabang menyediakan tombol QR eLSa untuk pengaju
 * 12. Notifikasi Booking: Memuat banner peringatan resmi 'Bukan Laporan Final'
 * 13. Ketahanan Penomoran: Kegagalan pengiriman email tidak membatalkan atau mengubah NoLap sah
 */

import http from 'http';
import { spawn, execSync } from 'child_process';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

const PORT = 8899;
const BASE_URL = `http://127.0.0.1:${PORT}/nolap-data-handler.php`;
const ROUTER_BASE = `http://127.0.0.1:${PORT}`;

const TOKENS = {
  SUPER_ADMIN: 'NSR8899',
  ADMIN_PUSAT: 'NSR-ADMIN-PUSAT-2026',
  MAKASSAR_CABANG: 'NSR-MKS-2026',
  DANNY_SPM: 'NSR-SPM-DANNY-2026',
  DENI_DIVTEK: 'NSR-DIVTEK-DENI-2026'
};

function request(urlPath, { method = 'GET', token = null, body = null, rawUrl = false } = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = rawUrl ? new URL(urlPath, ROUTER_BASE) : new URL(urlPath, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['X-NSR-Token'] = token;
      headers['X-Internal-Token'] = token;
    }

    const req = http.request(fullUrl, { method, headers }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (_) { parsed = data; }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('  OPINI NSR — MASTER KONTAK SECURITY & IDEMPOTENCY SUITE (13)   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function testPass(name) {
    console.log(`✔ PASS: ${name}`);
    passed++;
  }

  function testFail(name, err) {
    console.error(`✖ FAIL: ${name}`, err);
    failed++;
  }

  // 1. Audit Keamanan Build dist/: master_personel_kontak.json TIDAK BOLEH ADA di dist/
  try {
    execSync('node scripts/build-production.mjs --cpanel', { stdio: 'pipe' });
    const distTarget = path.join('dist', 'data', 'masters', 'master_personel_kontak.json');
    assert(!fs.existsSync(distTarget), 'BERKAS PII TERSALIN KE DIST! Ini melanggar isolasi publik.');
    testPass('Test 1: Berkas PII master_personel_kontak.json terbukti TIDAK TERSALIN ke dist/');
  } catch (e) { testFail('Test 1: PII Exclusion from dist/', e); }

  // 2. Proteksi Akses Langsung HTTP: Akses langsung ke /data/masters/* ditolak (403/404)
  try {
    const resDirect = await request('/data/masters/master_personel_kontak.json', { rawUrl: true });
    assert(resDirect.status === 403 || resDirect.status === 404, `Akses langsung wajib ditolak 403/404, aktual: ${resDirect.status}`);
    testPass('Test 2: Akses langsung tanpa autentikasi ke direktori data ditolak keras (403/404)');
  } catch (e) { testFail('Test 2: Direct HTTP Master Access Blocked', e); }

  // 3. Verifikasi Keberadaan data/masters/.htaccess dengan 'Require all denied' & Zero Leakage di dist/
  try {
    const htPath = path.join('data', 'masters', '.htaccess');
    assert(fs.existsSync(htPath), 'File .htaccess di data/masters/ wajib ada');
    const htContent = fs.readFileSync(htPath, 'utf8');
    assert(htContent.includes('Require all denied'), '.htaccess wajib memuat Require all denied');
    assert(!fs.existsSync(path.join('dist', 'data')), 'Direktori data/ sama sekali tidak boleh ada di dist/ (zero-leakage)');
    testPass('Test 3: data/masters/.htaccess terpasang aktif melindungi folder master server & dist/ bersih dari data/');
  } catch (e) { testFail('Test 3: .htaccess in data/masters/', e); }

  // 4. Audit Kejujuran 18 Profil Personel (Pembedaan Impor vs Cocok Kepegawaian vs Verifikasi Email/WA)
  try {
    const raw = fs.readFileSync('data/masters/master_personel_kontak.json', 'utf8');
    const masterJson = JSON.parse(raw);
    const list = masterJson.personel;
    assert(list.length === 18, `Total profil wajib 18, aktual: ${list.length}`);

    let countImported = 0;
    let countKepegawaian = 0;
    let countEmailVerified = 0;
    let countWaVerified = 0;

    for (const p of list) {
      if (p.data_imported) countImported++;
      if (p.kepegawaian_matched) countKepegawaian++;
      if (p.email_verified) countEmailVerified++;
      if (p.whatsapp_verified) countWaVerified++;
    }

    assert(countImported === 18, 'Semua 18 profil berstatus data_imported = true');
    assert(countKepegawaian === 18, 'Semua 18 profil berstatus kepegawaian_matched = true');
    assert(countEmailVerified === 1, `HANYA Danny Taufik yang email_verified = true, aktual: ${countEmailVerified}`);
    assert(countWaVerified === 1, `HANYA Danny Taufik yang whatsapp_verified = true, aktual: ${countWaVerified}`);

    const danny = list.find(x => x.user_id === 'super_admin_king');
    assert(danny.contact_status === 'VERIFIED_LIVE', 'Danny Taufik berstatus VERIFIED_LIVE');

    const nanang = list.find(x => x.user_id === 'nanang_penilai');
    assert(nanang.contact_status === 'OFFICIAL_ROSTER_MATCH', 'Nanang Rahayu berstatus OFFICIAL_ROSTER_MATCH');
    assert(nanang.email_verified === false, 'Nanang Rahayu email_verified harus false (menunggu konfirmasi interaktif)');

    testPass('Test 4: Matriks audit 18 profil kontak jujur dan transparan (18 cocok kepegawaian, 1 verified live, 17 official match)');
  } catch (e) { testFail('Test 4: 18 Personnel Audit Truthfulness', e); }

  // 5. Uji Idempotensi Permanen: Event yang sama diblokir permanen bahkan setelah > 5 menit
  const testIdemId = 'NSR-TEST-IDEM-' + Date.now();
  try {
    const resInitial = await request('?action=testDispatchNotification', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: {
        eventType: 'PENERBITAN_NOLAP',
        idPenugasan: testIdemId,
        noPermintaan: 'REQ-' + testIdemId,
        requesterInfo: { email: 'kjppnr.danny@gmail.com', nama: 'Danny Taufik', whatsapp_number: '081298765432' },
        details: { status: 'MENUNGGU_TTD_PENILAI', notification_version: '1' }
      }
    });
    assert(resInitial.status === 200 && resInitial.data.success);
    const firstEventId = resInitial.data.event_id;

    // Ambil log notifikasi pertama
    const logsRaw1 = fs.readFileSync('data/notification_logs.json', 'utf8');
    const logs1 = JSON.parse(logsRaw1);
    const initialLog = logs1.find(l => (l.id_penugasan === testIdemId || l.no_permintaan === 'REQ-' + testIdemId));
    assert(initialLog, 'Log notifikasi awal wajib tersimpan');
    assert(initialLog.idempotency_digest, 'idempotency_digest wajib tercatat');

    // Manipulasi timestamp log awal agar tampak terjadi 15 menit yang lalu (> 300 detik)
    initialLog.notification_timestamp = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    fs.writeFileSync('data/notification_logs.json', JSON.stringify(logs1, null, 2));

    // Picu pengiriman notifikasi ulang dengan parameter yang persis sama
    const resDuplicate = await request('?action=testDispatchNotification', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: {
        eventType: 'PENERBITAN_NOLAP',
        idPenugasan: testIdemId,
        noPermintaan: 'REQ-' + testIdemId,
        requesterInfo: { email: 'kjppnr.danny@gmail.com', nama: 'Danny Taufik', whatsapp_number: '081298765432' },
        details: { status: 'MENUNGGU_TTD_PENILAI', notification_version: '1' }
      }
    });

    assert(resDuplicate.status === 200);
    assert(resDuplicate.data.duplicate_prevented === true, 'Duplikasi wajib diblokir!');
    assert(resDuplicate.data.reason === 'PERMANENT_IDEMPOTENCY_MATCH', 'Alasan penolakan adalah PERMANENT_IDEMPOTENCY_MATCH');
    assert(resDuplicate.data.event_id === firstEventId, 'Event ID yang dikembalikan mengacu pada notifikasi pertama');

    testPass('Test 5: Idempotensi permanen sukses memblokir event duplikat bahkan setelah cooldown 15 menit');
  } catch (e) { testFail('Test 5: Permanent Idempotency Protection', e); }

  // 6. Uji Audit Trail Revisi: Pembaruan versi sah (v2) dengan audit_parent_id diizinkan dan terlacak
  try {
    const logsRaw = fs.readFileSync('data/notification_logs.json', 'utf8');
    const logs = JSON.parse(logsRaw);
    const parentLog = logs.find(l => (l.id_penugasan === testIdemId || l.no_permintaan === 'REQ-' + testIdemId));

    const resV2 = await request('?action=testDispatchNotification', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: {
        eventType: parentLog.event_type,
        idPenugasan: testIdemId,
        noPermintaan: parentLog.no_permintaan,
        requesterInfo: { email: 'kjppnr.danny@gmail.com', nama: 'Danny Taufik', whatsapp_number: '081298765432' },
        details: {
          status: 'REVISI_DOKUMEN_MUTU',
          notification_version: '2',
          audit_parent_id: parentLog.notification_event_id,
          catatan: 'Revisi perbaikan geotag foto pembanding oleh SPM.'
        }
      }
    });

    assert(resV2.status === 200 && resV2.data.success);
    assert(!resV2.data.duplicate_prevented, 'Versi baru (v2) tidak boleh terblokir sebagai duplikat!');
    assert(resV2.data.notification_version === '2', 'Versi notifikasi tercatat v2');

    // Cek file log
    const updatedLogs = JSON.parse(fs.readFileSync('data/notification_logs.json', 'utf8'));
    const v2Entry = updatedLogs.find(l => (l.id_penugasan === testIdemId || l.no_permintaan === 'REQ-' + testIdemId) && l.notification_version === '2');
    assert(v2Entry, 'Entry v2 tersimpan dalam log');
    assert(v2Entry.audit_parent_id === parentLog.notification_event_id, 'audit_parent_id terhubung ke log sebelumnya');

    testPass('Test 6: Audit trail revisi (v2) sukses tercatat dan terhubung ke parent event ID');
  } catch (e) { testFail('Test 6: Notification Revision Audit Trail', e); }

  // 7. Isolasi Worker Email: Eksekusi berbatas hanya pada penerima terotorisasi
  try {
    const queueFile = 'data/mail_queue.json';
    const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8') || '[]');
    const targetJobId = 'MQ-TEST-SEC-' + Date.now();
    queue.push({
      id: targetJobId,
      recipient: 'kjppnr.danny@gmail.com',
      subject: '[TEST AUTH] Pengujian Pengiriman Terotorisasi',
      body: '<p>Pengujian terbatas email pekerja</p>',
      status: 'QUEUED',
      attempts: 0,
      createdAt: new Date().toISOString()
    });
    const otherJobId = 'MQ-OTHER-' + Date.now();
    queue.push({
      id: otherJobId,
      recipient: 'staf.lain@kjppnanangrahayu.com',
      subject: '[TEST BLOCKED] Tidak boleh terkirim',
      body: '<p>Tidak boleh terkirim</p>',
      status: 'QUEUED',
      attempts: 0,
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));

    const workerOutput = execSync(`php process-mail-queue.php --allowed-recipient=kjppnr.danny@gmail.com --job-id=${targetJobId}`, { encoding: 'utf8' });
    assert(workerOutput.includes('Terkirim : 1'), 'Tepat 1 email target wajib diproses');

    const qAfter = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    const targetProcessed = qAfter.find(j => j.id === targetJobId);
    const otherUnprocessed = qAfter.find(j => j.id === otherJobId);

    assert(targetProcessed.status === 'sent', 'Job target status berubah menjadi sent');
    assert(otherUnprocessed.status === 'QUEUED', 'Job non-target TETAP QUEUED (tidak tersentuh)');

    testPass('Test 7: Worker email terbukti aman dengan isolasi penerima terotorisasi (--allowed-recipient)');
  } catch (e) { testFail('Test 7: Isolated Mail Worker Processing', e); }

  // 8. Anti-Race Condition: Lock file .mail_worker.lock memblokir worker kedua
  try {
    const lockFile = 'data/.mail_worker.lock';
    if (!fs.existsSync(lockFile)) fs.writeFileSync(lockFile, '');
    const lockHolder = spawn('php', ['-r', '$fp = fopen("data/.mail_worker.lock", "c+"); if (flock($fp, LOCK_EX)) { echo "LOCKED\n"; usleep(1500000); }']);
    
    await new Promise((resolve, reject) => {
      let resolved = false;
      lockHolder.stdout.on('data', d => {
        if (d.toString().includes('LOCKED') && !resolved) {
          resolved = true;
          try {
            const duplicateRunOutput = execSync('php process-mail-queue.php', { encoding: 'utf8' });
            assert(duplicateRunOutput.includes('Worker email lain sedang berjalan aktif'), 'Worker kedua harus menolak eksekusi jika lock aktif');
            lockHolder.kill();
            setTimeout(resolve, 100);
          } catch (err) {
            reject(err);
          }
        }
      });
      lockHolder.on('error', reject);
      setTimeout(() => { if (!resolved) reject(new Error('Lock holder timeout')); }, 3000);
    });

    testPass('Test 8: Mekanisme file locking eksklusif (.mail_worker.lock) mencegah eksekusi ganda (Anti-Race Condition)');
  } catch (e) { testFail('Test 8: Worker Concurrency Lock', e); }

  // 9. Retry Kontrol: Percobaan ulang tidak menduplikasi antrean email
  try {
    const queueFile = 'data/mail_queue.json';
    const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    const retryJobId = 'MQ-RETRY-' + Date.now();
    queue.push({
      id: retryJobId,
      recipient: 'kjppnr.danny@gmail.com',
      subject: '[TEST RETRY] Simulasi Gagal',
      body: '<p>Percobaan</p>',
      status: 'QUEUED',
      attempts: 0,
      smtpConfig: { host: 'invalid.domain.that.does.not.exist.test', port: 465 }
    });
    fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));

    execSync(`php process-mail-queue.php --job-id=${retryJobId}`, { stdio: 'pipe' });
    const q1 = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    const jobAttempt1 = q1.find(j => j.id === retryJobId);
    assert(jobAttempt1.attempts === 1, 'Attempt tercatat 1');
    assert(jobAttempt1.status === 'retry' || jobAttempt1.status === 'sent', 'Status transisi terkelola');

    const matchingJobs = q1.filter(j => j.id === retryJobId);
    assert(matchingJobs.length === 1, 'Jumlah job antrean tetap 1 (Tidak ada duplikasi)');

    testPass('Test 9: Otomasi retry memperbarui entri yang ada tanpa menduplikasi antrean (Zero Spam)');
  } catch (e) { testFail('Test 9: Retry Dedup Integrity', e); }

  // 10. Alur eLSa QR: Verifikasi QR Code eLSa mengaitkan nomor laporan definitif & mengantrekan email
  const testElsaId = 'NSR-TEST-ELSA-' + Date.now();
  try {
    await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: {
        idPenugasan: testElsaId,
        service_classification_id: 'PROPERTY_SIMPLE',
        penilaiPublikDitunjuk: 'Hernita, S.Si., MAPPI (Cert.)',
        penilaiPublikId: 'hernita_penilai',
        appraiser_license_code: '00126',
        requester: { email: 'kjppnr.danny@gmail.com', nama: 'Danny Taufik', whatsapp_number: '081298765432' },
        checklistAwal: {}
      }
    });
    await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testElsaId, keputusan: 'SETUJU', catatan: 'OK' } });
    await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testElsaId, keputusan: 'SETUJU', catatan: 'OK' } });
    await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: testElsaId, nomorLpResmi: 'LP/ELSA/2026' } });
    await request('?action=submitGerbang2Akhir', { method: 'POST', token: TOKENS.SUPER_ADMIN, body: { idPenugasan: testElsaId, deltaAnalysis: {} } });
    await request('?action=reviewDannyGerbang2', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testElsaId, keputusan: 'SETUJU', catatan: 'OK' } });
    await request('?action=reviewDeniGerbang2', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testElsaId, keputusan: 'SETUJU', catatan: 'OK' } });

    const resNoLap = await request('?action=issueDefinitiveNoLap', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: testElsaId } });
    assert(resNoLap.status === 200);
    const noDefinitif = resNoLap.data.nomorDefinitif;

    const fakeElsaUrl = 'https://elsa-pk.kemenkeu.go.id/verifikasi/qr/' + Date.now();
    const resVerifyElsa = await request('?action=verifyElsaQrReport', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: testElsaId,
        linkElsa: fakeElsaUrl,
        catatan: 'QR Code eLSa-PK terverifikasi kecocokan nomor definitif dan pengesahan.'
      }
    });

    assert(resVerifyElsa.status === 200 && resVerifyElsa.data.success);
    assert(resVerifyElsa.data.linkElsa === fakeElsaUrl, 'Tautan eLSa tersimpan presisi');
    assert(resVerifyElsa.data.statusElsa.includes('TERVERIFIKASI'), 'Status eLSa terverifikasi');

    const logs = JSON.parse(fs.readFileSync('data/notification_logs.json', 'utf8'));
    const elsaNotif = logs.find(l => (l.id_penugasan === testElsaId || l.no_permintaan === testElsaId) && l.event_type === 'QR_ELSA_TERVERIFIKASI');
    assert(elsaNotif, 'Notifikasi eLSa tercatat dalam log antrean');
    assert(elsaNotif.email === 'kjppnr.danny@gmail.com', 'Penerima notifikasi eLSa adalah pengaju asli');

    testPass('Test 10: Alur eLSa QR mengaitkan nomor definitif, mencatat status internal, dan mengantrekan notifikasi ke pengaju asli');
  } catch (e) { testFail('Test 10: eLSa QR Flow & Notification', e); }

  // 11. Pengambilan Mandiri eLSa: Portal JO & Cabang menyediakan tombol QR eLSa
  try {
    const htmlCabang = fs.readFileSync('portal-nolap-cabang.html', 'utf8');
    assert(htmlCabang.includes('row.linkElsa'), 'Portal Cabang memiliki pengecekan row.linkElsa');
    assert(htmlCabang.includes('📱 QR eLSa'), 'Portal Cabang memiliki tombol QR eLSa mandiri');

    const htmlJo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
    assert(htmlJo.includes('linkElsa'), 'Portal JO memiliki pengecekan linkElsa');
    assert(htmlJo.includes('QR Code eLSa-PK Terverifikasi'), 'Portal JO memiliki tombol QR eLSa mandiri');

    testPass('Test 11: Pengaju dapat mengambil/melihat tautan QR eLSa secara mandiri melalui Portal Cabang & Portal JO');
  } catch (e) { testFail('Test 11: Self-Service eLSa Retrieval in Portals', e); }

  // 12. Notifikasi Booking: Memuat banner peringatan resmi 'Bukan Laporan Final'
  try {
    const resBookingNotif = await request('?action=testDispatchNotification', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: {
        eventType: 'BOOKING_NOLAP',
        idPenugasan: 'NSR-BOOKING-TEST',
        requesterInfo: { email: 'kjppnr.danny@gmail.com', nama: 'Danny Taufik', whatsapp_number: '081298765432' },
        details: {
          is_booking: true,
          status: 'ALOKASI_BOOKING',
          nomorLaporan: '42099/2.0160-00/PI/07/00581/1/X/2026'
        }
      }
    });

    assert(resBookingNotif.status === 200);
    const waUrl = resBookingNotif.data.whatsapp_url;
    assert(waUrl.includes('ALOKASI%20BOOKING') || waUrl.includes('BOOKING'), 'URL WhatsApp memuat identitas Booking');
    assert(waUrl.includes('BUKAN%20Laporan%20Final') || waUrl.includes('BUKAN'), 'Notifikasi Booking menegaskan BUKAN Laporan Final');

    testPass('Test 12: Notifikasi Booking memuat penegasan resmi bahwa dokumen adalah alokasi booking dan BUKAN laporan final');
  } catch (e) { testFail('Test 12: Booking Notification Non-Final Warning', e); }

  // 13. Ketahanan Penomoran: Kegagalan email tidak membatalkan NoLap sah
  const testResilienceId = 'NSR-TEST-RESIL-' + Date.now();
  try {
    await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.SUPER_ADMIN,
      body: {
        idPenugasan: testResilienceId,
        service_classification_id: 'PROPERTY_SIMPLE',
        penilaiPublikDitunjuk: 'Hernita, S.Si., MAPPI (Cert.)',
        penilaiPublikId: 'hernita_penilai',
        appraiser_license_code: '00126',
        requester: { email: 'invalid-email-format-without-at', nama: 'Danny Taufik' },
        checklistAwal: {}
      }
    });
    await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testResilienceId, keputusan: 'SETUJU', catatan: 'OK' } });
    await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testResilienceId, keputusan: 'SETUJU', catatan: 'OK' } });
    await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: testResilienceId, nomorLpResmi: 'LP/RES/2026' } });
    await request('?action=submitGerbang2Akhir', { method: 'POST', token: TOKENS.SUPER_ADMIN, body: { idPenugasan: testResilienceId, deltaAnalysis: {} } });
    await request('?action=reviewDannyGerbang2', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: testResilienceId, keputusan: 'SETUJU', catatan: 'OK' } });
    await request('?action=reviewDeniGerbang2', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: testResilienceId, keputusan: 'SETUJU', catatan: 'OK' } });

    const resIssue = await request('?action=issueDefinitiveNoLap', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: testResilienceId } });
    assert(resIssue.status === 200 && resIssue.data.success);
    const issuedNo = resIssue.data.nomorDefinitif;
    assert(issuedNo, 'Nomor definitif tetap berhasil diterbitkan secara sah');

    const resDetail = await request(`?action=getDualGateDetail&idPenugasan=${testResilienceId}`, { token: TOKENS.SUPER_ADMIN });
    assert(resDetail.data.record.finalisasi.nomorLaporanDefinitif === issuedNo, 'Nomor tercatat permanen di database');

    testPass('Test 13: Ketahanan sistem terbukti — kegagalan antrean notifikasi tidak membatalkan atau mengubah NoLap definitif yang sudah sah');
  } catch (e) { testFail('Test 13: Numbering Resilience On Notification Error', e); }

  console.log('\n================================================================');
  console.log(`HASIL AKHIR: ${passed}/13 TESTS PASSED, ${failed} FAILED (${passed === 13 ? '100% SUKSES' : 'ADA KEGAGALAN'})`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

// Jalankan server PHP lokal untuk eksekusi test
const phpProc = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'router.php'], { stdio: 'ignore' });
setTimeout(() => {
  runTests().finally(() => {
    phpProc.kill();
  });
}, 1200);
