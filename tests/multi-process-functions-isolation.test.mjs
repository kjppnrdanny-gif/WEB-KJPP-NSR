/**
 * KJPP NSR - Pengujian Antar-Instance Functions (Multi-Process Isolation)
 * Tahap 2.6B-2E
 * 
 * Menguji perilaku arsitektur Netlify Functions pada proses Node.js yang sepenuhnya terpisah:
 * 1. Login pada Instance A -> Verifikasi & Transaksi pada Instance B (Proses Terpisah).
 * 2. RBAC & Partisi Cabang ditegakkan lintas-proses.
 * 3. Sesi dicabut (logout) pada Instance C -> Instance D seketika menolak token tersebut (Revocation Propagation).
 * 4. Kegagalan Storage: Pembuktian Fail-Closed (HTTP 503, Zero Security Bypass).
 * 5. Stateless Memory State & Distributed Concurrency Guard:
 *    - In-memory state terisolasi per container serverless (membuktikan perlunya database terpusat untuk cloud).
 *    - Penetapan nomor otomatis ditolak (HTTP 503 Fail-Closed) jika lock transaksional belum aktif.
 */

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { existsSync, rmSync, mkdirSync } from "node:fs";

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

const TEST_STORE_DIR = join(tmpdir(), `kjpp-nsr-multi-process-audit-${Date.now()}`);
if (existsSync(TEST_STORE_DIR)) {
  rmSync(TEST_STORE_DIR, { recursive: true, force: true });
}
mkdirSync(TEST_STORE_DIR, { recursive: true });

