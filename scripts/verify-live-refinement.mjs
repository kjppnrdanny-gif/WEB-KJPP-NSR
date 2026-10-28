import fetch from 'node-fetch';

async function verifyLive() {
  const urlNolap = 'https://kjppnanangrahayu.com/portal-nolap.html?v=' + Date.now();
  const urlPresensi = 'https://kjppnanangrahayu.com/presensi.html?v=' + Date.now();
  
  console.log('Polling live cPanel:', urlNolap);
  
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      const res = await fetch(urlNolap, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        const hasNewPlaceholder = text.includes('placeholder="Masukkan token akses resmi Anda..."');
        const hasLegalName = text.includes('KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN');
        const hasPresensiLink = text.includes('href="portal-presensi.html"');
        const hasColSpan4 = text.includes('Catatan Tambahan Pemohon') && text.includes('lg:col-span-4');
        const hasNoLeak = !text.includes('placeholder="Contoh: NSR8899');
        
        console.log(`[Attempt ${attempt}] Checks:`);
        console.log(' - Sanitized Placeholder:', hasNewPlaceholder);
        console.log(' - Legal Entity Name:', hasLegalName);
        console.log(' - Internal Presensi Nav:', hasPresensiLink);
        console.log(' - Grid Col-Span-4 Catatan:', hasColSpan4);
        console.log(' - Zero Token Leak:', hasNoLeak);
        
        if (hasNewPlaceholder && hasLegalName && hasPresensiLink && hasColSpan4 && hasNoLeak) {
          console.log('\n🎉 ALL LIVE CHECKS ON PORTAL-NOLAP.HTML PASS 100%!');
          break;
        }
      }
    } catch (err) {
      console.log(`Attempt ${attempt} error:`, err.message);
    }
    await new Promise(r => setTimeout(r, 4000));
  }

  try {
    const resP = await fetch(urlPresensi, { cache: 'no-store' });
    console.log(`Live Presensi.html Status: HTTP ${resP.status} (${resP.ok ? 'SUCCESS' : 'FAILED'})`);
  } catch (err) {
    console.log('Presensi fetch error:', err.message);
  }
}

verifyLive();
