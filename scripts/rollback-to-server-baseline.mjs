import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const backupPath = path.join(ROOT_DIR, "backup_server_production", "index.html.original_server_backup");
const targetPath = path.join(ROOT_DIR, "index.html");

const EXPECTED_SHA = "eaa0b65554d5794b2908d2a751a6b9ee322ced7ee8c5d1b9d4b1ab4bfdd0baa8";

if (!fs.existsSync(backupPath)) {
  console.error("❌ File backup server tidak ditemukan:", backupPath);
  process.exit(1);
}

const backupContent = fs.readFileSync(backupPath, "utf8");
const actualSha = crypto.createHash("sha256").update(backupContent, "utf8").digest("hex");

if (actualSha !== EXPECTED_SHA) {
  console.error("❌ Integritas backup gagal! SHA256 mismatch:");
  console.error("   Diharapkan:", EXPECTED_SHA);
  console.error("   Aktual:    ", actualSha);
  process.exit(1);
}

fs.writeFileSync(targetPath, backupContent, "utf8");
console.log("✅ ROLLBACK BERHASIL: index.html telah dipulihkan ke versi server asli!");
console.log("   SHA256:", actualSha);
console.log("   Ukuran:", Buffer.byteLength(backupContent, "utf8"), "bytes");
