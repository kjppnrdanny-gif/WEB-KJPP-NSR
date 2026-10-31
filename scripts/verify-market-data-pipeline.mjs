import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

const PHP_BIN = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe';
const PHP_EXT_DIR = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
const PHP_PORT = 8299;
const CHROME_PORT = 9589;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-market-${Date.now()}`);

console.log('================================================================');
console.log(' PENGUJIAN BROWSER E2E: PIPELINE DATA PASAR PEMBANDING SPI 105 ');
console.log('================================================================');

// 1. Jalankan PHP Server
const php = spawn(PHP_BIN, [
  '-d', `extension_dir=${PHP_EXT_DIR}`,
  '-d', 'extension=curl',
  '-d', 'extension=openssl',
  '-S', `127.0.0.1:${PHP_PORT}`,
  '-t', path.resolve('.')
], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));

// 2. Jalankan Headless Chrome
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${CHROME_PORT}`,
  `--user-data-dir=${tmpUserData}`,
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=1366,900',
  'about:blank'
]);

let tData = null;
for (let i = 0; i < 25; i++) {
  try {
    const tRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
    tData = await tRes.json();
    if (tData && tData.webSocketDebuggerUrl) break;
  } catch (e) {
    await new Promise(r => setTimeout(r, 400));
  }
}

if (!tData || !tData.webSocketDebuggerUrl) {
  php.kill();
  chrome.kill();
  throw new Error('Chrome Remote Debugging WebSocket URL tidak tersedia');
}

