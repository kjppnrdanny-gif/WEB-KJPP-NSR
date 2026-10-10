/**
 * scripts/seed-production-accounts.mjs
 * Utilitas Administratif Pendaftaran Akun Resmi Produksi KJPP NSR
 * 
 * Penggunaan:
 * Script ini dijalankan secara offline/terproteksi oleh Administrator untuk
 * mendaftarkan akun resmi (1 Admin Pusat, 1 Keuangan Pusat, 4 Cabang) ke dalam
 * persistent store (Netlify Blobs) menggunakan standar OWASP Scrypt hashing.
 * 
 * CATATAN KEAMANAN:
 * - Kredensial tidak di-hardcode di dalam kode sumber.
 * - Password wajib diatur melalui Environment Variables saat eksekusi.
 */

import { hashPassword, setUserAccount } from "../netlify/functions/lib/auth-core.mjs";

console.log("=======================================================");
console.log("🔐 PENDAFTARAN AKUN RESMI PRODUKSI KJPP NSR");
console.log("=======================================================");

const REQUIRED_ROLES = [
  { key: "ADMIN_PUSAT", defaultUser: "admin.pusat", role: "ADMIN_PUSAT", branch: "Pusat", displayName: "Administrator Kantor Pusat", title: "Admin Approval" },
  { key: "KEUANGAN_PUSAT", defaultUser: "keuangan.pusat", role: "KEUANGAN", branch: "Pusat", displayName: "Bagian Keuangan Pusat", title: "Manager Keuangan" },
  { key: "CABANG_BANDUNG", defaultUser: "cabang.bandung", role: "CABANG", branch: "Bandung", displayName: "Kantor Cabang Bandung", title: "Admin Cabang" },
  { key: "CABANG_PADANG", defaultUser: "cabang.padang", role: "CABANG", branch: "Padang", displayName: "Kantor Cabang Padang", title: "Admin Cabang" },
  { key: "CABANG_MAKASSAR", defaultUser: "cabang.makassar", role: "CABANG", branch: "Makassar", displayName: "Kantor Cabang Makassar", title: "Admin Cabang" },
  { key: "CABANG_PALEMBANG", defaultUser: "cabang.palembang", role: "CABANG", branch: "Palembang", displayName: "Kantor Cabang Palembang", title: "Admin Cabang" }
];

export async function seedAccounts(credentialsMap = {}) {
  let seededCount = 0;

  for (const item of REQUIRED_ROLES) {
    const username = credentialsMap[item.key]?.username || process.env[`NSR_USER_${item.key}`] || item.defaultUser;
    const rawPassword = credentialsMap[item.key]?.password || process.env[`NSR_PASS_${item.key}`];

    if (!rawPassword) {
      console.warn(`[LEWATI] Password untuk ${item.key} (${username}) belum disetel di environment.`);
      continue;
    }

    if (rawPassword.length < 10) {
      throw new Error(`[KEAMANAN GAGAL] Password untuk ${username} terlalu pendek (minimal 10 karakter).`);
    }

    const passwordHash = hashPassword(rawPassword);
    const userPayload = {
      username: username.toLowerCase(),
      passwordHash,
      role: item.role,
      branch: item.branch,
      displayName: item.displayName,
      title: item.title,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await setUserAccount(username, userPayload);
    console.log(`✓ Akun ${item.key} (${username}) berhasil didaftarkan ke persistent store.`);
    seededCount++;
  }

  return seededCount;
}

// Eksekusi jika dijalankan langsung via CLI
if (process.argv[1] && process.argv[1].endsWith("seed-production-accounts.mjs")) {
  seedAccounts().then(count => {
    console.log(`\nSelesai: ${count} akun berhasil diproses.`);
  }).catch(err => {
    console.error("Gagal melakukan pendaftaran akun:", err.message);
    process.exit(1);
  });
}
