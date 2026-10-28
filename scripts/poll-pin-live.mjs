import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

const GITHUB_REPO = 'kjppnrdanny-gif/WEB-KJPP-NSR';
const LIVE_URL = 'https://kjppnanangrahayu.com/portal-presensi.html';
const INDEX_URL = 'https://kjppnanangrahayu.com/index.html';

async function checkLatestRun() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?branch=main&per_page=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Node-Fetch' } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.workflow_runs?.[0] || null;
  } catch (e) {
    return null;
  }
}

async function checkLivePortal() {
  try {
    const res = await fetch(`${LIVE_URL}?v=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (!res.ok) return { ok: false, status: res.status };
    const html = await res.text();

    const hasPinInput = html.includes('id="auth-pin-input"') && html.includes('placeholder="Masukkan 6 Digit PIN"');
    const hasMasukBtn = html.includes('id="btn-masuk-presensi"');
    const hasRemember = html.includes('id="remember-device-checkbox"');
    const hasModalEmail = html.includes('id="modal-lengkapi-email"');
    const hasModalReset = html.includes('id="modal-reset-pin"');
    const hasMakassarCoords = html.includes('-5.1565') && html.includes('119.412');

    // Anti-leak checks
    const hasOtpLeakedPlaceholder = html.includes('NSR8899');
    const hasOldOtpBox = html.includes('id="auth-box-otp-input"');
    const hasOldCooldown = html.includes('cooldown-counter');

    return {
      ok: true,
      hasPinInput,
      hasMasukBtn,
      hasRemember,
      hasModalEmail,
      hasModalReset,
      hasMakassarCoords,
      hasOtpLeakedPlaceholder,
      hasOldOtpBox,
      hasOldCooldown
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function checkIndexMakassar() {
  try {
    const res = await fetch(`${INDEX_URL}?v=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (!res.ok) return false;
    const html = await res.text();
    return html.includes('-5.1565,119.4120') || html.includes('-5.1565, 119.4120');
  } catch (e) {
    return false;
  }
}

async function main() {
  console.log('========================================================');
  console.log('📡 POLLING LIVE CPANEL DEPLOYMENT FOR PIN AUTH & MAKASSAR');
  console.log('========================================================\n');

  let attempts = 0;
  const maxAttempts = 30; // 5 menit max (10 detik jeda)

  while (attempts < maxAttempts) {
    attempts++;
    const run = await checkLatestRun();
    console.log(`[Attempt ${attempts}/${maxAttempts}] GitHub Action: ${run?.name || 'Deploy'} | Status: ${run?.status} | Conclusion: ${run?.conclusion || 'pending'}`);

    const portal = await checkLivePortal();
    const indexMakassar = await checkIndexMakassar();

    console.log('   Live Portal Status:', {
      hasPinInput: portal.hasPinInput,
      hasMasukBtn: portal.hasMasukBtn,
      hasModalEmail: portal.hasModalEmail,
      hasModalReset: portal.hasModalReset,
      hasMakassarCoords: portal.hasMakassarCoords,
      indexMakassarMap: indexMakassar,
      hasOtpLeakedPlaceholder: portal.hasOtpLeakedPlaceholder,
      hasOldOtpBox: portal.hasOldOtpBox
    });

    if (portal.hasPinInput && portal.hasMasukBtn && portal.hasModalEmail && portal.hasModalReset && !portal.hasOtpLeakedPlaceholder && !portal.hasOldOtpBox) {
      console.log('\n========================================================');
      console.log('🎉 LIVE CPANEL PRODUCTION BERHASIL DIPERBARUI & TERVERIFIKASI!');
      console.log('========================================================\n');
      return;
    }

    await new Promise(r => setTimeout(r, 10000));
  }

  console.warn('Polling timeout reached. Silakan periksa status live secara manual.');
}

main().catch(err => {
  console.error('Polling error:', err);
  process.exit(1);
});
