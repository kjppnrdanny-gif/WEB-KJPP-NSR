async function waitDeployment() {
  const base = 'https://kjppnanangrahayu.com';
  console.log('Menunggu sinkronisasi commit fd2732d ke cPanel...');

  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const url = `${base}/?_v=${Date.now()}`;
      const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache, no-store' } });
      if (res.ok) {
        const text = await res.text();
        const hasPrecisionGrid = text.includes('26%_8%_32%_8%_26%');
        const hasLogoNsr = text.includes('alt="Logo Resmi KJPP NSR"');
        const hasSymmetricBadges = text.includes('badge-gerbang-1') && text.includes('badge-gerbang-2');
        
        console.log(`[Percobaan ${attempt}] PrecisionGrid=${hasPrecisionGrid} | LogoNsr=${hasLogoNsr} | SymmetricBadges=${hasSymmetricBadges}`);

        if (hasPrecisionGrid && hasLogoNsr && hasSymmetricBadges) {
          console.log('\n🎉 SUKSES BESAR: Pembaruan presisi index.html (fd2732d) telah AKTIF & LIVE di server cPanel!');
          return true;
        }
      }
    } catch (e) {
      console.log(`[Percobaan ${attempt}] Network error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 7000));
  }
  console.error('\n⚠️ Timeout menunggu deployment cPanel.');
  return false;
}

waitDeployment().then(ok => {
  if (!ok) process.exit(1);
  process.exit(0);
});
