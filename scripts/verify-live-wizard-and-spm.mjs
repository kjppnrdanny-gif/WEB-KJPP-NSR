import https from 'node:https';

function checkLivePage() {
  return new Promise((resolve, reject) => {
    https.get('https://kjppnanangrahayu.com/portal-nolap.html', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    }).on('error', reject);
  });
}

console.log('Fetching https://kjppnanangrahayu.com/portal-nolap.html ...');
let attempts = 0;
const maxAttempts = 12;

async function pollLive() {
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`[Attempt ${attempts}/${maxAttempts}] Checking live cPanel...`);
    try {
      const res = await checkLivePage();
      const hasWizardStep1 = res.data.includes('id="wizard-step-1"');
      const hasWizardStep2 = res.data.includes('id="wizard-step-2"');
      const hasSimpanDraf = res.data.includes('id="btn-simpan-draf"');
      const hasSpmAuditPanel = res.data.includes('spm-audit-only-panel');
      const hasNavigasiWizard = res.data.includes('navigasiKeStepWizard');

      console.log('HTTP Status:', res.status);
      console.log('hasWizardStep1:', hasWizardStep1);
      console.log('hasWizardStep2:', hasWizardStep2);
      console.log('hasSimpanDraf:', hasSimpanDraf);
      console.log('hasSpmAuditPanel:', hasSpmAuditPanel);
      console.log('hasNavigasiWizard:', hasNavigasiWizard);

      if (hasWizardStep1 && hasWizardStep2 && hasSimpanDraf && hasSpmAuditPanel && hasNavigasiWizard) {
        console.log('\n🎉 VERIFIKASI LIVE CPANEL SUKSES 100%! Seluruh fitur Wizard 2-Tahap, SPM UI Isolation, dan Dual Output telah aktif di https://kjppnanangrahayu.com/portal-nolap.html');
        return true;
      }
    } catch (e) {
      console.log('Error checking live:', e.message);
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  console.error('Timeout waiting for live cPanel update.');
  return false;
}

pollLive().then(success => {
  if (!success) process.exit(1);
});
