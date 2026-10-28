import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const ROOT_DIR = path.resolve('.');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8991;
const CDP_PORT = 9477;

// Start a lightweight local static server for preview file
const server = http.createServer((req, res) => {
  const filePath = path.join(ROOT_DIR, req.url === '/' ? 'preview-diagram-opini-nsr.html' : req.url);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
    res.end(content);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function waitForChrome(port, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return true;
    } catch (_) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  throw new Error(`Chrome failed to open debug port ${port}`);
}

server.listen(PORT, async () => {
  console.log(`Local preview server listening on port ${PORT}...`);

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await waitForChrome(CDP_PORT);

    const targetRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' });
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 980, deviceScaleFactor: 1, mobile: false });

    console.log('Navigasi ke pratinjau diagram...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/preview-diagram-opini-nsr.html` });
    await new Promise(r => setTimeout(r, 3000));

    // List of 4 mandatory viewports
    const viewports = [
      { name: 'desktop_1920', label: 'Desktop PC (1920x1080)', width: 1920, height: 1080, mobile: false, filename: 'bukti_responsive_desktop_1920.png' },
      { name: 'laptop_1366', label: 'Laptop Standar (1366x768)', width: 1366, height: 768, mobile: false, filename: 'bukti_responsive_laptop_1366.png' },
      { name: 'tablet_768', label: 'Tablet iPad Portrait (768x1024)', width: 768, height: 1024, mobile: false, filename: 'bukti_responsive_tablet_768.png' },
      { name: 'mobile_390', label: 'Mobile Smartphone (390x844)', width: 390, height: 844, mobile: true, filename: 'bukti_responsive_mobile_390.png' }
    ];

    for (const vp of viewports) {
      console.log(`\n--- Menguji Viewport: ${vp.label} ---`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });
      await new Promise(r => setTimeout(r, 800));

      // Check horizontal overflow
      const overflowCheck = await send('Runtime.evaluate', {
        expression: `
          ({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
            bodyWidth: document.body.clientWidth
          })
        `,
        returnByValue: true
      });
      console.log(`  Statistik: Window=${vp.width}px, ScrollWidth=${overflowCheck.value?.scrollWidth}px, HasScroll=${overflowCheck.value?.hasHorizontalScroll}`);

      const ss = await send('Page.captureScreenshot', { format: 'png' });
      const targetFile = path.join(ARTIFACT_DIR, vp.filename);
      fs.writeFileSync(targetFile, Buffer.from(ss.data, 'base64'));
      console.log(`  ✔ Disimpan: ${targetFile}`);
    }

    // Also update bukti_preview_diagram_opini_nsr.png and clean
    const defaultDesktopFile = path.join(ARTIFACT_DIR, 'bukti_preview_diagram_opini_nsr.png');
    const defaultCleanFile = path.join(ARTIFACT_DIR, 'bukti_preview_diagram_opini_nsr_clean.png');
    fs.copyFileSync(path.join(ARTIFACT_DIR, 'bukti_responsive_desktop_1920.png'), defaultDesktopFile);
    fs.copyFileSync(path.join(ARTIFACT_DIR, 'bukti_responsive_desktop_1920.png'), defaultCleanFile);

    ws.close();
    chrome.kill();
    server.close();
    console.log('\n🎉 Seluruh 4 pengujian resolusi multi-device berhasil ditangkap!');
    process.exit(0);

  } catch (err) {
    console.error('Error saat capture screenshot prototipe:', err);
    chrome.kill();
    server.close();
    process.exit(1);
  }
});
