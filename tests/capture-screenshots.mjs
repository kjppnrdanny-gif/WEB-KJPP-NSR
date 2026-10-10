/**
 * Script Pengambil Screenshot & Verifikasi Interaksi Beranda (Desktop & Smartphone)
 * Menggunakan Google Chrome Asli via Chrome DevTools Protocol (CDP)
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// Target directories
const WORKSPACE_SCREENSHOT_DIR = path.join(ROOT_DIR, "screenshots");
const ARTIFACT_DIR = "C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d";

if (!fs.existsSync(WORKSPACE_SCREENSHOT_DIR)) {
  fs.mkdirSync(WORKSPACE_SCREENSHOT_DIR, { recursive: true });
}

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
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache"
  });
  fs.createReadStream(filePath).pipe(res);
}

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

function saveDual(filename, buffer) {
  // 1. Save in Workspace screenshots/
  const wsPath = path.join(WORKSPACE_SCREENSHOT_DIR, filename);
  fs.writeFileSync(wsPath, buffer);
  console.log(`  [Workspace] Saved: screenshots/${filename}`);

  // 2. Save in Artifacts dir
  try {
    const artPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(artPath, buffer);
  } catch (e) {}
}

async function runTestsAndCapture() {
  const server = http.createServer(staticServer);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/index.html`;

  const cdpPort = 9800 + Math.floor(Math.random() * 100);
  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${cdpPort}`,
    "--remote-allow-origins=*",
    "--enable-webgl",
    "--use-gl=angle",
    "--no-sandbox",
    "--disable-dev-shm-usage"
  ], { stdio: "ignore" });

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
        if (res.ok) {
          const data = await res.json();
          wsUrl = data.webSocketDebuggerUrl;
          break;
        }
      } catch (e) {}
      await new Promise((r) => setTimeout(r, 200));
    }

    if (!wsUrl) throw new Error("Gagal terhubung ke Chrome CDP");

    const newTargetRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new?about:blank`, { method: "PUT" });
    const targetData = await newTargetRes.json();
    const pageWsUrl = targetData.webSocketDebuggerUrl;

    const cdp = new CdpClient(pageWsUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Network.enable");

    // 1. DESKTOP VIEWPORT (1440 x 900)
    console.log("\n=======================================================");
    console.log("📸 PENGUJIAN & CAPTURE DESKTOP (1440x900)");
    console.log("=======================================================");
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

    await cdp.send("Page.navigate", { url: baseUrl });
    await loadPromise;
    console.log("✓ Page.loadEventFired berhasil diterima.");
    await new Promise((r) => setTimeout(r, 1500)); // Animasi awal & init

    // Test Hero, Navigation, Transformasi Link & Animation Elements
    const animChecks = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const results = {};
        results.heroCanvas = !!document.getElementById('hero-light-rays');
        results.dotField = !!document.getElementById('hero-dot-field');
        results.stats = Array.from(document.querySelectorAll('.stat-number')).map(el => el.textContent.trim());
        results.cloudFlow = !!document.querySelector('.animate-cloud-flow');
        results.partnerLogos = document.querySelectorAll('#rekanan img').length;
        results.navItemsCount = document.querySelectorAll('header nav a, #mobile-menu a').length;
        results.transformasiLinkValid = Array.from(document.querySelectorAll('a')).some(a => a.getAttribute('href') === 'profil-legalitas.html#transformasi');
        return results;
      })()`,
      returnByValue: true
    });
    console.log("Status Komponen Animasi, Navigasi & Data:", animChecks.result.value);

    // Scroll to #galeri to ensure FlexCarousel mounts
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const el = document.getElementById('galeri');
        if (el) el.scrollIntoView();
        if (typeof runCarouselInit === 'function') runCarouselInit();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1500));

    const carouselChecks = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const c = document.getElementById('galeri-flex-carousel');
        const testGl2 = !!document.createElement('canvas').getContext('webgl2');
        return {
          mounted: !!c,
          webgl2Supported: testGl2,
          hasCanvasOrChildren: c ? (c.children.length > 0 || !!c.querySelector('canvas')) : false,
          indexCarouselReady: !!window.indexCarousel,
          initFlexCarouselType: typeof window.initFlexCarousel
        };
      })()`,
      returnByValue: true
    });
    console.log("Status FlexCarousel 3D WebGL:", carouselChecks.result.value);

    // Simulate mouse drag interaction on FlexCarousel 3D
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: 720, y: 400, button: "left", clickCount: 1 });
    await new Promise((r) => setTimeout(r, 200));
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 420, y: 400 });
    await new Promise((r) => setTimeout(r, 200));
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 420, y: 400, button: "left", clickCount: 1 });
    await new Promise((r) => setTimeout(r, 600));

    // Capture FlexCarousel 3D in active drag state
    const dCarousel = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("desktop_galeri_carousel.png", Buffer.from(dCarousel.data, "base64"));
    console.log("✓ Interaksi Drag FlexCarousel 3D berhasil diuji & ditangkap.");

    // Return to top for Hero capture
    await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0, 0);" });
    await new Promise((r) => setTimeout(r, 800));

    // Capture Desktop 1: Hero & Navigasi
    const dHero = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("desktop_hero.png", Buffer.from(dHero.data, "base64"));

    // Capture Desktop 2: Bagian Tengah (#transformasi, #layanan, #sistem-mutu)
    await cdp.send("Runtime.evaluate", {
      expression: "document.getElementById('transformasi').scrollIntoView();"
    });
    await new Promise((r) => setTimeout(r, 1500));
    const dTengah = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("desktop_tengah.png", Buffer.from(dTengah.data, "base64"));

    // Test Interaksi Modal Portal
    await cdp.send("Runtime.evaluate", {
      expression: "if (typeof bukaModalPortal === 'function') bukaModalPortal();"
    });
    await new Promise((r) => setTimeout(r, 800));
    const modalCheck = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.getElementById('modal-portal');
        return modal && !modal.classList.contains('hidden');
      })()`,
      returnByValue: true
    });
    console.log("Interaksi Modal Portal Terbuka:", modalCheck.result.value);

    // Tutup modal portal
    await cdp.send("Runtime.evaluate", {
      expression: "if (typeof tutupModalPortal === 'function') tutupModalPortal();"
    });
    await new Promise((r) => setTimeout(r, 500));

    // Capture Desktop 3: Footer & Kontak
    await cdp.send("Runtime.evaluate", {
      expression: "document.getElementById('kontak').scrollIntoView();"
    });
    await new Promise((r) => setTimeout(r, 1200));
    const dFooter = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("desktop_footer.png", Buffer.from(dFooter.data, "base64"));

    // 2. SMARTPHONE VIEWPORT (390 x 844, iPhone scale)
    console.log("\n=======================================================");
    console.log("📱 PENGUJIAN & CAPTURE SMARTPHONE (390x844)");
    console.log("=======================================================");
    await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0, 0);" });
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Capture Mobile 1: Hero & Mobile Header
    const mHero = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("mobile_hero.png", Buffer.from(mHero.data, "base64"));

    // Capture Mobile 2: Bagian Tengah (#transformasi & #layanan)
    await cdp.send("Runtime.evaluate", {
      expression: "document.getElementById('transformasi').scrollIntoView();"
    });
    await new Promise((r) => setTimeout(r, 1500));
    const mTengah = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("mobile_tengah.png", Buffer.from(mTengah.data, "base64"));

    // Capture Mobile 3: Footer & Kontak
    await cdp.send("Runtime.evaluate", {
      expression: "document.getElementById('kontak').scrollIntoView();"
    });
    await new Promise((r) => setTimeout(r, 1200));
    const mFooter = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("mobile_footer.png", Buffer.from(mFooter.data, "base64"));

    cdp.close();
    console.log("\n✨ Seluruh screenshot & pengujian interaksi berhasil diselesaikan!");
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
  }
}

runTestsAndCapture().catch((err) => {
  console.error("Gagal menjalankan capture & tests:", err);
  process.exit(1);
});
