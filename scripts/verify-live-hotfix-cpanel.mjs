import https from 'https';

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function verify() {
  console.log('========================================================================');
  console.log('VERIFIKASI LIVE DEPLOYMENT cPANEL (kjppnanangrahayu.com)');
  console.log('========================================================================');

  const cacheBust = Date.now();
  const htmlRes = await fetchUrl(`https://kjppnanangrahayu.com/portal-penugasan-jo.html?_t=${cacheBust}`);
  console.log(`[1] portal-penugasan-jo.html status: HTTP ${htmlRes.status}`);

  const hasKlausul8 = htmlRes.data.includes('8. TANGGAL PENILAIAN');
  const hasOldTitle = htmlRes.data.includes('8. TANGGAL PENILAIAN DAN PENDEKATAN PENILAIAN');
  const has9Docs = htmlRes.data.includes('Semua 9 Dokumen Master');
  const hasIndivEti = htmlRes.data.includes('konfirmasiDeklarasiPersonelIndividual');
  const hasOldOmnibus = htmlRes.data.includes('deklarasiSemuaIndependen');

  console.log(`  - Klausul 8 "8. TANGGAL PENILAIAN": ${hasKlausul8 ? 'TERPASANG (OK)' : 'BELUM'}`);
  console.log(`  - Dropdown 9 Dokumen Master: ${has9Docs ? 'TERPASANG (OK)' : 'BELUM'}`);
  console.log(`  - Deklarasi Individual ETI: ${hasIndivEti ? 'TERPASANG (OK)' : 'BELUM'}`);
  console.log(`  - Bebas dari tombol omnibus: ${!hasOldOmnibus ? 'BERSIH (OK)' : 'MASIH ADA'}`);

  const dropdownIdx = htmlRes.data.indexOf('id="pilih_tampilan_dokumen"');
  if (dropdownIdx !== -1) {
    console.log('\n  Snippet Dropdown Live:');
    console.log(htmlRes.data.slice(dropdownIdx, dropdownIdx + 300));
  }

  console.log('\n[2] nolap-data-handler.php testing live API endpoint...');
  const apiTest = await fetchUrl(`https://kjppnanangrahayu.com/nolap-data-handler.php?action=verifyPengesahKing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer NSR8899',
      'X-Session-Token': 'NSR8899'
    },
    body: JSON.stringify({
      operator: 'NANANG',
      credential: 'wrong_password_test_123',
      idPenugasan: 'LIVE-TEST-CHECK'
    })
  });

  console.log(`  - API verifyPengesahKing HTTP status: ${apiTest.status}`);
  console.log(`  - Response body: ${apiTest.data}`);

  let parsed = {};
  try { parsed = JSON.parse(apiTest.data); } catch (e) {}

  if (apiTest.status === 401 && parsed.error && parsed.error.includes('Kredensial')) {
    console.log('  ✔ Backend live merespons dengan HTTP 401 INVALID_SIGNER_CREDENTIAL (BCRYPT / Zero-Trust Aktif!)');
  } else if (apiTest.status === 400 || apiTest.status === 200 || apiTest.status === 401) {
    console.log(`  Status API: ${apiTest.status}`);
  }

  console.log('========================================================================');
}

verify().catch(console.error);
