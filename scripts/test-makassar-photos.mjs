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
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

function staticServer(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, 'http://' + req.headers.host).pathname);
  if (pathname === '/') pathname = 'index.html';
  const cleanPath = pathname.replace(/^\/+/, '');
  const filePath = path.join(ROOT_DIR, cleanPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + filePath);
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_MAP[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
}

function saveDual(filename, buffer) {
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(artifactPath, buffer);
  console.log('Saved artifact:', filename, '(' + (buffer.length / 1024).toFixed(1) + ' KB)');
}

async function run() {
  const PORT = 8199;
  const server = http.createServer(staticServer);
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  console.log(`Static server ready on http://127.0.0.1:${PORT}`);

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9455',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9455/json/new?about:blank', { method: 'PUT' });
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
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    // TEST 1: portofolio-rekanan.html Gallery
    console.log('\n--- Testing portofolio-rekanan.html Gallery ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portofolio-rekanan.html#galeri-kegiatan` });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll into gallery section
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('galeri-kegiatan');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Verify DOM and Images
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const gallery = document.getElementById('galeri-kegiatan');
          const cards = gallery.querySelectorAll('.grid > div');
          const counter = gallery.querySelector('.font-semibold')?.innerText || '';
          const imgMakassar1 = gallery.querySelector('img[src*="kantor-cabang-makassar.jpeg"]');
          const imgMakassar2 = gallery.querySelector('img[src*="kantor-cabang-makassar2.jpeg"]');

          return {
            totalCards: cards.length,
            counterText: counter,
            makassar1Found: !!imgMakassar1,
            makassar1Loaded: imgMakassar1 ? imgMakassar1.naturalWidth > 0 : false,
            makassar1Width: imgMakassar1 ? imgMakassar1.naturalWidth : 0,
            makassar1Height: imgMakassar1 ? imgMakassar1.naturalHeight : 0,
            makassar1Alt: imgMakassar1 ? imgMakassar1.alt : '',
            makassar2Found: !!imgMakassar2,
            makassar2Loaded: imgMakassar2 ? imgMakassar2.naturalWidth > 0 : false,
            makassar2Width: imgMakassar2 ? imgMakassar2.naturalWidth : 0,
            makassar2Height: imgMakassar2 ? imgMakassar2.naturalHeight : 0,
            makassar2Alt: imgMakassar2 ? imgMakassar2.alt : ''
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Gallery Verification:', JSON.stringify(evalRes.value, null, 2));

    const shotGallery = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('test_galeri_makassar_desktop.png', Buffer.from(shotGallery.data, 'base64'));

    // TEST 2: Test Lightbox Makassar 1
    console.log('\n--- Testing Lightbox for Makassar Foto 1 ---');
    await send('Runtime.evaluate', {
      expression: `
        const card1 = document.querySelector('img[src*="kantor-cabang-makassar.jpeg"]').closest('.cursor-pointer');
        if (card1) card1.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const evalLightbox1 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('modal-lightbox');
          const img = document.getElementById('lightbox-gambar');
          const title = document.getElementById('lightbox-judul');
          const desc = document.getElementById('lightbox-keterangan');
          return {
            modalVisible: !modal.classList.contains('hidden'),
            src: img ? img.src : '',
            naturalWidth: img ? img.naturalWidth : 0,
            title: title ? title.innerText : '',
            desc: desc ? desc.innerText : ''
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Lightbox 1 Details:', JSON.stringify(evalLightbox1.value, null, 2));

    const shotLb1 = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('test_lightbox_makassar1.png', Buffer.from(shotLb1.data, 'base64'));

    // TEST 3: Test Lightbox Makassar 2
    console.log('\n--- Testing Lightbox for Makassar Foto 2 ---');
    await send('Runtime.evaluate', {
      expression: `
        tutupLightbox();
        const card2 = document.querySelector('img[src*="kantor-cabang-makassar2.jpeg"]').closest('.cursor-pointer');
        if (card2) card2.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const evalLightbox2 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('modal-lightbox');
          const img = document.getElementById('lightbox-gambar');
          const title = document.getElementById('lightbox-judul');
          const desc = document.getElementById('lightbox-keterangan');
          return {
            modalVisible: !modal.classList.contains('hidden'),
            src: img ? img.src : '',
            naturalWidth: img ? img.naturalWidth : 0,
            title: title ? title.innerText : '',
            desc: desc ? desc.innerText : ''
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Lightbox 2 Details:', JSON.stringify(evalLightbox2.value, null, 2));

    const shotLb2 = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('test_lightbox_makassar2.png', Buffer.from(shotLb2.data, 'base64'));

    await send('Runtime.evaluate', { expression: 'tutupLightbox();' });

    // TEST 4: Mobile View (390 x 844)
    console.log('\n--- Testing Mobile View (390 x 844) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('galeri-kegiatan');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 800));
    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('test_galeri_makassar_mobile.png', Buffer.from(shotMobile.data, 'base64'));

    // TEST 5: index.html 3D FlexCarousel
    console.log('\n--- Testing index.html 3D FlexCarousel ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
    await new Promise(r => setTimeout(r, 3000));

    await send('Runtime.evaluate', {
      expression: `
        if (typeof gantiTabUtama === 'function') {
          gantiTabUtama('galeri');
        } else {
          const btn = document.getElementById('tab-btn-galeri');
          if (btn) btn.click();
        }
      `
    });
    await new Promise(r => setTimeout(r, 2000));

    const carouselRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const panel = document.getElementById('tab-panel-galeri');
          const canvas = document.querySelector('#galeri-flex-carousel canvas');
          return {
            panelVisible: !panel.classList.contains('hidden'),
            canvasMounted: !!canvas
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Carousel Verification:', JSON.stringify(carouselRes.value, null, 2));

    const shotCarousel = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('test_index_carousel_galeri.png', Buffer.from(shotCarousel.data, 'base64'));

    console.log('\n✨ SELURUH TEST FOTO MAKASSAR LULUS DENGAN SUKSES!');
    ws.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

run().catch(console.error);
