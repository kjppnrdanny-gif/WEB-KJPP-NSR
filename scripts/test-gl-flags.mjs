import { spawn } from 'node:child_process';

const testFlags = [
  ['--use-gl=angle', '--use-angle=d3d11'],
  ['--use-gl=angle', '--use-angle=gl'],
  ['--in-process-gpu'],
  ['--use-gl=desktop'],
];

for (const flags of testFlags) {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9245',
    '--no-sandbox',
    '--ignore-gpu-blocklist',
    ...flags,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));
  try {
    const targetRes = await fetch('http://127.0.0.1:9245/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise(res => {
        const id = msgId++;
        const handler = e => {
          const m = JSON.parse(e.data);
          if (m.id === id) { ws.removeEventListener('message', handler); res(m); }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Runtime.enable');
    const testGl = await send('Runtime.evaluate', {
      expression: `(() => {
        const c = document.createElement('canvas');
        return {
          webgl: Boolean(c.getContext('webgl')),
          webgl2: Boolean(c.getContext('webgl2'))
        };
      })()`,
      returnByValue: true
    });
    console.log('Flags:', flags.join(' '), '=>', testGl.result.result.value);
    ws.close();
  } catch(e) {
    console.log('Error with flags', flags.join(' '), e.message);
  } finally {
    chrome.kill('SIGKILL');
    await new Promise(r => setTimeout(r, 500));
  }
}
