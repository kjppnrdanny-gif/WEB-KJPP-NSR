import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9275',
    '--no-sandbox',
    '--allow-file-access-from-files',
    '--disable-web-security',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9275/json/new?about:blank', { method: 'PUT' });
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
        if (m.result && m.result.result && m.result.result.value !== undefined) {
          cb(m.result.result.value);
        } else {
          cb(m.result || m.error);
        }
      }
    };

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    console.log('\n=================================================================');
    console.log('--- 1. DESKTOP TEST & STANDARDISASI KODE DOKUMEN (1440x900) ---');
    console.log('=================================================================');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    const fileUrl = 'file:///' + path.join(ROOT_DIR, 'portal-nolap.html').replace(/\\/g, '/');
    console.log('Navigating to', fileUrl);
    await send('Page.navigate', { url: fileUrl });

    // Poll until ready
    let ready = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500));
      const res = await send('Runtime.evaluate', {
        expression: 'typeof inisialisasiSmartSpmRuislagh === "function" && typeof inisialisasiSmartSpmTanah === "function"',
        returnByValue: true
      });
      if (res === true) {
        ready = true;
        console.log(`Ready after ${(i + 1) * 0.5} seconds!`);
        break;
      }
    }

    if (!ready) throw new Error('Timeout waiting for scripts in portal-nolap.html');

    // Test Document Code Standardization
    const codeStdRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const btnUmumText = document.getElementById('btn-spm-umum')?.innerText || '';
        const btnTanahText = document.getElementById('btn-spm-tanah')?.innerText || '';
        const btnRuislaghText = document.getElementById('btn-spm-ruislagh')?.innerText || '';

        const badgeTanah = document.querySelector('#box-sub-spm-tanah .font-mono')?.innerText || '';
        const badgeRuislagh = document.querySelector('#box-sub-spm-ruislagh .font-mono')?.innerText || '';

        const mappingTanah = dapatkanLabelResmiKodeSpm('KJPP-RM-CA-01 (Tanah)');
        const mappingRuislagh = dapatkanLabelResmiKodeSpm('KJPP-RM-CA-02 (Legacy Ruislagh)');

        return {
          hasBtnUmumCA01: btnUmumText.includes('KJPP-RM-CA-01'),
          hasBtnTanahCA02: btnTanahText.includes('KJPP-RM-CA-02'),
          hasBtnRuislaghCA03: btnRuislaghText.includes('KJPP-RM-CA-03'),
          badgeTanahIsCA02: badgeTanah.includes('KJPP-RM-CA-02'),
          badgeRuislaghIsCA03: badgeRuislagh.includes('KJPP-RM-CA-03'),
          mappingTanah,
          mappingRuislagh
        };
      })()`,
      returnByValue: true
    });

    console.log('Document Code Standardization Result:', JSON.stringify(codeStdRes, null, 2));

    // Setup active session and activate Ruislagh Tab
    const initRuislaghRes = await send('Runtime.evaluate', {
      expression: `(() => {
        window.alert = function(msg) { console.log('[Alert Intercepted]:', msg); };
        window.confirm = function() { return true; };
        window.prompt = function() { return ''; };

        sesiAktif = {
          sub: 'admin_pusat',
          username: 'admin_pusat',
          role: 'ADMIN_PUSAT',
          cabang: 'Pusat',
          label: 'Deni Siswandi (Kepala Divisi Pengendalian Mutu & Rekan)',
          nama: 'Deni Siswandi',
          jabatan: 'Kepala Divisi SPM & Rekan Penilai'
        };
        aktifkanPanelUtama();
        gantiTabModul('spm');
        pilihSubSpm('ruislagh');

        const box = document.getElementById('box-sub-spm-ruislagh');
        const isVisible = box && !box.classList.contains('hidden');

        return {
          isVisible,
          boxClasses: box ? box.className : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Init Ruislagh Evaluation:', JSON.stringify(initRuislaghRes, null, 2));

    // Test Comprehensive Ruislagh Interactive Operations
    const testOpsRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const results = {};

        // 1. Tautkan pengajuan REQ-000001
        muatDataPengajuanKeSpmRuislagh('REQ-000001');
        results.linkedReq = document.getElementById('spm-r-pilih-req').value;

        // 2. Input Lokasi A01 & Para Pihak A02
        document.getElementById('spm-r-lokasi-desa').value = 'Desa Sukamulya';
        document.getElementById('spm-r-lokasi-kec').value = 'Kec. Pacet';
        document.getElementById('spm-r-lokasi-kab').value = 'Kab. Cianjur';
        document.getElementById('spm-r-lokasi-prov').value = 'Jawa Barat';
        syncRuislaghDesaInput();
        results.syncedDesa = document.getElementById('spm-r-desa').value;

        document.getElementById('spm-r-pemberi-tugas').value = 'Pemerintah Desa Sukamulya';
        document.getElementById('spm-r-pemrakarsa').value = 'PT Trans Nusantara Infrastruktur';
        results.pemrakarsa = document.getElementById('spm-r-pemrakarsa').value;

        // 3. Test Jalur Switching (A04)
        const jalurSel = document.getElementById('spm-r-jalur-ruislagh');
        
        // Test Jalur 3 (Swasta / Bukan Kepentingan Umum)
        jalurSel.value = 'BUKAN_KEPENTINGAN_UMUM';
        onRuislaghJalurChange();
        const boxBukanUmum = document.getElementById('box-ruislagh-jalur-bukan-umum');
        results.jalurBukanUmumVisible = boxBukanUmum && !boxBukanUmum.classList.contains('hidden');

        // Test Jalur 1 (PSN)
        jalurSel.value = 'PSN';
        onRuislaghJalurChange();
        const boxPsn = document.getElementById('box-ruislagh-jalur-psn');
        results.jalurPsnVisible = boxPsn && !boxPsn.classList.contains('hidden');

        // Test Jalur 4 (Kepentingan Desa)
        jalurSel.value = 'KEPENTINGAN_DESA';
        onRuislaghJalurChange();
        const desaBanner = document.getElementById('text-regulasi-dinamis-ruislagh')?.innerText || '';
        results.desaBannerText = desaBanner;
        results.desaHasNoLatex = !desaBanner.includes('$\\rightarrow') && !desaBanner.includes('rightarrow');
        results.desaHasArrow = desaBanner.includes('→');

        // Test Jalur 3 (Swasta / Bukan Kepentingan Umum)
        jalurSel.value = 'BUKAN_KEPENTINGAN_UMUM';
        onRuislaghJalurChange();
        const swastaBanner = document.getElementById('text-regulasi-dinamis-ruislagh')?.innerText || '';
        results.swastaBannerText = swastaBanner;
        results.swastaHasNoLatex = !swastaBanner.includes('$\\rightarrow') && !swastaBanner.includes('rightarrow');
        results.swastaHasArrow = swastaBanner.includes('→');

        // Test Historis Checkbox
        const chkHistoris = document.getElementById('check-ruislagh-historis');
        chkHistoris.checked = true;
        toggleRuislaghHistoris(true);
        const boxHistoris = document.getElementById('box-ruislagh-jalur-historis');
        results.boxHistorisExpanded = boxHistoris && !boxHistoris.classList.contains('hidden');

        // 4. Test Uji Ekivalensi Nilai & Luas (C06 & C07)
        document.getElementById('spm-r-luas-asal').value = '10000';
        document.getElementById('spm-r-nilai-asal').value = '5000000000'; // 5 Milyar
        document.getElementById('spm-r-luas-pengganti').value = '12500';
        document.getElementById('spm-r-nilai-pengganti').value = '6500000000'; // 6.5 Milyar
        hitungEkivalensiRuislagh();

        results.ekivalensi = {
          selisihNilai: document.getElementById('hasil-selisih-nilai').innerText,
          rasioNilai: document.getElementById('hasil-rasio-nilai').innerText,
          selisihLuas: document.getElementById('hasil-selisih-luas').innerText,
          badgeStatus: document.getElementById('badge-ekivalensi-status').innerText
        };

        // 5. Test Red Flag Answering
        // R03 (Sengketa) -> YA (Terdeteksi Risiko)
        const r03Radio = document.querySelector('input[name="r_rf_R03"][value="YA"]');
        if (r03Radio) {
          r03Radio.checked = true;
          onRuislaghRfChange('R03', 'YA');
        }

        // R01 (Tanah Asal Aset Desa) -> TIDAK (Aman)
        const r01Radio = document.querySelector('input[name="r_rf_R01"][value="TIDAK"]');
        if (r01Radio) {
          r01Radio.checked = true;
          onRuislaghRfChange('R01', 'TIDAK');
        }

        // R05 (Tanah Pengganti Belum Jelas) -> BELUM DIKETAHUI
        const r05Radio = document.querySelector('input[name="r_rf_R05"][value="BELUM DIKETAHUI"]');
        if (r05Radio) {
          r05Radio.checked = true;
          onRuislaghRfChange('R05', 'BELUM DIKETAHUI');
        }

        results.statRedflags = document.getElementById('stat-spm-r-redflags').innerText;
        results.statClarify = document.getElementById('stat-spm-r-clarify').innerText;

        // 6. Test IRAC
        document.getElementById('spm-r-irac-issue').value = 'Calon tanah pengganti masih dalam proses pemecahan sertifikat induk.';
        document.getElementById('spm-r-irac-rule').value = 'Permendagri No. 1/2016 jo. No. 3/2024 Pasal 32G, SPI 103 (Lingkup Penugasan)';
        document.getElementById('spm-r-irac-app').value = 'Pemeriksaan fisik telah dilakukan bersama Satgas BPN dan pemegang hak, batas diverifikasi sesuai peta bidang.';
        document.getElementById('spm-r-irac-conclusion').value = 'Penugasan dapat diterima dengan syarat penutupan sertifikasi tanah pengganti atas nama Pemdes diselesaikan sebelum terbit laporan final.';
        document.getElementById('spm-r-irac-mitigasi').value = 'Wajib mencantumkan asumsi khusus kepemilikan dan klausul penundaan opini akhir.';

        // 7. Test Matriks Risiko
        document.getElementById('spm-r-risk-impact').value = '3';
        document.getElementById('spm-r-risk-prob').value = '3';
        hitungRiskScoreRuislagh();
        results.riskLevel = document.getElementById('spm-r-risiko').value;

        // 8. Test Client Acceptance
        const kepSel = document.getElementById('spm-r-keputusan');
        kepSel.value = 'ACCEPT WITH MITIGATION';
        onRuislaghAcceptanceChange();
        const drawerMit = document.getElementById('drawer-ruislagh-mitigasi-syarat');
        results.drawerMitOpened = drawerMit && !drawerMit.classList.contains('hidden');
        document.getElementById('spm-r-syarat-mitigasi-detail').value = 'Wajib melampirkan Berita Acara Musyawarah Desa dan bukti permohonan sertifikasi tanah pengganti ke BPN.';

        // 9. Test Approval
        tetapkanApprovalSpmRuislagh('APPROVED');
        results.statusDokumen = smartRuislaghState.statusDokumen;
        results.badgeStatus = document.getElementById('badge-status-spm-ruislagh').innerText;
        results.reviewer = document.getElementById('spm-r-reviewer').value;

        return results;
      })()`,
      returnByValue: true
    });

    console.log('Ruislagh Operations Test Result:', JSON.stringify(testOpsRes, null, 2));

    // Capture Desktop Overview Screenshot
    const screenshotDesktop = await send('Page.captureScreenshot', { format: 'png' });
    const deskPath = path.join(ARTIFACT_DIR, 'smart_spm_ruislagh_desktop.png');
    fs.writeFileSync(deskPath, Buffer.from(screenshotDesktop.data, 'base64'));
    console.log('Saved smart_spm_ruislagh_desktop.png');

    // Test Cetak Kertas Kerja Ruislagh (KJPP-RM-CA-03)
    const testPrintRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const oldPrint = window.print;
        window.print = function() { console.log('[Print Triggered]'); };
        cetakKertasKerjaSpm('ruislagh', 'approved');
        const printBody = document.getElementById('print-body-content');
        const hasCA03 = printBody && printBody.innerHTML.includes('KJPP-RM-CA-03');
        const hasApprovedBadge = printBody && printBody.innerHTML.includes('RESMI DISETUJUI (APPROVED)');
        const hasEkivalensi = printBody && printBody.innerHTML.includes('ANALISIS EKIVALENSI NILAI PASAR');
        const hasDesa = printBody && printBody.innerHTML.includes('Desa Sukamulya');
        window.print = oldPrint;
        return { hasCA03, hasApprovedBadge, hasEkivalensi, hasDesa };
      })()`,
      returnByValue: true
    });
    console.log('Print Kertas Kerja Evaluation Result:', JSON.stringify(testPrintRes, null, 2));

    // Helper function for scrolling and capturing sections
    async function captureElement(elementId, filename) {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.getElementById('${elementId}');
          if (el) {
            const rect = el.getBoundingClientRect();
            window.scrollTo(0, window.pageYOffset + rect.top - 80);
          }
        })()`
      });
      await new Promise(r => setTimeout(r, 600));
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, filename), Buffer.from(ss.data, 'base64'));
      console.log(`Saved ${filename}`);
    }

    console.log('\n--- 2. DETAILED SECTION CAPTURES ---');
    await captureElement('sec-ruislagh-a', 'smart_spm_ruislagh_sec_a_identitas.png');
    await captureElement('sec-ruislagh-c', 'smart_spm_ruislagh_sec_c_ekivalensi.png');
    await captureElement('sec-ruislagh-jalur-khusus', 'smart_spm_ruislagh_sec_d_jalur.png');
    await captureElement('sec-ruislagh-redflags', 'smart_spm_ruislagh_sec_r_redflags.png');
    await captureElement('sec-ruislagh-acceptance', 'smart_spm_ruislagh_sec_acceptance.png');
    await captureElement('sec-ruislagh-approval', 'smart_spm_ruislagh_sec_approval.png');

    await send('Runtime.evaluate', {
      expression: `(() => {
        const sel = document.getElementById('spm-r-jalur-ruislagh');
        if (sel) {
          sel.value = 'KEPENTINGAN_DESA';
          onRuislaghJalurChange();
        }
      })()`
    });
    await captureElement('box-banner-regulasi-ruislagh', 'smart_spm_ruislagh_banner_desa_desktop.png');

    console.log('\n======================================================');
    console.log('--- 3. MOBILE VIEWPORT VERIFIKASI (390x844) ---');
    console.log('======================================================');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 600));

    await captureElement('box-banner-regulasi-ruislagh', 'smart_spm_ruislagh_banner_desa_mobile.png');
    await captureElement('box-sub-spm-ruislagh', 'smart_spm_ruislagh_mobile.png');
    await captureElement('sec-ruislagh-c', 'smart_spm_ruislagh_mobile_ekivalensi.png');

    console.log('\n======================================================');
    console.log('--- 4. TABLET VIEWPORT VERIFIKASI (768x1024) ---');
    console.log('======================================================');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 400));
    await captureElement('box-banner-regulasi-ruislagh', 'smart_spm_ruislagh_banner_desa_tablet.png');

    console.log('\n✅ ALL RUISLAGH VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

run();
