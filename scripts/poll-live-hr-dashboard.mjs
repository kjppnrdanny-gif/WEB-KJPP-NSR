async function poll() {
  const url = 'https://kjppnanangrahayu.com/portal-presensi.html?v=' + Date.now();
  console.log('Checking live deployment on cPanel at https://kjppnanangrahayu.com/portal-presensi.html ...');

  for (let i = 1; i <= 30; i++) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const text = await res.text();
      if (text.includes('hr-monitoring-table-body')) {
        console.log(`[SUCCESS] Attempt ${i}: New HR dashboard table detected on cPanel!`);
        return true;
      }
      console.log(`[Attempt ${i}/30] Waiting for cPanel deployment...`);
    } catch (e) {
      console.log(`[Attempt ${i}/30] Error:`, e.message);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  console.log('[TIMEOUT] Deployment polling reached 3 minutes.');
  return false;
}

poll().catch(console.error);