const ws = new WebSocket(tData.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let idCounter = 1;
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = idCounter++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

try {
  await cdp('Page.enable');
  await cdp('Runtime.enable');

  console.log('\n--- Buka portal-tracking.html ---');
  const loadPromise = new Promise(resolve => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.loadEventFired') {
        ws.removeEventListener('message', handler);
        resolve();
      }
    };
    ws.addEventListener('message', handler);
  });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${PHP_PORT}/portal-tracking.html` });
  await loadPromise;
  await new Promise(r => setTimeout(r, 1500));

  // TEST CASE 1: Verifikasi Badge Data Pasar pada Taskboard untuk JO-BDG-2026-0015
  console.log('\n--- UJI 1: Verifikasi Badge Awal Data Pasar (2/3 Terkumpul) ---');
  const badgeEval = await cdp('Runtime.evaluate', {
    expression: `(() => {
      const j = globalJobs.find(x => x.jo_number === 'JO-BDG-2026-0015');
      return {
        jo: j ? j.jo_number : null,
        count: j ? (j.market_data_count || (j.data_pembanding ? Object.keys(j.data_pembanding).length : 0)) : 0,
        complete: j ? j.market_data_complete : null,
        dpKeys: j && j.data_pembanding ? Object.keys(j.data_pembanding) : []
      };
    })()`,
    returnByValue: true
  });
  console.log('Evaluasi Objek JO-BDG-2026-0015:', badgeEval.result.value);
  assert.strictEqual(badgeEval.result.value.count, 2, 'Data pembanding awal harus berjumlah 2');
  assert.strictEqual(badgeEval.result.value.complete, false, 'Status kelengkapan awal harus false');

  // TEST CASE 2: Buka Modal Pratinjau Pembanding & Verifikasi DP-01, DP-02
  console.log('\n--- UJI 2: Buka Modal Pratinjau Pembanding (#modal-data-pembanding) ---');
  await cdp('Runtime.evaluate', {
    expression: `bukaModalDataPembanding('JO-BDG-2026-0015')`
  });
  await new Promise(r => setTimeout(r, 800));

  const modalRekapCheck = await cdp('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-data-pembanding');
      const isVisible = modal && !modal.classList.contains('hidden');
      const joDisplay = document.getElementById('rekap-jo-display') ? document.getElementById('rekap-jo-display').textContent : '';
      const badgeText = document.getElementById('rekap-market-badge') ? document.getElementById('rekap-market-badge').textContent : '';
      const cards = document.querySelectorAll('#rekap-comparables-grid > div');
      return { isVisible, joDisplay, badgeText, cardsCount: cards.length };
    })()`,
    returnByValue: true
  });
  if (modalRekapCheck.exceptionDetails) {
    console.error('Exception in UJI 2:', modalRekapCheck.exceptionDetails);
  }
  console.log('Status Modal Pratinjau Pembanding:', modalRekapCheck.result.value);
  assert.strictEqual(modalRekapCheck.result.value.isVisible, true, 'Modal pratinjau pembanding harus terbuka');
  assert.strictEqual(modalRekapCheck.result.value.cardsCount, 3, 'Grid harus menampilkan 3 slot card pembanding');

  // TEST CASE 3: Buka Modal Input Pembanding & Verifikasi Auto-Selection DP-03
  console.log('\n--- UJI 3: Buka Modal Input Pembanding (#modal-input-pembanding) ---');
  await cdp('Runtime.evaluate', {
    expression: `bukaModalInputPembanding('JO-BDG-2026-0015')`
  });
  await new Promise(r => setTimeout(r, 800));

  const modalInputCheck = await cdp('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-input-pembanding');
      const isVisible = modal && !modal.classList.contains('hidden');
      const selectVal = document.getElementById('market-input-jo').value;
      const radios = document.getElementsByName('market-urutan');
      let selectedUrutan = null;
      radios.forEach(r => { if (r.checked) selectedUrutan = r.value; });
      return { isVisible, selectVal, selectedUrutan };
    })()`,
    returnByValue: true
  });
  console.log('Status Modal Input Pembanding:', modalInputCheck.result.value);
  assert.strictEqual(modalInputCheck.result.value.isVisible, true, 'Modal input pembanding harus terbuka');
  assert.strictEqual(modalInputCheck.result.value.selectVal, 'JO-BDG-2026-0015', 'JO harus otomatis terpilih');
  assert.strictEqual(modalInputCheck.result.value.selectedUrutan, '3', 'Urutan harus otomatis defaulted ke DP-03');

  // TEST CASE 4: Simulasikan Pengisian DP-03 Lengkap dengan Geotagging & Canvas Watermark
  console.log('\n--- UJI 4: Isi Formulir Mobile DP-03 dengan Stempel GPS & Waktu ---');
  const simulasikanInput = await cdp('Runtime.evaluate', {
    expression: `(() => {
      // 1. Set data teknis
      document.getElementById('market-jenis-properti').value = 'Ruko Komersial 3 Lantai';
      document.getElementById('market-harga').value = '3.100.000.000';
      document.getElementById('market-luas-tanah').value = 240;
      document.getElementById('market-luas-bangunan').value = 280;
      document.getElementById('market-lebar-jalan').value = 10;
      document.getElementById('market-alamat').value = 'Jl. Asia Afrika No. 112, Kota Bandung';
      document.getElementById('market-narasumber-nama').value = 'Bpk. H. Rahmat';
      document.getElementById('market-narasumber-status').value = 'Pemilik Langsung';
      document.getElementById('market-narasumber-kontak').value = '081288991122';
      
      // Hitung per m2
      hitungHargaPerM2();

      // 2. Set GPS terverifikasi
      document.getElementById('market-gps-lat').value = '-6.921500';
      document.getElementById('market-gps-lng').value = '107.619000';
      document.getElementById('market-gps-acc').value = '4.2';
      const st = document.getElementById('market-gps-display');
      if (st) st.innerHTML = '<span class="text-emerald-400 font-bold">📍 GPS Terkunci:</span> -6.921500, 107.619000 (±4.2m)';

      // 3. Generate Simulated Canvas Image with Watermark
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 600, 400);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 400);
      // Ruko Graphic
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(150, 100, 300, 250);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(180, 140, 60, 60);
      ctx.fillRect(270, 140, 60, 60);
      ctx.fillRect(360, 140, 60, 60);
      // Stempel Watermark
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 320, 600, 80);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('KJPP NSR ARSIP SURVEI DATA PASAR (SPI 105)', 15, 345);
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px monospace';
      ctx.fillText('JO: JO-BDG-2026-0015 | DP-03 | Rp 12.916.667 /m2', 15, 365);
      ctx.fillStyle = '#4ade80';
      ctx.fillText('GPS: -6.921500, 107.619000 (±4.2m) | Waktu: ' + new Date().toLocaleString('id-ID'), 15, 385);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      document.getElementById('market-foto-base64').value = dataUrl;
      const imgPrv = document.getElementById('market-foto-preview-img');
      imgPrv.src = dataUrl;
      document.getElementById('market-foto-preview-container').classList.remove('hidden');

      return {
        hargaDisplay: document.getElementById('market-harga-m2-display').textContent,
        fotoSet: !!document.getElementById('market-foto-base64').value
      };
    })()`,
    returnByValue: true
  });
  if (simulasikanInput.exceptionDetails) {
    console.error('Exception in UJI 4:', simulasikanInput.exceptionDetails);
  }
  console.log('Hasil Input DP-03:', simulasikanInput.result.value);
  assert.strictEqual(simulasikanInput.result.value.fotoSet, true, 'Foto ber-watermark harus terekam');

  // TEST CASE 5: Kirim Data Pembanding ke Backend
  console.log('\n--- UJI 5: Kirim DP-03 ke Backend via eksekusiKirimDataPembanding() ---');
  await cdp('Runtime.evaluate', {
    expression: `eksekusiKirimDataPembanding()`,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 2500));

  // Periksa Status Setelah Pengiriman
  const postSubmitCheck = await cdp('Runtime.evaluate', {
    expression: `(() => {
      const j = globalJobs.find(x => x.jo_number === 'JO-BDG-2026-0015');
      return {
        count: j.market_data_count,
        complete: j.market_data_complete,
        dpKeys: Object.keys(j.data_pembanding || {}),
        spmButir4: j.spm_checklist_data && j.spm_checklist_data.items ? j.spm_checklist_data.items.find(x => x.id === 4) : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Status Pasca-Submit JO-BDG-2026-0015:', postSubmitCheck.result.value);
  assert.strictEqual(postSubmitCheck.result.value.count, 3, 'Jumlah data pasar harus menjadi 3');
  assert.strictEqual(postSubmitCheck.result.value.complete, true, 'Status kelengkapan harus true (Lengkap)');
  assert(postSubmitCheck.result.value.dpKeys.includes('DP-03'), 'DP-03 harus terdaftar di data_pembanding');
  if (postSubmitCheck.result.value.spmButir4) {
    assert.strictEqual(postSubmitCheck.result.value.spmButir4.status, 'SESUAI', 'Butir 4 Checklist SPM harus otomatis SESUAI');
  }

  // TEST CASE 6: Buka Modal Pratinjau 3 Pembanding dan Ambil Screenshot Live
  console.log('\n--- UJI 6: Tampilan Pratinjau 3 Pembanding Side-by-Side (#modal-data-pembanding) ---');
  await cdp('Runtime.evaluate', {
    expression: `bukaModalDataPembanding('JO-BDG-2026-0015')`
  });
  await new Promise(r => setTimeout(r, 1000));

  // Ambil screenshot modal
  const screenshotData = await cdp('Page.captureScreenshot', { format: 'png' });
  const screenshotPath = path.join(artifactsDir, 'bukti_live_market_comparables_m04.png');
  fs.writeFileSync(screenshotPath, Buffer.from(screenshotData.data, 'base64'));
  console.log('Screenshot live berhasil disimpan di:', screenshotPath);

  console.log('\n================================================================');
  console.log(' SELURUH PENGUJIAN E2E PIPELINE DATA PASAR PEMBANDING LULUS (100%)');
  console.log('================================================================');

} catch (err) {
  console.error('\n❌ PENGUJIAN GAGAL:', err);
  process.exitCode = 1;
} finally {
  ws.close();
  chrome.kill();
  php.kill();
}
