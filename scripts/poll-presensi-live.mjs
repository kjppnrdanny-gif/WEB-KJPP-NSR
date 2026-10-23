async function pollLivePresensi() {
  const url = 'https://kjppnanangrahayu.com/portal-presensi.html';
  const backendUrl = 'https://kjppnanangrahayu.com/api/absensi-data-proxy?action=STATUS';
  console.log('Polling live production presensi portal & backend at https://kjppnanangrahayu.com ...');

  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const res = await fetch(url + '?_t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const resBackend = await fetch(backendUrl + '&_t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (res.ok && resBackend.ok) {
        const text = await res.text();
        const bJson = await resBackend.json();

        const hasDashboardTab = text.includes('id="tab-btn-dashboard"');
        const hasDashboardPanel = text.includes('id="panelDashboard"');
        const hasTotal22 = bJson.total_karyawan_pusat === 22;

        console.log(`[Attempt ${attempt}] Frontend: ${res.status} (DashboardTab: ${hasDashboardTab}) | Backend: ${resBackend.status} (TotalPusat: ${bJson.total_karyawan_pusat})`);

        if (hasDashboardTab && hasDashboardPanel && hasTotal22) {
          console.log('\n🚀 SUCCESS: Commit 6f64c98 with Master Karyawan & HR Dashboard is LIVE ON CPANEL PRODUKSI!');
          return true;
        }
      } else {
        console.log(`[Attempt ${attempt}] Frontend Status: ${res.status} | Backend Status: ${resBackend.status}`);
      }
    } catch (e) {
      console.log(`[Attempt ${attempt}] Polling error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  return false;
}

pollLivePresensi().then(ok => {
  if (!ok) {
    console.error('Timeout waiting for live deployment');
    process.exit(1);
  }
}).catch(console.error);
