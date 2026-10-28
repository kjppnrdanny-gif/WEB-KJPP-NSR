import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

const TEST_PORT = 8899;
const CHROME_PORT = 9589;

// Read original html
const origHtml = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = origHtml.split('\n');

// Find line around 1405 that has extra </div>
console.log('Line 1404:', lines[1403]);
console.log('Line 1405:', lines[1404]);
console.log('Line 1406:', lines[1405]);
console.log('Line 1407:', lines[1406]);

// Remove the line 1406 (index 1405)
lines.splice(1405, 1);
const patchedHtml = lines.join('\n');

const server = http.createServer((req, res) => {
  const filePath = req.url.split('?')[0];
  if (filePath === '/' || filePath === '/portal-penugasan-jo.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(patchedHtml);
  } else if (fs.existsSync('.' + filePath)) {
    const ext = filePath.split('.').pop();
    const contentType = ext === 'html' ? 'text/html' : ext === 'js' ? 'application/javascript' : 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync('.' + filePath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(TEST_PORT, async () => {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,900'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const wsRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/list`);
    const pages = await wsRes.json();
    const page = pages.find(p => p.type === 'page') || pages[0];

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    let idCounter = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: `http://127.0.0.1:${TEST_PORT}/portal-penugasan-jo.html` });
    await new Promise(r => setTimeout(r, 2000));

    const result = await send('Runtime.evaluate', {
      expression: `(() => {
        const tabForm = document.getElementById('tab-content-form');
        const tabDash = document.getElementById('tab-content-dashboard');
        const tab3 = document.getElementById('tab-3');
        const formPenugasan = document.getElementById('form-penugasan');

        const inpSurvey = document.getElementById('survey_hari');
        const inpBiaya = document.getElementById('biaya_honorarium');
        const cardPenilai08 = document.getElementById('g1-selected-penilai-card');
        const btnSubmit = document.getElementById('btn-submit-form');

        const main = document.querySelector('main');
        const mainChildren = Array.from(main.children).map(c => ({
          tag: c.tagName,
          id: c.id,
          class: c.className.substring(0, 30)
        }));

        return {
          tabFormExists: !!tabForm,
          tabDashExists: !!tabDash,
          tab3Exists: !!tab3,
          isSurveyInsideForm: formPenugasan ? formPenugasan.contains(inpSurvey) : false,
          isBiayaInsideForm: formPenugasan ? formPenugasan.contains(inpBiaya) : false,
          isCard08InsideForm: formPenugasan ? formPenugasan.contains(cardPenilai08) : false,
          isBtnSubmitInsideForm: formPenugasan ? formPenugasan.contains(btnSubmit) : false,
          isFormInsideTabContentForm: tabForm ? tabForm.contains(formPenugasan) : false,
          mainChildrenCount: mainChildren.length,
          mainChildren: mainChildren
        };
      })()`,
      returnByValue: true
    });

    console.log('Result in real Chrome after removing line 1406:');
    console.log(JSON.stringify(result.result.value, null, 2));

  } finally {
    chrome.kill();
    server.close();
    process.exit(0);
  }
});
