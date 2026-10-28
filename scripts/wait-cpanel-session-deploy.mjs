async function checkLive() {
  console.log('Menunggu sinkronisasi deployment cPanel ke server live...');
  for (let i = 1; i <= 25; i++) {
    try {
      const res = await fetch('https://kjppnanangrahayu.com/absensi-data-handler.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_gate', nik: 'NSR-2019-005', token: '889900' })
      });
      const data = await res.json().catch(() => null);
      if (data && data.success && data.sessionToken) {
        console.log(`\n🎉 SUKSES BESAR! [Percobaan ${i}] Server cPanel live telah menjalankan versi terbaru (Session-Bound Lockdown Aktif)!`);
        console.log('   Data Terverifikasi:', data.nik, data.nama, 'Session:', data.sessionToken.slice(0, 16) + '...');
        return;
      }
    } catch (_) {}
    process.stdout.write(`[Percobaan ${i}/25] Menunggu runner GitHub Actions... `);
    await new Promise(r => setTimeout(r, 6000));
    console.log('');
  }
  console.log('\n⚠️ GitHub Actions masih dalam proses transmisi FTP ke cPanel. Silakan periksa kembali dalam 1-2 menit.');
}

checkLive().catch(console.error);
