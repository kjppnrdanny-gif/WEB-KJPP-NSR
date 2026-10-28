import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

function fetchProd() {
  return new Promise((resolve) => {
    https.get('https://kjppnanangrahayu.com/portal-operasional.html?v=' + Date.now(), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function verifyLive() {
  console.log('Menunggu sinkronisasi hosting produksi kjppnanangrahayu.com...');
  let synced = false;
  for (let i = 0; i < 15; i++) {
    const html = await fetchProd();
    if (html.includes('MASTER_TARIF_ALLOWANCE') && html.includes('TRANSPORTASI_BANDARA')) {
      synced = true;
      console.log(`✓ Sinkronisasi produksi BERHASIL pada detik ke-${i * 3}!`);
      break;
    }
    await new Promise(r => setTimeout(r, 3000));
  }

  if (!synced) {
    console.warn('Perhatian: Sinkronisasi masih dalam proses background hosting.');
  }

  console.log('\nMenjalankan Headless Chrome pada Produksi Live...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9499',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9499/json/new?about:blank', { method: 'PUT' });
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
    const send = (method, params = {}) => new Promise(r => {
      const id = msgId++;
      handlers.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

    console.log('Membuka https://kjppnanangrahayu.com/portal-operasional.html...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-operasional.html' });
    await new Promise(r => setTimeout(r, 3500));

    // Authenticate with Pusat token
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          localStorage.setItem('kjpp_token_auth', 'NSR-STAGE-MASTER-77');
          const m = document.getElementById('modal-auth');
          if (m) m.classList.add('hidden');
          window.alert = (...args) => console.log('ALERT:', ...args);
          window.confirm = () => true;
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Evaluate live Master Tarif & Calculator on Production
    const evalProd = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const hasMaster = typeof MASTER_TARIF_ALLOWANCE !== 'undefined';
          const selWil = document.getElementById('survey_wilayah');

          // Coba kalkulator live di produksi
          if (hasMaster && selWil) {
            document.getElementById('tbody-survey-personal').innerHTML = '';
            document.getElementById('tbody-survey-kolektif').innerHTML = '';

            selWil.value = 'JAWA_BARAT';
            tanganiPerubahanWilayah();

            // Reviewer Jabar (260.000) x 2 Org x 3 Hari = 1.560.000
            tambahBarisPersonalSurvey('REVIEWER', { jumlahPersonel: 2, durasi: 3 });

            // Retail Freelance (150.000) x 1 Org x 10 Titik = 1.500.000
            tambahBarisPersonalSurvey('RETAIL_FREELANCE', { jumlahPersonel: 1, durasi: 10 });

            // Transportasi Bandara (570.000) x 2 Paket = 1.140.000
            tambahBarisTransportasiBandara();
            const trB = document.querySelector('#tbody-survey-kolektif tr');
            if (trB) trB.querySelector('.item-volume').value = '2';

            hitungSemuaTotal();
          }

          return {
            hasMaster,
            zonasiLabel: selWil?.options[selWil.selectedIndex]?.text,
            subPersonal: document.getElementById('label-subtotal-personal')?.innerText,
            subKolektif: document.getElementById('label-subtotal-kolektif')?.innerText,
            grandTotal: document.getElementById('label-grand-total')?.innerText,
            terbilang: document.getElementById('label-terbilang')?.innerText
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Evaluasi Live Produksi:', JSON.stringify(evalProd.result?.value, null, 2));

    await new Promise(r => setTimeout(r, 1000));
    const shotProd = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_allowance_calculator.png'), Buffer.from(shotProd.data, 'base64'));
    console.log('✓ Screenshot disimpan: live_prod_allowance_calculator.png');

    // Mobile viewport screenshot
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 1000));
    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_allowance_mobile.png'), Buffer.from(shotMobile.data, 'base64'));
    console.log('✓ Screenshot disimpan: live_prod_allowance_mobile.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

verifyLive().catch(console.error);
