async function waitDeployment() {
  const base = 'https://kjppnanangrahayu.com';
  console.log('Menunggu sinkronisasi commit ed56ade ke cPanel...');

  for (let attempt = 1; attempt <= 40; attempt++) {
    try {
      const url = `${base}/portal-presensi.html?_v=${Date.now()}`;
      const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache, no-store' } });
      if (res.ok) {
        const text = await res.text();
        const hasEksekusiVerif = text.includes('eksekusiVerifikasiOTP');
        const hasVerifiedFlag = text.includes('nsr_presensi_verified');

        console.log(`[Percobaan ${attempt}] hasEksekusiVerif=${hasEksekusiVerif} | hasVerifiedFlag=${hasVerifiedFlag}`);

        if (hasEksekusiVerif && hasVerifiedFlag) {
          console.log('\n🎉 SUKSES: Pembaruan portal-presensi.html (ed56ade) telah AKTIF & LIVE di server cPanel!');
          return true;
        }
      }
    } catch (e) {
      console.log(`[Percobaan ${attempt}] Network error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  console.error('\n⚠️ Timeout menunggu deployment cPanel.');
  return false;
}

waitDeployment().then(ok => {
  if (!ok) process.exit(1);
  process.exit(0);
});
