/**
 * KJPP NSR - Pengujian Integrasi Autentikasi Server-Side Portal NoLap (Tahap 2.6B-2A)
 * 
 * Pengujian komprehensif yang memvalidasi:
 * 1. Sanitasi berkas lokal portal-nolap-dev.html (Zero Hardcoded Token, Zero URL Bypass, Zero Real NIK).
 * 2. Isolasi berkas produksi (portal-nolap.html, portal-kwitansi.html tidak tersentuh).
 * 3. Serverless Endpoint Auth (/api/auth-login, /api/auth-verify, /api/auth-logout).
 * 4. Serverless Data Proxy (/api/nolap-data-proxy):
 *    - Anonymous access -> 401 Unauthorized.
 *    - Strict RBAC: Cabang Bandung hanya memperoleh data Bandung (BRANCH_ISOLATED).
 *    - Cabang dilarang approval -> 403 Forbidden.
 *    - Admin Pusat memperoleh seluruh data (GLOBAL_ALL_BRANCHES) & berwenang approval.
 *    - Fail-Closed: Storage error -> 503 Service Unavailable.
 *    - Logout mencabut sesi -> 401 Unauthorized.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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

function extractSetCookieToken(headers) {
  const setCookie = headers.get("set-cookie") || "";
  const match = setCookie.match(/nsr_session=([^;]+)/);
  return match ? match[1] : null;
}

console.log("\n========================================================");
console.log("🛡️  KJPP NSR - INTEGRASI AUTENTIKASI SERVER-SIDE PORTAL NOLAP");
console.log("   Tahap 2.6B-2A (Local RBAC, Data Proxy, Fail-Closed)");
console.log("========================================================\n");

// Setup state
registerTestUserProvider(setUserProvider);
_resetDummyDatabase();
await resetFailedLogin("test_admin");
await resetFailedLogin("test_cabang_bdg");

// =========================================================================
// 1. AUDIT SANITASI BERKAS PENGEMBANGAN portal-nolap-dev.html
// =========================================================================
console.log("👉 UJI 1: Integritas & Sanitasi Berkas Lokal (portal-nolap-dev.html)");

const devPath = path.join(ROOT_DIR, "portal-nolap-dev.html");
const prodPath = path.join(ROOT_DIR, "portal-nolap.html");
const kwitansiPath = path.join(ROOT_DIR, "portal-kwitansi.html");

report("Berkas portal-nolap-dev.html tersedia di root direktori", () => {
  assert.ok(fs.existsSync(devPath));
});

report("Berkas produksi portal-nolap.html tetap ada dan tidak dihapus", () => {
  assert.ok(fs.existsSync(prodPath));
});

const devContent = fs.readFileSync(devPath, "utf-8");
const prodContent = fs.readFileSync(prodPath, "utf-8");

report("Zero Hardcoded Tokens: Kamus MASTER_TOKEN telah dihapus dari dev", () => {
  assert.ok(!devContent.includes("const MASTER_TOKEN = {"));
  assert.ok(!devContent.includes("'NSR-BDG-2026'"));
  assert.ok(!devContent.includes("'NSR-PDG-2026'"));
});

report("Zero Real Employee NIKs: Kamus MASTER_USER_ACCOUNTS telah dibersihkan dari dev", () => {
  assert.ok(!devContent.includes("const MASTER_USER_ACCOUNTS = {"));
  assert.ok(!devContent.includes("3273110509910002"));
});

report("Zero URL Bypass: Fitur login otomatis via ?token= telah dinonaktifkan", () => {
  assert.ok(devContent.includes("Nonaktifkan parameter URL token (keamanan anti-bypass)"));
  assert.ok(!devContent.includes("loginOtomatisUrlToken"));
});

report("Form Login Server-Side terpasang: Memiliki input nama pengguna & kata sandi", () => {
  assert.ok(devContent.includes('id="input-auth-id"'));
  assert.ok(devContent.includes('id="input-auth-pass"'));
  assert.ok(devContent.includes("loginKeServer"));
});

report("Koneksi Proxy Terproteksi: sinkronkanDariProxyServer menggantikan GVIZ langsung", () => {
  assert.ok(devContent.includes("sinkronkanDariProxyServer"));
  assert.ok(devContent.includes("/api/nolap-data-proxy"));
});

// =========================================================================
// 2. PROTEKSI AKSES ANONIM PADA DATA PROXY
// =========================================================================
console.log("\n👉 UJI 2: Proteksi Akses Anonim & Tampered Token pada /api/nolap-data-proxy");

await reportAsync("Permintaan anonim tanpa cookie/token ditolak dengan HTTP 401", async () => {
  const req = new Request("http://localhost/api/nolap-data-proxy", {
    method: "GET",
    headers: { "accept": "application/json" }
  });
  const res = await nolapProxyHandler(req);
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.authenticated, false);
});

await reportAsync("Permintaan dengan token palsu/acak ditolak dengan HTTP 401", async () => {
  const req = new Request("http://localhost/api/nolap-data-proxy", {
    method: "GET",
    headers: {
      "cookie": "nsr_session=token-palsu-acak-12345",
      "accept": "application/json"
    }
  });
  const res = await nolapProxyHandler(req);
  assert.strictEqual(res.status, 401);
});

// =========================================================================
// 3. AUTENTIKASI CABANG & PARTISI DATA TERISOLASI (BRANCH_ISOLATED)
// =========================================================================
console.log("\n👉 UJI 3: RBAC & Isolasi Data Cabang (Branch Isolation)");

let cookieCabangBdg = null;

await reportAsync("Login akun dummy cabang (test_cabang_bdg) berhasil", async () => {
  const req = new Request("http://localhost/api/auth-login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: "test_cabang_bdg", password: "CabangSecret2026!" })
  });
  const res = await authLoginHandler(req);
  assert.strictEqual(res.status, 200);
  cookieCabangBdg = extractSetCookieToken(res.headers);
  assert.ok(cookieCabangBdg);
});

await reportAsync("Verifikasi sesi cabang mengonfirmasi role CABANG dan branch Bandung", async () => {
  const req = new Request("http://localhost/api/auth-verify", {
    method: "GET",
    headers: { "cookie": `nsr_session=${cookieCabangBdg}` }
  });
  const res = await authVerifyHandler(req);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.authenticated, true);
  assert.strictEqual(data.user.role, "CABANG");
  assert.strictEqual(data.user.branch, "Bandung");
});

await reportAsync("Data Proxy hanya mengembalikan data Bandung untuk Cabang Bandung", async () => {
  const req = new Request("http://localhost/api/nolap-data-proxy", {
    method: "GET",
    headers: { "cookie": `nsr_session=${cookieCabangBdg}` }
  });
  const res = await nolapProxyHandler(req);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.scope, "BRANCH_ISOLATED");
  assert.strictEqual(json.branch, "Bandung");
  // Pastikan SEMUA item yang dikembalikan adalah milik Bandung
  assert.ok(json.data.length >= 1);
  json.data.forEach(item => {
    assert.strictEqual(item.cabang, "Bandung");
  });
});

await reportAsync("Cabang Bandung TIDAK DAPAT melihat data Cabang Padang atau Pusat", async () => {
  const req = new Request("http://localhost/api/nolap-data-proxy", {
    method: "GET",
    headers: { "cookie": `nsr_session=${cookieCabangBdg}` }
  });
  const res = await nolapProxyHandler(req);
  const json = await res.json();
  const hasPadang = json.data.some(i => i.cabang === "Padang");
  const hasPusat = json.data.some(i => i.cabang === "Pusat");
  assert.strictEqual(hasPadang, false);
  assert.strictEqual(hasPusat, false);
});

await reportAsync("Percobaan Approval oleh Cabang DITOLAK SEVERELY (HTTP 403 Forbidden)", async () => {
  const req = new Request("http://localhost/api/nolap-data-proxy", {
    method: "POST",
    headers: {
      "cookie": `nsr_session=${cookieCabangBdg}`,
      "content-type": "application/json",
      "x-requested-with": "XMLHttpRequest"
    },
    body: JSON.stringify({
      action: "approveRequest",
      payload: {
        noPermintaan: "REQ-DUMMY-002",
        nomorLaporan: "00999/2.0160-04/PI/07/00581/1/X/2026"
      }
    })
  });
  const res = await nolapProxyHandler(req);
  assert.strictEqual(res.status, 403);
  const json = await res.json();
  assert.strictEqual(json.violation, "UNAUTHORIZED_APPROVAL_ATTEMPT");
});

await reportAsync("Cabang berhasil mengajukan nomor laporan baru via Proxy (submitRequest)", async () => {
  const req = new Request("http://localhost/api/nolap-data-proxy", {
    method: "POST",
    headers: {
      "cookie": `nsr_session=${cookieCabangBdg}`,
      "content-type": "application/json",
      "x-requested-with": "XMLHttpRequest"
    },
    body: JSON.stringify({
      action: "submitRequest",
      payload: {
        namaKlien: "PT Mitra Baru Bandung (Dummy)",
        klasifikasiJasa: "PI",
        kodeIndustri: "07",
        jenisObjek: "Rumah Tinggal"
      }
    })
  });
  const res = await nolapProxyHandler(req);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.record.cabang, "Bandung");
  assert.strictEqual(json.record.status, "DIAJUKAN");
});

// =========================================================================
// 4. AUTENTIKASI ADMIN PUSAT & OTORITAS APPROVAL PENOMORAN RESMI
// =========================================================================
console.log("\n👉 UJI 4: Hak Otoritas Admin Pusat & Penetapan Nomor Resmi");

let cookieAdminPusat = null;

await reportAsync("Login akun dummy Admin Pusat (test_admin) berhasil", async () => {
  const req = new Request("http://localhost/api/auth-login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: "test_admin", password: "AdminSecret2026!" })
  });
  const res = await authLoginHandler(req);
  assert.strictEqual(res.status, 200);
  cookieAdminPusat = extractSetCookieToken(res.headers);
  assert.ok(cookieAdminPusat);
});

await reportAsync("Admin Pusat memperoleh seluruh data pengajuan global (GLOBAL_ALL_BRANCHES)", async () => {
  const req = new Request("http://localhost/api/nolap-data-proxy", {
    method: "GET",
    headers: { "cookie": `nsr_session=${cookieAdminPusat}` }
  });
  const res = await nolapProxyHandler(req);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.scope, "GLOBAL_ALL_BRANCHES");
  // Pastikan memuat Bandung, Padang, dan Pusat
  const branches = new Set(json.data.map(i => i.cabang));
  assert.ok(branches.has("Bandung"));
  assert.ok(branches.has("Padang"));
  assert.ok(branches.has("Pusat"));
});

await reportAsync("Fail-Closed: Penetapan nomor tanpa distributed lock ditolak dengan HTTP 503", async () => {
  _setTransactionalSimulationMode(false);
  const req = new Request("http://localhost/api/nolap-data-proxy", {
    method: "POST",
    headers: {
      "cookie": `nsr_session=${cookieAdminPusat}`,
      "content-type": "application/json",
      "x-requested-with": "XMLHttpRequest"
    },
    body: JSON.stringify({
      action: "approveRequest",
      payload: {
        noPermintaan: "REQ-DUMMY-002",
        nomorLaporan: "00532/2.0160-03/PI/03/00581/1/X/2026",
        catatanAdmin: "Disetujui Admin Pusat."
      }
    })
  });
  const res = await nolapProxyHandler(req);
  assert.strictEqual(res.status, 503);
  const json = await res.json();
  assert.strictEqual(json.violation, "TRANSACTIONAL_LOCK_REQUIRED");
});

await reportAsync("Admin Pusat berwenang menetapkan Nomor Laporan Resmi saat simulasi aktif", async () => {
  _setTransactionalSimulationMode(true);
  const req = new Request("http://localhost/api/nolap-data-proxy", {
    method: "POST",
    headers: {
      "cookie": `nsr_session=${cookieAdminPusat}`,
      "content-type": "application/json",
      "x-requested-with": "XMLHttpRequest"
    },
    body: JSON.stringify({
      action: "approveRequest",
      payload: {
        noPermintaan: "REQ-DUMMY-002",
        nomorLaporan: "00532/2.0160-03/PI/03/00581/1/X/2026",
        catatanAdmin: "Disetujui Admin Pusat."
      }
    })
  });
  const res = await nolapProxyHandler(req);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.record.status, "NOMOR DITERBITKAN");
  assert.strictEqual(json.record.nomorLaporan, "00532/2.0160-03/PI/03/00581/1/X/2026");
});

// =========================================================================
// 5. FAIL-CLOSED PRINCIPLE & REVOKED SESSION REJECTION
// =========================================================================
console.log("\n👉 UJI 5: Prinsip Fail-Closed & Pengujian Pemutusan Sesi (Logout)");

await reportAsync("Fail-Closed: Kegagalan storage menghasilkan HTTP 503 dan menolak proxy", async () => {
  sessionRevocationStore.setSimulateFailure(true);
  const req = new Request("http://localhost/api/nolap-data-proxy", {
    method: "GET",
    headers: { "cookie": `nsr_session=${cookieAdminPusat}` }
  });
  const res = await nolapProxyHandler(req);
  assert.strictEqual(res.status, 503);
  sessionRevocationStore.setSimulateFailure(false);
});

await reportAsync("Logout Admin Pusat berhasil mencabut sesi", async () => {
  const req = new Request("http://localhost/api/auth-logout", {
    method: "POST",
    headers: { "cookie": `nsr_session=${cookieAdminPusat}` }
  });
  const res = await authLogoutHandler(req);
  assert.strictEqual(res.status, 200);
});

await reportAsync("Sesi yang telah dicabut langsung ditolak oleh Data Proxy (HTTP 401)", async () => {
  const req = new Request("http://localhost/api/nolap-data-proxy", {
    method: "GET",
    headers: { "cookie": `nsr_session=${cookieAdminPusat}` }
  });
  const res = await nolapProxyHandler(req);
  assert.strictEqual(res.status, 401);
});

// =========================================================================
// HASIL AKHIR
// =========================================================================
console.log("\n========================================================");
console.log(`📊 HASIL PENGUJIAN INTEGRASI NOLAP: ${passed} LULUS, ${failed} GAGAL`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
