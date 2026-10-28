import http from 'node:http';

const BASE_URL = 'http://127.0.0.1:8898';
const ADMIN_BDG_TOKEN = 'NSR-ADMIN-BDG-2026';

function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = { raw: data }; }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Check on running server
const res = await request('/nolap-data-handler.php?action=renderDocumentTemplate&templateName=TANDA_TERIMA&noReq=REQ-000042', {
  headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN }
});
console.log('Status:', res.status);
console.log('Data:', JSON.stringify(res.data, null, 2));
