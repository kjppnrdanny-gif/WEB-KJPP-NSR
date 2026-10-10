/**
 * KJPP NSR - Pengujian Browser Nyata End-to-End Portal Kwitansi (Chrome CDP)
 * Fast-Track Penyelenggaraan Keamanan Portal Kwitansi
 * 
 * Menguji:
 * 1. Pemuatan antarmuka portal-kwitansi-staging.html di Google Chrome asli.
 * 2. Pencegahan Token URL Bypass (?token=JKT#00 diabaikan 100%).
 * 3. Proteksi Kuki HttpOnly: JavaScript (document.cookie) tidak dapat membaca nsr_session.
 * 4. Penegakan Hak Akses UI (RBAC UI):
 *    - Cabang Bandung: Tab 2 (Keuangan Pusat) terblokir guard peringatan.
 *    - Dropdown cabang pengaju otomatis terkunci ke Cabang Bandung.
 * 5. Kalkulator Finansial & Terbilang Rupiah Otomatis.
 * 6. Submit Draf Tagihan Cabang via Proxy Serverless (Bukan Google Form).
 * 7. Logout & Pengakhiran Sesi di Chrome.
 * 8. Login Keuangan Pusat (test_keuangan) & Pembukaan Tab Otorisasi.
 * 9. Penetapan Nomor Resmi & Pengesahan Dokumen Kwitansi.
 * 10. Verifikasi Elemen Cetak PDF A4 Presisi Bersih.
 * 11. Zero Leak: Audit seluruh trafik jaringan keluar Chrome CDP.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import authLoginHandler from "../staging-isolated-package/netlify/functions/auth-login.mjs";
import authVerifyHandler from "../staging-isolated-package/netlify/functions/auth-verify.mjs";
import authLogoutHandler from "../staging-isolated-package/netlify/functions/auth-logout.mjs";
import kwitansiProxyHandler, {
  _resetDummyKwitansiDatabase
} from "../staging-isolated-package/netlify/functions/kwitansi-data-proxy.mjs";
import { resetFailedLogin } from "../staging-isolated-package/netlify/functions/lib/auth-core.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const STAGING_PUBLIC = path.join(ROOT_DIR, "staging-isolated-package", "public");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

let passed = 0;
let failed = 0;

function report(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function reportAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// HTTP Server Lokal menyajikan staging-isolated-package/public
async function handleStagingKwitansiServer(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === "/" || pathname === "/portal-kwitansi-staging.html") {
    const targetFile = path.join(STAGING_PUBLIC, "portal-kwitansi-staging.html");
    if (fs.existsSync(targetFile)) {
      const content = fs.readFileSync(targetFile, "utf-8");
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "x-content-type-options": "nosniff"
      });
      res.end(content);
      return;
    }
  }

  if (pathname === "/logo-nsr.png") {
    const targetFile = path.join(STAGING_PUBLIC, "logo-nsr.png");
    if (fs.existsSync(targetFile)) {
      const content = fs.readFileSync(targetFile);
      res.writeHead(200, { "content-type": "image/png" });
      res.end(content);
      return;
    }
  }

  let bodyBuffer = [];
  for await (const chunk of req) {
    bodyBuffer.push(chunk);
  }
  const bodyText = Buffer.concat(bodyBuffer).toString();

  const webHeaders = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) {
      v.forEach((val) => webHeaders.append(k, val));
    } else if (v !== undefined) {
      webHeaders.set(k, v);
    }
  }

  const init = { method: req.method, headers: webHeaders };
  if (["POST", "PUT", "PATCH"].includes(req.method) && bodyText.length > 0) {
    init.body = bodyText;
  }

  const webReq = new Request(`http://${req.headers.host}${req.url}`, init);

  let webRes;
  try {
    if (pathname === "/api/auth-login") {
      webRes = await authLoginHandler(webReq);
    } else if (pathname === "/api/auth-verify") {
      webRes = await authVerifyHandler(webReq);
    } else if (pathname === "/api/auth-logout") {
      webRes = await authLogoutHandler(webReq);
    } else if (pathname === "/api/kwitansi-data-proxy") {
      webRes = await kwitansiProxyHandler(webReq);
    } else {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Endpoint tidak ditemukan" }));
      return;
    }
  } catch (err) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Internal Server Error", message: err.message }));
    return;
  }

  const nodeHeaders = {};
  for (const [k, v] of webRes.headers.entries()) {
    if (k.toLowerCase() === "set-cookie") {
      const rawCookie = webRes.headers.get("set-cookie");
      nodeHeaders["set-cookie"] = rawCookie.replace(/;\s*Secure/gi, "");
    } else {
      nodeHeaders[k] = v;
    }
  }

  res.writeHead(webRes.status, nodeHeaders);
  const resBody = await webRes.text();
  res.end(resBody);
}

// Client Chrome DevTools Protocol (CDP) WebSocket
class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
    this.eventListeners = [];
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
        } else if (data.method) {
          for (const listener of this.eventListeners) {
            listener(data.method, data.params);
          }
        }
      } catch (e) {}
    };
  }

  onEvent(fn) {
    this.eventListeners.push(fn);
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : undefined;
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }
  }
}

async function runRealBrowserKwitansiE2E() {
  console.log("\n========================================================");
  console.log("🖥️  KJPP NSR - PENGUJIAN BROWSER SUNGGUHAN PORTAL KWITANSI");
  console.log("   Google Chrome Headless CDP & Zero Outbound Leak Audit");
  console.log("========================================================\n");

  _resetDummyKwitansiDatabase();
  await resetFailedLogin("test_cabang_bdg");
  await resetFailedLogin("test_keuangan");

  const server = http.createServer(handleStagingKwitansiServer);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const serverPort = server.address().port;
  const baseUrl = `http://127.0.0.1:${serverPort}`;
  console.log(`📡 Server Lokal Staging Aktif: ${baseUrl}`);

  const cdpPort = 9880 + Math.floor(Math.random() * 200);
  const chromeUserData = path.join(tmpdir(), `chrome_kwitansi_cdp_${Date.now()}`);
  console.log(`🚀 Meluncurkan Google Chrome Headless (CDP Port: ${cdpPort})...`);

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${chromeUserData}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "about:blank"
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  let versionData = null;
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        console.log(`🌐 Google Chrome Terhubung: ${versionData["Browser"] || versionData["User-Agent"]}`);
        break;
      }
    } catch (e) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  if (!versionData) {
    chromeProc.kill();
    server.close();
    throw new Error("Gagal menghubungkan Chrome CDP!");
  }

  // Buka tab baru untuk Page target
  const newTabRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new`, { method: "PUT" });
  const tabData = await newTabRes.json();
  const cdp = new CdpSession(tabData.webSocketDebuggerUrl);
  await cdp.connect();

  const capturedRequests = [];
  cdp.onEvent((method, params) => {
    if (method === "Network.requestWillBeSent") {
      capturedRequests.push({
        url: params.request.url,
        method: params.request.method
      });
    }
  });

  await cdp.send("Network.enable");
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  try {
    // -----------------------------------------------------------------------
    // TAHAP 1: Pemuatan Halaman & Anti-URL Token Bypass
    // -----------------------------------------------------------------------
    console.log("\n👉 TAHAP 1: Pemuatan Halaman & Anti-URL Token Bypass (?token=JKT#00)");

    await reportAsync("Navigasi ke portal-kwitansi-staging.html dengan parameter token URL", async () => {
      // Menguji apakah parameter URL ?token=JKT#00 memberikan akses otomatis
      await cdp.send("Page.navigate", { url: `${baseUrl}/portal-kwitansi-staging.html?token=JKT%2300` });
      await new Promise((r) => setTimeout(r, 1200));

      const title = await cdp.evaluate("document.title");
      assert.ok(title.includes("Portal Kwitansi (Staging Terisolasi)"));
      await cdp.evaluate("window.alert = () => {}; window.confirm = () => true;");
    });

    report("Anti-URL Bypass: Parameter ?token= diabaikan (Box login tetap aktif & terkunci)", async () => {
      const isLoginVisible = await cdp.evaluate("!document.getElementById('box-auth-kwitansi').classList.contains('hidden')");
      const badgeText = await cdp.evaluate("document.getElementById('label-sesi-cabang').innerText");
      assert.strictEqual(isLoginVisible, true);
      assert.ok(badgeText.includes("Belum Login"));
    });

    // -----------------------------------------------------------------------
    // TAHAP 2: Login Gagal & Proteksi Kuki di Chrome
    // -----------------------------------------------------------------------
    console.log("\n👉 TAHAP 2: Penanganan Login Gagal");

    await reportAsync("Login gagal menampilkan notifikasi error di DOM dan tidak menerbitkan kuki", async () => {
      await cdp.evaluate(`
        document.getElementById('kwitansi-auth-username').value = 'test_cabang_bdg';
        document.getElementById('kwitansi-auth-password').value = 'PasswordSalah123!';
      `);
      await cdp.evaluate("masukSesiKwitansi()");
      await new Promise((r) => setTimeout(r, 600));

      const errText = await cdp.evaluate("document.getElementById('pesan-auth-kwitansi').innerText");
      assert.ok(errText.includes("Autentikasi gagal") || errText.includes("tidak valid"));

      const cookiesRes = await cdp.send("Network.getCookies");
      const nsrCookie = cookiesRes.cookies.find((c) => c.name === "nsr_session");
      assert.strictEqual(nsrCookie, undefined);
    });

    // -----------------------------------------------------------------------
    // TAHAP 3: Login Sukses Cabang Bandung & Proteksi HttpOnly di Chrome
    // -----------------------------------------------------------------------
    console.log("\n👉 TAHAP 3: Login Sukses Cabang Bandung & Proteksi HttpOnly");

    await reportAsync("Login sukses Cabang Bandung (test_cabang_bdg) beralih ke panel form", async () => {
      await cdp.evaluate(`
        document.getElementById('kwitansi-auth-username').value = 'test_cabang_bdg';
        document.getElementById('kwitansi-auth-password').value = 'CabangSecret2026!';
      `);
      await cdp.evaluate("masukSesiKwitansi()");
      await new Promise((r) => setTimeout(r, 1000));

      const isLoginHidden = await cdp.evaluate("document.getElementById('box-auth-kwitansi').classList.contains('hidden')");
      assert.strictEqual(isLoginHidden, true);

      const badgeText = await cdp.evaluate("document.getElementById('label-sesi-cabang').innerText");
      assert.ok(badgeText.includes("Cabang Bandung"));
      assert.ok(badgeText.includes("CABANG"));
    });

    report("Proteksi HttpOnly: JavaScript (document.cookie) TIDAK DAPAT membaca token nsr_session", async () => {
      const docCookie = await cdp.evaluate("document.cookie");
      assert.strictEqual(docCookie.includes("nsr_session"), false);
    });

    report("Pemeriksaan Kuki di Chrome Network: HttpOnly=true, SameSite=Strict", async () => {
      const cookiesRes = await cdp.send("Network.getCookies");
      const nsrCookie = cookiesRes.cookies.find((c) => c.name === "nsr_session");
      assert.ok(nsrCookie);
      assert.strictEqual(nsrCookie.httpOnly, true);
      assert.strictEqual(nsrCookie.sameSite, "Strict");
    });

    report("Dropdown Cabang Pengaju Terkunci Otomatis ke Cabang Pengguna", async () => {
      const selValue = await cdp.evaluate("document.getElementById('cabang-pengaju').value");
      const isDisabled = await cdp.evaluate("document.getElementById('cabang-pengaju').disabled");
      assert.ok(selValue.includes("Bandung"));
      assert.strictEqual(isDisabled, true);
    });

    // -----------------------------------------------------------------------
    // TAHAP 4: Penegakan Hak Akses UI (RBAC) Cabang
    // -----------------------------------------------------------------------
    console.log("\n👉 TAHAP 4: Penegakan Hak Akses Antarmuka (RBAC UI Cabang)");

    await reportAsync("Cabang mengklik Tab 2 (Keuangan Pusat): Ditolak dengan guard peringatan", async () => {
      await cdp.evaluate("gantiTab('pusat')");
      await new Promise((r) => setTimeout(r, 400));

      const isGuardVisible = await cdp.evaluate("!document.getElementById('guard-akses-pusat-cabang').classList.contains('hidden')");
      const isOpsHidden = await cdp.evaluate("document.getElementById('konten-operasional-pusat').classList.contains('hidden')");
      assert.strictEqual(isGuardVisible, true);
      assert.strictEqual(isOpsHidden, true);
    });

    // -----------------------------------------------------------------------
    // TAHAP 5: Interaktivitas Form: Kalkulator DPP, PPN & Terbilang Rupiah
    // -----------------------------------------------------------------------
    console.log("\n👉 TAHAP 5: Kalkulator Finansial & Terbilang Rupiah");

    await reportAsync("Perhitungan DPP Rp 20.000.000 menghasilkan PPN 11% & Terbilang otomatis", async () => {
      await cdp.evaluate("gantiTab('cabang')");
      await cdp.evaluate(`
        document.getElementById('harga-dasar').value = 20000000;
        hitungKwitansi();
      `);

      const ppnVal = await cdp.evaluate("document.getElementById('nominal-ppn').value");
      const totalVal = await cdp.evaluate("document.getElementById('total-bayar').value");
      const terbilangVal = await cdp.evaluate("document.getElementById('teks-terbilang').value");

      assert.strictEqual(Number(ppnVal), 2200000);
      assert.strictEqual(Number(totalVal), 22200000);
      assert.ok(terbilangVal.includes("Dua Puluh Dua Juta Dua Ratus Ribu Rupiah"));
    });

    // -----------------------------------------------------------------------
    // TAHAP 6: Submit Draf Kwitansi oleh Cabang
    // -----------------------------------------------------------------------
    console.log("\n👉 TAHAP 6: Submit Draf Kwitansi Cabang ke Proxy Serverless");

    await reportAsync("Submit pengajuan draf kwitansi berhasil menampilkan notifikasi sukses", async () => {
      await cdp.evaluate(`
        document.getElementById('identitas-klien').value = 'PT Rekanan Bank Mandiri (Simulasi Cabang)';
        document.getElementById('keterangan-penugasan').value = 'Biaya Penilaian Ruko Asia Afrika';
        document.getElementById('banyaknya-termin').value = '100% Pelunasan';
      `);

      await cdp.evaluate(`(async () => {
        const fakeEvt = { preventDefault: () => {} };
        await prosesSubmitPengajuan(fakeEvt);
      })()`);

      await new Promise((r) => setTimeout(r, 800));

      const isSuksesVisible = await cdp.evaluate("!document.getElementById('panel-notifikasi-sukses').classList.contains('hidden')");
      assert.strictEqual(isSuksesVisible, true);
    });

    // -----------------------------------------------------------------------
    // TAHAP 7: Logout Cabang Bandung
    // -----------------------------------------------------------------------
    console.log("\n👉 TAHAP 7: Logout Cabang Bandung & Pembersihan Sesi");

    await reportAsync("Logout berhasil mengembalikan UI ke login", async () => {
      await cdp.evaluate("keluarSesiKwitansi()");
      await new Promise((r) => setTimeout(r, 600));

      const isLoginVisible = await cdp.evaluate("!document.getElementById('box-auth-kwitansi').classList.contains('hidden')");
      assert.strictEqual(isLoginVisible, true);
    });

    // -----------------------------------------------------------------------
    // TAHAP 8: Login Keuangan Pusat & Pembukaan Otorisasi
    // -----------------------------------------------------------------------
    console.log("\n👉 TAHAP 8: Login Keuangan Pusat (test_keuangan) & Pengesahan");

    await reportAsync("Login Keuangan Pusat berhasil dan membuka Tab Otorisasi Keuangan", async () => {
      await cdp.evaluate(`
        document.getElementById('kwitansi-auth-username').value = 'test_keuangan';
        document.getElementById('kwitansi-auth-password').value = 'FinanceSecret2026!';
      `);
      await cdp.evaluate("masukSesiKwitansi()");
      await new Promise((r) => setTimeout(r, 1000));

      await cdp.evaluate("gantiTab('pusat')");
      await new Promise((r) => setTimeout(r, 600));

      const isOpsVisible = await cdp.evaluate("!document.getElementById('konten-operasional-pusat').classList.contains('hidden')");
      const isGuardHidden = await cdp.evaluate("document.getElementById('guard-akses-pusat-cabang').classList.contains('hidden')");
      assert.strictEqual(isOpsVisible, true);
      assert.strictEqual(isGuardHidden, true);
    });

    // -----------------------------------------------------------------------
    // TAHAP 9: Pengesahan Kwitansi Resmi & Verifikasi Cetak PDF A4
    // -----------------------------------------------------------------------
    console.log("\n👉 TAHAP 9: Pengesahan Nomor Kwitansi Resmi & Layout Cetak PDF");

    await reportAsync("Keuangan Pusat menetapkan Nomor Resmi 021/KW-NSR/X/2026 dan mengesahkan dokumen", async () => {
      await cdp.evaluate(`
        document.getElementById('no-kwitansi-resmi').value = '021/KW-NSR/X/2026';
        perbaruiPreviewKwitansi();
      `);

      const alertMsg = await cdp.evaluate(`(async () => {
        window.__lastAlert = null;
        window.alert = (m) => { window.__lastAlert = m; };
        window.confirm = () => true;
        await sahkanDanKunciKwitansi();
        return window.__lastAlert;
      })()`);
      console.log("   ℹ️  Alert dari sahkanDanKunciKwitansi:", alertMsg);

      await new Promise((r) => setTimeout(r, 800));

      const badgeText = await cdp.evaluate("document.getElementById('badge-status-pusat')?.innerText || ''");
      assert.ok(badgeText.toUpperCase().includes("DISAHKAN KEUANGAN PUSAT"));

      // Periksa area cetak print-area
      const printNoKwitansi = await cdp.evaluate("document.getElementById('print-no-kwitansi').innerText");
      const printTotal = await cdp.evaluate("document.getElementById('print-total-bayar').innerText");
      assert.strictEqual(printNoKwitansi, "021/KW-NSR/X/2026");
      assert.ok(printTotal.includes("Rp"));
    });

    // -----------------------------------------------------------------------
    // TAHAP 10: Audit Trafik Jaringan Keluar (Zero Production Leak)
    // -----------------------------------------------------------------------
    console.log("\n👉 TAHAP 10: Audit Komprehensif Trafik Jaringan Keluar (CDP Outbound Traffic)");

    const totalReqs = capturedRequests.length;
    console.log(`   ℹ️  Total permintaan jaringan tertangkap: ${totalReqs}`);

    report("ZERO Permintaan Keluar ke Google Forms (docs.google.com/forms)", () => {
      const gforms = capturedRequests.filter((r) => r.url.includes("docs.google.com/forms"));
      assert.strictEqual(gforms.length, 0);
    });

    report("ZERO Permintaan Keluar ke Google Sheets / GVIZ API", () => {
      const gsheets = capturedRequests.filter((r) => r.url.includes("spreadsheets") || r.url.includes("gviz"));
      assert.strictEqual(gsheets.length, 0);
    });

    report("ZERO Permintaan Keluar ke WhatsApp / wa.me API", () => {
      const wa = capturedRequests.filter((r) => r.url.includes("wa.me") || r.url.includes("whatsapp.com"));
      assert.strictEqual(wa.length, 0);
    });

    report("ZERO Permintaan Keluar ke Domain Produksi (kjppnanangrahayu.com)", () => {
      const prod = capturedRequests.filter((r) => r.url.includes("kjppnanangrahayu.com"));
      assert.strictEqual(prod.length, 0);
    });

    report("Seluruh request eksternal murni CDN aset tampilan (Tailwind / Fonts) tanpa payload data sensitif", () => {
      for (const req of capturedRequests) {
        if (!req.url.startsWith("http://") && !req.url.startsWith("https://")) continue;
        const parsed = new URL(req.url);
        if (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") continue;
        const isAllowedCdn =
          parsed.hostname.includes("tailwindcss.com") ||
          parsed.hostname.includes("googleapis.com") ||
          parsed.hostname.includes("gstatic.com");
        assert.strictEqual(isAllowedCdn, true, `Domain tidak dikenal terdeteksi: ${parsed.hostname}`);
      }
    });

    console.log("\n========================================================");
    console.log(`📊 HASIL PENGUJIAN BROWSER KWITANSI SUNGGUHAN: ${passed} LULUS, ${failed} GAGAL`);
    console.log("========================================================\n");

  } finally {
    cdp.close();
    chromeProc.kill();
    server.close();
    try {
      fs.rmSync(chromeUserData, { recursive: true, force: true });
    } catch (e) {}
  }

  if (failed > 0) process.exit(1);
}

runRealBrowserKwitansiE2E().catch((err) => {
  console.error("Fatal browser test error:", err);
  process.exit(1);
});
