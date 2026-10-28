const URL_IMG1 = 'https://kjppnanangrahayu.com/images/kegiatan/kantor-cabang-makassar.jpeg';
const URL_IMG2 = 'https://kjppnanangrahayu.com/images/kegiatan/kantor-cabang-makassar2.jpeg';
const URL_PAGE = 'https://kjppnanangrahayu.com/portofolio-rekanan.html';

async function check() {
  console.log('Polling Netlify production deployment...');
  const maxAttempts = 30; // 30 * 5s = 150s
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const [res1, res2, resPage] = await Promise.all([
        fetch(URL_IMG1 + '?v=' + Date.now(), { method: 'HEAD' }),
        fetch(URL_IMG2 + '?v=' + Date.now(), { method: 'HEAD' }),
        fetch(URL_PAGE + '?v=' + Date.now()).then(r => r.text())
      ]);

      const s1 = res1.status;
      const s2 = res2.status;
      const hasMakassar = resPage.includes('kantor-cabang-makassar.jpeg') && resPage.includes('16 Dokumentasi Terverifikasi');

      console.log(`[Attempt ${attempt}/${maxAttempts}] IMG1: ${s1}, IMG2: ${s2}, Page updated: ${hasMakassar}`);

      if (s1 === 200 && s2 === 200 && hasMakassar) {
        console.log('\n🎉 SUKSES: Netlify production telah selesai mendeploy perubahan dan live!');
        process.exit(0);
      }
    } catch (err) {
      console.log(`[Attempt ${attempt}] Error:`, err.message);
    }
    await new Promise(r => setTimeout(r, 5000));
  }

  console.error('Timed out waiting for Netlify deploy.');
  process.exit(1);
}

check();
