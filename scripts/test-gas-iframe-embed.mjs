import { spawn } from 'node:child_process';
import http from 'node:http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head><title>Test Wrapper</title></head>
    <body style="margin:0;padding:0;">
      <iframe id="testIframe"
              src="https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec"
              style="width:100vw;height:100vh;border:none;"
              allow="geolocation *; camera *; microphone *; clipboard-write *">
      </iframe>
    </body>
    </html>
  `);
});

server.listen(8088, async () => {
  console.log('Local test server running on 8088');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9498',
    '--no-sandbox',
    'http://127.0.0.1:8088'
  ]);

  await new Promise(r => setTimeout(r, 5000));

  try {
    const listRes = await fetch('http://127.0.0.1:9498/json/list');
    const pages = await listRes.json();
    console.log('Pages in chrome:', pages.map(p => ({ title: p.title, url: p.url })));

    // Connect to WebSocket to inspect iframe loading and console messages
    const page = pages.find(p => p.url.includes('8088'));
    if (page && page.webSocketDebuggerUrl) {
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

      ws.addEventListener('message', (e) => {
        const m = JSON.parse(e.data);
        if (m.method === 'Console.messageAdded' || m.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', m.params?.message?.text || m.params?.args?.map(a => a.value).join(' '));
        }
      });

      await send('Console.enable');
      await send('Runtime.enable');
      await send('Page.enable');

      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const ifr = document.getElementById('testIframe');
            return {
              src: ifr.src,
              contentDocTitle: ifr.contentDocument ? ifr.contentDocument.title : 'CROSS-ORIGIN',
              offsetWidth: ifr.offsetWidth,
              offsetHeight: ifr.offsetHeight
            };
          })()
        `,
        returnByValue: true
      });
      console.log('Iframe info in DOM:', evalRes.result?.value);
      ws.close();
    }
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    chrome.kill();
    server.close();
  }
});
