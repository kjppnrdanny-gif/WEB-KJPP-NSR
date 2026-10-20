/**
 * SCRIPT: test-operasional-print-a4.mjs
 * Menguji hasil cetak nyata pada format A4 (@page margin 10mm)
 * Dokumen pendek, dokumen multihalaman, tabel biaya, dan 5 kolom tanda tangan + QR Code.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TEST_PORT = 8211;
const CHROME_PORT = 9492;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function cdpSend(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  console.log('1. Memulai server PHP lokal port ' + TEST_PORT + '...');
  const php = spawn('php', ['-S', `127.0.0.1:${TEST_PORT}`, '-t', process.cwd()], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));

  console.log('2. Memulai Chrome Headless...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1280,1080',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    await cdpSend(ws, 'Page.enable');
    await cdpSend(ws, 'Runtime.enable');

    console.log('3. Navigasi ke portal-operasional.html...');
    await cdpSend(ws, 'Page.navigate', { url: `http://127.0.0.1:${TEST_PORT}/portal-operasional.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Siapkan Dokumen 1: Survey Singkat 5-Tier Approved
    console.log('4. Mempersiapkan dokumen Survey (5-Tier Approved) untuk cetak...');
    const docShort = {
      id: 'OPR-20261020-SRV-TEST',
      noRegistrasi: 'OPR-SRV/2.19.0160-00/X/2026/0088',
      jenisOperasional: 'OPR-SRV',
      jenisLabel: 'Allowance Survey Lapangan',
      kantor: 'Kantor Pusat Jakarta',
      kodeKantor: '2.19.0160-00',
      status: 'APPROVED',
      versi: 1,
      tglPengajuan: '2026-10-20',
      totalEstimasi: 2750000,
      catatanPemohon: 'Survey penilaian pabrik kelapa sawit & aset tetap.',
      pemohon: { nama: 'Holik Kelana', jabatan: 'Surveyor Lapangan', cabang: 'Pusat' },
      survey: {
        idPenugasan: '0416/NSR/PN-APP/X/2026',
        nomorLaporan: '0012/LAP-NSR/X/2026',
        namaKlien: 'PT Sawit Makmur Abadi Tbk',
        lokasiObjek: 'Jl. Raya Lintas Sumatera Km. 88, Riau',
        tglMulaiSurvey: '2026-10-21',
        tglSelesaiSurvey: '2026-10-23',
        daftarSurveyor: ['Holik Kelana', 'Budi Santoso', 'Rian Hidayat'],
        biayaPersonal: [
          { nama: 'Holik Kelana', jabatan: 'Lead Surveyor', hari: 3, uangHarian: 250000, total: 750000 },
          { nama: 'Budi Santoso', jabatan: 'Assoc. Surveyor', hari: 3, uangHarian: 200000, total: 600000 },
          { nama: 'Rian Hidayat', jabatan: 'Teknisi GIS', hari: 3, uangHarian: 200000, total: 600000 }
        ],
        biayaKolektif: [
          { uraian: 'Sewa Mobil Operasional 4WD (3 Hari)', nominal: 1800000 },
          { uraian: 'BBM & Tol Perjalanan Survey', nominal: 650000 }
        ],
        subtotalPersonal: 1950000,
        subtotalKolektif: 2450000
      },
      approvals: {
        1: { tier: 1, label: 'Yang Mengajukan', pejabat: 'Holik Kelana', jabatan: 'Yang Mengajukan', approved: true, approvedAt: '2026-10-20 09:00:00', approvedBy: 'Holik Kelana', hmacHash: 'a1b2c3d4e5f601', qrUrl: 'https://kjppnanangrahayu.com/verifikasi-dokumen.html?doc=OPR-SRV/2.19.0160-00/X/2026/0088&tier=1&hash=a1b2c3d4e5f601' },
        2: { tier: 2, label: 'Mengetahui', pejabat: 'Deni Siswandi, S.T.', jabatan: 'Mengetahui', approved: true, approvedAt: '2026-10-20 10:15:00', approvedBy: 'Deni Siswandi, S.T.', hmacHash: 'b2c3d4e5f6a102', qrUrl: 'https://kjppnanangrahayu.com/verifikasi-dokumen.html?doc=OPR-SRV/2.19.0160-00/X/2026/0088&tier=2&hash=b2c3d4e5f6a102' },
        3: { tier: 3, label: 'Verifikasi Administrasi', pejabat: 'Danny Taufik Hidayat, S.H.', jabatan: 'Verifikasi Administrasi', approved: true, approvedAt: '2026-10-20 11:30:00', approvedBy: 'Danny Taufik Hidayat, S.H.', hmacHash: 'c3d4e5f6a1b203', qrUrl: 'https://kjppnanangrahayu.com/verifikasi-dokumen.html?doc=OPR-SRV/2.19.0160-00/X/2026/0088&tier=3&hash=c3d4e5f6a1b203' },
        4: { tier: 4, label: 'Menyetujui', pejabat: 'Milda H', jabatan: 'Menyetujui', approved: true, approvedAt: '2026-10-20 13:45:00', approvedBy: 'Milda H', hmacHash: 'd4e5f6a1b2c304', qrUrl: 'https://kjppnanangrahayu.com/verifikasi-dokumen.html?doc=OPR-SRV/2.19.0160-00/X/2026/0088&tier=4&hash=d4e5f6a1b2c304' },
        5: { tier: 5, label: 'Penanggung Jawab', pejabat: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)', jabatan: 'Penanggung Jawab', approved: true, approvedAt: '2026-10-20 15:00:00', approvedBy: 'Ir. Nanang Rahayu', hmacHash: 'e5f6a1b2c3d405', qrUrl: 'https://kjppnanangrahayu.com/verifikasi-dokumen.html?doc=OPR-SRV/2.19.0160-00/X/2026/0088&tier=5&hash=e5f6a1b2c3d405' }
      }
    };

    // Render ke halaman
    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        siapkanDanCetakDokumen(${JSON.stringify(docShort)});
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Print to PDF A4 Portrait, margin 10mm
    console.log('5. Menghasilkan file PDF A4 Dokumen Pendek (Survey)...');
    const pdfShort = await cdpSend(ws, 'Page.printToPDF', {
      paperWidth: 8.27,
      paperHeight: 11.69,
      marginTop: 0.3937,
      marginBottom: 0.3937,
      marginLeft: 0.3937,
      marginRight: 0.3937,
      printBackground: true
    });
    const pathPdfShort = path.join(ARTIFACT_DIR, 'test_operasional_print_a4_survey.pdf');
    fs.writeFileSync(pathPdfShort, Buffer.from(pdfShort.data, 'base64'));
    console.log('✓ PDF Survey tersimpan: ' + pathPdfShort);

    // Ambil bukti visual preview area cetak
    const shotAreaCetak = await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        const area = document.getElementById('area-cetak');
        if (area) area.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 800));
    const shotCetak = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
    const pathShotCetak = path.join(ARTIFACT_DIR, 'test_operasional_print_a4_survey.png');
    fs.writeFileSync(pathShotCetak, Buffer.from(shotCetak.data, 'base64'));
    console.log('✓ Screenshot Survey Area Cetak tersimpan: ' + pathShotCetak);

    // Siapkan Dokumen 2: Multihalaman (Operasional Umum 25 Item)
    console.log('6. Mempersiapkan dokumen Multihalaman (25 Item Rincian Biaya)...');
    const rincian25 = [];
    for (let i = 1; i <= 25; i++) {
      rincian25.push({
        uraian: `Pengadaan ATK, Kertas HVS & Tinta Cetak Laporan Batch #${i}`,
        volume: i,
        satuan: 'Paket',
        hargaSatuan: 150000,
        subtotal: i * 150000
      });
    }

    const docLong = {
      id: 'OPR-20261020-UMUM-LONG',
      noRegistrasi: 'OPR-UMM/2.19.0160-00/X/2026/0099',
      jenisOperasional: 'OPR-UMM',
      jenisLabel: 'Operasional Umum & Pengadaan',
      kantor: 'Kantor Pusat Jakarta',
      kodeKantor: '2.19.0160-00',
      status: 'APPROVED',
      versi: 1,
      tglPengajuan: '2026-10-20',
      totalEstimasi: 48750000,
      catatanPemohon: 'Pengadaan logistik dan ATK operasional kuartal IV.',
      pemohon: { nama: 'Holik Kelana', jabatan: 'Staf Umum', cabang: 'Pusat' },
      umum: {
        kategori: 'ATK & Logistik Kantor',
        maksudTujuan: 'Pemenuhan kebutuhan percetakan laporan penilaian',
        rincianKebutuhan: rincian25
      },
      approvals: docShort.approvals
    };

    await cdpSend(ws, 'Runtime.evaluate', {
      expression: `
        siapkanDanCetakDokumen(${JSON.stringify(docLong)});
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    console.log('7. Menghasilkan file PDF A4 Dokumen Multihalaman...');
    const pdfLong = await cdpSend(ws, 'Page.printToPDF', {
      paperWidth: 8.27,
      paperHeight: 11.69,
      marginTop: 0.3937,
      marginBottom: 0.3937,
      marginLeft: 0.3937,
      marginRight: 0.3937,
      printBackground: true
    });
    const pathPdfLong = path.join(ARTIFACT_DIR, 'test_operasional_print_a4_multipage.pdf');
    fs.writeFileSync(pathPdfLong, Buffer.from(pdfLong.data, 'base64'));
    console.log('✓ PDF Multihalaman tersimpan: ' + pathPdfLong);

    ws.close();
  } finally {
    chrome.kill();
    php.kill();
    console.log('Cleanup selesai.');
  }
}

run().catch(err => {
  console.error('Error saat testing cetak:', err);
  process.exit(1);
});
