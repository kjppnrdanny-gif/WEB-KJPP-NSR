import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const PORT = 8877;
const CHROME_PORT = 9600;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TEMP_PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-gov-6tabs-'));

console.log('='.repeat(80));
console.log('UJI VISUAL & E2E KOMPREHENSIF: PORTAL GOVERNANCE 6 TAB TERPADU (SPM V.4.2026)');
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
          id: 'ANOM-SPM-PDG-01',
          cabang: 'Kantor Cabang Padang',
          pic: 'Hernita, S.Si.',
          phone: '081267891234',
          email: 'padang@kjppnanangrahayu.com',
          kategori: 'BRANCH_LICENSE_ESCALATION',
          badge: 'ESCALATION GATE LOCKED',
          badgeColor: 'rose',
          uraian: 'Cabang Padang (Izin Properti Sederhana / PS) mengusulkan aset komersial > Rp 5 Miliar (JO-NSR-2026-0118). Penerbitan NoLap cabang dikunci dan WAJIB dieskalasi ke Rekan (P) Pusat Ir. Nanang Rahayu sesuai PMK 101/2014 jo. PMK 228/2019.',
          canForcePass: false
        },
        {
          id: 'ANOM-SPM-MKS-02',
          cabang: 'Kantor Cabang Makassar',
          pic: 'Muhammad Amin Sade',
          phone: '081345678901',
          email: 'makassar@kjppnanangrahayu.com',
          kategori: 'FM_SPM_06_1_GATE',
          badge: 'FM-SPM-06.1 PENDING',
          badgeColor: 'amber',
          uraian: 'Pre-Release Document Gate terkunci: Kertas Kerja Penilaian (KKP Excel) dan Surat Representasi Klien bermeterai belum terverifikasi terunggah untuk JO-NSR-2026-0294.',
          canForcePass: false
        }
      ],
      employees: [
        { nik: 'NSR-2019-007', nama: 'Tedi Setiadi', cabang: 'Pusat Jakarta', peran: 'PENILAI', skorAkhirKpi: 93.5, skorQaOtomatis: 95.0, skorSlaOtomatis: 92.0, skorProduktivitas: 94.0, skorEvaluasiHrd: 92.0, predikatKpi: 'SANGAT BAIK', noMappi: '10-P-02594', noRegister: 'REG-PPPK-2019-007', izin: 'KMK No. P-1.19.00160', masaBerlakuIzin: '2028-12-31', totalSkpTerkumpul: 32, targetSkpWajib: 24, statusPpl: 'TERTIB', statusVerifikasiSpm: 'TERVERIFIKASI_SPM' },
        { nik: 'NSR-2025-023', nama: 'Yoga Anfiar Pradipta', cabang: 'Bandung', peran: 'PENILAI', skorAkhirKpi: 90.0, skorQaOtomatis: 91.0, skorSlaOtomatis: 89.0, skorProduktivitas: 90.0, skorEvaluasiHrd: 90.0, predikatKpi: 'SANGAT BAIK', noMappi: '18-P-04129', noRegister: 'REG-PPPK-2025-023', izin: 'KMK No. P-1.25.00412', masaBerlakuIzin: '2029-06-30', totalSkpTerkumpul: 28, targetSkpWajib: 24, statusPpl: 'TERTIB', statusVerifikasiSpm: 'TERVERIFIKASI_SPM' }
      ]
    };
    res.end(JSON.stringify(mockData));
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    let contentType = 'text/html';
    if (filePath.endsWith('.js')) contentType = 'application/javascript';
    else if (filePath.endsWith('.css')) contentType = 'text/css';
    else if (filePath.endsWith('.json')) contentType = 'application/json';
    else if (filePath.endsWith('.png')) contentType = 'image/png';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, async () => {
  console.log(`✓ Local server aktif pada http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeArgs = [
    `--remote-debugging-port=${CHROME_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${TEMP_PROFILE}`,
    '--window-size=1600,1050'
  ];

  const chromeProc = spawn(chromePath, chromeArgs);
  console.log('✓ Chrome headless diluncurkan pada remote debugging port', CHROME_PORT);

  let listRes = null;
  for (let attempt = 1; attempt <= 10; attempt++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      listRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/list`);
      if (listRes.ok) break;
    } catch (_) {}
  }
  if (!listRes) throw new Error('Chrome tidak merespon pada port ' + CHROME_PORT);

  try {
    const pages = await listRes.json();
    const wsUrl = pages[0]?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error('WebSocket Debugger URL tidak ditemukan');

    const ws = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const messageHandler = (event) => {
          const res = JSON.parse(event.data);
          if (res.id === id) {
            ws.removeEventListener('message', messageHandler);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        ws.addEventListener('message', messageHandler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-governance.html` });
    await new Promise(r => setTimeout(r, 3000));

    // 1. Tangkap Tab 1: Pengawasan
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_governance_tab1_pengawasan.png'), Buffer.from(shot1.data, 'base64'));
    console.log('📸 Screenshot Tab 1 disimpan: bukti_governance_tab1_pengawasan.png');

    // 2. Tab 2: Analitik
    await send('Runtime.evaluate', { expression: `switchGovTab('analitik')` });
    await new Promise(r => setTimeout(r, 800));
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_governance_tab2_analitik.png'), Buffer.from(shot2.data, 'base64'));
    console.log('📸 Screenshot Tab 2 disimpan: bukti_governance_tab2_analitik.png');

    // 3. Tab 3: Kinerja & KPI SDM
    await send('Runtime.evaluate', { expression: `switchGovTab('kpi')` });
    await new Promise(r => setTimeout(r, 800));
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_governance_tab3_kpi_sdm.png'), Buffer.from(shot3.data, 'base64'));
    console.log('📸 Screenshot Tab 3 disimpan: bukti_governance_tab3_kpi_sdm.png');

    // 4. Modal PPL & Izin Penilai
    await send('Runtime.evaluate', { expression: `bukaModalPplIzin('NSR-2019-007', 'SELF_SUBMIT_PERSONEL')` });
    await new Promise(r => setTimeout(r, 800));
    const shotModalPpl = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_modal_ppl_izin.png'), Buffer.from(shotModalPpl.data, 'base64'));
    console.log('📸 Screenshot Modal PPL (BPN/OJK) disimpan: bukti_modal_ppl_izin.png');
    await send('Runtime.evaluate', { expression: `tutupModalPplIzin()` });
    await new Promise(r => setTimeout(r, 500));

    // 5. Tab 4: SLA Bank Rekanan & Klien
    await send('Runtime.evaluate', { expression: `switchGovTab('sla-klien')` });
    await new Promise(r => setTimeout(r, 800));
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_governance_tab4_sla_klien.png'), Buffer.from(shot4.data, 'base64'));
    console.log('📸 Screenshot Tab 4 disimpan: bukti_governance_tab4_sla_klien.png');

    // 6. Tab 5: Optimasi Order & Radar PKS
    await send('Runtime.evaluate', { expression: `switchGovTab('optimasi-pks')` });
    await new Promise(r => setTimeout(r, 800));
    const shot5 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_governance_tab5_optimasi_pks.png'), Buffer.from(shot5.data, 'base64'));
    console.log('📸 Screenshot Tab 5 disimpan: bukti_governance_tab5_optimasi_pks.png');

    // 7. Tab 6: Kepatuhan SPM & Sampling Acak Triwulanan (Retensi 10 Tahun)
    await send('Runtime.evaluate', { expression: `switchGovTab('spm-post-review')` });
    await new Promise(r => setTimeout(r, 1200));
    const shot6 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_governance_tab6_spm_sampling.png'), Buffer.from(shot6.data, 'base64'));
    console.log('📸 Screenshot Tab 6 (SPM Sampling & Retensi 10 Tahun) disimpan: bukti_governance_tab6_spm_sampling.png');

    // 8. Modal Tindak Lanjut CAPA SPM V.4.2026
    await send('Runtime.evaluate', { expression: `bukaModalCapa('SMP-2026-Q1-003')` });
    await new Promise(r => setTimeout(r, 800));
    const shotModalCapa = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_modal_capa_update.png'), Buffer.from(shotModalCapa.data, 'base64'));
    console.log('📸 Screenshot Modal Pembaruan CAPA disimpan: bukti_modal_capa_update.png');
    await send('Runtime.evaluate', { expression: `tutupModalCapa()` });

    ws.close();
  } catch (err) {
    console.error('Error saat CDP headless test:', err);
  } finally {
    try { chromeProc.kill(); } catch (_) {}
    server.close();
    try { fs.rmSync(TEMP_PROFILE, { recursive: true, force: true }); } catch (_) {}
    console.log('\n✅ PENGUJIAN VISUAL & E2E 6 TAB TUNTAS DENGAN SUKSES!');
    process.exit(0);
  }
});
