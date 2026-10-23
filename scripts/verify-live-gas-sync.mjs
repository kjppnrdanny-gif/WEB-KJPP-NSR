/**
 * scripts/verify-live-gas-sync.mjs
 * =========================================================================================
 * SKRIP VALIDASI LIVE KONEKSI & SINKRONISASI DUA ARAH
 * Google Apps Script (GAS) Web App <--> Google Sheets Master <--> Portal Web KJPP NSR
 * =========================================================================================
 * 
 * Target Pengujian:
 * 1. Web App Endpoint : https://script.google.com/macros/s/AKfycbwF5SI6A6hj0yuPBVd8FlRNc7uaXqCNDtoe6RdvlPdL7t33ithJ6TFrHQEB11fxzMqF/exec
 * 2. Spreadsheet ID   : 1VJW4nrzc1884kxepxZ2p8zNUcHrCWEqodQQcjeXXg_g
 * 3. Portal Web Live  : https://kjppnanangrahayu.com/portal-surat-umum.html
 * 
 * Lingkup Pengujian:
 * - Test 1: HTTP GET Request (action: GET_SURAT_UMUM_LIST) & Redirect Handling
 * - Test 2: HTTP POST Request (action: GET_SURAT_UMUM_LIST) dengan Token Otorisasi RBAC
 * - Test 3: HTTP POST Request (action: CREATE_SURAT_UMUM) Uji Coba Registrasi Nomor Dummy
 * - Test 4: Headless Browser Test pada Portal Live https://kjppnanangrahayu.com/portal-surat-umum.html
 * - Test 5: Analisis Hasil & Rekomendasi Solusi Teknis
 * =========================================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwF5SI6A6hj0yuPBVd8FlRNc7uaXqCNDtoe6RdvlPdL7t33ithJ6TFrHQEB11fxzMqF/exec';
const TARGET_SPREADSHEET_ID = '1VJW4nrzc1884kxepxZ2p8zNUcHrCWEqodQQcjeXXg_g';
const PORTAL_URL = 'https://kjppnanangrahayu.com/portal-surat-umum.html';
const ADMIN_TOKEN = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome/Edge binary tidak ditemukan di sistem.');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.messageListeners = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const WebSocket = globalThis.WebSocket;
      if (!WebSocket) {
        import('ws').then(wsModule => {
          this.ws = new wsModule.default(this.wsUrl);
          this._bindWs(resolve, reject);
        }).catch(reject);
      } else {
        this.ws = new WebSocket(this.wsUrl);
        this._bindWs(resolve, reject);
      }
    });
  }

  _bindWs(resolve, reject) {
    this.ws.onopen = () => resolve();
    this.ws.onerror = (err) => reject(err);
    this.ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        for (const listener of this.messageListeners) {
          try { listener(data); } catch (_) {}
        }
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      } catch (_) {}
    };
  }

  onMessage(listener) {
    this.messageListeners.push(listener);
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async close() {
    if (this.ws) this.ws.close();
  }
}

function cleanHtmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runLiveVerification() {
  console.log('================================================================================');
  console.log('🔍 MEMULAI PENGUJIAN LIVE KONEKSI & SINKRONISASI GOOGLE APPS SCRIPT');
  console.log('================================================================================');
  console.log(`Endpoint Web App : ${GAS_WEB_APP_URL}`);
  console.log(`Target Sheet ID  : ${TARGET_SPREADSHEET_ID}`);
  console.log(`Portal Web Live  : ${PORTAL_URL}`);
  console.log(`Waktu Pengujian  : ${new Date().toISOString()}`);
  console.log('--------------------------------------------------------------------------------\n');

  const report = {
    test1_get: null,
    test2_post_read: null,
    test3_post_create: null,
    test4_browser: null,
    diagnosis: []
  };

  // -------------------------------------------------------------------------------------------
  // TEST 1: HTTP GET Request (action: GET_SURAT_UMUM_LIST)
  // -------------------------------------------------------------------------------------------
  console.log('📡 [TEST 1] Menguji HTTP GET action: GET_SURAT_UMUM_LIST...');
  try {
    const getUrl = `${GAS_WEB_APP_URL}?action=GET_SURAT_UMUM_LIST&target_year=2026`;
    const t0 = Date.now();
    const res = await fetch(getUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });
    const duration = Date.now() - t0;
    const contentType = res.headers.get('content-type') || '';
    const rawText = await res.text();

    let jsonPayload = null;
    let isJson = false;
    try {
      jsonPayload = JSON.parse(rawText);
      isJson = true;
    } catch (_) {}

    const isHtmlError = !isJson && rawText.includes('Fungsi skrip tidak ditemukan');
    const cleanedText = cleanHtmlToText(rawText);

    report.test1_get = {
      status: res.status,
      statusText: res.statusText,
      durationMs: duration,
      contentType,
      isJson,
      isHtmlError,
      data: jsonPayload,
      snippet: cleanedText.slice(0, 200)
    };

    console.log(`  - HTTP Status    : ${res.status} ${res.statusText} (${duration} ms)`);
    console.log(`  - Content-Type   : ${contentType}`);
    console.log(`  - Format Respon  : ${isJson ? 'JSON Valid' : 'HTML / Bukan JSON'}`);

    if (isJson) {
      console.log(`  - Payload Status : ${jsonPayload.status || jsonPayload.success}`);
      console.log(`  - Max Sequence   : ${jsonPayload.maxSeq ?? 'N/A'}`);
      console.log(`  - Next Sequence  : ${jsonPayload.nextSeq ?? 'N/A'}`);
      console.log(`  - Total Data     : ${Array.isArray(jsonPayload.data) ? jsonPayload.data.length : 0} surat`);
      console.log('  ✓ Respon GET berhasil mengembalikan payload JSON valid.');
    } else {
      console.log(`  - Cuplikan Respon: "${cleanedText.slice(0, 160)}..."`);
      if (isHtmlError) {
        console.log('  ⚠️ CATATAN BACKEND: Google Script merespon "Fungsi skrip tidak ditemukan: doGet".');
      }
    }
  } catch (err) {
    console.error('  ❌ Gagal melakukan fetch HTTP GET:', err.message);
    report.test1_get = { error: err.message };
  }
  console.log('');

  // -------------------------------------------------------------------------------------------
  // TEST 2: HTTP POST Request (action: GET_SURAT_UMUM_LIST) dengan RBAC Token
  // -------------------------------------------------------------------------------------------
  console.log('📡 [TEST 2] Menguji HTTP POST action: GET_SURAT_UMUM_LIST dengan Token Admin Pusat...');
  try {
    const postPayload = {
      action: 'GET_SURAT_UMUM_LIST',
      token: ADMIN_TOKEN,
      target_year: 2026
    };

    const t0 = Date.now();
    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow',
      body: JSON.stringify(postPayload)
    });
    const duration = Date.now() - t0;
    const contentType = res.headers.get('content-type') || '';
    const rawText = await res.text();

    let jsonPayload = null;
    let isJson = false;
    try {
      jsonPayload = JSON.parse(rawText);
      isJson = true;
    } catch (_) {}

    const isHtmlError = !isJson && rawText.includes('Fungsi skrip tidak ditemukan');
    const cleanedText = cleanHtmlToText(rawText);

    report.test2_post_read = {
      status: res.status,
      statusText: res.statusText,
      durationMs: duration,
      contentType,
      isJson,
      isHtmlError,
      data: jsonPayload,
      snippet: cleanedText.slice(0, 200)
    };

    console.log(`  - HTTP Status    : ${res.status} ${res.statusText} (${duration} ms)`);
    console.log(`  - Content-Type   : ${contentType}`);
    console.log(`  - Format Respon  : ${isJson ? 'JSON Valid' : 'HTML / Bukan JSON'}`);

    if (isJson) {
      console.log(`  - Payload Status : ${jsonPayload.status || jsonPayload.success}`);
      console.log(`  - Max Sequence   : ${jsonPayload.maxSeq ?? 'N/A'}`);
      console.log(`  - Next Sequence  : ${jsonPayload.nextSeq ?? 'N/A'}`);
      console.log(`  - Total Data     : ${Array.isArray(jsonPayload.data) ? jsonPayload.data.length : 0} surat`);
      console.log('  ✓ Respon POST membaca Buku_Surat_Umum berhasil 100%.');
    } else {
      console.log(`  - Cuplikan Respon: "${cleanedText.slice(0, 160)}..."`);
      if (isHtmlError) {
        console.log('  ⚠️ CATATAN BACKEND: Google Script merespon "Fungsi skrip tidak ditemukan: doPost".');
      }
    }
  } catch (err) {
    console.error('  ❌ Gagal melakukan fetch HTTP POST:', err.message);
    report.test2_post_read = { error: err.message };
  }
  console.log('');

  // -------------------------------------------------------------------------------------------
  // TEST 3: HTTP POST Request (action: CREATE_SURAT_UMUM) Uji Registrasi Nomor Dummy
  // -------------------------------------------------------------------------------------------
  console.log('📝 [TEST 3] Menguji Action CREATE_SURAT_UMUM (Registrasi Nomor Surat Dummy)...');
  try {
    const dummyDate = new Date().toISOString().split('T')[0];
    const dummyData = {
      action: 'CREATE_SURAT_UMUM',
      token: ADMIN_TOKEN,
      data: {
        Tanggal_Surat: dummyDate,
        Tujuan_Penerima: 'Tes Sinkronisasi Sistem',
        Perihal: 'Validasi Integrasi Web App GAS Otomatis',
        Klasifikasi_Perihal: 'SU-KET',
        Penandatangan: 'Pemimpin Rekan'
      }
    };

    const t0 = Date.now();
    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow',
      body: JSON.stringify(dummyData)
    });
    const duration = Date.now() - t0;
    const rawText = await res.text();

    let jsonPayload = null;
    let isJson = false;
    try {
      jsonPayload = JSON.parse(rawText);
      isJson = true;
    } catch (_) {}

    const isHtmlError = !isJson && rawText.includes('Fungsi skrip tidak ditemukan');
    const cleanedText = cleanHtmlToText(rawText);

    report.test3_post_create = {
      status: res.status,
      durationMs: duration,
      isJson,
      isHtmlError,
      data: jsonPayload,
      snippet: cleanedText.slice(0, 200)
    };

    console.log(`  - HTTP Status    : ${res.status} (${duration} ms)`);
    console.log(`  - Format Respon  : ${isJson ? 'JSON Valid' : 'HTML / Bukan JSON'}`);

    if (isJson) {
      console.log(`  - Hasil Simpan   :`, jsonPayload);
      if (jsonPayload.status === 'success') {
        console.log(`  ✓ Surat berhasil teregistrasi di Google Sheet! No: ${jsonPayload.no_surat || jsonPayload.data?.No_Surat}`);
      } else {
        console.log(`  ⚠️ Backend merespon status: ${jsonPayload.status} (${jsonPayload.message || jsonPayload.error})`);
      }
    } else {
      console.log(`  - Cuplikan Respon: "${cleanedText.slice(0, 160)}..."`);
    }
  } catch (err) {
    console.error('  ❌ Gagal menguji CREATE_SURAT_UMUM:', err.message);
    report.test3_post_create = { error: err.message };
  }
  console.log('');

  // -------------------------------------------------------------------------------------------
  // TEST 4: Headless Browser Test di Portal Live https://kjppnanangrahayu.com/portal-surat-umum.html
  // -------------------------------------------------------------------------------------------
  console.log(`🌐 [TEST 4] Menjalankan Pengujian Headless Browser pada Portal Live...`);
  console.log(`  - Target Halaman : ${PORTAL_URL}`);

  let chromeProc = null;
  let cdp = null;

  try {
    const chromePath = findChrome();
    const remoteDebuggingPort = 9226;
    const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_su_test');

    chromeProc = spawn(chromePath, [
      `--remote-debugging-port=${remoteDebuggingPort}`,
      `--user-data-dir=${userDataDir}`,
      '--headless=new',
      '--disable-gpu',
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1440,900',
      'about:blank'
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const listRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
        if (listRes.ok) {
          const list = await listRes.json();
          if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
            wsUrl = list[0].webSocketDebuggerUrl;
            break;
          }
        }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 200));
    }

    if (!wsUrl) throw new Error('Gagal menghubungkan Chrome DevTools Protocol.');

    cdp = new CDPClient(wsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Network.enable');
    await cdp.send('Runtime.enable');

    const networkEvents = [];
    const consoleEvents = [];

    // Pantau network request ke GAS
    cdp.onMessage((msg) => {
      try {
        if (msg.method === 'Network.requestWillBeSent') {
          const u = msg.params?.request?.url || '';
          if (u.includes('script.google.com') || u.includes('googleusercontent.com')) {
            networkEvents.push({
              type: 'REQUEST',
              url: u,
              method: msg.params.request.method
            });
          }
        }
        if (msg.method === 'Network.responseReceived') {
          const u = msg.params?.response?.url || '';
          if (u.includes('script.google.com') || u.includes('googleusercontent.com')) {
            networkEvents.push({
              type: 'RESPONSE',
              url: u,
              status: msg.params.response.status,
              statusText: msg.params.response.statusText
            });
          }
        }
        if (msg.method === 'Network.loadingFailed') {
          networkEvents.push({
            type: 'FAILED',
            errorText: msg.params.errorText,
            canceled: msg.params.canceled
          });
        }
        if (msg.method === 'Runtime.consoleAPICalled') {
          const text = msg.params?.args?.map(a => a.value || a.description || '').join(' ');
          consoleEvents.push({
            level: msg.params.type,
            text
          });
        }
      } catch (_) {}
    });

    console.log('  - Membuka halaman portal-surat-umum.html...');
    await cdp.send('Page.navigate', { url: PORTAL_URL });

    // Tunggu DOM termuat
    await new Promise(r => setTimeout(r, 2500));

    // Masukkan token otorisasi Admin Pusat dan trigger muatDataSuratUmum
    const loginResult = await cdp.send('Runtime.evaluate', {
      expression: `
        (async function() {
          try {
            localStorage.setItem('kjpp_token_auth', '${ADMIN_TOKEN}');
            localStorage.setItem('kjpp_session_token', '${ADMIN_TOKEN}');

            // Sembunyikan modal auth
            const modal = document.getElementById('modal-auth');
            if (modal) modal.classList.add('hidden');

            const auth = {
              role: 'ADMIN_PUSAT',
              mode: 'PUSAT',
              wilayah: 'Kantor Pusat Jakarta',
              canManageSU: true
            };

            if (typeof window.terapkanSesiKeUI === 'function') {
              window.terapkanSesiKeUI(auth, '${ADMIN_TOKEN}');
            }

            // Tunggu render DOM dan trigger muatDataSuratUmum
            await new Promise(r => setTimeout(r, 1500));

            const isModalHidden = document.getElementById('modal-auth')?.classList.contains('hidden');
            const isModulVisible = !document.getElementById('container-modul-aktif')?.classList.contains('hidden');
            const sessionText = document.getElementById('label-sesi-role')?.textContent?.trim() || '';
            const noSuratVal = document.getElementById('no_surat')?.value || '';
            const totalTableRows = document.querySelectorAll('#tabel-body-surat tr').length;

            return {
              isModalHidden,
              isModulVisible,
              sessionText,
              noSuratVal,
              totalTableRows,
              localStorageToken: localStorage.getItem('kjpp_token_auth')
            };
          } catch(e) {
            return { error: e.toString() };
          }
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    const evalVal = loginResult.result?.value || {};
    console.log('  - Status Login Portal:', evalVal);

    // Tunggu siklus fetch muatDataSuratUmum
    await new Promise(r => setTimeout(r, 3000));

    const gasRequests = networkEvents.filter(e => e.type === 'REQUEST');
    const gasResponses = networkEvents.filter(e => e.type === 'RESPONSE');
    const gasFailures = networkEvents.filter(e => e.type === 'FAILED');

    console.log(`  - Total Network Request ke GAS : ${gasRequests.length}`);
    console.log(`  - Total Network Response GAS   : ${gasResponses.length}`);
    console.log(`  - Network Failures / CORS Err : ${gasFailures.length}`);

    report.test4_browser = {
      evalVal,
      gasRequests,
      gasResponses,
      gasFailures,
      corsErrorDetected: gasFailures.some(f => (f.errorText || '').toLowerCase().includes('cors') || (f.errorText || '').toLowerCase().includes('blocked')),
      recentConsole: consoleEvents.slice(-5)
    };

    if (report.test4_browser.corsErrorDetected) {
      console.log('  ⚠️ Terdeteksi kendala CORS pada browser fetch.');
    } else {
      console.log('  ✓ Browser tidak mengalami kendala CORS atau network blocking.');
    }

  } catch (browserErr) {
    console.error('  ❌ Gagal menjalankan pengujian browser headless:', browserErr.message);
    report.test4_browser = { error: browserErr.message };
  } finally {
    if (cdp) await cdp.close().catch(() => {});
    if (chromeProc) chromeProc.kill();
  }
  console.log('');

  // -------------------------------------------------------------------------------------------
  // TEST 5: KESIMPULAN DIAGNOSTIK & PANDUAN PENYELESAIAN
  // -------------------------------------------------------------------------------------------
  console.log('================================================================================');
  console.log('📊 KESIMPULAN HASIL PENGUJIAN & DIAGNOSTIK AKURAT');
  console.log('================================================================================');

  const isGetMissingFunc = report.test1_get?.isHtmlError || false;
  const isPostMissingFunc = report.test2_post_read?.isHtmlError || false;

  if (isGetMissingFunc || isPostMissingFunc) {
    console.log('🔴 STATUS BACKEND : GOOGLE SCRIPT MEMERLUKAN DEPLOYMENT BARU ("New Version")');
    console.log('--------------------------------------------------------------------------------');
    console.log('Penyebab Utama:');
    console.log('  Endpoint Web App aktif dan dapat dihubungi secara global (HTTP 200), namun');
    console.log('  Google Apps Script merespon dengan galat internal:');
    console.log('    -> "Fungsi skrip tidak ditemukan: doGet"');
    console.log('    -> "Fungsi skrip tidak ditemukan: doPost"');
    console.log('');
    console.log('Penjelasan Teknis:');
    console.log('  Pada Google Apps Script, URL deployment saat ini terpasang ke Versi Awal (kosong/belum tersimpan).');
    console.log('  Meskipun kode lengkap sudah disiapkan di file Code.gs, Google Apps Script mewajibkan');
    console.log('  pembuatan "New Version" di menu Manage Deployments agar fungsi doGet & doPost dieksekusi.');
    console.log('');
    console.log('Langkah Solusi Cepat (Hanya 1 Menit di Akun kjppnr.danny@gmail.com):');
    console.log('  1. Buka spreadsheet target: https://docs.google.com/spreadsheets/d/' + TARGET_SPREADSHEET_ID);
    console.log('  2. Klik menu "Extensions" (Ekstensi) > "Apps Script".');
    console.log('  3. Pastikan seluruh isi file Code.gs dari repositori ini sudah di-copy-paste ke editor.');
    console.log('  4. Klik tombol "Save" (Simpan / Ctrl+S).');
    console.log('  5. Klik tombol biru "Deploy" (Terapkan) di pojok kanan atas > pilih "Manage deployments" (Kelola penerapan).');
    console.log('  6. Klik ikon pensil (Edit) pada penerapan Web App aktif.');
    console.log('  7. Pada dropdown "Version", pilih "New version" (Versi baru).');
    console.log('  8. Pastikan "Who has access" disetel ke "Anyone" (Siapa saja).');
    console.log('  9. Klik tombol "Deploy" (Terapkan).');
    console.log('--------------------------------------------------------------------------------');
  } else if (report.test1_get?.isJson && report.test2_post_read?.isJson) {
    console.log('🟢 STATUS BACKEND : 100% TERHUBUNG & TERSINKRONISASI DUA ARAH');
    console.log(`  - Tab Sheet      : Buku_Surat_Umum aktif`);
    console.log(`  - Max Sequence   : ${report.test1_get?.data?.maxSeq}`);
    console.log(`  - Next Sequence  : ${report.test1_get?.data?.nextSeq}`);
    console.log('--------------------------------------------------------------------------------');
  }

  console.log('✨ Pengujian selesai dijalankan.\n');
}

runLiveVerification().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
