/**
 * SCRIPT: seed-preview-database.mjs
 * Mempersiapkan database pengujian & akun demo untuk lingkungan Staging Preview.
 * Menjamin database terisolasi dan tidak mengekspos data rahasia produksi.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 1. Pastikan .operasional_secret tersedia
const secretFile = path.join(DATA_DIR, '.operasional_secret');
let secretKey = '';
if (fs.existsSync(secretFile)) {
  secretKey = fs.readFileSync(secretFile, 'utf8').trim();
}
if (!secretKey || secretKey.length < 32) {
  secretKey = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(secretFile, secretKey, 'utf8');
}

function generateDigest(doc) {
  const coreStr = (doc.id || '') + '|' +
    (doc.noRegistrasi || '') + '|' +
    (doc.jenisOperasional || '') + '|' +
    (doc.kodeKantor || '') + '|' +
    Number(doc.totalEstimasi || 0).toFixed(2) + '|' +
    (doc.pemohon?.nama || '').trim() + '|' +
    (doc.tujuanKebutuhan || doc.meeting?.agenda || doc.survey?.lokasiObjek || doc.umum?.maksudTujuan || '').trim();
  return crypto.createHash('sha256').update(coreStr).digest('hex');
}

function generateHmac(docId, tier, versi, digest, nama, jabatan, approvedAt, secret) {
  const pejabatStr = nama.trim() + '|' + jabatan.trim();
  const canonical = `${docId}#${tier}#${versi}#${digest}#${pejabatStr}#${approvedAt.trim()}`;
  return crypto.createHmac('sha256', secret).update(canonical).digest('hex');
}

// 2. Data Demo Operasional
const docApproved = {
  id: 'OPR-20261021-SRV-DEMO1',
  noRegistrasi: 'OPR-SRV/2.19.0160-00/X/2026/0001',
  jenisOperasional: 'OPR-SRV',
  jenisLabel: 'Allowance Survey Lapangan',
  kantor: 'Kantor Pusat Jakarta',
  kodeKantor: '2.19.0160-00',
  status: 'APPROVED',
  versi: 1,
  tglPengajuan: '2026-10-21',
  totalEstimasi: 5200000,
  catatanPemohon: 'Survey penilaian pabrik kelapa sawit & aset tetap PT Sawit Makmur Abadi.',
  pemohon: { nama: 'Holik Kelana', jabatan: 'Surveyor Lapangan', cabang: 'Kantor Pusat Jakarta' },
  survey: {
    idPenugasan: '0416/NSR/PN-APP/X/2026',
    nomorLaporan: '0012/LAP-NSR/X/2026',
    namaKlien: 'PT Sawit Makmur Abadi Tbk',
    lokasiObjek: 'Jl. Raya Lintas Riau-Sumut Km. 88, Riau',
    tglMulaiSurvey: '2026-10-22',
    tglSelesaiSurvey: '2026-10-24',
    daftarSurveyor: ['Holik Kelana', 'Budi Santoso', 'Rian Hidayat'],
    biayaPersonal: [
      { uraian: 'Holik Kelana (Lead Surveyor)', volume: 3, satuan: 'Hari', tarif: 350000, total: 1050000 },
      { uraian: 'Budi Santoso (Assoc. Surveyor)', volume: 3, satuan: 'Hari', tarif: 250000, total: 750000 },
      { uraian: 'Rian Hidayat (Teknisi GIS)', volume: 3, satuan: 'Hari', tarif: 250000, total: 750000 }
    ],
    biayaKolektif: [
      { uraian: 'Sewa Mobil Operasional 4WD Double Cabin', volume: 3, satuan: 'Hari', tarif: 650000, total: 1950000 },
      { uraian: 'BBM, Tol & Tiket Penyeberangan Survey', volume: 1, satuan: 'Paket', tarif: 700000, total: 700000 }
    ]
  },
  approvals: {
    1: { tier: 1, label: 'Yang Mengajukan', pejabat: 'Holik Kelana', jabatan: 'Yang Mengajukan', approved: true, approvedAt: '2026-10-21 08:30:00' },
    2: { tier: 2, label: 'Mengetahui', pejabat: 'Deni Siswandi, S.T.', jabatan: 'Mengetahui', approved: true, approvedAt: '2026-10-21 09:15:00' },
    3: { tier: 3, label: 'Verifikasi Administrasi', pejabat: 'Danny Taufik Hidayat, S.H.', jabatan: 'Verifikasi Administrasi', approved: true, approvedAt: '2026-10-21 10:00:00' },
    4: { tier: 4, label: 'Menyetujui', pejabat: 'Milda H', jabatan: 'Menyetujui', approved: true, approvedAt: '2026-10-21 11:15:00' },
    5: { tier: 5, label: 'Penanggung Jawab', pejabat: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)', jabatan: 'Penanggung Jawab', approved: true, approvedAt: '2026-10-21 13:00:00' }
  },
  auditTrail: [
    { action: 'SUBMIT_PENGAJUAN', timestamp: '2026-10-21 08:30:00', user: 'Holik Kelana', role: 'PEMOHON', keterangan: 'Pengajuan resmi disubmit dan Tier 1 disahkan.' },
    { action: 'APPROVE_TIER_2', timestamp: '2026-10-21 09:15:00', user: 'Deni Siswandi, S.T.', role: 'REVIEWER_TEKNIS', keterangan: 'Tier 2 (Mengetahui) disetujui.' },
    { action: 'APPROVE_TIER_3', timestamp: '2026-10-21 10:00:00', user: 'Danny Taufik Hidayat, S.H.', role: 'ADMIN_PUSAT', keterangan: 'Tier 3 (Verifikasi Administrasi) disetujui.' },
    { action: 'APPROVE_TIER_4', timestamp: '2026-10-21 11:15:00', user: 'Milda H', role: 'KEUANGAN', keterangan: 'Tier 4 (Menyetujui Keuangan) disetujui.' },
    { action: 'APPROVE_TIER_5', timestamp: '2026-10-21 13:00:00', user: 'Ir. Nanang Rahayu', role: 'PEMIMPIN_REKAN', keterangan: 'Tier 5 (Penanggung Jawab) disahkan. Status final APPROVED.' }
  ]
};

// Hitung HMAC kriptografis untuk setiap tier dokumen 1
const digest1 = generateDigest(docApproved);
for (let t = 1; t <= 5; t++) {
  const app = docApproved.approvals[t];
  const hmac = generateHmac(docApproved.id, t, 1, digest1, app.pejabat, app.jabatan, app.approvedAt, secretKey);
  app.hmacHash = hmac;
  app.qrUrl = `https://kjppnanangrahayu.com/verifikasi-dokumen.html?doc=${encodeURIComponent(docApproved.noRegistrasi)}&tier=${t}&hash=${hmac}`;
}

const docInReview = {
  id: 'OPR-20261021-MTG-DEMO2',
  noRegistrasi: 'OPR-MTG/2.19.0160-03/X/2026/0001',
  jenisOperasional: 'OPR-MTG',
  jenisLabel: 'Allowance Meeting',
  kantor: 'Kantor Cabang Palembang',
  kodeKantor: '2.19.0160-03',
  status: 'IN_REVIEW',
  versi: 1,
  tglPengajuan: '2026-10-21',
  totalEstimasi: 1850000,
  catatanPemohon: 'Rapat koordinasi teknis percepatan penilaian aset perbankan kuartal IV.',
  pemohon: { nama: 'Staf Cabang Palembang', jabatan: 'Admin Cabang', cabang: 'Kantor Cabang Palembang' },
  meeting: {
    divisi: 'Teknik',
    agenda: 'Rapat Koordinasi Penilaian Aset Agunan Bank BUMN',
    waktu: '2026-10-22 14:00 WIB',
    lokasi: 'Meeting Room Lt. 2 Cabang Palembang',
    estimasiPeserta: 6,
    rincianBiaya: [
      { uraian: 'Konsumsi Rapat & Coffee Break (6 Orang)', volume: 6, satuan: 'Orang', tarif: 75000, total: 450000 },
      { uraian: 'Penggandaan Materi & Dokumen Kerja', volume: 1, satuan: 'Paket', tarif: 400000, total: 400000 },
      { uraian: 'Transportasi Lokal Tim Penilai', volume: 1, satuan: 'Paket', tarif: 1000000, total: 1000000 }
    ]
  },
  approvals: {
    1: { tier: 1, label: 'Yang Mengajukan', pejabat: 'Staf Cabang Palembang', jabatan: 'Yang Mengajukan', approved: true, approvedAt: '2026-10-21 09:00:00' },
    2: { tier: 2, label: 'Mengetahui', pejabat: 'Deni Siswandi, S.T.', jabatan: 'Mengetahui', approved: true, approvedAt: '2026-10-21 09:45:00' },
    3: { tier: 3, label: 'Verifikasi Administrasi', pejabat: 'Danny Taufik Hidayat, S.H.', jabatan: 'Verifikasi Administrasi', approved: false },
    4: { tier: 4, label: 'Menyetujui', pejabat: 'Milda H', jabatan: 'Menyetujui', approved: false },
    5: { tier: 5, label: 'Penanggung Jawab', pejabat: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)', jabatan: 'Penanggung Jawab', approved: false }
  },
  auditTrail: [
    { action: 'SUBMIT_PENGAJUAN', timestamp: '2026-10-21 09:00:00', user: 'Staf Cabang Palembang', role: 'PEMOHON', keterangan: 'Pengajuan disubmit.' },
    { action: 'APPROVE_TIER_2', timestamp: '2026-10-21 09:45:00', user: 'Deni Siswandi, S.T.', role: 'REVIEWER_TEKNIS', keterangan: 'Tier 2 disetujui. Menunggu verifikasi administrasi Tier 3.' }
  ]
};

const digest2 = generateDigest(docInReview);
const hmacT1_2 = generateHmac(docInReview.id, 1, 1, digest2, docInReview.approvals[1].pejabat, docInReview.approvals[1].jabatan, docInReview.approvals[1].approvedAt, secretKey);
docInReview.approvals[1].hmacHash = hmacT1_2;
docInReview.approvals[1].qrUrl = `https://kjppnanangrahayu.com/verifikasi-dokumen.html?doc=${encodeURIComponent(docInReview.noRegistrasi)}&tier=1&hash=${hmacT1_2}`;

const hmacT2_2 = generateHmac(docInReview.id, 2, 1, digest2, docInReview.approvals[2].pejabat, docInReview.approvals[2].jabatan, docInReview.approvals[2].approvedAt, secretKey);
docInReview.approvals[2].hmacHash = hmacT2_2;
docInReview.approvals[2].qrUrl = `https://kjppnanangrahayu.com/verifikasi-dokumen.html?doc=${encodeURIComponent(docInReview.noRegistrasi)}&tier=2&hash=${hmacT2_2}`;

const docDraft = {
  id: 'OPR-20261021-UMM-DEMO3',
  noRegistrasi: 'DRAFT-OPR-UMM-20261021-003',
  jenisOperasional: 'OPR-UMM',
  jenisLabel: 'Operasional Umum & Pengadaan',
  kantor: 'Kantor Cabang Makassar',
  kodeKantor: '2.19.0160-02',
  status: 'DRAFT',
  versi: 1,
  tglPengajuan: '2026-10-21',
  totalEstimasi: 3450000,
  catatanPemohon: 'Draf pengadaan ATK, tinta plotter dan logistik survey cabang.',
  pemohon: { nama: 'Staf Umum Makassar', jabatan: 'Staf Umum', cabang: 'Kantor Cabang Makassar' },
  umum: {
    kategori: 'ATK & Logistik Kantor',
    maksudTujuan: 'Pemenuhan kebutuhan percetakan peta dan laporan penilaian cabang',
    rincianItem: [
      { deskripsi: 'Kertas HVS A4 80gr PaperOne', qty: 10, satuan: 'Rim', hargaSatuan: 55000, subtotal: 550000 },
      { deskripsi: 'Cartridge Tinta Plotter HP DesignJet', qty: 2, satuan: 'Unit', hargaSatuan: 1200000, subtotal: 2400000 },
      { deskripsi: 'Baterai Laser Meter & Meteran Baja 50m', qty: 2, satuan: 'Paket', hargaSatuan: 250000, subtotal: 500000 }
    ]
  },
  approvals: {
    1: { tier: 1, label: 'Yang Mengajukan', pejabat: 'Holik Kelana', jabatan: 'Yang Mengajukan', approved: false },
    2: { tier: 2, label: 'Mengetahui', pejabat: 'Deni Siswandi, S.T.', jabatan: 'Mengetahui', approved: false },
    3: { tier: 3, label: 'Verifikasi Administrasi', pejabat: 'Danny Taufik Hidayat, S.H.', jabatan: 'Verifikasi Administrasi', approved: false },
    4: { tier: 4, label: 'Menyetujui', pejabat: 'Milda H', jabatan: 'Menyetujui', approved: false },
    5: { tier: 5, label: 'Penanggung Jawab', pejabat: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)', jabatan: 'Penanggung Jawab', approved: false }
  },
  auditTrail: [
    { action: 'CREATE_DRAFT', timestamp: '2026-10-21 09:30:00', user: 'Staf Umum Makassar', role: 'PEMOHON', keterangan: 'Draf pengajuan disimpan.' }
  ]
};

const operasionalDb = [docApproved, docInReview, docDraft];
fs.writeFileSync(path.join(DATA_DIR, 'operasional_database.json'), JSON.stringify(operasionalDb, null, 2), 'utf8');
console.log('✓ Database operasional demo terinisialisasi: 3 dokumen (Approved, In-Review, Draft)');

// 3. Data Demo Kwitansi
const kwitansiDb = [
  {
    idKwitansi: 'KW-20261021-001',
    noKwitansiResmi: '001/KW-PLB/X/2026',
    modePenerbitan: 'cabang',
    kantorCabang: 'Cabang Palembang',
    sudahDiterimaDari: 'PT Sriwijaya Multi Logistik',
    sejumlahUang: 2500000,
    terbilang: 'Dua Juta Lima Ratus Ribu Rupiah',
    untukPembayaran: 'Titipan Kasbon Operasional Survey Kelayakan Gudang Palembang',
    status: 'DISAHKAN',
    isApproved: true,
    tglKwitansi: '2026-10-21',
    createdAt: '2026-10-21 08:45:00',
    disahkanOleh: 'Finance Cabang Palembang'
  },
  {
    idKwitansi: 'KW-20261021-002',
    noKwitansiResmi: 'MENUNGGU VERIFIKASI PUSAT',
    noPermohonan: 'REQ-KW/MKS/2026/001',
    modePenerbitan: 'pusat',
    idPejabat: 'Ir. Nanang Rahayu, M.Ec.Dev.',
    kantorCabang: 'Cabang Makassar',
    sudahDiterimaDari: 'PT Pelindo Jasa Maritim',
    sejumlahUang: 18500000,
    terbilang: 'Delapan Belas Juta Lima Ratus Ribu Rupiah',
    untukPembayaran: 'Pembayaran Termin I Jasa Penilaian Aset Pelabuhan Makassar',
    status: 'MENUNGGU_VERIFIKASI_PUSAT',
    isApproved: false,
    tglKwitansi: '2026-10-21',
    createdAt: '2026-10-21 09:30:00'
  },
  {
    idKwitansi: 'KW-20261021-003',
    noKwitansiResmi: '019/KW-NSR/X/2026',
    modePenerbitan: 'pusat',
    idPejabat: 'Deni Siswandi, S.T.',
    kantorCabang: 'Cabang Bandung',
    sudahDiterimaDari: 'PT Telekomunikasi Indonesia Tbk',
    sejumlahUang: 35000000,
    terbilang: 'Tiga Puluh Lima Juta Rupiah',
    untukPembayaran: 'Pelunasan Biaya Jasa Penilaian Gedung Kantor Regional Jawa Barat',
    status: 'DISAHKAN',
    isApproved: true,
    tglKwitansi: '2026-10-20',
    createdAt: '2026-10-20 15:00:00',
    disahkanOleh: 'Admin Pusat Jakarta (NSR-PST-2026)'
  }
];

fs.writeFileSync(path.join(DATA_DIR, 'kwitansi_database.json'), JSON.stringify(kwitansiDb, null, 2), 'utf8');
console.log('✓ Database kwitansi demo terinisialisasi: 3 kuitansi (Mode Cabang Disahkan, Mode Pusat Antrean, Mode Pusat Disahkan)');
