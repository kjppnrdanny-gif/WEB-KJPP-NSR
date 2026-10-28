// scripts/poll-branch-photos-live.mjs
const baseUrl = 'https://kjppnanangrahayu.com';

async function checkLive() {
  console.log('Polling live site for Branch Photos deployment (commit 8eaa5e3)...');
  const maxAttempts = 20;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\nAttempt ${attempt}/${maxAttempts} (${new Date().toLocaleTimeString()})...`);
    try {
      // 1. Check portofolio-rekanan.html
      const resPorto = await fetch(`${baseUrl}/portofolio-rekanan.html?_t=${Date.now()}`, { cache: 'no-store' });
      const textPorto = await resPorto.text();
      const has14 = textPorto.includes('14 Dokumentasi Terverifikasi');
      const hasBandungCard = textPorto.includes('kantor-cabang-bandung.jpeg');
      const hasPadangCard = textPorto.includes('kantor-cabang-padang.jpeg');

      // 2. Check direct image URLs
      const resImgBdg = await fetch(`${baseUrl}/images/kegiatan/kantor-cabang-bandung.jpeg?_t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
      const resImgPdg = await fetch(`${baseUrl}/images/kegiatan/kantor-cabang-padang.jpeg?_t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });

      // 3. Check index.html carousel
      const resIndex = await fetch(`${baseUrl}/?_t=${Date.now()}`, { cache: 'no-store' });
      const textIndex = await resIndex.text();
      const hasIndexBdg = textIndex.includes('kantor-cabang-bandung.jpeg');

      console.log(`  portofolio-rekanan.html: HTTP ${resPorto.status}, 14 Dok: ${has14}, Bandung: ${hasBandungCard}, Padang: ${hasPadangCard}`);
      console.log(`  Image Bandung HTTP: ${resImgBdg.status}, Image Padang HTTP: ${resImgPdg.status}`);
      console.log(`  index.html Bandung: ${hasIndexBdg}`);

      if (has14 && hasBandungCard && hasPadangCard && resImgBdg.status === 200 && resImgPdg.status === 200 && hasIndexBdg) {
        console.log('\n🎉 SUCCESS: All new branch office documentation photos are 100% LIVE on production!');
        process.exit(0);
      }
    } catch (err) {
      console.log(`  [ERR]: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 7000));
  }

  console.log('\nTimeout reached. Deployment may still be completing in CI/CD.');
  process.exit(1);
}

checkLive();
