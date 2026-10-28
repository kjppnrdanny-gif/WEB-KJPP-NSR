import https from 'node:https';

const HOST = 'kjppnanangrahayu.com';

function callApi(token, action, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    };
    if (token) headers['X-NSR-Token'] = token;
    if (postData) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request({
      hostname: HOST,
      port: 443,
      path: `/operasional-data-handler.php?action=${action}`,
      method: method,
      headers: headers,
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, data, json });
      });
    });

    req.on('error', (err) => resolve({ status: -1, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: -2, error: 'timeout' }); });
    if (postData) req.write(postData);
    req.end();
  });
}

async function testLive() {
  console.log('Testing live production:', HOST);

  // 1. Unauthenticated
  const rUnauth = await callApi(null, 'getPengajuanList');
  console.log('1. Unauth getPengajuanList -> Status:', rUnauth.status, rUnauth.json?.error || rUnauth.data);

  // 2. NSR-DIVTEK-2026 (Manager Teknik)
  const rDivtek = await callApi('NSR-DIVTEK-2026', 'getPengajuanList');
  console.log('2. NSR-DIVTEK-2026 getPengajuanList -> Status:', rDivtek.status, 'Success:', rDivtek.json?.success, 'Count:', rDivtek.json?.data?.length);

  // 3. NSR-VAL-2026 staff trying approveTier
  const rValApprove = await callApi('NSR-VAL-2026', 'approveTier', 'POST', { id: 'TEST-ID', tier: 1 });
  console.log('3. NSR-VAL-2026 approveTier 1 -> Status:', rValApprove.status, rValApprove.json?.error || rValApprove.data);

  // 4. NSR-SRV-2026 staff trying rejectWithNote
  const rSrvReject = await callApi('NSR-SRV-2026', 'rejectWithNote', 'POST', { id: 'TEST-ID', alasan: 'Penolakan uji coba RBAC keamanan.', tier: 1 });
  console.log('4. NSR-SRV-2026 rejectWithNote -> Status:', rSrvReject.status, rSrvReject.json?.error || rSrvReject.data);

  // 5. NSR-REK-2026 legacy rekan trying approveTier
  const rRekApprove = await callApi('NSR-REK-2026', 'approveTier', 'POST', { id: 'TEST-ID', tier: 1 });
  console.log('5. NSR-REK-2026 approveTier 1 -> Status:', rRekApprove.status, rRekApprove.json?.error || rRekApprove.data);

  // 6. NSR-REV-2026 legacy reviewer trying approveTier
  const rRevApprove = await callApi('NSR-REV-2026', 'approveTier', 'POST', { id: 'TEST-ID', tier: 1 });
  console.log('6. NSR-REV-2026 approveTier 1 -> Status:', rRevApprove.status, rRevApprove.json?.error || rRevApprove.data);

  // 7. Check if any raw tokens are leaked in portal-operasional.html
  const rPortal = await new Promise((resolve) => {
    https.get(`https://${HOST}/portal-operasional.html?v=${Date.now()}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });

  const leaks[REDACTED_SUPER_ADMIN_TOKEN] = rPortal.includes((process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN"));
  const leaksPST = rPortal.includes((process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"));
  const leaksDIVTEK = rPortal.includes('NSR-DIVTEK-2026');
  console.log('7. Portal HTML Secret Leak Check:');
  console.log('   - Leaks [REDACTED_SUPER_ADMIN_TOKEN]:', leaks[REDACTED_SUPER_ADMIN_TOKEN]);
  console.log('   - Leaks [REDACTED_ADMIN_PUSAT_TOKEN]:', leaksPST);
  console.log('   - Leaks NSR-DIVTEK-2026:', leaksDIVTEK);
}

testLive();
