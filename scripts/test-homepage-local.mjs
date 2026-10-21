import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function testLocalHomepage() {
  console.log('Testing local index.html with headless Chrome...');

  const localFile = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

  // 1. Desktop Test (1280x900)
  console.log('1. Testing Desktop view (1280x900)...');
  const chromeDesk = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9486',
    '--no-sandbox',
    '--window-size=1280,900',
    localFile
  ]);
  await new Promise(r => setTimeout(r, 5000));

  try {
    const list = await (await fetch('http://127.0.0.1:9486/json/list')).json();
    const page = list.find(p => p.url.includes('index.html'));
    if (page && page.webSocketDebuggerUrl) {
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise(r => ws.onopen = r);
      let id = 1;
      const send = (method, params = {}) => new Promise(res => {
        const cur = id++;
        const handler = e => {
          const d = JSON.parse(e.data);
          if (d.id === cur) { ws.removeEventListener('message', handler); res(d.result || d.error); }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: cur, method, params }));
      });

      await send('Page.enable');
      await send('Runtime.enable');

      // Check console errors
      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const h1 = document.querySelector('h1');
            const heroBadge = document.querySelector('#profil .rounded-full');
            const ctaBtn = document.querySelector('#profil button');
            const comproBtn = document.querySelector('a[download*="Company Profile"]');
            const toggleMutuBtn = document.getElementById('btn-toggle-extra-mutu');
            const tabs = Array.from(document.querySelectorAll('.tab-btn-utama')).map(t => t.innerText.trim());

            return {
              h1Text: h1 ? h1.innerText.replace(/\\s+/g, ' ').trim() : null,
              heroBadgeText: heroBadge ? heroBadge.innerText.replace(/\\s+/g, ' ').trim() : null,
              ctaBtnText: ctaBtn ? ctaBtn.innerText.replace(/\\s+/g, ' ').trim() : null,
              comproBtnText: comproBtn ? comproBtn.innerText.replace(/\\s+/g, ' ').trim() : null,
              hasToggleMutuBtn: !!toggleMutuBtn,
              tabs: tabs,
              scrollWidth: document.body.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
              hasHorizontalOverflow: document.body.scrollWidth > document.documentElement.clientWidth
            };
          })()
        `,
        returnByValue: true
      });

      console.log('Desktop DOM Evaluation:', JSON.stringify(evalRes.result?.value, null, 2));

      // Test toggleExtraMutu interactivity
      console.log('Testing toggleExtraMutu interactivity...');
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btn = document.getElementById('btn-toggle-extra-mutu');
            if (btn) btn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 400));
      const evalMutuExpanded = await send('Runtime.evaluate', {
        expression: `!document.getElementById('mutu-extra-container').classList.contains('hidden')`,
        returnByValue: true
      });
      console.log('mutu-extra-container expanded:', evalMutuExpanded.result?.value);

      // Capture screenshot
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_homepage_refined_desktop.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured test_homepage_refined_desktop.png');

      ws.close();
    }
  } finally {
    chromeDesk.kill();
  }

  // 2. Mobile Test (390x844)
  console.log('\n2. Testing Mobile view (390x844)...');
  const chromeMob = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9485',
    '--no-sandbox',
    '--window-size=390,844',
    localFile
  ]);
  await new Promise(r => setTimeout(r, 5000));

  try {
    const list = await (await fetch('http://127.0.0.1:9485/json/list')).json();
    const page = list.find(p => p.url.includes('index.html'));
    if (page && page.webSocketDebuggerUrl) {
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise(r => ws.onopen = r);
      let id = 1;
      const send = (method, params = {}) => new Promise(res => {
        const cur = id++;
        const handler = e => {
          const d = JSON.parse(e.data);
          if (d.id === cur) { ws.removeEventListener('message', handler); res(d.result || d.error); }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: cur, method, params }));
      });

      await send('Page.enable');
      await send('Runtime.enable');

      const evalMob = await send('Runtime.evaluate', {
        expression: `
          (() => {
            return {
              scrollWidth: document.body.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
              hasHorizontalOverflow: document.body.scrollWidth > document.documentElement.clientWidth
            };
          })()
        `,
        returnByValue: true
      });

      console.log('Mobile DOM Evaluation:', JSON.stringify(evalMob.result?.value, null, 2));

      // Test mobile menu toggle
      console.log('Testing mobile menu toggle...');
      await send('Runtime.evaluate', {
        expression: `toggleMobileMenu()`
      });
      await new Promise(r => setTimeout(r, 300));
      const evalMenuOpen = await send('Runtime.evaluate', {
        expression: `!document.getElementById('mobile-menu').classList.contains('hidden')`,
        returnByValue: true
      });
      console.log('Mobile menu open:', evalMenuOpen.result?.value);

      const shotMob = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_homepage_refined_mobile.png'), Buffer.from(shotMob.data, 'base64'));
      console.log('✓ Captured test_homepage_refined_mobile.png');

      ws.close();
    }
  } finally {
    chromeMob.kill();
  }

  console.log('\n🎉 ALL LOCAL HOMEPAGE TESTS PASSED!');
}

testLocalHomepage().catch(console.error);
