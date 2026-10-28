import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const WIDTHS = [320, 360, 375, 390, 414];

async function testAllWidths() {
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-widths-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9566',
    '--no-sandbox',
    `--user-data-dir=${tmpProfile}`,
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 3000));
    const targetUrl = 'file:///d:/WEB%20KJPP%20NSR_Compro%20new%20ver/kjpp-nsr-netlify-production/index.html';
    const targetRes = await fetch('http://127.0.0.1:9566/json/new?' + encodeURIComponent(targetUrl), { method: 'PUT' });
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
        cb(m.result || m.error);
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

    const results = [];

    for (const w of WIDTHS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 800,
        deviceScaleFactor: 2,
        mobile: true
      });
      await new Promise(r => setTimeout(r, 1000));

      const evalData = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const nav = document.querySelector('.lg\\\\:hidden.flex.items-center.justify-between');
            const menuBtn = nav?.querySelector('button[onclick*="toggleMobileMenu"]');
            const links = nav ? Array.from(nav.querySelectorAll('a')).filter(a => window.getComputedStyle(a).display !== 'none') : [];
            const opiniBtn = nav?.querySelector('button[onclick*="bukaModalPortal"]');
            
            const bodyScrollWidth = document.documentElement.scrollWidth;
            const bodyClientWidth = document.documentElement.clientWidth;
            const hasHorizontalScroll = bodyScrollWidth > bodyClientWidth;

            const menuRect = menuBtn?.getBoundingClientRect();
            const opiniRect = opiniBtn?.getBoundingClientRect();
            const navRect = nav?.getBoundingClientRect();

            // Check if menu and opini are on the same vertical line (no wrap)
            const isSameLine = Math.abs((menuRect?.top || 0) - (opiniRect?.top || 0)) < 10;

            return {
              width: window.innerWidth,
              hasHorizontalScroll,
              isSameLine,
              navHeight: navRect?.height,
              menuText: menuBtn?.innerText?.trim(),
              menuY: menuRect?.top,
              opiniText: opiniBtn?.innerText?.trim(),
              opiniY: opiniRect?.top,
              opiniRight: opiniRect?.right,
              visibleLinks: links.map(l => l.innerText.trim())
            };
          })()
        `,
        returnByValue: true
      });

      console.log(`Width ${w}px result:`, evalData?.result?.value);
      results.push(evalData?.result?.value);

      // Capture screenshot
      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: w, height: 180, scale: 2 }
      });
      fs.writeFileSync(path.join(ARTIFACT_DIR, `mobile_navbar_${w}px.png`), Buffer.from(shot.data, 'base64'));
      console.log(`Saved mobile_navbar_${w}px.png`);
    }

    ws.close();
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    chrome.kill();
    try {
      fs.rmSync(tmpProfile, { recursive: true, force: true });
    } catch (e) {}
  }
}

testAllWidths();
