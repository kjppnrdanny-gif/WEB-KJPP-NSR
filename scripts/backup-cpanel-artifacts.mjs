/**
 * Script Pembuatan Snapshot Cadangan Lokal (Rollback Archive)
 * Menghasilkan arsip zip ber-stempel waktu dari paket dist/
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const BACKUP_DIR = path.join(ROOT_DIR, "backups");

export function createBackup() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error("❌ Direktori dist/ belum ada. Jalankan build terlebih dahulu.");
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupZip = path.join(BACKUP_DIR, `cpanel-dist-backup-${timestamp}.zip`);

  console.log(`📦 Mengompres direktori dist/ menjadi ${backupZip}...`);
  try {
    // Gunakan PowerShell Compress-Archive di Windows
    execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${DIST_DIR}\\*' -DestinationPath '${backupZip}' -Force"`, {
      stdio: "inherit"
    });
    console.log(`✅ Snapshot cadangan berhasil disimpan: ${backupZip}`);
  } catch (err) {
    console.error("Gagal membuat arsip zip cadangan:", err.message);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createBackup();
}
