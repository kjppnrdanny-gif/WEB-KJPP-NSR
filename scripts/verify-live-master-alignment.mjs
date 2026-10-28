// scripts/verify-live-master-alignment.mjs
import fs from 'fs';

async function verifyLive() {
  const base = 'https://kjppnanangrahayu.com';
  console.log('====================================================');
  console.log('VERIFIKASI LIVE MASTER TEMPLATE ALIGNMENT');
  console.log('Target:', base);
  console.log('====================================================\n');

  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const res = await fetch(`${base}/portal-penugasan-jo.html?_nocache=${Date.now()}`);
      const text = await res.text();

      const hasK8 = text.includes('8. TANGGAL PENILAIAN DAN PENDEKATAN PENILAIAN');
      const hasK13 = text.includes('13. KONFIRMASI BAHWA PENILAIAN DILAKUKAN BERDASARKAN SPI');
      const hasK18 = text.includes('18. DATA-DATA YANG DIPERLUKAN');
      const hasK6Dynamic = text.includes('Nilai Penggantian Wajar (Nilai Ganti Kerugian)');

      console.log(`[Percobaan ${attempt}] Status HTTP: ${res.status} | K8: ${hasK8} | K13: ${hasK13} | K18: ${hasK18} | K6: ${hasK6Dynamic}`);

      if (hasK8 && hasK13 && hasK18 && hasK6Dynamic) {
        console.log('\n🎉 SUKSES: Master Template Alignment & Dynamic Narrative Engine telah LIVE di cPanel!');
        return true;
      }
    } catch (e) {
      console.log(`[Percobaan ${attempt}] Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  console.log('Deployment still in progress on GitHub Actions.');
  return false;
}

verifyLive().then(ok => {
  if (!ok) process.exit(1);
}).catch(console.error);
