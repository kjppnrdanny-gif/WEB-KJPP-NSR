import https from 'node:https';

const LIVE_URL = 'https://kjppnanangrahayu.com';

async function fetchLive(path) {
  const url = `${LIVE_URL}${path}?_t=${Date.now()}`;
  const res = await fetch(url, {
    headers: { 'Cache-Control': 'no-cache, no-store, max-age=0' }
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function pollDeployment() {
  console.log('🔄 Memantau proses deployment live cPanel (https://kjppnanangrahayu.com)...');
  let deployed = false;
  for (let i = 1; i <= 30; i++) {
    try {
      const { text } = await fetchLive('/index.html');
      // Periksa apakah pattern sanitasi sesi baru sudah aktif di index.html live
      if (text.includes('DILARANG menyimpan token mentah di browser') || text.includes('tokenKeysToScrub')) {
        console.log(`\n🎉 COMMIT 07108ce TERDETEKSI AKTIF DI CPANEL LIVE! (Polling ke-${i})`);
        deployed = true;
        break;
      } else {
        process.stdout.write(`... [${i}/30] Menunggu sinkronisasi FTPS cPanel (${i * 5}s)\r`);
      }
    } catch (e) {
      process.stdout.write(`... [${i}/30] Error koneksi: ${e.message}\r`);
    }
    await new Promise(r => setTimeout(r, 5000));
  }

  if (!deployed) {
    console.log('\n⚠️ Belum terdeteksi setelah 150s, mari lakukan pengujian mendalam.');
  }
}

pollDeployment();
