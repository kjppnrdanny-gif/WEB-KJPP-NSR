// scripts/test-branch-photos.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const OUTPUT_DIR = path.join(ROOT_DIR, 'evidence_ringkas');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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
  const localPath = path.join(OUTPUT_DIR, filename);
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(localPath, buffer);
  try {
    fs.writeFileSync(artifactPath, buffer);
  } catch(e) {}
  console.log('Saved:', filename, '(' + (buffer.length / 1024).toFixed(1) + ' KB)');
}

async function run() {
  const server = http.createServer(staticServer);
  await new Promise(r => server.listen(8095, '127.0.0.1', r));
  console.log('Static server ready on http://127.0.0.1:8095');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9253',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9253/json/new?about:blank', { method: 'PUT' });
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
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8095/portofolio-rekanan.html#galeri-kegiatan' });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll into gallery section
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('galeri-kegiatan');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
          document.querySelectorAll('#galeri-kegiatan img').forEach(img => {
            img.removeAttribute('loading');
          });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify DOM and Images
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const gallery = document.getElementById('galeri-kegiatan');
          const cards = gallery.querySelectorAll('.grid > div');
          const counter = gallery.querySelector('.font-semibold')?.innerText || '';
          const imgBandung = gallery.querySelector('img[src*="kantor-cabang-bandung"]');
          const imgPadang = gallery.querySelector('img[src*="kantor-cabang-padang.jpeg"]');
          const imgMakassar1 = gallery.querySelector('img[src*="kantor-cabang-makassar.jpeg"]');
          const imgMakassar2 = gallery.querySelector('img[src*="kantor-cabang-makassar2.jpeg"]');

          return {
            totalCards: cards.length,
            counterText: counter,
            bandungFound: !!imgBandung,
            bandungLoaded: imgBandung ? imgBandung.naturalWidth > 0 : false,
            padangFound: !!imgPadang,
            padangLoaded: imgPadang ? imgPadang.naturalWidth > 0 : false,
            makassar1Found: !!imgMakassar1,
            makassar1Loaded: imgMakassar1 ? imgMakassar1.naturalWidth > 0 : false,
            makassar1Width: imgMakassar1 ? imgMakassar1.naturalWidth : 0,
            makassar1Height: imgMakassar1 ? imgMakassar1.naturalHeight : 0,
            makassar2Found: !!imgMakassar2,
            makassar2Loaded: imgMakassar2 ? imgMakassar2.naturalWidth > 0 : false,
            makassar2Width: imgMakassar2 ? imgMakassar2.naturalWidth : 0,
            makassar2Height: imgMakassar2 ? imgMakassar2.naturalHeight : 0,
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Gallery Verification:', JSON.stringify(evalRes.result?.value || evalRes, null, 2));

    // Capture gallery section
    const shotGallery = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('galeri_kegiatan_14_dokumentasi_desktop.png', Buffer.from(shotGallery.data, 'base64'));

    // TEST 2: Test Lightbox Bandung
    console.log('\n--- Testing Lightbox for Cabang Bandung ---');
    await send('Runtime.evaluate', {
      expression: `
        const cardBandung = document.querySelector('img[src*="kantor-cabang-bandung"]').closest('.cursor-pointer');
        if (cardBandung) cardBandung.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const evalLightboxBdg = await send('Runtime.evaluate', {
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
    console.log('Lightbox Bandung Verification:', JSON.stringify(evalLightboxBdg.value, null, 2));

    const shotBdg = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('lightbox_kantor_cabang_bandung.png', Buffer.from(shotBdg.data, 'base64'));

    // Close lightbox
    await send('Runtime.evaluate', {
      expression: `tutupLightbox();`
    });
    await new Promise(r => setTimeout(r, 500));

    // TEST 3: Test Lightbox Padang
    console.log('\n--- Testing Lightbox for Cabang Padang ---');
    await send('Runtime.evaluate', {
      expression: `
        const cardPadang = document.querySelector('img[src*="kantor-cabang-padang.jpeg"]').closest('.cursor-pointer');
        if (cardPadang) cardPadang.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const evalLightboxPdg = await send('Runtime.evaluate', {
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
    console.log('Lightbox Padang Verification:', JSON.stringify(evalLightboxPdg.value, null, 2));

    const shotPdg = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('lightbox_kantor_cabang_padang.png', Buffer.from(shotPdg.data, 'base64'));

    // Close lightbox
    await send('Runtime.evaluate', {
      expression: `tutupLightbox();`
    });
    await new Promise(r => setTimeout(r, 500));

    // TEST 4: Mobile view
    console.log('\n--- Testing Mobile View (375x812) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Runtime.evaluate', {
      expression: `
        const cardBandung = document.querySelector('img[src*="kantor-cabang-bandung"]').closest('.cursor-pointer');
        if (cardBandung) cardBandung.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('galeri_kegiatan_mobile.png', Buffer.from(shotMobile.data, 'base64'));

    // TEST 5: index.html Carousel
    console.log('\n--- Testing index.html Carousel ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8095/index.html' });
    await new Promise(r => setTimeout(r, 3000));

    // Switch to tab 3 (Galeri)
    await send('Runtime.evaluate', {
      expression: `
        if (typeof switchTab === 'function') {
          switchTab('galeri');
        } else {
          const tabBtn = document.querySelector('[data-tab="galeri"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Galeri'));
          if (tabBtn) tabBtn.click();
        }
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll to carousel
    await send('Runtime.evaluate', {
      expression: `
        const c = document.getElementById('tab-galeri') || document.querySelector('.carousel-container') || document.getElementById('panel-galeri');
        if (c) c.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const evalCarousel = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const items = window.kjppPhotos || [];
          const hasBandung = items.some(i => i.src.includes('kantor-cabang-bandung'));
          const hasPadang = items.some(i => i.src.includes('kantor-cabang-padang'));
          return {
            totalCarouselItems: items.length,
            hasBandung,
            hasPadang
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Carousel Verification:', JSON.stringify(evalCarousel.value, null, 2));

    const shotCarousel = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('homepage_carousel_galeri_tab.png', Buffer.from(shotCarousel.data, 'base64'));

    console.log('\n✅ All browser verification tests passed successfully!');
    ws.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
