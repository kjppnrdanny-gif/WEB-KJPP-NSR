import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Import backend handler and auth tools directly for unit/integration testing
import nolapProxyHandler, { _resetDummyDatabase } from '../netlify/functions/nolap-data-proxy.mjs';
import { createSessionToken, ROLES } from '../netlify/functions/lib/auth-core.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const results = [];

function recordTest(id, name, status, details = '') {
  results.push({ id, name, status, details });
  const icon = status === 'PASSED' ? '✅' : '❌';
  console.log(`${icon} [${id}] ${name}: ${status}`);
  if (details) console.log(`   └─ ${details}`);
}

async function runHardeningVerification() {
  console.log('\n======================================================');
  console.log('HARDENING VERIFICATION SUITE — KJPP NSR PORTAL & SPM');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // TEST 1: HOSTING ACCESS & CREDENTIAL AUDIT
  // -------------------------------------------------------------------------
  try {
    const uploadScriptPath = path.join(ARTIFACT_DIR, 'scratch', 'upload_portal_nolap.ps1');
    let hasEnvVars = false;
    let hasTls = false;
    let noPlaintextPass = true;

    if (fs.existsSync(uploadScriptPath)) {
      const scriptContent = fs.readFileSync(uploadScriptPath, 'utf8');
      hasEnvVars = scriptContent.includes('$env:NSR_FTP_USER') && scriptContent.includes('$env:NSR_FTP_PASS');
      hasTls = scriptContent.includes('EnableSsl = $true');
      // Periksa apakah ada password plaintext dalam format ftp://user:pass@host
      if (/ftps?:\/\/[^\s:]+:[^\s@]+@/i.test(scriptContent)) {
        noPlaintextPass = false;
      }
    }

    if (hasEnvVars && hasTls && noPlaintextPass) {
      recordTest('SEC-01', 'Hosting Access & FTPS TLS/SSL Parameterization', 'PASSED',
        'Upload script parameterizes $env:NSR_FTP_USER/$env:NSR_FTP_PASS with TLS/SSL FTPS encryption. No hardcoded password found.');
    } else {
      recordTest('SEC-01', 'Hosting Access & FTPS TLS/SSL Parameterization', 'FAILED',
        `hasEnvVars=${hasEnvVars}, hasTls=${hasTls}, noPlaintextPass=${noPlaintextPass}`);
    }
  } catch (err) {
    recordTest('SEC-01', 'Hosting Access & FTPS TLS/SSL Parameterization', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: BACKEND RBAC — BRANCH ISOLATION (CROSS-BRANCH ACCESS DENIAL)
  // -------------------------------------------------------------------------
  try {
    _resetDummyDatabase();

    // Buat token session untuk Staf Cabang Padang
    const tokenPadang = await createSessionToken({
      sub: 'staf_padang_test',
      role: ROLES.CABANG,
      branch: 'Padang',
      displayName: 'Staf Cabang Padang'
    });

    // Simulasi GET permohonan Bandung (REQ-DUMMY-001) oleh Cabang Padang
    const reqCrossGet = new Request('http://localhost/api/nolap-data-proxy?noPermintaan=REQ-DUMMY-001', {
      method: 'GET',
      headers: {
        'authorization': `Bearer ${tokenPadang}`
      }
    });

    const resCrossGet = await nolapProxyHandler(reqCrossGet);
    const bodyCrossGet = await resCrossGet.json();

    const isGetBlocked = resCrossGet.status === 403 && bodyCrossGet.violation === 'CROSS_BRANCH_ACCESS_DENIED';

    // Simulasi POST saveMitigasi permohonan Bandung (REQ-DUMMY-001) oleh Cabang Padang
    const reqCrossPost = new Request('http://localhost/api/nolap-data-proxy', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${tokenPadang}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        action: 'saveMitigasi',
        payload: {
          noPermintaan: 'REQ-DUMMY-001', // Milik Bandung
          tipeMitigasi: 'tanah',
          mitigasiData: { statusDokumen: 'DRAFT', secA: { namaProyek: 'Manipulasi Lintas Cabang' } }
        }
      })
    });

    const resCrossPost = await nolapProxyHandler(reqCrossPost);
    const bodyCrossPost = await resCrossPost.json();

    const isPostBlocked = resCrossPost.status === 403 && bodyCrossPost.violation === 'CROSS_BRANCH_MITIGASI_TAMPERING_ATTEMPT';

    if (isGetBlocked && isPostBlocked) {
      recordTest('SEC-02', 'Backend RBAC — Cross-Branch Tampering Enforcement', 'PASSED',
        'Server successfully rejected cross-branch read (403 CROSS_BRANCH_ACCESS_DENIED) and modification (403 CROSS_BRANCH_MITIGASI_TAMPERING_ATTEMPT).');
    } else {
      recordTest('SEC-02', 'Backend RBAC — Cross-Branch Tampering Enforcement', 'FAILED',
        `isGetBlocked=${isGetBlocked} (status ${resCrossGet.status}), isPostBlocked=${isPostBlocked} (status ${resCrossPost.status})`);
    }
  } catch (err) {
    recordTest('SEC-02', 'Backend RBAC — Cross-Branch Tampering Enforcement', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: BACKEND APPROVAL — UNAUTHORIZED APPROVAL REJECTION
  // -------------------------------------------------------------------------
  try {
    const tokenPadang = await createSessionToken({
      sub: 'staf_padang_test',
      role: ROLES.CABANG,
      branch: 'Padang',
      displayName: 'Staf Cabang Padang'
    });

    // Cabang Padang mencoba menyetujui permohonan Padang sendiri (REQ-DUMMY-002)
    const reqFakeApproval = new Request('http://localhost/api/nolap-data-proxy', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${tokenPadang}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        action: 'saveMitigasi',
        payload: {
          noPermintaan: 'REQ-DUMMY-002', // Milik Padang
          tipeMitigasi: 'tanah',
          mitigasiData: {
            statusDokumen: 'APPROVED', // Upaya self-approval tidak sah!
            secF_acceptance: { keputusan: 'APPROVED' }
          }
        }
      })
    });

    const resFakeApproval = await nolapProxyHandler(reqFakeApproval);
    const bodyFakeApproval = await resFakeApproval.json();

    if (resFakeApproval.status === 403 && bodyFakeApproval.violation === 'UNAUTHORIZED_MITIGATION_APPROVAL_ATTEMPT') {
      recordTest('SEC-03', 'Backend Approval — Branch Self-Approval Rejection', 'PASSED',
        'Server strictly rejected branch approval claim with 403 UNAUTHORIZED_MITIGATION_APPROVAL_ATTEMPT.');
    } else {
      recordTest('SEC-03', 'Backend Approval — Branch Self-Approval Rejection', 'FAILED',
        `Status=${resFakeApproval.status}, Error=${JSON.stringify(bodyFakeApproval)}`);
    }
  } catch (err) {
    recordTest('SEC-03', 'Backend Approval — Branch Self-Approval Rejection', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: BACKEND APPROVAL — VALID CENTRAL REVIEWER APPROVAL & AUDIT HASH
  // -------------------------------------------------------------------------
  let approvedRecord = null;
  try {
    const tokenPusat = await createSessionToken({
      sub: 'admin_pusat_reviewer',
      role: ROLES.ADMIN_PUSAT,
      branch: 'Pusat',
      displayName: 'Reviewer Mutu Pusat'
    });

    // Admin Pusat mengesahkan mitigasi permohonan REQ-DUMMY-002
    const reqValidApproval = new Request('http://localhost/api/nolap-data-proxy', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${tokenPusat}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        action: 'saveMitigasi',
        payload: {
          noPermintaan: 'REQ-DUMMY-002',
          tipeMitigasi: 'tanah',
          mitigasiData: {
            statusDokumen: 'APPROVED',
            linkedNoReq: 'REQ-DUMMY-002',
            secA: {
              namaProyek: 'Pengadaan Tanah Bypass Padang KM 12',
              instansi: 'CV Andalas Cipta Sejahtera (Dummy)'
            },
            secF_acceptance: { keputusan: 'APPROVED', alasan: 'Memenuhi seluruh kriteria SPI & KEPI' }
          }
        }
      })
    });

    const resValidApproval = await nolapProxyHandler(reqValidApproval);
    const bodyValidApproval = await resValidApproval.json();

    const audit = bodyValidApproval.serverAudit;
    const hasAuditTimestamps = audit && audit.isApprovedFormal === true && audit.serverApprovedAt && audit.contentHash;

    if (resValidApproval.status === 200 && hasAuditTimestamps) {
      approvedRecord = bodyValidApproval.record;
      recordTest('SEC-04', 'Backend Approval — Authorized Central Approval & Cryptographic Hash', 'PASSED',
        `Approved by ${audit.serverApprovedBy} at ${audit.serverApprovedAt}. Hash=${audit.contentHash.substring(0, 16)}...`);
    } else {
      recordTest('SEC-04', 'Backend Approval — Authorized Central Approval & Cryptographic Hash', 'FAILED',
        `Status=${resValidApproval.status}, Body=${JSON.stringify(bodyValidApproval)}`);
    }
  } catch (err) {
    recordTest('SEC-04', 'Backend Approval — Authorized Central Approval & Cryptographic Hash', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: CROSS-DEVICE DATA PROPAGATION (DEVICE A -> DEVICE B)
  // -------------------------------------------------------------------------
  try {
    // Skenario: Device A (Staf Penilai / Reviewer) menyimpan mitigasi untuk REQ-DUMMY-003 (KJPP-RM-CA-01 Umum)
    const tokenDeviceA = await createSessionToken({
      sub: 'penilai_device_a',
      role: ROLES.ADMIN_PUSAT,
      branch: 'Pusat',
      displayName: 'Staf Penilai A'
    });

    const testPayloadDeviceA = {
      statusDokumen: 'APPROVED',
      linkedNoReq: 'REQ-DUMMY-003',
      kategori: 'Pelaporan Keuangan (PSAK)',
      secA_screening: {
        sa01: { val: 'TIDAK', catatan: 'Bebas benturan kepentingan' }
      },
      secC_irac: {
        issue: 'Penerapan PSAK 216 / PSAK 240 pada Mesin Pabrik',
        rule: 'SPI 201 - Kode Etik & Standar Teknis',
        application: 'Verifikasi fisik dan daftar aktiva tetap lengkap',
        conclusion: 'Objek dapat dinilai dengan metode biaya terdepresiasi'
      },
      secE_acceptance: {
        keputusan: 'APPROVED'
      }
    };

    const reqSaveDeviceA = new Request('http://localhost/api/nolap-data-proxy', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${tokenDeviceA}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        action: 'saveMitigasi',
        payload: {
          noPermintaan: 'REQ-DUMMY-003',
          tipeMitigasi: 'umum',
          mitigasiData: testPayloadDeviceA
        }
      })
    });

    const resSaveDeviceA = await nolapProxyHandler(reqSaveDeviceA);
    const bodySaveDeviceA = await resSaveDeviceA.json();

    // Skenario: Device B (Auditor / Pemimpin Rekan di perangkat berbeda) login dan memuat data
    const tokenDeviceB = await createSessionToken({
      sub: 'pimpinan_device_b',
      role: ROLES.ADMIN_PUSAT,
      branch: 'Pusat',
      displayName: 'Pemimpin Rekan'
    });

    const reqFetchDeviceB = new Request('http://localhost/api/nolap-data-proxy?noPermintaan=REQ-DUMMY-003', {
      method: 'GET',
      headers: {
        'authorization': `Bearer ${tokenDeviceB}`
      }
    });

    const resFetchDeviceB = await nolapProxyHandler(reqFetchDeviceB);
    const bodyFetchDeviceB = await resFetchDeviceB.json();

    const retrievedItem = bodyFetchDeviceB.record;
    const retrievedUmum = retrievedItem?.mitigasi?.umum;

    const answersMatch = retrievedUmum?.secC_irac?.issue === 'Penerapan PSAK 216 / PSAK 240 pada Mesin Pabrik';
    const statusMatch = retrievedUmum?.statusDokumen === 'APPROVED';
    const noReqMatch = retrievedUmum?.linkedNoReq === 'REQ-DUMMY-003';
    const otherReqUntouched = retrievedItem?.noPermintaan === 'REQ-DUMMY-003';

    if (answersMatch && statusMatch && noReqMatch && otherReqUntouched) {
      recordTest('SYNC-01', 'Cross-Device Mitigation Storage & Integrity Verification', 'PASSED',
        'Device B successfully loaded full mitigation answers, IRAC issue, and APPROVED status saved by Device A without data corruption.');
    } else {
      recordTest('SYNC-01', 'Cross-Device Mitigation Storage & Integrity Verification', 'FAILED',
        `answersMatch=${answersMatch}, statusMatch=${statusMatch}, noReqMatch=${noReqMatch}`);
    }
  } catch (err) {
    recordTest('SYNC-01', 'Cross-Device Mitigation Storage & Integrity Verification', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 6: ALL 3 FORMS (KJPP-RM-CA-01, 02, 03) PERSISTENCE AND ISOLATION
  // -------------------------------------------------------------------------
  try {
    const tokenAdmin = await createSessionToken({
      sub: 'admin_multi_form',
      role: ROLES.ADMIN_PUSAT,
      branch: 'Pusat',
      displayName: 'Admin Pusat Test'
    });

    // Simpan SPM Ruislagh (03) pada REQ-DUMMY-003
    const reqRuislagh = new Request('http://localhost/api/nolap-data-proxy', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${tokenAdmin}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        action: 'saveMitigasi',
        payload: {
          noPermintaan: 'REQ-DUMMY-003',
          tipeMitigasi: 'ruislagh',
          mitigasiData: {
            statusDokumen: 'APPROVED',
            linkedNoReq: 'REQ-DUMMY-003',
            jalurRuislagh: 'PSN',
            secC_ekivalensi: {
              luasAsal: '15000',
              nilaiAsal: '7500000000',
              luasPengganti: '16500',
              nilaiPengganti: '8250000000'
            }
          }
        }
      })
    });

    const resRuislagh = await nolapProxyHandler(reqRuislagh);
    const bodyRuislagh = await resRuislagh.json();

    const record = bodyRuislagh.record;
    const hasBothUmumAndRuislagh = record.mitigasi?.umum && record.mitigasi?.ruislagh;
    const ruislaghIntact = record.mitigasi?.ruislagh?.secC_ekivalensi?.luasAsal === '15000';
    const umumStillIntact = record.mitigasi?.umum?.secC_irac?.issue.includes('PSAK 216');

    if (hasBothUmumAndRuislagh && ruislaghIntact && umumStillIntact) {
      recordTest('SYNC-02', 'Multi-Form Coexistence & Non-Destructive Update', 'PASSED',
        'KJPP-RM-CA-01 (Umum) and KJPP-RM-CA-03 (Ruislagh) coexist concurrently on the same request without overwriting each other.');
    } else {
      recordTest('SYNC-02', 'Multi-Form Coexistence & Non-Destructive Update', 'FAILED',
        `hasBoth=${hasBothUmumAndRuislagh}, ruislaghIntact=${ruislaghIntact}, umumIntact=${umumStillIntact}`);
    }
  } catch (err) {
    recordTest('SYNC-02', 'Multi-Form Coexistence & Non-Destructive Update', 'FAILED', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 7: HEADLESS CHROME VERIFICATION (PORTAL-NOLAP.HTML LIVE DOM)
  // -------------------------------------------------------------------------
  const MIME_MAP = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png'
  };

  const server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://' + req.headers.host).pathname);
    if (pathname === '/') pathname = 'portal-nolap.html';
    const cleanPath = pathname.replace(/^\/+/, '');
    const filePath = path.join(ROOT_DIR, cleanPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_MAP[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise(r => server.listen(8098, '127.0.0.1', r));

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9258',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9258/json/new?about:blank', { method: 'PUT' });
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
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8098/portal-nolap.html' });
    await new Promise(r => setTimeout(r, 3000));

    // Bypass token gate in headless browser
    await send('Runtime.evaluate', {
      expression: `
        sesiAktif = {
          role: 'ADMIN_PUSAT',
          cabang: 'Pusat',
          label: 'Admin Pusat Hardening QA',
          nama: 'Admin QA',
          jabatan: 'Penilai Publik'
        };
        aktifkanPanelUtama();
        gantiTabModul('spm');
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Verify Combobox exists in DOM
    const comboboxCheck = await send('Runtime.evaluate', {
      expression: `
        const u = Boolean(document.getElementById('combobox-input-spm-u'));
        const t = Boolean(document.getElementById('combobox-input-spm-t'));
        const r = Boolean(document.getElementById('combobox-input-spm-r'));
        const hasSyncFn = typeof sinkronkanMitigasiKeBackend === 'function';
        JSON.stringify({ u, t, r, hasSyncFn });
      `
    });

    const parsedUi = JSON.parse(comboboxCheck);
    if (parsedUi.u && parsedUi.t && parsedUi.r && parsedUi.hasSyncFn) {
      recordTest('UI-01', 'Combobox & Sync Engine DOM Verification', 'PASSED',
        'All 3 module combobox inputs (u, t, r) and sinkronkanMitigasiKeBackend engine confirmed active in live DOM.');
    } else {
      recordTest('UI-01', 'Combobox & Sync Engine DOM Verification', 'FAILED', JSON.stringify(parsedUi));
    }

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot && shot.data) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'hardening_qa_verified.png'), Buffer.from(shot.data, 'base64'));
      console.log('📸 Screenshot saved to artifact: hardening_qa_verified.png');
    }

    ws.close();
  } catch (err) {
    recordTest('UI-01', 'Combobox & Sync Engine DOM Verification', 'FAILED', err.message);
  } finally {
    chrome.kill();
    server.close();
  }

  // -------------------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log('SUMMARY RESULTS:');
  console.log('======================================================');
  let passCount = 0;
  let failCount = 0;
  results.forEach(r => {
    if (r.status === 'PASSED') passCount++;
    else failCount++;
    console.log(`[${r.status}] ${r.id}: ${r.name}`);
  });
  console.log(`\nTotal: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);
  console.log('======================================================\n');

  if (failCount === 0) {
    console.log('🛡️ ALL HARDENING TESTS PASSED SUCCESFULLY!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runHardeningVerification().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
