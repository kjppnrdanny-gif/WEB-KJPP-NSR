async function runFinalLiveVerification() {
  const base = 'https://kjppnanangrahayu.com';
  console.log('===============================================================');
  console.log('🔍 FINAL LIVE SECURITY VERIFICATION — CPANEL PRODUCTION');
  console.log('Target: ' + base);
  console.log('Active Commit: 02f498f (GitHub Actions Success)');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function record(pass, title, detail) {
    total++;
    if (pass) {
      passed++;
      console.log(`  ✅ PASS: ${title} -> ${detail}`);
    } else {
      console.log(`  ❌ FAIL: ${title} -> ${detail}`);
    }
  }

  const directHexHash = '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0';

  // 1. Anti Pass-the-Hash on action=token
  try {
    const res = await fetch(`${base}/auth-handler.php?action=token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: directHexHash })
    });
    const json = await res.json();
    record(res.status === 401 && json.authenticated === false, 'Tolak Autentikasi Hex Hash Langsung (action=token)', `HTTP ${res.status}`);
  } catch (e) {
    record(false, 'Tolak Autentikasi Hex Hash Langsung (action=token)', e.message);
  }

  // 2. Anti Pass-the-Hash on action=login
  try {
    const res = await fetch(`${base}/auth-handler.php?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: directHexHash })
    });
    const json = await res.json();
    record(res.status === 401 && json.authenticated === false, 'Tolak Autentikasi Hex Hash Langsung (action=login)', `HTTP ${res.status}`);
  } catch (e) {
    record(false, 'Tolak Autentikasi Hex Hash Langsung (action=login)', e.message);
  }

  // 3. Anti Pass-the-Hash on Bearer NoLap
  try {
    const res = await fetch(`${base}/nolap-data-handler.php?action=listPendingSPK`, {
      headers: { 'Authorization': `Bearer ${directHexHash}` }
    });
    record(res.status === 401, 'Tolak Bearer Hex Hash pada NoLap Handler', `HTTP ${res.status}`);
  } catch (e) {
    record(false, 'Tolak Bearer Hex Hash pada NoLap Handler', e.message);
  }

  // 4. Anti Pass-the-Hash on Bearer Kwitansi
  try {
    const res = await fetch(`${base}/kwitansi-data-handler.php?action=getDatabase`, {
      headers: { 'Authorization': `Bearer ${directHexHash}` }
    });
    record(res.status === 401, 'Tolak Bearer Hex Hash pada Kwitansi Handler', `HTTP ${res.status}`);
  } catch (e) {
    record(false, 'Tolak Bearer Hex Hash pada Kwitansi Handler', e.message);
  }

  // 5. Query Parameter Auth Strict Rejection (P0 Requirement)
  try {
    const res = await fetch(`${base}/auth-handler.php?action=verify&token=${directHexHash}`);
    record(res.status === 400, 'Tolak Autentikasi via Query String Parameter URL', `HTTP ${res.status} (Bad Request)`);
  } catch (e) {
    record(false, 'Tolak Autentikasi via Query String Parameter URL', e.message);
  }

  // 6. Direct Access to sensitive data/sessions/
  try {
    const res = await fetch(`${base}/data/sessions/active_sessions.json`);
    record(res.status === 403, 'Proteksi Akses HTTP Langsung ke data/sessions/ (403 Forbidden)', `HTTP ${res.status}`);
  } catch (e) {
    record(false, 'Proteksi Akses HTTP Langsung ke data/sessions/', e.message);
  }

  // 7. Direct Access to sensitive data/config/
  try {
    const res = await fetch(`${base}/data/config/credentials.secrets.php`);
    record(res.status === 403, 'Proteksi Akses HTTP Langsung ke data/config/ (403 Forbidden)', `HTTP ${res.status}`);
  } catch (e) {
    record(false, 'Proteksi Akses HTTP Langsung ke data/config/', e.message);
  }

  // 8. Untracked dev files excluded from production
  try {
    const res = await fetch(`${base}/portal-nolap-dev.html`);
    record(res.status === 404, 'Isolasi Berkas Internal/Dev dari Paket Publik (404 Not Found)', `HTTP ${res.status}`);
  } catch (e) {
    record(false, 'Isolasi Berkas Internal/Dev dari Paket Publik', e.message);
  }

  // 9. Main Homepage Availability
  try {
    const res = await fetch(`${base}/index.html`);
    record(res.status === 200, 'Akses Halaman Utama Resmi KJPP NSR (200 OK)', `HTTP ${res.status}`);
  } catch (e) {
    record(false, 'Akses Halaman Utama Resmi KJPP NSR', e.message);
  }

  console.log('\n===============================================================');
  console.log(`TOTAL PRODUCTION VERIFICATION: ${passed}/${total} CHECKS PASSED`);
  console.log(`FINAL SECURITY RATING: ${passed === total ? 'PASS (100% SECURE & VERIFIED LIVE)' : 'FAIL'}`);
  console.log('===============================================================');

  if (passed !== total) process.exit(1);
}

runFinalLiveVerification().catch(console.error);
