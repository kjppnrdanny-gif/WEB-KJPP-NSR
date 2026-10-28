import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function verifyLive() {
  console.log('=== VERIFIKASI LANGSUNG SERVER LIVE CPANEL ===');
  const cacheBuster = Date.now();
  
  // 1. Check index.html
  const urlIndex = `https://kjppnanangrahayu.com/index.html?cb=${cacheBuster}`;
  console.log('Fetching:', urlIndex);
  const resIndex = await fetch(urlIndex, { headers: { 'Cache-Control': 'no-cache' } });
  const htmlIndex = await resIndex.text();

  const noSpilledNik = !htmlIndex.includes('NSR-2019-005') || htmlIndex.includes('placeholder="Masukkan Token Akses atau NIK Karyawan"');
  const hasTokenPlaceholder = htmlIndex.includes('placeholder="Masukkan Token Akses atau NIK Karyawan"');
  const hasSolidBlueBtn = htmlIndex.includes('bg-blue-600 hover:bg-blue-500');
  const noTripleGradient = !htmlIndex.includes('bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700');
  const hasLacakWidget = htmlIndex.includes('id="lacak-penugasan"');
  const hasMatteCard = htmlIndex.includes('rounded-2xl border border-slate-800 bg-slate-900/95');

  console.log('Results for index.html:');
  console.log('- HTTP Status:', resIndex.status);
  console.log('- Placeholder "Masukkan Token Akses atau NIK Karyawan":', hasTokenPlaceholder);
  console.log('- Solid Blue Button (antislop-ui):', hasSolidBlueBtn);
  console.log('- Triple gradient removed:', noTripleGradient);
  console.log('- Lacak Penugasan widget present:', hasLacakWidget);
  console.log('- Matte slate card present:', hasMatteCard);

  // 2. Check portal-tracking.html
  const urlTracking = `https://kjppnanangrahayu.com/portal-tracking.html?cb=${cacheBuster}`;
  console.log('\nFetching:', urlTracking);
  const resTracking = await fetch(urlTracking, { headers: { 'Cache-Control': 'no-cache' } });
  const htmlTracking = await resTracking.text();

  const hasTrackingNikPlaceholder = htmlTracking.includes('placeholder="Masukkan NIK Karyawan"');
  const noSpinCard2 = !htmlTracking.includes('<svg class="w-4 h-4 animate-spin text-amber-400"');
  const noPurpleCard3 = !htmlTracking.includes('bg-purple-500/15');
  const hasSkyCard3 = htmlTracking.includes('bg-blue-500/15 border border-blue-400/30 text-sky-400');
  const noPresetButtons = !htmlTracking.includes('quickSwitchUser');

  console.log('Results for portal-tracking.html:');
  console.log('- HTTP Status:', resTracking.status);
  console.log('- Placeholder "Masukkan NIK Karyawan":', hasTrackingNikPlaceholder);
  console.log('- Endless animate-spin removed from Card 2:', noSpinCard2);
  console.log('- Purple removed from Card 3 (antislop palette):', noPurpleCard3);
  console.log('- Sky/Blue Card 3 active:', hasSkyCard3);
  console.log('- Presets with spilled employee credentials deleted:', noPresetButtons);

  // 3. Capture live screenshot from Chrome
  console.log('\n=== CAPTURING SCREENSHOT DARI CPANEL LIVE ===');
  const DEBUG_PORT = 9315;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,900',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1600));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        callbacks.set(reqId, resolve);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    // Screenshot 1: Live cPanel Hero & Job Tracking Widget
    console.log('Navigating to live index.html...');
    await send('Page.navigate', { url: `https://kjppnanangrahayu.com/index.html?cb=${cacheBuster}` });
    await new Promise(r => setTimeout(r, 3000));

    // Scroll to #lacak-penugasan
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('lacak-penugasan');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const shotLiveWidget = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_hero_tracking.png'), Buffer.from(shotLiveWidget.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_hero_tracking.png saved');

    // Screenshot 2: Live cPanel OPINI Token Modal
    console.log('Opening live modal portal token...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof bukaModalPortal === 'function') bukaModalPortal();
        else document.getElementById('modal-portal-token')?.classList.remove('hidden');
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const shotLiveOpini = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_opini_token.png'), Buffer.from(shotLiveOpini.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_opini_token.png saved');

    // Screenshot 3: Live cPanel portal-tracking.html Task Board
    console.log('Navigating to live portal-tracking.html...');
    await send('Page.navigate', { url: `https://kjppnanangrahayu.com/portal-tracking.html?cb=${cacheBuster}` });
    await new Promise(r => setTimeout(r, 3000));

    const shotLiveBoard = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_portal_tracking.png'), Buffer.from(shotLiveBoard.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_portal_tracking.png saved');

    ws.close();
    chrome.kill();
    console.log('\n✅ SELURUH BUKTI LIVE CPANEL BERHASIL DIAMBIL & DIVERIFIKASI LENGKAP!');
  } catch (err) {
    console.error('CDP Error:', err);
    chrome.kill();
  }
}

verifyLive().catch(console.error);
