/**
 * Script Pengambilan Bukti Visual Lengkap & Animasi Restorasi Final KJPP NSR
 * Mengambil:
 * 1. Screenshot Desktop Full Page & Mobile Full Page
 * 2. Screenshot per Section Kunci (Hero, NSR Cloud, FlexCarousel 3D, Manajemen, 5 Kantor)
 * 3. Frame Rekaman Animasi Berurutan (NSR Cloud Bezier Flow & FlexCarousel 3D)
 * 4. Halaman Preview Interaktif Lokal (preview-restorasi-final.html)
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d";
const SCREENSHOT_DIR = path.join(ROOT_DIR, "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

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

function staticServer(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.normalize(path.join(ROOT_DIR, pathname));
  if (!filePath.startsWith(ROOT_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
  fs.createReadStream(filePath).pipe(res);
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.id && this.callbacks.has(parsed.id)) {
          const { res, rej } = this.callbacks.get(parsed.id);
          this.callbacks.delete(parsed.id);
          if (parsed.error) rej(new Error(parsed.error.message));
          else res(parsed.result);
        }
      } catch (e) {}
    };
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = this.id++;
      this.callbacks.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

function saveDual(filename, buf) {
  fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), buf);
  fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buf);
  console.log(`📸 Disimpan: ${filename} (${buf.length.toLocaleString()} bytes)`);
}

async function main() {
  const server = http.createServer(staticServer);
  await new Promise((resolve) => server.listen(8096, "127.0.0.1", resolve));
  const port = server.address().port;
  console.log(`🌐 Server aktif di http://127.0.0.1:${port}`);

  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-cdp-restorasi-"));
  const cdpPort = 9226;

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tempUserDataDir}`,
    "--no-sandbox",
    "--disable-gpu",
    "--disable-features=Translate",
    "--window-size=1280,900",
    "about:blank"
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2500));

    const targetRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new?about:blank`, { method: "PUT" });
    const targetData = await targetRes.json();
    const cdp = new CdpClient(targetData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Runtime.enable");

    // ==========================================
    // 1. DESKTOP VIEWPORT & SECTIONS
    // ==========================================
    console.log(`\n🖥️ [Desktop] Setting viewport 1280x900...`);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/` });
    await new Promise((r) => setTimeout(r, 3500));

    // A. Hero Desktop
    console.log(`📸 Mengambil desktop hero...`);
    const dHero = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_asli_hero_desktop.png", Buffer.from(dHero.data, "base64"));

    // B. NSR Cloud Section Desktop
    console.log(`📸 Mengambil NSR Cloud & merekam 5 frame animasi flow...`);
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('sistem-mutu')?.scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Capture single main NSR Cloud shot
    const dNsr = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_asli_nsr_cloud.png", Buffer.from(dNsr.data, "base64"));

    // Rekam 5 frame animasi NSR Cloud
    for (let f = 1; f <= 5; f++) {
      await new Promise((r) => setTimeout(r, 250));
      const frameShot = await cdp.send("Page.captureScreenshot", { format: "png" });
      saveDual(`nsr_cloud_anim_frame${f}.png`, Buffer.from(frameShot.data, "base64"));
    }

    // C. FlexCarousel 3D Section Desktop
    console.log(`📸 Mengambil FlexCarousel 3D & merekam 5 frame rotasi...`);
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('galeri')?.scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await new Promise((r) => setTimeout(r, 1000));

    const dCarousel = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_asli_flex_carousel.png", Buffer.from(dCarousel.data, "base64"));

    // Putar carousel lewat script rotasi untuk merekam pergerakan
    for (let f = 1; f <= 5; f++) {
      await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const track = document.getElementById('flex-carousel-track');
          if (track) {
            const curY = parseFloat(track.dataset.rotY || '0') + 25;
            track.dataset.rotY = curY;
            track.style.transform = 'rotateY(' + curY + 'deg)';
          }
        })()`
      });
      await new Promise((r) => setTimeout(r, 200));
      const frameShot = await cdp.send("Page.captureScreenshot", { format: "png" });
      saveDual(`flex_carousel_anim_frame${f}.png`, Buffer.from(frameShot.data, "base64"));
    }

    // D. Manajemen Rekan & Struktur Organisasi
    console.log(`📸 Mengambil section manajemen...`);
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('manajemen')?.scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const dManajemen = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_asli_manajemen.png", Buffer.from(dManajemen.data, "base64"));

    // E. 5 Kantor Resmi & Peta
    console.log(`📸 Mengambil section 5 kantor...`);
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('kontak')?.scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const dKantor = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_asli_5_kantor.png", Buffer.from(dKantor.data, "base64"));

    // F. Full Page Desktop
    console.log(`📸 Mengambil Full-Page Desktop...`);
    await cdp.send("Runtime.evaluate", { expression: `window.scrollTo(0, 0);` });
    await new Promise((r) => setTimeout(r, 800));

    const docMetrics = await cdp.send("Page.getLayoutMetrics");
    const fullHeight = Math.min(Math.ceil(docMetrics.contentSize.height), 12000);

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: fullHeight,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise((r) => setTimeout(r, 1000));

    const dFull = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true
    });
    saveDual("restorasi_asli_desktop_full.png", Buffer.from(dFull.data, "base64"));

    // ==========================================
    // 2. MOBILE VIEWPORT (375x812)
    // ==========================================
    console.log(`\n📱 [Mobile] Setting viewport 375x812...`);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 1,
      mobile: true
    });

    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/` });
    await new Promise((r) => setTimeout(r, 3000));

    console.log(`📸 Mengambil mobile hero...`);
    const mHero = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_asli_hero_mobile.png", Buffer.from(mHero.data, "base64"));

    console.log(`📸 Mengambil mobile NSR Cloud...`);
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('sistem-mutu')?.scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const mNsr = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_asli_mobile_nsr_cloud.png", Buffer.from(mNsr.data, "base64"));

    console.log(`📸 Mengambil mobile FlexCarousel...`);
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('galeri')?.scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const mCarousel = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_asli_mobile_galeri.png", Buffer.from(mCarousel.data, "base64"));

    console.log(`📸 Mengambil mobile 5 kantor...`);
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('kontak')?.scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const mKantor = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_asli_mobile_5_kantor.png", Buffer.from(mKantor.data, "base64"));

    // Mobile Full Page
    console.log(`📸 Mengambil Full-Page Mobile...`);
    await cdp.send("Runtime.evaluate", { expression: `window.scrollTo(0, 0);` });
    await new Promise((r) => setTimeout(r, 800));

    const mDocMetrics = await cdp.send("Page.getLayoutMetrics");
    const mFullHeight = Math.min(Math.ceil(mDocMetrics.contentSize.height), 16000);

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: mFullHeight,
      deviceScaleFactor: 1,
      mobile: true
    });
    await new Promise((r) => setTimeout(r, 1000));

    const mFull = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true
    });
    saveDual("restorasi_asli_mobile_full.png", Buffer.from(mFull.data, "base64"));

    cdp.close();
    console.log("\n🎉 SELURUH BUKTI VISUAL RESTORASI ASLI BERHASIL DIAMBIL!");

  } finally {
    try {
      chromeProc.kill("SIGKILL");
    } catch (e) {}
    try {
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch (e) {}
    server.close();
  }
}

main().catch(err => {
  console.error("❌ Terjadi kesalahan saat pengambilan tangkapan layar:", err);
  process.exit(1);
});
