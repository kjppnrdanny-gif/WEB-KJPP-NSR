import https from 'https';

console.log('Menghubungi https://kjppnanangrahayu.com/portal-penugasan-jo.html ...');

function fetchUrl(url, maxRetries = 10, delayMs = 3000) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    function tryFetch() {
      attempt++;
      https.get(url, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          console.log(`[Percobaan ${attempt}] Status HTTP: ${res.statusCode}`);
          if (res.statusCode === 200) {
            const hasCards = body.includes('container-monitoring-cards');
            const hasAktif = body.includes('card-metric-aktif');
            const hasNear = body.includes('card-metric-near');
            const hasOverdue = body.includes('card-metric-overdue');
            const hasSelesai = body.includes('card-metric-selesai');
            const hasPic = body.includes('filter_pic');
            const hasTenggat = body.includes('Target Penyelesaian (SLA)');

            if (hasCards && hasAktif && hasNear && hasOverdue && hasSelesai && hasPic) {
              console.log('✔ LIVE PRODUCTION TERVERIFIKASI MEMUAT TAHAP 2!');
              console.log('  • Container Kartu:', hasCards);
              console.log('  • Kartu Aktif:', hasAktif);
              console.log('  • Kartu Mendekati Tenggat:', hasNear);
              console.log('  • Kartu Overdue:', hasOverdue);
              console.log('  • Kartu Selesai:', hasSelesai);
              console.log('  • Filter PIC Dinamis:', hasPic);
              console.log('  • Kolom SLA:', hasTenggat);
              return resolve({ success: true, attempt });
            } else {
              console.log(`  ⏳ CDN / Netlify sedang mendeploy pembaruan... Mencoba lagi dalam ${delayMs / 1000}s`);
            }
          }
          if (attempt < maxRetries) {
            setTimeout(tryFetch, delayMs);
          } else {
            resolve({ success: false, attempt });
          }
        });
      }).on('error', err => {
        console.warn(`Error koneksi: ${err.message}. Mencoba lagi...`);
        if (attempt < maxRetries) setTimeout(tryFetch, delayMs);
        else reject(err);
      });
    }

    tryFetch();
  });
}

const result = await fetchUrl('https://kjppnanangrahayu.com/portal-penugasan-jo.html');
if (!result.success) {
  process.exit(1);
}
