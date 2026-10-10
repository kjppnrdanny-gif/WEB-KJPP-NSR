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

export async function runCapture() {
  const server = http.createServer(staticServer);
  await new Promise((resolve) => server.listen(8099, "127.0.0.1", resolve));
  const port = server.address().port;
  console.log(`🌐 Server berjalan di http://127.0.0.1:${port}`);

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-features=Translate",
    "--window-size=1280,900",
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
    await new Promise((r) => setTimeout(r, 3000));

    // A. Hero Desktop
    console.log(`📸 Mengambil desktop hero...`);
    const dHero = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_desktop_hero.png", Buffer.from(dHero.data, "base64"));

    // B. NSR Cloud Section
    console.log(`📸 Mengambil desktop NSR Cloud section...`);
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('sistem-mutu')?.scrollIntoView({ block: 'start' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const dCloud = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_desktop_nsr_cloud.png", Buffer.from(dCloud.data, "base64"));

    // C. 5 Kantor Resmi Section
    console.log(`📸 Mengambil desktop 5 Kantor Resmi section...`);
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('kantor')?.scrollIntoView({ block: 'start' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const dKantor = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_desktop_5_kantor.png", Buffer.from(dKantor.data, "base64"));

    // D. Manajemen Rekan Section
    console.log(`📸 Mengambil desktop Manajemen Rekan section...`);
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('manajemen')?.scrollIntoView({ block: 'start' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const dManajemen = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_desktop_manajemen.png", Buffer.from(dManajemen.data, "base64"));

    // E. Galeri FlexCarousel Section
    console.log(`📸 Mengambil desktop Galeri section...`);
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('galeri')?.scrollIntoView({ block: 'start' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const dGaleri = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_desktop_galeri.png", Buffer.from(dGaleri.data, "base64"));

    // F. Full-Page Desktop
    console.log(`📸 Mengambil desktop Full-Page...`);
    await cdp.send("Runtime.evaluate", { expression: `window.scrollTo(0, 0);` });
    const dMetrics = await cdp.send("Page.getLayoutMetrics");
    const dHeight = Math.ceil(dMetrics.contentSize ? dMetrics.contentSize.height : dMetrics.cssContentSize.height);
    console.log(`   Total tinggi desktop: ${dHeight}px`);

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: dHeight,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise((r) => setTimeout(r, 1500));
    const dFull = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_desktop_full.png", Buffer.from(dFull.data, "base64"));

    cdp.close();

    // ==========================================
    // 2. MOBILE VIEWPORT & SECTIONS (390 x 844)
    // ==========================================
    console.log(`\n📱 [Mobile] Membuka tab baru untuk mobile capture...`);
    const mobTargetRes = await fetch(`http://127.0.0.1:9222/json/new?about:blank`, { method: "PUT" });
    const mobTargetData = await mobTargetRes.json();
    const mobCdp = new CdpClient(mobTargetData.webSocketDebuggerUrl);
    await mobCdp.connect();

    await mobCdp.send("Page.enable");
    await mobCdp.send("DOM.enable");
    await mobCdp.send("Runtime.enable");

    console.log(`📱 [Mobile] Setting viewport 390x844...`);
    await mobCdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });

    await mobCdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/` });
    await new Promise((r) => setTimeout(r, 3000));

    // A. Mobile Hero
    console.log(`📸 Mengambil mobile hero...`);
    const mHero = await mobCdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_mobile_hero.png", Buffer.from(mHero.data, "base64"));

    // B. Mobile NSR Cloud
    console.log(`📸 Mengambil mobile NSR Cloud...`);
    await mobCdp.send("Runtime.evaluate", {
      expression: `document.getElementById('sistem-mutu')?.scrollIntoView({ block: 'start' });`
    });
    await new Promise((r) => setTimeout(r, 1200));
    const mCloud = await mobCdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_mobile_nsr_cloud.png", Buffer.from(mCloud.data, "base64"));

    // C. Mobile 5 Kantor
    console.log(`📸 Mengambil mobile 5 Kantor...`);
    await mobCdp.send("Runtime.evaluate", {
      expression: `document.getElementById('kantor')?.scrollIntoView({ block: 'start' });`
    });
    await new Promise((r) => setTimeout(r, 1200));
    const mKantor = await mobCdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_mobile_5_kantor.png", Buffer.from(mKantor.data, "base64"));

    // D. Full-Page Mobile
    console.log(`📸 Mengambil mobile Full-Page...`);
    await mobCdp.send("Runtime.evaluate", { expression: `window.scrollTo(0, 0);` });
    await new Promise((r) => setTimeout(r, 500));
    const mMetrics = await mobCdp.send("Page.getLayoutMetrics");
    const mHeight = Math.ceil(mMetrics.contentSize ? mMetrics.contentSize.height : mMetrics.cssContentSize.height);
    console.log(`   Total tinggi mobile: ${mHeight}px`);

    await mobCdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: mHeight,
      deviceScaleFactor: 1,
      mobile: true
    });
    await new Promise((r) => setTimeout(r, 1500));
    const mFull = await mobCdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("restorasi_mobile_full.png", Buffer.from(mFull.data, "base64"));

    mobCdp.close();
    console.log(`\n🎉 Semua screenshot restorasi berhasil diambil dan disimpan!`);
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
  }
}

runCapture().catch((err) => {
  console.error("Gagal runCapture:", err);
  process.exit(1);
});
