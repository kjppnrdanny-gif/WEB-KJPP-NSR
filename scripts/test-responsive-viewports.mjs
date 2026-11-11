import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 8192;
const DEBUG_PORT = 9292;
const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5b357e59-98db-42c8-a216-3b795e1f1b2d';

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const localFile = path.join(ROOT_DIR, reqPath.startsWith('/') ? reqPath.slice(1) : reqPath);
  if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
    const ext = path.extname(localFile);
    const mime = ext === '.html' ? 'text/html' :
                 ext === '.js' || ext === '.mjs' ? 'application/javascript' :
                 ext === '.css' ? 'text/css' :
                 ext === '.png' ? 'image/png' :
                 ext === '.svg' ? 'image/svg+xml' : 'text/plain';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(localFile).pipe(res);
    return;
  }
  res.writeHead(404);
  res.end('Not Found');
});

await new Promise(r => server.listen(PORT, r));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_resp_' + Date.now());

const chromeProc = spawn(chromePath, [
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${userDataDir}`,
  '--window-size=1280,900',
  'about:blank'
]);

try {
  await new Promise(r => setTimeout(r, 1500));
  const tRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tData = await tRes.json();
  const ws = new globalThis.WebSocket(tData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === msgId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 }
  ];

  for (const vp of viewports) {
    console.log(`\n=== TESTING VIEWPORT: ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ===`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.name === 'mobile'
    });

    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    await new Promise(r => setTimeout(r, 2000));

    const metrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const alur = document.getElementById('alur-penugasan-sop');
        const litbang = document.getElementById('litbang-metodologi');
        const dasarHukum = document.getElementById('dasar-hukum');

        return {
          clientWidth: docWidth,
          scrollWidth: scrollWidth,
          hasHorizontalOverflow: scrollWidth > docWidth,
          alurWidth: alur?.offsetWidth,
          litbangWidth: litbang?.offsetWidth,
          dasarHukumWidth: dasarHukum?.offsetWidth
        };
      })()`,
      returnByValue: true
    });

    console.log('Metrics:', metrics.result.value);

    // Capture screenshot of the 3 sections on mobile
    if (vp.name === 'mobile') {
      await send('Runtime.evaluate', {
        expression: `document.getElementById('alur-penugasan-sop')?.scrollIntoView({ behavior: 'instant', block: 'start' });`
      });
      await new Promise(r => setTimeout(r, 600));
      const ss1 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_alur_penugasan.png'), Buffer.from(ss1.data, 'base64'));

      await send('Runtime.evaluate', {
        expression: `document.getElementById('litbang-metodologi')?.scrollIntoView({ behavior: 'instant', block: 'start' });`
      });
      await new Promise(r => setTimeout(r, 600));
      const ss2 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_litbang_metodologi.png'), Buffer.from(ss2.data, 'base64'));

      await send('Runtime.evaluate', {
        expression: `document.getElementById('dasar-hukum')?.scrollIntoView({ behavior: 'instant', block: 'start' });`
      });
      await new Promise(r => setTimeout(r, 600));
      const ss3 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_dasar_hukum.png'), Buffer.from(ss3.data, 'base64'));
      console.log('Saved mobile screenshots in artifact dir.');
    }
  }

  ws.close();
} finally {
  chromeProc.kill();
  server.close();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
}
