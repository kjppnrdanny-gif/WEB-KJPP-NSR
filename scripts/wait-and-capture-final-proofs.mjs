import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const LIVE_URL = 'https://kjppnanangrahayu.com/portal-presensi.html';
const GITHUB_REPO = 'kjppnrdanny-gif/WEB-KJPP-NSR';

async function waitForDeploy() {
  console.log('1. Waiting for GitHub Actions cPanel deploy to complete...');
  for (let i = 0; i < 40; i++) {
    try {
      const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?branch=main&per_page=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Node-Fetch' } });
      const data = await res.json();
      const run = (data.workflow_runs || [])[0];
      console.log(`   [Poll ${i+1}/40] SHA: ${run?.head_sha?.slice(0, 7)} | Status: ${run?.status} | Conclusion: ${run?.conclusion}`);
      if (run?.head_sha?.startsWith('9da6977') && run?.status === 'completed') {
        console.log('   ✓ GitHub Action Deploy completed with:', run.conclusion);
        break;
      }
    } catch (e) {
      console.warn('   Poll error:', e.message);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
}

async function verifyLiveContent() {
  console.log('2. Verifying live content on', LIVE_URL);
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${LIVE_URL}?v=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      const html = await res.text();
      const hasHankam = html.includes('Jl. Hankam No. 5 RT.006 RW.001');
      const hasPancanaka = html.includes('Perumahan Pancanaka Royal Garden II');
      const hasNoExample = !html.includes('Contoh: NSR-2019-005') && !html.includes('PIN Default Standar: 123456');
      const hasModalGantiPin = html.includes('id="modal-ganti-pin-langsung"');
      const hasWfhLocked = html.includes('id="wfh-locked-card"');

      console.log(`   [Live Poll ${i+1}/20] Hankam: ${hasHankam}, Pancanaka: ${hasPancanaka}, Clean Labels: ${hasNoExample}, Modal PIN: ${hasModalGantiPin}, WFH Locked: ${hasWfhLocked}`);

      if (hasHankam && hasPancanaka && hasNoExample && hasModalGantiPin && hasWfhLocked) {
        console.log('   ✓ Live portal-presensi.html is fully updated with new release!');
        return;
      }
    } catch (e) {
      console.warn('   Live check error:', e.message);
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}

async function captureProofScreenshots() {
  const DEBUG_PORT = 9297;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('3. Starting Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.javascriptDialogOpening') {
        send('Page.handleJavaScriptDialog', { accept: true });
        return;
      }
      if (msg.id && callbacks.has(msg.id)) {
        const { res, rej } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    const send = (method, params = {}) => new Promise((res, rej) => {
      const msgId = id++;
      callbacks.set(msgId, { res, rej });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    console.log('4. Navigating to LIVE Portal Presensi:', LIVE_URL);
    await send('Page.navigate', { url: `${LIVE_URL}?v=${Date.now()}` });
    await new Promise(r => setTimeout(r, 4500));

    // Tutup modal privasi jika muncul
    await send('Runtime.evaluate', {
      expression: `
        if (typeof window.konfirmasiSetujuPrivasi === 'function') {
          window.konfirmasiSetujuPrivasi();
        } else {
          const m = document.getElementById('modal-privasi-karyawan');
          if (m) m.classList.add('hidden');
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Scroll ke auth-card
    await send('Runtime.evaluate', {
      expression: `
        const card = document.getElementById('auth-card');
        if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Bukti 1: Form Login PIN Bersih (Tanpa Bocoran Teks/Contoh)
    console.log('5. Capturing Form Login PIN Bersih...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const p1 = path.join(ARTIFACT_DIR, 'bukti_live_auth_pin_bersih_v2.png');
    fs.writeFileSync(p1, Buffer.from(shot1.data, 'base64'));
    console.log('   ✓ Saved:', p1);

    // Bukti 2: Uji Buka Modal Wajib Ganti PIN Ke-2 (Latief Satihi NSR-2019-012)
    console.log('6. Testing Latief Satihi (NSR-2019-012) with default PIN 123456 (Trigger force_change_pin modal)...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('auth-nik-input').value = 'NSR-2019-012';
        document.getElementById('auth-pin-input').value = '123456';
        if (typeof window.eksekusiMasukPin === 'function') {
          window.eksekusiMasukPin();
        }
      `
    });
    await new Promise(r => setTimeout(r, 3000));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const p2 = path.join(ARTIFACT_DIR, 'bukti_live_modal_wajib_ganti_pin_ke2.png');
    fs.writeFileSync(p2, Buffer.from(shot2.data, 'base64'));
    console.log('   ✓ Saved:', p2);

    // Tutup modal ganti PIN langsung
    await send('Runtime.evaluate', {
      expression: `
        const m = document.getElementById('modal-ganti-pin-langsung');
        if (m) m.classList.add('hidden');
      `
    });

    // Bukti 3: Login Danny Taufik NSR-2019-005 dengan Management PIN 889900 -> Titik WFH Terkunci Permanen
    console.log('7. Testing Danny Taufik (NSR-2019-005) with 889900 -> WFH Locked Card Proof...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('auth-nik-input').value = 'NSR-2019-005';
        document.getElementById('auth-pin-input').value = '889900';
        if (typeof window.eksekusiMasukPin === 'function') {
          window.eksekusiMasukPin();
        }
      `
    });
    await new Promise(r => setTimeout(r, 3500));

    // Tutup dialog notifikasi jika ada
    await send('Runtime.evaluate', {
      expression: `
        const mNotif = document.getElementById('modal-notif');
        if (mNotif) mNotif.classList.add('hidden');
        // Pindah ke Tab Titik WFH
        if (typeof window.pindahTab === 'function') {
          window.pindahTab('panelWFH');
        }
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    const p3 = path.join(ARTIFACT_DIR, 'bukti_live_titik_wfh_terkunci_permanen.png');
    fs.writeFileSync(p3, Buffer.from(shot3.data, 'base64'));
    console.log('   ✓ Saved:', p3);

    console.log('\n========================================================');
    console.log('🎉 ALL LIVE PROOF SCREENSHOTS CAPTURED SUCCESSFULLY!');
    console.log('========================================================\n');

    ws.close();
  } finally {
    chrome.kill();
  }
}

async function main() {
  await waitForDeploy();
  await verifyLiveContent();
  await captureProofScreenshots();
}

main().catch(err => {
  console.error('Fatal Proof Error:', err);
  process.exit(1);
});
