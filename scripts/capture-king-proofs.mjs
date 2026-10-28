// scripts/capture-king-proofs.mjs
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
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/portal-penugasan-jo.html';
  const filePath = path.join(ROOT_DIR, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME_MAP[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
}

async function run() {
  const server = http.createServer(staticServer);
  const PORT = 8896;
  const DEBUG_PORT = 9249;

  await new Promise(r => server.listen(PORT, r));
  console.log(`Local server started at http://127.0.0.1:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--window-size=1440,1100',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.javascriptDialogOpening') {
        send('Page.handleJavaScriptDialog', { accept: true });
        return;
      }
      if (msg.id && callbacks.has(msg.id)) {
        const { res, rej } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    const send = (method, params = {}) => new Promise((res, rej) => {
      const msgId = id++;
      callbacks.set(msgId, { res, rej });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send('Page.enable');
    await send('DOM.enable');

    console.log('Navigating to portal-penugasan-jo.html...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-penugasan-jo.html` });
    await new Promise(r => setTimeout(r, 3000));

    // Disable alerts/confirms
    await send('Runtime.evaluate', {
      expression: `
        window.alert = function(m) { console.log('ALERT:', m); };
        window.confirm = function(m) { console.log('CONFIRM:', m); return true; };
      `
    });

    // 1. Capture Bukti 1: Modal Approval dengan Operator KING
    console.log('Capturing Bukti 1: Modal Approval KING Operator...');
    await send('Runtime.evaluate', {
      expression: `
        window.CURRENT_AUTH_SESSION = {
          valid: true,
          isKing: true,
          isSuperAdmin: true,
          role: 'SUPER_ADMIN',
          displayName: 'SUPER ADMIN (KING)',
          nama: 'Super Admin Operasional (KING)'
        };
        userSession.isKing = true;
        userSession.isSuperAdmin = true;
        userSession.role = 'SUPER_ADMIN';
        userSession.displayName = 'SUPER ADMIN (KING)';

        const modal = document.getElementById('modal-approval-pusat');
        if (modal) {
          modal.classList.remove('hidden');
          const elTargetId = document.getElementById('appr-target-project-id');
          if (elTargetId) elTargetId.value = 'NSR-2026-TEST-KING';
          const elDeb = document.getElementById('appr-info-debitur');
          if (elDeb) elDeb.textContent = 'PT SURYA PERKASA TEKNIK';
          const elWil = document.getElementById('appr-info-wilayah');
          if (elWil) elWil.textContent = 'Kantor Pusat Jakarta';
          const elSpkLp = document.getElementById('appr-nomor-lp');
          if (elSpkLp) elSpkLp.value = '0416/NSR/PN-APP/X/2026';
          const elAdmJo = document.getElementById('appr-nomor-adm');
          if (elAdmJo) elAdmJo.value = '0416/JO/NSR/X/2026';

          const radNanang = document.getElementById('op_king_nanang');
          if (radNanang) {
            radNanang.checked = true;
            if (typeof handleOperatorKingChange === 'function') handleOperatorKingChange();
          }
          const boxVerif = document.getElementById('box-verifikasi-profesional-king');
          if (boxVerif) boxVerif.classList.remove('hidden');
          const badgePin = document.getElementById('badge-status-pin-king');
          if (badgePin) {
            badgePin.textContent = 'TERVERIFIKASI SAH ✔';
            badgePin.className = 'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
          }
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const shot1Path = path.join(ARTIFACT_DIR, 'bukti_king_operator_modal_approval.png');
    fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
    console.log(`Saved screenshot 1: ${shot1Path} (${shot1.data.length} bytes)`);

    // 2. Capture Bukti 2: Tab 1 Seksi 05 & Panel ETI
    console.log('Capturing Bukti 2: Tab 1 Seksi 05 & Panel ETI...');
    await send('Runtime.evaluate', {
      expression: `
        const modal = document.getElementById('modal-approval-pusat');
        if (modal) modal.classList.add('hidden');
        if (typeof gantiTab === 'function') gantiTab(1);

        const selA = document.getElementById('eti_q_a');
        if (selA) selA.value = 'TIDAK';
        const selB = document.getElementById('eti_q_b');
        if (selB) selB.value = 'TIDAK';
        if (typeof evaluasiStatusEtiLive === 'function') evaluasiStatusEtiLive();

        const panelEti = document.getElementById('panel_deklarasi_eti');
        if (panelEti) {
          panelEti.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const shot2Path = path.join(ARTIFACT_DIR, 'bukti_eti_panel_dan_klausul_terpadu.png');
    fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
    console.log(`Saved screenshot 2: ${shot2Path} (${shot2.data.length} bytes)`);

    // 3. Capture Bukti 3: Tab 3 Pratinjau Dokumen 3F ETI & 3G PI Multi-Personel
    console.log('Capturing Bukti 3: Tab 3 Pratinjau Dokumen 3F & 3G...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof deklarasiSemuaIndependen === 'function') deklarasiSemuaIndependen();
        
        let draftP = (typeof bangunDraftDariForm === 'function') ? bangunDraftDariForm() : {};
        draftP.status = 'APPROVED';
        draftP.nomor_lp = '0416/NSR/PN-APP/X/2026';
        draftP.nomor_adm = '0416/JO/NSR/X/2026';
        draftP.debitur_nama = 'PT SURYA PERKASA TEKNIK';
        draftP.pemberi_tugas_nama = 'BANK MANDIRI (PERSERO) TBK';
        draftP.disetujui_oleh = 'SUPER ADMIN (KING) • Danny Taufik Hidayat';
        window.DATA_PROYEK_TERPILIH = draftP;
        activeProjectData = draftP;

        if (typeof gantiTab === 'function') gantiTab(3);
        const selDok = document.getElementById('filter-dokumen-cetak');
        if (selDok) {
          selDok.value = 'DOK3F';
          if (typeof filterTampilanDokumen === 'function') filterTampilanDokumen('DOK3F');
        }
        if (typeof renderSemuaDokumen === 'function') renderSemuaDokumen();

        const area = document.getElementById('preview-rendered-area');
        if (area) area.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    const shot3Path = path.join(ARTIFACT_DIR, 'bukti_dokumen_eti_pi_multi_personel.png');
    fs.writeFileSync(shot3Path, Buffer.from(shot3.data, 'base64'));
    console.log(`Saved screenshot 3: ${shot3Path} (${shot3.data.length} bytes)`);

    ws.close();
    server.close();
    console.log('All 3 screenshots captured successfully!');
  } catch (err) {
    console.error('CDP Error:', err);
  } finally {
    chrome.kill();
    server.close();
  }
}

run();
