import http from 'http';

const data = JSON.stringify({
  operator: 'NANANG',
  credential: '1234',
  idPenugasan: 'TEST-NSR-001'
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 8899,
  path: `/?action=verifyPengesahKing`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': `Bearer NSR8899`,
    'X-Session-Token': 'NSR8899'
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', err => console.error('Req error:', err));
req.write(data);
req.end();
