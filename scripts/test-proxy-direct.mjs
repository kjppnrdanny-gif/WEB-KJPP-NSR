import handler from '../netlify/functions/absensi-data-proxy.mjs';

async function testProxy() {
  console.log('--- Test Proxy STATUS ---');
  const reqStatus = new Request('https://kjppnanangrahayu.com/api/absensi-data-proxy?action=STATUS', {
    method: 'GET'
  });
  const resStatus = await handler(reqStatus);
  const dataStatus = await resStatus.json();
  console.log('Status code:', resStatus.status);
  console.log('Result:', dataStatus);

  console.log('\n--- Test Proxy cekKaryawan ---');
  const reqCek = new Request('https://kjppnanangrahayu.com/api/absensi-data-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cekKaryawan', nik: 'NSR-2019-005' })
  });
  const resCek = await handler(reqCek);
  const dataCek = await resCek.json();
  console.log('Status code:', resCek.status);
  console.log('Result:', dataCek);
}

testProxy().catch(console.error);
