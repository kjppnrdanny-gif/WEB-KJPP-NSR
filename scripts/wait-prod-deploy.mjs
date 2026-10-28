// scripts/wait-prod-deploy.mjs
const RUN_ID = '40552668129';
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
    const hasContoh = html.includes('Contoh Penugasan');
    const hasCleanJoPlaceholder = html.includes('placeholder="Masukkan Nomor JO / Kode Lacak"');
    const hasKartuTracking = html.includes('id="kartu-tracking-wrapper"');
    return {
      status: res.status,
      hasContoh,
      hasCleanJoPlaceholder,
      hasKartuTracking
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  console.log('========================================================');
  console.log(`⏳ MENGAWASI DEPLOYMENT CPANEL PRODUKSI (RUN ${RUN_ID})`);
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
    console.log(`[Live Check ${i}] HTTP ${live.status} | hasContoh: ${live.hasContoh} | hasCleanJoPlaceholder: ${live.hasCleanJoPlaceholder} | hasKartuTracking: ${live.hasKartuTracking}`);
    if (!live.hasContoh && live.hasCleanJoPlaceholder && live.hasKartuTracking) {
      console.log('✓ VERIFIKASI LIVE CPANEL SUKSES 100%! Halaman bersih dari contoh penugasan dan widget terintegrasi penuh.');
      break;
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}

main().catch(console.error);
