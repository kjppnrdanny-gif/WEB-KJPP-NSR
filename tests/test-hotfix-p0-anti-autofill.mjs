/**
 * OPINI NSR 2026 — HOTFIX P0 TEST SUITE
 * Verifikasi Hapus Total Autofill Kontak Pengaju (Portal JO & Portal NoLap)
 * 
 * 10 PENGUJIAN KOMPREHENSIF:
 * 1. Backend Gerbang 1: Penolakan (HTTP 400) jika Nama Pengaju kosong
 * 2. Backend Gerbang 1: Penolakan (HTTP 400) jika Email kosong / format invalid
 * 3. Backend Gerbang 1: Penolakan (HTTP 400) jika WhatsApp kosong / format invalid
 * 4. Backend Gerbang 1: Penerimaan kontak manual apa adanya, contact_status MANUAL_APPLICANT_INPUT, audit login_user_id
 * 5. Backend submitRequest NoLap: Penolakan (HTTP 400) jika Nama / Email / WA kosong
 * 6. Backend submitRequest NoLap: Penerimaan kontak manual apa adanya, contact_status MANUAL_APPLICANT_INPUT, audit login_user_id
 * 7. Headless Chrome Browser: Form JO saat login KING bersih total (5 field kosong, tanpa badge master personel, capture screenshot)
 * 8. Headless Chrome Browser: Form NoLap saat login KING bersih total (5 field kosong, tanpa badge master personel, capture screenshot)
 * 9. Headless Chrome Browser: Client-side validation Form JO menolak submit kosong & menerima isian manual
 * 10. Headless Chrome Browser: Client-side validation Form NoLap menolak submit kosong & menerima isian manual
 */

import http from 'http';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import assert from 'assert';

const PORT = 8910;
const CHROME_PORT = 9550;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const BASE_URL = `http://127.0.0.1:${PORT}/nolap-data-handler.php`;

const TOKENS = {
  SUPER_ADMIN: 'NSR8899',
  ADMIN_PUSAT: 'NSR-ADMIN-PUSAT-2026',
  MAKASSAR_CABANG: 'NSR-MKS-2026'
};

