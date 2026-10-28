async function pollLivePortal() {
  const url = 'https://kjppnanangrahayu.com/portal-penugasan-jo.html';
  console.log('Polling live production portal at https://kjppnanangrahayu.com/portal-penugasan-jo.html ...');

  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const res = await fetch(url + '?_t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const text = await res.text();
        const hasDeduplicationBadge = text.includes('indikator-status-otorisasi-tab3');
        const hasLihatDetail = text.includes('Lihat Detail Pengesahan');
        const hasPusatCondition = text.includes('Diotorisasi melalui Pusat');
        const hasCabangCondition = text.includes('Diotorisasi Pimpinan Cabang');

        console.log(`[Attempt ${attempt}] Status: ${res.status} | Has Badge: ${hasDeduplicationBadge} | Has Detail: ${hasLihatDetail} | Has Pusat: ${hasPusatCondition} | Has Cabang: ${hasCabangCondition}`);

        if (hasDeduplicationBadge && hasLihatDetail && hasPusatCondition && hasCabangCondition) {
          console.log('\n🚀 SUCCESS: Latest Commit 7a9f07d is LIVE ON PRODUCTION CPANEL!');
          return true;
        }
      } else {
        console.log(`[Attempt ${attempt}] Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`[Attempt ${attempt}] Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  return false;
}

pollLivePortal().then(ok => {
  if (!ok) {
    console.error('Timeout waiting for live deployment');
    process.exit(1);
  }
}).catch(console.error);
