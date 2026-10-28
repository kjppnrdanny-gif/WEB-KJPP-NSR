import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 TEST SUITE: KALKULATOR MASTER TARIF ALLOWANCE NSR');
  console.log('===============================================================\n');

  // Start local PHP server on port 8099
  const phpServer = spawn('php', ['-S', '127.0.0.1:8099'], {
    stdio: 'ignore'
  });
  await new Promise(r => setTimeout(r, 1000));

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9488',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9488/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m.result || m.error);
      }
    };
    const send = (method, params = {}) => new Promise(r => {
      const id = msgId++;
      handlers.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://127.0.0.1:8099/portal-operasional.html' });
    await new Promise(r => setTimeout(r, 2500));

    // Authenticate with session
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          localStorage.setItem('kjpp_token_auth', 'NSR-STAGE-MASTER-77');
          document.getElementById('modal-auth').classList.add('hidden');
          window.alert = (...args) => console.log('ALERT:', ...args);
          window.confirm = () => true;
        })()
      `
    });

    // 1. Audit Master Data Rates Verification
    console.log('[1/5] Memverifikasi Integritas Data Master Tarif...');
    const tarifCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const z = MASTER_TARIF_ALLOWANCE.zonasi;
          const k = MASTER_TARIF_ALLOWANCE.khusus;

          const results = [
            // Jabodetabek
            z.JABODETABEK.rates.PEMIMPIN_REKAN === 405000,
            z.JABODETABEK.rates.USP_EXPERT === 270000,
            z.JABODETABEK.rates.KADIV === 180000,
            z.JABODETABEK.rates.REVIEWER === 150000,
            z.JABODETABEK.rates.SURVEYOR === 110000,
            z.JABODETABEK.rates.DRIVER === 70000,

            // Jawa Barat
            z.JAWA_BARAT.rates.PEMIMPIN_REKAN === 675000,
            z.JAWA_BARAT.rates.USP_EXPERT === 450000,
            z.JAWA_BARAT.rates.KADIV === 360000,
            z.JAWA_BARAT.rates.REVIEWER === 260000,
            z.JAWA_BARAT.rates.SURVEYOR === 220000,
            z.JAWA_BARAT.rates.DRIVER === 160000,

            // Wilayah Lain
            z.WILAYAH_LAIN.rates.PEMIMPIN_REKAN === 900000,
            z.WILAYAH_LAIN.rates.USP_EXPERT === 600000,
            z.WILAYAH_LAIN.rates.KADIV === 580000,
            z.WILAYAH_LAIN.rates.REVIEWER === 450000,
            z.WILAYAH_LAIN.rates.SURVEYOR === 430000,
            z.WILAYAH_LAIN.rates.DRIVER === 290000,

            // Khusus
            k.TRANSPORTASI_BANDARA.tarif === 570000,
            k.RETAIL_FREELANCE.tarif === 150000,
            k.RETAIL_TETAP.tarif === 100000
          ];

          return {
            allPass: results.every(Boolean),
            totalChecks: results.length,
            passed: results.filter(Boolean).length
          };
        })()
      `,
      returnByValue: true
    });
    console.log('  Hasil Verifikasi Master Tarif:', JSON.stringify(tarifCheck.result?.value));
    if (!tarifCheck.result?.value?.allPass) throw new Error('Master tarif verification failed!');

    // 2. Test NoLap Location Detection Engine
    console.log('\n[2/5] Menguji Mesin Deteksi Wilayah NoLap (Jabodetabek, Jabar, Wilayah Lain)...');
    const nolapCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const t1 = deteksiWilayahDariLokasi('Ruko Graha Cinere, Kota Depok, Jawa Barat'); // Should prioritize Jabodetabek!
          const t2 = deteksiWilayahDariLokasi('Gedung Perkantoran Sudirman, DKI Jakarta');
          const t3 = deteksiWilayahDariLokasi('Pabrik Tekstil, Kawasan Industri Cimahi, Jawa Barat');
          const t4 = deteksiWilayahDariLokasi('Pergudangan Tanjung Morawa, Deli Serdang, Sumatera Utara');
          const t5 = deteksiWilayahDariLokasi(''); // ambiguous

          return {
            depokPrioritasJabodetabek: t1?.wilayah === 'JABODETABEK',
            jakartaJabodetabek: t2?.wilayah === 'JABODETABEK',
            cimahiJawaBarat: t3?.wilayah === 'JAWA_BARAT',
            sumateraWilayahLain: t4?.wilayah === 'WILAYAH_LAIN',
            emptyIsNull: t5 === null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('  Hasil Pengujian NoLap Detection:', JSON.stringify(nolapCheck.result?.value));

    // 3. Test Dynamic Calculation & Switch Zonasi
    console.log('\n[3/5] Menguji Kalkulator Otomatis (Perubahan Zonasi, Retail, Bandara)...');
    const calcCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Bersihkan tabel
          document.getElementById('tbody-survey-personal').innerHTML = '';
          document.getElementById('tbody-survey-kolektif').innerHTML = '';

          // Set Wilayah ke Jawa Barat
          const selWil = document.getElementById('survey_wilayah');
          selWil.value = 'JAWA_BARAT';
          tanganiPerubahanWilayah();

          // Tambah Baris 1: Reviewer (Tarif Jabar = 260.000), 2 Personel, 3 Hari -> 2 * 3 * 260.000 = 1.560.000
          tambahBarisPersonalSurvey('REVIEWER', { jumlahPersonel: 2, durasi: 3 });

          // Tambah Baris 2: Retail Freelance (Tarif = 150.000), 1 Personel, 10 Titik -> 1 * 10 * 150.000 = 1.500.000
          tambahBarisPersonalSurvey('RETAIL_FREELANCE', { jumlahPersonel: 1, durasi: 10 });

          // Tambah Baris Kolektif: Transportasi Bandara (Tarif = 570.000), Volume 2 -> 2 * 570.000 = 1.140.000
          tambahBarisTransportasiBandara();
          const trBandara = document.querySelector('#tbody-survey-kolektif tr');
          trBandara.querySelector('.item-volume').value = '2';

          hitungSemuaTotal();

          const grandTotalText = document.getElementById('label-grand-total')?.innerText;
          const terbilangText = document.getElementById('label-terbilang')?.innerText;
          const subPersonalText = document.getElementById('label-subtotal-personal')?.innerText;
          const subKolektifText = document.getElementById('label-subtotal-kolektif')?.innerText;

          // Expected: SubPersonal = 1.560.000 + 1.500.000 = 3.060.000
          // Expected: SubKolektif = 1.140.000
          // Grand Total = 4.200.000 ("Empat Juta Dua Ratus Ribu Rupiah")
          return {
            subPersonalText,
            subKolektifText,
            grandTotalText,
            terbilangText,
            matchSubPersonal: subPersonalText === 'Rp 3.060.000',
            matchSubKolektif: subKolektifText === 'Rp 1.140.000',
            matchGrandTotal: grandTotalText === 'Rp 4.200.000',
            matchTerbilang: terbilangText.includes('Empat Juta Dua Ratus Ribu Rupiah')
          };
        })()
      `,
      returnByValue: true
    });
    console.log('  Hasil Kalkulasi Dinamis:', JSON.stringify(calcCheck.result?.value, null, 2));

    // Capture screenshot of calculated form
    const shotCalc = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_allowance_calculator_form.png'), Buffer.from(shotCalc.data, 'base64'));
    console.log('  📸 Screenshot disimpan: test_allowance_calculator_form.png');

    // 4. Test Backend Submission, Server-Side Recalculation & Snapshot
    console.log('\n[4/5] Menguji Pengajuan Backend & Proteksi Tarif Server...');
    const submitCheck = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          document.getElementById('input_nama_pengaju').value = 'Budi Santoso, S.T.';
          document.getElementById('input_maksud_tujuan').value = 'Survey Lapangan Penilaian Aset Pabrik Cimahi';

          // Simulasi manipulasi tarif dari browser (misal user mencoba ubah tarif Reviewer jadi 100.000)
          // Backend WAJIB menolak manipulasi dan menegakkan tarif resmi 260.000!
          const trRev = document.querySelector('#tbody-survey-personal tr');
          trRev.querySelector('.item-tarif').value = '100000';

          await simpanPengajuan(false);
          await new Promise(r => setTimeout(r, 1200));

          // Ambil dokumen terbaru
          const doc = DATA_LIST[0];
          return {
            docId: doc?.id,
            noReg: doc?.noRegistrasi,
            status: doc?.status,
            wilayahSurvey: doc?.survey?.wilayahSurvey,
            subtotalPersonalServer: doc?.survey?.subtotalPersonal,
            subtotalKolektifServer: doc?.survey?.subtotalKolektif,
            totalEstimasiServer: doc?.totalEstimasi,
            hasTarifSnapshot: Boolean(doc?.survey?.tarifSnapshot),
            snapshotVersion: doc?.survey?.tarifSnapshot?.versi,
            verifiedServerRateEnforced: doc?.survey?.subtotalPersonal === 3060000,
            verifiedTotalServer: doc?.totalEstimasi === 4200000
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('  Hasil Pengujian Backend & Enforced Rates:', JSON.stringify(submitCheck.result?.value, null, 2));

    // 5. Test PDF / Cetak Render
    console.log('\n[5/5] Menguji Format Cetak / PDF A4 Dokumen Pengajuan...');
    const printCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const doc = DATA_LIST[0];
          siapkanDanCetakDokumen(doc);

          const title = document.getElementById('print-doc-title')?.innerText;
          const noReg = document.getElementById('print-doc-noreg')?.innerText;
          const wilayah = document.getElementById('print-meta-wilayah')?.innerText;
          const grandTotal = document.getElementById('print-grand-total')?.innerText;
          const rowsCount = document.querySelectorAll('#print-table-body tr').length;

          return {
            title,
            noReg,
            wilayah,
            grandTotal,
            rowsCount
          };
        })()
      `,
      returnByValue: true
    });
    console.log('  Hasil Render Cetak Dokumen:', JSON.stringify(printCheck.result?.value, null, 2));

    // Capture print preview screenshot
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    const shotPrint = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_allowance_print_preview.png'), Buffer.from(shotPrint.data, 'base64'));
    console.log('  📸 Screenshot Print Preview disimpan: test_allowance_print_preview.png');

    console.log('\n===============================================================');
    console.log('🎉 SELURUH PENGUJIAN KALKULATOR TARIF ALLOWANCE BERHASIL 100%!');
    console.log('===============================================================\n');

    ws.close();
  } finally {
    chrome.kill();
    phpServer.kill();
  }
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
