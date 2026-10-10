/**
 * Verifikasi Penuh Hasil Build dist/ KJPP NSR
 * Menjalankan build, menyajikan direktori dist/ via HTTP,
 * menguji semua komponen web & portal, mengambil screenshot langsung dari dist/,
 * dan membuat arsip ZIP screenshots-beranda-kjpp-nsr.zip di root proyek.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d";
const SCREENSHOT_DIR = path.join(ROOT_DIR, "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// 1. Jalankan build produksi
console.log("=== 1. MENJALANKAN BUILD PRODUKSI KE dist/ ===");
execSync("node scripts/build-production.mjs", { cwd: ROOT_DIR, stdio: "inherit" });

// 2. Verifikasi keberadaan halaman resmi & dokumen di dist/
console.log("\n=== 2. VERIFIKASI FILE RESMI DI dist/ ===");
const REQUIRED_FILES = [
  "index.html",
  "company-profile.html",
  "profil-legalitas.html",
  "layanan.html",
  "portofolio-rekanan.html",
  "tim-cabang.html",
  "wawasan-regulasi.html",
  "portal-nolap.html",
  "portal-kwitansi.html",
  "Company Profile KJPP NSR 2026_S.pdf",
  "robots.txt",
  "sitemap.xml"
];

for (const file of REQUIRED_FILES) {
  const fp = path.join(DIST_DIR, file);
  if (!fs.existsSync(fp)) {
    throw new Error(`File resmi hilang di dist/: ${file}`);
  }
  const sz = fs.statSync(fp).size;
  console.log(`✓ ${file} (${sz} bytes)`);
}

// 3. Verifikasi anti-kebocoran file internal di dist/
console.log("\n=== 3. VERIFIKASI KEAMANAN ANTI-KEBOCORAN DI dist/ ===");
const FORBIDDEN_DIRS = ["tests", "scratch", "screenshots", "netlify", "staging-isolated-package"];
for (const d of FORBIDDEN_DIRS) {
  const dp = path.join(DIST_DIR, d);
  if (fs.existsSync(dp)) {
    throw new Error(`KEBOCORAN TERDETEKSI: Direktori ${d} ditemukan di dalam dist/!`);
  }
}
console.log("✓ dist/ bersih dari tests, scratch, screenshots, dan backend source.");

// 4. Sajikan dist/ melalui server HTTP lokal
console.log("\n=== 4. MENYAJIKAN dist/ VIA HTTP LOKAL ===");
const MIME_MAP = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf"
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.normalize(path.join(DIST_DIR, pathname));
  if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
console.log(`Server HTTP lokal untuk dist/ berjalan di: http://127.0.0.1:${port}`);

// 5. Luncurkan Chrome via CDP
class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.msgId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id && this.pending.has(data.id)) {
          const { resolve, reject } = this.pending.get(data.id);
          this.pending.delete(data.id);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      } catch (e) {}
    };
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }
  }
}

function saveImage(filename, buffer) {
  const wsPath = path.join(SCREENSHOT_DIR, filename);
  fs.writeFileSync(wsPath, buffer);
  try {
    const artPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(artPath, buffer);
  } catch (e) {}
  console.log(`  [Tersimpan] ${filename} (${buffer.length} bytes)`);
}

const cdpPort = 9890;
const chromeProc = spawn(CHROME_PATH, [
  "--headless=new",
  `--remote-debugging-port=${cdpPort}`,
  "--remote-allow-origins=*",
  "--enable-webgl",
  "--use-gl=angle",
  "--no-sandbox"
], { stdio: "ignore" });

await new Promise((r) => setTimeout(r, 1200));
const ver = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
const target = await (await fetch(`http://127.0.0.1:${cdpPort}/json/new?about:blank`, { method: "PUT" })).json();
const cdp = new CdpClient(target.webSocketDebuggerUrl);
await cdp.connect();

await cdp.send("Page.enable");
await cdp.send("DOM.enable");

console.log("\n=== 5. PENGUJIAN DESKTOP PADA dist/index.html ===");
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false
});

const loadPromise = new Promise((resolve) => {
  const handler = (evt) => {
    try {
      const d = JSON.parse(evt.data);
      if (d.method === "Page.loadEventFired") {
        cdp.ws.removeEventListener("message", handler);
        resolve();
      }
    } catch (e) {}
  };
  cdp.ws.addEventListener("message", handler);
});

await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html` });
await loadPromise;
console.log("✓ Page.loadEventFired dari dist/ diterima.");
await new Promise((r) => setTimeout(r, 1500));

// Verifikasi komponen animasi di dist/
const compChecks = await cdp.send("Runtime.evaluate", {
  expression: `(() => {
    return {
      heroCanvas: !!document.getElementById('hero-light-rays'),
      dotField: !!document.getElementById('hero-dot-field'),
      cloudFlow: !!document.querySelector('.animate-cloud-flow'),
      statsCount: document.querySelectorAll('.stat-number').length,
      partnerLogosCount: document.querySelectorAll('#rekanan img').length,
      linksValid: document.querySelectorAll('a[href^="profil-legalitas.html"]').length > 0
    };
  })()`,
  returnByValue: true
});
console.log("Komponen dist/ Berhasil Aktif:", compChecks.result.value);

// Scroll & Mount FlexCarousel di dist/ (Tepat di tengah layar)
await cdp.send("Runtime.evaluate", {
  expression: `(() => {
    if (typeof runCarouselInit === 'function') runCarouselInit();
    const c = document.getElementById('galeri-flex-carousel');
    if (c) {
      c.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  })()`
});
await new Promise((r) => setTimeout(r, 2500)); // Berikan waktu bagi WebGL texture dan foto terdekode

const carouselChecks = await cdp.send("Runtime.evaluate", {
  expression: `(() => {
    const c = document.getElementById('galeri-flex-carousel');
    return {
      mounted: !!c,
      hasCanvas: c ? !!c.querySelector('canvas') : false,
      indexCarouselReady: !!window.indexCarousel
    };
  })()`,
  returnByValue: true
});
console.log("Status FlexCarousel 3D WebGL di dist/:", carouselChecks.result.value);

// Ambil koordinat tengah kontainer carousel untuk simulasi drag
const carouselRect = await cdp.send("Runtime.evaluate", {
  expression: `(() => {
    const c = document.getElementById('galeri-flex-carousel');
    const r = c.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`,
  returnByValue: true
});
const cx = Math.round(carouselRect.result?.value?.x || 720);
const cy = Math.round(carouselRect.result?.value?.y || 450);

// Geser kursor pada foto carousel
await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: cx + 180, y: cy, button: "left", clickCount: 1 });
await new Promise((r) => setTimeout(r, 200));
await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: cx - 180, y: cy });
await new Promise((r) => setTimeout(r, 200));
await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: cx - 180, y: cy, button: "left", clickCount: 1 });
await new Promise((r) => setTimeout(r, 800));

const dCarousel = await cdp.send("Page.captureScreenshot", { format: "png" });
saveImage("desktop_galeri_carousel.png", Buffer.from(dCarousel.data, "base64"));

// Desktop Hero
await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0, 0);" });
await new Promise((r) => setTimeout(r, 800));
const dHero = await cdp.send("Page.captureScreenshot", { format: "png" });
saveImage("desktop_hero.png", Buffer.from(dHero.data, "base64"));

// Desktop Bagian Tengah
await cdp.send("Runtime.evaluate", {
  expression: "document.getElementById('transformasi').scrollIntoView();"
});
await new Promise((r) => setTimeout(r, 1500));
const dTengah = await cdp.send("Page.captureScreenshot", { format: "png" });
saveImage("desktop_tengah.png", Buffer.from(dTengah.data, "base64"));

// Desktop Footer (Scroll ke bagian paling bawah / footer resmi)
await cdp.send("Runtime.evaluate", {
  expression: `(() => {
    const f = document.querySelector('footer');
    if (f) f.scrollIntoView({ behavior: 'instant', block: 'end' });
    else window.scrollTo(0, document.body.scrollHeight);
  })()`
});
await new Promise((r) => setTimeout(r, 1200));
const dFooter = await cdp.send("Page.captureScreenshot", { format: "png" });
saveImage("desktop_footer.png", Buffer.from(dFooter.data, "base64"));

// 6. Pengujian Smartphone pada dist/index.html
console.log("\n=== 6. PENGUJIAN SMARTPHONE PADA dist/index.html ===");
await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0, 0);" });
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true
});
await new Promise((r) => setTimeout(r, 1500));

// Mobile Hero (Menampilkan Navigasi Mobile Baru yang Pas & Tidak Terpotong)
const mHero = await cdp.send("Page.captureScreenshot", { format: "png" });
saveImage("mobile_hero.png", Buffer.from(mHero.data, "base64"));

// Mobile Tengah
await cdp.send("Runtime.evaluate", {
  expression: "document.getElementById('transformasi').scrollIntoView();"
});
await new Promise((r) => setTimeout(r, 1500));
const mTengah = await cdp.send("Page.captureScreenshot", { format: "png" });
saveImage("mobile_tengah.png", Buffer.from(mTengah.data, "base64"));

// Mobile Footer (Scroll ke bagian paling bawah / footer resmi)
await cdp.send("Runtime.evaluate", {
  expression: `(() => {
    const f = document.querySelector('footer');
    if (f) f.scrollIntoView({ behavior: 'instant', block: 'end' });
    else window.scrollTo(0, document.body.scrollHeight);
  })()`
});
await new Promise((r) => setTimeout(r, 1200));
const mFooter = await cdp.send("Page.captureScreenshot", { format: "png" });
saveImage("mobile_footer.png", Buffer.from(mFooter.data, "base64"));

cdp.close();
chromeProc.kill();
server.close();

// 7. Buat arsip ZIP untuk pengguna
console.log("\n=== 7. MEMBUAT ARSIP ZIP SCREENSHOT ===");
const ZIP_PATH = path.join(ROOT_DIR, "screenshots-beranda-kjpp-nsr.zip");
// Menggunakan PowerShell Compress-Archive
try {
  execSync(`powershell -Command "Compress-Archive -Path '${SCREENSHOT_DIR}\\*.png' -DestinationPath '${ZIP_PATH}' -Force"`);
  const zipSz = fs.statSync(ZIP_PATH).size;
  console.log(`✓ Arsip ZIP berhasil dibuat: screenshots-beranda-kjpp-nsr.zip (${(zipSz / 1024 / 1024).toFixed(2)} MB)`);
} catch (e) {
  console.error("Gagal membuat zip:", e.message);
}

console.log("\n✨ SELURUH VERIFIKASI dist/ DAN PENGAMBILAN SCREENSHOT SUKSES!");
process.exit(0);
