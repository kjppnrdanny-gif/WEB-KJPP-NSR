import fs from 'node:fs';

const LIVE_BASE = 'https://kjppnanangrahayu.com';

async function runLiveVerification() {
  console.log('===============================================================');
  console.log('🚀 MEMULAI SMOKE TEST LIVE SERVER CPANEL: ' + LIVE_BASE);
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function record(pass, msg) {
    if (pass) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // --- ITEM 1: KEAMANAN SESI SERVER & REVOKASI LOGOUT ---
  console.log('\n--- 1. AUDIT KEAMANAN SESI & LOGOUT SERVER-SIDE ---');
  let sessionToken = null;
  try {
    const loginRes = await fetch(`${LIVE_BASE}/auth-handler.php?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'NSR8899' })
    });
    const loginJson = await loginRes.json();
    record(loginRes.status === 200 && loginJson.authenticated === true, 'Login SUPER ADMIN KING (NSR8899) sukses');
    record(!!loginJson.sessionToken && loginJson.sessionToken.startsWith('nsr_sess_'), 'Server mengembalikan sessionToken aman');
    sessionToken = loginJson.sessionToken;

    // Akses endpoint dengan sessionToken
    const accessRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=listMasterSektorIndustri`, {
      headers: { 'X-NSR-Session-Token': sessionToken }
    });
    record(accessRes.status === 200, 'Akses endpoint terproteksi dengan sessionToken berhasil (200 OK)');

    // Logout untuk mencabut sesi di server
    const logoutRes = await fetch(`${LIVE_BASE}/auth-handler.php?action=logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': sessionToken },
      body: JSON.stringify({ sessionToken: sessionToken })
    });
    const logoutJson = await logoutRes.json();
    record(logoutRes.status === 200 && logoutJson.authenticated === false, 'Logout berhasil diproses server');

    // Coba akses kembali setelah sesi dicabut -> WAJIB 401
    const revokedRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=listMasterSektorIndustri`, {
      headers: { 'X-NSR-Session-Token': sessionToken }
    });
    record(revokedRes.status === 401, 'Percobaan akses kembali setelah logout DITOLAK (401 Unauthorized)');
  } catch (e) {
    record(false, 'Uji Item 1 Exception: ' + e.message);
  }

  // Login ulang untuk mendapatkan sesi aktif baru untuk pengujian fungsional berikutnya
  let activeSession = null;
  try {
    const relogin = await fetch(`${LIVE_BASE}/auth-handler.php?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'NSR8899' })
    });
    const reloginJson = await relogin.json();
    activeSession = reloginJson.sessionToken;
  } catch (e) {
    console.error('Re-login failed:', e.message);
  }

  // --- ITEM 2: KODE INDUSTRI 01-12 WAJIB (TANPA FALLBACK 07) ---
  console.log('\n--- 2. AUDIT KODE INDUSTRI (WAJIB MASTER 01-12, ANTI-FALLBACK 07) ---');
  try {
    // A. Submission dengan kodeIndustri kosong -> DITOLAK 422
    const emptyIndRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=submitRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': activeSession },
      body: JSON.stringify({
        namaPemohon: 'Deni Siswandi',
        nikPemohon: 'NSR-00581',
        jabatan: 'Partner Penilai',
        emailPemohon: 'deni@kjppnanangrahayu.com',
        waPemohon: '081234567890',
        namaKlien: 'PT Live Audit Sektor Kosong',
        alamatKlien: 'Jakarta',
        npwp: '01.234.567.8-012.000',
        jenisObjek: 'Gedung Kantor',
        lokasiObjek: 'Jakarta',
        kodeIndustri: '', // KOSONG!
        service_classification_id: 'PROPERTY',
        cabang: 'Pusat'
      })
    });
    const emptyIndJson = await emptyIndRes.json();
    record(emptyIndRes.status === 422 && emptyIndJson.violation === 'INVALID_OR_MISSING_INDUSTRY_CODE', 'Pengajuan dengan kodeIndustri kosong DITOLAK (422 INVALID_OR_MISSING_INDUSTRY_CODE)');

    // B. Submission dengan kodeIndustri tidak valid (99) -> DITOLAK 422
    const invalidIndRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=submitRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': activeSession },
      body: JSON.stringify({
        namaPemohon: 'Deni Siswandi',
        nikPemohon: 'NSR-00581',
        jabatan: 'Partner Penilai',
        emailPemohon: 'deni@kjppnanangrahayu.com',
        waPemohon: '081234567890',
        namaKlien: 'PT Live Audit Sektor 99',
        alamatKlien: 'Jakarta',
        npwp: '01.234.567.8-012.000',
        jenisObjek: 'Gedung Kantor',
        lokasiObjek: 'Jakarta',
        kodeIndustri: '99', // INVALID!
        service_classification_id: 'PROPERTY',
        cabang: 'Pusat'
      })
    });
    const invalidIndJson = await invalidIndRes.json();
    record(invalidIndRes.status === 422 && invalidIndJson.violation === 'INVALID_OR_MISSING_INDUSTRY_CODE', 'Pengajuan dengan kodeIndustri 99 DITOLAK (422 INVALID_OR_MISSING_INDUSTRY_CODE)');

    // C. Submission dengan kodeIndustri sah 03 -> DITERIMA 200 & nilai tetap 03
    const validIndRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=submitRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': activeSession },
      body: JSON.stringify({
        namaPemohon: 'Deni Siswandi',
        nikPemohon: 'NSR-00581',
        jabatan: 'Partner Penilai',
        emailPemohon: 'deni@kjppnanangrahayu.com',
        waPemohon: '081234567890',
        namaKlien: 'PT Live Sektor 03 Sah',
        alamatKlien: 'Jakarta',
        npwp: '01.234.567.8-012.000',
        jenisObjek: 'Gedung Pabrik',
        lokasiObjek: 'Cikarang',
        kodeIndustri: '03',
        service_classification_id: 'PROPERTY',
        cabang: 'Pusat'
      })
    });
    const validIndJson = await validIndRes.json();
    record(validIndRes.status === 200 && validIndJson.record?.kodeIndustri === '03', 'Pengajuan dengan kodeIndustri sah 03 DITERIMA (200 OK) dan tersimpan presisi 03 (tanpa fallback 07)');
  } catch (e) {
    record(false, 'Uji Item 2 Exception: ' + e.message);
  }

  // --- ITEM 3: KODE NPWP SEGMEN 6 (1 ATAU 0 DINAMIS, DILARANG 'B' ATAU HARDCODED 1) ---
  console.log('\n--- 3. AUDIT KODE NPWP SEGMEN 6 NOLAP (DINAMIS 1/0 & TOLAK HURUF B) ---');
  try {
    // A. Pengajuan klien Non-NPWP
    const nonNpwpRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=submitRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': activeSession },
      body: JSON.stringify({
        namaPemohon: 'Deni Siswandi',
        nikPemohon: 'NSR-00581',
        jabatan: 'Partner Penilai',
        emailPemohon: 'deni@kjppnanangrahayu.com',
        waPemohon: '081234567890',
        namaKlien: 'Bpk Non NPWP Perorangan Live',
        alamatKlien: 'Bandung',
        npwp: '-',
        jenisObjek: 'Rumah Tinggal',
        lokasiObjek: 'Bandung',
        kodeIndustri: '12',
        service_classification_id: 'PROPERTY',
        cabang: 'Pusat'
      })
    });
    const nonNpwpJson = await nonNpwpRes.json();
    record(nonNpwpRes.status === 200 && nonNpwpJson.record?.kodeNpwp === '0', 'Klien Non-NPWP secara otomatis menghasilkan kodeNpwp = "0"');

    // B. Penetapan nomor yang memasukkan huruf 'B' di segmen 6 -> DITOLAK 422
    const rejectBRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=approveRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': activeSession },
      body: JSON.stringify({
        noPermintaan: 'REQ-LIVE-B-TEST',
        nomorLaporan: '99991/2.0160-00/PI/07/00581/B/X/2026' // Segmen 6 = B!
      })
    });
    const rejectBJson = await rejectBRes.json();
    record(rejectBRes.status === 422 && rejectBJson.violation === 'INVALID_SEGMENT_6_NPWP_CODE', 'Penetapan NoLap dengan segmen 6 huruf "B" DITOLAK (422 INVALID_SEGMENT_6_NPWP_CODE)');

    // C. Penetapan nomor dengan segmen 4 industri salah (99) -> DITOLAK 422
    const rejectIndRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=approveRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': activeSession },
      body: JSON.stringify({
        noPermintaan: 'REQ-LIVE-IND-TEST',
        nomorLaporan: '99992/2.0160-00/PI/99/00581/1/X/2026' // Segmen 4 = 99!
      })
    });
    const rejectIndJson = await rejectIndRes.json();
    record(rejectIndRes.status === 422 && rejectIndJson.violation === 'INVALID_SEGMENT_4_INDUSTRY_CODE', 'Penetapan NoLap dengan segmen 4 industri 99 DITOLAK (422 INVALID_SEGMENT_4_INDUSTRY_CODE)');
  } catch (e) {
    record(false, 'Uji Item 3 Exception: ' + e.message);
  }

  // --- ITEM 4: AUDIT REVISI PERIODE BOOKING & BUKTI RESTORE BACKUP ---
  console.log('\n--- 4. AUDIT KONTROL PERIODE BOOKING & PEMULIHAN BACKUP ---');
  try {
    // A. Pengajuan Booking
    const bookingRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=submitRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': activeSession },
      body: JSON.stringify({
        isBooking: true,
        modePengajuan: 'BOOKING',
        targetFinalisasi: '2026-11-30',
        namaPemohon: 'Deni Siswandi',
        nikPemohon: 'NSR-00581',
        jabatan: 'Partner Penilai',
        emailPemohon: 'deni@kjppnanangrahayu.com',
        waPemohon: '081234567890',
        namaKlien: 'PT BUMN Pengadaan Tanah Booking Live',
        alamatKlien: 'Jakarta',
        npwp: '01.999.888.7-001.000',
        jenisObjek: 'Jalan Tol Seksi 1',
        lokasiObjek: 'Jawa Barat',
        kodeIndustri: '03',
        service_classification_id: 'PROPERTY',
        cabang: 'Pusat',
        checklistQa: true,
        otorisasiPartner: true
      })
    });
    const bookingJson = await bookingRes.json();
    const reqBookingId = bookingJson.record?.noPermintaan;
    record(bookingRes.status === 200 && !!reqBookingId, `Permohonan Booking live berhasil diajukan (${reqBookingId})`);

    // Alokasikan nomor booking awal via approveRequest dengan periode September (IX)
    const alokasiNo = `00${Math.floor(Math.random() * 800) + 100}/2.0160-00/PI/03/00581/1/IX/2026`;
    const approveBookRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=approveRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': activeSession },
      body: JSON.stringify({
        noPermintaan: reqBookingId,
        nomorLaporan: alokasiNo,
        isBooking: true,
        bypassQA: true,
        bypassPartner: true
      })
    });
    const approveBookJson = await approveBookRes.json();
    record(approveBookRes.status === 200 && approveBookJson.success === true, `Alokasi nomor booking awal berhasil (${alokasiNo})`);

    // B. Revisi periode booking tanpa alasan justifikasi -> DITOLAK 422
    const emptyReasonRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=finalizeBookingReport`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': activeSession },
      body: JSON.stringify({
        noPermintaan: reqBookingId,
        tglLaporan: '2026-10-23',
        revisiPeriodeBulanResmi: true,
        alasanKoreksi: '' // KOSONG!
      })
    });
    record(emptyReasonRes.status === 422, 'Revisi periode booking tanpa alasan justifikasi DITOLAK (422)');

    // C. Revisi periode booking dengan alasan resmi yang sah -> BERHASIL 200 OK
    const validRevRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=finalizeBookingReport`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': activeSession },
      body: JSON.stringify({
        noPermintaan: reqBookingId,
        tglLaporan: '2026-10-23',
        revisiPeriodeBulanResmi: true,
        alasanKoreksi: 'Penyesuaian resmi segmen bulan pelaporan SE-6/PPPK/2018'
      })
    });
    const validRevJson = await validRevRes.json();
    record(validRevRes.status === 200 && validRevJson.success === true, 'Revisi periode booking sah berhasil diproses (200 OK)');
    record(validRevJson.record?.nomorLaporan?.includes('/X/2026') && validRevJson.record?.nomorAlokasiAwal?.includes('/IX/2026'), 'Nomor terbit terbarui ke bulan Oktober (X/2026) dan nomor awal diaudit (/IX/2026)');

    // D. Buktikan restore backup dari endpoint resmi
    const restoreRes = await fetch(`${LIVE_BASE}/nolap-data-handler.php?action=restoreBackup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': activeSession },
      body: JSON.stringify({
        confirmMaintenance: 'AUTHORIZE_SPECIAL_MAINTENANCE_2026',
        maintenanceKey: 'NSR2026',
        backupFileName: 'latest'
      })
    });
    const restoreJson = await restoreRes.json();
    record(restoreRes.status === 200 && restoreJson.success === true, `Restore database cPanel berhasil dipulihkan dari snapshot (${restoreJson.restoredFrom || 'latest'}, ${restoreJson.totalRecords} records)`);
  } catch (e) {
    record(false, 'Uji Item 4 Exception: ' + e.message);
  }

  // --- ITEM 5: INTEGRITAS FRONTEND TAB 3 PORTAL JO & TAB 3 NOLAP ---
  console.log('\n--- 5. INTEGRITAS PORTAL JO (TAB 3 CLEAN) & PORTAL NOLAP TAB 3 ---');
  try {
    const joRes = await fetch(`${LIVE_BASE}/portal-penugasan-jo.html?_t=${Date.now()}`);
    const joHtml = await joRes.text();
    record(!joHtml.includes('input_seksi_01_di_tab_3'), 'Tab 3 Portal JO bersih dari input formulir Section 01 Tab 1');
    record(joHtml.includes('NSR_SESSION_TOKEN'), 'Portal JO menggunakan NSR_SESSION_TOKEN aman');

    const nolapRes = await fetch(`${LIVE_BASE}/portal-nolap.html?_t=${Date.now()}`);
    const nolapHtml = await nolapRes.text();
    record(nolapHtml.includes('-- Pilih Sektor Industri Kemenkeu (01–12) * --'), 'Portal NoLap live memuat opsi sektor 01-12 dengan placeholder disabled mandatory');
    record(nolapHtml.includes('Ditetapkan Pusat') || nolapHtml.includes('live-nomor-laporan'), 'Pratinjau NoLap live berfungsi');
  } catch (e) {
    record(false, 'Uji Item 5 Exception: ' + e.message);
  }

  console.log('\n===============================================================');
  console.log(`📊 REKAP SMOKE TEST LIVE SERVER: ${passed} PASS / ${failed} FAIL`);
  console.log('===============================================================');

  // Bersihkan sesi aktif terakhir
  if (activeSession) {
    try {
      await fetch(`${LIVE_BASE}/auth-handler.php?action=logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': activeSession },
        body: JSON.stringify({ sessionToken: activeSession })
      });
    } catch {}
  }

  return { passed, failed };
}

runLiveVerification();
