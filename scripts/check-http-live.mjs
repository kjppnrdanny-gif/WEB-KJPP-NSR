async function check() {
  const cb = Date.now();
  const res1 = await fetch('https://kjppnanangrahayu.com/index.html?cb=' + cb, { headers: { 'Cache-Control': 'no-cache' } });
  const text1 = await res1.text();
  console.log('--- LIVE CPANEL INDEX.HTML ---');
  console.log('HTTP Status:', res1.status);
  console.log('Placeholder bersih tanpa bocoran NIK:', text1.includes('placeholder="Masukkan Token Akses atau NIK Karyawan"'));
  console.log('Tombol solid blue resmi tanpa gradien pelangi:', text1.includes('bg-blue-600 hover:bg-blue-500'));
  console.log('Widget Lacak Penugasan 7-Milestone terpasang:', text1.includes('id="lacak-penugasan"'));

  const res2 = await fetch('https://kjppnanangrahayu.com/portal-tracking.html?cb=' + cb, { headers: { 'Cache-Control': 'no-cache' } });
  const text2 = await res2.text();
  console.log('\n--- LIVE CPANEL PORTAL-TRACKING.HTML ---');
  console.log('HTTP Status:', res2.status);
  console.log('Placeholder NIK bersih:', text2.includes('placeholder="Masukkan NIK Karyawan"'));
  console.log('Card 3 SPM biru langit (bebas ungu):', text2.includes('text-sky-300 font-mono'));
  console.log('Card 2 bebas animasi berputar terus-menerus:', !text2.includes('w-4 h-4 animate-spin text-amber-400'));
  console.log('Preset login dengan NIK & PIN karyawan telah dihapus:', !text2.includes('quickSwitchUser'));
}
check();
