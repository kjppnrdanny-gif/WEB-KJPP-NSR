import { spawn } from 'node:child_process';

async function inspectContent() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9495',
    '--no-sandbox',
    '--window-size=1280,900',
    'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec'
  ]);

  await new Promise(r => setTimeout(r, 10000));

  try {
    const listRes = await fetch('http://127.0.0.1:9495/json/list');
    const pages = await listRes.json();
    const appPanel = pages.find(p => p.url.includes('userCodeAppPanel'));
    if (appPanel && appPanel.webSocketDebuggerUrl) {
      const ws = new WebSocket(appPanel.webSocketDebuggerUrl);
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

      const textRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            return {
              text: document.body.innerText.slice(0, 1000),
              buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean),
              inputs: Array.from(document.querySelectorAll('input')).map(i => ({ id: i.id, placeholder: i.placeholder, type: i.type })),
              scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src)
            };
          })()
        `,
        returnByValue: true
      });
      console.log('App Panel Details:', JSON.stringify(textRes.result?.value, null, 2));
      ws.close();
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

inspectContent();
