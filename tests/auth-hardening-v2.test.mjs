/**
 * KJPP NSR - Advanced Hardening Test Suite (Tahap 2.6B-1B)
 * Tests:
 * 1. Concurrent failed login attempts (Atomic Event-Log race condition test)
 * 2. Rate limiting consistency under high concurrency
 * 3. Fail-Closed security during storage outage (Session revocation failure handling)
 * 4. Backward-compatibility with legacy hashes (scrypt N=16384, p=1, salt:hex) and auto-rehash
 * 5. Scrypt N=32768, r=8, p=3 OWASP performance & memory boundaries
 * 
 * Run with: node tests/auth-hardening-v2.test.mjs
 */

import loginHandler from "../netlify/functions/auth-login.mjs";
import verifyHandler from "../netlify/functions/auth-verify.mjs";
import logoutHandler from "../netlify/functions/auth-logout.mjs";
import {
  hashPassword,
  verifyPassword,
  needsRehash,
  createSessionToken,
  verifySessionToken,
  CURRENT_SCRYPT_N,
  CURRENT_SCRYPT_R,
  CURRENT_SCRYPT_P,
  setUserProvider,
  ROLES
} from "../netlify/functions/lib/auth-core.mjs";
import { registerTestUserProvider } from "./fixtures/test-users.mjs";
import {
  sessionRevocationStore,
  rateLimitStore,
  userAccountStore
} from "../netlify/functions/lib/storage-adapter.mjs";

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    failedCount++;
  }
}

