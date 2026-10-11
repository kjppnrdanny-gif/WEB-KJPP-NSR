import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const fileUrl = 'file:///D:/WEB%20KJPP%20NSR_Compro%20new%20ver/kjpp-nsr-netlify-production/portal-nolap.html';

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error('No chrome found');
}

async function run() {
  console.log('--- STARTING VERIFY & CAPTURE HOTFIX ARROW ---');
  const chromePath = findChrome();
  const chromeProc = spawn(chromePath, [
    '--remote-debugging-port=9299',
    '--headless=new',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 1200));

  const targetRes = await fetch('http://127.0.0.1:9299/json/new?about:blank', { method: 'PUT' });
  const targetData = await targetRes.json();
  const ws = new WebSocket(targetData.webSocketDebuggerUrl);

  let id = 1;
  const handlers = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && handlers.has(m.id)) {
      const cb = handlers.get(m.id);
      handlers.delete(m.id);
      if (m.error) {
        console.error('CDP Error for ID', m.id, m.error);
        cb.reject(new Error(m.error.message));
      } else {
        cb.resolve(m.result);
      }
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    handlers.set(curId, { resolve, reject });
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  // Desktop (1440x900)
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: fileUrl });
  await new Promise(r => setTimeout(r, 1500));

  // Authenticate & activate SPM
  const init = await send('Runtime.evaluate', {
    expression: `(() => {
      window.alert = function() {};
      window.confirm = function() { return true; };

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
      pilihSubSpm('ruislagh');

      const el = document.getElementById('box-banner-regulasi-ruislagh');
      const text = document.getElementById('text-regulasi-dinamis-ruislagh');
      return {
        hasEl: !!el,
        boxVisible: el ? !el.closest('.hidden') : false,
        text: text ? text.innerText : ''
      };
    })()`,
    returnByValue: true
  });
  console.log('Init check:', init.result.value);

  // Set Kepentingan Desa
  await send('Runtime.evaluate', {
    expression: `(() => {
      const sel = document.getElementById('spm-r-jalur-ruislagh');
      if (sel) {
        sel.value = 'KEPENTINGAN_DESA';
        onRuislaghJalurChange();
      }
      const el = document.getElementById('box-banner-regulasi-ruislagh');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`
  });
  await new Promise(r => setTimeout(r, 300));

  const desaText = await send('Runtime.evaluate', {
    expression: `document.getElementById('text-regulasi-dinamis-ruislagh')?.innerText || ''`,
    returnByValue: true
  });
  console.log('Kepentingan Desa text:', desaText.result.value);

  const clipDesktop = await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('box-banner-regulasi-ruislagh');
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    })()`,
    returnByValue: true
  });
  console.log('Desktop clip:', clipDesktop.result.value);

  const ssDesktop = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { ...clipDesktop.result.value, scale: 1 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'hotfix_arrow_banner_desa_desktop.png'), Buffer.from(ssDesktop.data, 'base64'));
  console.log('✓ Saved hotfix_arrow_banner_desa_desktop.png');

  // Set Swasta
  await send('Runtime.evaluate', {
    expression: `(() => {
      const sel = document.getElementById('spm-r-jalur-ruislagh');
      if (sel) {
        sel.value = 'BUKAN_KEPENTINGAN_UMUM';
        onRuislaghJalurChange();
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 300));

  const ssSwasta = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { ...clipDesktop.result.value, scale: 1 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'hotfix_arrow_banner_swasta_desktop.png'), Buffer.from(ssSwasta.data, 'base64'));
  console.log('✓ Saved hotfix_arrow_banner_swasta_desktop.png');

  // Tablet (768x1024)
  console.log('\nTablet Viewport (768x1024):');
  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 2, mobile: false });
  await new Promise(r => setTimeout(r, 400));
  await send('Runtime.evaluate', {
    expression: `(() => {
      const sel = document.getElementById('spm-r-jalur-ruislagh');
      if (sel) {
        sel.value = 'KEPENTINGAN_DESA';
        onRuislaghJalurChange();
      }
      const el = document.getElementById('box-banner-regulasi-ruislagh');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  const clipTablet = await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('box-banner-regulasi-ruislagh');
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    })()`,
    returnByValue: true
  });

  const ssTablet = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { ...clipTablet.result.value, scale: 2 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'hotfix_arrow_banner_desa_tablet.png'), Buffer.from(ssTablet.data, 'base64'));
  console.log('✓ Saved hotfix_arrow_banner_desa_tablet.png');

  // Mobile (390x844)
  console.log('\nMobile Viewport (390x844):');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 400));
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('box-banner-regulasi-ruislagh');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  const clipMobile = await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('box-banner-regulasi-ruislagh');
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    })()`,
    returnByValue: true
  });

  const ssMobile = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { ...clipMobile.result.value, scale: 2 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'hotfix_arrow_banner_desa_mobile.png'), Buffer.from(ssMobile.data, 'base64'));
  console.log('✓ Saved hotfix_arrow_banner_desa_mobile.png');

  try { await send('Browser.close'); } catch (_) {}
  try { chromeProc.kill(); } catch (_) {}
  console.log('\n✅ ALL CAPTURES & CHECKS FINISHED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
