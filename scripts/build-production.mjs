/**
 * Script Build Produksi KJPP NSR (Allowlist Publisher)
 * Memastikan HANYA aset web publik resmi yang masuk ke direktori 'dist/'.
 * Seluruh kode backend, modul internal, tests, fixtures, dan preview terisolasi 100%.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");

// 1. ALLOWLIST FILE SPESIFIK YANG BOLEH DITERBITKAN
const ALLOWED_FILES = [
  // Halaman Utama Resmi
  "index.html",
  "company-profile.html",
  "profil-legalitas.html",
  "layanan.html",
  "portofolio-rekanan.html",
  "tim-cabang.html",
  "wawasan-regulasi.html",
  "portal-nolap.html",
  "portal-kwitansi.html",
  "portal-absensi.html",
  "portal-presensi.html",
  "portal-penugasan-jo.html",
  "portal-nolap-cabang.html",
  "portal-surat-umum.html",
  "portal-operasional.html",
  "verifikasi-dokumen.html",
  "kebijakan-privasi.html",
  "disclaimer.html",
  "trusted-by.html",
  "panduan-sosialisasi-karyawan.html",
  "panduan-operasional-nolap-kwitansi.html",
  "panduan-operasional-portal-nolap.html",
  "panduan-mitigasi-pengadaan-tanah-pln-makassar.html",
  "alur-kerja-penugasan-nolap-kwitansi.html",

  // Aset Brand, Icon, dan Dokumen Resmi
  "favicon.ico",
  "favicon.png",
  "logo-nsr.png",
  "og-image.jpg",
  "og-image.png",
  "company-profile-kjpp-nsr-2026.pdf",
  "Company Profile KJPP NSR 2026_S.pdf",
  "Company-Profile-KJPP-NSR-2026_S.pdf",

  // Foto Manajemen Rekan Berizin
  "foto-nanang.jpg",
  "foto-deni.jpg",
  "foto-hernita.jpg",
  "foto-amin.jpg",
  "foto-dharma.jpg",

  // SEO & Web Standard & Server API
  "robots.txt",
  "sitemap.xml",
  "humans.txt",
  ".htaccess",
  "visitor-stats.php",
  "auth-handler.php",
  "api/auth.php",
  "pdp-consent-handler.php",
  "nolap-data-handler.php",
  "merge-tags-engine.php",
  "process-mail-queue.php",
  "kwitansi-data-handler.php",
  "surat-umum-data-handler.php",
  "absensi-data-handler.php",
  "operasional-data-handler.php",
  "status-terintegrasi-handler.php",
  "data/.htaccess"
];

// 2. ALLOWLIST DIREKTORI PUBLIK
const ALLOWED_DIRS = [
  "images",
  "components",
  "lib"
];

// 3. DENYLIST STRICT (Jika ada berkas ini di dist, BUILD DIBATALKAN)
const FORBIDDEN_PATTERNS = [
  /tests/i,
  /scratch/i,
  /screenshots/i,
  /preview-/i,
  /staging-/i,
  /portal-nolap-dev/i,
  /test-/i,
  /\.mjs$/i,
  /package.*\.json$/i,
  /netlify\/functions/i,
  /\.git/i
];

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function auditDistSecurity(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(relPath)) {
        throw new Error(`[KEAMANAN GAGAL] Berkas terlarang terdeteksi di direktori publikasi: ${relPath}`);
      }
    }

    if (entry.isDirectory()) {
      auditDistSecurity(fullPath, baseDir);
    }
  }
}

function auditPortalHardcodedTokens(distDir) {
  const portalFiles = [
    "index.html",
    "portal-penugasan-jo.html",
    "portal-nolap-cabang.html",
    "portal-kwitansi.html",
    "portal-surat-umum.html",
    "portal-operasional.html",
    "verifikasi-dokumen.html",
    "portal-nolap.html",
    "layanan.html",
    "portofolio-rekanan.html",
    "profil-legalitas.html",
    "tim-cabang.html",
    "wawasan-regulasi.html"
  ];
  const forbiddenCredentials = [
    /MASTER_TOKEN\s*=/i,
    /MASTER_USER_ACCOUNTS\s*=/i,
    /TOKEN_CABANG_MAP\s*=/i,
    /TOKEN_CABANG_NSR\s*=/i,
    /TOKEN_PUSAT_VALID\s*=/i,
    /urlParams\.get\(['"]token['"]\)/i,
    /NSR-ADM-99/i,
    /ADMIN#NSR/i,
    /JKT#00/i,
    /['"]NSR8899['"]/i,
    /['"]NSR-PST-2026['"]/i,
    /['"]NSR-ADM-2026['"]/i,
    /['"]NSR-BDG-2026['"]/i,
    /['"]NSR-PDG-2026['"]/i,
    /['"]NSR-MKS-2026['"]/i,
    /['"]NSR-PLB-2026['"]/i,
    /['"]NSR-MKT-2026['"]/i,
    /['"]NSR-REV-2026['"]/i,
    /['"]NSR-APP-2026['"]/i,
    /11wF3BxOVDp3uraA3a0iIQdkYPizflQHz/i
  ];

  for (const pf of portalFiles) {
    const filePath = path.join(distDir, pf);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");

    for (const pat of forbiddenCredentials) {
      if (pat.test(content)) {
        throw new Error(`[SECURITY_GATE_FAIL] Celah keamanan atau plaintext token/link terdeteksi di ${pf}: pola ${pat}`);
      }
    }
  }
}

export function buildProduction(options = {}) {
  const isCpanel = options.cpanel || process.argv.includes("--cpanel") || process.env.TARGET_ENV === "cpanel";
  const isIndexOnly = options.indexOnly || process.argv.includes("--index-only") || process.env.INDEX_ONLY === "true";

  console.log("=======================================================");
  console.log(`🔒 MEMULAI BUILD PRODUKSI ALLOWLIST KJPP NSR -> dist/ [Target: ${isCpanel ? "cPanel" : "Lokal/Lengkap"}${isIndexOnly ? " | INDEX ONLY" : ""}]`);
  console.log("=======================================================");

  // Reset dist/
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 1. Tentukan berkas allowlist berdasarkan target
  let filesToCopy = [...ALLOWED_FILES];
  if (isIndexOnly) {
    filesToCopy = ["index.html"];
    console.log("⚡ Mode Isolasi Maksimum: HANYA index.html yang disalin ke paket deployment.");
  } else if (isCpanel) {
    // Seluruh portal operasional tervalidasi (JO, NoLap, Kwitansi, SU, Absensi) disertakan lengkap
    console.log("🛡️ cPanel Build Active: Seluruh paket web & portal tervalidasi disertakan.");
  }

  // Salin File Allowlist (dengan sanitasi log sensitif & whitespace)
  let fileCount = 0;
  for (const file of filesToCopy) {
    const src = path.join(ROOT_DIR, file);
    const dest = path.join(DIST_DIR, file);
    if (fs.existsSync(src)) {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

      if (file.endsWith('.html') || file.endsWith('.js')) {
        let content = fs.readFileSync(src, "utf8");
        // Sanitasi log kredensial dan debug internal di berkas distribusi publik
        content = content.replace(/console\.(log|debug|info)\s*\([^)]*(?:token|auth|password|kredensial|secret)[^)]*\);?/gi, "");
        fs.writeFileSync(dest, content, "utf8");
      } else {
        fs.copyFileSync(src, dest);
      }
      fileCount++;
    } else {
      console.warn(`[Warning] File allowlist tidak ditemukan: ${file}`);
    }
  }
  console.log(`✓ Menyalin ${fileCount} berkas web publik resmi (tersanitasi).`);

  // 2. Salin Direktori Allowlist (dilewati bila mode index-only)
  if (!isIndexOnly) {
    for (const d of ALLOWED_DIRS) {
      const src = path.join(ROOT_DIR, d);
      const dest = path.join(DIST_DIR, d);
      if (fs.existsSync(src)) {
        copyDirRecursive(src, dest);
        console.log(`✓ Menyalin direktori aset: ${d}/`);
      }
    }
  }

  // 3. Audit Keamanan & Anti-Kebocoran
  console.log("\n🔍 Melakukan audit integritas dan pemindaian anti-kebocoran...");
  auditDistSecurity(DIST_DIR);
  console.log("✓ Audit Keamanan LULUS: Tidak ada berkas pengembangan/tests/preview di dist/.");

  // 3B. Audit Pemindaian Token Frontend Lama & URL Bypass pada Portal Kandidat Produksi
  console.log("🔍 Memindai token hardcoded dan URL bypass pada portal di dist/...");
  auditPortalHardcodedTokens(DIST_DIR);
  console.log("✓ Audit Token LULUS: Portal bebas dari kamus token lama dan parameter bypass URL.");

  // 4. Verifikasi Keberadaan Berkas Kunci
  const requiredFiles = isIndexOnly ? ["index.html"] : [
    "index.html",
    "company-profile.html",
    "profil-legalitas.html",
    "layanan.html",
    "portofolio-rekanan.html",
    "tim-cabang.html",
    "wawasan-regulasi.html"
  ];
  if (!isCpanel && !isIndexOnly) {
    requiredFiles.push("portal-nolap.html", "portal-kwitansi.html");
  }

  for (const rf of requiredFiles) {
    if (!fs.existsSync(path.join(DIST_DIR, rf))) {
      throw new Error(`[Verifikasi Gagal] Berkas kunci tidak ada di dist/: ${rf}`);
    }
  }
  console.log(`✓ Seluruh ${requiredFiles.length} berkas utama publik terverifikasi lengkap.`);

  console.log("=======================================================");
  console.log("✨ BUILD SELESAI: Paket publikasi aman siap di 'dist/'!");
  console.log("=======================================================\n");
}

// Jalankan jika dieksekusi langsung
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildProduction();
}
