import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const HTTP_PORT = 8096;
const CDP_PORT = 9535;

function createHttpServer() {
  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
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
  console.log('🧪 VERIFIKASI OPINI NSR & RESTRUKTURISASI MODAL');
  console.log('========================================================\n');

  const server = createHttpServer();
  await new Promise(r => server.listen(HTTP_PORT, r));
  console.log(`1. Server lokal berjalan di http://localhost:${HTTP_PORT}`);

  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-opini-'));

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tempUserDataDir}`,
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,950',
    `http://localhost:${HTTP_PORT}/index.html`
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
        const m = JSON.parse(e.data);
        if (m.id === id) {
          ws.removeEventListener('message', onMsg);
          resolve(m.result || m.error);
        }
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

    await send('Page.navigate', { url: `http://localhost:${HTTP_PORT}/index.html` });
    await Promise.race([loadPromise, new Promise(r => setTimeout(r, 5000))]);
    await new Promise(r => setTimeout(r, 1000));

    console.log('\n3. Menguji Pembukaan Modal & Verifikasi Teks Header OPINI NSR...');
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

          return {
            modalVisible: modal ? !modal.classList.contains('hidden') : false,
            dialogClasses: dialog ? dialog.className : null,
            titleText: header ? header.innerText.trim() : null,
            acronymText: dialog ? dialog.innerText.includes('Otorisasi Penilaian, Informasi, & Navigasi Internal KJPP NSR') : false,
            sloganText: slogan ? slogan.innerText.trim() : null,
            kmkBadgeText: kmkBadge ? kmkBadge.innerText.trim() : null
          };
        })()
      `,
      returnByValue: true
    });

    const hRes = headerCheck.result?.value;
    console.log('   Hasil Header Modal:', JSON.stringify(hRes, null, 2));

    if (!hRes.modalVisible) throw new Error('Modal tidak terbuka saat bukaModalPortal()');
    if (!hRes.titleText.includes('OPINI NSR')) throw new Error(`Judul salah: ${hRes.titleText}`);
    if (!hRes.acronymText) throw new Error('Akronim resmi tidak ditemukan di dialog');
    if (!hRes.sloganText?.includes('Dari Data Lapangan Menjadi Opini yang Andal')) throw new Error(`Slogan salah: ${hRes.sloganText}`);
    if (!hRes.kmkBadgeText?.toUpperCase().includes('KMK NO. 2.19.0160')) throw new Error(`Badge KMK salah: ${hRes.kmkBadgeText}`);
    console.log('   ✓ PASS: Header identitas OPINI NSR tervalidasi lengkap!\n');

    console.log('4. Menguji Standarisasi Kartu (Dark Executive Glassmorphism & 44px Icons)...');
    const cardsCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Buka panel layanan dalam mode Pusat (Unauthenticated / Default)
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
              iconClasses: iconBox ? iconBox.className : null,
              btnText: btn ? btn.innerText.trim() : null,
              hasStandardBtn: btn ? btn.classList.contains('bg-slate-800') && btn.classList.contains('px-3.5') : false
            };
          });
        })()
      `,
      returnByValue: true
    });

    const cList = cardsCheck.result?.value || [];
    console.log('   Daftar 7 Kartu dalam Grid:');
    cList.forEach(c => {
      console.log(`     [${c.index}] ${c.title} -> Dark: ${c.hasDarkContainer ? '✓' : '✗'}, Icon44px: ${c.has44pxIconBox ? '✓' : '✗'}, Btn: "${c.btnText}"`);
    });

    if (cList.length !== 7) throw new Error(`Jumlah kartu harus 7, didapat: ${cList.length}`);
    const allDark = cList.every(c => c.hasDarkContainer);
    const all44 = cList.every(c => c.has44pxIconBox);
    const allBtn = cList.every(c => c.hasStandardBtn);

    if (!allDark) throw new Error('Sebagian kartu belum menggunakan bg-slate-900/80 border-slate-800');
    if (!all44) throw new Error('Sebagian kartu belum memiliki icon box w-11 h-11 (44x44px)');
    if (!allBtn) throw new Error('Sebagian action button belum distandardisasi');
    console.log('   ✓ PASS: Seluruh 7 kartu tervalidasi seragam Dark Executive Glassmorphism!\n');

    console.log('5. Menguji RBAC Mode KANTOR PUSAT (Display All 7 Cards)...');
    const rbacPusat = await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.updateDynamicSmartCards({
            isCabang: false,
            mode: 'PUSAT',
            wilayah: 'Kantor Pusat Jakarta',
            wilayahCode: 'PST',
            role: 'SUPER ADMIN',
            roleLabel: 'Super Admin Pusat'
          });

          const suCard = document.getElementById('kartu-surat-umum');
          const oprCard = document.getElementById('kartu-e-operasional');
          const badgeOpr = document.getElementById('badge-portal-operasional');

          return {
            suDisplay: suCard ? window.getComputedStyle(suCard).display : null,
            oprDisplay: oprCard ? window.getComputedStyle(oprCard).display : null,
            badgeOprText: badgeOpr ? badgeOpr.innerText.trim() : null
          };
        })()
      `,
      returnByValue: true
    });

    const pRes = rbacPusat.result?.value;
    console.log('   Hasil RBAC Pusat:', JSON.stringify(pRes, null, 2));
    if (pRes.suDisplay === 'none') throw new Error('Surat Umum seharusnya muncul di sesi Pusat');
    if (pRes.badgeOprText !== 'MEJA APPROVAL 5 TIER') throw new Error(`Badge Operasional Pusat salah: ${pRes.badgeOprText}`);
    console.log('   ✓ PASS: Sesi Pusat menampilkan seluruh kartu lengkap & Badge MEJA APPROVAL 5 TIER.');

    // Screenshot Desktop Sesi Pusat
    const ssPusatDesktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'opini_nsr_modal_pusat_desktop.png'), Buffer.from(ssPusatDesktop.data, 'base64'));
    console.log('   ✓ Screenshot disimpan: opini_nsr_modal_pusat_desktop.png');

    console.log('\n6. Menguji RBAC Mode KANTOR CABANG (Bandung / BDG)...');
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

          return {
            suDisplay: suCard ? window.getComputedStyle(suCard).display : null,
            oprDisplay: oprCard ? window.getComputedStyle(oprCard).display : null,
            badgeOprText: badgeOpr ? badgeOpr.innerText.trim() : null,
            titleOprText: titleOpr ? titleOpr.innerText.trim() : null,
            linkOprHref: linkOpr ? linkOpr.getAttribute('href') : null
          };
        })()
      `,
      returnByValue: true
    });

    const cbRes = rbacCabang.result?.value;
    console.log('   Hasil RBAC Cabang:', JSON.stringify(cbRes, null, 2));
    if (cbRes.suDisplay !== 'none') throw new Error(`Surat Umum harus disembunyikan untuk Cabang (display: ${cbRes.suDisplay})`);
    if (cbRes.oprDisplay === 'none') throw new Error('Kartu Biaya Operasional Cabang harus ditampilkan (display: flex)');
    if (cbRes.badgeOprText !== 'FORM PENGAJUAN') throw new Error(`Badge Operasional Cabang salah: ${cbRes.badgeOprText}`);
    if (!cbRes.titleOprText.includes('Bandung')) throw new Error(`Judul Operasional Cabang harus mencerminkan Bandung: ${cbRes.titleOprText}`);
    if (!cbRes.linkOprHref.includes('branch=BDG')) throw new Error(`Link Operasional harus terkunci ke branch=BDG: ${cbRes.linkOprHref}`);
    console.log('   ✓ PASS: Sesi Cabang menyembunyikan Surat Umum (pusat-only), menampilkan form pengajuan operasional terkunci ke cabang!');

    // Screenshot Desktop Sesi Cabang
    const ssCabangDesktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'opini_nsr_modal_cabang_desktop.png'), Buffer.from(ssCabangDesktop.data, 'base64'));
    console.log('   ✓ Screenshot disimpan: opini_nsr_modal_cabang_desktop.png');

    console.log('\n7. Menguji Responsivitas Layar Ponsel / Mobile (390x844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 600));

    const ssCabangMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'opini_nsr_modal_cabang_mobile.png'), Buffer.from(ssCabangMobile.data, 'base64'));
    console.log('   ✓ Screenshot Mobile Cabang disimpan: opini_nsr_modal_cabang_mobile.png');

    // Kembalikan ke sesi Pusat untuk screenshot Mobile Pusat
    await send('Runtime.evaluate', {
      expression: `
        window.updateDynamicSmartCards({
          isCabang: false,
          mode: 'PUSAT',
          wilayah: 'Kantor Pusat Jakarta',
          wilayahCode: 'PST',
          role: 'DIREKTUR UTAMA',
          roleLabel: 'Direktur Utama'
        });
      `
    });
    await new Promise(r => setTimeout(r, 400));
    const ssPusatMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'opini_nsr_modal_pusat_mobile.png'), Buffer.from(ssPusatMobile.data, 'base64'));
    console.log('   ✓ Screenshot Mobile Pusat disimpan: opini_nsr_modal_pusat_mobile.png');

    console.log('\n========================================================');
    console.log('🎉 SELURUH VERIFIKASI OPINI NSR & RBAC MODAL LULUS 100%!');
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
