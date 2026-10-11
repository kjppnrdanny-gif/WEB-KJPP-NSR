import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9270',
    '--no-sandbox',
    '--allow-file-access-from-files',
    '--disable-web-security',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9270/json/new?about:blank', { method: 'PUT' });
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
        cb(m.result || m.error);
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
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    const fileUrl = 'file:///' + path.join(ROOT_DIR, 'portal-nolap.html').replace(/\\/g, '/');
    await send('Page.navigate', { url: fileUrl });

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500));
      const res = await send('Runtime.evaluate', {
        expression: 'typeof inisialisasiSmartSpmUmum === "function"',
        returnByValue: true
      });
      if (res && res.result && res.result.value === true) break;
    }

    // Setup session and answers
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.alert = function() {};
        sesiAktif = { sub: 'admin_pusat', role: 'ADMIN_PUSAT', label: 'Deni Siswandi', cabang: 'Pusat' };
        aktifkanPanelUtama();
        gantiTabModul('spm');
        pilihSubSpm('umum');

        // Answer A10 YA to show risk badge
        onUmumAnswerChange('u_q_a10', 'YA');
        const a10Radio = document.querySelector('input[name="u_val_u_q_a10"][value="YA"]');
        if (a10Radio) a10Radio.checked = true;

        // Fill IRAC & Matriks
        const cIssue = document.getElementById('spm-u-irac-issue');
        if (cIssue) cIssue.value = 'Objek penilaian agunan memiliki riwayat proses balik nama dan batas fisik belum diverifikasi.';
        const cRule = document.getElementById('spm-u-irac-rule');
        if (cRule) cRule.value = 'SPI 103 (Lingkup Penugasan), SPI 104, KEPI Butir 4 (Integritas)';

        // Acceptance
        const kep = document.getElementById('spm-u-keputusan');
        if (kep) {
          kep.value = 'ACCEPT WITH MITIGATION';
          onUmumAcceptanceDecisionChange();
        }
        tetapkanApprovalSpmUmum('APPROVED');
      })()`
    });

    // Helper function to scroll element into view and take screenshot
    async function captureElement(elementId, filename) {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.getElementById('${elementId}');
          if (el) {
            const rect = el.getBoundingClientRect();
            window.scrollTo(0, window.pageYOffset + rect.top - 80);
          }
        })()`
      });
      await new Promise(r => setTimeout(r, 600));
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, filename), Buffer.from(ss.data, 'base64'));
      console.log(`Saved ${filename}`);
    }

    // 1. Capture Section A: Screening Umum
    await captureElement('sec-umum-a', 'smart_spm_sec_a_screening.png');

    // 2. Capture Section B: Category Questions (Agunan)
    await captureElement('sec-umum-b', 'smart_spm_sec_b_categories.png');

    // 3. Capture Section C: IRAC
    await captureElement('sec-umum-c', 'smart_spm_sec_c_irac.png');

    // 4. Capture Section D: Risk Matrix
    await captureElement('sec-umum-d', 'smart_spm_sec_d_matrix.png');

    // 5. Capture Section E: Client Acceptance
    await captureElement('sec-umum-e', 'smart_spm_sec_e_acceptance.png');

    // 6. Capture Section F: Approval
    await captureElement('sec-umum-f', 'smart_spm_sec_f_approval.png');

    // 7. Capture Mobile Questions
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await captureElement('sec-umum-a', 'smart_spm_umum_mobile_questions.png');

    console.log('All detailed section captures completed successfully!');
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

run();
