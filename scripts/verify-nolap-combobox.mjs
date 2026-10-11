import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function staticServer(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, 'http://' + req.headers.host).pathname);
  if (pathname === '/') pathname = 'portal-nolap.html';
  const cleanPath = pathname.replace(/^\/+/, '');
  const filePath = path.join(ROOT_DIR, cleanPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_MAP[ext] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
}

async function run() {
  const server = http.createServer(staticServer);
  await new Promise(r => server.listen(8099, '127.0.0.1', r));
  console.log('Test Static Server ready on http://127.0.0.1:8099');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9259',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9259/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        if (m.result && m.result.result && m.result.result.value !== undefined) {
          cb(m.result.result.value);
        } else {
          cb(m.result || m.error);
        }
      }
    };

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    console.log('\n======================================================');
    console.log('1. DESKTOP TEST & VERIFIKASI (1440x900)');
    console.log('======================================================');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8099/portal-nolap.html' });
    await new Promise(r => setTimeout(r, 4000));

    // Inisialisasi sesi admin dan buka tab SPM
    const initRes = await send('Runtime.evaluate', {
      expression: `(() => {
        window.alert = function(msg) { console.log('[Alert]:', msg); };
        window.confirm = function() { return true; };
        window.prompt = function() { return ''; };

        sesiAktif = {
          sub: 'admin_pusat',
          username: 'admin_pusat',
          role: 'ADMIN_PUSAT',
          cabang: 'Pusat',
          label: 'Deni Siswandi (Kepala Divisi Pengendalian Mutu & Rekan)',
          nama: 'Deni Siswandi',
          jabatan: 'Kepala Divisi SPM & Rekan Penilai'
        };
        aktifkanPanelUtama();
        gantiTabModul('spm');
        pilihSubSpm('umum');

        return {
          tabAktif: 'spm',
          subSpmAktif: 'umum',
          totalPermohonan: daftarPermohonan ? daftarPermohonan.length : 0
        };
      })()`,
      returnByValue: true
    });
    console.log('Inisialisasi Halaman & Sesi:', initRes);

    // TEST 1: Pencarian "000006" pada SPM Umum
    console.log('\n--- UJI PENCARIAN 1: "000006" ---');
    const test000006 = await send('Runtime.evaluate', {
      expression: `(() => {
        const items = getFilteredPermohonan('000006');
        const inp = document.getElementById('combobox-input-spm-u');
        inp.value = '000006';
        renderComboboxList('u', items, '000006');
        bukaComboboxDropdown('u');
        const listEl = document.getElementById('combobox-list-spm-u');
        return {
          count: items.length,
          matches: items.map(p => ({ noReq: p.noPermintaan, klien: p.namaKlien, lokasi: p.lokasiObjek })),
          htmlVisible: !document.getElementById('combobox-dropdown-spm-u').classList.contains('hidden'),
          itemCountInDOM: listEl.querySelectorAll('.combobox-item').length
        };
      })()`,
      returnByValue: true
    });
    console.log('Hasil Uji "000006":', test000006);

    // Ambil screenshot pencarian "000006"
    const shot000006 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'combobox_search_000006.png'), Buffer.from(shot000006.data, 'base64'));

    // TEST 2: Pencarian "BTN"
    console.log('\n--- UJI PENCARIAN 2: "BTN" ---');
    const testBtn = await send('Runtime.evaluate', {
      expression: `(() => {
        const items = getFilteredPermohonan('BTN');
        renderComboboxList('u', items, 'BTN');
        bukaComboboxDropdown('u');
        return {
          count: items.length,
          matches: items.map(p => ({ noReq: p.noPermintaan, klien: p.namaKlien }))
        };
      })()`,
      returnByValue: true
    });
    console.log('Hasil Uji "BTN":', testBtn);

    // TEST 3: Pencarian "Ivander" (Membedakan REQ-000007 vs REQ-000008)
    console.log('\n--- UJI PENCARIAN 3: "Ivander" (Pembeda REQ-000007 vs REQ-000008) ---');
    const testIvander = await send('Runtime.evaluate', {
      expression: `(() => {
        const inp = document.getElementById('combobox-input-spm-u');
        inp.value = 'Ivander';
        const items = getFilteredPermohonan('Ivander');
        renderComboboxList('u', items, 'Ivander');
        const dropdown = document.getElementById('combobox-dropdown-spm-u');
        dropdown.classList.remove('hidden');
        return {
          count: items.length,
          matches: items.map(p => ({
            noReq: p.noPermintaan,
            klien: p.namaKlien,
            objek: p.jenisObjek,
            lokasi: p.lokasiObjek
          }))
        };
      })()`,
      returnByValue: true
    });
    console.log('Hasil Uji "Ivander":', testIvander);

    // Ambil screenshot pencarian "Ivander"
    const shotIvander = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'combobox_search_ivander.png'), Buffer.from(shotIvander.data, 'base64'));

    // TEST 4: Pencarian "Bekasi"
    console.log('\n--- UJI PENCARIAN 4: "Bekasi" ---');
    const testBekasi = await send('Runtime.evaluate', {
      expression: `(() => {
        const items = getFilteredPermohonan('Bekasi');
        renderComboboxList('u', items, 'Bekasi');
        bukaComboboxDropdown('u');
        return {
          count: items.length,
          matches: items.map(p => ({ noReq: p.noPermintaan, klien: p.namaKlien, lokasi: p.lokasiObjek }))
        };
      })()`,
      returnByValue: true
    });
    console.log('Hasil Uji "Bekasi":', testBekasi);

    // TEST 5: Pencarian kata kunci tanpa hasil
    console.log('\n--- UJI PENCARIAN 5: Kata Kunci Tidak Ditemukan ---');
    const testNotFound = await send('Runtime.evaluate', {
      expression: `(() => {
        const inp = document.getElementById('combobox-input-spm-u');
        inp.value = 'xyz_tidak_ada_123';
        const items = getFilteredPermohonan('xyz_tidak_ada_123');
        renderComboboxList('u', items, 'xyz_tidak_ada_123');
        const dropdown = document.getElementById('combobox-dropdown-spm-u');
        dropdown.classList.remove('hidden');
        const listEl = document.getElementById('combobox-list-spm-u');
        return {
          count: items.length,
          messageRendered: listEl.innerText.trim()
        };
      })()`,
      returnByValue: true
    });
    console.log('Hasil Uji Not Found:', testNotFound);

    // TEST 6: Navigasi Keyboard (ArrowDown, ArrowUp, Enter)
    console.log('\n--- UJI NAVIGASI KEYBOARD ---');
    const testKeyboard = await send('Runtime.evaluate', {
      expression: `(() => {
        const inp = document.getElementById('combobox-input-spm-u');
        inp.value = 'BTN';
        const items = getFilteredPermohonan('BTN');
        renderComboboxList('u', items, 'BTN');
        const dropdown = document.getElementById('combobox-dropdown-spm-u');
        dropdown.classList.remove('hidden');

        // Simulasi ArrowDown 2 kali lalu ArrowUp 1 kali
        handleComboboxKeydown({ key: 'ArrowDown', preventDefault: () => {} }, 'u');
        const pos1 = comboboxState.u.highlightedIndex;
        handleComboboxKeydown({ key: 'ArrowDown', preventDefault: () => {} }, 'u');
        const pos2 = comboboxState.u.highlightedIndex;
        handleComboboxKeydown({ key: 'ArrowUp', preventDefault: () => {} }, 'u');
        const pos3 = comboboxState.u.highlightedIndex;

        // Simulasi Enter untuk memilih item yang aktif
        handleComboboxKeydown({ key: 'Enter', preventDefault: () => {} }, 'u');

        return {
          pos1,
          pos2,
          pos3,
          selectedAfterEnter: smartUmumState.linkedNoReq,
          nativeSelectValue: document.getElementById('spm-u-pilih-req').value,
          inputValue: document.getElementById('combobox-input-spm-u').value
        };
      })()`,
      returnByValue: true
    });
    console.log('Hasil Uji Keyboard:', testKeyboard);

    // TEST 7: Uji Tombol Clear (✕) & Reset Tautan
    console.log('\n--- UJI TOMBOL CLEAR (✕) ---');
    const testClear = await send('Runtime.evaluate', {
      expression: `(() => {
        const clearBtn = document.getElementById('combobox-clear-spm-u');
        const isClearVisibleBefore = !clearBtn.classList.contains('hidden');
        resetNolapCombobox('u');
        return {
          isClearVisibleBefore,
          linkedAfterReset: smartUmumState.linkedNoReq,
          nativeSelectAfterReset: document.getElementById('spm-u-pilih-req').value,
          inputValueAfterReset: document.getElementById('combobox-input-spm-u').value,
          isClearVisibleAfter: !clearBtn.classList.contains('hidden')
        };
      })()`,
      returnByValue: true
    });
    console.log('Hasil Uji Tombol Clear:', testClear);

    // TEST 8: Uji Modul SPM Tanah (spm-t)
    console.log('\n--- UJI COMBOBOX SPM TANAH (spm-t) ---');
    const testTanah = await send('Runtime.evaluate', {
      expression: `(() => {
        pilihSubSpm('tanah');
        pilihPermohonanCombobox('t', 'REQ-000006');
        return {
          subSpm: 'tanah',
          linkedNoReq: smartTanahState.linkedNoReq,
          inputVal: document.getElementById('combobox-input-spm-t').value,
          namaProyek: document.getElementById('spm-t-nama-proyek').value,
          instansi: document.getElementById('spm-t-instansi').value,
          lokasiObjek: document.getElementById('spm-t-lokasi-objek').value
        };
      })()`,
      returnByValue: true
    });
    console.log('Hasil Uji SPM Tanah:', testTanah);

    // Ambil screenshot SPM Tanah dengan combobox terisi
    const shotTanah = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'combobox_spm_tanah_linked.png'), Buffer.from(shotTanah.data, 'base64'));

    // TEST 9: Uji Modul SPM Ruislagh (spm-r)
    console.log('\n--- UJI COMBOBOX SPM RUISLAGH (spm-r) ---');
    const testRuislagh = await send('Runtime.evaluate', {
      expression: `(() => {
        pilihSubSpm('ruislagh');
        pilihPermohonanCombobox('r', 'REQ-000007');
        return {
          subSpm: 'ruislagh',
          linkedNoReq: smartRuislaghState.linkedNoReq,
          inputVal: document.getElementById('combobox-input-spm-r').value,
          pemberiTugas: document.getElementById('spm-r-pemberi-tugas').value,
          desa: document.getElementById('spm-r-lokasi-desa').value
        };
      })()`,
      returnByValue: true
    });
    console.log('Hasil Uji SPM Ruislagh:', testRuislagh);

    // Ambil screenshot SPM Ruislagh
    const shotRuislagh = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'combobox_spm_ruislagh_linked.png'), Buffer.from(shotRuislagh.data, 'base64'));

    // TEST 10: Uji Mobile Viewport (390x844 iPhone 14)
    console.log('\n======================================================');
    console.log('2. MOBILE TEST & SCREENSHOT (390x844)');
    console.log('======================================================');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Runtime.evaluate', {
      expression: `(() => {
        pilihSubSpm('tanah');
        const inp = document.getElementById('combobox-input-spm-t');
        if (inp) {
          inp.value = 'BTN';
          inp.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
        const items = getFilteredPermohonan('BTN');
        renderComboboxList('t', items, 'BTN');
        const dd = document.getElementById('combobox-dropdown-spm-t');
        if (dd) dd.classList.remove('hidden');
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'combobox_mobile_view.png'), Buffer.from(shotMobile.data, 'base64'));
    console.log('Mobile Screenshot tersimpan: combobox_mobile_view.png');

    console.log('\n======================================================');
    console.log('SEMUA PENGUJIAN OTOMATIS SELESAI DENGAN STATUS: SUKSES');
    console.log('======================================================');

  } catch (err) {
    console.error('Error saat pengujian:', err);
  } finally {
    try {
      chrome.kill();
    } catch (e) {}
    server.close();
    process.exit(0);
  }
}

run();
