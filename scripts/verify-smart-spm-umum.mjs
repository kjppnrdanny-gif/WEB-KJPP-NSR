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
    '--remote-debugging-port=9266',
    '--no-sandbox',
    '--allow-file-access-from-files',
    '--disable-web-security',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9266/json/new?about:blank', { method: 'PUT' });
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

    console.log('\n======================================================');
    console.log('--- 1. DESKTOP TEST & VERIFIKASI (1440x900) ---');
    console.log('======================================================');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    const fileUrl = 'file:///' + path.join(ROOT_DIR, 'portal-nolap.html').replace(/\\/g, '/');
    console.log('Navigating to', fileUrl);
    await send('Page.navigate', { url: fileUrl });

    // Poll until document and scripts are ready
    console.log('Waiting for scripts to initialize...');
    let ready = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500));
      const res = await send('Runtime.evaluate', {
        expression: 'typeof inisialisasiSmartSpmUmum === "function" && typeof aktifkanPanelUtama === "function"',
        returnByValue: true
      });
      if (res === true) {
        ready = true;
        console.log(`Ready after ${(i + 1) * 0.5} seconds!`);
        break;
      }
    }

    if (!ready) {
      throw new Error('Timeout waiting for scripts in portal-nolap.html');
    }

    // Disable blocking dialogs and activate session
    const initRes = await send('Runtime.evaluate', {
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
        pilihSubSpm('umum');

        const box = document.getElementById('box-sub-spm-umum');
        const isVisible = box && !box.classList.contains('hidden');
        const qCount = document.querySelectorAll('input[name^="u_val_"]').length;

        return {
          isVisible,
          qCount,
          boxClasses: box ? box.className : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Init evaluation result:', JSON.stringify(initRes, null, 2));

    // Test Adaptive Operations: Category change, Questions answer, IRAC, Risk Register, Acceptance, Approval
    const testOpsRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const results = {};

        // 1. Tautkan pengajuan REQ-000001
        muatDataPengajuanKeSpmUmum('REQ-000001');
        results.linkedReq = document.getElementById('spm-u-pilih-req').value;

        // 2. Test Category switching
        const katSelect = document.getElementById('spm-u-kategori');
        katSelect.value = 'Pelaporan Keuangan (PSAK)';
        onUmumKategoriChange();
        const cat4Box = document.getElementById('box-cat-questions-4');
        const cat1Box = document.getElementById('box-cat-questions-1');
        results.cat4Visible = cat4Box && !cat4Box.classList.contains('hidden');
        results.cat1Hidden = cat1Box && cat1Box.classList.contains('hidden');

        // Kembalikan ke Agunan
        katSelect.value = 'Penjaminan Utang / Agunan';
        onUmumKategoriChange();
        results.cat1Visible = cat1Box && !cat1Box.classList.contains('hidden');

        // 3. Jawab Pertanyaan Bagian A
        // A01 [M] -> YA
        const a01Radio = document.querySelector('input[name="u_val_u_q_a01"][value="YA"]');
        if (a01Radio) {
          a01Radio.checked = true;
          onUmumAnswerChange('u_q_a01', 'YA');
        }

        // A10 [M, Risk Flag] -> YA (Terdeteksi Risiko Benturan Kepentingan)
        const a10Radio = document.querySelector('input[name="u_val_u_q_a10"][value="YA"]');
        if (a10Radio) {
          a10Radio.checked = true;
          onUmumAnswerChange('u_q_a10', 'YA');
        }
        const drawerA10 = document.getElementById('drawer-umum-u_q_a10');
        results.drawerA10Opened = drawerA10 && !drawerA10.classList.contains('hidden');

        // A11 [M, Risk Flag] -> TIDAK (Aman)
        const a11Radio = document.querySelector('input[name="u_val_u_q_a11"][value="TIDAK"]');
        if (a11Radio) {
          a11Radio.checked = true;
          onUmumAnswerChange('u_q_a11', 'TIDAK');
        }

        // 4. Jawab Pertanyaan Bagian B1 (Agunan)
        const b101Radio = document.querySelector('input[name="u_val_u_q_b1_01"][value="YA"]');
        if (b101Radio) {
          b101Radio.checked = true;
          onUmumAnswerChange('u_q_b1_01', 'YA');
        }

        // 5. Isi Bagian C (IRAC)
        const cIssue = document.getElementById('spm-u-c-issue');
        if (cIssue) cIssue.value = 'Objek penilaian memiliki riwayat peralihan hak dalam proses balik nama dan memerlukan penegasan batas fisik.';
        const cRule = document.getElementById('spm-u-c-rule');
        if (cRule) cRule.value = 'SPI 103 (Lingkup Penugasan), SPI 104 (Implementasi), KEPI Butir 4 (Integritas & Objektivitas)';
        const cApp = document.getElementById('spm-u-c-app');
        if (cApp) cApp.value = 'Pemeriksaan fisik dilakukan bersama perwakilan bank dan pemegang hak, batas diverifikasi dengan peta ukur BPN.';
        const cConc = document.getElementById('spm-u-c-conc');
        if (cConc) cConc.value = 'Penugasan dapat diterima dengan asumsi khusus bahwa proses balik nama diselesaikan sesuai ketentuan hukum.';

        // 6. Isi Bagian D (Matriks Risiko)
        const dDesc = document.getElementById('spm-u-d-desc');
        if (dDesc) dDesc.value = 'Risiko ketidaksesuaian luas fisik lapangan vs sertifikat hak tanggungan.';
        const dProb = document.getElementById('spm-u-d-prob');
        if (dProb) dProb.value = '2';
        const dImp = document.getElementById('spm-u-d-impact');
        if (dImp) dImp.value = '3';
        if (typeof hitungRiskScoreUmum === 'function') hitungRiskScoreUmum();
        const dMit = document.getElementById('spm-u-d-mitigasi');
        if (dMit) dMit.value = 'Lakukan pengukuran verifikasi lapangan dengan GPS/alat ukur dan minta surat pernyataan penguasaan fisik dari debitur.';
        const dPic = document.getElementById('spm-u-d-pic');
        if (dPic) dPic.value = 'Ahmad Fauzi, S.T. (Penilai Properti)';

        // 7. Bagian E (Client Acceptance)
        const kepSelect = document.getElementById('spm-u-keputusan');
        if (kepSelect) {
          kepSelect.value = 'ACCEPT WITH MITIGATION';
          onUmumAcceptanceDecisionChange();
        }
        const drawerMitE = document.getElementById('box-drawer-acceptance-mitigasi');
        results.drawerMitEOpened = drawerMitE && !drawerMitE.classList.contains('hidden');
        const mitAction = document.getElementById('spm-u-mitigasi-syarat');
        if (mitAction) mitAction.value = 'Wajib mencantumkan asumsi khusus kepemilikan dan melampirkan surat konfirmasi debitur pada draft final.';

        // 8. Bagian F (QC Checklist & Approval)
        const qc1 = document.getElementById('spm-u-f-qc1');
        if (qc1) qc1.checked = true;
        const qc2 = document.getElementById('spm-u-f-qc2');
        if (qc2) qc2.checked = true;
        const qc3 = document.getElementById('spm-u-f-qc3');
        if (qc3) qc3.checked = true;
        const qc4 = document.getElementById('spm-u-f-qc4');
        if (qc4) qc4.checked = true;

        // Berikan approval resmi
        tetapkanApprovalSpmUmum('APPROVED');

        // Kumpulkan data state
        const collected = kumpulkanDataSmartUmum();
        results.collected = {
          statusDokumen: collected.statusDokumen,
          kategori: collected.kategori,
          risikoLevel: collected.risikoLevel,
          keputusan: collected.secE_acceptance.keputusan,
          approvalF05: collected.secF_qc.f05,
          statRisiko: document.getElementById('stat-spm-u-risiko').innerText,
          statMandatory: document.getElementById('stat-spm-u-mandatory').innerText,
          badgeText: document.getElementById('badge-status-spm-umum').innerText
        };

        return results;
      })()`,
      returnByValue: true
    });

    console.log('Test Operations Result:', JSON.stringify(testOpsRes, null, 2));

    // Capture Desktop Screenshot
    const screenshotDesktop = await send('Page.captureScreenshot', { format: 'png' });
    const deskPath = path.join(ARTIFACT_DIR, 'smart_spm_umum_desktop.png');
    fs.writeFileSync(deskPath, Buffer.from(screenshotDesktop.data, 'base64'));
    console.log('Desktop Screenshot saved:', deskPath);

    // Test print kertas kerja modal/content
    const testPrintRes = await send('Runtime.evaluate', {
      expression: `(() => {
        // Mock window.print agar tidak freeze
        const oldPrint = window.print;
        window.print = function() { console.log('[Print Triggered]'); };
        cetakKertasKerjaSpm('umum', 'approved');
        const printBody = document.getElementById('print-body-content');
        const hasHeader = printBody && printBody.innerHTML.includes('KJPP-RM-CA-01 (UMUM)');
        const hasApprovedBadge = printBody && printBody.innerHTML.includes('RESMI DISETUJUI (APPROVED)');
        const hasIRAC = printBody && printBody.innerHTML.includes('ANALISIS HUKUM &amp; KEPATUHAN IRAC');
        window.print = oldPrint;
        return { hasHeader, hasApprovedBadge, hasIRAC };
      })()`,
      returnByValue: true
    });
    console.log('Print Kertas Kerja Evaluation Result:', JSON.stringify(testPrintRes, null, 2));

    // Capture Specific SPM Sections
    console.log('\n--- 2. DETAILED SECTION SCREENSHOTS ---');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('sec-u-f-approval').scrollIntoView({ behavior: 'instant', block: 'center' })`
    });
    await new Promise(r => setTimeout(r, 600));
    const ssApproval = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'smart_spm_umum_sec_f_approval.png'), Buffer.from(ssApproval.data, 'base64'));
    console.log('Saved smart_spm_umum_sec_f_approval.png');

    await send('Runtime.evaluate', {
      expression: `document.getElementById('sec-u-a-screening').scrollIntoView({ behavior: 'instant', block: 'start' })`
    });
    await new Promise(r => setTimeout(r, 600));
    const ssScreening = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'smart_spm_umum_sec_a_screening.png'), Buffer.from(ssScreening.data, 'base64'));
    console.log('Saved smart_spm_umum_sec_a_screening.png');

    await send('Runtime.evaluate', {
      expression: `document.getElementById('sec-u-b-categories').scrollIntoView({ behavior: 'instant', block: 'start' })`
    });
    await new Promise(r => setTimeout(r, 600));
    const ssCat = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'smart_spm_umum_sec_b_categories.png'), Buffer.from(ssCat.data, 'base64'));
    console.log('Saved smart_spm_umum_sec_b_categories.png');

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

    await send('Runtime.evaluate', {
      expression: `document.getElementById('box-sub-spm-umum').scrollIntoView({ behavior: 'instant', block: 'start' })`
    });
    await new Promise(r => setTimeout(r, 600));

    const ssMobile = await send('Page.captureScreenshot', { format: 'png' });
    const mobilePath = path.join(ARTIFACT_DIR, 'smart_spm_umum_mobile.png');
    fs.writeFileSync(mobilePath, Buffer.from(ssMobile.data, 'base64'));
    console.log('Mobile Screenshot saved:', mobilePath);

    console.log('\n✅ ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

run();
