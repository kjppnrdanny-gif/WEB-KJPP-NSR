/**
 * Script Pengambil Screenshot Komprehensif Beranda Terestorasi
 * Menggunakan Chrome Asli via Chrome DevTools Protocol (CDP)
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

async function captureClip(cdp, selector, filename) {
  try {
    const expr = `
      (() => {
        const el = document.querySelector('${selector}');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          x: Math.max(0, rect.x + window.scrollX),
          y: Math.max(0, rect.y + window.scrollY),
          width: rect.width,
          height: rect.height
        };
      })()
    `;
    const evalRes = await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    const box = evalRes.result?.value;
    if (!box) {
      console.warn(`⚠️ Selector ${selector} tidak ditemukan`);
      return;
    }
    const shot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      clip: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        scale: 1
      }
    });
    saveDual(filename, Buffer.from(shot.data, "base64"));
  } catch (err) {
    console.error(`Gagal capture clip ${selector}:`, err.message);
  }
}

export async function captureAll() {
  const server = http.createServer(staticServer);
  await new Promise((resolve) => server.listen(8099, "127.0.0.1", resolve));
  const port = server.address().port;
  console.log(`🌐 Local server berjalan di http://127.0.0.1:${port}`);

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-features=Translate",
    "--window-size=1280,800",
    "about:blank"
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));

    const newTargetRes = await fetch(`http://127.0.0.1:9222/json/new?about:blank`, { method: "PUT" });
    const targetData = await newTargetRes.json();
    const pageWsUrl = targetData.webSocketDebuggerUrl;

    const cdp = new CdpClient(pageWsUrl);
    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Runtime.enable");

    // ==========================================
    // 1. DESKTOP CAPTURE (1280 x 800)
    // ==========================================
    console.log(`\n🖥️ Mengambil screenshot desktop...`);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/` });
    await new Promise((r) => setTimeout(r, 3500));

    // Desktop Hero
    const dView = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_desktop_hero.png", Buffer.from(dView.data, "base64"));

    // Desktop Specific Section: NSR Cloud
    await captureClip(cdp, "#sistem-mutu", "restorasi_desktop_nsr_cloud.png");

    // Desktop Specific Section: 5 Kantor Resmi
    await captureClip(cdp, "#kantor", "restorasi_desktop_5_kantor.png");

    // Desktop Specific Section: Manajemen & Dewan Rekan
    await captureClip(cdp, "#manajemen", "restorasi_desktop_manajemen.png");

    // Desktop Specific Section: FlexCarousel Galeri
    await captureClip(cdp, "#galeri", "restorasi_desktop_galeri.png");

    // Desktop Full Page
    const dMetrics = await cdp.send("Page.getLayoutMetrics");
    const dHeight = Math.min(Math.ceil(dMetrics.contentSize ? dMetrics.contentSize.height : dMetrics.cssContentSize.height), 12000);
    console.log(`   Tinggi konten desktop: ${dHeight}px`);

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: dHeight,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise((r) => setTimeout(r, 1200));

    const dFull = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    saveDual("restorasi_desktop_full.png", Buffer.from(dFull.data, "base64"));

    // ==========================================
    // 2. MOBILE CAPTURE (390 x 844)
    // ==========================================
    console.log(`\n📱 Mengambil screenshot smartphone...`);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/` });
    await new Promise((r) => setTimeout(r, 3000));

    // Mobile Viewport (Hero)
    const mView = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_mobile_hero.png", Buffer.from(mView.data, "base64"));

    // Mobile Specific: NSR Cloud
    await captureClip(cdp, "#sistem-mutu", "restorasi_mobile_nsr_cloud.png");

    // Mobile Specific: 5 Kantor
    await captureClip(cdp, "#kantor", "restorasi_mobile_5_kantor.png");

    // Mobile Full Page
    const mMetrics = await cdp.send("Page.getLayoutMetrics");
    const mHeight = Math.min(Math.ceil(mMetrics.contentSize ? mMetrics.contentSize.height : mMetrics.cssContentSize.height), 16000);
    console.log(`   Tinggi konten mobile: ${mHeight}px`);

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: mHeight,
      deviceScaleFactor: 1,
      mobile: true
    });
    await new Promise((r) => setTimeout(r, 1200));

    const mFull = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    saveDual("restorasi_mobile_full.png", Buffer.from(mFull.data, "base64"));

    cdp.close();
    console.log(`\n✅ Seluruh screenshot restorasi selesai diambil!`);
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
  }
}

captureAll().catch((err) => {
  console.error("Gagal capture:", err);
  process.exit(1);
});
