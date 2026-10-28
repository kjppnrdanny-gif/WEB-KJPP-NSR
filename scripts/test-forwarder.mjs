const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec";

async function forwardToGas(payload) {
  console.log('Forwarding payload to GAS:', payload);
  const res = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    redirect: 'follow',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data;
}

async function test() {
  const statusRes = await forwardToGas({ action: 'STATUS' });
  console.log('STATUS Res:', statusRes);

  const cekRes = await forwardToGas({ action: 'cekKaryawan', nik: 'NSR-2019-005' });
  console.log('cekKaryawan Res:', cekRes);
}

test().catch(console.error);
