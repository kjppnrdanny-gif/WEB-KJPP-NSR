// scripts/wait-production-cpanel-deploy.mjs
const RUN_ID = '40544353829';
const LIVE_URL = 'https://kjppnanangrahayu.com/index.html';

async function checkWorkflow() {
  const url = `https://api.github.com/repos/kjppnrdanny-gif/WEB-KJPP-NSR/actions/runs/${RUN_ID}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Node-Fetch' } });
  const data = await res.json();
  return { status: data.status, conclusion: data.conclusion };
}

async function checkLiveServer() {
  try {
    const res = await fetch(`${LIVE_URL}?v=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const html = await res.text();
    const hasLacakNav = html.includes('Lacak Penugasan');
    const hasLacakForm = html.includes('id="lacak-penugasan"');
    const hasJoInput = html.includes('id="track-jo-input"');
    return {
      status: res.status,
      length: html.length,
      hasLacakNav,
      hasLacakForm,
      hasJoInput
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  console.log('========================================================');
  console.log('⏳ MENGAWASI DEPLOYMENT CPANEL PRODUKSI (RUN ' + RUN_ID + ')');
  console.log('========================================================\n');

  let completed = false;
  let attempts = 0;

  while (!completed && attempts < 40) {
    attempts++;
    const wf = await checkWorkflow();
    console.log(`[Attempt ${attempts}] Workflow Status: ${wf.status} | Conclusion: ${wf.conclusion}`);

    if (wf.status === 'completed') {
      completed = true;
      console.log(`\n🎉 Workflow selesai dengan kesimpulan: ${wf.conclusion}`);
      break;
    }

    await new Promise(r => setTimeout(r, 6000));
  }

  console.log('\n🔍 Memverifikasi langsung ke server cPanel live...');
  for (let i = 1; i <= 10; i++) {
    const live = await checkLiveServer();
    console.log(`[Pemeriksaan Live #${i}]`, live);

    if (live.hasLacakForm && live.hasLacakNav) {
      console.log('\n✅ BUKTI LIVE TERKONFIRMASI: Widget Lacak Penugasan AKTIF di https://kjppnanangrahayu.com/index.html!');
      return;
    }

    await new Promise(r => setTimeout(r, 4000));
  }

  console.error('\n⚠️ Server cPanel belum menampilkan widget setelah 10 kali pemeriksaan.');
}

main().catch(console.error);
