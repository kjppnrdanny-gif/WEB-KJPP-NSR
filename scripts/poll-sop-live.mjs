// scripts/poll-sop-live.mjs
const urls = [
  'https://kjppnanangrahayu.com/',
  'https://kjppnanangrahayu.com/layanan.html'
];

async function checkLive() {
  console.log('Polling live site for Tahap 01 SPI 103 revision (commit 47327c1)...');
  const maxAttempts = 15;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\nAttempt ${attempt}/${maxAttempts} (${new Date().toLocaleTimeString()})...`);
    let bothDeployed = true;

    for (const url of urls) {
      try {
        const res = await fetch(url + '?_t=' + Date.now(), { cache: 'no-store' });
        const text = await res.text();
        const hasSpi103 = text.includes('SPI 103');
        const hasSuratRep = text.includes('Surat Representasi');
        const hasCardTitle = text.includes('Permintaan &amp; Lingkup Penugasan (SPK)');

        if (res.status === 200 && hasSpi103 && hasSuratRep && hasCardTitle) {
          console.log(`  [LIVE OK] ${url} (HTTP ${res.status}, SPI 103 & Surat Representasi verified)`);
        } else {
          console.log(`  [PENDING] ${url} (HTTP ${res.status}, waiting for updated deployment)`);
          bothDeployed = false;
        }
      } catch (err) {
        console.log(`  [ERR] ${url}: ${err.message}`);
        bothDeployed = false;
      }
    }

    if (bothDeployed) {
      console.log('\nSUCCESS: Both pages are 100% LIVE with Tahap 01 SPI 103 & Surat Representasi on production!');
      process.exit(0);
    }

    await new Promise(r => setTimeout(r, 8000));
  }

  console.log('\nTimeout reached. Deployment may still be completing in CI/CD.');
  process.exit(1);
}

checkLive();
