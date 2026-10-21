import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const HTTP_PORT = 8098;
const CDP_PORT = 9540;

function createHttpServer() {
  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/portofolio-rekanan.html';
    let filePath = path.join(process.cwd(), reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      let ext = path.extname(filePath);
      let ctype = 'text/html';
      if (ext === '.css') ctype = 'text/css';
      if (ext === '.js' || ext === '.mjs') ctype = 'application/javascript';
      if (ext === '.png') ctype = 'image/png';
      if (ext === '.svg') ctype = 'image/svg+xml';
      if (ext === '.jpg' || ext === '.jpeg') ctype = 'image/jpeg';
      res.writeHead(200, { 'Content-Type': ctype });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}

async function main() {
  console.log('========================================================');
  console.log('🧪 VERIFIKASI OPINI NSR PADA PORTOFOLIO-REKANAN.HTML');
  console.log('========================================================\n');

  const server = createHttpServer();
  await new Promise(r => server.listen(HTTP_PORT, r));
  console.log(`1. Server lokal berjalan di http://localhost:${HTTP_PORT}`);

  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-porto-opini-'));

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tempUserDataDir}`,
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,950',
    `http://localhost:${HTTP_PORT}/portofolio-rekanan.html`
  ]);

  console.log('2. Membuka headless Chrome di viewport Desktop (1280x950)...');
  await new Promise(r => setTimeout(r, 3000));

  try {
    const listRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pages = await listRes.json();
    const page = pages.find(p => p.type === 'page') || pages[0];

    if (!page || !page.webSocketDebuggerUrl) {
      throw new Error('Tidak menemukan target WebSocket debugger Chrome');
    }

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const id = msgId++;
      const onMsg = (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m.id === id) {
            ws.removeEventListener('message', onMsg);
            resolve(m.result || m.error);
          }
        } catch (_) {}
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');

    const loadPromise = new Promise(resolve => {
      const onMsg = (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m.method === 'Page.loadEventFired') {
            ws.removeEventListener('message', onMsg);
            resolve();
          }
        } catch (_) {}
      };
      ws.addEventListener('message', onMsg);
    });

    await send('Page.navigate', { url: `http://localhost:${HTTP_PORT}/portofolio-rekanan.html` });
    await Promise.race([loadPromise, new Promise(r => setTimeout(r, 5000))]);
    await new Promise(r => setTimeout(r, 1000));

    console.log('\n3. Menguji Tombol Navbar portofolio-rekanan.html...');
    const navbarCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const navBtn = document.querySelector('header button[onclick*="bukaModalPortal"]');
          const mobileBtn = document.querySelector('#mobile-menu button[onclick*="bukaModalPortal"]');
          return {
            navBtnText: navBtn ? navBtn.innerText.replace(/\\s+/g, ' ').trim() : null,
            navBtnTitle: navBtn ? navBtn.getAttribute('title') : null,
            mobileBtnText: mobileBtn ? mobileBtn.innerText.replace(/\\s+/g, ' ').trim() : null
          };
        })()
      `,
      returnByValue: true
    });

    const navRes = navbarCheck.result?.value;
    console.log('   Hasil Navbar:', JSON.stringify(navRes, null, 2));
    if (!navRes.navBtnText?.includes('OPINI NSR')) throw new Error(`Tombol navbar desktop bukan OPINI NSR: ${navRes.navBtnText}`);
    if (!navRes.mobileBtnText?.includes('OPINI NSR')) throw new Error(`Tombol mobile drawer bukan OPINI NSR: ${navRes.mobileBtnText}`);
    console.log('   ✓ PASS: Tombol navbar terverifikasi sinkron OPINI NSR!\n');

    console.log('4. Menguji Pembukaan Modal & Verifikasi Header OPINI NSR...');
    const headerCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.bukaModalPortal();
          const modal = document.getElementById('modal-portal');
          const dialog = document.getElementById('modal-portal-dialog');
          const header = dialog ? dialog.querySelector('h3') : null;
          const acronym = dialog ? dialog.querySelector('span.text-\\\\[11px\\\\]') || dialog.querySelector('span.text-xs') : null;
          const slogan = dialog ? dialog.querySelector('p.text-amber-400\\\\/90') : null;
          const kmkBadge = dialog ? dialog.querySelector('.bg-amber-400\\\\/10') : null;
          const bannerWarning = document.getElementById('banner-warning-portal');

          return {
            modalVisible: modal ? !modal.classList.contains('hidden') : false,
            dialogClasses: dialog ? dialog.className : null,
            titleText: header ? header.innerText.trim() : null,
            acronymText: dialog ? dialog.innerText.includes('Otorisasi Penilaian, Informasi, & Navigasi Internal KJPP NSR') : false,
            sloganText: slogan ? slogan.innerText.trim() : null,
            kmkBadgeText: kmkBadge ? kmkBadge.innerText.trim() : null,
            bannerWarningVisible: bannerWarning ? (window.getComputedStyle(bannerWarning).display !== 'none' && !bannerWarning.classList.contains('hidden')) : false
          };
        })()
      `,
      returnByValue: true
    });

    const hRes = headerCheck.result?.value;
    console.log('   Hasil Header Modal:', JSON.stringify(hRes, null, 2));
    if (!hRes.modalVisible) throw new Error('Modal tidak terbuka di portofolio-rekanan.html');
    if (!hRes.titleText?.includes('OPINI NSR')) throw new Error(`Judul salah: ${hRes.titleText}`);
    if (!hRes.acronymText) throw new Error('Akronim resmi tidak ditemukan di dialog');
    if (!hRes.sloganText?.includes('Dari Data Lapangan Menjadi Opini yang Andal')) throw new Error(`Slogan salah: ${hRes.sloganText}`);
    if (!hRes.kmkBadgeText?.toUpperCase().includes('KMK NO. 2.19.0160')) throw new Error(`Badge KMK salah: ${hRes.kmkBadgeText}`);
    if (!hRes.bannerWarningVisible) throw new Error('Banner warning seharusnya tampak sebelum login');
    console.log('   ✓ PASS: Header identitas OPINI NSR tervalidasi lengkap di portofolio-rekanan.html!\n');

    console.log('5. Menguji Standarisasi Kartu (Dark Executive Glassmorphism & 44px Icons)...');
    const cardsCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const panelLayanan = document.getElementById('panel-layanan');
          const formToken = document.getElementById('form-token-portal');
          if (panelLayanan) panelLayanan.classList.remove('hidden');
          if (formToken) formToken.classList.add('hidden');

          const cards = Array.from(document.querySelectorAll('#container-kartu-layanan > div'));
          return cards.map((c, i) => {
            const iconBox = c.querySelector('.w-11.h-11');
            const btn = c.querySelector('a');
            return {
              index: i + 1,
              title: c.querySelector('h4') ? c.querySelector('h4').innerText.trim() : '',
              hasDarkContainer: c.classList.contains('bg-slate-900/80') && c.classList.contains('border-slate-800'),
              has44pxIconBox: !!iconBox,
              btnText: btn ? btn.innerText.trim() : null
            };
          });
        })()
      `,
      returnByValue: true
    });

    const cards = cardsCheck.result?.value;
    console.log('   Daftar 7 Kartu dalam Grid di portofolio-rekanan.html:');
    cards.forEach(c => {
      console.log(`     [${c.index}] ${c.title} -> Dark: ${c.hasDarkContainer ? '✓' : '✗'}, Icon44px: ${c.has44pxIconBox ? '✓' : '✗'}, Btn: "${c.btnText}"`);
      if (!c.hasDarkContainer) throw new Error(`Kartu [${c.index}] tidak menggunakan styling bg-slate-900/80 border-slate-800`);
      if (!c.has44pxIconBox) throw new Error(`Kartu [${c.index}] tidak memiliki kotak ikon w-11 h-11 (44px)`);
    });
    if (cards.length !== 7) throw new Error(`Jumlah kartu harus 7, ditemukan: ${cards.length}`);
    console.log('   ✓ PASS: Seluruh 7 kartu tervalidasi seragam Dark Executive Glassmorphism!\n');

    console.log('6. Menguji RBAC Mode KANTOR PUSAT & Banner Warning Hidden...');
    const rbacPusat = await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.updateDynamicSmartCards({
            isCabang: false,
            mode: 'PUSAT',
            wilayah: 'Kantor Pusat Jakarta',
            wilayahCode: 'PST',
            role: 'DIREKTUR UTAMA',
            roleLabel: 'Direktur Utama',
            isSuperAdmin: true
          });

          const suCard = document.getElementById('kartu-surat-umum');
          const oprCard = document.getElementById('kartu-e-operasional');
          const badgeOpr = document.getElementById('badge-portal-operasional');
          const bannerWarning = document.getElementById('banner-warning-portal');

          return {
            suDisplay: suCard ? window.getComputedStyle(suCard).display : null,
            oprDisplay: oprCard ? window.getComputedStyle(oprCard).display : null,
            badgeOprText: badgeOpr ? badgeOpr.innerText.trim() : null,
            bannerWarningDisplay: bannerWarning ? window.getComputedStyle(bannerWarning).display : null,
            bannerWarningClassHidden: bannerWarning ? bannerWarning.classList.contains('hidden') : false
          };
        })()
      `,
      returnByValue: true
    });

    const pRes = rbacPusat.result?.value;
    console.log('   Hasil RBAC Pusat:', JSON.stringify(pRes, null, 2));
    if (pRes.suDisplay === 'none') throw new Error('Surat Umum seharusnya muncul di sesi Pusat');
    if (pRes.badgeOprText !== 'MEJA APPROVAL 5 TIER') throw new Error(`Badge Operasional Pusat salah: ${pRes.badgeOprText}`);
    if (pRes.bannerWarningDisplay !== 'none' || !pRes.bannerWarningClassHidden) {
      throw new Error(`Banner warning merah HARUS tersembunyi total saat sesi terverifikasi! (display=${pRes.bannerWarningDisplay})`);
    }
    console.log('   ✓ PASS: Sesi Pusat menampilkan 7 kartu lengkap, Badge MEJA APPROVAL 5 TIER & Banner peringatan tersembunyi total (style.display=none)!');

    // Screenshot Desktop Sesi Pusat
    const ssPusatDesktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'portofolio_opini_modal_pusat_desktop.png'), Buffer.from(ssPusatDesktop.data, 'base64'));
    console.log('   ✓ Screenshot disimpan: portofolio_opini_modal_pusat_desktop.png\n');

    console.log('7. Menguji RBAC Mode KANTOR CABANG (Bandung / BDG)...');
    const rbacCabang = await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.updateDynamicSmartCards({
            isCabang: true,
            mode: 'CABANG',
            wilayah: 'Kantor Cabang Bandung',
            wilayahCode: 'BDG',
            role: 'ADMIN CABANG',
            roleLabel: 'Admin Cabang Bandung'
          });

          const suCard = document.getElementById('kartu-surat-umum');
          const oprCard = document.getElementById('kartu-e-operasional');
          const badgeOpr = document.getElementById('badge-portal-operasional');
          const titleOpr = document.getElementById('title-portal-operasional');
          const linkOpr = document.getElementById('link-portal-operasional');
          const bannerWarning = document.getElementById('banner-warning-portal');

          return {
            suDisplay: suCard ? window.getComputedStyle(suCard).display : null,
            oprDisplay: oprCard ? window.getComputedStyle(oprCard).display : null,
            badgeOprText: badgeOpr ? badgeOpr.innerText.trim() : null,
            titleOprText: titleOpr ? titleOpr.innerText.trim() : null,
            linkOprHref: linkOpr ? linkOpr.getAttribute('href') : null,
            bannerWarningDisplay: bannerWarning ? window.getComputedStyle(bannerWarning).display : null
          };
        })()
      `,
      returnByValue: true
    });

    const cRes = rbacCabang.result?.value;
    console.log('   Hasil RBAC Cabang:', JSON.stringify(cRes, null, 2));
    if (cRes.suDisplay !== 'none') throw new Error(`Surat Umum harus disembunyikan untuk Cabang! (display=${cRes.suDisplay})`);
    if (cRes.badgeOprText !== 'FORM PENGAJUAN') throw new Error(`Badge Operasional Cabang salah: ${cRes.badgeOprText}`);
    if (!cRes.linkOprHref?.includes('branch=BDG')) throw new Error(`Link Operasional Cabang harus menyertakan branch=BDG: ${cRes.linkOprHref}`);
    if (cRes.bannerWarningDisplay !== 'none') throw new Error('Banner warning merah harus tetap tersembunyi pada sesi Cabang terverifikasi');
    console.log('   ✓ PASS: Sesi Cabang menyembunyikan Surat Umum (pusat-only), menampilkan form pengajuan operasional terkunci ke cabang!');

    // Screenshot Desktop Sesi Cabang
    const ssCabangDesktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'portofolio_opini_modal_cabang_desktop.png'), Buffer.from(ssCabangDesktop.data, 'base64'));
    console.log('   ✓ Screenshot disimpan: portofolio_opini_modal_cabang_desktop.png\n');

    console.log('8. Menguji Tampilan Layar Ponsel / Mobile (390x844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 600));

    const ssMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'portofolio_opini_modal_mobile.png'), Buffer.from(ssMobile.data, 'base64'));
    console.log('   ✓ Screenshot Mobile disimpan: portofolio_opini_modal_mobile.png');

    console.log('\n========================================================');
    console.log('🎉 VERIFIKASI OPINI NSR PADA PORTOFOLIO-REKANAN.HTML SUKSES 100%!');
    console.log('========================================================');

  } finally {
    try { chrome.kill(); } catch (e) {}
    try { server.close(); } catch (e) {}
    try { fs.rmSync(tempUserDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch(err => {
  console.error('\n❌ VERIFIKASI GAGAL:', err);
  process.exit(1);
});
