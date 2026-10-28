import https from 'node:https';

function fetchLiveText(url) {
  return new Promise((resolve, reject) => {
    https.get(url + '?nocache=' + Date.now(), res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function check() {
  const url = 'https://kjppnanangrahayu.com/index.html';
  console.log(`Checking live index.html at ${url}...`);
  const text = await fetchLiveText(url);
  console.log('Live length:', text.length);
  console.log('Contains "md:col-span-5" (Two-panel design):', text.includes('md:col-span-5'));
  console.log('Contains "Verifikasi & Masuk":', text.includes('Verifikasi &amp; Masuk') || text.includes('Verifikasi & Masuk'));
  console.log('Contains "serverContacted":', text.includes('serverContacted'));
}

check().catch(console.error);
