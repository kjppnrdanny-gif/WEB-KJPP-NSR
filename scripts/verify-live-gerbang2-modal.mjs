import fetch from 'node-fetch';

async function verifyLive() {
  const urlNolap = 'https://kjppnanangrahayu.com/portal-nolap.html?v=' + Date.now();
  console.log('Polling live cPanel for Gerbang 2 Modal update:', urlNolap);

  for (let attempt = 1; attempt <= 15; attempt++) {
    try {
      const res = await fetch(urlNolap, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        const hasWideModal = text.includes('max-w-4xl lg:max-w-5xl');
        const has3Links = text.includes('id="g2-url-pembanding"');
        const hasOnPenilaiChange = text.includes('function onPenilaiG2Change()');
        const hasDeltaBadgeInline = text.includes('Delta Analysis — Uji Deviasi Luas Fisik vs Yuridis');

        console.log(`[Attempt ${attempt}] Checks:`);
        console.log(' - Wide Modal (max-w-4xl lg:max-w-5xl):', hasWideModal);
        console.log(' - 3 Document Links (g2-url-pembanding):', has3Links);
        console.log(' - onPenilaiG2Change JS function:', hasOnPenilaiChange);
        console.log(' - Delta Analysis Layout:', hasDeltaBadgeInline);

        if (hasWideModal && has3Links && hasOnPenilaiChange && hasDeltaBadgeInline) {
          console.log('\n🎉 ALL LIVE GERBANG 2 MODAL CHECKS PASS 100%!');
          return true;
        }
      }
    } catch (err) {
      console.log(`Attempt ${attempt} error:`, err.message);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  return false;
}

verifyLive().then(ok => {
  if (!ok) process.exit(1);
});
