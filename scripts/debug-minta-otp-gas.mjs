const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec";

async function forwardToGas(payload) {
  const res = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    redirect: 'follow',
    body: JSON.stringify(payload)
  });
  const txt = await res.text();
  console.log('Status:', res.status, 'Url:', res.url);
  console.log('Raw text:', txt.substring(0, 500));
}

forwardToGas({
  action: 'mintaOTP',
  nik: 'NSR-2019-005',
  pdpNoticeVersion: 'PDP-NSR-EMP-2026.10'
});
