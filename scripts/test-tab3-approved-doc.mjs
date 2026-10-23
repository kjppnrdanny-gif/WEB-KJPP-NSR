import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const CHROME_PORT = 9565;
const PORT = 8920;
const URL = `http://127.0.0.1:${PORT}/portal-penugasan-jo.html`;

async function testApprovedDocInTab3() {
  const php = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'router.php'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-tab3-doc-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1440,1200',
    '--user-data-dir=' + tmpProfile,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));
  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
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

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  await send('Page.navigate', { url: URL });
  await new Promise(r => setTimeout(r, 2000));

  // Login KING
  await send('Runtime.evaluate', {
    expression: `(async () => {
      document.getElementById('input_token_auth').value = (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN");
      await verifikasiTokenLogin(null);
    })()`,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 800));

  // Injeksi proyek resmi approved ke antrean dan buka di Tab 3
  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const pApproved = {
        id: 'PJ-2026-TEST-APPROVED',
        nomor_lp: '0416/NSR/PN-APP/X/2026',
        nomor_adm: '0416/JO/NSR/X/2026',
        nama_klien: 'PT Bank Central Asia Tbk',
        debitur: 'PT Graha Megah Mandiri',
        kantor_wilayah: 'Kantor Pusat Jakarta',
        tanggal_surat: '2026-10-23',
        status: 'APPROVED',
        status_approval: 'APPROVED',
        jenis_laporan: 'APP',
        kategori_template: 'REAL_PROPERTY',
        tujuan_penilaian: 'Penjaminan Hutang / Agunan Kredit',
        dasar_nilai: 'Nilai Pasar & Nilai Likuidasi',
        pendekatan: ['Pasar', 'Biaya'],
        biaya_total: 'Rp 27.750.000',
        fee_penilaian: '25000000',
        ppn_nominal: '2750000',
        rekan_nama: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        rekan_izin: 'B-1.09.00581',
        penilai_nama: 'Deni Siswandi, ST., M.Sc., MAPPI (Cert.)',
        penilai_izin: 'P-1.12.00345'
      };

      projectDatabase.unshift(pApproved);
      bukaPratinjauProyek('PJ-2026-TEST-APPROVED');

      const rendered = document.getElementById('preview-rendered-area');
      const text = rendered ? rendered.innerText : '';

      return JSON.stringify({
        tab1Hidden: document.getElementById('tab-content-form')?.classList.contains('hidden'),
        tab2Hidden: document.getElementById('tab-content-dashboard')?.classList.contains('hidden'),
        tab3Visible: !document.getElementById('tab-3')?.classList.contains('hidden'),
        hasDok1SPK: text.includes('LINGKUP PENUGASAN') || text.includes('SPK'),
        hasNomorLp: text.includes('0416/NSR/PN-APP/X/2026'),
        hasDebitur: text.includes('PT Graha Megah Mandiri'),
        hasNo0001: text.includes('0001/'),
        renderedDocLength: text.length
      });
    })()`,
    returnByValue: true
  });

  const state = JSON.parse(evalRes.result?.value || '{}');
  console.log('Approved Document Rendering State in Tab 3:', state);

  // Capture screenshot of Tab 3
  await new Promise(r => setTimeout(r, 600));
  const snap = await send('Page.captureScreenshot', { format: 'png' });
  const fileSnap = path.join(ARTIFACT_DIR, 'bukti_jo_tab3_preview_9dokumen_clean.png');
  fs.writeFileSync(fileSnap, Buffer.from(snap.data, 'base64'));
  console.log('📸 Screenshot tersimpan:', fileSnap);

  chrome.kill();
  php.kill();
}

testApprovedDocInTab3().catch(console.error);
