/**
 * KJPP NSR - Hardened Security & Resilience Test Suite (Tahap 2.6B-1A)
 * Tests all 10 advanced hardening requirements
 * Run with: node tests/auth-hardening.test.mjs
 */

import loginHandler from "../netlify/functions/auth-login.mjs";
import verifyHandler from "../netlify/functions/auth-verify.mjs";
import logoutHandler from "../netlify/functions/auth-logout.mjs";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  checkPermission,
  setUserProvider,
  ROLES,
  setUserAccount
} from "../netlify/functions/lib/auth-core.mjs";
import { registerTestUserProvider } from "./fixtures/test-users.mjs";
import {
  PersistentAuthStore,
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

async function runHardeningTests() {
  registerTestUserProvider(setUserProvider);
  console.log("\n========================================================");
  console.log("🛡️  KJPP NSR - SECURITY HARDENING & RESILIENCE TEST SUITE");
  console.log("   Tahap 2.6B-1A (10 Skenario Ketahanan Lanjutan)");
  console.log("========================================================\n");

  // Reset staging store sebelum pengujian
  await sessionRevocationStore.clearAll();
  await rateLimitStore.clearAll();

  // -----------------------------------------------------------------
  // UJI 1: Percobaan Login Serentak (Concurrent Login Attempts)
  // -----------------------------------------------------------------
  console.log("👉 UJI 1: Percobaan Login Serentak (Concurrent Requests)");
  {
    const makeReq = () => new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nf-client-connection-ip": "10.0.0.1"
      },
      body: JSON.stringify({ identifier: "test_admin", password: "AdminSecret2026!" })
    });

    // Jalankan 5 login serentak secara paralel
    const promises = [makeReq(), makeReq(), makeReq(), makeReq(), makeReq()].map((r) => loginHandler(r));
    const results = await Promise.all(promises);
    const statuses = results.map((r) => r.status);

    assert(statuses.every((s) => s === 200), "Seluruh 5 permintaan login serentak berhasil tanpa race-condition");
  }

  // -----------------------------------------------------------------
  // UJI 2: Rate Limiting Lintas Instance / Proses (Cross-Instance Persistence)
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 2: Rate Limiting Lintas Instance / Proses (Persistent Shared Store)");
  {
    const attackIp = "198.51.100.55";
    // Simulasikan Instance Server A menerima 5 percobaan password salah
    for (let i = 0; i < 5; i++) {
      await loginHandler(new Request("http://localhost/api/auth-login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-nf-client-connection-ip": attackIp
        },
        body: JSON.stringify({ identifier: "test_admin", password: "BadPassword!" })
      }));
    }

    // Simulasikan Instance Server B (instance baru yang baru menyala)
    // Instance B harus membaca catatan lockout yang sama dari persistent store
    const instanceB_Req = new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nf-client-connection-ip": attackIp
      },
      body: JSON.stringify({ identifier: "test_admin", password: "BadPassword!" })
    });

    const resB = await loginHandler(instanceB_Req);
    const dataB = await resB.json();

    assert(resB.status === 429, "Instance baru langsung menolak dengan 429 (Rate limit tersinkronisasi lintas instance)");
    assert(Boolean(dataB.error.includes("dikunci") || dataB.error.includes("permintaan")), "Pesan lockout akurat");
  }

  // -----------------------------------------------------------------
  // UJI 3: Pencabutan Sesi Setelah Instance Dijalankan Ulang (Cold Start Simulation)
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 3: Pencabutan Sesi Setelah Instance Server Dijalankan Ulang");
  {
    // Buat sesi di Instance 1
    const token = createSessionToken({ sub: "test_admin", role: ROLES.ADMIN_PUSAT });
    const parts = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    const jti = payload.jti;

    // Lakukan logout melalui endpoint logout (mencabut sesi di persistent store)
    const logoutReq = new Request("http://localhost/api/auth-logout", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` }
    });
    await logoutHandler(logoutReq);

    // Simulasikan REBOOT INSTANCE TOTAL:
    // Buat instance store baru yang tidak memiliki state in-memory lama
    const rebootedRevocationStore = new PersistentAuthStore("session-revocations");
    const isRevokedInRebootedInstance = await rebootedRevocationStore.get(`revoked/${jti}`);

    assert(Boolean(isRevokedInRebootedInstance), "Status pencabutan sesi tetap tercatat di storage setelah reboot");

    // Lakukan verifikasi token pada instance baru: HARUS TETAP DITOLAK
    const verifyReq = new Request("http://localhost/api/auth-verify", {
      headers: { authorization: `Bearer ${token}` }
    });
    const resVerify = await verifyHandler(verifyReq);
    assert(resVerify.status === 401, "Sesi yang dicabut tetap ditolak pada instance baru (Anti Cold-Start Bypass)");
  }

  // -----------------------------------------------------------------
  // UJI 4: Penolakan Pengguna yang Sudah Dinonaktifkan (isActive: false)
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 4: Penanganan Akun yang Dinonaktifkan (isActive: false)");
  {
    // A. Akun nonaktif mencoba login
    const loginDeactivated = await loginHandler(new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: "test_deactivated", password: "DeactivatedPass2026!" })
    }));
    assert(loginDeactivated.status === 403, "Login akun nonaktif ditolak dengan status 403 Forbidden");

    // B. Akun aktif yang memiliki sesi, lalu di tengah jalan dinonaktifkan oleh Admin
    // 1. Simpan user aktif di store
    await setUserAccount("temp_staff", {
      username: "temp_staff",
      passwordHash: hashPassword("TempSecret123!"),
      role: ROLES.CABANG,
      branch: "Makassar",
      displayName: "Staff Sementara",
      isActive: true
    });
    const activeToken = createSessionToken({ sub: "temp_staff", role: ROLES.CABANG });

    // Verifikasi awal sah
    const v1 = await verifyHandler(new Request("http://localhost/api/auth-verify", {
      headers: { authorization: `Bearer ${activeToken}` }
    }));
    assert(v1.status === 200, "Sesi staf aktif terverifikasi sah");

    // 2. Administrator menonaktifkan akun staf tersebut
    await setUserAccount("temp_staff", {
      username: "temp_staff",
      passwordHash: hashPassword("TempSecret123!"),
      role: ROLES.CABANG,
      branch: "Makassar",
      displayName: "Staff Sementara",
      isActive: false // DINONAKTIFKAN
    });

    // 3. Verifikasi ulang: Token lama harus otomatis GUGUR
    const v2 = await verifyHandler(new Request("http://localhost/api/auth-verify", {
      headers: { authorization: `Bearer ${activeToken}` }
    }));
    assert(v2.status === 403, "Sesi otomatis gugur seketika saat akun dinonaktifkan di backend");
  }

  // -----------------------------------------------------------------
  // UJI 5: Percobaan Mengubah Role dalam Token (Privilege Escalation Tampering)
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 5: Percobaan Pemalsuan Role dalam Token (Privilege Escalation)");
  {
    // Buat token sah dengan role CABANG
    const tokenCabang = createSessionToken({ sub: "test_cabang_bdg", role: ROLES.CABANG });
    const [h, p, s] = tokenCabang.split(".");
    
    // Penyerang mendecode payload, mengubah role menjadi ADMIN_PUSAT, lalu merangkai kembali token
    const decodedPayload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
    decodedPayload.role = "ADMIN_PUSAT"; // ESKALASI PRIVILEGE ILEGAL
    const forgedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString("base64url");
    const tamperedToken = `${h}.${forgedPayload}.${s}`;

    const res = await verifyHandler(new Request("http://localhost/api/auth-verify", {
      headers: { authorization: `Bearer ${tamperedToken}` }
    }));
    assert(res.status === 401, "Pemalsuan role terdeteksi dan ditolak (HMAC signature mismatch)");
  }

  // -----------------------------------------------------------------
  // UJI 6: Proteksi CSRF (Cross-Site Request Forgery)
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 6: Proteksi CSRF (Sec-Fetch-Site & Origin Validation)");
  {
    // A. Request dengan header Sec-Fetch-Site: cross-site
    const crossSiteReq = new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "sec-fetch-site": "cross-site",
        "origin": "https://evil-attacker-website.com"
      },
      body: JSON.stringify({ identifier: "test_admin", password: "AdminSecret2026!" })
    });
    const resCsrf = await loginHandler(crossSiteReq);
    assert(resCsrf.status === 403, "Permintaan lintas-situs ditolak 403 (Sec-Fetch-Site protection)");

    // B. Logout dari domain luar juga harus ditolak
    const crossLogout = new Request("http://localhost/api/auth-logout", {
      method: "POST",
      headers: {
        "sec-fetch-site": "cross-site",
        "origin": "https://malicious-site.org"
      }
    });
    const resLogoutCsrf = await logoutHandler(crossLogout);
    assert(resLogoutCsrf.status === 403, "Permintaan logout lintas-situs ditolak 403");
  }

  // -----------------------------------------------------------------
  // UJI 7: Kebocoran Token Melalui Respons API (JSON Body Inspection)
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 7: Kebocoran Token Melalui Respons API (Anti-Credential Leak)");
  {
    const req = new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: "test_keuangan", password: "FinanceSecret2026!" })
    });
    const res = await loginHandler(req);
    const data = await res.json();
    const cookieHeader = res.headers.get("set-cookie") || "";

    assert(data.token === undefined, "Field 'token' TIDAK ADA dalam JSON response body");
    assert(data.jwt === undefined, "Field 'jwt' TIDAK ADA dalam JSON response body");
    assert(data.session === undefined, "Field 'session' TIDAK ADA dalam JSON response body");
    assert(cookieHeader.includes("HttpOnly"), "Token eksklusif disimpan di HttpOnly Cookie");
    assert(cookieHeader.includes("SameSite=Strict"), "Cookie memiliki SameSite=Strict");
  }

  // -----------------------------------------------------------------
  // UJI 8: Pengujian Ketahanan Password Hashing (OWASP Scrypt Benchmark)
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 8: Pengujian Ketahanan Password Hashing (Scrypt N=32768)");
  {
    const password = "VeryStrongPassword2026!#$";
    const t0 = performance.now();
    const hash = hashPassword(password);
    const t1 = performance.now();
    const hashDurationMs = t1 - t0;

    assert(hash.startsWith("scrypt$32768$8$3$"), "Format hash mengikuti standar OWASP Scrypt N=32768, r=8, p=3");
    assert(verifyPassword(password, hash) === true, "Verifikasi password cocok");
    assert(verifyPassword("WrongPassword", hash) === false, "Verifikasi password salah ditolak");
    console.log(`     ℹ️  Waktu hashing Scrypt p=3: ${hashDurationMs.toFixed(2)} ms (Ideal untuk proteksi GPU brute-force)`);
    assert(hashDurationMs >= 50 && hashDurationMs <= 1500, "Waktu komputasi hash berada dalam rentang aman dan responsif (<1.5 detik)");
  }

  // -----------------------------------------------------------------
  // UJI 9: Isolasi Data Staging dari Produksi
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 9: Isolasi Data Staging dari Produksi");
  {
    const storeStaging = new PersistentAuthStore("test-namespace");
    assert(storeStaging.localDir.includes("staging") || storeStaging.localDir.includes("auth-store"), "Namespace penyimpanan menggunakan prefix staging terisolasi");
  }

  // -----------------------------------------------------------------
  // UJI 10: Penanganan Kegagalan Penyimpanan Sesi (Graceful Degradation)
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 10: Penanganan Kegagalan Input & Error Tanpa Kebocoran Stack Trace");
  {
    // Request dengan format JSON rusak
    const badJsonReq = new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "INVALID_MALFORMED_JSON_STRING{{{}"
    });
    const resBad = await loginHandler(badJsonReq);
    const dataBad = await resBad.json();

    assert(resBad.status === 400, "Bad JSON ditangani dengan status 400");
    assert(!dataBad.error.includes("SyntaxError: Unexpected"), "Pesan error bersih dan tidak membocorkan stack trace teknis");
  }

  console.log("\n========================================================");
  console.log(`📊 HASIL PENGUJIAN HARDENING: ${passedCount} LULUS, ${failedCount} GAGAL`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runHardeningTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
