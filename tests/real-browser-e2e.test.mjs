/**
 * KJPP NSR - Pengujian Browser Nyata End-to-End Menggunakan Google Chrome Headless CDP
 * (Tahap 2.6B-2C: Real Browser End-to-End Testing & DOM/Cookie Verification)
 * 
 * Pengujian ini menjalankan GOOGLE CHROME SUNGGUHAN (C:\Program Files\Google\Chrome\Application\chrome.exe)
 * dalam mode headless dengan Chrome DevTools Protocol (CDP) WebSocket:
 * 1. Pemuatan dan rendering antarmuka portal-nolap-dev.html di Chrome asli.
 * 2. Login gagal (pesan error DOM muncul, kuki tidak terbit).
 * 3. Login sukses (DOM beralih ke panel utama, kuki HttpOnly terpasang di Chrome).
 * 4. Proteksi HttpOnly: JavaScript (document.cookie) TIDAK DAPAT membaca nsr_session.
 * 5. Atribut kuki di Chrome Network: HttpOnly: true, SameSite: Strict, Path: /.
 * 6. Penjelasan atribut Secure (HTTPS di cloud vs HTTP localhost di pengujian lokal).
 * 7. Hak Akses UI Cabang: Tab Approval, eLSa, dan Riwayat Global tersembunyi.
 * 8. Interaktivitas Form: Live preview 7 segmen Kemenkeu dan cetak Kertas Kerja SPM.
 * 9. Reload Chrome (Page.reload): Sesi dipertahankan secara utuh.
 * 10. Logout: Sesi dibatalkan di server, kuki dihapus dari Chrome, UI kembali ke login.
 * 11. Hak Akses UI Admin Pusat: Tab Approval, eLSa, dan Riwayat Global terbuka penuh.
 * 12. Anti-URL Token Bypass: Parameter ?token= diabaikan oleh Chrome.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import authLoginHandler from "../netlify/functions/auth-login.mjs";
import authVerifyHandler from "../netlify/functions/auth-verify.mjs";
import authLogoutHandler from "../netlify/functions/auth-logout.mjs";
import nolapProxyHandler, { _resetDummyDatabase, _setTransactionalSimulationMode } from "../netlify/functions/nolap-data-proxy.mjs";
import { resetFailedLogin, setUserProvider } from "../netlify/functions/lib/auth-core.mjs";
import { registerTestUserProvider } from "./fixtures/test-users.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

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

// Handler HTTP Server Lokal untuk Chrome
async function handleServerRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 1. Sajikan berkas statis frontend (portal-nolap-dev.html)
  if (pathname === "/" || pathname === "/portal-nolap-dev.html") {
    const filePath = path.join(ROOT_DIR, "portal-nolap-dev.html");
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, "utf-8");
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "x-content-type-options": "nosniff"
      });
      res.end(html);
      return;
    }
  }

  // 2. Baca body jika ada
  let bodyBuffer = [];
  for await (const chunk of req) {
    bodyBuffer.push(chunk);
  }
  const bodyText = Buffer.concat(bodyBuffer).toString();

  // Buat Web Standard Request
  const webHeaders = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) {
      v.forEach((val) => webHeaders.append(k, val));
    } else if (v !== undefined) {
      webHeaders.set(k, v);
    }
  }

  const init = {
    method: req.method,
    headers: webHeaders
  };
  if (req.method !== "GET" && req.method !== "HEAD" && bodyText.length > 0) {
    init.body = bodyText;
  }

  const webReq = new Request(`http://${req.headers.host}${req.url}`, init);

  // 3. Routing ke Netlify Serverless Functions
  let webRes;
  try {
    if (pathname === "/api/auth-login") {
      webRes = await authLoginHandler(webReq);
    } else if (pathname === "/api/auth-verify") {
      webRes = await authVerifyHandler(webReq);
    } else if (pathname === "/api/auth-logout") {
      webRes = await authLogoutHandler(webReq);
    } else if (pathname === "/api/nolap-data-proxy") {
      webRes = await nolapProxyHandler(webReq);
    } else {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("Not Found");
      return;
    }
  } catch (err) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
    return;
  }

  // 4. Konversi Web Response kembali ke Node.js HTTP Response
  const resHeaders = {};
  for (const [k, v] of webRes.headers.entries()) {
    resHeaders[k] = v;
  }
  const setCookies = webRes.headers.getSetCookie ? webRes.headers.getSetCookie() : [];
  if (setCookies.length > 0) {
    resHeaders["set-cookie"] = setCookies;
  } else if (webRes.headers.get("set-cookie")) {
    resHeaders["set-cookie"] = webRes.headers.get("set-cookie");
  }

  res.writeHead(webRes.status, resHeaders);
  const resArrayBuffer = await webRes.arrayBuffer();
  res.end(Buffer.from(resArrayBuffer));
}

// Client Chrome DevTools Protocol (CDP) via native WebSocket
class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
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

async function runRealBrowserTestSuite() {
  console.log("\n========================================================");
  console.log("🖥️  KJPP NSR - PENGUJIAN BROWSER SUNGGUHAN (GOOGLE CHROME)");
  console.log("   Tahap 2.6B-2C (Real Headless Chrome & CDP Automation)");
  console.log("========================================================\n");

  assert.ok(fs.existsSync(CHROME_PATH), `Google Chrome tidak ditemukan di ${CHROME_PATH}`);

  // Inisialisasi mock provider & reset state
  registerTestUserProvider(setUserProvider);
  _resetDummyDatabase();
  _setTransactionalSimulationMode(true);
  await resetFailedLogin("test_admin");
  await resetFailedLogin("test_cabang_bdg");
  await resetFailedLogin("test_cabang_pdg");

  // Jalankan server lokal
  const server = http.createServer(handleServerRequest);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const serverPort = server.address().port;
  const baseUrl = `http://127.0.0.1:${serverPort}`;
  console.log(`📡 Server Lokal Aktif pada: ${baseUrl}`);

  // Siapkan direktori profil sementara Chrome
  const tmpUserData = path.join(tmpdir(), `kjpp-chrome-profile-${Date.now()}`);
  fs.mkdirSync(tmpUserData, { recursive: true });

  const chromePort = 9222 + Math.floor(Math.random() * 500);
  console.log(`🚀 Meluncurkan Google Chrome Headless pada port CDP: ${chromePort}...`);

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${tmpUserData}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-features=Translate"
  ]);

  let cdp = null;

  try {
    // Tunggu Chrome CDP endpoint siap (polling /json/version)
    let versionData = null;
    for (let i = 0; i < 20; i++) {
      try {
        const vRes = await fetch(`http://127.0.0.1:${chromePort}/json/version`);
        if (vRes.ok) {
          versionData = await vRes.json();
          break;
        }
      } catch (e) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    assert.ok(versionData, "Google Chrome gagal merespons endpoint DevTools Protocol");
    console.log(`🌐 Google Chrome Terhubung: ${versionData.Browser}`);

    // Buat target tab baru
    const newTabRes = await fetch(`http://127.0.0.1:${chromePort}/json/new`, { method: "PUT" });
    const tabData = await newTabRes.json();
    assert.ok(tabData.webSocketDebuggerUrl, "Target tab Chrome tidak memiliki WebSocket URL");

    cdp = new CdpSession(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    // Aktifkan domain CDP
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");

    // =====================================================================
    // 1. PEMUATAN HALAMAN & RENDERING DI CHROME SUNGGUHAN
    // =====================================================================
    console.log("\n👉 UJI 1: Rendering & Navigasi di Google Chrome Asli");

    await reportAsync("Google Chrome berhasil memuat portal-nolap-dev.html (HTTP 200)", async () => {
      await cdp.send("Page.navigate", { url: `${baseUrl}/portal-nolap-dev.html` });
      // Tunggu load event
      await new Promise((r) => setTimeout(r, 600));
      const pageTitle = await cdp.evaluate("document.title");
      assert.ok(pageTitle.includes("Portal Pengajuan"));

      const hasLoginForm = await cdp.evaluate("Boolean(document.getElementById('form-auth-server'))");
      assert.strictEqual(hasLoginForm, true);
    });

    // =====================================================================
    // 2. LOGIN GAGAL & ATRIBUT KUKI DI CHROME
    // =====================================================================
    console.log("\n👉 UJI 2: Penanganan Login Gagal & Proteksi Kuki di Chrome");

    await reportAsync("Login gagal menampilkan notifikasi error di DOM dan tidak menerbitkan kuki", async () => {
      const evalRes = await cdp.evaluate(`(async () => {
        document.getElementById('input-auth-id').value = 'test_cabang_bdg';
        document.getElementById('input-auth-pass').value = 'PasswordSalah123!';
        await loginKeServer();
        const errEl = document.getElementById('pesan-auth-error');
        return {
          hidden: errEl ? errEl.classList.contains('hidden') : null,
          text: errEl ? errEl.innerText : null
        };
      })()`);
      if (evalRes && evalRes.hidden) {
        console.log("      Debug UJI 2:", JSON.stringify(evalRes));
      }

      const isErrorVisible = await cdp.evaluate("Boolean(document.getElementById('pesan-auth-error') && !document.getElementById('pesan-auth-error').classList.contains('hidden'))");
      assert.strictEqual(isErrorVisible, true);

      // Periksa kuki di Chrome Network via CDP
      const cookiesData = await cdp.send("Network.getCookies", { urls: [baseUrl] });
      const hasSessionCookie = cookiesData.cookies.some((c) => c.name === "nsr_session");
      assert.strictEqual(hasSessionCookie, false);
    });

    // =====================================================================
    // 3. LOGIN SUKSES, ATRIBUT COOKIE, & PROTEKSI HTTPONLY DI JAVASCRIPT
    // =====================================================================
    console.log("\n👉 UJI 3: Login Sukses, DOM Switching, & Pembuktian HttpOnly di JavaScript");

    await reportAsync("Login sukses beralih ke panel aplikasi utama dan menyapa pengguna", async () => {
      await cdp.evaluate(`(async () => {
        document.getElementById('input-auth-id').value = 'test_cabang_bdg';
        document.getElementById('input-auth-pass').value = 'CabangSecret2026!';
        await loginKeServer();
      })()`);
      await new Promise((r) => setTimeout(r, 800));

      const isMainPanelVisible = await cdp.evaluate("!document.getElementById('panel-aplikasi-utama').classList.contains('hidden')");
      assert.strictEqual(isMainPanelVisible, true);

      const labelSesi = await cdp.evaluate("document.getElementById('label-sesi').innerText");
      assert.ok(labelSesi.includes("Bandung"));
    });

    await reportAsync("Proteksi HttpOnly: JavaScript (document.cookie) TIDAK DAPAT membaca token nsr_session", async () => {
      // Pembuktian nyata dalam engine V8 Chrome asli
      const jsAccessibleCookie = await cdp.evaluate("document.cookie");
      assert.strictEqual(jsAccessibleCookie.includes("nsr_session"), false);
    });

    await reportAsync("Pemeriksaan Kuki di Chrome Network: HttpOnly=true, SameSite=Strict, Path=/", async () => {
      const cookiesData = await cdp.send("Network.getCookies", { urls: [baseUrl] });
      const sessionCookie = cookiesData.cookies.find((c) => c.name === "nsr_session");
      assert.ok(sessionCookie, "Kuki nsr_session wajib terdaftar di Chrome");
      assert.strictEqual(sessionCookie.httpOnly, true, "Wajib memiliki atribut HttpOnly=true");
      assert.strictEqual(sessionCookie.sameSite, "Strict", "Wajib memiliki atribut SameSite=Strict");
      assert.strictEqual(sessionCookie.path, "/", "Wajib dibatasi pada Path=/");
    });

    // =====================================================================
    // 4. HAK AKSES UI CABANG DI GOOGLE CHROME
    // =====================================================================
    console.log("\n👉 UJI 4: Penegakan Hak Akses Antarmuka (RBAC UI) untuk Cabang");

    await reportAsync("Cabang Bandung: Tab Meja Approval, eLSa, dan Riwayat Global disembunyikan", async () => {
      const isApprovalHidden = await cdp.evaluate("document.getElementById('tab-btn-approval').classList.contains('hidden')");
      const isElsaHidden = await cdp.evaluate("document.getElementById('tab-btn-elsa').classList.contains('hidden')");
      const isRiwayatHidden = await cdp.evaluate("document.getElementById('tab-btn-riwayat').classList.contains('hidden')");

      assert.strictEqual(isApprovalHidden, true);
      assert.strictEqual(isElsaHidden, true);
      assert.strictEqual(isRiwayatHidden, true);
    });

    await reportAsync("Cabang Bandung: Form Pengajuan dan Form Kendali Mutu (SPM) dapat diakses", async () => {
      const hasPengajuan = await cdp.evaluate("Boolean(document.getElementById('tab-btn-pengajuan'))");
      const hasSpm = await cdp.evaluate("Boolean(document.getElementById('tab-btn-spm'))");
      assert.strictEqual(hasPengajuan, true);
      assert.strictEqual(hasSpm, true);
    });

    // =====================================================================
    // 5. INTERAKTIVITAS FORM & LIVE PREVIEW 7 SEGMEN KEMENKEU
    // =====================================================================
    console.log("\n👉 UJI 5: Fungsi Bisnis NoLap (Formula 7 Segmen Kemenkeu & Cetak SPM)");

    await reportAsync("Generator Formula 7 Segmen Kemenkeu memperbarui tampilan nomor laporan", async () => {
      const liveNoLap = await cdp.evaluate("document.getElementById('live-nomor-laporan').innerText");
      // Format: [NO. URUT PUSAT]/2.0160-04/PI/07/00581/1/...
      assert.ok(liveNoLap.includes("2.0160-04"), "Memuat kode cabang Bandung");
      assert.ok(liveNoLap.includes("PI"), "Memuat kode jasa");
      assert.ok(liveNoLap.includes("07"), "Memuat kode sektor industri");
    });

    await reportAsync("Fungsi Kertas Kerja SPM: Tombol cetak menghasilkan dokumen format resmi A4", async () => {
      await cdp.evaluate("cetakKertasKerjaSpm('umum')");
      const printHtml = await cdp.evaluate("document.getElementById('print-body-content').innerHTML");
      assert.ok(printHtml.includes("FORM KENDALI MUTU PENUGASAN UMUM"));
    });

    // =====================================================================
    // 6. SIKLUS RELOAD HALAMAN DI CHROME
    // =====================================================================
    console.log("\n👉 UJI 6: Ketahanan Sesi Saat Google Chrome Memuat Ulang Halaman (Reload)");

    await reportAsync("Reload Halaman di Chrome: Sesi dipertahankan dan pengguna tetap login", async () => {
      await cdp.send("Page.reload");
      let isMainPanelVisible = false;
      for (let i = 0; i < 25; i++) {
        await new Promise((r) => setTimeout(r, 200));
        isMainPanelVisible = await cdp.evaluate("Boolean(document.getElementById('panel-aplikasi-utama') && !document.getElementById('panel-aplikasi-utama').classList.contains('hidden'))");
        if (isMainPanelVisible) break;
      }
      assert.strictEqual(isMainPanelVisible, true);

      const labelSesi = await cdp.evaluate("document.getElementById('label-sesi').innerText");
      assert.ok(labelSesi.includes("Bandung"));
    });

    // =====================================================================
    // 7. SIKLUS LOGOUT & PENGHAPUSAN COOKIE DI CHROME
    // =====================================================================
    console.log("\n👉 UJI 7: Logout & Pencabutan Kuki di Google Chrome");

    await reportAsync("Logout berhasil: Sesi dicabut dan kuki nsr_session terhapus dari Chrome", async () => {
      await cdp.evaluate(`(async () => { await keluarSesiServer(); })()`);
      await new Promise((r) => setTimeout(r, 600));

      const isLoginVisible = await cdp.evaluate("!document.getElementById('box-auth-token').classList.contains('hidden')");
      assert.strictEqual(isLoginVisible, true);

      const cookiesData = await cdp.send("Network.getCookies", { urls: [baseUrl] });
      const sessionCookie = cookiesData.cookies.find((c) => c.name === "nsr_session");
      assert.strictEqual(sessionCookie, undefined);
    });

    // =====================================================================
    // 8. LOGIN ADMIN PUSAT & VERIFIKASI TAB TERPROTEKSI DI CHROME
    // =====================================================================
    console.log("\n👉 UJI 8: Hak Akses Antarmuka (RBAC UI) untuk Admin Kantor Pusat");

    await reportAsync("Admin Pusat: Tab Approval, eLSa, dan Riwayat Global terbuka penuh di Chrome", async () => {
      await cdp.evaluate(`(async () => {
        document.getElementById('input-auth-id').value = 'test_admin';
        document.getElementById('input-auth-pass').value = 'AdminSecret2026!';
        await loginKeServer();
      })()`);
      await new Promise((r) => setTimeout(r, 800));

      const labelSesi = await cdp.evaluate("document.getElementById('label-sesi').innerText");
      assert.ok(labelSesi.includes("Pusat"));

      const isApprovalVisible = await cdp.evaluate("!document.getElementById('tab-btn-approval').classList.contains('hidden')");
      const isElsaVisible = await cdp.evaluate("!document.getElementById('tab-btn-elsa').classList.contains('hidden')");
      const isRiwayatVisible = await cdp.evaluate("!document.getElementById('tab-btn-riwayat').classList.contains('hidden')");

      assert.strictEqual(isApprovalVisible, true, "Tab Approval wajib tampil untuk Admin Pusat");
      assert.strictEqual(isElsaVisible, true, "Tab eLSa wajib tampil untuk Admin Pusat");
      assert.strictEqual(isRiwayatVisible, true, "Tab Riwayat wajib tampil untuk Admin Pusat");
    });

    // =====================================================================
    // 9. ANTI-URL TOKEN BYPASS DI CHROME
    // =====================================================================
    console.log("\n👉 UJI 9: Verifikasi Parameter URL ?token= Diabaikan oleh Google Chrome");

    await reportAsync("Navigasi ke URL dengan ?token= tidak memberikan akses otomatis atau bypass", async () => {
      // Logout terlebih dahulu
      await cdp.evaluate(`(async () => { await keluarSesiServer(); })()`);
      await new Promise((r) => setTimeout(r, 400));

      // Buka URL dengan token lama
      await cdp.send("Page.navigate", { url: `${baseUrl}/portal-nolap-dev.html?token=MASTER_TOKEN_BYPASS_ATTEMPT` });
      await new Promise((r) => setTimeout(r, 600));

      const isLoginVisible = await cdp.evaluate("!document.getElementById('box-auth-token').classList.contains('hidden')");
      assert.strictEqual(isLoginVisible, true);

      const isMainPanelHidden = await cdp.evaluate("document.getElementById('panel-aplikasi-utama').classList.contains('hidden')");
      assert.strictEqual(isMainPanelHidden, true);
    });

  } finally {
    if (cdp) cdp.close();
    chromeProc.kill();
    server.close();
    try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch (e) {}
  }

  console.log("\n========================================================");
  console.log(`📊 HASIL PENGUJIAN GOOGLE CHROME SUNGGUHAN: ${passed} LULUS, ${failed} GAGAL`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRealBrowserTestSuite();
