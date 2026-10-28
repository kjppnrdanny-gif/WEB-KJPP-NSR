async function pollProduction() {
  const url = 'https://kjppnanangrahayu.com/portal-penugasan-jo.html';
  console.log('====================================================');
  console.log('POLLING cPanel LIVE DEPLOYMENT FOR COMMIT 733d246...');
  console.log('Target: https://kjppnanangrahayu.com/portal-penugasan-jo.html');
  console.log('====================================================\n');

  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const res = await fetch(url + '?_t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      const text = await res.text();
      
      const hasPenggunaToggle = text.includes('chk_pengguna_sama_pemberi');
      const hasBiayaToggle = text.includes('chk_biaya_belum_disepakati');
      const hasGeserObjek = text.includes('geserBarisObjek');
      const hasNonAdminSubmit = text.includes('submitPermintaanAwalNonAdmin');

      if (hasPenggunaToggle && hasBiayaToggle && hasGeserObjek && hasNonAdminSubmit) {
        console.log(`\n🎉 ATTEMPT ${attempt}: DEPLOYMENT TERDETEKSI LIVE & SYNC!`);
        console.log('  ✔ chk_pengguna_sama_pemberi: TERSEDIA');
        console.log('  ✔ chk_biaya_belum_disepakati: TERSEDIA');
        console.log('  ✔ geserBarisObjek: TERSEDIA');
        console.log('  ✔ submitPermintaanAwalNonAdmin: TERSEDIA');
        return true;
      } else {
        console.log(`[Attempt ${attempt}/30] Menunggu sinkronisasi FTPS cPanel...`);
      }
    } catch (err) {
      console.log(`[Attempt ${attempt}/30] Fetch error: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  console.error('\n❌ Timeout polling deployment cPanel.');
  return false;
}

pollProduction().then(ok => {
  process.exit(ok ? 0 : 1);
});
