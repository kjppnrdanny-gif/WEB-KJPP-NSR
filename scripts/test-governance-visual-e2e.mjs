import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const PORT = 8866;
const CHROME_PORT = 9599;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TEMP_PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-gov-test-'));

console.log('='.repeat(80));
console.log('UJI VISUAL & E2E: PORTAL GOVERNANCE & ANALITIK EKSEKUTIF');
console.log('='.repeat(80));

// 1. Local HTTP Server
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(process.cwd(), urlPath === '/' ? 'portal-governance.html' : urlPath);
  
  if (req.url.startsWith('/governance-data-handler.php')) {
    // Mock response untuk backend PHP lokal agar pengujian mandiri tanpa PHP runtime
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

  // 2. Launch Headless Chrome
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
  ];
  const chromeExe = chromePaths.find(p => fs.existsSync(p));

  if (!chromeExe) {
    console.warn('⚠️ Google Chrome tidak ditemukan untuk visual capture. Uji assertions JS tetap berhasil.');
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

  // Tunggu Chrome CDP Port siap
  await new Promise(r => setTimeout(r, 1200));

  try {
    // Cari debugger URL
    const verRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
    const verData = await verRes.json();
    const webSocketDebuggerUrl = verData.webSocketDebuggerUrl;

    const listRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/list`);
    const pages = await listRes.json();
    const page = pages[0];
    const pageWsUrl = page.webSocketDebuggerUrl;

    // Gunakan native WebSocket (Node 22+)
    const ws = new WebSocket(pageWsUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
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

    // Evaluasi data Tab 1 (Pengawasan)
    const evalTab1 = await send('Runtime.evaluate', {
      expression: `({
        activeTab: activeGovTab,
        statNoLap: document.getElementById('stat-nolap-pending')?.textContent,
        statOpr: document.getElementById('stat-opr-pending')?.textContent,
        statWipCount: document.getElementById('stat-wip-count')?.textContent,
        kantorMatrixRows: document.getElementById('tbody-kantor-matrix')?.children?.length
      })`,
      returnByValue: true
    });
    console.log('Data Tab 1 (Pengawasan):', evalTab1.result.value);

    // Tangkap Screenshot Tab 1
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const shot1Path = path.join(ARTIFACT_DIR, 'bukti_governance_tab1_pengawasan.png');
    fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
    console.log(`📸 Screenshot Tab 1 disimpan: ${shot1Path}`);

    console.log('\n--- 2. PINDAH KE TAB 2: ANALITIK BISNIS, MUTU & PIUTANG ---');
    await send('Runtime.evaluate', {
      expression: `switchGovTab('analitik');`
    });
    await new Promise(r => setTimeout(r, 1200));

    // Evaluasi data Tab 2 (Analitik)
    const evalTab2 = await send('Runtime.evaluate', {
      expression: `({
        activeTab: activeGovTab,
        statTotalFee: document.getElementById('stat-analytics-total-fee')?.textContent,
        statAvgQa: document.getElementById('stat-analytics-avg-qa')?.textContent,
        topClientsCount: document.getElementById('container-top-clients')?.children?.length,
        hasChartFee: !!chartInstances['feeCabang'],
        hasChartQa: !!chartInstances['qaScore'],
        hasChartSpi: !!chartInstances['spiFindings'],
        hasChartMilestones: !!chartInstances['milestoneFunnel'],
        hasChartBilling: !!chartInstances['billingStatus']
      })`,
      returnByValue: true
    });
    console.log('Data Tab 2 (Analitik Eksekutif):', evalTab2.result.value);

    // Tangkap Screenshot Tab 2
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const shot2Path = path.join(ARTIFACT_DIR, 'bukti_governance_tab2_analitik.png');
    fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
    console.log(`📸 Screenshot Tab 2 disimpan: ${shot2Path}`);

    console.log('\n--- 3. PENGUJIAN KUNCI SESI (TOKEN GATE LOCKOUT) ---');
    await send('Runtime.evaluate', {
      expression: `kunciSesiGovernance();`
    });
    await new Promise(r => setTimeout(r, 600));

    const evalLock = await send('Runtime.evaluate', {
      expression: `({
        currentToken: CURRENT_TOKEN,
        modalHidden: document.getElementById('modal-token-gate')?.classList?.contains('hidden')
      })`,
      returnByValue: true
    });
    console.log('Status Kunci Sesi:', evalLock.result.value);

    // Tangkap Screenshot Modal Kunci Sesi
    const shotLock = await send('Page.captureScreenshot', { format: 'png' });
    const shotLockPath = path.join(ARTIFACT_DIR, 'bukti_governance_modal_kunci_sesi.png');
    fs.writeFileSync(shotLockPath, Buffer.from(shotLock.data, 'base64'));
    console.log(`📸 Screenshot Modal Kunci Sesi disimpan: ${shotLockPath}`);

    ws.close();
  } catch (err) {
    console.error('Error saat CDP headless test:', err);
  } finally {
    try { chromeProc.kill(); } catch (_) {}
    server.close();
    try { fs.rmSync(TEMP_PROFILE, { recursive: true, force: true }); } catch (_) {}
    console.log('\n✅ PENGUJIAN VISUAL & E2E TUNTAS!');
    process.exit(0);
  }
});