function runWorker(action, payload, envOverrides = {}) {
  const workerScript = join(process.cwd(), "tests", "multi-process-worker.mjs");
  const result = spawnSync(process.execPath, [workerScript, action, JSON.stringify(payload)], {
    encoding: "utf8",
    env: {
      ...process.env,
      NSR_ENV: "staging",
      NSR_AUTH_SECRET_STAGING: "kjpp_nsr_audit_staging_secret_key_multi_process_test_2026_xyz",
      NSR_STORE_DIR: TEST_STORE_DIR,
      IS_LOCAL_TEST: "true",
      ...envOverrides
    }
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Worker process failed (status ${result.status}): ${result.stderr}`);
  }

  try {
    return JSON.parse(result.stdout.trim());
  } catch (e) {
    throw new Error(`Failed to parse worker stdout: "${result.stdout}". Stderr: "${result.stderr}"`);
  }
}

async function runMultiProcessIsolationTests() {
  console.log("\n========================================================");
  console.log("⚙️  KJPP NSR - AUDIT MULTI-PROCESS ISOLATION FUNCTIONS");
  console.log("   Tahap 2.6B-2E (Serverless Cross-Process & Fail-Closed)");
  console.log("========================================================\n");

  console.log(`📁 Shared Persistent Directory: ${TEST_STORE_DIR}`);

  // =========================================================================
  // 1. PENGUJIAN LOGIN INSTANCE A -> VERIFIKASI & QUERY INSTANCE B
  // =========================================================================
  console.log("\n👉 UJI 1: Login pada Instance A -> Verifikasi & Transaksi pada Instance B (Proses Terpisah)");

  let branchToken = null;

  report("Instance A (Proses 1): Login akun cabang dummy berhasil menghasilkan token", () => {
    const res = runWorker("login", {
      identifier: "test_cabang_bdg",
      password: "CabangSecret2026!"
    });
    if (res.status !== 200 || !res.token) {
      throw new Error(`Login gagal: status ${res.status}, response: ${JSON.stringify(res.data)}`);
    }
    branchToken = res.token;
  });

  report("Instance B (Proses 2 - Mandiri): Memverifikasi sesi dari Instance A secara lintas-proses", () => {
    const res = runWorker("verify", { token: branchToken });
    if (res.status !== 200 || !res.data.authenticated) {
      throw new Error(`Verifikasi lintas-proses gagal: status ${res.status}`);
    }
    if (res.data.user.role !== "CABANG" || res.data.user.branch !== "Bandung") {
      throw new Error(`Identitas tidak cocok: ${JSON.stringify(res.data.user)}`);
    }
  });

  report("Instance B (Proses 2 - Mandiri): Eksekusi query NoLap Data Proxy menegakkan Partisi Cabang", () => {
    const res = runWorker("query_proxy", { token: branchToken });
    if (res.status !== 200 || res.data.scope !== "BRANCH_ISOLATED") {
      throw new Error(`Query NoLap lintas-proses gagal: ${JSON.stringify(res.data)}`);
    }
    // Pastikan seluruh data yang dikembalikan hanya cabang Bandung
    const nonBdg = res.data.data.filter((r) => r.cabang.toLowerCase() !== "bandung");
    if (nonBdg.length > 0) {
      throw new Error(`Data cabang lain bocor: ${JSON.stringify(nonBdg)}`);
    }
  });

  report("Instance B (Proses 2 - Mandiri): Penolakan tegas (403 Forbidden) atas upaya Approval oleh Cabang", () => {
    const res = runWorker("approve_request", {
      token: branchToken,
      bodyPayload: {
        noPermintaan: "REQ-DUMMY-001",
        nomorLaporan: "00531/2.0160-04/PI/07/00581/1/X/2026"
      }
    });
    if (res.status !== 403 || res.data.violation !== "UNAUTHORIZED_APPROVAL_ATTEMPT") {
      throw new Error(`Seharusnya 403 Forbidden, tapi didapat: status ${res.status}`);
    }
  });

  // =========================================================================
  // 2. PENGUJIAN LOGOUT INSTANCE C -> PENOLAKAN SEKETIKA DI INSTANCE D
  // =========================================================================
  console.log("\n👉 UJI 2: Logout pada Instance C -> Penolakan Seketika di Instance D (Revocation Propagation)");

  report("Instance C (Proses 3): Logout berhasil mencabut sesi di shared store", () => {
    const res = runWorker("logout", { token: branchToken });
    if (res.status !== 200 || !res.data.authenticated === false) {
      throw new Error(`Logout gagal: status ${res.status}`);
    }
  });

  report("Instance D (Proses 4 - Mandiri): Seketika menolak token yang telah dicabut (401 Unauthorized)", () => {
    const res = runWorker("verify", { token: branchToken });
    if (res.status !== 401 || res.data.authenticated !== false) {
      throw new Error(`Token dicabut masih diterima! status ${res.status}`);
    }
    if (!res.data.error.includes("dicabut")) {
      throw new Error(`Pesan error tidak mencerminkan pencabutan: ${res.data.error}`);
    }
  });

  report("Instance D (Proses 4 - Mandiri): Data Proxy seketika menolak akses data dengan token yang dicabut", () => {
    const res = runWorker("query_proxy", { token: branchToken });
    if (res.status !== 401 || res.data.authenticated !== false) {
      throw new Error(`Data Proxy masih melayani token dicabut! status ${res.status}`);
    }
  });

  // =========================================================================
  // 3. KEGAGALAN STORAGE / MOCK STORE: FAIL-CLOSED VERIFICATION
  // =========================================================================
  console.log("\n👉 UJI 3: Kegagalan Storage / Adapter: Pembuktian Fail-Closed (Zero Bypass)");

  let adminToken = null;
  report("Instance E (Proses 5): Login Admin Pusat berhasil", () => {
    const res = runWorker("login", {
      identifier: "test_admin",
      password: "AdminSecret2026!"
    });
    if (res.status !== 200 || !res.token) {
      throw new Error(`Admin login gagal: status ${res.status}`);
    }
    adminToken = res.token;
  });

  report("Instance F (Proses 6 - Storage Disconnected): Sistem menolak akses dengan HTTP 503 (Fail-Closed)", () => {
    const res = runWorker("verify", { token: adminToken }, { SIMULATE_STORAGE_FAILURE: "true" });
    if (res.status !== 503 || res.data.authenticated !== false) {
      throw new Error(`Sistem tidak fail-closed! status ${res.status}, res: ${JSON.stringify(res.data)}`);
    }
  });

  report("Instance F (Proses 6 - Storage Disconnected): Data Proxy menolak akses data dengan HTTP 503", () => {
    const res = runWorker("query_proxy", { token: adminToken }, { SIMULATE_STORAGE_FAILURE: "true" });
    if (res.status !== 503 || res.data.authenticated !== false) {
      throw new Error(`Data Proxy tidak fail-closed saat storage gagal! status ${res.status}`);
    }
  });

  // =========================================================================
  // 4. BATASAN TEKNIS STATELESS & PENETAPAN NOMOR RESMI MULTI-INSTANCE
  // =========================================================================
  console.log("\n👉 UJI 4: Pembuktian Karakteristik Stateless & Fail-Closed Guard Penetapan Nomor");

  report("Instance G (Proses 7): Permohonan baru disubmit ke instance lokal G", () => {
    const res = runWorker("submit_request", {
      token: adminToken,
      bodyPayload: {
        namaKlien: "PT Lintas Proses Simulasi",
        cabang: "Pusat"
      }
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Submit gagal: ${JSON.stringify(res.data)}`);
    }
  });

  report("Instance H (Proses 8): Membuktikan in-memory state tidak otomatis tersinkronisasi antar-proses tanpa Cloud DB", () => {
    const res = runWorker("query_proxy", { token: adminToken });
    // Dalam instance H baru, database in-memory adalah fresh default fixture
    // Permohonan 'PT Lintas Proses Simulasi' yang hanya dibuat di memori Instance G tidak ada di Instance H
    const found = res.data.data.some((r) => r.namaKlien === "PT Lintas Proses Simulasi");
    if (found) {
      throw new Error("Tersinkronisasi padahal proses memori terpisah tanpa shared DB");
    }
  });

  report("Instance H (Proses 8): Penetapan nomor resmi otomatis DITANGGUHKAN (503 Fail-Closed) tanpa Distributed Lock", () => {
    const res = runWorker("approve_request", {
      token: adminToken,
      bodyPayload: {
        noPermintaan: "REQ-DUMMY-001",
        nomorLaporan: "00531/2.0160-04/PI/07/00581/1/X/2026"
      }
    });
    if (res.status !== 503 || res.data.violation !== "TRANSACTIONAL_LOCK_REQUIRED") {
      throw new Error(`Seharusnya ditangguhkan (503), tapi didapat: status ${res.status}`);
    }
    if (res.data.mode !== "MANUAL_CENTRAL_REGISTER" || res.data.failClosed !== true) {
      throw new Error(`Mode manual register tidak aktif: ${JSON.stringify(res.data)}`);
    }
  });

  // Pembersihan folder temporary
  try {
    rmSync(TEST_STORE_DIR, { recursive: true, force: true });
  } catch (e) {}

  console.log("\n========================================================");
  console.log(`📊 HASIL PENGUJIAN MULTI-PROCESS ISOLATION: ${passed} LULUS, ${failed} GAGAL`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMultiProcessIsolationTests().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
