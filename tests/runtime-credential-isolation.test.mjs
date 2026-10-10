/**
 * KJPP NSR - Pengujian Isolasi Kredensial & Akun Dummy dari Runtime Produksi
 * (Tahap 2.6B-2C: Runtime Credential Isolation & Production Guard Test)
 * 
 * Memvalidasi:
 * 1. Seluruh kode backend Netlify Functions BEBAS TOTAL dari kamus akun dummy & hardcoded passwords.
 * 2. Multi-layer guard: setUserProvider mutlak melempar SECURITY_VIOLATION di lingkungan produksi.
 * 3. Dalam mode produksi (NSR_ENV=production / NODE_ENV=production), pemanggilan getUserAccount
 *    untuk akun dummy mengembalikan null.
 * 4. Dalam mode produksi, permintaan login untuk akun dummy langsung ditolak (HTTP 401).
 * 5. Tanpa injeksi provider eksplisit pada mode non-produksi, akun dummy tetap tidak dikenal.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getUserAccount,
  setUserProvider,
  _resetUserProvider
} from "../netlify/functions/lib/auth-core.mjs";
import authLoginHandler from "../netlify/functions/auth-login.mjs";
import { createMockUserProvider } from "./fixtures/test-users.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const FUNCTIONS_DIR = path.join(ROOT_DIR, "netlify", "functions");

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

console.log("\n========================================================");
console.log("🛡️  KJPP NSR - ISOLASI KREDENSIAL RUNTIME & PRODUCTION GUARDS");
console.log("   Tahap 2.6B-2C (Audit Backend Package & Mock Provider Isolation)");
console.log("========================================================\n");

// =========================================================================
// 1. AUDIT STATIC CODE: ZERO DUMMY CREDENTIALS DI RUNTIME BACKEND
// =========================================================================
console.log("👉 UJI 1: Pemindaian Kode Sumber Backend netlify/functions/");

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith(".mjs") || file.endsWith(".js") || file.endsWith(".ts")) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const backendFiles = getAllFiles(FUNCTIONS_DIR);

report("Backend netlify/functions/ memuat minimal 4 berkas serverless & pustaka", () => {
  assert.ok(backendFiles.length >= 4);
});

report("Zero DUMMY_SEED_USERS: Kamus dummy seed tidak ada dalam kode runtime backend", () => {
  backendFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    assert.ok(
      !content.includes("DUMMY_SEED_USERS"),
      `Pelanggaran ditemukan di ${path.basename(file)}: memuat DUMMY_SEED_USERS`
    );
  });
});

report("Zero Hardcoded Dummy Passwords: Password pengujian tidak ada dalam kode runtime backend", () => {
  const prohibitedStrings = [
    "AdminSecret2026!",
    "CabangSecret2026!",
    "PadangSecret2026!",
    "FinanceSecret2026!",
    "SurveyorSecret2026!",
    "DeactivatedPass2026!"
  ];

  backendFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    prohibitedStrings.forEach((secret) => {
      assert.ok(
        !content.includes(secret),
        `Pelanggaran ditemukan di ${path.basename(file)}: memuat password dummy '${secret}'`
      );
    });
  });
});

report("Zero Hardcoded User Accounts: Daftar user dummy tidak di-hardcode dalam auth-core.mjs", () => {
  const authCorePath = path.join(FUNCTIONS_DIR, "lib", "auth-core.mjs");
  const content = fs.readFileSync(authCorePath, "utf-8");
  assert.ok(!content.includes('"test_admin":'));
  assert.ok(!content.includes('"test_cabang_bdg":'));
  assert.ok(!content.includes('"test_cabang_pdg":'));
});

// =========================================================================
// 2. PRODUCTION GUARDS: PENOLAKAN INJEKSI MOCK PADA MODE PRODUKSI
// =========================================================================
console.log("\n👉 UJI 2: Penolakan Multi-Layer Injeksi Mock Provider pada Mode Produksi");

_resetUserProvider();

report("Guard 1 (NSR_ENV=production): setUserProvider mutlak melempar SECURITY_VIOLATION", () => {
  const originalEnv = process.env.NSR_ENV;
  try {
    process.env.NSR_ENV = "production";
    assert.throws(
      () => {
        setUserProvider(createMockUserProvider());
      },
      (err) => err.message.includes("SECURITY_VIOLATION")
    );
  } finally {
    process.env.NSR_ENV = originalEnv;
  }
});

report("Guard 2 (NODE_ENV=production): setUserProvider mutlak melempar SECURITY_VIOLATION", () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    assert.throws(
      () => {
        setUserProvider(createMockUserProvider());
      },
      (err) => err.message.includes("SECURITY_VIOLATION")
    );
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

report("Guard 3 (Netlify Context tanpa flag staging testing): setUserProvider ditolak", () => {
  const origNetlify = process.env.NETLIFY;
  const origStaging = process.env.NSR_STAGING_TESTING;
  try {
    process.env.NETLIFY = "true";
    delete process.env.NSR_STAGING_TESTING;
    assert.throws(
      () => {
        setUserProvider(createMockUserProvider());
      },
      (err) => err.message.includes("SECURITY_VIOLATION")
    );
  } finally {
    if (origNetlify !== undefined) process.env.NETLIFY = origNetlify;
    else delete process.env.NETLIFY;
    if (origStaging !== undefined) process.env.NSR_STAGING_TESTING = origStaging;
    else delete process.env.NSR_STAGING_TESTING;
  }
});

// =========================================================================
// 3. RUNTIME BEHAVIOR: AKUN DUMMY TIDAK DAPAT LOGIN DI PRODUKSI
// =========================================================================
console.log("\n👉 UJI 3: Perilaku Runtime Penolakan Akun Dummy di Lingkungan Produksi");

await reportAsync("Mode Produksi: getUserAccount('test_admin') mengembalikan null", async () => {
  const origEnv = process.env.NSR_ENV;
  try {
    process.env.NSR_ENV = "production";
    _resetUserProvider();
    const user = await getUserAccount("test_admin");
    assert.strictEqual(user, null);
  } finally {
    process.env.NSR_ENV = origEnv;
  }
});

await reportAsync("Mode Produksi: Percobaan login akun dummy ditolak seketika dengan HTTP 401", async () => {
  const origEnv = process.env.NSR_ENV;
  try {
    process.env.NSR_ENV = "production";
    _resetUserProvider();
    const req = new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: "test_admin", password: "AdminSecret2026!" })
    });
    const res = await authLoginHandler(req);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.authenticated, undefined);
  } finally {
    process.env.NSR_ENV = origEnv;
  }
});

await reportAsync("Mode Non-Produksi tanpa injeksi mock: getUserAccount('test_admin') tetap mengembalikan null", async () => {
  _resetUserProvider();
  const user = await getUserAccount("test_admin");
  assert.strictEqual(user, null);
});

await reportAsync("Mode Non-Produksi dengan injeksi mock sah: getUserAccount('test_admin') berhasil ditemukan", async () => {
  _resetUserProvider();
  setUserProvider(createMockUserProvider());
  const user = await getUserAccount("test_admin");
  assert.ok(user);
  assert.strictEqual(user.username, "test_admin");
  assert.strictEqual(user.role, "ADMIN_PUSAT");
  _resetUserProvider();
});

console.log("\n========================================================");
console.log(`📊 HASIL PENGUJIAN ISOLASI KREDENSIAL: ${passed} LULUS, ${failed} GAGAL`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
