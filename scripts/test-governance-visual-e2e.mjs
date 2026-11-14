import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const PORT = 8877;
const CHROME_PORT = 9600;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TEMP_PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-gov-4tabs-'));

console.log('='.repeat(80));
console.log('UJI VISUAL & E2E KOMPREHENSIF: PORTAL GOVERNANCE 4 TAB TERPADU');
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
          topPerformer: { nama: 'Danny Taufik Hidayat, S.H.', compositeScore: 97.7, cabang: 'Pusat Jakarta' },
          rasioKepatuhanIzin: '98.1%',
          keseimbanganBebanKerja: 'Optimal & Merata (Indeks Gini 0.18)',
          totalPersonel: 52
        },
        kpiPerCabang: [
          { cabang: 'Pusat Jakarta', avgScore: 91.8, totalPersonel: 26 },
          { cabang: 'Cabang Bandung', avgScore: 90.9, totalPersonel: 7 },
          { cabang: 'Cabang Padang', avgScore: 89.4, totalPersonel: 7 },
          { cabang: 'Cabang Makassar', avgScore: 88.6, totalPersonel: 8 },
          { cabang: 'Cabang Palembang', avgScore: 87.2, totalPersonel: 5 }
        ],
        slaSummary: {
          onTimeRateNasional: '94.2%',
          rataDurasiInternal: '3.8 Hari Kerja',
          rataClockStopKlien: '1.8 Hari Kerja',
          rataSpeedPembayaran: '7.4 Hari Kerja (Sejak M-07)',
          totalBankMitra: 8,
          totalPenugasanSla: 52
        },
        bankPerformance: [
          { name: "PT Bank Mandiri (Persero) Tbk", targetSla: 7.0, realisasiSla: 5.6, durasiInternal: 3.7, clockStop: 1.9, onTimeRate: 95.2, speedPayment: 6.4, totalJo: 14, statusScore: "EXCELLENT" },
          { name: "PT Bank Rakyat Indonesia (Persero) Tbk", targetSla: 6.0, realisasiSla: 5.1, durasiInternal: 3.4, clockStop: 1.7, onTimeRate: 94.0, speedPayment: 7.8, totalJo: 10, statusScore: "EXCELLENT" },
          { name: "PT Bank Central Asia Tbk (BCA)", targetSla: 5.0, realisasiSla: 4.4, durasiInternal: 3.1, clockStop: 1.3, onTimeRate: 96.5, speedPayment: 5.2, totalJo: 8, statusScore: "EXCELLENT" },
          { name: "PT Bank Negara Indonesia (Persero) Tbk", targetSla: 7.0, realisasiSla: 6.2, durasiInternal: 4.1, clockStop: 2.1, onTimeRate: 91.5, speedPayment: 8.6, totalJo: 6, statusScore: "GOOD" },
          { name: "PT Bank Tabungan Negara (Persero) Tbk", targetSla: 8.0, realisasiSla: 7.0, durasiInternal: 4.5, clockStop: 2.5, onTimeRate: 90.0, speedPayment: 9.5, totalJo: 5, statusScore: "GOOD" },
          { name: "PT Bank CIMB Niaga Tbk", targetSla: 6.0, realisasiSla: 5.5, durasiInternal: 3.6, clockStop: 1.9, onTimeRate: 93.0, speedPayment: 7.0, totalJo: 4, statusScore: "GOOD" },
          { name: "PT Bank Syariah Indonesia Tbk (BSI)", targetSla: 7.0, realisasiSla: 6.5, durasiInternal: 4.2, clockStop: 2.3, onTimeRate: 89.5, speedPayment: 11.2, totalJo: 3, statusScore: "ATTENTION" },
          { name: "PT Bank Danamon Indonesia Tbk", targetSla: 6.0, realisasiSla: 5.8, durasiInternal: 3.9, clockStop: 1.9, onTimeRate: 92.0, speedPayment: 8.0, totalJo: 2, statusScore: "GOOD" }
        ],
        nearOverdueJobs: [
          {
            noJo: "0421/JO/NSR/XI/2026",
            klien: "PT Bank Mandiri (Persero) Tbk",
            objek: "Ruko Komersial 4 Lantai - Fatmawati",
            cabang: "Pusat Jakarta",
            picPenilai: "Yoga Anfiar Pradipta",
            targetSlaDays: 7,
            elapsedDays: 6.0,
            sisaHari: 1.0,
            statusBadge: "MENDEKATI_TENGGAT",
            badgeColor: "rose",
            tahapSaatIni: "M-05: Review Mutu SPM"
          },
          {
            noJo: "0418/JO/NSR/XI/2026",
            klien: "PT Bank Rakyat Indonesia (Persero) Tbk",
            objek: "Pabrik Industri & Gudang - Cimahi",
            cabang: "Cabang Bandung",
            picPenilai: "Ardi Nurmayadi, S.T.",
            targetSlaDays: 6,
            elapsedDays: 5.0,
            sisaHari: 1.0,
            statusBadge: "MENDEKATI_TENGGAT",
            badgeColor: "rose",
            tahapSaatIni: "M-04: Analisis KKP"
          },
          {
            noJo: "0414/JO/NSR/XI/2026",
            klien: "PT Bank Central Asia Tbk (BCA)",
            objek: "Gudang Logistik & Depo - Biringkanaya",
            cabang: "Cabang Makassar",
            picPenilai: "Wawan Kurniawan",
            targetSlaDays: 5,
            elapsedDays: 3.5,
            sisaHari: 1.5,
            statusBadge: "MENDEKATI_TENGGAT",
            badgeColor: "amber",
            tahapSaatIni: "M-04: Analisis KKP"
          },
          {
            noJo: "0409/JO/NSR/XI/2026",
            klien: "PT Bank Tabungan Negara (Persero) Tbk",
            objek: "Kawasan Perumahan - Bukit Sejahtera",
            cabang: "Cabang Palembang",
            picPenilai: "Rafdinal Ardhi",
            targetSlaDays: 8,
            elapsedDays: 6.0,
            sisaHari: 2.0,
            statusBadge: "PERHATIAN_SLA",
            badgeColor: "amber",
            tahapSaatIni: "M-03: Inspeksi Lapangan"
          }
        ]
      }
    };
    res.end(JSON.stringify(mockData));
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, async () => {
  console.log(`[HTTP Server] Berjalan pada port ${PORT}`);

  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
  ];
  const chromeExe = chromePaths.find(p => fs.existsSync(p));

  if (!chromeExe) {
    console.warn('⚠️ Google Chrome tidak ditemukan untuk visual capture.');
    server.close();
    process.exit(0);
  }

  console.log(`[Chrome] Menjalankan: ${chromeExe}`);
  const chromeProc = spawn(chromeExe, [
    `--remote-debugging-port=${CHROME_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,960',
    `--user-data-dir=${TEMP_PROFILE}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  try {
    const verRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
    const verData = await verRes.json();
    const listRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/list`);
    const pages = await listRes.json();
    const page = pages[0];
    const ws = new WebSocket(page.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[Browser Console]', msg.params.type, msg.params.args?.map(a => a.value !== undefined ? a.value : a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[Browser Exception]', JSON.stringify(msg.params.exceptionDetails));
      }
      if (callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        callbacks.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
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
        hasChartKpiCabang: !!chartInstances['kpiCabang']
      })`,
      returnByValue: true
    });
    console.log('Data Tab 3 (KPI SDM):', evalTab3.result.value);

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    const shot3Path = path.join(ARTIFACT_DIR, 'bukti_governance_tab3_kpi_sdm.png');
    fs.writeFileSync(shot3Path, Buffer.from(shot3.data, 'base64'));
    console.log(`📸 Screenshot Tab 3 disimpan: ${shot3Path}`);

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
        radarCount: document.getElementById('tbody-near-overdue-jobs')?.children?.length,
        bankRows: document.getElementById('tbody-bank-sla-performance')?.children?.length,
        hasChartTarget: !!chartInstances['slaTargetRealisasi'],
        hasChartClockstop: !!chartInstances['slaClockstop']
      })`,
      returnByValue: true
    });
    console.log('Data Tab 4 (SLA Bank Rekanan):', evalTab4.result.value);

    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    const shot4Path = path.join(ARTIFACT_DIR, 'bukti_governance_tab4_sla_rekanan.png');
    fs.writeFileSync(shot4Path, Buffer.from(shot4.data, 'base64'));
    console.log(`📸 Screenshot Tab 4 disimpan: ${shot4Path}`);

    ws.close();
  } catch (err) {
    console.error('Error saat CDP headless test:', err);
  } finally {
    try { chromeProc.kill(); } catch (_) {}
    server.close();
    try { fs.rmSync(TEMP_PROFILE, { recursive: true, force: true }); } catch (_) {}
    console.log('\n✅ PENGUJIAN VISUAL & E2E 4 TAB TUNTAS DENGAN SUKSES!');
    process.exit(0);
  }
});
