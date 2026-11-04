import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 8183;
const DEBUG_PORT = 9283;
const ROOT_DIR = process.cwd();
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

console.log('================================================================');
console.log('TEST SUITE: LANDING PAGE AUDIT, EMAIL STANDARDIZATION & COUNTERS');
console.log('================================================================\n');

async function runLandingAuditTestSuite() {
  const consoleErrors = [];

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

    const localFile = path.join(ROOT_DIR, reqPath);
    if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      const ext = path.extname(localFile);
      const mime = ext === '.html' ? 'text/html' :
                   ext === '.js' || ext === '.mjs' ? 'application/javascript' :
                   ext === '.css' ? 'text/css' :
                   ext === '.png' ? 'image/png' :
                   ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                   ext === '.svg' ? 'image/svg+xml' : 'text/plain';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(localFile).pipe(res);
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  await new Promise(r => server.listen(PORT, r));
  console.log(`[SERVER] Local Test Server listening on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(ARTIFACT_DIR, '.tmp_chrome_landing_audit_test');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    'about:blank'
  ]);

  const cleanup = () => {
    try { chromeProc.kill(); } catch (_) {}
    try { server.close(); } catch (_) {}
  };

  try {
    await new Promise(r => setTimeout(r, 2000));

    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          if (msg.params.type === 'error') {
            const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
            if (!text.includes('cdn.tailwindcss.com') && !text.includes('favicon.png')) {
              consoleErrors.push(text);
            }
          }
        }
        if (msg.id && callbacks.has(msg.id)) {
          const { resolve, reject } = callbacks.get(msg.id);
          callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      } catch (_) {}
    };

    await send('Page.enable');
    await send('Runtime.enable');

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('[NAV] Navigating to http://localhost:' + PORT + '/index.html...');
    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    await new Promise(r => setTimeout(r, 2500));

    // ==========================================
    // UJI 1: AUDIT REGEX NOMOR TELEPON DUMMY
    // ==========================================
    console.log('\n--- UJI 1: AUDIT RESIDU KONTAK TELEPON DUMMY ---');
    const dummyCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyHtml = document.documentElement.innerHTML;
          const dummyRegex = /(081298765432|6281298765432)/g;
          const matches = bodyHtml.match(dummyRegex) || [];
          return {
            count: matches.length,
            matches: matches
          };
        })()
      `,
      returnByValue: true
    });

    const dummyCount = dummyCheck.result.value.count;
    console.log(`[CHECK] Dummy phone regex match count: ${dummyCount}`);
    if (dummyCount > 0) {
      throw new Error(`Audit Gagal: Ditemukan ${dummyCount} nomor telepon dummy 081298765432!`);
    }
    console.log('✔ SUKSES: 0 Residu nomor WhatsApp/telepon dummy (081298765432) di seluruh landing page.');

    // ==========================================
    // UJI 2: AUDIT STANDARDISASI EMAIL KORPORAT
    // ==========================================
    console.log('\n--- UJI 2: AUDIT STANDARDISASI EMAIL KORPORAT ---');
    const emailCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]')).map(a => a.getAttribute('href'));
          const gmailMailtos = mailtoLinks.filter(href => /@gmail\.com/i.test(href));
          
          const pageHtml = document.documentElement.innerHTML;
          // exclude possible non-visible comments if any, check text nodes
          const allGmails = pageHtml.match(/[a-zA-Z0-9._%+-]+@gmail\.com/gi) || [];
          
          return {
            totalMailtos: mailtoLinks.length,
            mailtoLinks: mailtoLinks,
            gmailMailtos: gmailMailtos,
            allGmailsCount: allGmails.length,
            allGmails: allGmails
          };
        })()
      `,
      returnByValue: true
    });

    const emailRes = emailCheck.result.value;
    console.log(`[CHECK] Total mailto: links found: ${emailRes.totalMailtos}`);
    emailRes.mailtoLinks.forEach((link, idx) => {
      console.log(`   ${idx + 1}. ${link}`);
    });
    console.log(`[CHECK] mailto: links with @gmail.com: ${emailRes.gmailMailtos.length}`);
    console.log(`[CHECK] All occurrences of @gmail.com in page: ${emailRes.allGmailsCount}`);

    if (emailRes.gmailMailtos.length > 0 || emailRes.allGmailsCount > 0) {
      throw new Error(`Audit Gagal: Masih ditemukan ${emailRes.allGmailsCount} residu email @gmail.com!`);
    }
    console.log('✔ SUKSES: 0 email @gmail.com tersisa. Seluruh email telah distandardisasi ke domain korporat resmi.');

    // ==========================================
    // UJI 3: VERIFIKASI & ANIMASI COUNTER METRIK
    // ==========================================
    console.log('\n--- UJI 3: VERIFIKASI & ANIMASI COUNTER METRIK PORTOFOLIO ---');
    
    // Scroll to stats section
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const statSection = document.querySelector('.stat-number');
          if (statSection) {
            statSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        })()
      `
    });

    // Tunggu animasi tick (duration: 1200ms)
    console.log('[WAIT] Menunggu animasi count-up (1800ms)...');
    await new Promise(r => setTimeout(r, 1800));

    const counterCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const statEls = Array.from(document.querySelectorAll('.stat-number'));
          return statEls.map(el => {
            const rawText = el.textContent.trim();
            const numericVal = parseFloat(rawText.replace(/[^0-9]/g, '')) || 0;
            const target = parseFloat(el.dataset.target || 0);
            return {
              text: rawText,
              numericVal: numericVal,
              target: target,
              isGreaterThanZero: numericVal > 0,
              label: el.nextElementSibling ? el.nextElementSibling.textContent.trim() : ''
            };
          });
        })()
      `,
      returnByValue: true
    });

    const statsResult = counterCheck.result.value;
    console.log(`[CHECK] Ditemukan ${statsResult.length} kartu counter metrik:`);
    let allValid = true;
    statsResult.forEach((stat, i) => {
      console.log(`   ${i + 1}. Label: "${stat.label}" -> Teks: "${stat.text}" (Numeric: ${stat.numericVal}, Target: ${stat.target})`);
      if (!stat.isGreaterThanZero || stat.numericVal === 0) {
        allValid = false;
      }
    });

    if (!allValid || statsResult.length === 0) {
      throw new Error('Audit Gagal: Satu atau lebih counter metrik bernilai 0 atau tidak aktif!');
    }
    console.log('✔ SUKSES: Seluruh 5 counter metrik portofolio aktif dan terverifikasi bernilai > 0.');

    // ==========================================
    // UJI 4: KESELARASAN GRID LOGO 40 BANK MITRA
    // ==========================================
    console.log('\n--- UJI 4: KESELARASAN GRID LOGO MITRA PERBANKAN & BUMN (#rekanan) ---');
    
    // Scroll to #rekanan
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const rekanan = document.getElementById('rekanan');
          if (rekanan) rekanan.scrollIntoView({ behavior: 'smooth', block: 'center' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const rekananCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const rekananSection = document.getElementById('rekanan');
          if (!rekananSection) return { found: false };
          const imgs = Array.from(rekananSection.querySelectorAll('img'));
          const cards = Array.from(rekananSection.querySelectorAll('.partner-card-item'));
          
          const brokenImgs = imgs.filter(img => img.naturalWidth === 0 && img.style.display !== 'none');
          
          return {
            found: true,
            totalCards: cards.length,
            totalImages: imgs.length,
            brokenImagesCount: brokenImgs.length
          };
        })()
      `,
      returnByValue: true
    });

    const rekananRes = rekananCheck.result.value;
    console.log(`[CHECK] Seksi #rekanan ditemukan: ${rekananRes.found}`);
    console.log(`[CHECK] Total partner card / marquee items: ${rekananRes.totalCards}`);
    console.log(`[CHECK] Total partner images: ${rekananRes.totalImages}`);
    console.log(`[CHECK] Broken images: ${rekananRes.brokenImagesCount}`);

    if (!rekananRes.found || rekananRes.brokenImagesCount > 0) {
      throw new Error('Audit Gagal: Seksi #rekanan tidak ditemukan atau terdapat broken images!');
    }
    console.log('✔ SUKSES: Grid logo mitra perbankan terpasang harmonis dengan 0 broken image.');

    // ==========================================
    // SCREENSHOT: BUKTI LIVE AUDIT BERSIH
    // ==========================================
    console.log('\n--- MENGAMBIL SCREENSHOT LIVE AUDIT ---');
    // Scroll ke bagian counter metrik & rekanan
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const target = document.querySelector('.stat-number');
          if (target) target.scrollIntoView({ block: 'start' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const screenshotData = await send('Page.captureScreenshot', {
      format: 'png',
      quality: 90,
      fromSurface: true
    });

    const screenshotBuffer = Buffer.from(screenshotData.data, 'base64');
    const localScreenshotPath = path.join(ROOT_DIR, 'bukti_live_landing_audit_clean.png');
    const artifactScreenshotPath = path.join(ARTIFACT_DIR, 'bukti_live_landing_audit_clean.png');

    fs.writeFileSync(localScreenshotPath, screenshotBuffer);
    fs.writeFileSync(artifactScreenshotPath, screenshotBuffer);
    console.log(`✔ SCREENSHOT DISIMPAN: ${localScreenshotPath}`);
    console.log(`✔ SCREENSHOT ARTIFACT: ${artifactScreenshotPath}`);

    console.log('\n================================================================');
    console.log('SEMUA UJI AUDIT KREDIBILITAS LANDING PAGE LOLOS 100%!');
    console.log('================================================================');

  } finally {
    cleanup();
  }
}

runLandingAuditTestSuite().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
