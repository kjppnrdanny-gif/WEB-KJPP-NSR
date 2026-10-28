import { spawn } from 'node:child_process';
import fs from 'node:fs';

async function testDirect() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9496',
    '--no-sandbox',
    '--window-size=1280,900',
    'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec'
  ]);

  await new Promise(r => setTimeout(r, 9000));

  try {
    const listRes = await fetch('http://127.0.0.1:9496/json/list');
    const pages = await listRes.json();
    console.log('Pages:', pages.map(p => ({ title: p.title, url: p.url })));

    const gasPage = pages.find(p => p.url.includes('google.com') || p.url.includes('googleusercontent.com'));
    if (gasPage && gasPage.webSocketDebuggerUrl) {
      const ws = new WebSocket(gasPage.webSocketDebuggerUrl);
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

      await send('Page.enable');
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d\\gas_direct_preview.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved direct screenshot');
      ws.close();
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

testDirect();
