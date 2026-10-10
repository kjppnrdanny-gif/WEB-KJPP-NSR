/**
 * Script Pengujian Konsistensi Portal Internal & Pengambilan Bukti Screenshot
 * Menguji kepatuhan navigasi:
 * 1. Modal Portal Internal identik di index.html, layanan.html, tim-cabang.html
 * 2. Klik NoLap -> portal-nolap.html (bukan Google Drive)
 * 3. Klik Kwitansi -> portal-kwitansi.html (bukan Google Drive)
 * 4. Google Drive hanya untuk Folder Dokumen & SOP Cabang
 * 5. Visual NSR Cloud, 5 Kantor, dan Tampilan HP
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
  await new Promise((resolve) => server.listen(8097, "127.0.0.1", resolve));
  const port = server.address().port;
  console.log(`🌐 Server verifikasi aktif di http://127.0.0.1:${port}`);

  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-cdp-portal-"));
  const cdpPort = 9225;

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tempUserDataDir}`,
    "--no-sandbox",
    "--disable-gpu",
    "--disable-features=Translate",
    "--window-size=1280,850",
    "about:blank"
  ]);

  const testReport = {
    timestamp: new Date().toISOString(),
    pagesTested: {},
    navigationClicks: {},
    screenshotsGenerated: []
  };

  try {
    await new Promise((r) => setTimeout(r, 2500));

    // Connect to CDP
    const targetRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new?about:blank`, { method: "PUT" });
    const targetData = await targetRes.json();
    const cdp = new CdpClient(targetData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Runtime.enable");

    // Helper function to extract portal modal links
    async function inspectModalLinks(pageName) {
      const evalRes = await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const m = document.getElementById('modal-portal');
          if (!m) return { found: false };
          const links = Array.from(m.querySelectorAll('a')).map(a => ({
            text: a.innerText.replace(/\\s+/g, ' ').trim(),
            href: a.getAttribute('href'),
            target: a.getAttribute('target') || '_self'
          }));
          return {
            found: true,
            modalVisible: !m.classList.contains('hidden'),
            linksCount: links.length,
            links
          };
        })()`,
        returnByValue: true
      });
      return evalRes.result.value;
    }

    // =========================================================================
    // TEST 1: index.html - Portal Modal
    // =========================================================================
    console.log("\n==================================================");
    console.log("TEST 1: Memeriksa Modal Portal di index.html");
    console.log("==================================================");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 850, deviceScaleFactor: 1, mobile: false });
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html` });
    await new Promise((r) => setTimeout(r, 2000));

    // Buka modal
    await cdp.send("Runtime.evaluate", { expression: "bukaModalPortal()" });
    await new Promise((r) => setTimeout(r, 600));

    const indexInspect = await inspectModalLinks("index.html");
    testReport.pagesTested["index.html"] = indexInspect;
    console.log("Hasil inspeksi index.html:", JSON.stringify(indexInspect, null, 2));

    const shotIndex = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("modal_portal_index.png", Buffer.from(shotIndex.data, "base64"));
    testReport.screenshotsGenerated.push("modal_portal_index.png");

    // Tutup modal
    await cdp.send("Runtime.evaluate", { expression: "tutupModalPortal()" });
    await new Promise((r) => setTimeout(r, 400));

    // =========================================================================
    // TEST 2: layanan.html - Portal Modal
    // =========================================================================
    console.log("\n==================================================");
    console.log("TEST 2: Memeriksa Modal Portal di layanan.html");
    console.log("==================================================");
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/layanan.html` });
    await new Promise((r) => setTimeout(r, 2000));

    await cdp.send("Runtime.evaluate", { expression: "bukaModalPortal()" });
    await new Promise((r) => setTimeout(r, 600));

    const layananInspect = await inspectModalLinks("layanan.html");
    testReport.pagesTested["layanan.html"] = layananInspect;
    console.log("Hasil inspeksi layanan.html:", JSON.stringify(layananInspect, null, 2));

    const shotLayanan = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("modal_portal_layanan.png", Buffer.from(shotLayanan.data, "base64"));
    testReport.screenshotsGenerated.push("modal_portal_layanan.png");

    await cdp.send("Runtime.evaluate", { expression: "tutupModalPortal()" });
    await new Promise((r) => setTimeout(r, 400));

    // =========================================================================
    // TEST 3: tim-cabang.html - Portal Modal
    // =========================================================================
    console.log("\n==================================================");
    console.log("TEST 3: Memeriksa Modal Portal di tim-cabang.html");
    console.log("==================================================");
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/tim-cabang.html` });
    await new Promise((r) => setTimeout(r, 2000));

    await cdp.send("Runtime.evaluate", { expression: "bukaModalPortal()" });
    await new Promise((r) => setTimeout(r, 600));

    const timInspect = await inspectModalLinks("tim-cabang.html");
    testReport.pagesTested["tim-cabang.html"] = timInspect;
    console.log("Hasil inspeksi tim-cabang.html:", JSON.stringify(timInspect, null, 2));

    const shotTim = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("modal_portal_tim_cabang.png", Buffer.from(shotTim.data, "base64"));
    testReport.screenshotsGenerated.push("modal_portal_tim_cabang.png");

    await cdp.send("Runtime.evaluate", { expression: "tutupModalPortal()" });
    await new Promise((r) => setTimeout(r, 400));

    // =========================================================================
    // TEST 4: PENGUJIAN KLIK NYATA KE portal-nolap.html & portal-kwitansi.html
    // =========================================================================
    console.log("\n==================================================");
    console.log("TEST 4: Pengujian Klik Navigasi Nyata (NoLap & Kwitansi)");
    console.log("==================================================");

    // 4A. Klik NoLap
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html` });
    await new Promise((r) => setTimeout(r, 1500));
    await cdp.send("Runtime.evaluate", { expression: "bukaModalPortal()" });
    await new Promise((r) => setTimeout(r, 500));

    // Klik tombol portal nolap via JS click
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector('#modal-portal a[href="portal-nolap.html"]').click()`
    });
    await new Promise((r) => setTimeout(r, 2000));

    const locNolap = await cdp.send("Runtime.evaluate", {
      expression: "window.location.href",
      returnByValue: true
    });
    console.log(`📍 URL Setelah Klik NoLap: ${locNolap.result.value}`);
    testReport.navigationClicks["klik_nolap"] = {
      targetUrl: locNolap.result.value,
      isPortalNolapHtml: locNolap.result.value.endsWith("portal-nolap.html"),
      isNotGoogleDrive: !locNolap.result.value.includes("drive.google.com")
    };

    // 4B. Klik Kwitansi
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html` });
    await new Promise((r) => setTimeout(r, 1500));
    await cdp.send("Runtime.evaluate", { expression: "bukaModalPortal()" });
    await new Promise((r) => setTimeout(r, 500));

    // Klik tombol portal kwitansi via JS click
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector('#modal-portal a[href="portal-kwitansi.html"]').click()`
    });
    await new Promise((r) => setTimeout(r, 2000));

    const locKwitansi = await cdp.send("Runtime.evaluate", {
      expression: "window.location.href",
      returnByValue: true
    });
    console.log(`📍 URL Setelah Klik Kwitansi: ${locKwitansi.result.value}`);
    testReport.navigationClicks["klik_kwitansi"] = {
      targetUrl: locKwitansi.result.value,
      isPortalKwitansiHtml: locKwitansi.result.value.endsWith("portal-kwitansi.html"),
      isNotGoogleDrive: !locKwitansi.result.value.includes("drive.google.com")
    };

    // =========================================================================
    // TEST 5: VISUAL SCREENSHOTS (NSR CLOUD & 5 KANTOR & MOBILE)
    // =========================================================================
    console.log("\n==================================================");
    console.log("TEST 5: Pengambilan Visual NSR Cloud, 5 Kantor & Mobile");
    console.log("==================================================");

    // 5A. NSR Cloud Desktop
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html#nsr-cloud` });
    await new Promise((r) => setTimeout(r, 2000));
    // Scroll element into view perfectly
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('nsr-cloud')?.scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shotNsrCloud = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("visual_nsr_cloud_desktop.png", Buffer.from(shotNsrCloud.data, "base64"));
    testReport.screenshotsGenerated.push("visual_nsr_cloud_desktop.png");

    // 5B. 5 Kantor Desktop
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('jaringan-kantor')?.scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shot5Kantor = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("visual_5_kantor_desktop.png", Buffer.from(shot5Kantor.data, "base64"));
    testReport.screenshotsGenerated.push("visual_5_kantor_desktop.png");

    // 5C. Mobile Viewport (375 x 812)
    console.log("\n📱 Mengubah ke Mobile Viewport 375x812...");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
    
    // Mobile Hero
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html` });
    await new Promise((r) => setTimeout(r, 2000));
    const shotMobileHero = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("visual_mobile_hero.png", Buffer.from(shotMobileHero.data, "base64"));
    testReport.screenshotsGenerated.push("visual_mobile_hero.png");

    // Mobile Portal Modal
    await cdp.send("Runtime.evaluate", { expression: "bukaModalPortal()" });
    await new Promise((r) => setTimeout(r, 600));
    const shotMobilePortal = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("modal_portal_mobile.png", Buffer.from(shotMobilePortal.data, "base64"));
    testReport.screenshotsGenerated.push("modal_portal_mobile.png");

    // Close modal on mobile
    await cdp.send("Runtime.evaluate", { expression: "tutupModalPortal()" });
    await new Promise((r) => setTimeout(r, 400));

    // Mobile NSR Cloud
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('nsr-cloud')?.scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shotMobileNsrCloud = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("visual_mobile_nsr_cloud.png", Buffer.from(shotMobileNsrCloud.data, "base64"));
    testReport.screenshotsGenerated.push("visual_mobile_nsr_cloud.png");

    // Mobile 5 Kantor
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById('jaringan-kantor')?.scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shotMobile5Kantor = await cdp.send("Page.captureScreenshot", { format: "png" });
    saveDual("visual_mobile_5_kantor.png", Buffer.from(shotMobile5Kantor.data, "base64"));
    testReport.screenshotsGenerated.push("visual_mobile_5_kantor.png");

    cdp.close();

    // Simpan JSON laporan
    const reportPath = path.join(ARTIFACT_DIR, "portal_verification_results.json");
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2), "utf8");
    console.log(`\n✅ Laporan verifikasi tersimpan di: ${reportPath}`);

  } finally {
    try {
      chromeProc.kill("SIGKILL");
    } catch (e) {}
    try {
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch (e) {}
    server.close();
    console.log("🏁 Selesai. Server dan Chrome ditutup.");
  }
}

main().catch(err => {
  console.error("❌ Terjadi kesalahan saat pengujian:", err);
  process.exit(1);
});
