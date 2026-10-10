/**
 * KJPP NSR - Automated Security Test Suite (Tahap 2.6B-1)
 * Tests all 7 security requirements using pure dummy accounts
 * Run with: node tests/auth-suite.test.mjs
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
  ROLES
} from "../netlify/functions/lib/auth-core.mjs";
import { registerTestUserProvider } from "./fixtures/test-users.mjs";
import {
  sessionRevocationStore,
  rateLimitStore
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

async function runTests() {
  registerTestUserProvider(setUserProvider);
  await sessionRevocationStore.clearAll();
  await rateLimitStore.clearAll();

  console.log("\n========================================================");
  console.log("🔒 KJPP NSR - SECURITY & AUTHENTICATION TEST SUITE");
  console.log("   Mode: Isolated Staging Test (Dummy Accounts Only)");
  console.log("========================================================\n");

  // -----------------------------------------------------------------
  // UJI 1: Login Akun Dummy yang Benar
  // -----------------------------------------------------------------
  console.log("👉 UJI 1: Login Akun Dummy yang Benar");
  {
    const req = new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "test_admin",
        password: "AdminSecret2026!"
      })
    });
    const res = await loginHandler(req);
    const data = await res.json();
    const cookie = res.headers.get("set-cookie") || "";

    assert(res.status === 200, "HTTP Status 200 OK");
    assert(data.success === true, "Response success flag is true");
    assert(data.user.username === "test_admin", "Username matches dummy admin");
    assert(data.user.role === ROLES.ADMIN_PUSAT, "Role correctly resolved to ADMIN_PUSAT");
    assert(data.permissions.canApproveNoLap === true, "Admin has approval permissions");
    assert(cookie.includes("HttpOnly"), "Set-Cookie has HttpOnly flag");
    assert(cookie.includes("SameSite=Strict"), "Set-Cookie has SameSite=Strict flag");
    assert(cookie.includes("nsr_session="), "Session token stored exclusively in HttpOnly cookie");
  }

  // -----------------------------------------------------------------
  // UJI 2: Penolakan Password Salah & Rate Limiting
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 2: Penolakan Password Salah & Rate Limiting Brute-Force");
  {
    const reqWrong = new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nf-client-connection-ip": "192.168.1.100"
      },
      body: JSON.stringify({
        identifier: "test_admin",
        password: "WrongPassword123!"
      })
    });
    const resWrong = await loginHandler(reqWrong);
    const dataWrong = await resWrong.json();

    assert(resWrong.status === 401, "HTTP Status 401 Unauthorized for wrong password");
    assert(dataWrong.error.includes("tidak valid"), "Generic error message returned (anti user-enumeration)");

    // Uji Rate Limiting: Kirim 4 percobaan gagal lagi (total 5)
    for (let i = 0; i < 4; i++) {
      await loginHandler(new Request("http://localhost/api/auth-login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-nf-client-connection-ip": "192.168.1.100"
        },
        body: JSON.stringify({ identifier: "test_admin", password: "WrongPassword123!" })
      }));
    }

    // Percobaan ke-6 harus kena Lockout 429
    const resLockout = await loginHandler(new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nf-client-connection-ip": "192.168.1.100"
      },
      body: JSON.stringify({ identifier: "test_admin", password: "WrongPassword123!" })
    }));
    assert(resLockout.status === 429, "HTTP Status 429 Too Many Requests after 5 failed attempts");
    assert(Boolean(resLockout.headers.get("retry-after")), "Retry-After header present on lockout");
  }

  // -----------------------------------------------------------------
  // UJI 3: Verifikasi Sesi Sah & Penolakan Sesi Kedaluwarsa
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 3: Verifikasi Sesi Sah & Penolakan Sesi Kedaluwarsa");
  {
    // Buat token sah
    const validToken = createSessionToken({
      sub: "test_cabang_bdg",
      role: ROLES.CABANG,
      branch: "Bandung",
      displayName: "Akun Pengujian Cabang Bandung"
    });

    const reqVerify = new Request("http://localhost/api/auth-verify", {
      method: "GET",
      headers: { authorization: `Bearer ${validToken}` }
    });
    const resVerify = await verifyHandler(reqVerify);
    const dataVerify = await resVerify.json();

    assert(resVerify.status === 200, "HTTP Status 200 for valid session token");
    assert(dataVerify.authenticated === true, "Session successfully authenticated");
    assert(dataVerify.user.role === ROLES.CABANG, "User role is CABANG");

    // Uji token kedaluwarsa secara matematis
    const expiredPayload = {
      sub: "test_cabang_bdg",
      role: ROLES.CABANG,
      exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 jam lalu
    };
    // Format token kedaluwarsa dengan HMAC yang benar
    const expToken = createSessionToken(expiredPayload);
    // Ubah timestamp expired di payload
    const parts = expToken.split(".");
    const decodedP = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    decodedP.exp = Math.floor(Date.now() / 1000) - 3600;
    const reEncodedP = Buffer.from(JSON.stringify(decodedP)).toString("base64url");
    // Buat signature baru untuk expired payload
    const { createHmac } = await import("node:crypto");
    const secret = process.env.NSR_JWT_SECRET || "nsr_dev_secret_key_change_in_production_9988";
    const sig = createHmac("sha256", secret).update(`${parts[0]}.${reEncodedP}`).digest("base64url");
    const tamperedExpiredToken = `${parts[0]}.${reEncodedP}.${sig}`;

    const resExp = await verifyHandler(new Request("http://localhost/api/auth-verify", {
      method: "GET",
      headers: { authorization: `Bearer ${tamperedExpiredToken}` }
    }));
    const dataExp = await resExp.json();
    assert(resExp.status === 401, "HTTP Status 401 for expired token");
    assert(dataExp.error.includes("kedaluwarsa"), "Error states token expired");
  }

  // -----------------------------------------------------------------
  // UJI 4: Perlindungan dari Sesi Tidak Sah (Tampered Token)
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 4: Perlindungan dari Sesi Tidak Sah (Tampered / Forged Token)");
  {
    const originalToken = createSessionToken({ sub: "test_cabang_bdg", role: ROLES.CABANG });
    const parts = originalToken.split(".");
    // Penyerang mencoba memodifikasi signature atau payload
    const tamperedToken = `${parts[0]}.${parts[1]}.FORGED_INVALID_SIGNATURE_XYZ`;

    const resTampered = await verifyHandler(new Request("http://localhost/api/auth-verify", {
      method: "GET",
      headers: { authorization: `Bearer ${tamperedToken}` }
    }));
    assert(resTampered.status === 401, "HTTP Status 401 for forged token signature");
  }

  // -----------------------------------------------------------------
  // UJI 5: Logout & Pencabutan Sesi (Session Revocation)
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 5: Logout & Pencabutan Sesi (Session Revocation)");
  {
    const activeToken = createSessionToken({ sub: "test_admin", role: ROLES.ADMIN_PUSAT });
    
    // Verifikasi awal aktif
    const resBefore = await verifyHandler(new Request("http://localhost/api/auth-verify", {
      headers: { authorization: `Bearer ${activeToken}` }
    }));
    assert(resBefore.status === 200, "Token is active before logout");

    // Jalankan logout
    const resLogout = await logoutHandler(new Request("http://localhost/api/auth-logout", {
      method: "POST",
      headers: { authorization: `Bearer ${activeToken}` }
    }));
    const dataLogout = await resLogout.json();
    assert(resLogout.status === 200, "Logout endpoint returns 200 OK");
    assert(dataLogout.success === true, "Logout reports success");

    // Verifikasi setelah logout: token harus DITOLAK karena telah masuk daftar cabut (revocation set)
    const resAfter = await verifyHandler(new Request("http://localhost/api/auth-verify", {
      headers: { authorization: `Bearer ${activeToken}` }
    }));
    const dataAfter = await resAfter.json();
    assert(resAfter.status === 401, "Token rejected after logout");
    assert(dataAfter.error.includes("dicabut"), "Error states session was revoked");
  }

  // -----------------------------------------------------------------
  // UJI 6: Penegakan Hak Akses Server-Side (RBAC Matrix)
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 6: Penegakan Hak Akses Server-Side (RBAC Matrix Enforcement)");
  {
    // Role Cabang:
    assert(checkPermission(ROLES.CABANG, "canSubmitNoLap") === true, "Cabang: Dapat submit NoLap (Tab 1)");
    assert(checkPermission(ROLES.CABANG, "canAccessSPM") === true, "Cabang: Dapat akses SPM (Tab 2)");
    assert(checkPermission(ROLES.CABANG, "canApproveNoLap") === false, "Cabang: DILARANG Approval NoLap (Tab 3)");
    assert(checkPermission(ROLES.CABANG, "canAccessElsa") === false, "Cabang: DILARANG Akses eLSa (Tab 4)");
    assert(checkPermission(ROLES.CABANG, "canViewAllHistory") === false, "Cabang: DILARANG Akses Riwayat Global (Tab 5)");
    assert(checkPermission(ROLES.CABANG, "canManageKwitansi") === false, "Cabang: DILARANG Otorisasi Kwitansi");

    // Role Admin Pusat:
    assert(checkPermission(ROLES.ADMIN_PUSAT, "canApproveNoLap") === true, "Admin Pusat: Diizinkan Approval NoLap (Tab 3)");
    assert(checkPermission(ROLES.ADMIN_PUSAT, "canAccessElsa") === true, "Admin Pusat: Diizinkan Akses eLSa (Tab 4)");
    assert(checkPermission(ROLES.ADMIN_PUSAT, "canViewAllHistory") === true, "Admin Pusat: Diizinkan Akses Riwayat Global (Tab 5)");

    // Role Keuangan:
    assert(checkPermission(ROLES.KEUANGAN, "canManageKwitansi") === true, "Keuangan: Diizinkan Otorisasi Kwitansi");
    assert(checkPermission(ROLES.KEUANGAN, "canSignKwitansi") === true, "Keuangan: Diizinkan Penandatanganan Kwitansi");
    assert(checkPermission(ROLES.KEUANGAN, "canApproveNoLap") === false, "Keuangan: DILARANG Approval NoLap Teknik");
  }

  // -----------------------------------------------------------------
  // UJI 7: Verifikasi Zero Kredensial Asli dalam Kode & Log
  // -----------------------------------------------------------------
  console.log("\n👉 UJI 7: Verifikasi Zero Kredensial Asli dalam Kode Modul & Test");
  {
    const fs = await import("node:fs");
    const coreCode = fs.readFileSync("netlify/functions/lib/auth-core.mjs", "utf8");
    const loginCode = fs.readFileSync("netlify/functions/auth-login.mjs", "utf8");
    const verifyCode = fs.readFileSync("netlify/functions/auth-verify.mjs", "utf8");

    // Daftar pola kata kunci sensitif produksi yang DILARANG ADA di modul baru
    const forbiddenKeywords = [
      "NSR8899", "JKT#00", "BDG#010", "PDG#020", "MKS#030", "PLB#040",
      "NSR-PST-2026", "NSR-BDG-2026", "ADMIN#NSR"
    ];

    let leakFound = false;
    for (const kw of forbiddenKeywords) {
      if (coreCode.includes(kw) || loginCode.includes(kw) || verifyCode.includes(kw)) {
        leakFound = true;
        console.error(`DETEKSI KEBOCORAN KREDENSIAL: '${kw}' ditemukan di kode!`);
      }
    }

    assert(!leakFound, "Tidak ada kredensial produksi yang tertanam di modul baru");
  }

  console.log("\n========================================================");
  console.log(`📊 HASIL PENGUJIAN: ${passedCount} LULUS, ${failedCount} GAGAL`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
