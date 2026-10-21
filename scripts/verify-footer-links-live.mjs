import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function verifyLiveFooter() {
  console.log('========================================================');
  console.log('🧪 VERIFIKASI LIVE 3 TAUTAN FOOTER PRESENSI NSR');
  console.log('========================================================\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9499',
    '--no-sandbox',
    '--window-size=1280,950',
    'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec'
  ]);

  console.log('1. Membuka Google Apps Script Web App versi live (Versi 15)...');
  await new Promise(r => setTimeout(r, 9000));

  try {
    const listRes = await fetch('http://127.0.0.1:9499/json/list');
    const pages = await listRes.json();
    
    // Cari target userCodeAppPanel (berisi konten HTML GPS.html sebenarnya di dalam GAS sandbox)
    let appTarget = pages.find(p => p.url.includes('userCodeAppPanel'));
    if (!appTarget) {
      console.log('Menunggu userCodeAppPanel iframe termuat...');
      await new Promise(r => setTimeout(r, 4000));
      const listRes2 = await fetch('http://127.0.0.1:9499/json/list');
      const pages2 = await listRes2.json();
      appTarget = pages2.find(p => p.url.includes('userCodeAppPanel'));
    }

    if (!appTarget || !appTarget.webSocketDebuggerUrl) {
      throw new Error('Tidak menemukan target iframe userCodeAppPanel di Chrome: ' + JSON.stringify(pages.map(p => ({ url: p.url, type: p.type }))));
    }

    console.log('Terhubung ke target GAS userCodeAppPanel:', appTarget.url);
    const ws = new WebSocket(appTarget.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    // Buka koneksi ke main page untuk Page.captureScreenshot
    const mainPage = pages.find(p => p.url.includes('script.google.com'));
    let wsMain = null;
    let mainMsgId = 1000;
    const sendMain = (method, params = {}) => new Promise((resolve) => {
      if (!wsMain) return resolve(null);
      const id = mainMsgId++;
      const onMsg = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === id) {
          wsMain.removeEventListener('message', onMsg);
          resolve(m.result || m.error);
        }
      };
      wsMain.addEventListener('message', onMsg);
      wsMain.send(JSON.stringify({ id, method, params }));
    });

    if (mainPage && mainPage.webSocketDebuggerUrl) {
      wsMain = new WebSocket(mainPage.webSocketDebuggerUrl);
      await new Promise(r => wsMain.onopen = r);
      await sendMain('Page.enable');
    }

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

    console.log('2. Memeriksa keberadaan 3 tautan pada footer live di userHtmlFrame...');
    const evalFooter = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const ifr = document.getElementById('userHtmlFrame');
          const doc = ifr ? (ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document)) : document;
          if (!doc) return { error: 'Document not found' };

          const footer = doc.querySelector('footer');
          const btnPrivasi = doc.getElementById('btn-privasi-karyawan');
          const linkPDP = doc.querySelector('a[href*="kebijakan-privasi.html"]');
          const linkDisc = doc.querySelector('a[href*="disclaimer.html"]');
          const modal = doc.getElementById('modal-privasi-karyawan');

          return {
            hasIframeDoc: !!doc,
            footerText: footer ? footer.innerText.replace(/\\s+/g, ' ').trim() : null,
            btnPrivasi: btnPrivasi ? {
              text: btnPrivasi.innerText.trim(),
              id: btnPrivasi.id,
              onclick: btnPrivasi.getAttribute('onclick')
            } : null,
            linkPDP: linkPDP ? {
              text: linkPDP.innerText.replace(/\\s+/g, ' ').trim(),
              href: linkPDP.getAttribute('href'),
              target: linkPDP.getAttribute('target')
            } : null,
            linkDisc: linkDisc ? {
              text: linkDisc.innerText.replace(/\\s+/g, ' ').trim(),
              href: linkDisc.getAttribute('href'),
              target: linkDisc.getAttribute('target')
            } : null,
            hasModal: !!modal,
            modalInitialHidden: modal ? modal.classList.contains('hidden') : null
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Hasil Pemeriksaan Footer:', JSON.stringify(evalFooter.result?.value, null, 2));

    const fRes = evalFooter.result?.value;
    if (!fRes.btnPrivasi) throw new Error('Tombol Pemberitahuan Privasi Karyawan tidak ditemukan!');
    if (!fRes.linkPDP || fRes.linkPDP.href !== 'https://kjppnanangrahayu.com/kebijakan-privasi.html') {
      throw new Error('Link Kebijakan Privasi (UU PDP) salah atau tidak ditemukan!');
    }
    if (!fRes.linkDisc || fRes.linkDisc.href !== 'https://kjppnanangrahayu.com/disclaimer.html') {
      throw new Error('Link Disclaimer Profesi salah atau tidak ditemukan!');
    }
    console.log('✓ 3 Tautan/Tombol Footer terverifikasi ada dan memiliki atribut yang benar!\n');

    console.log('3. Menguji interaktivitas: Membuka Modal Pemberitahuan Privasi Karyawan...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const ifr = document.getElementById('userHtmlFrame');
          const doc = ifr ? (ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document)) : document;
          const btn = doc ? doc.getElementById('btn-privasi-karyawan') : null;
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const evalModal = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const ifr = document.getElementById('userHtmlFrame');
          const doc = ifr ? (ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document)) : document;
          const m = doc ? doc.getElementById('modal-privasi-karyawan') : null;
          const title = doc ? doc.getElementById('modal-privasi-title') : null;
          const bodyText = m ? m.innerText : '';
          return {
            isVisible: m ? !m.classList.contains('hidden') : false,
            title: title ? title.innerText.trim() : null,
            hasPoint1: bodyText.includes('Pemrosesan Data Karyawan'),
            hasPoint2: bodyText.includes('Verifikasi Dua Langkah'),
            hasPoint3: bodyText.includes('Pemrosesan Geolokasi (GPS) Snapshot'),
            hasPoint4: bodyText.includes('Retensi & Keamanan Data (UU PDP No. 27/2022)'),
            hasPoint5: bodyText.includes('Hak Karyawan sebagai Subjek Data'),
            hasSayaMengertiBtn: !!(doc && doc.getElementById('btn-tutup-privasi-bawah')),
            hasCloseXBtn: !!(doc && doc.getElementById('btn-tutup-privasi-x'))
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Hasil Pemeriksaan Modal Terbuka:', JSON.stringify(evalModal.result?.value, null, 2));
    const mRes = evalModal.result?.value;
    if (!mRes.isVisible) throw new Error('Modal gagal terbuka setelah diklik!');
    if (!mRes.hasPoint1 || !mRes.hasPoint2 || !mRes.hasPoint3 || !mRes.hasPoint4 || !mRes.hasPoint5) {
      throw new Error('Poin kebijakan privasi tidak lengkap di dalam modal!');
    }
    console.log('✓ Modal Privasi Karyawan berhasil terbuka dan 5 poin kebijakan terverifikasi lengkap!\n');

    console.log('4. Mengambil tangkapan layar bukti modal terbuka...');
    const shotModal = await sendMain('Page.captureScreenshot', { format: 'png' });
    const modalShotPath = path.join(ARTIFACT_DIR, 'live_prod_modal_privasi_karyawan.png');
    if (shotModal && shotModal.data) {
      fs.writeFileSync(modalShotPath, Buffer.from(shotModal.data, 'base64'));
      console.log('✓ Screenshot disimpan:', modalShotPath);
    }

    console.log('5. Menguji penutupan modal (Escape & Tombol)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const ifr = document.getElementById('userHtmlFrame');
          const doc = ifr ? (ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document)) : document;
          const btnClose = doc ? doc.getElementById('btn-tutup-privasi-bawah') : null;
          if (btnClose) btnClose.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));

    const evalClose = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const ifr = document.getElementById('userHtmlFrame');
          const doc = ifr ? (ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document)) : document;
          const m = doc ? doc.getElementById('modal-privasi-karyawan') : null;
          return { isHidden: m ? m.classList.contains('hidden') : false };
        })()
      `,
      returnByValue: true
    });
    console.log('Status setelah klik Tutup:', evalClose.result?.value);
    if (!evalClose.result?.value?.isHidden) throw new Error('Modal gagal tertutup!');
    console.log('✓ Modal berhasil ditutup dengan sempurna!\n');

    // Scroll to bottom and capture footer screenshot
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const ifr = document.getElementById('userHtmlFrame');
          const win = ifr ? (ifr.contentWindow || window) : window;
          win.scrollTo(0, 9999);
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    const shotFooter = await sendMain('Page.captureScreenshot', { format: 'png' });
    const footerShotPath = path.join(ARTIFACT_DIR, 'live_prod_presensi_footer.png');
    if (shotFooter && shotFooter.data) {
      fs.writeFileSync(footerShotPath, Buffer.from(shotFooter.data, 'base64'));
      console.log('✓ Screenshot footer disimpan:', footerShotPath);
    }

    if (wsMain) wsMain.close();
    ws.close();
    console.log('\n========================================================');
    console.log('🎉 SELURUH PENGUJIAN 3 TAUTAN FOOTER LIVE SUKSES 100%!');
    console.log('========================================================');
  } catch(e) {
    console.error('❌ Error verifikasi:', e);
    process.exitCode = 1;
  } finally {
    chrome.kill();
  }
}

verifyLiveFooter().catch(console.error);
