import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PORT = 9560;
const URL = 'http://127.0.0.1:8915/portal-penugasan-jo.html';

async function testTab3() {
  const php = spawn('php', ['-S', '127.0.0.1:8915', 'router.php'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-tab3-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1440,1200',
    '--user-data-dir=' + tmpProfile,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));
  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === msgId) {
          ws.removeEventListener('message', handler);
          if (m.error) reject(new Error(JSON.stringify(m.error)));
          else resolve(m.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  await send('Page.navigate', { url: URL });
  await new Promise(r => setTimeout(r, 2000));

  // Login KING
  await send('Runtime.evaluate', {
    expression: `(async () => {
      document.getElementById('input_token_auth').value = (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN");
      await verifikasiTokenLogin(null);
    })()`,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 800));

  // Click Tab 3
  await send('Runtime.evaluate', {
    expression: `(() => {
      gantiTab(3);
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  // Inspect visible text and elements in page
  const inspectRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const tab1 = document.getElementById('tab-content-form');
      const tab2 = document.getElementById('tab-content-dashboard');
      const tab3 = document.getElementById('tab-3');
      const tab1Visible = tab1 && !tab1.classList.contains('hidden') && tab1.offsetParent !== null;
      const tab2Visible = tab2 && !tab2.classList.contains('hidden') && tab2.offsetParent !== null;
      const tab3Visible = tab3 && !tab3.classList.contains('hidden') && tab3.offsetParent !== null;

      const renderedArea = document.getElementById('preview-rendered-area');
      const renderedText = renderedArea ? renderedArea.innerText.slice(0, 1000) : '';

      // Check if any Section 01, Section 02 etc are visible in document
      const allSections = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.innerText || '';
        return el.children.length === 0 && (/Section 01|Section 02|Section 03|Bagian 1|Bagian 2/i.test(text) || /Formulir Permohonan/i.test(text)) && el.offsetParent !== null;
      }).map(el => ({ tag: el.tagName, text: el.innerText, parentId: el.closest('[id]')?.id }));

      return JSON.stringify({
        tab1Visible,
        tab2Visible,
        tab3Visible,
        renderedTextLength: renderedText.length,
        renderedTextSample: renderedText.slice(0, 300),
        allVisibleSections: allSections
      });
    })()`,
    returnByValue: true
  });

  console.log('Tab 3 Inspection:', JSON.parse(inspectRes.result?.value || '{}'));

  chrome.kill();
  php.kill();
}

testTab3().catch(console.error);
