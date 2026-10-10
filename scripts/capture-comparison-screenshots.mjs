/**
 * Script Pengambil Screenshot Lengkap (Full-Page & Section)
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

export async function captureComparison(prefix = "sebelum") {
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

    // Dapatkan websocket debugger URL untuk page target
    const newTargetRes = await fetch(`http://127.0.0.1:9222/json/new?about:blank`, { method: "PUT" });
    const targetData = await newTargetRes.json();
    const pageWsUrl = targetData.webSocketDebuggerUrl;

    const cdp = new CdpClient(pageWsUrl);
    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Runtime.enable");

    // 1. DESKTOP CAPTURE
    console.log(`\n🖥️ Mengambil screenshot desktop (${prefix})...`);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/` });
    await new Promise((r) => setTimeout(r, 3000));

    // Desktop Viewport (Hero)
    const dView = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual(`${prefix}_desktop_hero.png`, Buffer.from(dView.data, "base64"));

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
    await new Promise((r) => setTimeout(r, 1000));

    const dFull = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    saveDual(`${prefix}_desktop_full.png`, Buffer.from(dFull.data, "base64"));

    // 2. MOBILE CAPTURE (390 x 844)
    console.log(`\n📱 Mengambil screenshot smartphone (${prefix})...`);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/` });
    await new Promise((r) => setTimeout(r, 2500));

    // Mobile Viewport (Hero)
    const mView = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual(`${prefix}_mobile_hero.png`, Buffer.from(mView.data, "base64"));

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
    await new Promise((r) => setTimeout(r, 1000));

    const mFull = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    saveDual(`${prefix}_mobile_full.png`, Buffer.from(mFull.data, "base64"));

    cdp.close();
    console.log(`\n✅ Pengambilan screenshot [${prefix}] selesai!`);
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const prefix = process.argv[2] || "sebelum";
  captureComparison(prefix).catch((err) => {
    console.error("Gagal capture:", err);
    process.exit(1);
  });
}
