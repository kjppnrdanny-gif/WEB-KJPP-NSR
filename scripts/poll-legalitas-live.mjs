// scripts/poll-legalitas-live.mjs
const url = 'https://kjppnanangrahayu.com/';

async function checkLive() {
  console.log('Polling live site for Legalitas Terpadu revision (commit e672fbd)...');
  const maxAttempts = 15;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\nAttempt ${attempt}/${maxAttempts} (${new Date().toLocaleTimeString()})...`);
    try {
      const res = await fetch(url + '?_t=' + Date.now(), { cache: 'no-store' });
      const text = await res.text();
      const hasIkjpp = text.includes('IKJPP No. 19070160');
      const hasMappi = text.includes('Anggota MAPPI');
      const hasNib = text.includes('NIB: 9120403581857');
      const hasNkri = text.includes('Wilayah Kerja Seluruh NKRI');

      if (res.status === 200 && hasIkjpp && hasMappi && hasNib && hasNkri) {
        console.log(`  [LIVE OK] ${url} (HTTP ${res.status}, IKJPP & Anggota MAPPI verified on live site)`);
        console.log('\nSUCCESS: Homepage is 100% LIVE with updated Legalitas Terpadu & Asosiasi!');
        process.exit(0);
      } else {
        console.log(`  [PENDING] ${url} (HTTP ${res.status}, waiting for updated deployment)`);
      }
    } catch (err) {
      console.log(`  [ERR] ${url}: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 7000));
  }

  console.log('\nTimeout reached. Deployment may still be completing in CI/CD.');
  process.exit(1);
}

checkLive();
