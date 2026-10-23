import fs from 'fs';

const allowedFiles = [
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
  "status-terintegrasi-handler.php"
];

const results = [];
for (const file of allowedFiles) {
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      if (/(?:NSR-STAGE|NSR[0-9]{4}|NSR-[A-Z]{3,}-[0-9]|STAGE-)/i.test(line)) {
        // filter out privacy notices or false positives if any
        if (line.includes('PDP-NSR-EMP-2026.10')) return;
        results.push({ file, line: idx + 1, text: line.trim() });
      }
    });
  }
}
console.log(`Found ${results.length} token leaks in production allowed files:`);
for (const r of results) {
  console.log(`${r.file}:${r.line} -> ${r.text.slice(0, 100)}`);
}
