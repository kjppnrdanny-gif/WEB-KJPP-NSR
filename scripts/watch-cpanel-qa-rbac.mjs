/**
 * scripts/watch-cpanel-qa-rbac.mjs
 * Monitors cPanel deployment workflow and performs live smoke verification.
 */

const RUN_ID = '43061753380';
const BASE_URL = 'https://kjppnanangrahayu.com';

async function checkWorkflow() {
  const url = `https://api.github.com/repos/kjppnrdanny-gif/WEB-KJPP-NSR/actions/runs/${RUN_ID}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Node-Fetch' } });
  const data = await res.json();
  return { status: data.status, conclusion: data.conclusion };
}

async function main() {
  console.log('='.repeat(80));
  console.log(`MENGAWASI DEPLOYMENT CPANEL PRODUKSI (RUN ${RUN_ID} - commit 02de779)`);
  console.log('='.repeat(80));

  let attempts = 0;
  while (attempts < 60) {
    attempts++;
    const wf = await checkWorkflow();
    console.log(`[${new Date().toLocaleTimeString()}] Attempt ${attempts} -> Status: ${wf.status} | Conclusion: ${wf.conclusion}`);
    if (wf.status === 'completed') {
      console.log(`\n🎉 Workflow cPanel selesai dengan kesimpulan: ${wf.conclusion}`);
      break;
    }
    await new Promise(r => setTimeout(r, 6000));
  }

  console.log('\n--- VERIFIKASI LANGSUNG LIVE SERVER CPANEL ---');
  // 1. Verify QA Handler
  try {
    const res = await fetch(`${BASE_URL}/backend/qa-engine-handler.php?action=list_reviews&_t=${Date.now()}`);
    const json = await res.json();
    console.log(`[API QA Handler] HTTP ${res.status} | Status: ${json.status} | Reviews count: ${json.data?.length}`);
  } catch (e) {
    console.error(`[API QA Handler FAIL] ${e.message}`);
  }

  // 2. Verify Portal QA Review content
  try {
    const res = await fetch(`${BASE_URL}/portal-qa-review.html?_t=${Date.now()}`);
    const html = await res.text();
    const hasAuthGate = html.includes('id="modal-auth-gate"');
    const hasHeaderLogout = html.includes('id="btn-header-logout"');
    const hasSurveyorLocked = html.includes('id="modal-surveyor-locked"');
    const hasPenilaiBadgeLogic = html.includes('[Penilai Penyusun - M-04]');

    console.log(`[Portal QA Review HTML] HTTP ${res.status} | Size: ${html.length} bytes`);
    console.log(`  -> Modal Auth Gate: ${hasAuthGate ? '✅ TERPASANG' : '❌ HILANG'}`);
    console.log(`  -> Header Logout Switcher: ${hasHeaderLogout ? '✅ TERPASANG' : '❌ HILANG'}`);
    console.log(`  -> Modal Surveyor Lockout: ${hasSurveyorLocked ? '✅ TERPASANG' : '❌ HILANG'}`);
    console.log(`  -> Penilai Penyusun M-04 Logic: ${hasPenilaiBadgeLogic ? '✅ TERPASANG' : '❌ HILANG'}`);
  } catch (e) {
    console.error(`[Portal QA HTML FAIL] ${e.message}`);
  }
}

main().catch(console.error);
