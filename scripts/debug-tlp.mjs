import fs from 'fs';
import http from 'http';
import { spawn } from 'child_process';

const phpServer = spawn('php', ['-S', '127.0.0.1:8897', '-t', '.'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1000));

try {
  const postData = JSON.stringify({
    action: 'publishOfficialLP',
    idPenugasan: 'NSR-TEST-DEV15-999',
    nomorLpResmi: 'LP/001/MKS/2026'
  });

  const req = http.request('http://127.0.0.1:8897/nolap-data-handler.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'X-NSR-Token': 'NSR-ADM-2026'
    }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Body:', body);
    });
  });
  req.write(postData);
  req.end();
  await new Promise(r => setTimeout(r, 500));
} finally {
  phpServer.kill();
}