async function runTestsV2() {
  registerTestUserProvider(setUserProvider);
  console.log("\n========================================================");
  console.log("🛡️  KJPP NSR - SECURITY HARDENING V2 (Tahap 2.6B-1B)");
  console.log("   OWASP p=3 Scrypt, Atomic Rate-Limit, Fail-Closed Test");
  console.log("========================================================\n");

  // Reset stores
  await sessionRevocationStore.clearAll();
  await rateLimitStore.clearAll();
  sessionRevocationStore.setSimulateFailure(false);

  // -----------------------------------------------------------------
  // UJI 1: OWASP Scrypt p=3 Hashing & Resource Bounds
  // -----------------------------------------------------------------
  console.log("👉 UJI 1: OWASP Scrypt p=3 Hashing & Resource Bounds");
  {
    const password = "TestPassword#OWASP2026!";
    const t0 = performance.now();
    const hash = hashPassword(password);
    const t1 = performance.now();
    const duration = t1 - t0;

    assert(hash.startsWith(`scrypt$${CURRENT_SCRYPT_N}$${CURRENT_SCRYPT_R}$${CURRENT_SCRYPT_P}$`), `Format hash menggunakan Scrypt N=${CURRENT_SCRYPT_N}, r=${CURRENT_SCRYPT_R}, p=${CURRENT_SCRYPT_P}`);
    assert(verifyPassword(password, hash) === true, "Verifikasi password cocok dengan konfigurasi p=3");
    assert(verifyPassword("WrongPassword!", hash) === false, "Password salah ditolak");
    assert(needsRehash(hash) === false, "Hash baru tidak membutuhkan rehash (needsRehash === false)");
    
    // Perkiraan memori Scrypt: 128 * N * r * p bytes = 128 * 32768 * 8 * 3 = 100,663,296 bytes (~96 MB)
    const ramEstMB = (128 * CURRENT_SCRYPT_N * CURRENT_SCRYPT_R * CURRENT_SCRYPT_P) / (1024 * 1024);
    console.log(`     ℹ️  Waktu komputasi p=3: ${duration.toFixed(2)} ms | Estimasi Memori: ${ramEstMB.toFixed(1)} MB`);
    assert(duration < 2000, "Waktu komputasi jauh di bawah ambang batas timeout Netlify Functions (10 detik)");
    assert(ramEstMB <= 128, "Konsumsi memori 96 MB berada aman di bawah batas RAM Netlify (1024 MB)");
  }

  // -----------------------------------------------------------------
  // UJI 2: Kompatibilitas Hash Format Lama (Backward-Compatibility & Auto-Rehash)
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 2: Kompatibilitas Hash Lama (Backward-Compatibility & Auto-Rehash)");
  {
    const pwd = "LegacyUserSecret2026!";

    // Format A: scrypt N=32768, p=1 (dari Tahap 2.6B-1A)
    const crypto = await import("node:crypto");
    const saltA = crypto.randomBytes(16).toString("hex");
    const keyA = crypto.scryptSync(pwd, saltA, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    const legacyHashA = `scrypt$32768$8$1$${saltA}$${keyA.toString("hex")}`;

    assert(verifyPassword(pwd, legacyHashA) === true, "Hash Tahap 2.6B-1A (p=1) berhasil diverifikasi oleh engine baru");
    assert(needsRehash(legacyHashA) === true, "Engine mendeteksi bahwa hash p=1 perlu di-rehash ke p=3");

    // Format B: scrypt N=16384, p=1 (dari Tahap 2.6B-1 awal)
    const saltB = crypto.randomBytes(16).toString("hex");
    const keyB = crypto.scryptSync(pwd, saltB, 64, { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 });
    const legacyHashB = `scrypt$16384$8$1$${saltB}$${keyB.toString("hex")}`;

    assert(verifyPassword(pwd, legacyHashB) === true, "Hash lama N=16384 berhasil diverifikasi oleh engine baru");
    assert(needsRehash(legacyHashB) === true, "Engine mendeteksi bahwa hash N=16384 perlu di-rehash");

    // Format C: Format tertua salt:hex
    const legacyHashC = `${saltB}:${keyB.toString("hex")}`;
    assert(verifyPassword(pwd, legacyHashC) === true, "Format legacy salt:hex berhasil diverifikasi");
    assert(needsRehash(legacyHashC) === true, "Format legacy salt:hex ditandai needsRehash");
  }

  // -----------------------------------------------------------------
  // UJI 3: Percobaan Login Salah Serentak & Konsistensi Atomic Event Rate Limiting
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 3: Percobaan Login Salah Serentak (Atomic Rate-Limit Concurrency Test)");
  {
    const targetUser = "concurrency_test_user";
    const testIp = "203.0.113.88";

    // Simulasikan 5 percobaan login salah yang dikirim secara BERSAMAAN (serentak via Promise.all)
    const makeFailedLogin = () => loginHandler(new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nf-client-connection-ip": testIp
      },
      body: JSON.stringify({ identifier: targetUser, password: "IncorrectPassword!" })
    }));

    // Eksekusi serentak 5 request gagal
    const concurrentFailures = await Promise.all([
      makeFailedLogin(),
      makeFailedLogin(),
      makeFailedLogin(),
      makeFailedLogin(),
      makeFailedLogin()
    ]);

    // Verifikasi bahwa atomic event-log mencatat TEPAT 5 event tanpa hilang/tertimpa
    const recordedEvents = await rateLimitStore.countRecentEvents("user_attempt", targetUser, 900);
    console.log(`     ℹ️  Jumlah kegagalan yang tercatat dari 5 request serentak: ${recordedEvents}`);
    assert(recordedEvents === 5, "Tepat 5 kegagalan tercatat secara atomik (Zero Lost Updates)");

    // Request ke-6 harus seketika DIKUNCI dengan HTTP 429 Too Many Requests
    const resBlocked = await makeFailedLogin();
    assert(resBlocked.status === 429, "Request ke-6 langsung ditolak dengan 429 Too Many Requests");
    const dataBlocked = await resBlocked.json();
    assert(dataBlocked.error.includes("dikunci") || dataBlocked.error.includes("permintaan"), "Pesan penolakan rate-limit akurat");
  }

  // -----------------------------------------------------------------
  // UJI 4: Fail-Closed Security Saat Terjadi Kegagalan Penyimpanan Sesi
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 4: Prinsip Fail-Closed Saat Terjadi Kegagalan Storage");
  {
    // Buat token sah
    const validToken = createSessionToken({ sub: "test_admin", role: ROLES.ADMIN_PUSAT });

    // Verifikasi awal saat storage normal: HARUS SUKSES 200
    const resNormal = await verifyHandler(new Request("http://localhost/api/auth-verify", {
      headers: { authorization: `Bearer ${validToken}` }
    }));
    assert(resNormal.status === 200, "Verifikasi normal berhasil (200 OK)");

    // SIMULASIKAN KEGAGALAN SISTEM PENYIMPANAN (Storage Outage / Connection Drop)
    sessionRevocationStore.setSimulateFailure(true);

    // Lakukan verifikasi saat storage gagal:
    // Prinsip FAIL-CLOSED: Akses TIDAK BOLEH diberikan secara otomatis!
    const resStorageDown = await verifyHandler(new Request("http://localhost/api/auth-verify", {
      headers: { authorization: `Bearer ${validToken}` }
    }));
    const dataStorageDown = await resStorageDown.json();

    assert(resStorageDown.status === 503, "Status HTTP 503 Service Unavailable saat storage terputus (Bukan 200)");
    assert(dataStorageDown.authenticated === false, "Akses ditolak (authenticated: false)");
    assert(dataStorageDown.error.includes("Fail-Closed") || dataStorageDown.error.includes("tidak dapat diakses"), "Error secara tegas menyatakan proteksi Fail-Closed");

    // Kembalikan storage ke normal
    sessionRevocationStore.setSimulateFailure(false);

    // Verifikasi kembali pulih ke 200
    const resRecovered = await verifyHandler(new Request("http://localhost/api/auth-verify", {
      headers: { authorization: `Bearer ${validToken}` }
    }));
    assert(resRecovered.status === 200, "Verifikasi otomatis pulih setelah storage normal kembali");
  }

  // -----------------------------------------------------------------
  // UJI 5: Pencabutan Sesi & Uji Penolakan Mutlak
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 5: Pencabutan Sesi & Penolakan Mutlak (Zero Re-use)");
  {
    const token = createSessionToken({ sub: "test_cabang_bdg", role: ROLES.CABANG });

    // Logout untuk mencabut sesi
    const resLogout = await logoutHandler(new Request("http://localhost/api/auth-logout", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` }
    }));
    assert(resLogout.status === 200, "Logout berhasil mencatat pencabutan sesi");

    // Coba gunakan kembali token yang sudah dicabut sebanyak 3 kali berturut-turut
    for (let i = 1; i <= 3; i++) {
      const resReuse = await verifyHandler(new Request("http://localhost/api/auth-verify", {
        headers: { authorization: `Bearer ${token}` }
      }));
      assert(resReuse.status === 401, `Percobaan penggunaan ulang #${i} mutlak ditolak (401 Unauthorized)`);
    }
  }

  console.log("\n========================================================");
  console.log(`📊 HASIL PENGUJIAN HARDENING V2: ${passedCount} LULUS, ${failedCount} GAGAL`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestsV2().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
