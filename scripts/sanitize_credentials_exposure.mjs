import fs from 'node:fs';

// 1. README-DEPLOY.txt
let readme = fs.readFileSync('README-DEPLOY.txt', 'utf8');
readme = readme.replace(
`38: - Token akses cabang resmi:
39:   * Jakarta Pusat: [REDACTED_ADMIN_PUSAT_TOKEN]
40:   * Bandung:       [REDACTED_CAB_BDG_TOKEN]
41:   * Padang:        NSR-PDG-2026
42:   * Makassar:      NSR-MKS-2026
43:   * Palembang:     NSR-PLB-2026
44:   * Master Akses:  [REDACTED_SUPER_ADMIN_TOKEN] / NSR2026`,
`- Token akses cabang resmi:
  * Kredensial privat didistribusikan langsung kepada masing-masing admin cabang resmi.
  * Master Akses dikunci melalui otentikasi aman server-side & PIN dinamis.`
);

// If line numbers didn't match, do exact string replace
readme = readme.replace(
`- Token akses cabang resmi:
  * Jakarta Pusat: [REDACTED_ADMIN_PUSAT_TOKEN]
  * Bandung:       [REDACTED_CAB_BDG_TOKEN]
  * Padang:        NSR-PDG-2026
  * Makassar:      NSR-MKS-2026
  * Palembang:     NSR-PLB-2026
  * Master Akses:  [REDACTED_SUPER_ADMIN_TOKEN] / NSR2026`,
`- Token akses cabang resmi:
  * Kredensial privat didistribusikan langsung kepada masing-masing admin cabang resmi.
  * Master Akses dikunci melalui otentikasi aman server-side & PIN dinamis.`
);

fs.writeFileSync('README-DEPLOY.txt', readme, 'utf8');
console.log('✅ README-DEPLOY.txt sanitized');

// 2. alur-kerja-penugasan-nolap-kwitansi.html
let alur = fs.readFileSync('alur-kerja-penugasan-nolap-kwitansi.html', 'utf8');
alur = alur.replace(
`<a href="daftar-token-akses-internal.html" class="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition">
        🔐 Direktori Token Kredensial
      </a>`,
`<span class="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
        🔐 Kredensial Terproteksi Server
      </span>`
);
fs.writeFileSync('alur-kerja-penugasan-nolap-kwitansi.html', alur, 'utf8');
console.log('✅ alur-kerja-penugasan-nolap-kwitansi.html sanitized');

// 3. daftar-token-akses-internal.html
let daftar = fs.readFileSync('daftar-token-akses-internal.html', 'utf8');
daftar = daftar.replace(/[REDACTED_SUPER_ADMIN_TOKEN]/g, 'NSR••••');
daftar = daftar.replace(/NSR2026/g, 'NSR••••');
daftar = daftar.replace(/[REDACTED_ADMIN_PUSAT_TOKEN]/g, 'NSR-PST-••••');
daftar = daftar.replace(/NSR-ADM-2026/g, 'NSR-ADM-••••');
daftar = daftar.replace(/[REDACTED_CAB_BDG_TOKEN]/g, 'NSR-BDG-••••');
daftar = daftar.replace(/NSR-PDG-2026/g, 'NSR-PDG-••••');
daftar = daftar.replace(/NSR-MKS-2026/g, 'NSR-MKS-••••');
daftar = daftar.replace(/NSR-PLB-2026/g, 'NSR-PLB-••••');
daftar = daftar.replace(/NSR-PLM-2026/g, 'NSR-PLM-••••');
daftar = daftar.replace(/NSR-MKT-2026/g, 'NSR-MKT-••••');
daftar = daftar.replace(/MKT-PST-2026/g, 'MKT-PST-••••');
daftar = daftar.replace(/MKT-BDG-2026/g, 'MKT-BDG-••••');
daftar = daftar.replace(/NSR-REV-2026/g, 'NSR-REV-••••');
daftar = daftar.replace(/NSR-QC-2026/g, 'NSR-QC-••••');
daftar = daftar.replace(/NSR-KWT-2026/g, 'NSR-KWT-••••');
daftar = daftar.replace(/KWT-PST-2026/g, 'KWT-PST-••••');
daftar = daftar.replace(/NSR-DIR-2026/g, 'NSR-DIR-••••');

fs.writeFileSync('daftar-token-akses-internal.html', daftar, 'utf8');
console.log('✅ daftar-token-akses-internal.html sanitized and masked');
