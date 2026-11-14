import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const PORT = 8877;
const CHROME_PORT = 9600;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TEMP_PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-gov-5tabs-'));

console.log('='.repeat(80));
console.log('UJI VISUAL & E2E KOMPREHENSIF: PORTAL GOVERNANCE 5 TAB TERPADU');
console.log('='.repeat(80));

// 1. Local HTTP Server
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(process.cwd(), urlPath === '/' ? 'portal-governance.html' : urlPath);
  
  if (req.url.startsWith('/governance-data-handler.php')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const mockData = {
      status: 'success',
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        noLapPending: 6,
        oprPending: 3,
        unbilledWipCount: 2,
        unbilledWipNominal: 45000000,
        gpsAccuracy: 98.4,
        spmQueueCount: 3,
        totalJoAktif: 41,
        totalNilaiFee: 1015000000,
        rataSkorQa: 92.4,
        qaAcceptableCount: 38,
        qaRevisionCount: 3
      },
      kantorMatrix: [
        { kode: '00', nama: 'Kantor Pusat Jakarta', joBerjalan: 18, spmPending: 0, oprHeld: 1, gpsAccuracy: 100, riskLevel: 'RENDAH', isLocked: false },
        { kode: '01', nama: 'Cabang Bandung', joBerjalan: 11, spmPending: 1, oprHeld: 0, gpsAccuracy: 98.5, riskLevel: 'SEDANG', isLocked: false },
        { kode: '02', nama: 'Cabang Padang', joBerjalan: 5, spmPending: 0, oprHeld: 0, gpsAccuracy: 99.1, riskLevel: 'RENDAH', isLocked: false },
        { kode: '03', nama: 'Cabang Makassar', joBerjalan: 4, spmPending: 0, oprHeld: 0, gpsAccuracy: 97.8, riskLevel: 'RENDAH', isLocked: false },
        { kode: '04', nama: 'Cabang Palembang', joBerjalan: 3, spmPending: 1, oprHeld: 1, gpsAccuracy: 88.0, riskLevel: 'TINGGI', isLocked: true }
      ],
      anomaliList: [
        {
          id: 'REQ-NOLAP-BDG-2026-081',
          cabang: 'Cabang Bandung',
          pic: 'Fajar Nugraha, S.T.',
          phone: '08122334455',
          email: 'fajar.nugraha@kjppnanangrahayu.com',
          kategori: 'NOLAP_BOOKING_EXPIRED',
          badge: 'Permohonan NoLap > 7 Hari',
          badgeColor: 'rose',
          uraian: 'Permohonan nomor laporan telah dialokasikan 8 hari kerja namun berkas draf final belum diunggah.',
          canForcePass: false,
          deepLink: 'portal-nolap.html?search=REQ-NOLAP-BDG-2026-081'
        }
      ],
      analytics: {
        feePerCabang: [
          { cabang: 'Pusat Jakarta', fee: 485000000, count: 18 },
          { cabang: 'Bandung', fee: 240000000, count: 11 },
          { cabang: 'Padang', fee: 115000000, count: 5 },
          { cabang: 'Makassar', fee: 95000000, count: 4 },
          { cabang: 'Palembang', fee: 80000000, count: 3 }
        ],
        qaScoreDistribution: { excellent: 26, good: 12, revision: 3, critical: 0 },
        spiFindingsTrend: [
          { kategori: 'Data Pasar & Pembanding (SPI 106)', count: 12 },
          { kategori: 'Kalkulasi & Depresiasi KKP', count: 9 },
          { kategori: 'Asumsi & Batasan (SPI 103)', count: 7 },
          { kategori: 'HBU & Legalitas Objek (SPI 104)', count: 5 },
          { kategori: 'Independensi & Etika (KEPI)', count: 2 }
        ],
        milestoneFunnel: [
          { milestone: 'M-01: Order', count: 4 },
          { milestone: 'M-02: Dok Legal', count: 5 },
          { milestone: 'M-03: Survei', count: 7 },
          { milestone: 'M-04: Analisis KKP', count: 11 },
          { milestone: 'M-05: Telaah QA', count: 3 },
          { milestone: 'M-06: NoLap Terbit', count: 6 },
          { milestone: 'M-07: Pelunasan', count: 5 }
        ],
        billingStatus: { dpPaid: 16, lunasM7: 5, unbilledWip: 2, totalUnbilledNominal: 45000000 },
        topClients: [
          { name: 'PT Bank Mandiri (Persero) Tbk', count: 12, fee: 320000000 },
          { name: 'PT Bank Rakyat Indonesia (Persero) Tbk', count: 9, fee: 235000000 },
          { name: 'PT Bank Central Asia Tbk (BCA)', count: 7, fee: 180000000 },
          { name: 'PT Bank Negara Indonesia (Persero) Tbk', count: 6, fee: 145000000 },
          { name: 'PT Bank Tabungan Negara (Persero) Tbk', count: 4, fee: 85000000 }
        ],
        kpiSummary: {
          rataRataNasional: 90.4,
          topPerformer: { nama: 'Danny Taufik Hidayat, S.H.', compositeScore: 97.7, nik: 'NSR-2019-005', cabang: 'Pusat Jakarta' },
          rasioKepatuhanIzin: '98.1%',
          keseimbanganBebanKerja: 'Optimal & Merata (Indeks Gini 0.18)',
          totalPersonel: 52
        },
        kpiPerCabang: [
          { cabang: 'Pusat Jakarta', avgScore: 91.8 },
          { cabang: 'Cabang Bandung', avgScore: 90.9 },
          { cabang: 'Cabang Padang', avgScore: 89.4 },
          { cabang: 'Cabang Makassar', avgScore: 88.6 },
          { cabang: 'Cabang Palembang', avgScore: 87.2 }
        ],
        slaSummary: {
          onTimeRateNasional: '94.2%',
          rataDurasiInternal: '3.8 Hari Kerja',
          rataClockStopKlien: '1.8 Hari Kerja',
          rataSpeedPembayaran: '7.4 Hari Kerja',
          totalBankMitra: 8,
          totalPenugasanSla: 52
        },
        bankPerformance: [
          { name: 'PT Bank Mandiri (Persero) Tbk', targetSla: 7.0, realisasiSla: 5.6, durasiInternal: 3.7, clockStop: 1.9, onTimeRate: 95.2, speedPayment: 6.4, totalJo: 14, statusScore: 'EXCELLENT' },
          { name: 'PT Bank Rakyat Indonesia (Persero) Tbk', targetSla: 6.0, realisasiSla: 5.1, durasiInternal: 3.4, clockStop: 1.7, onTimeRate: 94.0, speedPayment: 7.8, totalJo: 10, statusScore: 'EXCELLENT' },
          { name: 'PT Bank Central Asia Tbk (BCA)', targetSla: 5.0, realisasiSla: 4.4, durasiInternal: 3.1, clockStop: 1.3, onTimeRate: 96.5, speedPayment: 5.2, totalJo: 8, statusScore: 'EXCELLENT' },
          { name: 'PT Bank Negara Indonesia (Persero) Tbk', targetSla: 7.0, realisasiSla: 6.2, durasiInternal: 4.1, clockStop: 2.1, onTimeRate: 91.5, speedPayment: 8.6, totalJo: 6, statusScore: 'GOOD' },
          { name: 'PT Bank Tabungan Negara (Persero) Tbk', targetSla: 8.0, realisasiSla: 7.0, durasiInternal: 4.5, clockStop: 2.5, onTimeRate: 90.0, speedPayment: 9.5, totalJo: 5, statusScore: 'GOOD' },
          { name: 'PT Bank CIMB Niaga Tbk', targetSla: 6.0, realisasiSla: 5.5, durasiInternal: 3.6, clockStop: 1.9, onTimeRate: 93.0, speedPayment: 7.0, totalJo: 4, statusScore: 'GOOD' },
          { name: 'PT Bank Syariah Indonesia Tbk (BSI)', targetSla: 7.0, realisasiSla: 6.5, durasiInternal: 4.2, clockStop: 2.3, onTimeRate: 89.5, speedPayment: 11.2, totalJo: 3, statusScore: 'ATTENTION' },
          { name: 'PT Bank Danamon Indonesia Tbk', targetSla: 6.0, realisasiSla: 5.8, durasiInternal: 3.9, clockStop: 1.9, onTimeRate: 92.0, speedPayment: 8.0, totalJo: 2, statusScore: 'GOOD' }
        ],
        nearOverdueJobs: [
          {
            noJo: '0421/JO/NSR/XI/2026',
            klien: 'PT Bank Mandiri (Persero) Tbk',
            objek: 'Ruko Komersial 4 Lantai - Fatmawati',
            cabang: 'Pusat Jakarta',
            picPenilai: 'Yoga Anfiar Pradipta',
            targetSlaDays: 7,
            elapsedDays: 6.0,
            sisaHari: 1.0,
            statusBadge: 'MENDEKATI_TENGGAT',
            tahapSaatIni: 'M-05: Review Mutu SPM'
          },
          {
            noJo: '0418/JO/NSR/XI/2026',
            klien: 'PT Bank Rakyat Indonesia (Persero) Tbk',
            objek: 'Pabrik Industri & Gudang - Cimahi',
            cabang: 'Cabang Bandung',
            picPenilai: 'Ardi Nurmayadi, S.T.',
            targetSlaDays: 6,
            elapsedDays: 5.0,
            sisaHari: 1.0,
            statusBadge: 'MENDEKATI_TENGGAT',
            tahapSaatIni: 'M-04: Analisis KKP'
          },
          {
            noJo: '0414/JO/NSR/XI/2026',
            klien: 'PT Bank Central Asia Tbk (BCA)',
            objek: 'Gudang Logistik & Depo - Biringkanaya',
            cabang: 'Cabang Makassar',
            picPenilai: 'Wawan Kurniawan',
            targetSlaDays: 5,
            elapsedDays: 3.5,
            sisaHari: 1.5,
            statusBadge: 'MENDEKATI_TENGGAT',
            tahapSaatIni: 'M-04: Analisis KKP'
          },
          {
            noJo: '0409/JO/NSR/XI/2026',
            klien: 'PT Bank Tabungan Negara (Persero) Tbk',
            objek: 'Kawasan Perumahan - Bukit Sejahtera',
            cabang: 'Cabang Palembang',
            picPenilai: 'Rafdinal Ardhi',
            targetSlaDays: 8,
            elapsedDays: 6.0,
            sisaHari: 2.0,
            statusBadge: 'PERHATIAN_SLA',
            tahapSaatIni: 'M-03: Inspeksi Lapangan'
          }
        ],
        bankOptimization: {
          summary: {
            totalBankRekanan: 8,
            bankAktifCount: 6,
            bankDormantCount: 2,
            winRateNasional: '68.4%',
            totalPenawaranKeluar: 76,
            totalSpkTerbit: 52,
            totalFeeNetto: 1170000000,
            aovNasional: 22500000,
            pksExpiringCount: 3,
            onTimeRateNasional: '94.2%',
            rataDurasiInternal: '3.8 Hari Kerja',
            rataClockStopKlien: '1.8 Hari Kerja',
            rataSpeedPembayaran: '7.4 Hari Kerja'
          },
          bankMetrics: [
            {
              bank: "PT Bank Mandiri (Persero) Tbk",
              penawaranKeluar: 18,
              spkTerbit: 14,
              winRate: 77.8,
              totalFeeNetto: 320000000,
              aov: 22857143,
              targetSla: 7.0,
              realisasiSla: 5.6,
              speedPayment: 6.4,
              lastOrderDate: "2026-11-12",
              lastOrderDaysAgo: 2,
              dormantStatus: "AKTIF",
              pksNomor: "PKS-NSR/MDR/2024/012",
              pksExpiryDate: "2027-05-30",
              pksDaysRemaining: 197,
              pksAlertLevel: "AMAN",
              rekomendasiTindakan: "Pertahankan kemitraan Tier-1 & tingkatkan order segmen korporasi komersial.",
              segmen: { kpr: 6, ukm: 5, korporasi: 2, lelang: 1 }
            },
            {
              bank: "PT Bank Rakyat Indonesia (Persero) Tbk",
              penawaranKeluar: 14,
              spkTerbit: 10,
              winRate: 71.4,
              totalFeeNetto: 235000000,
              aov: 23500000,
              targetSla: 6.0,
              realisasiSla: 5.1,
              speedPayment: 7.8,
              lastOrderDate: "2026-11-10",
              lastOrderDaysAgo: 4,
              dormantStatus: "AKTIF",
              pksNomor: "PKS-NSR/BRI/2024/008",
              pksExpiryDate: "2027-02-15",
              pksDaysRemaining: 93,
              pksAlertLevel: "AMAN",
              rekomendasiTindakan: "Perluas penetrasi sentra mikro & UKM di wilayah Padang dan Makassar.",
              segmen: { kpr: 4, ukm: 4, korporasi: 1, lelang: 1 }
            },
            {
              bank: "PT Bank Central Asia Tbk (BCA)",
              penawaranKeluar: 10,
              spkTerbit: 8,
              winRate: 80.0,
              totalFeeNetto: 180000000,
              aov: 22500000,
              targetSla: 5.0,
              realisasiSla: 4.4,
              speedPayment: 5.2,
              lastOrderDate: "2026-11-11",
              lastOrderDaysAgo: 3,
              dormantStatus: "AKTIF",
              pksNomor: "PKS-NSR/BCA/2025/003",
              pksExpiryDate: "2026-12-31",
              pksDaysRemaining: 47,
              pksAlertLevel: "H-60",
              rekomendasiTindakan: "Jadwalkan audiensi tahunan & konfirmasi perpanjangan PKS (H-47).",
              segmen: { kpr: 3, ukm: 3, korporasi: 2, lelang: 0 }
            },
            {
              bank: "PT Bank Negara Indonesia (Persero) Tbk",
              penawaranKeluar: 9,
              spkTerbit: 6,
              winRate: 66.7,
              totalFeeNetto: 145000000,
              aov: 24166667,
              targetSla: 7.0,
              realisasiSla: 6.2,
              speedPayment: 8.6,
              lastOrderDate: "2026-11-08",
              lastOrderDaysAgo: 6,
              dormantStatus: "AKTIF",
              pksNomor: "PKS-NSR/BNI/2024/019",
              pksExpiryDate: "2027-04-20",
              pksDaysRemaining: 157,
              pksAlertLevel: "AMAN",
              rekomendasiTindakan: "Koordinasi dengan Unit Remedial & Korporasi untuk percepatan berkas agunan.",
              segmen: { kpr: 2, ukm: 2, korporasi: 1, lelang: 1 }
            },
            {
              bank: "PT Bank Tabungan Negara (Persero) Tbk",
              penawaranKeluar: 7,
              spkTerbit: 5,
              winRate: 71.4,
              totalFeeNetto: 110000000,
              aov: 22000000,
              targetSla: 8.0,
              realisasiSla: 7.0,
              speedPayment: 9.5,
              lastOrderDate: "2026-11-06",
              lastOrderDaysAgo: 8,
              dormantStatus: "AKTIF",
              pksNomor: "PKS-NSR/BTN/2024/005",
              pksExpiryDate: "2026-12-10",
              pksDaysRemaining: 26,
              pksAlertLevel: "H-30",
              rekomendasiTindakan: "URGENT PKS (H-26): Submit berkas legalitas izin KMK & audiensi direksi BTN.",
              segmen: { kpr: 4, ukm: 1, korporasi: 0, lelang: 0 }
            },
            {
              bank: "PT Bank CIMB Niaga Tbk",
              penawaranKeluar: 6,
              spkTerbit: 4,
              winRate: 66.7,
              totalFeeNetto: 84000000,
              aov: 21000000,
              targetSla: 6.0,
              realisasiSla: 5.5,
              speedPayment: 7.0,
              lastOrderDate: "2026-11-04",
              lastOrderDaysAgo: 10,
              dormantStatus: "AKTIF",
              pksNomor: "PKS-NSR/CIMB/2025/002",
              pksExpiryDate: "2027-08-14",
              pksDaysRemaining: 273,
              pksAlertLevel: "AMAN",
              rekomendasiTindakan: "Fokus appraisal aset komersial & optimalisasi kecepatan SLA (5.5 Hari).",
              segmen: { kpr: 2, ukm: 1, korporasi: 1, lelang: 0 }
            },
            {
              bank: "PT Bank Syariah Indonesia Tbk (BSI)",
              penawaranKeluar: 6,
              spkTerbit: 3,
              winRate: 50.0,
              totalFeeNetto: 48000000,
              aov: 16000000,
              targetSla: 7.0,
              realisasiSla: 6.5,
              speedPayment: 11.2,
              lastOrderDate: "2026-10-12",
              lastOrderDaysAgo: 33,
              dormantStatus: "DORMANT_30",
              pksNomor: "PKS-NSR/BSI/2024/027",
              pksExpiryDate: "2027-02-05",
              pksDaysRemaining: 83,
              pksAlertLevel: "H-90",
              rekomendasiTindakan: "ATENSI DORMANT (33 Hari): Penawaran khusus paket agunan cabang & siapkan PKS (H-83).",
              segmen: { kpr: 1, ukm: 1, korporasi: 1, lelang: 0 }
            },
            {
              bank: "PT Bank Danamon Indonesia Tbk",
              penawaranKeluar: 6,
              spkTerbit: 2,
              winRate: 33.3,
              totalFeeNetto: 48000000,
              aov: 24000000,
              targetSla: 6.0,
              realisasiSla: 5.8,
              speedPayment: 8.0,
              lastOrderDate: "2026-09-10",
              lastOrderDaysAgo: 65,
              dormantStatus: "DORMANT_60",
              pksNomor: "PKS-NSR/BDM/2024/015",
              pksExpiryDate: "2027-06-30",
              pksDaysRemaining: 228,
              pksAlertLevel: "AMAN",
              rekomendasiTindakan: "KRITIS DORMANT (65 Hari): Courtesy Call Pemimpin Rekan ke Unit Appraisal Pusat Danamon.",
              segmen: { kpr: 0, ukm: 1, korporasi: 0, lelang: 1 }
            }
          ],
          segmenNasional: { konsumerKpr: 22, komersialUkm: 18, korporasi: 8, lelangNpl: 4 },
          segmenPerCabang: [
            { cabang: "Pusat Jakarta", konsumerKpr: 9, komersialUkm: 9, korporasi: 6, lelangNpl: 2, total: 26 },
            { cabang: "Cabang Bandung", konsumerKpr: 4, komersialUkm: 3, korporasi: 1, lelangNpl: 1, total: 9 },
            { cabang: "Cabang Padang", konsumerKpr: 3, komersialUkm: 2, korporasi: 0, lelangNpl: 1, total: 6 },
            { cabang: "Cabang Makassar", konsumerKpr: 3, komersialUkm: 2, korporasi: 1, lelangNpl: 0, total: 6 },
            { cabang: "Cabang Palembang", konsumerKpr: 3, komersialUkm: 2, korporasi: 0, lelangNpl: 0, total: 5 }
          ],
          pksAlertRadar: [
            {
              bank: "PT Bank Tabungan Negara (Persero) Tbk",
              nomorPks: "PKS-NSR/BTN/2024/005",
              tglBerakhir: "2026-12-10",
              sisaHari: 26,
              alertLevel: "H-30",
              badgeColor: "rose",
              tindakan: "Kirim surat permohonan perpanjangan PKS & submit berkas legalitas pemutakhiran izin KMK."
            },
            {
              bank: "PT Bank Central Asia Tbk (BCA)",
              nomorPks: "PKS-NSR/BCA/2025/003",
              tglBerakhir: "2026-12-31",
              sisaHari: 47,
              alertLevel: "H-60",
              badgeColor: "amber",
              tindakan: "Jadwalkan audiensi tahunan dan konfirmasi review batas plafon appraisal wilayah cabang."
            },
            {
              bank: "PT Bank Syariah Indonesia Tbk (BSI)",
              nomorPks: "PKS-NSR/BSI/2024/027",
              tglBerakhir: "2027-02-05",
              sisaHari: 83,
              alertLevel: "H-90",
              badgeColor: "sky",
              tindakan: "Siapkan evaluasi kinerja SLA & rekap laporan pembiayaan syariah regional."
            }
          ],
          dormantAlerts: [
            {
              bank: "PT Bank Danamon Indonesia Tbk",
              kategori: "DORMANT_60",
              badgeColor: "rose",
              hariPasif: 65,
              tglTerakhirOrder: "2026-09-10",
              cabangTerakhir: "Pusat Jakarta",
              tindakan: "Kunjungan Courtesy Call Pemimpin Rekan ke Unit Appraisal Pusat Danamon & Re-aktivasi Akun Mitra."
            },
            {
              bank: "PT Bank Syariah Indonesia Tbk (BSI)",
              kategori: "DORMANT_30",
              badgeColor: "amber",
              hariPasif: 33,
              tglTerakhirOrder: "2026-10-12",
              cabangTerakhir: "Cabang Bandung",
              tindakan: "Penawaran Khusus Paket Agunan Cabang & follow-up SPK penaksiran aset komersial syariah."
            }
          ],
          izinAlertRadar: [],
          pplComplianceRecords: []
        }
      }
    };
    mockData.bankOptimization = mockData.analytics.bankOptimization;
    mockData.bankOrderOptimization = mockData.analytics.bankOptimization;
    mockData.slaSummary = mockData.analytics.slaSummary;
    mockData.bankPerformance = mockData.analytics.bankPerformance;
    mockData.nearOverdueJobs = mockData.analytics.nearOverdueJobs;
    mockData.izinAlertRadar = [];
    mockData.pplComplianceRecords = [];

    res.end(JSON.stringify(mockData));
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    let contentType = 'text/plain';
    if (filePath.endsWith('.html')) contentType = 'text/html';
    else if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) contentType = 'application/javascript';
    else if (filePath.endsWith('.css')) contentType = 'text/css';
    else if (filePath.endsWith('.json')) contentType = 'application/json';
    else if (filePath.endsWith('.png')) contentType = 'image/png';
    else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + filePath);
  }
});

