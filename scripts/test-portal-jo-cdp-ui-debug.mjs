import { spawn } from 'node:child_process';
import fs from 'node:fs';

const DEBUG_PORT = 9472;
const LOCAL_PORTAL_URL = 'http://127.0.0.1:8088/portal-penugasan-jo.html';

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    'about:blank'
  ]);

  let wsUrl = '';
  await new Promise((resolve, reject) => {
    chrome.stderr.on('data', data => {
      const match = data.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { wsUrl = match[1]; resolve(); }
    });
    setTimeout(() => { if (!wsUrl) reject(new Error('Timeout')); }, 5000);
  });

  const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
  const targetData = await targetRes.json();
  const ws = new WebSocket(targetData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const handlers = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.javascriptDialogOpening') {
      send('Page.handleJavaScriptDialog', { accept: true });
      return;
    }
    if (m.id && handlers.has(m.id)) {
      const cb = handlers.get(m.id);
      handlers.delete(m.id);
      cb(m);
    }
  };

  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      handlers.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result?.result?.value;
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: LOCAL_PORTAL_URL });
  await new Promise(r => setTimeout(r, 2000));

  await evaluate(`
    window.CURRENT_AUTH_SESSION = {
      sub: 'cabang_pdg',
      nama: 'Admin Cabang Padang',
      role: 'ADMIN_CABANG',
      wilayah: 'Padang',
      wilayahLabel: 'Kantor Cabang Padang',
      isCabang: true
    };
    inisialisasiModeAksesDariUrl();
  `);

  console.log('1. Setting to PROPERTY (Komprehensif)...');
  await evaluate(`
    document.getElementById('klasifikasi_jasa_penilaian').value = 'PROPERTY';
    evaluasiKewenanganWorkflowCabang();
  `);

  const state1 = await evaluate(`({
    warnClasses: document.getElementById('warning-kompetensi-cabang').className,
    radioMandiriDisabled: document.getElementById('alur_kerja_mandiri').disabled,
    currentModeAlur
  })`);
  console.log('State 1 (Komprehensif):', state1);

  console.log('\n2. Setting to PROPERTY_SIMPLE (Sederhana)...');
  await evaluate(`
    document.getElementById('klasifikasi_jasa_penilaian').value = 'PROPERTY_SIMPLE';
    evaluasiKewenanganWorkflowCabang();
    pilihModeAlur('PRIVATE_CABANG');
  `);

  const state2 = await evaluate(`({
    warnClasses: document.getElementById('warning-kompetensi-cabang').className,
    radioMandiriDisabled: document.getElementById('alur_kerja_mandiri').disabled,
    radioMandiriChecked: document.getElementById('alur_kerja_mandiri').checked,
    currentModeAlur
  })`);
  console.log('State 2 (Sederhana):', state2);

  ws.close();
  chrome.kill();
}

run().catch(console.error);
