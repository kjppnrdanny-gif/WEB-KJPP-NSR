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

const LIVE_BASE = 'https://kjppnanangrahayu.com';
const pages = [
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html',
  'lib/opini-nsr-modal-engine.js'
];

async function verifyAll() {
  console.log('====================================================');
  console.log('VERIFIKASI LIVE STATUS SEMUA HALAMAN DI PRODUCTION');
  console.log('====================================================');

  for (const page of pages) {
    const url = `${LIVE_BASE}/${page}`;
    try {
      const text = await fetchLiveText(url);
      const isJs = page.endsWith('.js');
      const hasRedesign = isJs
        ? text.includes('OPINI_NSR_MODAL_HEADER_HTML') && text.includes('serverContacted')
        : text.includes('md:col-span-5') && text.includes('Verifikasi &amp; Masuk') && text.includes('serverContacted');

      console.log(`[${hasRedesign ? 'PASS' : 'FAIL'}] ${page}: Length=${text.length}, Redesign=${hasRedesign}`);
    } catch (err) {
      console.error(`[ERROR] ${page}:`, err.message);
    }
  }
}

verifyAll().catch(console.error);
