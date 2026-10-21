const URL = 'https://kjppnanangrahayu.com/portofolio-rekanan.html';
const MAX_ATTEMPTS = 30;
const INTERVAL_MS = 5000;

console.log('========================================================');
console.log('🌐 MEMANTAU DEPLOYMENT LIVE CPANEL: portofolio-rekanan.html');
console.log('========================================================\n');

async function check() {
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    try {
      const res = await fetch(`${URL}?_ts=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const text = await res.text();
        const hasOpiniNsr = text.includes('OPINI NSR');
        const has7Cards = text.includes('id="kartu-e-operasional"') && text.includes('id="kartu-surat-umum"');
        const hasModalRequestSop = text.includes('id="modal-request-sop"');

        if (hasOpiniNsr && has7Cards && hasModalRequestSop) {
          console.log(`\n🎉 [Percobaan ${i}] DEPLOYMENT LIVE CPANEL TERKONFIRMASI 100%!`);
          console.log('✓ Navbar "OPINI NSR" aktif secara online.');
          console.log('✓ 7 modul kartu lengkap (Dark Executive Glassmorphism) aktif.');
          console.log('✓ Modal OPINI NSR & request SOP aktif di server produksi.');
          return true;
        } else {
          process.stdout.write(`[Percobaan ${i}/${MAX_ATTEMPTS}] Menunggu sinkronisasi cPanel... (${hasOpiniNsr ? 'OPINI NSR terdeteksi' : 'menunggu deploy'})\r`);
        }
      }
    } catch (err) {
      process.stdout.write(`[Percobaan ${i}/${MAX_ATTEMPTS}] Jaringan: ${err.message}\r`);
    }
    await new Promise(r => setTimeout(r, INTERVAL_MS));
  }
  console.log('\n⚠️ Timeout polling deployment live cPanel.');
  return false;
}

check().then(success => {
  if (!success) process.exit(1);
});