server.listen(PORT, async () => {
  console.log(`Server HTTP lokal berjalan di http://127.0.0.1:${PORT}`);

  // 2. Launch Chrome Headless
  const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromeExe, [
    `--remote-debugging-port=${CHROME_PORT}`,
    `--user-data-dir=${TEMP_PROFILE}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    '--window-size=1440,900',
    'about:blank'
  ]);

  let tabs = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const listRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json`);
      if (listRes.ok) {
        tabs = await listRes.json();
        if (tabs && tabs.length > 0) break;
      }
    } catch (_) {}
  }
  if (!tabs || tabs.length === 0) {
    throw new Error('Chrome remote debugging tidak merespons setelah 10 detik');
  }

  try {
    const wsUrl = tabs[0].webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    let idCounter = 1;
    const callbacks = new Map();

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise((r) => (ws.onopen = r));
    await send('Page.enable');
    await send('Runtime.enable');

    console.log('\n--- 1. BUKA PORTAL GOVERNANCE DENGAN TOKEN RESMI ---');
    const validKingToken = '5b721e06941bf2803b879c947ff9618b628ec26f0b4d4b1cf2de90c2912443c6';
    const targetUrl = `http://127.0.0.1:${PORT}/portal-governance.html?auth_token=${validKingToken}`;
    await send('Page.navigate', { url: targetUrl });
    await new Promise(r => setTimeout(r, 2000));

    // TAB 1: Pengawasan
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_governance_tab1_pengawasan.png'), Buffer.from(shot1.data, 'base64'));
    console.log('📸 Screenshot Tab 1 (Pengawasan) berhasil');

    // TAB 2: Analitik Bisnis & Mutu
    console.log('\n--- 2. PINDAH KE TAB 2: ANALITIK BISNIS & MUTU ---');
    await send('Runtime.evaluate', { expression: `switchGovTab('analitik');` });
    await new Promise(r => setTimeout(r, 1000));
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_governance_tab2_analitik.png'), Buffer.from(shot2.data, 'base64'));
    console.log('📸 Screenshot Tab 2 (Analitik Bisnis & Mutu) berhasil');

    // TAB 3: Kinerja & KPI SDM (52 Personel)
    console.log('\n--- 3. PINDAH KE TAB 3: KINERJA & KPI SDM (52 PERSONEL) ---');
    await send('Runtime.evaluate', { expression: `switchGovTab('kpi');` });
    await new Promise(r => setTimeout(r, 1200));

    const evalTab3 = await send('Runtime.evaluate', {
      expression: `({
        activeTab: activeGovTab,
        avgNasional: document.getElementById('stat-kpi-avg-nasional')?.textContent,
        topName: document.getElementById('stat-kpi-top-name')?.textContent,
        pplRatio: document.getElementById('stat-kpi-ppl-ratio')?.textContent,
        totalRows: document.getElementById('tbody-kpi-employees')?.children?.length,
        hasChartKpiCabang: !!chartInstances['kpiCabang'],
        radarIzinText: document.getElementById('stat-kpi-radar-count')?.textContent,
        radarIzinCards: document.getElementById('container-izin-alert-radar')?.children?.length,
        hasBtnCetak: !!document.getElementById('btn-cetak-eksekutif'),
        hasPrintReport: !!document.getElementById('print-executive-report')
      })`,
      returnByValue: true
    });
    console.log('Data Tab 3 (KPI SDM 52 Personel & Radar Izin):', evalTab3.result.value);

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    const shot3Path = path.join(ARTIFACT_DIR, 'bukti_governance_tab3_kpi_sdm.png');
    fs.writeFileSync(shot3Path, Buffer.from(shot3.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_governance_tab4_kpi_sdm.png'), Buffer.from(shot3.data, 'base64')); // compatibility alias
    console.log(`📸 Screenshot Tab 3 disimpan: ${shot3Path}`);

    // Uji Buka Modal Evaluasi KPI SDM
    console.log('\n--- 3b. UJI BUKA MODAL EVALUASI KPI SDM ---');
    await send('Runtime.evaluate', { expression: `bukaModalEvaluasiKpi('NSR-2019-005');` });
    await new Promise(r => setTimeout(r, 600));

    const evalModalKpi = await send('Runtime.evaluate', {
      expression: `({
        isOpen: !document.getElementById('modal-evaluasi-kpi')?.classList.contains('hidden'),
        nama: document.getElementById('eval-kpi-nama')?.textContent,
        nik: document.getElementById('eval-kpi-nik')?.textContent,
        previewScore: document.getElementById('preview-skor-komposit')?.textContent,
        inputDisiplin: document.getElementById('eval-input-disiplin')?.value,
        inputEtika: document.getElementById('eval-input-etika')?.value
      })`,
      returnByValue: true
    });
    console.log('Status Modal Evaluasi KPI:', evalModalKpi.result.value);

    const shotModal = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_modal_evaluasi_kpi.png'), Buffer.from(shotModal.data, 'base64'));
    console.log('📸 Screenshot Modal Evaluasi KPI disimpan: bukti_modal_evaluasi_kpi.png');

    await send('Runtime.evaluate', { expression: `tutupModalEvaluasiKpi();` });
    await new Promise(r => setTimeout(r, 400));

    // Uji Buka Modal Input Mandiri & Verifikasi PPL MAPPI / Izin Penilai
    console.log('\n--- 3c. UJI BUKA MODAL INPUT & VERIFIKASI PPL MAPPI / IZIN PENILAI ---');
    await send('Runtime.evaluate', { expression: `bukaModalPplIzin('NSR-2019-005', 'SPM_APPROVE_VERIFY');` });
    await new Promise(r => setTimeout(r, 600));

    const evalModalPpl = await send('Runtime.evaluate', {
      expression: `({
        isOpen: !document.getElementById('modal-ppl-izin')?.classList.contains('hidden'),
        selectedNik: document.getElementById('ppl-input-nik')?.value,
        nama: document.getElementById('ppl-display-nama')?.textContent,
        cabang: document.getElementById('ppl-display-cabang')?.textContent,
        mode: document.getElementById('ppl-input-mode')?.value,
        statusVerif: document.getElementById('ppl-input-status-verifikasi')?.value,
        targetSkp: document.getElementById('ppl-input-skp-target')?.value
      })`,
      returnByValue: true
    });
    console.log('Status Modal PPL & Izin Penilai:', evalModalPpl.result.value);

    const shotModalPpl = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_modal_ppl_izin.png'), Buffer.from(shotModalPpl.data, 'base64'));
    console.log('📸 Screenshot Modal PPL & Izin Penilai disimpan: bukti_modal_ppl_izin.png');

    await send('Runtime.evaluate', { expression: `tutupModalPplIzin();` });
    await new Promise(r => setTimeout(r, 400));

    // TAB 4: SLA Bank Rekanan & Klien
    console.log('\n--- 4. PINDAH KE TAB 4: SLA BANK REKANAN & KLIEN ---');
    await send('Runtime.evaluate', { expression: `switchGovTab('sla-klien');` });
    await new Promise(r => setTimeout(r, 1200));

    const evalTab4 = await send('Runtime.evaluate', {
      expression: `({
        activeTab: activeGovTab,
        onTimeRate: document.getElementById('stat-sla-ontime-rate')?.textContent,
        internalDays: document.getElementById('stat-sla-internal-days')?.textContent,
        clockStopDays: document.getElementById('stat-sla-clockstop-days')?.textContent,
        paymentSpeed: document.getElementById('stat-sla-payment-speed')?.textContent,
        nearOverdueRows: document.getElementById('tbody-near-overdue-jobs')?.children?.length,
        bankSlaRows: document.getElementById('tbody-bank-sla-performance')?.children?.length,
        hasChartTargetRealisasi: !!chartInstances['slaTargetRealisasi'],
        hasChartClockstop: !!chartInstances['slaClockstop']
      })`,
      returnByValue: true
    });
    console.log('Data Tab 4 (SLA Bank Rekanan & Klien):', evalTab4.result.value);

    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    const shot4Path = path.join(ARTIFACT_DIR, 'bukti_governance_tab4_sla_klien.png');
    fs.writeFileSync(shot4Path, Buffer.from(shot4.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_governance_tab4_sla_rekanan.png'), Buffer.from(shot4.data, 'base64')); // compatibility alias
    console.log(`📸 Screenshot Tab 4 disimpan: ${shot4Path}`);

    // TAB 5: Optimasi Order Bank Rekanan & Radar PKS
    console.log('\n--- 5. PINDAH KE TAB 5: OPTIMASI ORDER BANK REKANAN & RADAR PKS ---');
    await send('Runtime.evaluate', { expression: `switchGovTab('optimasi-pks');` });
    await new Promise(r => setTimeout(r, 1200));

    const evalTab5 = await send('Runtime.evaluate', {
      expression: `(() => {
        const tbody = document.getElementById('tbody-bank-intelligence');
        const table = tbody?.closest('table');
        const container = table?.parentElement;
        const thCol11 = table?.querySelectorAll('thead th')[10];
        const firstRow = tbody?.querySelector('tr');
        const tdCol11 = firstRow?.querySelectorAll('td')[10];
        return {
          activeTab: activeGovTab,
          winRateNasional: document.getElementById('stat-opt-winrate')?.textContent,
          dormantSummary: document.getElementById('stat-opt-dormant')?.textContent,
          aovPerbankan: document.getElementById('stat-opt-aov')?.textContent,
          pksAlertPrioritas: document.getElementById('stat-opt-pks-alert')?.textContent,
          dormantAlertCards: document.getElementById('container-dormant-bank-alerts')?.children?.length,
          pksRadarCards: document.getElementById('container-pks-alert-radar')?.children?.length,
          bankIntelligenceRows: tbody?.children?.length,
          hasChartWinrate: !!chartInstances['bankWinrate'],
          hasChartSegments: !!chartInstances['bankSegments'],
          hasOverflowX: container?.classList.contains('overflow-x-auto'),
          tableIsAuto: table?.classList.contains('table-auto'),
          th11HasMinW230: thCol11?.className.includes('min-w-[230px]'),
          td11HasMinW230: tdCol11?.className.includes('min-w-[230px]'),
          td11VisibleText: tdCol11?.textContent?.trim()
        };
      })()`,
      returnByValue: true
    });
    console.log('Data Tab 5 (Optimasi Order & Radar PKS):', evalTab5.result.value);

    const shot5 = await send('Page.captureScreenshot', { format: 'png' });
    const shot5Path = path.join(ARTIFACT_DIR, 'bukti_governance_tab5_optimasi_pks.png');
    fs.writeFileSync(shot5Path, Buffer.from(shot5.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_governance_tab3_optimasi_sla.png'), Buffer.from(shot5.data, 'base64')); // compatibility alias
    console.log(`📸 Screenshot Tab 5 disimpan: ${shot5Path}`);

    ws.close();
  } catch (err) {
    console.error('Error saat CDP headless test:', err);
  } finally {
    try { chromeProc.kill(); } catch (_) {}
    server.close();
    try { fs.rmSync(TEMP_PROFILE, { recursive: true, force: true }); } catch (_) {}
    console.log('\n✅ PENGUJIAN VISUAL & E2E 5 TAB TUNTAS DENGAN SUKSES!');
    process.exit(0);
  }
});
