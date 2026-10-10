import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function staticServer(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, 'http://' + req.headers.host).pathname);
  console.log('HTTP REQ:', pathname);
  if (pathname === '/') pathname = 'index.html';
  const cleanPath = pathname.replace(/^\/+/, '');
  const filePath = path.join(ROOT_DIR, cleanPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    console.log('404 Not Found:', pathname);
    res.writeHead(404);
    res.end();
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME_MAP[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(staticServer);
await new Promise(r => server.listen(8093, '127.0.0.1', r));

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9241',
  '--no-sandbox',
  '--use-gl=angle',
  '--use-angle=gl',
  'about:blank'
]);

try {
  await new Promise(r => setTimeout(r, 1500));
  const targetRes = await fetch('http://127.0.0.1:9241/json/new?about:blank', { method: 'PUT' });
  const targetData = await targetRes.json();
  const ws = new WebSocket(targetData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const handlers = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') {
      console.error('JS EXCEPTION:', JSON.stringify(m.params.exceptionDetails));
    }
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

  await send('Page.navigate', { url: 'http://127.0.0.1:8093/index.html' });
  await new Promise(r => setTimeout(r, 3000));

  // Run in page context: scroll to carousel and force init
  const res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = document.getElementById('galeri-flex-carousel');
        if (!el) return { error: 'No galeri-flex-carousel' };
        
        // Scroll into view
        el.scrollIntoView();
        
        // Initialize if window.initFlexCarousel exists
        const kjppPhotos = [
          {
            src: 'images/kegiatan/inspeksi/IMG_20240827_095920.jpg',
            title: 'Musyawarah Ganti Kerugian Tol Sigli - Banda Aceh',
            subtitle: 'PSN Jalan Tol & Kementerian ATR/BPN'
          },
          {
            src: 'images/kegiatan/inspeksi/IMG_20230525_114736.jpg',
            title: 'Rapat Koordinasi Pengadaan Tanah Tol Akses IKN',
            subtitle: 'Kalimantan Timur - PSN Tol IKN'
          },
          {
            src: 'images/kegiatan/inspeksi/84871D33-97F0-40E8-8793-BABAF09428C7.jpg',
            title: 'Inspeksi Fisik Armada Bus PT Aerotrans Services Indonesia',
            subtitle: 'Valuasi Mesin & Aset Bergerak'
          },
          {
            src: 'images/kegiatan/inspeksi/IMG_20200205_160435.jpg',
            title: 'Audit Lapangan Sektor SDA & Lahan Perkebunan K3',
            subtitle: 'Kawasan Konsesi SDA & Perkebunan'
          },
          {
            src: 'images/kegiatan/inspeksi/IMG_20221119_153708.jpg',
            title: 'Survei & Tracking Lapangan Koridor PSN Kaltim',
            subtitle: 'Valuasi Fisik & Kontur Tanah Proyek'
          },
          {
            src: 'images/kegiatan/diklat/IMG_20200314_093637.jpg',
            title: 'PPL MAPPI: Pemahaman Hukum Perikatan & SPI 103',
            subtitle: 'Pengembangan Profesional Berkelanjutan'
          },
          {
            src: 'images/kegiatan/diklat/PKP SPI 204.jpg',
            title: 'Pendidikan Khusus Penilaian (PKPI-204) Pengadaan Tanah',
            subtitle: 'KPSPI & MAPPI Standar Penilaian Indonesia'
          },
          {
            src: 'images/kegiatan/kemitraan/IMG_20231206_120928.jpg',
            title: 'Pelaksanaan Pekerjaan Akses Tol IKN di BPN Balikpapan',
            subtitle: 'Kantor BPN Balikpapan - PSN Tol IKN'
          },
          {
            src: 'images/kegiatan/gathering.jpg',
            title: 'Gathering Akbar Tahunan KJPP Nanang Rahayu & Rekan',
            subtitle: 'Pantai Pangandaran, Jawa Barat'
          },
          {
            src: 'images/kegiatan/gathering (2).jpg',
            title: 'Team Building & Eksplorasi Green Canyon Cijulang',
            subtitle: 'Soliditas Budaya Kerja Seluruh Tim'
          },
          {
            src: 'images/kegiatan/raker/20141122_161954.jpg',
            title: 'Temu Akrab & Konsolidasi Kinerja Tahunan KJPP NSR',
            subtitle: 'Konsolidasi & Evaluasi Mutu Kerja'
          },
          {
            src: 'images/kegiatan/kantor cabang padang.jpg',
            title: 'Operasional & Tim Kantor Cabang Padang',
            subtitle: 'Padang, Sumatera Barat - KMK No. 363/KM.1/2019'
          },
          {
            src: 'images/kegiatan/palembang-tim-operasional.jpg',
            title: 'Operasional & Tim Kantor Cabang Palembang',
            subtitle: 'Palembang, Sumatera Selatan - KMK No. 230/KM.1/2022'
          }
        ];

        let instance = null;
        if (typeof window.initFlexCarousel === 'function') {
          instance = window.initFlexCarousel(el, {
            items: kjppPhotos,
            preset: 'liquid',
            cardHeight: 0.5,
            gap: 12,
            tilt: 62,
            autoplay: true,
            interval: 3.0
          });
          window.indexCarousel = instance;
        }

        return {
          instanceCreated: Boolean(instance),
          canvasExists: Boolean(el.querySelector('canvas')),
          windowInitType: typeof window.initFlexCarousel,
          moduleType: typeof window.FlexCarouselModule,
          innerHtmlLength: el.innerHTML.length
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Scroll & Init Result:', res.result.result.value);

  // Wait 3 seconds
  await new Promise(r => setTimeout(r, 3000));

  // Test carousel rotation
  const rotateTest = await send('Runtime.evaluate', {
    expression: `
      (() => {
        if (!window.indexCarousel) return { error: 'no indexCarousel' };
        const before = window.indexCarousel.getActiveIndex();
        window.indexCarousel.step(1);
        const after1 = window.indexCarousel.getActiveIndex();
        window.indexCarousel.step(1);
        const after2 = window.indexCarousel.getActiveIndex();
        return { before, after1, after2 };
      })()
    `,
    returnByValue: true
  });
  console.log('Rotation step test:', rotateTest.result.result.value);

  ws.close();
} finally {
  chrome.kill('SIGKILL');
  server.close();
}
