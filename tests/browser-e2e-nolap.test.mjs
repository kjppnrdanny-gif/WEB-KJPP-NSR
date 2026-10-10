/**
 * KJPP NSR - Pengujian Browser End-to-End, Multi-Branch Isolation, & Keamanan (Tahap 2.6B-2B)
 * 
 * Pengujian komprehensif menggunakan server HTTP lokal (Node.js runtime):
 * 1. Menjalankan server HTTP lokal di 127.0.0.1 yang melayani berkas portal-nolap-dev.html
 *    dan routing endpoint /api/* ke fungsi serverless Netlify.
 * 2. Pengujian interaksi browser end-to-end (kuki sesi HttpOnly, SameSite, navigasi, reload).
 * 3. Pengujian isolasi data antar cabang (Bandung vs Padang vs Admin Pusat).
 * 4. Pengujian alur NoLap: submit permohonan, antrean per cabang, approval pusat, dan proteksi nomor ganda.
 * 5. Pengujian keamanan permukaan API: IDOR, CSRF, XSS, Fail-Closed, Anti-URL Token Bypass.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

import authLoginHandler from "../netlify/functions/auth-login.mjs";
import authVerifyHandler from "../netlify/functions/auth-verify.mjs";
import authLogoutHandler from "../netlify/functions/auth-logout.mjs";
import nolapProxyHandler, { _resetDummyDatabase, _setTransactionalSimulationMode } from "../netlify/functions/nolap-data-proxy.mjs";
import { sessionRevocationStore } from "../netlify/functions/lib/storage-adapter.mjs";
import { resetFailedLogin, setUserProvider } from "../netlify/functions/lib/auth-core.mjs";
import { registerTestUserProvider } from "./fixtures/test-users.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

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

// Helper untuk konversi Node.js HTTP request/response ke Web Standards Request/Response
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
  // Ambil set-cookie secara spesifik jika ada
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

// Client HTTP simulasi browser dengan pengelolaan Cookie Jar
class BrowserSession {
  constructor(baseUrl, clientIp = "127.0.0.1") {
    this.baseUrl = baseUrl;
    this.clientIp = clientIp;
    this.cookies = new Map();
  }

  _getCookieHeader() {
    const list = [];
    for (const [k, v] of this.cookies.entries()) {
      list.push(`${k}=${v}`);
    }
    return list.join("; ");
  }

  _storeCookies(res) {
    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) return;
    // Parsing kuki
    const parts = setCookie.split(",");
    parts.forEach((c) => {
      const match = c.match(/^\s*([^=;]+)=([^;]*)/);
      if (match) {
        const name = match[1].trim();
        const val = match[2].trim();
        if (val === "" || c.includes("Max-Age=0") || c.includes("expires=Thu, 01 Jan 1970")) {
          this.cookies.delete(name);
        } else {
          this.cookies.set(name, val);
        }
      }
    });
  }

  async fetch(urlPath, options = {}) {
    const fullUrl = `${this.baseUrl}${urlPath}`;
    const headers = new Headers(options.headers || {});

    // Masukkan kuki aktif
    const cookieHdr = this._getCookieHeader();
    if (cookieHdr) {
      headers.set("cookie", cookieHdr);
    }
    // Browser defaults & distinct client IP
    if (!headers.has("user-agent")) headers.set("user-agent", "KJPP-NSR-AutomatedBrowser/1.0");
    if (!headers.has("accept")) headers.set("accept", "application/json, text/html, */*");
    if (!headers.has("x-forwarded-for")) headers.set("x-forwarded-for", this.clientIp);

    const reqInit = {
      ...options,
      headers
    };

    const res = await fetch(fullUrl, reqInit);
    this._storeCookies(res);
    return res;
  }
}