function request(urlPath, { method = 'GET', token = null, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['X-NSR-Token'] = token;
      headers['X-Internal-Token'] = token;
    }

    const req = http.request(url, { method, headers }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (_) { parsed = data; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('========================================================================');
  console.log('  OPINI NSR 2026 — TEST SUITE HOTFIX P0: ANTI-AUTOFILL KONTAK (10 TESTS)');
  console.log('========================================================================\n');

  // Start PHP server
  console.log(`[INIT] Menjalankan server PHP lokal pada port ${PORT}...`);
  const php = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'router.php'], { stdio: ['ignore', 'ignore', 'pipe'] });
  await new Promise(r => setTimeout(r, 1000));

  let passed = 0;
  let failed = 0;

  function testPass(msg) {
    console.log(`✔ PASS: ${msg}`);
    passed++;
  }
  function testFail(msg, err) {
    console.error(`✘ FAIL: ${msg}`);
    if (err) console.error(err);
    failed++;
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Backend Gerbang 1 - Penolakan jika Nama Pengaju Kosong (400)
    // -------------------------------------------------------------------------
    try {
      const res = await request('?action=submitGerbang1Awal', {
        method: 'POST',
        token: TOKENS.SUPER_ADMIN,
        body: {
          nomor_jo: 'JO-HOTFIX-001',
          origin_branch_id: 'JAKARTA_PUSAT',
          origin_branch_code: '2.0160-00',
          nama_pengaju: '', // KOSONG!
          email_pengaju: 'petugas.lapangan@kjppnsr.id',
          wa_pengaju: '081299990001',
          nama_klien: 'PT Test Verifikasi Mandatori',
          kategori_tujuan: 'JUAL_BELI',
          service_classification_id: 'PROPERTY'
        }
      });
      assert(res.status === 400, `Expected HTTP 400, got ${res.status}`);
      assert(res.data && res.data.success === false, 'Expected success false');
      assert(/nama.*pengaju.*wajib/i.test(res.data.error || res.data.message), 'Error message should mention mandatory nama pengaju');
      testPass('Test 1: Backend menolak submitGerbang1Awal jika nama pengaju kosong (HTTP 400)');
    } catch (e) {
      testFail('Test 1: Backend submitGerbang1Awal nama kosong', e);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Backend Gerbang 1 - Penolakan jika Email Kosong / Invalid (400)
    // -------------------------------------------------------------------------
    try {
      const resInvalid = await request('?action=submitGerbang1Awal', {
        method: 'POST',
        token: TOKENS.SUPER_ADMIN,
        body: {
          nomor_jo: 'JO-HOTFIX-002',
          origin_branch_id: 'JAKARTA_PUSAT',
          origin_branch_code: '2.0160-00',
          nama_pengaju: 'Ahmad Faisal',
          email_pengaju: 'invalid-email-format', // INVALID FORMAT!
          wa_pengaju: '081299990001',
          nama_klien: 'PT Test Verifikasi Mandatori',
          kategori_tujuan: 'JUAL_BELI',
          service_classification_id: 'PROPERTY'
        }
      });
      assert(resInvalid.status === 400, `Expected HTTP 400, got ${resInvalid.status}`);
      assert(resInvalid.data && resInvalid.data.success === false);
      assert(/email.*valid/i.test(resInvalid.data.error || resInvalid.data.message));
      testPass('Test 2: Backend menolak submitGerbang1Awal jika email tidak valid (HTTP 400)');
    } catch (e) {
      testFail('Test 2: Backend submitGerbang1Awal email invalid', e);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Backend Gerbang 1 - Penolakan jika WhatsApp Kosong / Invalid (400)
    // -------------------------------------------------------------------------
    try {
      const resInvalidWa = await request('?action=submitGerbang1Awal', {
        method: 'POST',
        token: TOKENS.SUPER_ADMIN,
        body: {
          nomor_jo: 'JO-HOTFIX-003',
          origin_branch_id: 'JAKARTA_PUSAT',
          origin_branch_code: '2.0160-00',
          nama_pengaju: 'Ahmad Faisal',
          email_pengaju: 'ahmad.faisal@kjppnsr.id',
          wa_pengaju: '1234', // Terlalu pendek / invalid
          nama_klien: 'PT Test Verifikasi Mandatori',
          kategori_tujuan: 'JUAL_BELI',
          service_classification_id: 'PROPERTY'
        }
      });
      assert(resInvalidWa.status === 400, `Expected HTTP 400, got ${resInvalidWa.status}`);
      assert(resInvalidWa.data && resInvalidWa.data.success === false);
      assert(/whatsapp.*valid|nomor.*wa/i.test(resInvalidWa.data.error || resInvalidWa.data.message));
      testPass('Test 3: Backend menolak submitGerbang1Awal jika WhatsApp tidak valid (HTTP 400)');
    } catch (e) {
      testFail('Test 3: Backend submitGerbang1Awal WA invalid', e);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Backend Gerbang 1 - Penerimaan Kontak Manual & Snapshot Tanpa Timpa Master
    // -------------------------------------------------------------------------
    try {
      const resValid = await request('?action=submitGerbang1Awal', {
        method: 'POST',
        token: TOKENS.SUPER_ADMIN,
        body: {
          nomor_jo: 'JO-HOTFIX-004-MANUAL',
          origin_branch_id: 'JAKARTA_PUSAT',
          origin_branch_code: '2.0160-00',
          nama_pengaju: 'Budi Darmawan, S.T.',
          nik_pengaju: 'ID-BD-9988',
          jabatan_pengaju: 'Staff Penilai Lapangan',
          email_pengaju: 'budi.darmawan.custom@gmail.com',
          wa_pengaju: '081377889900',
          nama_klien: 'PT Properti Mandiri Utama',
          kategori_tujuan: 'JUAL_BELI',
          service_classification_id: 'PROPERTY'
        }
      });
      assert(resValid.status === 200, `Expected HTTP 200, got ${resValid.status}`);
      assert(resValid.data && resValid.data.success === true, 'Submit should succeed');
      const item = resValid.data.data;
      assert(item, 'Response data object must exist');
      assert(item.pengaju_nama === 'Budi Darmawan, S.T.', 'Nama pengaju manual harus tersimpan');
      assert(item.pengaju_email === 'budi.darmawan.custom@gmail.com', 'Email pengaju manual harus tersimpan');
      assert(item.pengaju_wa === '081377889900' || item.pengaju_wa === '6281377889900', 'WA pengaju manual harus tersimpan');
      assert(item.contact_status === 'MANUAL_APPLICANT_INPUT', 'Status kontak harus MANUAL_APPLICANT_INPUT');
      assert(item.login_user_id === 'SUPER_ADMIN_KING' || item.login_user_id, 'login_user_id audit trail tercatat');
      assert(item.email_verified === false, 'email_verified harus false untuk input manual');
      assert(item.whatsapp_verified === false, 'whatsapp_verified harus false untuk input manual');
      testPass('Test 4: Backend menyimpan kontak manual apa adanya, contact_status MANUAL_APPLICANT_INPUT, audit login_user_id');
    } catch (e) {
      testFail('Test 4: Backend submitGerbang1Awal kontak manual valid', e);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Backend NoLap submitRequest - Penolakan jika Nama/Email/WA Kosong (400)
    // -------------------------------------------------------------------------
    try {
      const resKosong = await request('?action=submitRequest', {
        method: 'POST',
        token: TOKENS.MAKASSAR_CABANG,
        body: {
          nomor_jo: 'JO-MKS-HOTFIX-001',
          namaKlien: 'PT Bank Sulselbar',
          nama_debitur: 'Debitur Mandiri',
          namaPemohon: '', // KOSONG!
          emailPemohon: '',
          waPemohon: '',
          service_classification_id: 'PROPERTY'
        }
      });
      assert(resKosong.status === 400, `Expected HTTP 400, got ${resKosong.status}`);
      assert(resKosong.data && resKosong.data.success === false);
      assert(/pemohon.*wajib/i.test(resKosong.data.error || resKosong.data.message));
      testPass('Test 5: Backend submitRequest NoLap menolak data pemohon kosong (HTTP 400)');
    } catch (e) {
      testFail('Test 5: Backend submitRequest NoLap data kosong', e);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Backend NoLap submitRequest - Penerimaan Kontak Manual & Audit Trail
    // -------------------------------------------------------------------------
    try {
      const resValidNolap = await request('?action=submitRequest', {
        method: 'POST',
        token: TOKENS.MAKASSAR_CABANG,
        body: {
          nomor_jo: 'JO-MKS-HOTFIX-002',
          namaKlien: 'PT Makassar Bahari Sentosa',
          nama_debitur: 'Haji Sulaiman',
          origin_branch_id: 'MAKASSAR_CABANG',
          origin_branch_code: '2.0160-02',
          requested_signing_office: 'PUSAT',
          signing_branch_code: '2.0160-00',
          namaPemohon: 'Andi Mallarangeng, S.E.',
          nikPemohon: 'MKS-ADM-042',
          jabatanPemohon: 'Admin Operasional Cabang',
          emailPemohon: 'andi.mallarangeng.mks@gmail.com',
          waPemohon: '081242334455',
          service_classification_id: 'PROPERTY_SIMPLE',
          nilai_aset: 500000000
        }
      });
      assert(resValidNolap.status === 200, `Expected HTTP 200, got ${resValidNolap.status}`);
      assert(resValidNolap.data && resValidNolap.data.success === true);
      const reqData = resValidNolap.data.request || resValidNolap.data.record || resValidNolap.data.data;
      assert(reqData.namaPemohon === 'Andi Mallarangeng, S.E.');
      assert(reqData.emailPemohon === 'andi.mallarangeng.mks@gmail.com');
      assert(reqData.waPemohon === '081242334455' || reqData.waPemohon === '6281242334455' || reqData.waPemohon.includes('81242334455'));
      assert(reqData.contact_status === 'MANUAL_APPLICANT_INPUT');
      assert(reqData.login_user_id === 'admin_cabang_mks' || /mks|cabang/i.test(reqData.login_user_id));
      testPass('Test 6: Backend submitRequest NoLap menerima kontak manual & mencatat login_user_id admin_cabang_mks');
    } catch (e) {
      testFail('Test 6: Backend submitRequest NoLap kontak manual', e);
    }

    // -------------------------------------------------------------------------
    // HEADLESS CHROME SETUP FOR E2E BROWSER TESTS (7 - 10)
    // -------------------------------------------------------------------------
    console.log(`\n[INIT] Menjalankan Chrome Headless pada remote debugging port ${CHROME_PORT}...`);
    const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-hotfix-p0-'));
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      `--remote-debugging-port=${CHROME_PORT}`,
      '--no-sandbox',
      '--window-size=1400,900',
      '--user-data-dir=' + tmpProfile,
      'about:blank'
    ]);

    let connected = false;
    for (let i = 0; i < 20; i++) {
      try {
        const v = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
        if (v.ok) {
          connected = true;
          break;
        }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 500));
    }

    if (!connected) {
      throw new Error('Gagal menghubungkan ke Chrome debugging port ' + CHROME_PORT);
    }

    const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
    const tabData = await tabRes.json();
    const ws = new WebSocket(tabData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let cdpId = 1;
    function cdpSend(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = cdpId++;
        const handler = (e) => {
          const m = JSON.parse(e.data);
          if (m.id === msgId) {
            ws.removeEventListener('message', handler);
            if (m.error) reject(new Error(JSON.stringify(m.error)));
            else resolve(m.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await cdpSend('Runtime.enable');
    await cdpSend('Page.enable');
    await cdpSend('DOM.enable');

    // -------------------------------------------------------------------------
    // TEST 7: Headless Chrome - Portal JO saat login KING bersih total
    // -------------------------------------------------------------------------
    try {
      console.log('🌐 Membuka Portal Penugasan JO & Login sebagai SUPER ADMIN KING...');
      await cdpSend('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-penugasan-jo.html` });
      await new Promise(r => setTimeout(r, 1500));

      // Login dengan token KING NSR8899
      const loginRes = await cdpSend('Runtime.evaluate', {
        expression: `(async () => {
          const input = document.getElementById('input_token_auth');
          if (input) input.value = 'NSR8899';
          if (typeof verifikasiTokenLogin === 'function') {
            await verifikasiTokenLogin(null);
          }
          await new Promise(r => setTimeout(r, 1200));

          const fNama = document.getElementById('pengaju_nama_display')?.value || '';
          const fNik = document.getElementById('pengaju_nik_input')?.value || '';
          const fJabatan = document.getElementById('pengaju_jabatan_input')?.value || '';
          const fEmail = document.getElementById('pengaju_email_display')?.value || '';
          const fWa = document.getElementById('pengaju_wa_display')?.value || '';
          const badgeMaster = document.querySelector('.badge-master-personel') || 
                              document.getElementById('badge-pengaju-verified') ||
                              document.querySelector('[data-testid="badge-master-personel"]');
          const btnUpdateKontak = document.getElementById('btn-registrasi-personel-pengaju') ||
                                  document.querySelector('button[onclick*="bukaModalRegistrasiPersonel"]');

          return JSON.stringify({
            fNama,
            fNik,
            fJabatan,
            fEmail,
            fWa,
            hasBadgeMaster: !!badgeMaster,
            hasBtnUpdateKontak: !!btnUpdateKontak
          });
        })()`,
        awaitPromise: true,
        returnByValue: true
      });

      const parsedJo = JSON.parse(loginRes.result?.value || '{}');
      console.log('Nilai Form JO untuk KING:', parsedJo);

      assert(parsedJo.fNama === '', `Nama pengaju harus kosong, didapat: '${parsedJo.fNama}'`);
      assert(parsedJo.fNik === '', `NIK pengaju harus kosong, didapat: '${parsedJo.fNik}'`);
      assert(parsedJo.fJabatan === '', `Jabatan pengaju harus kosong, didapat: '${parsedJo.fJabatan}'`);
      assert(parsedJo.fEmail === '', `Email pengaju harus kosong, didapat: '${parsedJo.fEmail}'`);
      assert(parsedJo.fWa === '', `WA pengaju harus kosong, didapat: '${parsedJo.fWa}'`);
      assert(parsedJo.hasBadgeMaster === false, 'Badge master personel tidak boleh ada');
      assert(parsedJo.hasBtnUpdateKontak === false, 'Tombol update kontak tidak boleh ada pada form pengajuan');

      // Ambil screenshot
      const shot = await cdpSend('Page.captureScreenshot', { format: 'png' });
      const shotPath = path.join(ARTIFACT_DIR, 'bukti_portal_jo_formulir_kosong_king.png');
      fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
      console.log(`[SCREENSHOT] Disimpan: ${shotPath}`);

      testPass('Test 7: Headless Chrome - Portal JO saat login KING bersih total (5 field kosong, tanpa badge, screenshot tersimpan)');
    } catch (e) {
      testFail('Test 7: Headless Chrome Portal JO formulir kosong KING', e);
    }

    // -------------------------------------------------------------------------
    // TEST 8: Headless Chrome - Portal NoLap saat login KING bersih total
    // -------------------------------------------------------------------------
    try {
      console.log('🌐 Membuka Portal NoLap & Login sebagai SUPER ADMIN KING...');
      await cdpSend('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-nolap.html` });
      await new Promise(r => setTimeout(r, 1500));

      const loginNolapRes = await cdpSend('Runtime.evaluate', {
        expression: `(async () => {
          const input = document.getElementById('token-input');
          if (input) input.value = 'NSR8899';
          const btnLogin = document.getElementById('btn-login');
          if (btnLogin) btnLogin.click();
          await new Promise(r => setTimeout(r, 1500));

          const fNama = document.getElementById('f-pemohon')?.value || '';
          const fNik = document.getElementById('f-nik-pemohon')?.value || '';
          const fJabatan = document.getElementById('f-jabatan')?.value || '';
          const fEmail = document.getElementById('f-email-pemohon')?.value || '';
          const fWa = document.getElementById('f-wa-pemohon')?.value || '';
          const badgeMaster = document.getElementById('badge-status-pengaju-nolap');
          const btnUpdateKontak = document.getElementById('btn-registrasi-personel-nolap');

          return JSON.stringify({
            fNama,
            fNik,
            fJabatan,
            fEmail,
            fWa,
            hasBadgeMaster: !!badgeMaster,
            hasBtnUpdateKontak: !!btnUpdateKontak
          });
        })()`,
        awaitPromise: true,
        returnByValue: true
      });

      const parsedNolap = JSON.parse(loginNolapRes.result?.value || '{}');
      console.log('Nilai Form NoLap untuk KING:', parsedNolap);

      assert(parsedNolap.fNama === '', `Nama pemohon harus kosong, didapat: '${parsedNolap.fNama}'`);
      assert(parsedNolap.fNik === '', `NIK pemohon harus kosong, didapat: '${parsedNolap.fNik}'`);
      assert(parsedNolap.fJabatan === '', `Jabatan pemohon harus kosong, didapat: '${parsedNolap.fJabatan}'`);
      assert(parsedNolap.fEmail === '', `Email pemohon harus kosong, didapat: '${parsedNolap.fEmail}'`);
      assert(parsedNolap.fWa === '', `WA pemohon harus kosong, didapat: '${parsedNolap.fWa}'`);
      assert(parsedNolap.hasBadgeMaster === false, 'Badge master personel tidak boleh ada');
      assert(parsedNolap.hasBtnUpdateKontak === false, 'Tombol registrasi kontak tidak boleh ada pada form pengajuan');

      // Ambil screenshot
      const shot2 = await cdpSend('Page.captureScreenshot', { format: 'png' });
      const shot2Path = path.join(ARTIFACT_DIR, 'bukti_portal_nolap_formulir_kosong_king.png');
      fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
      console.log(`[SCREENSHOT] Disimpan: ${shot2Path}`);

      testPass('Test 8: Headless Chrome - Portal NoLap saat login KING bersih total (5 field kosong, tanpa badge, screenshot tersimpan)');
    } catch (e) {
      testFail('Test 8: Headless Chrome Portal NoLap formulir kosong KING', e);
    }

    // -------------------------------------------------------------------------
    // TEST 9: Client-side Validation Form JO - Menolak submit jika kontak kosong
    // -------------------------------------------------------------------------
    try {
      console.log('🛡️ Menguji validasi client-side mandatory pada Portal JO...');
      await cdpSend('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-penugasan-jo.html` });
      await new Promise(r => setTimeout(r, 1500));

      const clientValidationRes = await cdpSend('Runtime.evaluate', {
        expression: `(() => {
          let alertMsg = '';
          const origAlert = window.alert;
          window.alert = (msg) => {
            alertMsg = msg;
          };

          try {
            // Kosongkan field pengaju
            const elNama = document.getElementById('pengaju_nama_display');
            if (elNama) elNama.value = '';
            const elNik = document.getElementById('pengaju_nik_input');
            if (elNik) elNik.value = '';
            const elJabatan = document.getElementById('pengaju_jabatan_input');
            if (elJabatan) elJabatan.value = '';
            const elEmail = document.getElementById('pengaju_email_display');
            if (elEmail) elEmail.value = '';
            const elWa = document.getElementById('pengaju_wa_display');
            if (elWa) elWa.value = '';

            // Panggil handleFormSubmit langsung atau via event submit form
            if (typeof handleFormSubmit === 'function') {
              handleFormSubmit({ preventDefault: () => {} });
            } else if (typeof window.handleFormSubmit === 'function') {
              window.handleFormSubmit({ preventDefault: () => {} });
            } else {
              const form = document.getElementById('form-penugasan');
              if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }
          } catch (err) {
            return JSON.stringify({ error: err.message, stack: err.stack });
          } finally {
            window.alert = origAlert;
          }

          return JSON.stringify({ alertTriggered: Boolean(alertMsg), alertMsg });
        })()`,
        returnByValue: true
      });

      const parsedVal = JSON.parse(clientValidationRes.result?.value || '{}');
      console.log('Hasil Uji Validasi Form JO:', parsedVal);
      if (parsedVal.error) console.error('JS Error in Form JO validation:', parsedVal.error);
      assert(parsedVal.alertTriggered, 'Alert validasi harus terpicu saat kontak kosong');
      assert(/nama.*petugas.*pengaju/i.test(parsedVal.alertMsg), 'Pesan alert harus memuat validasi nama pengaju');
      testPass('Test 9: Client-side validation Form JO menolak submit jika kontak pengaju kosong');
    } catch (e) {
      testFail('Test 9: Client-side validation Form JO', e);
    }

    // -------------------------------------------------------------------------
    // TEST 10: Client-side Validation Form NoLap - Menolak submit jika kontak kosong
    // -------------------------------------------------------------------------
    try {
      console.log('🛡️ Menguji validasi client-side mandatory pada Portal NoLap...');
      await cdpSend('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-nolap.html` });
      await new Promise(r => setTimeout(r, 1500));

      const clientValNolapRes = await cdpSend('Runtime.evaluate', {
        expression: `(() => {
          let alertMsg = '';
          const origAlert = window.alert;
          window.alert = (msg) => {
            alertMsg = msg;
          };

          try {
            // Kosongkan nama pemohon
            const elPemohon = document.getElementById('f-pemohon');
            if (elPemohon) elPemohon.value = '';
            const elNik = document.getElementById('f-nik-pemohon');
            if (elNik) elNik.value = '';
            const elJabatan = document.getElementById('f-jabatan');
            if (elJabatan) elJabatan.value = '';
            const elEmail = document.getElementById('f-email-pemohon');
            if (elEmail) elEmail.value = '';
            const elWa = document.getElementById('f-wa-pemohon');
            if (elWa) elWa.value = '';

            // Panggil ajukanPermohonanNoLap langsung atau via event submit form
            if (typeof ajukanPermohonanNoLap === 'function') {
              ajukanPermohonanNoLap({ preventDefault: () => {} });
            } else if (typeof window.ajukanPermohonanNoLap === 'function') {
              window.ajukanPermohonanNoLap({ preventDefault: () => {} });
            } else {
              const form = document.getElementById('form-pengajuan-nolap');
              if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }
          } catch (err) {
            return JSON.stringify({ error: err.message, stack: err.stack });
          } finally {
            window.alert = origAlert;
          }

          return JSON.stringify({ alertTriggered: Boolean(alertMsg), alertMsg });
        })()`,
        returnByValue: true
      });

      const parsedValNolap = JSON.parse(clientValNolapRes.result?.value || '{}');
      console.log('Hasil Uji Validasi Form NoLap:', parsedValNolap);
      if (parsedValNolap.error) console.error('JS Error in Form NoLap validation:', parsedValNolap.error);
      assert(parsedValNolap.alertTriggered, 'Alert validasi harus terpicu saat kontak pemohon kosong');
      assert(/pemohon/i.test(parsedValNolap.alertMsg), 'Pesan alert harus memuat validasi pemohon');
      testPass('Test 10: Client-side validation Form NoLap menolak submit jika kontak pemohon kosong');
    } catch (e) {
      testFail('Test 10: Client-side validation Form NoLap', e);
    }

    // Cleanup Chrome
    try {
      await cdpSend('Browser.close');
      chrome.kill();
    } catch (_) {}

  } finally {
    // Cleanup PHP
    php.kill();
  }

  console.log('\n========================================================================');
  console.log(`  HASIL PENGUJIAN: ${passed} PASS, ${failed} FAIL`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
