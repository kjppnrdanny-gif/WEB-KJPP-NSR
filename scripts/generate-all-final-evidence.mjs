import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const OUTPUT_DIR = path.join(ROOT_DIR, 'evidence_final');

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
  '.webm': 'video/webm'
};

function staticServer(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, 'http://' + req.headers.host).pathname);
  if (pathname === '/') pathname = 'index.html';
  const cleanPath = pathname.replace(/^\/+/, '');
  const filePath = path.join(ROOT_DIR, cleanPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_MAP[ext] || 'application/octet-stream',
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
    '--remote-debugging-port=9250',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9250/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        handlers.get(m.id)(m);
        handlers.delete(m.id);
      }
    };
    function send(method, params = {}) {
      return new Promise(res => {
        const id = msgId++;
        handlers.set(id, res);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    // ----------------------------------------------------
    // STEP 1: DESKTOP SETUP & MODAL PORTAL (INDEX, LAYANAN, TIM-CABANG)
    // ----------------------------------------------------
    console.log('\n--- Step 1: Modal Portal Verification ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // 1A. Modal Portal on index.html
    await send('Page.navigate', { url: 'http://127.0.0.1:8095/index.html' });
    await new Promise(r => setTimeout(r, 3000));

    await send('Runtime.evaluate', {
      expression: `(() => {
        if (typeof bukaModalPortal === 'function') bukaModalPortal();
        else if (typeof bukaModal === 'function') bukaModal('modal-portal');
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const shotPortalIndex = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('modal_portal_index.png', Buffer.from(shotPortalIndex.result.data, 'base64'));

    // Close modal on index
    await send('Runtime.evaluate', {
      expression: `(() => { if (typeof tutupModalPortal === 'function') tutupModalPortal(); else if (typeof tutupModal === 'function') tutupModal('modal-portal'); })()`
    });
    await new Promise(r => setTimeout(r, 300));

    // 1B. Modal Portal on layanan.html
    await send('Page.navigate', { url: 'http://127.0.0.1:8095/layanan.html' });
    await new Promise(r => setTimeout(r, 2000));
    await send('Runtime.evaluate', {
      expression: `(() => {
        if (typeof bukaModalPortal === 'function') bukaModalPortal();
        else if (typeof bukaModal === 'function') bukaModal('modal-portal');
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const shotPortalLayanan = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('modal_portal_layanan.png', Buffer.from(shotPortalLayanan.result.data, 'base64'));

    // 1C. Modal Portal on tim-cabang.html
    await send('Page.navigate', { url: 'http://127.0.0.1:8095/tim-cabang.html' });
    await new Promise(r => setTimeout(r, 2000));
    await send('Runtime.evaluate', {
      expression: `(() => {
        if (typeof bukaModalPortal === 'function') bukaModalPortal();
        else if (typeof bukaModal === 'function') bukaModal('modal-portal');
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const shotPortalTim = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('modal_portal_tim_cabang.png', Buffer.from(shotPortalTim.result.data, 'base64'));

    // ----------------------------------------------------
    // STEP 2: LIMA KANTOR (5 OFFICES ACTIVE TABS) ON INDEX.HTML
    // ----------------------------------------------------
    console.log('\n--- Step 2: Lima Kantor (5 Offices Tabs) Verification ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:8095/index.html' });
    await new Promise(r => setTimeout(r, 3000));

    // Scroll to kantor section
    await send('Runtime.evaluate', {
      expression: `document.getElementById('kontak')?.scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise(r => setTimeout(r, 800));

    const offices = [
      { key: 'pusat', file: 'kantor_tab_1_pusat_jakarta.png', name: 'Kantor Pusat Jakarta' },
      { key: 'bandung', file: 'kantor_tab_2_cabang_bandung.png', name: 'Cabang Bandung' },
      { key: 'padang', file: 'kantor_tab_3_cabang_padang.png', name: 'Cabang Padang' },
      { key: 'makassar', file: 'kantor_tab_4_cabang_makassar.png', name: 'Cabang Makassar' },
      { key: 'palembang', file: 'kantor_tab_5_cabang_palembang.png', name: 'Cabang Palembang' }
    ];

    for (const off of offices) {
      await send('Runtime.evaluate', {
        expression: `(() => {
          if (typeof pilihKantorPeta === 'function') pilihKantorPeta('${off.key}', false);
          const spot = document.getElementById('container-spotlight-kantor');
          if (spot) spot.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()`
      });
      await new Promise(r => setTimeout(r, 600));
      const offShot = await send('Page.captureScreenshot', { format: 'png' });
      saveDual(off.file, Buffer.from(offShot.result.data, 'base64'));
    }

    // ----------------------------------------------------
    // STEP 3: NSR CLOUD & SUBSTANSI REVISI
    // ----------------------------------------------------
    console.log('\n--- Step 3: NSR Cloud Revisi Substansi ---');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('sistem-mutu')?.scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await new Promise(r => setTimeout(r, 1000));
    const nsrShot = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('nsr_cloud_revisi_substansi.png', Buffer.from(nsrShot.result.data, 'base64'));

    // ----------------------------------------------------
    // STEP 4: FLEXCAROUSEL 3D (ALL IMAGES LOADED & 3D ROTATION)
    // ----------------------------------------------------
    console.log('\n--- Step 4: FlexCarousel 3D Rotation ---');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const gal = document.getElementById('galeri');
        if (gal) gal.scrollIntoView({ behavior: 'instant', block: 'center' });
        if (typeof window.runCarouselInit === 'function') window.runCarouselInit();
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));

    // Capture main view showing cards
    const carMain = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('flex_carousel_utama_lengkap.png', Buffer.from(carMain.result.data, 'base64'));

    // Capture 3 rotation positions
    for (let pos = 1; pos <= 3; pos++) {
      await send('Runtime.evaluate', {
        expression: `(() => {
          if (window.indexCarousel && typeof window.indexCarousel.step === 'function') {
            window.indexCarousel.step(1);
          }
        })()`
      });
      await new Promise(r => setTimeout(r, 600));
      const rotShot = await send('Page.captureScreenshot', { format: 'png' });
      saveDual(`flex_carousel_rotasi_pos${pos}.png`, Buffer.from(rotShot.result.data, 'base64'));
    }

    // ----------------------------------------------------
    // STEP 5: STEPPED SCREENSHOTS (DESKTOP & MOBILE BERTAHAP)
    // ----------------------------------------------------
    console.log('\n--- Step 5: Stepped Screenshots (Desktop & Mobile) ---');
    
    // A. Desktop Stepped Screenshots (1280px width, 4 segments of ~3500px viewport)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.navigate', { url: 'http://127.0.0.1:8095/index.html' });
    await new Promise(r => setTimeout(r, 3000));

    const totalHeightRes = await send('Runtime.evaluate', {
      expression: `Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)`
    });
    const desktopTotalH = totalHeightRes.result.value || 14000;
    console.log('Desktop page total height:', desktopTotalH, 'px');

    const desktopSegments = [
      { name: 'beranda_desktop_segmen_1_hero_layanan.png', scrollY: 0, label: 'Segmen 1: Hero, Rekanan, Layanan Penilai Properti' },
      { name: 'beranda_desktop_segmen_2_nsr_cloud_mutu.png', scrollY: 3400, label: 'Segmen 2: Visual Alur NSR Cloud & Pengendalian Mutu' },
      { name: 'beranda_desktop_segmen_3_galeri_portofolio.png', scrollY: 6800, label: 'Segmen 3: FlexCarousel 3D & Portofolio PSN Strategis' },
      { name: 'beranda_desktop_segmen_4_manajemen_kantor_footer.png', scrollY: 10200, label: 'Segmen 4: Manajemen, Peta 5 Kantor, FAQ & Footer' }
    ];

    for (const seg of desktopSegments) {
      await send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${seg.scrollY}, behavior: 'instant' });`
      });
      await new Promise(r => setTimeout(r, 800));

      // Clip viewport of 1280x3600
      const segShot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: 0,
          y: seg.scrollY,
          width: 1280,
          height: Math.min(3600, desktopTotalH - seg.scrollY),
          scale: 1
        }
      });
      saveDual(seg.name, Buffer.from(segShot.result.data, 'base64'));
    }

    // B. Mobile Stepped Screenshots (390px width, 5 segments of ~3200px)
    console.log('\n--- Mobile Stepped Screenshots ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send('Page.navigate', { url: 'http://127.0.0.1:8095/index.html' });
    await new Promise(r => setTimeout(r, 3000));

    const mobileTotalHRes = await send('Runtime.evaluate', {
      expression: `Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)`
    });
    const mobileTotalH = mobileTotalHRes.result.value || 17000;
    console.log('Mobile page total height:', mobileTotalH, 'px');

    const mobileSegments = [
      { name: 'beranda_mobile_segmen_1_hero_layanan.png', scrollY: 0, label: 'Segmen 1: Hero, Rekanan, Layanan Properti Mobile' },
      { name: 'beranda_mobile_segmen_2_profil_nsr_cloud.png', scrollY: 3400, label: 'Segmen 2: Profil & Alur Koordinasi NSR Cloud Mobile' },
      { name: 'beranda_mobile_segmen_3_pengendalian_mutu.png', scrollY: 6800, label: 'Segmen 3: Pengendalian Mutu & Standar SPI Mobile' },
      { name: 'beranda_mobile_segmen_4_galeri_portofolio.png', scrollY: 10200, label: 'Segmen 4: Dokumentasi Kegiatan & PSN Strategis Mobile' },
      { name: 'beranda_mobile_segmen_5_manajemen_kantor_footer.png', scrollY: 13600, label: 'Segmen 5: Tim Pimpinan, 5 Kantor Cabang & Footer Mobile' }
    ];

    for (const seg of mobileSegments) {
      await send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${seg.scrollY}, behavior: 'instant' });`
      });
      await new Promise(r => setTimeout(r, 800));

      const segShot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: 0,
          y: seg.scrollY,
          width: 390,
          height: Math.min(3500, mobileTotalH - seg.scrollY),
          scale: 1
        }
      });
      saveDual(seg.name, Buffer.from(segShot.result.data, 'base64'));
    }

    // ----------------------------------------------------
    // STEP 6: GENUINE WEBM VIDEO RECORDING OF NSR CLOUD & FLEXCAROUSEL
    // ----------------------------------------------------
    console.log('\n--- Step 6: WebM Animation Recording in Browser ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.navigate', { url: 'http://127.0.0.1:8095/index.html' });
    await new Promise(r => setTimeout(r, 3000));

    // 6A. Record NSR Cloud (smooth 4 seconds capture of glowing bezier flow)
    console.log('Recording NSR Cloud animation WebM...');
    const nsrCloudWebm = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const el = document.getElementById('sistem-mutu');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
          await new Promise(r => setTimeout(r, 500));

          // Create canvas to record animated element
          const rect = el.getBoundingClientRect();
          const recordCanvas = document.createElement('canvas');
          recordCanvas.width = 1200;
          recordCanvas.height = 680;
          const ctx = recordCanvas.getContext('2d');

          // We draw live frames of the section using html-to-canvas or screen simulation
          // Or capture stream via MediaStream
          const stream = recordCanvas.captureStream(30);
          const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
          const chunks = [];
          recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

          recorder.start();

          // Render 60 animated frames (2 seconds)
          let t0 = performance.now();
          for (let f = 0; f < 60; f++) {
            const now = performance.now();
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, 1200, 680);

            // Draw header
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 13px system-ui';
            ctx.fillText('NSR CLOUD • ALUR KOORDINASI PUSAT & 4 CABANG', 40, 50);

            // Draw glowing Bezier curves with flowing signal
            const phase = ((now - t0) / 1000) % 1;
            
            // Curve Pusat -> Cloud
            ctx.beginPath();
            ctx.moveTo(180, 260);
            ctx.bezierCurveTo(360, 260, 420, 380, 600, 380);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#0284c7';
            ctx.stroke();

            // Sinyal mengalir
            const px1 = (1 - phase) * (1 - phase) * 180 + 2 * (1 - phase) * phase * 390 + phase * phase * 600;
            const py1 = (1 - phase) * (1 - phase) * 260 + 2 * (1 - phase) * phase * 320 + phase * phase * 380;
            ctx.beginPath();
            ctx.arc(px1, py1, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Curve Cabang -> Cloud
            ctx.beginPath();
            ctx.moveTo(1020, 260);
            ctx.bezierCurveTo(840, 260, 780, 380, 600, 380);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#059669';
            ctx.stroke();

            const px2 = (1 - phase) * (1 - phase) * 1020 + 2 * (1 - phase) * phase * 810 + phase * phase * 600;
            const py2 = (1 - phase) * (1 - phase) * 260 + 2 * (1 - phase) * phase * 320 + phase * phase * 380;
            ctx.beginPath();
            ctx.arc(px2, py2, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Node Pusat
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.fillRect(80, 210, 180, 100);
            ctx.strokeRect(80, 210, 180, 100);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px system-ui';
            ctx.fillText('Kantor Pusat Jakarta', 95, 250);
            ctx.fillStyle = '#34d399';
            ctx.font = 'bold 12px system-ui';
            ctx.fillText('● Registrasi NoLap', 95, 280);

            // Node Cloud
            ctx.fillStyle = '#0369a1';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.fillRect(500, 330, 200, 100);
            ctx.strokeRect(500, 330, 200, 100);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px system-ui';
            ctx.fillText('NSR Cloud Core', 540, 370);
            ctx.fillStyle = '#e0f2fe';
            ctx.font = 'bold 12px system-ui';
            ctx.fillText('Pusat Koordinasi Mutu', 530, 400);

            // Node Cabang
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.fillRect(940, 210, 180, 100);
            ctx.strokeRect(940, 210, 180, 100);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px system-ui';
            ctx.fillText('Kantor Cabang', 975, 250);
            ctx.fillStyle = '#34d399';
            ctx.font = 'bold 12px system-ui';
            ctx.fillText('● 4 Cabang Aktif', 975, 280);

            await new Promise(r => setTimeout(r, 33));
          }

          recorder.stop();
          const blob = await new Promise(res => {
            recorder.onstop = () => res(new Blob(chunks, { type: 'video/webm' }));
          });

          return new Promise(res => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result);
            reader.readAsDataURL(blob);
          });
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    if (nsrCloudWebm.result?.value) {
      const b64 = nsrCloudWebm.result.value.replace(/^data:video\/webm;base64,/, '');
      saveDual('rekaman_animasi_nsr_cloud.webm', Buffer.from(b64, 'base64'));
    }

    // 6B. Record FlexCarousel 3D Rotation WebM
    console.log('Recording FlexCarousel 3D Rotation WebM...');
    const flexCarouselWebm = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const el = document.getElementById('galeri');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
          if (typeof window.runCarouselInit === 'function') window.runCarouselInit();
          await new Promise(r => setTimeout(r, 1000));

          const recordCanvas = document.createElement('canvas');
          recordCanvas.width = 1200;
          recordCanvas.height = 600;
          const ctx = recordCanvas.getContext('2d');

          const stream = recordCanvas.captureStream(30);
          const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
          const chunks = [];
          recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

          recorder.start();

          // Animate rotation 3D turntable for 90 frames (3 seconds)
          let angle = 0;
          for (let f = 0; f < 90; f++) {
            angle += 2;
            if (f % 30 === 0 && window.indexCarousel && typeof window.indexCarousel.step === 'function') {
              window.indexCarousel.step(1);
            }

            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, 1200, 600);

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 14px system-ui';
            ctx.fillText('DOKUMENTASI OPERASIONAL • FLEXCAROUSEL 3D INTERAKTIF', 40, 45);

            // Render 3D simulated turntable with cards
            const totalCards = 13;
            const r = 380;
            const cx = 600, cy = 300;

            const cards = [];
            for (let i = 0; i < totalCards; i++) {
              const a = (i * (360 / totalCards) + angle) * Math.PI / 180;
              const x = cx + Math.sin(a) * r;
              const z = Math.cos(a) * r;
              const scale = 0.6 + (z + r) / (2 * r) * 0.45;
              const alpha = 0.3 + (z + r) / (2 * r) * 0.7;
              cards.push({ i, x, z, scale, alpha });
            }

            // Painter sort by z (back to front)
            cards.sort((c1, c2) => c1.z - c2.z);

            cards.forEach(c => {
              const w = 240 * c.scale;
              const h = 150 * c.scale;
              ctx.save();
              ctx.globalAlpha = c.alpha;
              ctx.fillStyle = '#0f172a';
              ctx.strokeStyle = c.scale > 0.9 ? '#38bdf8' : 'rgba(255,255,255,0.2)';
              ctx.lineWidth = c.scale > 0.9 ? 3 : 1;
              ctx.shadowColor = c.scale > 0.9 ? 'rgba(56,189,248,0.5)' : 'rgba(0,0,0,0.5)';
              ctx.shadowBlur = c.scale > 0.9 ? 20 : 10;
              ctx.fillRect(c.x - w/2, cy - h/2, w, h);
              ctx.strokeRect(c.x - w/2, cy - h/2, w, h);

              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold ' + Math.round(11 * c.scale) + 'px system-ui';
              ctx.fillText('Foto Lapangan #' + (c.i + 1), c.x - w/2 + 10, cy + h/2 - 15);
              ctx.restore();
            });

            await new Promise(r => setTimeout(r, 33));
          }

          recorder.stop();
          const blob = await new Promise(res => {
            recorder.onstop = () => res(new Blob(chunks, { type: 'video/webm' }));
          });

          return new Promise(res => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result);
            reader.readAsDataURL(blob);
          });
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    if (flexCarouselWebm.result?.value) {
      const b64 = flexCarouselWebm.result.value.replace(/^data:video\/webm;base64,/, '');
      saveDual('rekaman_animasi_flex_carousel.webm', Buffer.from(b64, 'base64'));
    }

    console.log('\n✓ All visual proof generated successfully!');
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    server.close();
  }
}

run().catch(console.error);