async function runBrowserTestSuite() {
  console.log("\n========================================================");
  console.log("🌐 KJPP NSR - PENGUJIAN BROWSER END-TO-END & KEAMANAN");
  console.log("   Tahap 2.6B-2B (Multi-Branch, Anti-Tamper, E2E NoLap)");
  console.log("========================================================\n");

  registerTestUserProvider(setUserProvider);
  _resetDummyDatabase();
  _setTransactionalSimulationMode(true);
  await resetFailedLogin("test_admin");
  await resetFailedLogin("test_cabang_bdg");
  await resetFailedLogin("test_cabang_pdg");

  // Jalankan server lokal
  const server = http.createServer(handleServerRequest);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Server Lokal Aktif pada: ${baseUrl}\n`);

  try {
    // =====================================================================
    // BAGIAN 1: PENGUJIAN ASET BROWSER & ANTI-URL BYPASS
    // =====================================================================
    console.log("👉 BAGIAN 1: Verifikasi Pemuatan Halaman & Anti-URL Token Bypass");

    const anonBrowser = new BrowserSession(baseUrl, "192.168.1.10");

    await reportAsync("Halaman portal-nolap-dev.html dimuat dengan HTTP 200 dan no-sniff header", async () => {
      const res = await anonBrowser.fetch("/portal-nolap-dev.html");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get("x-content-type-options"), "nosniff");
      const html = await res.text();
      assert.ok(html.includes("Portal Pengajuan"));
    });

    await reportAsync("Pemanggilan URL dengan parameter ?token= diabaikan (Tidak melakukan login otomatis)", async () => {
      const res = await anonBrowser.fetch("/portal-nolap-dev.html?token=MASTER_SECRET_BYPASS_ATTEMPT");
      assert.strictEqual(res.status, 200);
      // Browser belum memiliki cookie sesi
      const verifyRes = await anonBrowser.fetch("/api/auth-verify");
      assert.strictEqual(verifyRes.status, 401);
      const verifyJson = await verifyRes.json();
      assert.strictEqual(verifyJson.authenticated, false);
    });

    // =====================================================================
    // BAGIAN 2: PENGUJIAN LOGIN BROWSER & ATRIBUT KEAMANAN COOKIE
    // =====================================================================
    console.log("\n👉 BAGIAN 2: Siklus Login Browser & Integritas Kuki Sesi");

    const userBrowser = new BrowserSession(baseUrl, "192.168.1.20");

    await reportAsync("Login gagal dengan password salah ditolak (HTTP 401) tanpa membocorkan cookie", async () => {
      const res = await userBrowser.fetch("/api/auth-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: "test_cabang_bdg", password: "SalahPassword123!" })
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(userBrowser.cookies.has("nsr_session"), false);
    });

    await reportAsync("Login akun dummy nonaktif (test_deactivated) ditolak dengan HTTP 403", async () => {
      const res = await userBrowser.fetch("/api/auth-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: "test_deactivated", password: "DeactivatedPass2026!" })
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(userBrowser.cookies.has("nsr_session"), false);
    });

    await reportAsync("Login berhasil Cabang Bandung (test_cabang_bdg) menerbitkan cookie aman", async () => {
      const res = await userBrowser.fetch("/api/auth-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: "test_cabang_bdg", password: "CabangSecret2026!" })
      });
      assert.strictEqual(res.status, 200);
      assert.ok(userBrowser.cookies.has("nsr_session"));
      const rawSetCookie = res.headers.get("set-cookie") || "";
      assert.ok(rawSetCookie.includes("HttpOnly"), "Wajib memiliki flag HttpOnly");
      assert.ok(rawSetCookie.includes("SameSite=Strict"), "Wajib memiliki flag SameSite=Strict");
      assert.ok(rawSetCookie.includes("Path=/"), "Wajib dibatasi Path=/");
    });

    await reportAsync("Simulasi Reload Halaman: Sesi tetap valid dan membaca identitas pengguna", async () => {
      // Reload: Panggil GET /portal-nolap-dev.html lalu GET /api/auth-verify
      await userBrowser.fetch("/portal-nolap-dev.html");
      const verifyRes = await userBrowser.fetch("/api/auth-verify");
      assert.strictEqual(verifyRes.status, 200);
      const verifyJson = await verifyRes.json();
      assert.strictEqual(verifyJson.authenticated, true);
      assert.strictEqual(verifyJson.user.username, "test_cabang_bdg");
      assert.strictEqual(verifyJson.user.role, "CABANG");
      assert.strictEqual(verifyJson.user.branch, "Bandung");
    });

    await reportAsync("Logout berhasil mencabut sesi dan menghapus cookie di browser", async () => {
      const res = await userBrowser.fetch("/api/auth-logout", {
        method: "POST",
        headers: { "x-requested-with": "XMLHttpRequest" }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(userBrowser.cookies.has("nsr_session"), false);

      // Verifikasi ulang bahwa sesi ditolak seketika
      const verifyRes = await userBrowser.fetch("/api/auth-verify");
      assert.strictEqual(verifyRes.status, 401);
    });

    // =====================================================================
    // BAGIAN 3: UJI HAK AKSES DAN ISOLASI LINTAS CABANG (MULTI-BRANCH)
    // =====================================================================
    console.log("\n👉 BAGIAN 3: Uji Hak Akses & Isolasi Ketat Lintas Cabang (Bandung vs Padang vs Pusat)");

    const browserBdg = new BrowserSession(baseUrl, "192.168.1.101");
    const browserPdg = new BrowserSession(baseUrl, "192.168.1.102");
    const browserAdmin = new BrowserSession(baseUrl, "192.168.1.100");

    // 1. Login ketiga aktor
    await reportAsync("Login 3 sesi simultan (Bandung, Padang, Admin Pusat) berhasil", async () => {
      const resBdg = await browserBdg.fetch("/api/auth-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: "test_cabang_bdg", password: "CabangSecret2026!" })
      });
      assert.strictEqual(resBdg.status, 200);

      const resPdg = await browserPdg.fetch("/api/auth-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: "test_cabang_pdg", password: "PadangSecret2026!" })
      });
      assert.strictEqual(resPdg.status, 200);

      const resAdm = await browserAdmin.fetch("/api/auth-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: "test_admin", password: "AdminSecret2026!" })
      });
      assert.strictEqual(resAdm.status, 200);
    });

    await reportAsync("Isolasi Cabang: Cabang Bandung hanya memperoleh data Bandung", async () => {
      const res = await browserBdg.fetch("/api/nolap-data-proxy");
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.scope, "BRANCH_ISOLATED");
      assert.strictEqual(json.branch, "Bandung");
      assert.ok(json.data.every((i) => i.cabang === "Bandung"));
    });

    await reportAsync("Isolasi Cabang: Cabang Padang hanya memperoleh data Padang", async () => {
      const res = await browserPdg.fetch("/api/nolap-data-proxy");
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.scope, "BRANCH_ISOLATED");
      assert.strictEqual(json.branch, "Padang");
      assert.ok(json.data.every((i) => i.cabang === "Padang"));
    });

    await reportAsync("Cabang Bandung TIDAK BISA melihat data Padang via manipulasi query URL atau header", async () => {
      const res = await browserBdg.fetch("/api/nolap-data-proxy?cabang=Padang&scope=GLOBAL_ALL_BRANCHES", {
        headers: {
          "x-override-branch": "Padang",
          "x-user-role": "ADMIN_PUSAT"
        }
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      // Server HARUS mengabaikan manipulasi header/query dan tetap mengunci ke Bandung
      assert.strictEqual(json.scope, "BRANCH_ISOLATED");
      assert.strictEqual(json.branch, "Bandung");
      assert.ok(json.data.every((i) => i.cabang === "Bandung"));
    });

    await reportAsync("Anti-IDOR: Cabang Bandung tidak dapat mengubah atau menyetujui pengajuan Padang", async () => {
      const res = await browserBdg.fetch("/api/nolap-data-proxy", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-requested-with": "XMLHttpRequest"
        },
        body: JSON.stringify({
          action: "approveRequest",
          payload: {
            noPermintaan: "REQ-DUMMY-002", // ID milik Padang
            nomorLaporan: "00999/2.0160-03/PI/03/00581/1/X/2026"
          }
        })
      });
      assert.strictEqual(res.status, 403);
      const json = await res.json();
      assert.strictEqual(json.violation, "UNAUTHORIZED_APPROVAL_ATTEMPT");
    });

    await reportAsync("Anti-Tamper: Cabang Bandung mengajukan permohonan dengan 'cabang: Padang' otomatis dikoreksi ke Bandung", async () => {
      const res = await browserBdg.fetch("/api/nolap-data-proxy", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-requested-with": "XMLHttpRequest"
        },
        body: JSON.stringify({
          action: "submitRequest",
          payload: {
            namaKlien: "PT Tamper Simulasi (Dummy)",
            cabang: "Padang", // Upaya manipulasi cabang di body
            klasifikasiJasa: "PI"
          }
        })
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      // Server harus menegakkan cabang pengaju sesuai sesi pengguna
      assert.strictEqual(json.record.cabang, "Bandung");
    });

    // =====================================================================
    // BAGIAN 4: UJI ALUR NOLAP LENGKAP & PENCEGAHAN NOMOR GANDA
    // =====================================================================
    console.log("\n👉 BAGIAN 4: Uji Alur NoLap Lengkap & Pencegahan Nomor Ganda (Anti-Duplicate Guard)");

    let idPermohonanBaru = null;

    await reportAsync("Pengajuan NoLap baru oleh Cabang Padang berhasil", async () => {
      const res = await browserPdg.fetch("/api/nolap-data-proxy", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-requested-with": "XMLHttpRequest"
        },
        body: JSON.stringify({
          action: "submitRequest",
          payload: {
            namaKlien: "PT Semen Padang Distribusi (Dummy)",
            klasifikasiJasa: "PI",
            kodeIndustri: "03",
            jenisObjek: "Gudang Logistik",
            lokasiObjek: "Teluk Bayur, Padang"
          }
        })
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      idPermohonanBaru = json.record.noPermintaan;
      assert.ok(idPermohonanBaru);
      assert.strictEqual(json.record.status, "DIAJUKAN");
      assert.strictEqual(json.record.cabang, "Padang");
    });

    await reportAsync("Cabang Bandung TIDAK DAPAT melihat pengajuan baru milik Padang", async () => {
      const res = await browserBdg.fetch("/api/nolap-data-proxy");
      const json = await res.json();
      const item = json.data.find((i) => i.noPermintaan === idPermohonanBaru);
      assert.strictEqual(item, undefined);
    });

    await reportAsync("Admin Pusat melihat pengajuan baru milik Padang di antrean global", async () => {
      const res = await browserAdmin.fetch("/api/nolap-data-proxy");
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.scope, "GLOBAL_ALL_BRANCHES");
      const item = json.data.find((i) => i.noPermintaan === idPermohonanBaru);
      assert.ok(item);
      assert.strictEqual(item.status, "DIAJUKAN");
      assert.strictEqual(item.cabang, "Padang");
    });

    const nomorLaporanSah = "00533/2.0160-03/PI/03/00581/1/X/2026";

    await reportAsync("Admin Pusat berhasil menyetujui pengajuan dan menetapkan Nomor Resmi", async () => {
      const res = await browserAdmin.fetch("/api/nolap-data-proxy", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-requested-with": "XMLHttpRequest"
        },
        body: JSON.stringify({
          action: "approveRequest",
          payload: {
            noPermintaan: idPermohonanBaru,
            nomorLaporan: nomorLaporanSah,
            catatanAdmin: "Disetujui Admin Pusat setelah peninjauan SPM."
          }
        })
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.record.status, "NOMOR DITERBITKAN");
      assert.strictEqual(json.record.nomorLaporan, nomorLaporanSah);
    });

    await reportAsync("Anti-Duplikasi: Percobaan penetapan nomor yang SAMA pada permohonan lain DITOLAK (HTTP 409)", async () => {
      const res = await browserAdmin.fetch("/api/nolap-data-proxy", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-requested-with": "XMLHttpRequest"
        },
        body: JSON.stringify({
          action: "approveRequest",
          payload: {
            noPermintaan: "REQ-DUMMY-003", // Permohonan lain
            nomorLaporan: nomorLaporanSah, // Nomor yang sudah terpakai
            catatanAdmin: "Percobaan duplikasi nomor resmi."
          }
        })
      });
      assert.strictEqual(res.status, 409);
      const json = await res.json();
      assert.strictEqual(json.violation, "DUPLICATE_NUMBER_REJECTED");
    });

    // =====================================================================
    // BAGIAN 5: AUDIT KEAMANAN PERMUKAAN API (CSRF, FAIL-CLOSED, ERROR HANDLING)
    // =====================================================================
    console.log("\n👉 BAGIAN 5: Audit Keamanan Permukaan API (CSRF, Fail-Closed, Anti-Leak)");

    await reportAsync("Proteksi CSRF: Permintaan POST lintas-situs tanpa header yang sah ditolak (HTTP 403)", async () => {
      const res = await fetch(`${baseUrl}/api/nolap-data-proxy`, {
        method: "POST",
        headers: {
          "cookie": `nsr_session=${browserAdmin.cookies.get("nsr_session")}`,
          "content-type": "application/json",
          "origin": "https://malicious-attacker-website.com",
          "sec-fetch-site": "cross-site"
        },
        body: JSON.stringify({ action: "submitRequest", payload: { namaKlien: "Attacker" } })
      });
      assert.strictEqual(res.status, 403);
    });

    await reportAsync("Fail-Closed: Kegagalan storage pada endpoint proxy menolak akses dengan HTTP 503", async () => {
      sessionRevocationStore.setSimulateFailure(true);
      const res = await browserAdmin.fetch("/api/nolap-data-proxy");
      assert.strictEqual(res.status, 503);
      sessionRevocationStore.setSimulateFailure(false);
    });

    await reportAsync("Anti-Leak: Respons API tidak pernah memuat token JWT atau rahasia sesi dalam body", async () => {
      const res = await browserAdmin.fetch("/api/auth-verify");
      const text = await res.text();
      assert.ok(!text.includes("jwt"));
      assert.ok(!text.includes("token"));
      assert.ok(!text.includes("secret"));
      assert.ok(!text.includes("password"));
    });

  } finally {
    server.close();
  }

  console.log("\n========================================================");
  console.log(`📊 HASIL PENGUJIAN BROWSER E2E: ${passed} LULUS, ${failed} GAGAL`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runBrowserTestSuite();
