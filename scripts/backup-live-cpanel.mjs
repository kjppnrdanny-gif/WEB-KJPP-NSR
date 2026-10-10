/**
 * Script Pengunduhan & Cadangan Website Langsung dari Server cPanel Live
 * Mengunduh file website aktif di https://kjppnanangrahayu.com/
 * Termasuk portal-nolap.html, portal-kwitansi.html, dan seluruh halaman resmi
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const BACKUP_BASE_DIR = path.join(ROOT_DIR, "backups");
const LIVE_URL = "https://kjppnanangrahayu.com";

const FILES_TO_BACKUP = [
  "index.html",
  "portal-nolap.html",
  "portal-kwitansi.html",
  "company-profile.html",
  "profil-legalitas.html",
  "layanan.html",
  "portofolio-rekanan.html",
  "tim-cabang.html",
  "wawasan-regulasi.html",
  "trusted-by.html",
  "robots.txt",
  "sitemap.xml",
  "humans.txt",
  "favicon.ico",
  "favicon.png",
  "logo-nsr.png",
  "og-image.jpg",
  "og-image.png",
  "foto-nanang.jpg",
  "foto-deni.jpg",
  "foto-hernita.jpg",
  "foto-amin.jpg",
  "foto-dharma.jpg",
  "Company-Profile-KJPP-NSR-2026_S.pdf"
];

function downloadFile(fileRelPath, targetDir) {
  return new Promise((resolve, reject) => {
    const encodedUrl = `${LIVE_URL}/${encodeURI(fileRelPath)}`;
    const destPath = path.join(targetDir, fileRelPath);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const fileStream = fs.createWriteStream(destPath);
    https.get(encodedUrl, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          const stats = fs.statSync(destPath);
          console.log(`✓ Terunduh dari cPanel: ${fileRelPath} (${stats.size.toLocaleString()} bytes)`);
          resolve(true);
        });
      } else {
        fileStream.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        console.warn(`[Info] ${fileRelPath} status: ${res.statusCode} (tidak ada atau terproteksi)`);
        resolve(false);
      }
    }).on("error", (err) => {
      fileStream.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

export async function backupLiveCpanel() {
  console.log("=======================================================");
  console.log("🌐 MENGUNDUH SNAPSHOT LIVE WEBSITE DARI CPANEL RUMAHWEB");
  console.log(`   Sumber: ${LIVE_URL}`);
  console.log("=======================================================\n");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const liveBackupDir = path.join(BACKUP_BASE_DIR, `cpanel-live-${timestamp}`);
  if (!fs.existsSync(liveBackupDir)) fs.mkdirSync(liveBackupDir, { recursive: true });

  let successCount = 0;
  for (const file of FILES_TO_BACKUP) {
    try {
      const ok = await downloadFile(file, liveBackupDir);
      if (ok) successCount++;
    } catch (e) {
      console.error(`Gagal mengunduh ${file}:`, e.message);
    }
  }

  // Buat metadata cadangan
  const meta = {
    source: LIVE_URL,
    timestamp: new Date().toISOString(),
    filesCount: successCount,
    cpanelHost: "Rumahweb (ns1.rumahweb.com, LiteSpeed)"
  };
  fs.writeFileSync(path.join(liveBackupDir, "cpanel-backup-metadata.json"), JSON.stringify(meta, null, 2));

  // Kompres ke format ZIP
  const zipPath = path.join(BACKUP_BASE_DIR, `cpanel-live-backup-${timestamp}.zip`);
  console.log(`\n📦 Mengompres cadangan cPanel live ke: ${zipPath}`);
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${liveBackupDir}\\*' -DestinationPath '${zipPath}' -Force"`);

  console.log(`\n✅ BERHASIL CADANGKAN LIVE CPANEL:`);
  console.log(`   - Direktori snapshot: ${liveBackupDir}`);
  console.log(`   - File arsip ZIP: ${zipPath}`);
  console.log(`   - Total file live terunduh: ${successCount}`);
  console.log("=======================================================\n");

  return { liveBackupDir, zipPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  backupLiveCpanel().catch((err) => {
    console.error("Gagal backup cPanel:", err);
    process.exit(1);
  });
}
