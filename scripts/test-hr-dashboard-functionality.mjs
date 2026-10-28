import https from 'https';

function postJson(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  const niks = [
    { nik: 'NSR-2019-005', desc: 'Danny Taufik Hidayat' },
    { nik: 'NSR-2019-001', desc: 'Nanang Rahayu' },
    { nik: 'NSR-2019-004', desc: 'Milda Hidayati Dewi' },
    { nik: 'NSR-2019-010', desc: 'Fadri Nurdin (Staf Biasa)' }
  ];

  console.log("=== 1. TEST CEK KARYAWAN & IS_ADMIN_HR ===");
  for (const item of niks) {
    const res = await postJson('https://kjppnanangrahayu.com/api/absensi-data-proxy?action=cekKaryawan', {
      action: 'cekKaryawan',
      nik: item.nik
    });
    console.log(`${item.nik} (${item.desc}) -> HTTP ${res.status}: isAdminHR = ${res.data?.isAdminHR}`);
  }

  console.log("\n=== 2. TEST GET DASHBOARD HR TANPA TOKEN (UNAUTHENTICATED) ===");
  const unauthRes = await postJson('https://kjppnanangrahayu.com/api/absensi-data-proxy?action=getDashboardHR', {
    action: 'getDashboardHR',
    tanggal: '2026-10-26'
  });
  console.log(`Unauthenticated getDashboardHR -> HTTP ${unauthRes.status}:`, unauthRes.data || unauthRes.raw);

  console.log("\n=== 3. TEST GET DASHBOARD HR DENGAN MASTER KEY ===");
  const masterKeyRes = await postJson('https://kjppnanangrahayu.com/api/absensi-data-proxy?action=getDashboardHR', {
    action: 'getDashboardHR',
    tanggal: '2026-10-26'
  }, {
    'X-Admin-Key': 'NSR_HR_MASTER_KEY_2026'
  });
  console.log(`Master Key getDashboardHR -> HTTP ${masterKeyRes.status}: success = ${masterKeyRes.data?.success}`);
  if (masterKeyRes.data?.ringkasan) {
    console.log("Ringkasan Dashboard:", masterKeyRes.data.ringkasan);
  }
}

run();
