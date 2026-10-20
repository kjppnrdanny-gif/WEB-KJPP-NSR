/**
 * SCRIPT: build-staging-cpanel.mjs
 * Menyiapkan paket direktori terisolasi 'dist-staging/' untuk dideploy ke cPanel 'public_html/staging/'.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_STAGING_DIR = path.join(ROOT_DIR, 'dist-staging');

console.log('======================================================================');
console.log('📦 MEMBANGUN PAKET STAGING CPANEL (dist-staging/ -> public_html/staging/)');
console.log('======================================================================');

// 1. Bersihkan dan buat direktori dist-staging
if (fs.existsSync(DIST_STAGING_DIR)) {
  fs.rmSync(DIST_STAGING_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_STAGING_DIR, { recursive: true });
fs.mkdirSync(path.join(DIST_STAGING_DIR, 'data'), { recursive: true });

// 2. Daftar file root yang wajib ada di staging
const FILES_TO_COPY = [
  'portal-operasional.html',
  'portal-kwitansi.html',
  'verifikasi-dokumen.html',
  'index.html',
  'company-profile.html',
  'profil-legalitas.html',
  'layanan.html',
  'portofolio-rekanan.html',
  'tim-cabang.html',
  'wawasan-regulasi.html',
  'operasional-data-handler.php',
  'kwitansi-data-handler.php',
  'auth-handler.php',
  'nolap-data-handler.php',
  'surat-umum-data-handler.php',
  'absensi-data-handler.php',
  'merge-tags-engine.php',
  'pdp-consent-handler.php',
  'visitor-stats.php',
  'process-mail-queue.php',
  'logo-nsr.png',
  'favicon.ico',
  'favicon.png',
  'og-image.jpg',
  'og-image.png',
  'foto-nanang.jpg',
  'foto-deni.jpg',
  'foto-hernita.jpg',
  'foto-amin.jpg',
  'foto-dharma.jpg'
];

for (const file of FILES_TO_COPY) {
  const src = path.join(ROOT_DIR, file);
  const dest = path.join(DIST_STAGING_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  -> Salin ${file}`);
  } else {
    console.warn(`  ⚠️ File tidak ditemukan: ${file}`);
  }
}

// 3. Salin direktori rekursif (images, components, lib)
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

for (const dir of ['images', 'components', 'lib']) {
  const srcDir = path.join(ROOT_DIR, dir);
  const destDir = path.join(DIST_STAGING_DIR, dir);
  if (fs.existsSync(srcDir)) {
    copyDirRecursive(srcDir, destDir);
    console.log(`  -> Salin direktori ${dir}/`);
  }
}

// 4. Buat file .htaccess khusus Staging di root dist-staging
const stagingHtaccess = `# Staging Directory Configuration (public_html/staging/)
AddDefaultCharset UTF-8
AddCharset UTF-8 .html .php .css .js .json .xml

RewriteEngine On
RewriteBase /staging/

# Redirect HTTP to HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API Proxy Routing ke Handler PHP Lokal Staging
RewriteRule ^api/kwitansi-data-proxy/?$ kwitansi-data-handler.php [L,QSA]
RewriteRule ^api/operasional-data-proxy/?$ operasional-data-handler.php [L,QSA]
RewriteRule ^api/nolap-data-proxy/?$ nolap-data-handler.php [L,QSA]
RewriteRule ^api/surat-umum-data-proxy/?$ surat-umum-data-handler.php [L,QSA]
RewriteRule ^api/absensi-data-proxy/?$ absensi-data-handler.php [L,QSA]
RewriteRule ^api/auth-token/?$ auth-handler.php?action=token [L,QSA]
RewriteRule ^api/auth-login/?$ auth-handler.php?action=login [L,QSA]
RewriteRule ^api/auth-verify/?$ auth-handler.php?action=verify [L,QSA]
RewriteRule ^api/auth-logout/?$ auth-handler.php?action=logout [L,QSA]

# Proteksi File Database JSON & Lock Files dari Akses HTTP Langsung
<FilesMatch "\\.(json|lock|log|secret|bak)$">
    <IfModule mod_authz_core.c>
        Require all denied
    </IfModule>
    <IfModule !mod_authz_core.c>
        Order deny,allow
        Deny from all
    </IfModule>
</FilesMatch>

# Blokir Akses ke Folder data/
RewriteRule ^data(/.*)?$ - [F,L]
`;
fs.writeFileSync(path.join(DIST_STAGING_DIR, '.htaccess'), stagingHtaccess, 'utf8');
console.log('  -> Buat dist-staging/.htaccess');

// 5. Buat data/.htaccess untuk perlindungan ganda (Defense-in-Depth)
const dataHtaccess = `<IfModule mod_authz_core.c>
    Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
    Order deny,allow
    Deny from all
</IfModule>
`;
fs.writeFileSync(path.join(DIST_STAGING_DIR, 'data', '.htaccess'), dataHtaccess, 'utf8');
console.log('  -> Buat dist-staging/data/.htaccess');

// 6. Inisialisasi Secret Key HMAC Staging
const stagingSecret = 'kjpp_nsr_operasional_staging_secure_hmac_secret_2026_stg_preview_key_9921';
fs.writeFileSync(path.join(DIST_STAGING_DIR, 'data', '.operasional_secret'), stagingSecret, 'utf8');

// 7. Seed Database Demo Terisolasi e-Operasional
function computeHmac(docId, tier, versi, contentDigest, pejabat, timestamp) {
  const canonical = `${docId}#${tier}#${versi}#${contentDigest}#${pejabat}#${timestamp}`;
  return crypto.createHmac('sha256', stagingSecret).update(canonical).digest('hex');
}

const docId1 = 'OPR-SRV-2026-0001';
const noReg1 = 'OPR-SRV/2.19.0160-00/X/2026/0001';
const digest1 = crypto.createHash('sha256').update(docId1 + '-staging-survey-approved').digest('hex');
const ts1 = '2026-10-21 00:00:00';

function makeQrUrl(docNo, tier, hash) {
  return `https://kjppnanangrahayu.com/staging/verifikasi-dokumen.html?doc=${encodeURIComponent(docNo)}&tier=${tier}&hash=${encodeURIComponent(hash)}`;
}

const hmac1_1 = computeHmac(docId1, 1, 1, digest1, 'Holik Kelana', ts1);
const hmac1_2 = computeHmac(docId1, 2, 1, digest1, 'Deni Siswandi, S.T.', ts1);
const hmac1_3 = computeHmac(docId1, 3, 1, digest1, 'Danny Taufik Hidayat, S.H.', ts1);
const hmac1_4 = computeHmac(docId1, 4, 1, digest1, 'Milda H', ts1);
const hmac1_5 = computeHmac(docId1, 5, 1, digest1, 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)', ts1);

const operasionalSeed = [
  {
    id: docId1,
    noRegistrasi: noReg1,
    jenisPengajuan: 'SURVEY',
    kantorCabang: 'PUSAT',
    kodeKantor: '00',
    status: 'APPROVED',
    versi: 1,
    contentDigest: digest1,
    tglPengajuan: '2026-10-21',
    namaPengaju: 'Holik Kelana',
    rolePengaju: 'Surveyor Lapangan',
    keperluan: 'Inspeksi & Penilaian Aset Pabrik Logistik Karawang (SPK-0012/NSR/X/2026)',
    rincianSurvey: {
      idPenugasan: 'NSR-2026-SRV-014',
      lokasiSurvey: 'Kawasan Industri KIIC, Karawang Barat',
      tglMulai: '2026-10-22',
      tglSelesai: '2026-10-23',
      jumlahAnggotaTim: 3,
      biayaPersonal: [
        { nama: 'Holik Kelana', jabatan: 'Lead Surveyor', hari: 2, uangMakan: 150000, subtotal: 300000 },
        { nama: 'Bambang S', jabatan: 'Surveyor Sipil', hari: 2, uangMakan: 150000, subtotal: 300000 }
      ],
      biayaKolektif: [
        { item: 'BBM & Tol Kendaraan Operasional', nominal: 650000, keterangan: 'Jakarta - Karawang PP' },
        { item: 'Akomodasi Hotel 1 Malam (2 Kamar)', nominal: 800000, keterangan: 'Standar tim survey' }
      ],
      totalBiayaPersonal: 600000,
      totalBiayaKolektif: 1450000,
      grandTotal: 2050000
    },
    approvals: {
      1: { tier: 1, label: 'Yang Mengajukan', role: 'SURVEYOR', pejabat: 'Holik Kelana', jabatan: 'Surveyor Lapangan', approved: true, approvedAt: ts1, hmacHash: hmac1_1, qrUrl: makeQrUrl(noReg1, 1, hmac1_1) },
      2: { tier: 2, label: 'Mengetahui', role: 'REKAN', pejabat: 'Deni Siswandi, S.T.', jabatan: 'Rekan Penilai', approved: true, approvedAt: ts1, hmacHash: hmac1_2, qrUrl: makeQrUrl(noReg1, 2, hmac1_2) },
      3: { tier: 3, label: 'Verifikasi Administrasi', role: 'ADMIN_PUSAT', pejabat: 'Danny Taufik Hidayat, S.H.', jabatan: 'Verifikasi Administrasi & Legal', approved: true, approvedAt: ts1, hmacHash: hmac1_3, qrUrl: makeQrUrl(noReg1, 3, hmac1_3) },
      4: { tier: 4, label: 'Menyetujui', role: 'KEUANGAN', pejabat: 'Milda H', jabatan: 'Divisi Keuangan & Anggaran', approved: true, approvedAt: ts1, hmacHash: hmac1_4, qrUrl: makeQrUrl(noReg1, 4, hmac1_4) },
      5: { tier: 5, label: 'Penanggung Jawab', role: 'PEMIMPIN_REKAN', pejabat: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)', jabatan: 'Pemimpin Rekan', approved: true, approvedAt: ts1, hmacHash: hmac1_5, qrUrl: makeQrUrl(noReg1, 5, hmac1_5) }
    },
    auditTrail: [
      { action: 'SUBMIT', by: 'Holik Kelana', role: 'SURVEYOR', timestamp: '2026-10-21 08:00:00' },
      { action: 'APPROVE_TIER_2', by: 'Deni Siswandi, S.T.', role: 'REKAN', timestamp: '2026-10-21 08:30:00' },
      { action: 'APPROVE_TIER_3', by: 'Danny Taufik Hidayat, S.H.', role: 'ADMIN_PUSAT', timestamp: '2026-10-21 09:00:00' },
      { action: 'APPROVE_TIER_4', by: 'Milda H', role: 'KEUANGAN', timestamp: '2026-10-21 09:30:00' },
      { action: 'APPROVE_TIER_5', by: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)', role: 'PEMIMPIN_REKAN', timestamp: '2026-10-21 10:00:00' }
    ]
  },
  {
    id: 'OPR-MTG-2026-0002',
    noRegistrasi: 'OPR-MTG/2.19.0160-03/X/2026/0002',
    jenisPengajuan: 'MEETING',
    kantorCabang: 'Palembang',
    kodeKantor: '03',
    status: 'IN_REVIEW',
    versi: 1,
    contentDigest: crypto.createHash('sha256').update('OPR-MTG-2026-0002-stg-digest').digest('hex'),
    tglPengajuan: '2026-10-21',
    namaPengaju: 'Dharma Priyanto, S.T.',
    rolePengaju: 'Admin Cabang Palembang',
    keperluan: 'Rapat Koordinasi Evaluasi Proyek Valuasi Agunan Bank Mandiri Wilayah II',
    rincianMeeting: {
      divisi: 'Manajemen',
      agenda: 'Sinkronisasi standar metodologi penilaian agunan Q4 2026',
      waktu: '2026-10-24 10:00 WIB',
      lokasi: 'Ruang Rapat Utama KJPP NSR Cabang Palembang',
      estimasiPeserta: 8,
      items: [
        { item: 'Konsumsi Rapat Siang (8 Pax)', biaya: 400000 },
        { item: 'Coffee Break & Snack', biaya: 200000 },
        { item: 'Materi Cetak & ATK Rapat', biaya: 150000 }
      ],
      totalEstimasi: 750000
    },
    approvals: {
      1: { tier: 1, label: 'Yang Mengajukan', role: 'ADMIN_CABANG', pejabat: 'Dharma Priyanto, S.T.', jabatan: 'Admin Cabang Palembang', approved: true, approvedAt: '2026-10-21 10:15:00', hmacHash: 'stg_hash_t1', qrUrl: makeQrUrl('OPR-MTG/2.19.0160-03/X/2026/0002', 1, 'stg_hash_t1') },
      2: { tier: 2, label: 'Mengetahui', role: 'REKAN', pejabat: 'Deni Siswandi, S.T.', jabatan: 'Rekan Penilai', approved: true, approvedAt: '2026-10-21 10:30:00', hmacHash: 'stg_hash_t2', qrUrl: makeQrUrl('OPR-MTG/2.19.0160-03/X/2026/0002', 2, 'stg_hash_t2') },
      3: { tier: 3, label: 'Verifikasi Administrasi', role: 'ADMIN_PUSAT', pejabat: 'Danny Taufik Hidayat, S.H.', jabatan: 'Verifikasi Administrasi & Legal', approved: false, approvedAt: null, hmacHash: null, qrUrl: null },
      4: { tier: 4, label: 'Menyetujui', role: 'KEUANGAN', pejabat: 'Milda H', jabatan: 'Divisi Keuangan & Anggaran', approved: false, approvedAt: null, hmacHash: null, qrUrl: null },
      5: { tier: 5, label: 'Penanggung Jawab', role: 'PEMIMPIN_REKAN', pejabat: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)', jabatan: 'Pemimpin Rekan', approved: false, approvedAt: null, hmacHash: null, qrUrl: null }
    },
    auditTrail: [
      { action: 'SUBMIT', by: 'Dharma Priyanto, S.T.', role: 'ADMIN_CABANG', timestamp: '2026-10-21 10:15:00' },
      { action: 'APPROVE_TIER_2', by: 'Deni Siswandi, S.T.', role: 'REKAN', timestamp: '2026-10-21 10:30:00' }
    ]
  },
  {
    id: 'OPR-GEN-2026-0003',
    noRegistrasi: 'OPR-GEN/2.19.0160-00/X/2026/0003',
    jenisPengajuan: 'UMUM',
    kantorCabang: 'PUSAT',
    kodeKantor: '00',
    status: 'DRAFT',
    versi: 1,
    contentDigest: crypto.createHash('sha256').update('OPR-GEN-2026-0003-stg-draft').digest('hex'),
    tglPengajuan: '2026-10-21',
    namaPengaju: 'Milda H',
    rolePengaju: 'Divisi Keuangan Pusat',
    keperluan: 'Pengadaan Perlengkapan Server & Toner Printer Laporan KJPP NSR',
    rincianUmum: {
      kategori: 'Perlengkapan Kantor & IT',
      maksudTujuan: 'Peremajaan toner printer untuk cetak Buku Laporan Penilaian Resmi',
      items: [
        { deskripsi: 'Toner Cartridge HP LaserJet Original Black', qty: 3, satuan: 'Pcs', hargaSatuan: 1250000, subtotal: 3750000 },
        { deskripsi: 'Kertas HVS PaperOne A4 80gr (Box isi 5 Rim)', qty: 5, satuan: 'Box', hargaSatuan: 285000, subtotal: 1425000 }
      ],
      totalBiaya: 5175000
    },
    approvals: {
      1: { tier: 1, label: 'Yang Mengajukan', role: 'KEUANGAN', pejabat: 'Milda H', jabatan: 'Divisi Keuangan', approved: false, approvedAt: null, hmacHash: null, qrUrl: null },
      2: { tier: 2, label: 'Mengetahui', role: 'REKAN', pejabat: 'Deni Siswandi, S.T.', jabatan: 'Rekan Penilai', approved: false, approvedAt: null, hmacHash: null, qrUrl: null },
      3: { tier: 3, label: 'Verifikasi Administrasi', role: 'ADMIN_PUSAT', pejabat: 'Danny Taufik Hidayat, S.H.', jabatan: 'Verifikasi Administrasi & Legal', approved: false, approvedAt: null, hmacHash: null, qrUrl: null },
      4: { tier: 4, label: 'Menyetujui', role: 'KEUANGAN', pejabat: 'Milda H', jabatan: 'Divisi Keuangan & Anggaran', approved: false, approvedAt: null, hmacHash: null, qrUrl: null },
      5: { tier: 5, label: 'Penanggung Jawab', role: 'PEMIMPIN_REKAN', pejabat: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)', jabatan: 'Pemimpin Rekan', approved: false, approvedAt: null, hmacHash: null, qrUrl: null }
    },
    auditTrail: [
      { action: 'CREATE_DRAFT', by: 'Milda H', role: 'KEUANGAN', timestamp: '2026-10-21 11:00:00' }
    ]
  }
];

fs.writeFileSync(
  path.join(DIST_STAGING_DIR, 'data', 'operasional_database.json'),
  JSON.stringify(operasionalSeed, null, 2),
  'utf8'
);
console.log('  -> Seed data/operasional_database.json (3 data demo terisolasi)');

// 8. Seed Database Demo Terisolasi Kwitansi
const kwitansiSeed = [
  {
    idKwitansi: "KW-PLB-2026-0001",
    idDraft: "DRAFT-KW-PLB-01",
    timestamp: "2026-10-21 11:30:00",
    mode: "CABANG",
    cabang: "Palembang",
    kodeCabang: "PLB",
    namaPengaju: "Dharma Priyanto, S.T.",
    waPengaju: "081271000001",
    klien: "PT Bank Tabungan Negara (Persero) Tbk - KC Palembang",
    keterangan: "Biaya Kasbon Operasional Mandiri Cabang - Penilaian Agunan Debitur Sukarami SPK No. 044/PLB/X/2026",
    banyaknya: "100% Pembayaran Kasbon Mandiri",
    hargaDasar: 7500000,
    tarifPpn: 0.11,
    nominalPpn: 825000,
    totalBayar: 8325000,
    terbilang: "Delapan Juta Tiga Ratus Dua Puluh Lima Ribu Rupiah",
    status: "DISAHKAN",
    isApproved: true,
    noKwitansiResmi: "021/KW-PLB/X/2026",
    tglSah: "2026-10-21",
    tempatTerbit: "Palembang",
    namaPejabat: "Dharma Priyanto, S.T., MAPPI (Cert.)",
    jabatanPejabat: "Kepala Cabang Palembang",
    subjabatanPejabat: "Finance Cabang",
    catatanKeuangan: "Otorisasi Kasbon Mandiri Cabang Palembang (PIN Verified: 9926)"
  },
  {
    idKwitansi: "KW-MKS-2026-0002",
    idDraft: "DRAFT-KW-MKS-02",
    timestamp: "2026-10-21 12:00:00",
    mode: "PUSAT",
    cabang: "Makassar",
    kodeCabang: "MKS",
    namaPengaju: "M. Amin Sade, S.E.",
    waPengaju: "081144000002",
    klien: "PT Pelabuhan Indonesia (Persero) Regional 4",
    keterangan: "Permohonan Kuitansi Resmi Penugasan Rekan - Valuasi Aset Dermaga Hatta SPK No. 102/PELINDO/2026",
    banyaknya: "Termin 1 (50% Down Payment)",
    hargaDasar: 45000000,
    tarifPpn: 0.11,
    nominalPpn: 4950000,
    totalBayar: 49950000,
    terbilang: "Empat Puluh Sembilan Juta Sembilan Ratus Lima Puluh Ribu Rupiah",
    status: "MENUNGGU_VERIFIKASI_PUSAT",
    isApproved: false,
    noKwitansiResmi: "",
    tglSah: "",
    tempatTerbit: "Jakarta",
    namaPejabat: "Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)",
    jabatanPejabat: "Pemimpin Rekan",
    subjabatanPejabat: "Pemimpin Rekan",
    catatanKeuangan: "Permohonan terkirim ke Keuangan Pusat. Menanti verifikasi & penetapan nomor resmi."
  },
  {
    idKwitansi: "KW-BDG-2026-0003",
    idDraft: "DRAFT-KW-BDG-03",
    timestamp: "2026-10-21 12:30:00",
    mode: "PUSAT",
    cabang: "Bandung",
    kodeCabang: "BDG",
    namaPengaju: "Deni Siswandi, S.T.",
    waPengaju: "081220000003",
    klien: "PT Kereta Cepat Indonesia China (KCIC)",
    keterangan: "Permohonan Kuitansi Resmi Penugasan Rekan - Valuasi Stasiun Tegalluar Tahap II",
    banyaknya: "100% Pelunasan Pekerjaan",
    hargaDasar: 60000000,
    tarifPpn: 0.11,
    nominalPpn: 6600000,
    totalBayar: 66600000,
    terbilang: "Enam Puluh Enam Juta Enam Ratus Ribu Rupiah",
    status: "DISAHKAN",
    isApproved: true,
    noKwitansiResmi: "055/KW-NSR-PST/X/2026",
    tglSah: "2026-10-21",
    tempatTerbit: "Jakarta",
    namaPejabat: "Deni Siswandi, S.T., MAPPI (Cert.)",
    jabatanPejabat: "Rekan Penilai",
    subjabatanPejabat: "Rekan Penilai",
    catatanKeuangan: "Disetujui dan disahkan oleh Keuangan & Rekan Pengesah Pusat."
  }
];

fs.writeFileSync(
  path.join(DIST_STAGING_DIR, 'data', 'kwitansi_database.json'),
  JSON.stringify(kwitansiSeed, null, 2),
  'utf8'
);
console.log('  -> Seed data/kwitansi_database.json (3 data demo terisolasi)');

// 9. Seed Nolap Penugasan Dummy untuk Lookup
const nolapSeed = [
  { noLap: 'NSR-2026-SRV-014', klien: 'PT Kawasan Industri KIIC Karawang', perihal: 'Penilaian Pabrik & Gudang Karawang', nilaiAset: 'Rp 45.000.000.000' },
  { noLap: 'NSR-2026-SRV-015', klien: 'PT Bank Mandiri (Persero) Tbk', perihal: 'Penilaian Properti Komersial Sudirman', nilaiAset: 'Rp 82.500.000.000' },
  { noLap: 'NSR-2026-SRV-016', klien: 'PT Pelindo Regional 4', perihal: 'Penilaian Aset Pelabuhan Paotere', nilaiAset: 'Rp 120.000.000.000' }
];
fs.writeFileSync(
  path.join(DIST_STAGING_DIR, 'data', 'nolap_database.json'),
  JSON.stringify(nolapSeed, null, 2),
  'utf8'
);
console.log('  -> Seed data/nolap_database.json (data penugasan demo)');

console.log('\n======================================================================');
console.log('🎉 PAKET DIST-STAGING SELESAI DIBANGUN DAN SIAP UNTUK DISINKRONISASI!');
console.log('======================================================================\n');
