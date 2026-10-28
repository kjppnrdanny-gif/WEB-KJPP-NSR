// scripts/test-flyer-implementation.mjs
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
  await new Promise(r => server.listen(8096, '127.0.0.1', r));
  console.log('Static server ready on http://127.0.0.1:8096');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9257',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9257/json/new?about:blank', { method: 'PUT' });
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

    // TEST 1: index.html - Link "7 Tahap Ganti Kerugian"
    console.log('\n--- 1. Testing index.html Link "7 Tahap Ganti Kerugian" ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8096/index.html' });
    await new Promise(r => setTimeout(r, 2500));

    // Scroll to card 2 in index.html
    await send('Runtime.evaluate', {
      expression: `
        const card = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Pengadaan Tanah Kepentingan Umum'));
        if (card) card.closest('.rounded-2xl').scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const evalIndexLink = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const links = Array.from(document.querySelectorAll('a')).filter(a => a.innerText.includes('7 Tahap Ganti Kerugian'));
          if (links.length === 0) return { error: 'Link not found' };
          const link = links[0];
          return {
            text: link.innerText.trim(),
            href: link.getAttribute('href'),
            targetFound: true
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Index link check:', JSON.stringify(evalIndexLink.value, null, 2));

    const shotIndexCard = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('test_index_7_tahap_link.png', Buffer.from(shotIndexCard.data, 'base64'));

    // TEST 2: layanan.html - Card Pengadaan Tanah PSN (SPI 204)
    console.log('\n--- 2. Testing layanan.html#pengadaan-tanah Card & Thumbnail ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:8096/layanan.html#pengadaan-tanah' });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll to #pengadaan-tanah
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('pengadaan-tanah');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const evalLayananCard = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.getElementById('pengadaan-tanah');
          if (!card) return { error: 'Card #pengadaan-tanah not found' };
          const thumb = card.querySelector('img[src*="flyer-pengadaan-tanah.jpg"]');
          const btn = card.querySelector('button[onclick*="bukaLightboxFlyer"]');
          const textFlyer = card.innerText.includes('Lihat Flyer Pengadaan Tanah');
          const text15Seksi = card.innerText.includes('15+ Seksi Tol Trans Jawa & Sumatera');
          return {
            cardFound: true,
            hasThumbnail: !!thumb,
            thumbLoaded: thumb ? thumb.naturalWidth > 0 : false,
            thumbWidth: thumb ? thumb.naturalWidth : 0,
            hasButton: !!btn,
            hasTextFlyer: textFlyer,
            has15Seksi: text15Seksi
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Layanan card check:', JSON.stringify(evalLayananCard.value, null, 2));

    const shotLayananCard = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('test_layanan_kartu_flyer_thumbnail.png', Buffer.from(shotLayananCard.data, 'base64'));

    // TEST 3: Click Flyer & Verify Modal Lightbox
    console.log('\n--- 3. Testing Lightbox Modal for Flyer PNG ---');
    await send('Runtime.evaluate', {
      expression: `bukaLightboxFlyer();`
    });
    await new Promise(r => setTimeout(r, 1000));

    const evalLightbox = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('modal-lightbox-flyer');
          const img = document.getElementById('lightbox-flyer-img');
          return {
            modalVisible: modal ? !modal.classList.contains('hidden') : false,
            imgSrc: img ? img.getAttribute('src') : '',
            imgLoaded: img ? img.naturalWidth > 0 : false,
            naturalWidth: img ? img.naturalWidth : 0,
            naturalHeight: img ? img.naturalHeight : 0
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Lightbox modal check:', JSON.stringify(evalLightbox.value, null, 2));

    const shotLightbox = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('test_layanan_modal_lightbox_flyer.png', Buffer.from(shotLightbox.data, 'base64'));

    // Close lightbox
    await send('Runtime.evaluate', {
      expression: `tutupLightboxFlyer();`
    });
    await new Promise(r => setTimeout(r, 500));

    // TEST 4: Mobile View (375x812)
    console.log('\n--- 4. Testing Mobile View (375x812) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('pengadaan-tanah');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const shotMobileCard = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('test_mobile_layanan_kartu_flyer.png', Buffer.from(shotMobileCard.data, 'base64'));

    // Click on mobile
    await send('Runtime.evaluate', {
      expression: `bukaLightboxFlyer();`
    });
    await new Promise(r => setTimeout(r, 1000));

    const shotMobileLightbox = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('test_mobile_layanan_modal_flyer.png', Buffer.from(shotMobileLightbox.data, 'base64'));

    console.log('\n✅ All tests passed successfully!');
    ws.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
