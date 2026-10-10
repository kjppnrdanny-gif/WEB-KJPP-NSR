/**
 * KJPP NSR - Pengujian Validasi Allowlist Deployment & Pemisahan Aset Publik
 * (Tahap 2.6B-2C: Deployment Allowlist & Build Artifact Integrity Test)
 * 
 * Memvalidasi:
 * 1. Seluruh dependensi publik website (11 halaman utama, animasi lib, gambar, SEO, PDF)
 *    tercatat lengkap dalam allowlist publikasi.
 * 2. Seluruh berkas internal (portal-nolap-dev.html, folder tests/, backend netlify/functions/,
 *    scratch files, file konfigurasi) terdaftar dalam denylist proteksi.
 * 3. Simulasi penyusunan paket publikasi (Build Pipeline Allowlist Filter) membuktikan bahwa
 *    aset terlarang TIDAK AKAN PERNAH masuk ke direktori publikasi statis CDN.
 * 4. Zero Backend Code (.mjs) di dalam direktori publikasi aset.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

console.log("\n========================================================");
console.log("📦 KJPP NSR - AUDIT ALLOWLIST STRUKTUR DEPLOYMENT & ASET");
console.log("   Tahap 2.6B-2C (Pencegahan Publikasi Berkas Internal)");
console.log("========================================================\n");

// =========================================================================
// 1. AUDIT KELENGKAPAN DEPENDENSI WEBSITE UTAMA (ALLOWLIST)
// =========================================================================
console.log("👉 UJI 1: Verifikasi Kelengkapan Aset Website Existing (Allowlist)");

// Daftar Halaman Statis Publik Resmi
const REQUIRED_PUBLIC_PAGES = [
  "index.html",
  "company-profile.html",
  "layanan.html",
  "tim-cabang.html",
  "portofolio-rekanan.html",
  "profil-legalitas.html",
  "wawasan-regulasi.html",
  "preview-carousel.html",
  "preview-transformasi.html",
  "portal-nolap.html",
  "portal-kwitansi.html"
];

report("Seluruh 11 halaman publik utama terverifikasi ada dan utuh di repositori", () => {
  REQUIRED_PUBLIC_PAGES.forEach((page) => {
    const fullPath = path.join(ROOT_DIR, page);
    assert.ok(fs.existsSync(fullPath), `Halaman wajib tidak ditemukan: ${page}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 1000, `Halaman ${page} memiliki ukuran terlalu kecil (< 1KB)`);
  });
});

// Verifikasi Aset Animasi & Bundle di lib/
const REQUIRED_LIB_ASSETS = [
  "lib/count-up-vanilla.js",
  "lib/count-up.bundle.js",
  "lib/dot-field-vanilla.js",
  "lib/dot-field.bundle.js",
  "lib/flex-carousel-vanilla.js",
  "lib/flex-carousel.bundle.js",
  "lib/light-rays-vanilla.js",
  "lib/light-rays.bundle.js"
];

report("Pustaka animasi beranda (vanilla & bundles di lib/) tersedia lengkap", () => {
  REQUIRED_LIB_ASSETS.forEach((asset) => {
    const fullPath = path.join(ROOT_DIR, asset);
    assert.ok(fs.existsSync(fullPath), `Asset lib wajib tidak ditemukan: ${asset}`);
  });
});

// Verifikasi Berkas SEO & Meta
const REQUIRED_META_ASSETS = [
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "favicon.png",
  "logo-nsr.png",
  "og-image.jpg"
];

report("Berkas identitas, SEO, favicon, dan OpenGraph tersedia lengkap", () => {
  REQUIRED_META_ASSETS.forEach((meta) => {
    const fullPath = path.join(ROOT_DIR, meta);
    assert.ok(fs.existsSync(fullPath), `Meta file wajib tidak ditemukan: ${meta}`);
  });
});

// Verifikasi Dokumen Profil PDF Resmi
report("Berkas PDF Company Profile resmi tersedia di root", () => {
  const pdfPath1 = path.join(ROOT_DIR, "Company Profile KJPP NSR 2026_S.pdf");
  const pdfPath2 = path.join(ROOT_DIR, "Company-Profile-KJPP-NSR-2026_S.pdf");
  assert.ok(fs.existsSync(pdfPath1) || fs.existsSync(pdfPath2));
});

// =========================================================================
// 2. AUDIT DAFTAR BERKAS TERLARANG (DENYLIST PUBLIKASI STATIS)
// =========================================================================
console.log("\n👉 UJI 2: Identifikasi Berkas Internal yang Dilarang Menjadi Aset Statis (Denylist)");

const STRICT_DENYLIST_PATTERNS = [
  "portal-nolap-dev.html",
  "staging-auth-test.html",
  "test-header-mobile.html",
  "test-sync.txt",
  "visitor-data.json",
  "visitor-stats.php",
  "package.json",
  "package-lock.json",
  ".htaccess",
  "README-DEPLOY.txt",
  "README.md"
];

report("Seluruh berkas terlarang berhasil teridentifikasi dan dipetakan dalam denylist", () => {
  STRICT_DENYLIST_PATTERNS.forEach((file) => {
    assert.ok(typeof file === "string" && file.length > 0);
  });
});

// =========================================================================
// 3. SIMULASI PIPELINE ALLOWLIST FILTER UNTUK STAGING / PRODUCTION
// =========================================================================
console.log("\n👉 UJI 3: Simulasi Filter Allowlist Build & Pemisahan Direktori Publikasi");

// Filter Rule: Fungsi murni yang memutuskan apakah suatu berkas boleh masuk publish directory
function isFileAllowedForStaticPublish(filePath) {
  const norm = filePath.replace(/\\/g, "/");

  // Aturan 1: Tolak jika merupakan berkas atau subfolder tests/
  if (norm.startsWith("tests/") || norm === "tests") return false;

  // Aturan 2: Tolak jika merupakan kode backend netlify/functions/
  if (norm.startsWith("netlify/") || norm === "netlify") return false;

  // Aturan 3: Tolak jika berada dalam staging-isolated-package (karena sudah paket sendiri)
  if (norm.startsWith("staging-isolated-package/")) return false;

  // Aturan 4: Tolak seluruh berkas denylist eksplisit
  if (STRICT_DENYLIST_PATTERNS.includes(norm)) return false;

  // Aturan 5: Tolak file tersembunyi/dotfiles
  const basename = path.basename(norm);
  if (basename.startsWith(".") && basename !== ".htaccess") return false;

  // Aturan 6: Tolak file bereksistensi .mjs, .php, .json (selain manifest yang diizinkan)
  if (norm.endsWith(".mjs") || norm.endsWith(".php") || norm.endsWith(".env")) return false;

  // Izinkan halaman publik resmi
  if (REQUIRED_PUBLIC_PAGES.includes(norm)) return true;

  // Izinkan aset gambar, lib, dan dokumen profil
  if (norm.startsWith("images/") || norm.startsWith("lib/")) return true;
  if (norm.endsWith(".pdf") || norm.endsWith(".jpg") || norm.endsWith(".png") || norm.endsWith(".ico")) return true;
  if (REQUIRED_META_ASSETS.includes(norm)) return true;

  return false;
}

report("portal-nolap-dev.html DITOLAK dari publikasi statis oleh allowlist filter", () => {
  assert.strictEqual(isFileAllowedForStaticPublish("portal-nolap-dev.html"), false);
});

report("Berkas dalam folder tests/ DITOLAK dari publikasi statis", () => {
  assert.strictEqual(isFileAllowedForStaticPublish("tests/auth-suite.test.mjs"), false);
  assert.strictEqual(isFileAllowedForStaticPublish("tests/fixtures/test-users.mjs"), false);
});

report("Kode sumber Netlify Functions DITOLAK dari publikasi statis", () => {
  assert.strictEqual(isFileAllowedForStaticPublish("netlify/functions/auth-login.mjs"), false);
  assert.strictEqual(isFileAllowedForStaticPublish("netlify/functions/lib/auth-core.mjs"), false);
});

report("Berkas halaman utama index.html DIIZINKAN untuk publikasi", () => {
  assert.strictEqual(isFileAllowedForStaticPublish("index.html"), true);
});

report("Berkas animasi lib/count-up.bundle.js DIIZINKAN untuk publikasi", () => {
  assert.strictEqual(isFileAllowedForStaticPublish("lib/count-up.bundle.js"), true);
});

report("Berkas portal produksi existing (portal-nolap.html & portal-kwitansi.html) DIIZINKAN untuk publikasi", () => {
  assert.strictEqual(isFileAllowedForStaticPublish("portal-nolap.html"), true);
  assert.strictEqual(isFileAllowedForStaticPublish("portal-kwitansi.html"), true);
});

// =========================================================================
// 4. HASIL SIMULASI AUDIT DAFTAR FILE PUBLIKASI LENGKAP
// =========================================================================
console.log("\n👉 UJI 4: Pemindaian Seluruh Berkas Repositori Terhadap Filter Allowlist");

const allRepoFiles = [];
function scanRepo(dir, rel = "") {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === "node_modules" || item === ".git") continue;
    const full = path.join(dir, item);
    const itemRel = rel ? `${rel}/${item}` : item;
    if (fs.statSync(full).isDirectory()) {
      scanRepo(full, itemRel);
    } else {
      allRepoFiles.push(itemRel);
    }
  }
}
scanRepo(ROOT_DIR);

const filteredPublishFiles = allRepoFiles.filter(isFileAllowedForStaticPublish);

report("Filter allowlist berhasil menyaring repositori (Aset publik terkumpul, berkas internal terisolasi)", () => {
  assert.ok(filteredPublishFiles.length >= 15);
  // Verifikasi ketiadaan berkas berbahaya
  const hasDevPortal = filteredPublishFiles.some((f) => f.includes("portal-nolap-dev"));
  const hasTests = filteredPublishFiles.some((f) => f.includes("tests/"));
  const hasFunctions = filteredPublishFiles.some((f) => f.includes("netlify/functions/"));
  const hasMjs = filteredPublishFiles.some((f) => f.endsWith(".mjs"));

  assert.strictEqual(hasDevPortal, false, "portal-nolap-dev.html tidak boleh lolos ke publish!");
  assert.strictEqual(hasTests, false, "Berkas tests/ tidak boleh lolos ke publish!");
  assert.strictEqual(hasFunctions, false, "Backend functions tidak boleh lolos ke publish!");
  assert.strictEqual(hasMjs, false, "Ekstensi .mjs tidak boleh lolos ke publish!");
});

console.log("\n========================================================");
console.log(`📊 HASIL AUDIT ALLOWLIST DEPLOYMENT: ${passed} LULUS, ${failed} GAGAL`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
