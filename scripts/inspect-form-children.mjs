import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

const TEST_PORT = 8899;
const CHROME_PORT = 9589;

const origHtml = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const server = http.createServer((req, res) => {
  const filePath = req.url.split('?')[0];
  if (filePath === '/' || filePath === '/portal-penugasan-jo.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(origHtml);
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

    const formChildren = await send('Runtime.evaluate', {
      expression: `(() => {
        const form = document.getElementById('form-penugasan');
        if (!form) return { error: 'No form' };
        
        const children = Array.from(form.children).map((c, i) => ({
          index: i,
          tag: c.tagName,
          id: c.id,
          cls: c.className.substring(0, 30),
          snippet: c.textContent.trim().substring(0, 50).replace(/\\s+/g, ' ')
        }));

        const lastChild = form.lastElementChild;
        return {
          childrenCount: children.length,
          children: children,
          lastChildHtml: lastChild ? lastChild.outerHTML.substring(0, 200) : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Form children in original HTML:');
    console.log(JSON.stringify(formChildren.result.value, null, 2));

  } finally {
    chrome.kill();
    server.close();
    process.exit(0);
  }
});
