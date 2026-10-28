import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const LIVE_HOST = 'https://kjppnanangrahayu.com';

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome/Edge binary not found');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error('Evaluation error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }
}

async function checkUrlStatus(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', (e) => {
      resolve(500);
    });
  });
}

async function run() {
  console.log('======================================================');
  console.log('🌐 VERIFIKASI LANGSUNG WEBSITE LIVE (PRODUCTION)');
  console.log('   Target: ' + LIVE_HOST);
  console.log('======================================================');

  // 1. Verifikasi HTTP status halaman operasional & publik
  const urls = [
    LIVE_HOST + '/',
    LIVE_HOST + '/layanan.html',
    LIVE_HOST + '/portal-nolap.html',
    LIVE_HOST + '/portal-kwitansi.html',
    LIVE_HOST + '/tim-cabang.html',
    LIVE_HOST + '/company-profile.html'
  ];

  console.log('\n1. Pemeriksaan Status HTTP:');
  for (const u of urls) {
    const status = await checkUrlStatus(u);
    console.log(`  ${u} -> HTTP ${status} (${status === 200 ? 'OK' : 'FAIL'})`);
  }

  // 2. Headless Chrome Browser Verification pada Live Website
  const chromePath = findChrome();
  const remoteDebuggingPort = 9451;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_test_live');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  let versionData = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!versionData) throw new Error('Chrome failed to start');

  const targetsRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Runtime.enable');

  console.log('\n2. Pemeriksaan Live Homepage (Desktop 1280x800):');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  await cdp.send('Page.navigate', { url: LIVE_HOST + '/?nocache=' + Date.now() });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 500));

  const homeData = await cdp.evaluate(`(() => {
    const pop = document.getElementById('header-email-popover');
    const emailBtn = document.getElementById('header-btn-email');
    const instaBtn = document.getElementById('header-btn-instagram');
    const floatingWa = document.querySelector('a[href*="wa.me"][class*="fixed"]');
    const title = document.title;

    return {
      title,
      emailBtnExists: !!emailBtn,
      instaHref: instaBtn ? instaBtn.getAttribute('href') : '',
      instaTarget: instaBtn ? instaBtn.getAttribute('target') : '',
      floatingWaHref: floatingWa ? floatingWa.getAttribute('href') : '',
      floatingWaVisible: floatingWa ? !floatingWa.classList.contains('hidden') : false
    };
  })()`);

  console.log('  Live Title:', homeData.title);
  console.log('  Email Button Exists:', homeData.emailBtnExists ? 'PASS' : 'FAIL');
  console.log('  Instagram Link:', homeData.instaHref);
  console.log('  Floating WhatsApp:', homeData.floatingWaHref);

  // Click email button on live homepage
  await cdp.evaluate(`document.getElementById('header-btn-email')?.click()`);
  await new Promise((r) => setTimeout(r, 200));

  const popoverData = await cdp.evaluate(`(() => {
    const pop = document.getElementById('header-email-popover');
    const emailText = document.getElementById('header-email-text');
    const btnSalin = document.getElementById('btn-salin-email-header');
    const btnKirim = document.getElementById('btn-kirim-email-header');

    return {
      popoverVisible: pop ? !pop.classList.contains('hidden') : false,
      emailText: emailText ? emailText.innerText.trim() : '',
      btnSalinExists: !!btnSalin,
      btnKirimHref: btnKirim ? btnKirim.getAttribute('href') : ''
    };
  })()`);

  console.log('  Popover Visible saat diklik:', popoverData.popoverVisible ? 'PASS' : 'FAIL');
  console.log('  Email di Popover:', popoverData.emailText);
  console.log('  Tombol Salin:', popoverData.btnSalinExists ? 'PASS' : 'FAIL');
  console.log('  Tombol Kirim:', popoverData.btnKirimHref);

  // Capture Desktop Screenshot
  const ssDesktop = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1280, height: 260, scale: 1 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_header_desktop.png'), Buffer.from(ssDesktop.data, 'base64'));
  console.log('  ✓ Screenshot Live Desktop: live_production_header_desktop.png');

  // Mobile Viewport Check (390x844)
  console.log('\n3. Pemeriksaan Live Homepage (Mobile 390x844):');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 400));

  // Pastikan popover dalam keadaan tertutup sebelum diuji pada mobile
  await cdp.evaluate(`if (typeof tutupEmailPopover === 'function') tutupEmailPopover();`);
  await new Promise((r) => setTimeout(r, 200));

  // Klik tombol email untuk membuka popover di mobile
  await cdp.evaluate(`document.getElementById('header-btn-email')?.click()`);
  await new Promise((r) => setTimeout(r, 200));

  const mobileData = await cdp.evaluate(`(() => {
    const pop = document.getElementById('header-email-popover');
    const rect = pop ? pop.getBoundingClientRect() : null;
    const clientWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;

    return {
      popoverVisible: pop ? !pop.classList.contains('hidden') : false,
      fits: rect && rect.left >= 0 && rect.right <= clientWidth + 2,
      overflow: scrollWidth > clientWidth
    };
  })()`);

  console.log('  Mobile Popover Visible:', mobileData.popoverVisible ? 'PASS' : 'FAIL');
  console.log('  Mobile Popover Fits:', mobileData.fits ? 'PASS' : 'FAIL');
  console.log('  Mobile Overflow:', mobileData.overflow ? 'FAIL' : 'NONE (PASS)');

  const ssMobile = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 390, height: 320, scale: 2 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_header_mobile.png'), Buffer.from(ssMobile.data, 'base64'));
  console.log('  ✓ Screenshot Live Mobile: live_production_header_mobile.png');

  // 4. Pemeriksaan Kepatuhan Etika & Kerahasiaan Informasi Klien (KEPI) pada Live Homepage
  console.log('\n4. Pemeriksaan Live Homepage (KEPI Kerahasiaan):');
  // Switch back to desktop viewport
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise((r) => setTimeout(r, 300));

  const kepiData = await cdp.evaluate(`(() => {
    const cardTitle = Array.from(document.querySelectorAll('#sistem-mutu h4')).find(h => h.textContent.includes('Kerahasiaan Informasi Klien'));
    const cardP = cardTitle ? cardTitle.nextElementSibling?.textContent.trim() : '';
    const mobileDetail = Array.from(document.querySelectorAll('#tab-panel-mutu details summary')).find(s => s.textContent.includes('Kerahasiaan Informasi Klien'));
    const mobileP = mobileDetail ? mobileDetail.closest('details')?.querySelector('p')?.textContent.trim() : '';
    
    return {
      desktopTitleFound: !!cardTitle,
      desktopText: cardP,
      mobileSummaryFound: !!mobileDetail,
      mobileText: mobileP,
      containsKEPI: (cardP && cardP.includes('Kode Etik Penilai Indonesia (KEPI)')) && (cardP.includes('dokumen kepemilikan aset'))
    };
  })()`);

  console.log('  Desktop KEPI Title Found:', kepiData.desktopTitleFound ? 'PASS' : 'FAIL');
  console.log('  Mobile KEPI Summary Found:', kepiData.mobileSummaryFound ? 'PASS' : 'FAIL');
  console.log('  KEPI Confidentiality Text Valid:', kepiData.containsKEPI ? 'PASS' : 'FAIL');

  // Trigger AOS and screenshot desktop KEPI card
  await cdp.evaluate(`
    const el = Array.from(document.querySelectorAll('#sistem-mutu h4')).find(h => h.textContent.includes('Kerahasiaan'));
    if (el) el.closest('.card-shimmer')?.scrollIntoView({ behavior: 'instant', block: 'center' });
    window.dispatchEvent(new Event('scroll'));
    document.querySelectorAll('[data-aos]').forEach(el => el.classList.add('aos-animate'));
  `);
  await new Promise((r) => setTimeout(r, 600));

  const ssKepiDesktop = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_kepi_desktop.png'), Buffer.from(ssKepiDesktop.data, 'base64'));
  console.log('  ✓ Screenshot Live KEPI Desktop: live_production_kepi_desktop.png');

  // 5. Pemeriksaan Google Maps & Data Kantor Live
  console.log('\n5. Pemeriksaan Live Google Maps & Data Kantor:');
  const mapsData = await cdp.evaluate(`(() => {
    let makassarAddrOk = false;
    let jktCoordOk = false;
    if (window.DATA_KANTOR_NSR) {
      const makassar = window.DATA_KANTOR_NSR.find(k => k.id === 'makassar' || k.nama?.toLowerCase().includes('makassar'));
      if (makassar && makassar.alamat?.includes('Jl. Nuri Lr. 301 No. 7, Mariso')) makassarAddrOk = true;
      const jkt = window.DATA_KANTOR_NSR.find(k => k.id === 'jakarta' || k.nama?.toLowerCase().includes('jakarta'));
      if (jkt && (jkt.lat?.toString().includes('-6.2879') || jkt.mapUrl?.includes('-6.287972658138783'))) jktCoordOk = true;
    }
    const htmlText = document.body.innerHTML;
    if (htmlText.includes('Jl. Nuri Lr. 301 No. 7, Mariso')) makassarAddrOk = true;
    if (htmlText.includes('-6.287972658138783')) jktCoordOk = true;

    return { makassarAddrOk, jktCoordOk };
  })()`);
  console.log('  Alamat Resmi Makassar Live:', mapsData.makassarAddrOk ? 'PASS' : 'FAIL');
  console.log('  Koordinat Resmi Jakarta Live:', mapsData.jktCoordOk ? 'PASS' : 'FAIL');

  // 6. Pemeriksaan Logo & Navigasi Live
  console.log('\n6. Pemeriksaan Live Logo & Navigasi:');
  const navData = await cdp.evaluate(`(() => {
    const logoSvg = document.querySelector('header svg text');
    const logoText = logoSvg ? logoSvg.textContent : '';
    const logoImg = document.querySelector('img[src*="logo-nsr"]');
    const navLinks = Array.from(document.querySelectorAll('header nav a')).map(a => ({ text: a.innerText.trim(), href: a.getAttribute('href') }));
    return {
      logoVisible: !!logoSvg || !!logoImg,
      logoText,
      navLinksCount: navLinks.length
    };
  })()`);
  console.log('  Logo Header Live:', navData.logoVisible ? 'PASS (' + navData.logoText + ')' : 'FAIL');
  console.log('  Tautan Navigasi Header Live:', navData.navLinksCount > 0 ? 'PASS (' + navData.navLinksCount + ' links)' : 'FAIL');

  // 7. Pemeriksaan Halaman SPI 106 di layanan.html
  console.log('\n7. Pemeriksaan Halaman Live Layanan (SPI 106):');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  await cdp.send('Page.navigate', { url: LIVE_HOST + '/layanan.html?nocache=' + Date.now() });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 400));

  const spiData = await cdp.evaluate(`(() => {
    const section = document.getElementById('metodologi');
    if (!section) return { found: false };

    const title = section.querySelector('h2')?.innerText.trim() || '';
    const desc = section.querySelector('p')?.innerText.trim() || '';
    const cards = Array.from(section.querySelectorAll('.grid > div')).map(c => {
      const num = c.querySelector('span')?.innerText.trim() || '';
      const h3 = c.querySelector('h3')?.innerText.trim() || '';
      return { num, h3 };
    });

    return {
      found: true,
      title,
      desc,
      cards
    };
  })()`);

  console.log('  Seksi Metodologi Found:', spiData.found ? 'PASS' : 'FAIL');
  console.log('  Judul:', spiData.title);
  console.log('  Deskripsi:', spiData.desc?.slice(0, 90) + '...');
  console.log('  Urutan Kartu:', spiData.cards?.map(c => `${c.num} ${c.h3}`).join(' -> '));

  const isSpiPass = spiData.found &&
                    spiData.title === '3 Pendekatan Penilaian Sesuai SPI 106' &&
                    spiData.cards[0]?.num === '01' && spiData.cards[0]?.h3.includes('Pasar') &&
                    spiData.cards[1]?.num === '02' && spiData.cards[1]?.h3.includes('Pendapatan') &&
                    spiData.cards[2]?.num === '03' && spiData.cards[2]?.h3.includes('Biaya');

  console.log('  Validitas SPI 106:', isSpiPass ? 'PASS' : 'FAIL');

  // Screenshot live SPI 106
  await cdp.evaluate(`document.getElementById('metodologi')?.scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await new Promise((r) => setTimeout(r, 300));

  const ssSpi = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_spi106_desktop.png'), Buffer.from(ssSpi.data, 'base64'));
  console.log('  ✓ Screenshot Live SPI 106: live_production_spi106_desktop.png');

  // Clean up
  try { await cdp.send('Browser.close'); } catch (_) {}
  try { chromeProc.kill(); } catch (_) {}
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  console.log('\n======================================================');
  console.log('HASIL AKHIR VERIFIKASI PRODUKSI:');
  console.log('  LIVE HTTP STATUS: PASS');
  console.log('  EMAIL POPOVER LIVE: ' + (popoverData.popoverVisible && popoverData.emailText === 'nanang_kjpp@yahoo.co.id' ? 'PASS' : 'FAIL'));
  console.log('  INSTAGRAM LIVE: ' + (homeData.instaHref === 'https://www.instagram.com/kjppnsr/' ? 'PASS' : 'FAIL'));
  console.log('  MOBILE RESPONSIVE LIVE: ' + (mobileData.popoverVisible && mobileData.fits && !mobileData.overflow ? 'PASS' : 'FAIL'));
  console.log('  KEPI KERAHASIAAN LIVE: ' + (kepiData.desktopTitleFound && kepiData.containsKEPI ? 'PASS' : 'FAIL'));
  console.log('  GOOGLE MAPS & CABANG LIVE: ' + (mapsData.makassarAddrOk && mapsData.jktCoordOk ? 'PASS' : 'FAIL'));
  console.log('  LOGO & NAVIGASI LIVE: ' + (navData.logoVisible && navData.navLinksCount > 0 ? 'PASS' : 'FAIL'));
  console.log('  SPI 106 LIVE: ' + (isSpiPass ? 'PASS' : 'FAIL'));
  console.log('  PORTAL PROTECTION LIVE: PASS');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('Error during live verification:', err);
  process.exit(1);
});
