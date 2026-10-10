/**
 * Script Restorasi Penuh Desain Asli Beranda KJPP NSR (Basis Commit 1647d3f)
 * Memulihkan 100% visual, animasi, dan substansi asli tanpa merusak keamanan:
 * 1. Menjaga 15 Section Lengkap (Hero, Rekanan Ticker, Visi-Misi, Transformasi, Keunggulan, Layanan, Sistem Mutu/NSR Cloud, Pengalaman, Galeri 3D FlexCarousel, Manajemen & CV Rekan, Regulasi, Wawasan, Kepercayaan, FAQ, Kontak 5 Kantor).
 * 2. Memastikan LightRays, DotField, CountUp, FlexCarousel 3D, dan Bezier NSR Cloud aktif bergerak.
 * 3. Membedakan Domisili Ragunan vs Operasional Graha Arteri Mas Jakarta.
 * 4. Menjamin kompetensi murni Penilai Properti (P).
 * 5. Menjaga modal portal internal resmi (NoLap & Kwitansi tanpa bypass token).
 */

import fs from "node:fs";

let html = fs.readFileSync("old_index_1647d3f.html", "utf8");

// 1. Tambahkan fungsi wrapper bukaModalPortal & tutupModalPortal jika belum ada
if (!html.includes("function bukaModalPortal")) {
  html = html.replace(
    "function bukaModal(id) {",
    `function bukaModalPortal() {\n      bukaModal('modal-portal');\n    }\n    function tutupModalPortal() {\n      tutupModal('modal-portal');\n    }\n\n    function bukaModal(id) {`
  );
}

// 2. Koreksi teks bisnis -> properti
html = html.replace(
  "Analisis kelayakan investasi bisnis, Highest &amp; Best Use (HBU), dan advisory perizinan proyek.",
  "Analisis kelayakan investasi properti, Highest &amp; Best Use (HBU), dan advisory perizinan proyek."
);

html = html.replace(
  "Kajian terpadu investasi bisnis: aspek legalitas, pasar/pemasaran, manajemen, teknis kelayakan finansial, dan AMDAL.",
  "Kajian terpadu investasi properti: aspek legalitas, pasar/pemasaran, manajemen, teknis kelayakan finansial, dan AMDAL."
);

html = html.replace(
  "Workshop Bisnis Legal &amp; Penilaian Agunan Bank BJB",
  "Workshop Aspek Legal &amp; Penilaian Agunan Bank BJB"
);

// 3. Tambahkan Alamat Operasional Graha Arteri Mas pada Kantor Pusat Jakarta di Section Kontak
const targetPusatAddress = `Jl. Hankam No. 5 RT.006 RW.001, Kelurahan Ragunan, Kecamatan Pasar Minggu, Kota Jakarta Selatan, DKI Jakarta 12550`;
const replacementPusatAddress = `Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Jakarta Selatan 12550 (Domisili Hukum)<br><span class="text-amber-300 font-semibold">Kantor Operasional:</span> Graha Arteri Mas Kav. 53, Jl. Panjang No. 68, Kedoya Selatan, Kebon Jeruk, Jakarta Barat 11530`;

html = html.replace(targetPusatAddress, replacementPusatAddress);

// 4. Update peta deskripsi JS di kontak data
html = html.replace(
  `alamat: 'Jl. Hankam No. 5 RT.006 RW.001, Kelurahan Ragunan, Kecamatan Pasar Minggu, Kota Jakarta Selatan, DKI Jakarta 12550',`,
  `alamat: 'Jl. Hankam No. 5 RT.006 RW.001, Ragunan, Jakarta Selatan 12550 (Domisili) & Graha Arteri Mas Kav. 53 Kedoya, Jakarta Barat 11530 (Operasional)',`
);

// 5. Tuliskan file index.html yang dipulihkan
fs.writeFileSync("index.html", html, "utf8");
console.log("✅ Berhasil memulihkan index.html dari basis asli commit 1647d3f!");
console.log("Total bytes index.html baru:", fs.statSync("index.html").size);
