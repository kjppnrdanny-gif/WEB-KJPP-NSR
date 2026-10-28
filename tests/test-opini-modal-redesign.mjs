import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const ARTIFACTS_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const PORT = 8198;
const DEBUG_PORT = 9450;

function createServer() {
  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.html': 'text/html; charset=UTF-8',
      '.js': 'application/javascript; charset=UTF-8',
      '.css': 'text/css; charset=UTF-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };

    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const breakpoints = [
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false, label: 'Desktop 1440x900' },
  { name: 'laptop-1024', width: 1024, height: 768, mobile: false, label: 'Laptop 1024x768' },
  { name: 'tablet-768', width: 768, height: 1024, mobile: true, label: 'Tablet iPad 768x1024' },
  { name: 'mobile-standard-390', width: 390, height: 844, mobile: true, label: 'Mobile iPhone 14 390x844' },
  { name: 'mobile-small-360', width: 360, height: 800, mobile: true, label: 'Mobile Galaxy 360x800' },
  { name: 'mobile-narrow-320', width: 320, height: 568, mobile: true, label: 'Mobile iPhone SE 320x568' }
];

async function runTestSuite() {
  const server = createServer();
  await new Promise(r => server.listen(PORT, r));
  console.log(`[INFO] Server running on http://127.0.0.1:${PORT}`);

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    'about:blank'
  ]);

  let wsUrl = '';
  await new Promise((resolve, reject) => {
    chrome.stderr.on('data', data => {
      const match = data.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        wsUrl = match[1];
        resolve();
      }
    });
    setTimeout(() => {
      if (!wsUrl) reject(new Error('Timeout connecting to Chrome DevTools'));
    }, 6000);
  });

  console.log('[INFO] Chrome DevTools Connected');

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
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
        cb(m.result !== undefined ? m.result : m);
      }
    };

    const send = (method, params = {}) => new Promise(r => {
      const id = msgId++;
      handlers.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('DOM.enable');

    console.log('\n================================================================');
    console.log('TEST SUITE 1: VIEWPORT & OVERFLOW AUDIT (6 BREAKPOINTS)');
    console.log('================================================================\n');

    let allViewportsPass = true;

    for (const bp of breakpoints) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: bp.width,
        height: bp.height,
        deviceScaleFactor: 2,
        mobile: bp.mobile
      });

      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html?t=${Date.now()}` });

      // Poll until modal-portal exists
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(r => setTimeout(r, 100));
        const check = await send('Runtime.evaluate', {
          expression: `!!document.getElementById('modal-portal')`,
          returnByValue: true
        });
        if (check && check.result && check.result.value) break;
      }

      // Open modal in fresh unauthenticated state
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            sessionStorage.clear();
            const modal = document.getElementById('modal-portal');
            const form = document.getElementById('form-token-portal');
            const panel = document.getElementById('panel-layanan');
            if (modal) {
              modal.classList.remove('hidden');
              modal.style.display = 'flex';
            }
            if (form) form.classList.remove('hidden');
            if (panel) panel.classList.add('hidden');
          })()
        `
      });

      await new Promise(r => setTimeout(r, 400));

      // Inspect layout & overflow
      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const modal = document.getElementById('modal-portal');
            const dialog = document.getElementById('modal-portal-dialog');
            const form = document.getElementById('form-token-portal');
            const docWidth = document.documentElement.clientWidth;
            const docScroll = document.documentElement.scrollWidth;
            const dialogRect = dialog ? dialog.getBoundingClientRect() : {};

            return {
              viewport: { width: window.innerWidth, height: window.innerHeight },
              docWidth,
              docScroll,
              hasDocOverflow: docScroll > docWidth,
              dialogRect: {
                width: Math.round(dialogRect.width),
                height: Math.round(dialogRect.height),
                top: Math.round(dialogRect.top),
                left: Math.round(dialogRect.left)
              },
              hasDialogHorizontalOverflow: dialog ? dialog.scrollWidth > dialog.clientWidth : false
            };
          })()
        `,
        returnByValue: true
      });

      const metrics = evalRes.result.value;
      const pass = !metrics.hasDocOverflow && !metrics.hasDialogHorizontalOverflow;
      if (!pass) allViewportsPass = false;

      console.log(`[${pass ? 'PASS' : 'FAIL'}] ${bp.label}: Doc width=${metrics.docWidth}, scroll=${metrics.docScroll}, dialog=${metrics.dialogRect.width}x${metrics.dialogRect.height}`);

      // Capture screenshot artifact
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const imgBuffer = Buffer.from(shot.data, 'base64');
      const outPath = path.join(ARTIFACTS_DIR, `opini-redesign-${bp.name}.png`);
      fs.writeFileSync(outPath, imgBuffer);
    }

    console.log(`\nViewports Audit Result: ${allViewportsPass ? 'ALL 6 PASS' : 'FAILED'}`);

    console.log('\n================================================================');
    console.log('TEST SUITE 2: BRAND & UI COMPONENT COMPLETENESS AUDIT');
    console.log('================================================================\n');

    // Reset metrics to standard desktop for UI inspection
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 200));

    const uiAudit = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const form = document.getElementById('form-token-portal');
          const logoSvg = form ? form.querySelector('svg[aria-label="Logo Resmi KJPP NSR"]') : null;
          const text = form ? form.textContent : '';
          const kmkBadge = text.includes('KMK No. 2.19.0160');
          const entityName = text.includes('KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN');
          const opiniTitle = text.includes('OPINI NSR');
          const acronym = text.includes('Otorisasi Penilaian, Informasi, & Navigasi Internal KJPP NSR');
          const tagline = text.includes('Dari Data Lapangan Menjadi Opini yang Andal');

          const offices = [
            'Pusat Jakarta',
            'Cabang Bandung',
            'Cabang Padang',
            'Cabang Makassar',
            'Cabang Palembang'
          ];
          const allOfficesPresent = offices.every(o => text.includes(o));

          const inputToken = document.getElementById('input-token');
          const btnToggle = document.getElementById('btn-toggle-token');
          const eyeShow = document.getElementById('icon-eye-show');
          const eyeHide = document.getElementById('icon-eye-hide');
          const btnSubmit = document.getElementById('btn-submit-token');
          const errEl = document.getElementById('pesan-error');
          const errText = document.getElementById('pesan-error-text');
          const waLink = form ? form.querySelector('a[href*="wa.me"]') : null;

          return {
            hasLogoSvg: !!logoSvg,
            hasKmkBadge: kmkBadge,
            hasEntityName: entityName,
            hasOpiniTitle: opiniTitle,
            hasAcronym: acronym,
            hasTagline: tagline,
            allOfficesPresent,
            hasInputToken: !!inputToken,
            hasBtnToggle: !!btnToggle,
            hasEyeShow: !!eyeShow,
            hasEyeHide: !!eyeHide,
            hasBtnSubmit: !!btnSubmit,
            hasErrEl: !!errEl,
            hasErrText: !!errText,
            hasWaLink: !!waLink,
            submitBtnText: btnSubmit ? btnSubmit.textContent.trim() : ''
          };
        })()
      `,
      returnByValue: true
    });

    const ui = uiAudit.result.value;
    console.log('[AUDIT] Logo NSR SVG:', ui.hasLogoSvg ? 'PASS' : 'FAIL');
    console.log('[AUDIT] KMK Badge (2.19.0160):', ui.hasKmkBadge ? 'PASS' : 'FAIL');
    console.log('[AUDIT] Entity Full Name:', ui.hasEntityName ? 'PASS' : 'FAIL');
    console.log('[AUDIT] OPINI NSR Title:', ui.hasOpiniTitle ? 'PASS' : 'FAIL');
    console.log('[AUDIT] Official Acronym:', ui.hasAcronym ? 'PASS' : 'FAIL');
    console.log('[AUDIT] Tagline:', ui.hasTagline ? 'PASS' : 'FAIL');
    console.log('[AUDIT] All 5 Offices Present:', ui.allOfficesPresent ? 'PASS' : 'FAIL');
    console.log('[AUDIT] Input Token Element:', ui.hasInputToken ? 'PASS' : 'FAIL');
    console.log('[AUDIT] Toggle Visibility Button:', ui.hasBtnToggle ? 'PASS' : 'FAIL');
    console.log('[AUDIT] Submit Button ("Verifikasi & Masuk"):', ui.submitBtnText.includes('Verifikasi & Masuk') ? 'PASS' : 'FAIL');
    console.log('[AUDIT] Error Message Container:', ui.hasErrEl && ui.hasErrText ? 'PASS' : 'FAIL');
    console.log('[AUDIT] WhatsApp Admin Helpdesk Link:', ui.hasWaLink ? 'PASS' : 'FAIL');

    console.log('\n================================================================');
    console.log('TEST SUITE 3: INTERACTIVE BEHAVIOR & VALIDATION');
    console.log('================================================================\n');

    // 3a. Toggle Eye Behavior
    const toggleTest = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const inp = document.getElementById('input-token');
          const btn = document.getElementById('btn-toggle-token');
          const eyeShow = document.getElementById('icon-eye-show');
          const eyeHide = document.getElementById('icon-eye-hide');

          const initialType = inp.type; // password
          const initialShowVisible = !eyeShow.classList.contains('hidden');
          const initialHideVisible = !eyeHide.classList.contains('hidden');

          // Click toggle
          btn.click();
          const toggledType = inp.type; // text
          const toggledShowVisible = !eyeShow.classList.contains('hidden');
          const toggledHideVisible = !eyeHide.classList.contains('hidden');

          // Click toggle again
          btn.click();
          const restoredType = inp.type; // password

          return {
            initialType,
            initialShowVisible,
            initialHideVisible,
            toggledType,
            toggledShowVisible,
            toggledHideVisible,
            restoredType
          };
        })()
      `,
      returnByValue: true
    });

    const tog = toggleTest.result.value;
    const togglePass = tog.initialType === 'password' &&
                       tog.toggledType === 'text' &&
                       tog.toggledHideVisible === true &&
                       tog.toggledShowVisible === false &&
                       tog.restoredType === 'password';
    console.log(`[${togglePass ? 'PASS' : 'FAIL'}] Show/Hide Token Toggle: password -> text -> password`);

    // 3b. Empty Input Validation
    const emptyTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const inp = document.getElementById('input-token');
          const errEl = document.getElementById('pesan-error');
          const errText = document.getElementById('pesan-error-text');
          inp.value = '';

          // Trigger submission
          await window.verifikasiTokenPortal();

          return {
            errVisible: !errEl.classList.contains('hidden'),
            errMessage: errText.innerText.trim()
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    const emp = emptyTest.result.value;
    const empPass = emp.errVisible && emp.errMessage.includes('Silakan masukkan token otorisasi');
    console.log(`[${empPass ? 'PASS' : 'FAIL'}] Empty Input Validation: Error shown: "${emp.errMessage}"`);

    // 3c. Invalid Token Validation
    const invalidTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const inp = document.getElementById('input-token');
          const errEl = document.getElementById('pesan-error');
          const errText = document.getElementById('pesan-error-text');
          inp.value = 'TOKEN_PALSU_TIDAK_TERDAFTAR_123';

          await window.verifikasiTokenPortal();

          return {
            errVisible: !errEl.classList.contains('hidden'),
            errMessage: errText.innerText.trim()
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    const inv = invalidTest.result.value;
    const invPass = inv.errVisible && inv.errMessage.includes('Token tidak valid');
    console.log(`[${invPass ? 'PASS' : 'FAIL'}] Invalid Token Validation: Error shown: "${inv.errMessage}"`);

    // 3d. Valid Token Authentication & Panel Transition
    const validTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          window._targetPortal = null; // direct view of operational cards
          const inp = document.getElementById('input-token');
          const form = document.getElementById('form-token-portal');
          const panel = document.getElementById('panel-layanan');
          const labelLokasi = document.getElementById('label-lokasi');

          // Valid token for Super Admin Kantor Pusat: (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN")
          inp.value = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");

          await window.verifikasiTokenPortal();

          return {
            formHidden: form.classList.contains('hidden'),
            panelVisible: !panel.classList.contains('hidden'),
            labelLokasiText: labelLokasi ? labelLokasi.innerText : '',
            storedSession: !!sessionStorage.getItem('kjpp_token_internal')
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    const val = validTest.result.value;
    const valPass = val.formHidden && val.panelVisible && val.storedSession && (val.labelLokasiText.includes('Terverifikasi') || val.labelLokasiText.includes('PUSAT'));
    console.log(`[${valPass ? 'PASS' : 'FAIL'}] Valid Token Authentication: Panel revealed, Label="${val.labelLokasiText}"`);

    // Capture authenticated panel screenshot
    const shotAuth = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'opini-redesign-authenticated-panel.png'), Buffer.from(shotAuth.data, 'base64'));
    console.log('[INFO] Saved authenticated panel screenshot to artifacts.');

    // 3e. Reset Session ("Ganti Token / Keluar")
    const resetTest = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const form = document.getElementById('form-token-portal');
          const panel = document.getElementById('panel-layanan');
          const inp = document.getElementById('input-token');

          window.resetTokenSesi();

          return {
            formVisible: !form.classList.contains('hidden'),
            panelHidden: panel.classList.contains('hidden'),
            inputValue: inp.value,
            sessionCleared: !sessionStorage.getItem('kjpp_token_internal')
          };
        })()
      `,
      returnByValue: true
    });

    const res = resetTest.result.value;
    const resPass = res.formVisible && res.panelHidden && res.inputValue === '' && res.sessionCleared;
    console.log(`[${resPass ? 'PASS' : 'FAIL'}] Reset Session ("Ganti Token / Keluar"): Form restored, Panel hidden, Session cleared`);

    console.log('\n================================================================');
    console.log('TEST SUITE 4: MULTI-PAGE GLOBAL CONSISTENCY AUDIT (6 FILES)');
    console.log('================================================================\n');

    const publicFiles = [
      'index.html',
      'portofolio-rekanan.html',
      'layanan.html',
      'profil-legalitas.html',
      'tim-cabang.html',
      'wawasan-regulasi.html'
    ];

    let allFilesConsistent = true;
    publicFiles.forEach(f => {
      const c = fs.readFileSync(path.join(ROOT_DIR, f), 'utf8');
      const hasModal = c.includes('id="modal-portal"');
      const hasForm = c.includes('id="form-token-portal"');
      const hasPanel = c.includes('id="panel-layanan"');
      const hasTwoCol = c.includes('grid grid-cols-1 md:grid-cols-12');
      const hasLogo = c.includes('Logo Resmi KJPP NSR');
      const hasKmk = c.includes('KMK No. 2.19.0160');
      const hasSubmit = c.includes('Verifikasi &amp; Masuk') || c.includes('Verifikasi & Masuk');

      const pass = hasModal && hasForm && hasPanel && hasTwoCol && hasLogo && hasKmk && hasSubmit;
      if (!pass) allFilesConsistent = false;
      console.log(`[${pass ? 'PASS' : 'FAIL'}] ${f}: Modal=${hasModal}, Form=${hasForm}, 2-Col=${hasTwoCol}, Logo=${hasLogo}, KMK=${hasKmk}`);
    });

    console.log(`\nGlobal Files Consistency: ${allFilesConsistent ? 'ALL 6 PASS' : 'FAILED'}`);

    ws.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

runTestSuite().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
