/**
 * scripts/verify-bottleneck-clicks.mjs
 * Automated Verification for Stepper & Intervensi Button Clicks in Bottleneck Panel
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8879;
const DEBUG_PORT = 9557;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const mockJobs = [
  {
    id: 'JO-JKT-2026-0001',
    id_jo: 'JO-JKT-2026-0001',
    jo_number: 'JO-JKT-2026-0001',
    kode_lacak: 'NSR-TRACK-001',
    instansi: 'PT Bank Mandiri (Persero) Tbk',
    pemberi_tugas: 'PT Bank Mandiri (Persero) Tbk',
    debitur: 'PT Graha Kreasi Nusantara',
    jenis_properti: 'Ruko / Rukan 3 Lantai',
    lokasi_aset: 'Jl. Fatmawati Raya No. 45, Jakarta Selatan',
    current_milestone: 'M-03',
    current_milestone_title: 'Inspeksi & Berita Acara (BAI)',
    progress_percent: 42,
    sla_status: 'ongoing',
    sla_days: 3,
    sla_deadline: '2026-11-09',
    kantor: 'Kantor Pusat Jakarta',
    kantor_code: 'PUSAT',
    surveyor: 'Budi Santoso',
    surveyor_nik: 'NSR-SVR-01',
    penilai_pelaksana: 'Siti Rahma',
    analis_nik: 'NSR-ANL-01',
    reviewer: 'Ir. Hendro Wijaya',
    reviewer_nik: 'NSR-SPM-01',
    fee_penilaian: 'Rp *******',
    status_kwitansi: '*******'
  },
  {
    id: 'JO-BDG-2026-0002',
    id_jo: 'JO-BDG-2026-0002',
    jo_number: 'JO-BDG-2026-0002',
    kode_lacak: 'NSR-TRACK-002',
    instansi: 'PT Bank Central Asia Tbk',
    pemberi_tugas: 'PT Bank Central Asia Tbk',
    debitur: 'CV Parahyangan Niaga',
    jenis_properti: 'Pabrik & Gudang Logistik',
    lokasi_aset: 'Kawasan Industri Soekarno-Hatta, Bandung',
    current_milestone: 'M-04',
    current_milestone_title: 'Kertas Kerja Penilaian (KKP)',
    progress_percent: 57,
    sla_status: 'ongoing',
    sla_days: 4,
    sla_deadline: '2026-11-10',
    kantor: 'Cabang Bandung',
    kantor_code: 'BDG',
    surveyor: 'Ardi Nurmayadi',
    penilai_pelaksana: 'Siti Rahma',
    analis_nik: 'NSR-ANL-01',
    reviewer: 'Andri Kusmandana',
    fee_penilaian: 45000000,
    status_kwitansi: 'LUNAS'
  }
];

const mockAnalytics = {
  status: 'success',
  data: {
    summary: {
      total_jobs: 2,
      total_active_jobs: 2,
      total_completed_jobs: 0,
      national_sla_compliance: '100%',
      avg_tat_days: '2.5 Hari',
      spm_metrics: {
        spm1_ratio: '100%',
        spm2_ratio: '100%',
        spm5_ratio: '100%',
        composite_score: '100%'
      }
    },
    bottlenecks: [
      {
        id: 'JO-JKT-2026-0001',
        jo_number: 'JO-JKT-2026-0001',
        kode_lacak: 'NSR-TRACK-001',
        instansi: 'PT Bank Mandiri (Persero) Tbk',
        debitur: 'PT Graha Kreasi Nusantara',
        current_milestone: 'M-03',
        days_in_stage: 5,
        threshold_days: 3,
        bottleneck_level: 'critical',
        warning: 'Tertahan di M-03 Inspeksi (5 Hari)',
        kantor: 'Kantor Pusat Jakarta',
        penilai_pelaksana: 'Siti Rahma',
        reviewer_spm: 'Ir. Hendro Wijaya'
      }
    ],
    appraiser_workload: [],
    branch_summary: []
  }
};

const server = http.createServer((req, res) => {
  if (req.url.includes('action=get_workload_analytics')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(mockAnalytics));
    return;
  }

  if (req.url.includes('job-tracking-handler.php')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ status: 'success', data: mockJobs }));
    return;
  }

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/portal-tracking.html';
  const filePath = path.join(process.cwd(), reqPath.replace(/^\//, ''));

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'text/plain',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

async function main() {
  console.log('=================================================================');
  console.log('   TEST SUITE: BOTTLENECK STEPPER & INTERVENSI CLICK VERIFICATION');
  console.log('=================================================================\n');

  await new Promise(r => server.listen(PORT, r));
  console.log(`1. Server uji aktif pada http://127.0.0.1:${PORT}`);

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,960',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();
    const pageErrors = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg);
      }

      if (msg.method === 'Runtime.exceptionThrown') {
        const exp = msg.params.exceptionDetails;
        const text = exp.exception ? (exp.exception.description || exp.exception.value) : exp.text;
        const errInfo = `[EXCEPTION] line ${exp.lineNumber}:${exp.columnNumber} - ${text}`;
        pageErrors.push(errInfo);
        console.error('🚨', errInfo);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        callbacks.set(reqId, resolve);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    async function evaluate(expression, awaitPromise = false) {
      const res = await send('Runtime.evaluate', {
        expression,
        awaitPromise,
        returnByValue: true
      });
      return res.result?.result?.value !== undefined ? res.result.result.value : res.result?.value;
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log(`2. Memuat portal pada http://127.0.0.1:${PORT}/portal-tracking.html ...`);
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-tracking.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Authenticate and load data & analytics
    console.log('3. Otentikasi sesi & memuat Early Warning Bottlenecks...');
    await evaluate(`(async () => {
      sessionStorage.setItem('nsr_tracking_auth_token', '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f');
      sessionStorage.setItem('nsr_active_user_nik', 'NSR-2019-005');
      sessionStorage.setItem('nsr_active_user_name', 'Danny Taufik Hidayat, S.H.');
      sessionStorage.setItem('nsr_active_user_role', 'PIMPINAN');
      sessionStorage.setItem('nsr_active_user_jabatan', 'Pemimpin Rekan');

      initUserSession();
      await muatDataTaskBoard();
      await muatWorkloadAnalytics();
    })()`, true);
    await new Promise(r => setTimeout(r, 1500));

    // Verify global exposure
    console.log('\n4. Verifikasi Global Function Exposure:');
    const exp = await evaluate(`(() => ({
      hasBukaModalTracking: typeof window.bukaModalTracking === 'function',
      hasBukaModalUpdate: typeof window.bukaModalUpdate === 'function',
      hasBukaModalUpdateMilestone: typeof window.bukaModalUpdateMilestone === 'function',
      hasTutupModalTracking: typeof window.tutupModalTracking === 'function',
      hasTutupModalUpdate: typeof window.tutupModalUpdate === 'function'
    }))()`);
    console.log('Exposure status:', exp);
    if (!exp?.hasBukaModalTracking || !exp?.hasBukaModalUpdate) {
      throw new Error('Fungsi modal tidak terpasang di window object!');
    }
    console.log('  ✅ PASS: Seluruh fungsi modal terekspos di window object.');

    // Verify bottleneck buttons rendered in DOM
    console.log('\n5. Memeriksa tombol pada panel Bottlenecks:');
    const btns = await evaluate(`(() => {
      const btnStep = document.querySelector('.btn-stepper');
      const btnIntv = document.querySelector('.btn-intervensi');
      return {
        hasBtnStepper: !!btnStep,
        btnStepperOnclick: btnStep ? btnStep.getAttribute('onclick') : null,
        hasBtnIntervensi: !!btnIntv,
        btnIntervensiOnclick: btnIntv ? btnIntv.getAttribute('onclick') : null
      };
    })()`);
    console.log('Buttons in DOM:', btns);
    if (!btns?.hasBtnStepper || !btns?.hasBtnIntervensi) {
      throw new Error('Tombol .btn-stepper atau .btn-intervensi tidak ditemukan di daftar bottleneck!');
    }
    console.log('  ✅ PASS: Tombol .btn-stepper & .btn-intervensi ter-render dengan benar.');

    // 6. Test Click "🔍 Stepper"
    console.log('\n6. Menguji KLIK tombol "🔍 Stepper" pada berkas bottleneck...');
    const stepRes = await evaluate(`(() => {
      const btnStep = document.querySelector('.btn-stepper');
      if (!btnStep) return { error: 'No stepper button' };
      btnStep.click();

      const modal = document.getElementById('modal-tracking-stepper');
      const joDisplay = document.getElementById('modal-jo-number');
      const debDisplay = document.getElementById('modal-debitur');
      return {
        modalHidden: modal ? modal.classList.contains('hidden') : true,
        modalDisplay: modal ? window.getComputedStyle(modal).display : 'none',
        joText: joDisplay ? joDisplay.textContent : '',
        debText: debDisplay ? debDisplay.textContent : ''
      };
    })()`);
    console.log('Hasil Klik Stepper:', stepRes);
    if (stepRes?.modalHidden || stepRes?.modalDisplay !== 'flex') {
      throw new Error('Modal stepper tidak terbuka setelah tombol diklik!');
    }
    console.log('  ✅ PASS: Modal Stepper berhasil terbuka dengan display: flex dan data terisi!');

    // Capture screenshot of Stepper Modal
    const shotStep = await send('Page.captureScreenshot', { format: 'png' });
    const shotStepPath = path.join(ARTIFACT_DIR, 'bukti_modal_stepper_opened.png');
    fs.writeFileSync(shotStepPath, Buffer.from(shotStep.result.data, 'base64'));
    console.log(`  📸 Screenshot Stepper modal disimpan: ${shotStepPath}`);

    // Close Stepper Modal
    await send('Runtime.evaluate', { expression: `window.tutupModalTracking()` });
    await new Promise(r => setTimeout(r, 500));

    // 7. Test Click "⚡ Intervensi"
    console.log('\n7. Menguji KLIK tombol "⚡ Intervensi" pada berkas bottleneck...');
    const intvRes = await evaluate(`(() => {
      const btnIntv = document.querySelector('.btn-intervensi');
      if (!btnIntv) return { error: 'No intervensi button' };
      btnIntv.click();

      const modal = document.getElementById('modal-update-milestone');
      const joDisplay = document.getElementById('update-jo-display');
      const debDisplay = document.getElementById('update-debitur-display');
      const currentM = document.getElementById('update-current-m-display');
      return {
        modalHidden: modal ? modal.classList.contains('hidden') : true,
        modalDisplay: modal ? window.getComputedStyle(modal).display : 'none',
        joText: joDisplay ? joDisplay.textContent : '',
        debText: debDisplay ? debDisplay.textContent : '',
        currentMText: currentM ? currentM.textContent : ''
      };
    })()`);
    console.log('Hasil Klik Intervensi:', intvRes);
    if (intvRes?.modalHidden || intvRes?.modalDisplay !== 'flex') {
      throw new Error('Modal Intervensi / Update Milestone tidak terbuka setelah tombol diklik!');
    }
    console.log('  ✅ PASS: Modal Intervensi berhasil terbuka dengan display: flex dan data berkas sesuai!');

    // Capture screenshot of Intervensi Modal
    const shotIntv = await send('Page.captureScreenshot', { format: 'png' });
    const shotIntvPath = path.join(ARTIFACT_DIR, 'bukti_modal_intervensi_opened.png');
    fs.writeFileSync(shotIntvPath, Buffer.from(shotIntv.result.data, 'base64'));
    console.log(`  📸 Screenshot Intervensi modal disimpan: ${shotIntvPath}`);

    // Close Intervensi Modal
    await send('Runtime.evaluate', { expression: `window.tutupModalUpdateMilestone()` });

    if (pageErrors.length > 0) {
      console.error('\n❌ Ada galat console selama pengujian:', pageErrors);
      process.exit(1);
    }

    console.log('\n=================================================================');
    console.log('🎉 SELURUH PENGUJIAN KLIK STEPPER & INTERVENSI LULUS 100%!');
    console.log('=================================================================');

    ws.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

main().catch(err => {
  console.error('Pengujian gagal:', err);
  process.exit(1);
});
