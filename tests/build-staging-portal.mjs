/**
 * KJPP NSR - Fail-Safe Staging Portal Builder
 * (Tahap 2.6B-2E: Strict Sanitization & Atomic Build Engine)
 * 
 * Aturan Mutlak Builder:
 * 1. Setiap pola yang wajib diganti diverifikasi secara ketat (strictReplace).
 *    Jika satu pola saja tidak ditemukan, proses build LANGSUNG BERHENTI (fail-closed halt).
 * 2. Hasil build ditulis ke file sementara (.tmp) dan diaudit ulang (post-build audit).
 * 3. Jika ditemukan referensi produksi, berkas sementara langsung dihapus dan exit(1).
 * 4. Berkas paket tujuan HANYA diterbitkan apabila seluruh audit lulus 100%.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const srcPath = path.join(ROOT_DIR, "portal-nolap-dev.html");
const destPath = path.join(ROOT_DIR, "staging-isolated-package", "public", "portal-nolap-staging.html");
const tmpPath = destPath + ".tmp";

function strictReplace(content, search, replacement, label) {
  let matched = false;
  if (typeof search === "string") {
    matched = content.includes(search);
  } else if (search instanceof RegExp) {
    matched = search.test(content);
  }
  if (!matched) {
    throw new Error(`[BUILD_HALT_ERROR] Pola wajib '${label}' TIDAK DITEMUKAN dalam source! Proses build dibatalkan untuk mencegah sanitasi parsial.`);
  }
  return content.replace(search, replacement);
}

function buildStagingPortal() {
  console.log("🔨 Memulai Fail-Safe Build: portal-nolap-staging.html...");

  if (!fs.existsSync(srcPath)) {
    throw new Error(`[BUILD_HALT_ERROR] Berkas sumber ${srcPath} tidak ditemukan!`);
  }

  let html = fs.readFileSync(srcPath, "utf-8");

  // 1. Ganti Title
  html = strictReplace(
    html,
    "<title>Portal Pengajuan &amp; Penerbitan Nomor Laporan Penilaian (NoLap) | KJPP Nanang Rahayu Sigit Paryanto dan Rekan</title>",
    "<title>Portal NoLap (Staging Terisolasi) - KJPP Nanang Rahayu &amp; Rekan</title>",
    "Halaman Title"
  );

  // 2. Ganti Banner Dokumen & Regulasi
  const bannerRegex = /<!-- ==================== BANNER INFORMASI DOKUMEN & REGULASI ==================== -->[\s\S]*?<\/section>/;
  const bannerReplacement = `<!-- ==================== BANNER INFORMASI STAGING TERISOLASI ==================== -->
  <section class="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border-b border-amber-500/30 py-2.5 px-4 no-print">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-2 text-slate-300">
        <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase border border-amber-500/30">LINGKUNGAN STAGING TERISOLASI</span>
        <span class="text-amber-200">Mode Simulasi Nonproduksi • Seluruh Data Bersifat Sintetis/Dummy</span>
      </div>
      <div class="text-[11px] text-amber-300/90 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>Koneksi Produksi: <strong>TERPUTUS (100% ISOLATED)</strong></span>
      </div>
    </div>
  </section>`;
  html = strictReplace(html, bannerRegex, bannerReplacement, "Banner Dokumen & Regulasi");

  // 3. Ganti Header Link Portal Kwitansi
  html = strictReplace(
    html,
    '<a href="portal-kwitansi.html" title="Buka Portal Kwitansi" class="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition items-center gap-1.5 border border-slate-700">\n          <span>🧾 Portal Kwitansi</span>\n        </a>',
    '<span class="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-xs font-semibold">🧾 Portal Kwitansi (Nonaktif di Staging)</span>',
    "Header Link Kwitansi"
  );

  // 4. Ganti Header Link Web Utama
  html = strictReplace(
    html,
    '<a href="index.html" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700">\n          <span>&larr; Web Utama</span>\n        </a>',
    '<a href="index.html" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700">\n          <span>&larr; Gerbang Staging</span>\n        </a>',
    "Header Link Web Utama"
  );

  // 5. Sanitasi Placeholder Pemohon (Zahra / Tedi Setiadi)
  html = strictReplace(
    html,
    'placeholder="Contoh: Zahra / Tedi Setiadi"',
    'placeholder="Contoh: Staf Penilai Staging"',
    "Placeholder Pemohon"
  );

  // 6. Sanitasi Placeholder Email Resmi
  html = strictReplace(
    html,
    'placeholder="email@kjppnanangrahayu.com"',
    'placeholder="staf@staging-kjppnsr.local"',
    "Placeholder Email"
  );

  // 7. Sanitasi Placeholder Form Klien (Bank BTN & Ivander)
  html = strictReplace(
    html,
    'placeholder="Contoh: PT. BANK TABUNGAN NEGARA (PERSERO), Tbk KC BEKASI q.q. PT. IVANDER PUTRA SUKSES"',
    'placeholder="Contoh: PT Bank Simulasi Indonesia (Persero) Tbk q.q. PT Usaha Contoh Properti"',
    "Placeholder Form Klien"
  );

  // 8. Sanitasi Pilihan Rekan Penilai Publik (Dropdown f-penilai)
  const penilaiOldRegex = /<select id="f-penilai"[\s\S]*?<\/select>/;
  const penilaiNewSelect = `<select id="f-penilai" onchange="updateLivePreview()" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
                <option value="Penilai Dummy Satu" data-izin="00581">Penilai Dummy Satu — Izin: 00581</option>
                <option value="Penilai Dummy Dua" data-izin="0218">Penilai Dummy Dua — Izin: 0218</option>
                <option value="Penilai Dummy Tiga" data-izin="PS.0249">Penilai Dummy Tiga — Izin: PS.0249</option>
                <option value="Penilai Dummy Empat" data-izin="PS.0046">Penilai Dummy Empat — Izin: PS.0046</option>
                <option value="Penilai Dummy Lima" data-izin="PS.0126">Penilai Dummy Lima — Izin: PS.0126</option>
              </select>`;
  html = strictReplace(html, penilaiOldRegex, penilaiNewSelect, "Dropdown f-penilai");

  // 9. Sanitasi Kamus Penilai (MASTER_PENILAI)
  const masterPenilaiOld = `const MASTER_PENILAI = {
      "Deni Siswandi": "00581",
      "Nanang Rahayu": "0218",
      "Dharma Priyanto Sih Budi Susilo": "PS.0249", // DIBERSIHKAN: Spasi tersembunyi dihapus
      "Hernita": "PS.0046",
      "Muhammad Amin Sade": "PS.0126"
    };`;
  const masterPenilaiNew = `const MASTER_PENILAI = {
      "Penilai Dummy Satu": "00581",
      "Penilai Dummy Dua": "0218",
      "Penilai Dummy Tiga": "PS.0249",
      "Penilai Dummy Empat": "PS.0046",
      "Penilai Dummy Lima": "PS.0126"
    };`;
  html = strictReplace(html, masterPenilaiOld, masterPenilaiNew, "Kamus MASTER_PENILAI");

  // 10. Sanitasi Placeholder Google Drive
  html = strictReplace(
    html,
    'placeholder="https://drive.google.com/..."',
    'placeholder="https://example.com/simulasi-berkas/..."',
    "Placeholder Google Drive"
  );

  // 11. Sanitasi Nomor WA Admin di Footer Modal
  html = strictReplace(
    html,
    "<span>Admin Resmi: <strong>085110513157</strong></span>",
    "<span>Mode Pengujian: <strong>Staging Nonproduksi (Dummy)</strong></span>",
    "Nomor WA Footer Modal"
  );

  // 12. Sanitasi Komentar Token & Akun
  html = strictReplace(
    html,
    "// Kamus token frontend (MASTER_TOKEN) dan daftar NIK karyawan telah DIHAPUS TOTAL pada versi dev ini.",
    "// Kamus autentikasi frontend lama telah DIHAPUS TOTAL pada versi staging ini.",
    "Komentar Token Frontend"
  );

  // 13. Ganti Database Awal Resmi dengan Dummy Staging Murni
  const dbOldRegex = /const DATABASE_AWAL_RESMI = \[[\s\S]*?\];/;
  const dbNewContent = `const DATABASE_AWAL_RESMI = [
      {
        noPermintaan: "REQ-STG-0001",
        timestamp: "2026-10-01 09:30:00",
        cabang: "Pusat",
        namaPemohon: "Staf Simulasi Pusat",
        jabatanPemohon: "Admin Operasional",
        emailPemohon: "simulasi.pusat@staging-kjppnsr.local",
        waPemohon: "081200000001",
        namaKlien: "PT Bank Simulasi Indonesia (Persero) Tbk",
        statusKlien: "Bank",
        alamatKlien: "Jl. Sudirman Simulasi No. 100, Jakarta",
        kontakKlien: "081200000002",
        klasifikasiJasa: "PI",
        kodeIndustri: "07",
        tujuanPenilaian: "Penjaminan Utang (Simulasi)",
        jenisObjek: "Tanah dan Bangunan Kantor",
        lokasiObjek: "Kawasan Bisnis Contoh Kavling A1, Jakarta",
        deadline: "2026-10-25",
        penilai: "Penilai Dummy Satu",
        izinPenilai: "00581",
        npwp: "01.234.567.8-000.000",
        kodeNpwp: "1",
        penggunaLaporan: "PT Bank Simulasi Indonesia (Persero) Tbk",
        status: "NOMOR DITERBITKAN",
        nomorLaporan: "00529/2.0160-00/PI/07/00581/1/X/2026",
        tglTerbit: "2026-10-02",
        statusElsa: "BELUM INPUT",
        linkElsa: "",
        linkDrive: "",
        catatanAdmin: "Diterbitkan dalam simulasi staging terisolasi."
      },
      {
        noPermintaan: "REQ-STG-0002",
        timestamp: "2026-10-02 14:15:00",
        cabang: "Bandung",
        namaPemohon: "Staf Simulasi Bandung",
        jabatanPemohon: "Staf Penilai Cabang",
        emailPemohon: "simulasi.bdg@staging-kjppnsr.local",
        waPemohon: "081200000003",
        namaKlien: "PT Properti Tiruan Mandiri",
        statusKlien: "Swasta",
        alamatKlien: "Jl. Asia Afrika Simulasi No. 12, Bandung",
        kontakKlien: "081200000004",
        klasifikasiJasa: "PI",
        kodeIndustri: "07",
        tujuanPenilaian: "Jual Beli (Simulasi)",
        jenisObjek: "Tanah Komersial Kosong",
        lokasiObjek: "Jl. Soekarno Hatta Contoh, Bandung",
        deadline: "2026-10-28",
        penilai: "Penilai Dummy Dua",
        izinPenilai: "00581",
        npwp: "02.345.678.9-000.000",
        kodeNpwp: "1",
        penggunaLaporan: "PT Bank Simulasi Indonesia (Persero) Tbk",
        status: "DIAJUKAN",
        nomorLaporan: "",
        tglTerbit: "",
        statusElsa: "BELUM INPUT",
        linkElsa: "",
        linkDrive: "",
        catatanAdmin: ""
      }
    ];`;
  html = strictReplace(html, dbOldRegex, dbNewContent, "Array DATABASE_AWAL_RESMI");

  // 14. Isolasi Storage Key
  html = html.replace(/nsr_nolap_database/g, "nsr_nolap_staging_db");

  // 15. Hapus Fallback Google Apps Script
  const appsScriptRegex = /\/\/ 2\. Fallback Google Apps Script[\s\S]*?fetch\(ENDPOINT[\s\S]*?\}\s*catch\s*\(e\)\s*\{\}/;
  html = strictReplace(
    html,
    appsScriptRegex,
    "// 2. Fallback Google Apps Script: DINONAKTIFKAN DALAM STAGING (100% Terisolasi)",
    "Fallback Google Apps Script"
  );

  // 16. Hapus link wa.me dan ganti tombol WhatsApp di Modal Sukses
  html = strictReplace(
    html,
    "const linkWaAdmin = `https://wa.me/6285110513157?text=${pesanWa}`;",
    "const linkWaAdmin = '#';",
    "Tautan linkWaAdmin"
  );

  const actionRegex = /action\.innerHTML = `[\s\S]*?<a href="\$\{linkWaAdmin\}"[\s\S]*?<\/a>[\s\S]*?`;/;
  const actionReplacement = `action.innerHTML = \`
        <button type="button" onclick="alert('Simulasi Staging: Pengiriman WhatsApp resmi dinonaktifkan dalam lingkungan pengujian.')" class="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-bold text-xs flex items-center gap-2 cursor-not-allowed">
          <span>🚫 Notifikasi WA Dinonaktifkan (Simulasi Staging)</span>
        </button>
        <button onclick="tutupModalDetail()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs">
          Tutup
        </button>
      \`;`;
  html = strictReplace(html, actionRegex, actionReplacement, "Tombol WhatsApp Modal Sukses");

  // 17. Sanitasi Logo onerror external fallback
  html = strictReplace(
    html,
    `onerror="this.onerror=null; this.src='https://i.ibb.co.com/t7P4T8B/LOGO-KJPP-NSR-2.png';"`,
    `onerror="this.style.display='none';"`,
    "Logo onerror fallback"
  );

  // =========================================================================
  // ATOMIC WRITE & POST-BUILD AUDIT
  // =========================================================================
  fs.writeFileSync(tmpPath, html, "utf-8");

  // Daftar String Terlarang yang Tidak Boleh Ada di Hasil Build
  const FORBIDDEN_STRINGS = [
    "085110513157",
    "0895391057740",
    "081314489587",
    "https://wa.me/",
    "script.google.com/macros",
    "docs.google.com/spreadsheets",
    "1q1KpKRrNvvT_nD8D0y9dgZzuz8CpCFCNi6oQtoz7sc4",
    "1W8mQy",
    "PT. BANK TABUNGAN NEGARA",
    "PT. GEMILANG SAKTI PROPERTINDO",
    "PT. SOUBER WIJAYA SAKTI",
    "PT. Ivander Putra Sukses",
    "Perumahan Green Lavender",
    "MASTER_TOKEN",
    "MASTER_USER_ACCOUNTS",
    "Zahra",
    "Tedi Setiadi",
    "Deni Siswandi",
    "Muhammad Amin Sade",
    "Dharma Priyanto",
    "Hernita",
    "drive.google.com",
    "email@kjppnanangrahayu.com",
    "i.ibb.co.com"
  ];

  const builtContent = fs.readFileSync(tmpPath, "utf-8");
  const violations = [];

  for (const forbidden of FORBIDDEN_STRINGS) {
    if (builtContent.includes(forbidden)) {
      violations.push(forbidden);
    }
  }

  if (violations.length > 0) {
    // Hapus file sementara untuk mencegah sanitasi parsial
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    throw new Error(`[POST_BUILD_AUDIT_ERROR] Ditemukan ${violations.length} referensi produksi terlarang dalam hasil build: ${violations.join(", ")}. Berkas build dibatalkan!`);
  }

  // Jika seluruh audit lulus 100%, pindahkan file sementara ke tujuan akhir
  fs.renameSync(tmpPath, destPath);
  console.log(`✅ [BUILD SUKSES] portal-nolap-staging.html berhasil diterbitkan secara atomik (${html.length} bytes). Seluruh referensi produksi terbukti 100% bersih.`);
}

try {
  buildStagingPortal();
  process.exit(0);
} catch (err) {
  console.error(`❌ [BUILD GAGAL] ${err.message}`);
  if (fs.existsSync(tmpPath)) {
    try { fs.unlinkSync(tmpPath); } catch (e) {}
  }
  process.exit(1);
}
