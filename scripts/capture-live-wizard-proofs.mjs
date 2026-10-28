import puppeteer from 'puppeteer';

async function captureProof() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });

  console.log('Navigating to live portal-nolap with KING token auto-bypass...');
  await page.goto('https://kjppnanangrahayu.com/portal-nolap.html?token=NSR8899', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(r => setTimeout(r, 2000));

  // Screenshot 1: Wizard Step 1 Live
  await page.screenshot({
    path: 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/bukti_live_wizard_step1.png',
    fullPage: false
  });
  console.log('✔ Screenshot 1 saved: bukti_live_wizard_step1.png');

  // Fill in sample client & applicant
  await page.type('#f-klien', 'PT Bank Mandiri (Persero) Tbk');
  await page.type('#f-pemohon', 'Budi Santoso (Admin Cabang Bandung)');

  // Click "Lanjut ke Pengisian Kertas Kerja Mitigasi ->"
  console.log('Clicking button Lanjut ke Pengisian Kertas Kerja Mitigasi...');
  await page.click('#btn-wizard-next-1');
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 2: Wizard Step 2 Live (Mitigasi & Tombol Draf + Ajukan ke Kepala SPM)
  await page.screenshot({
    path: 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/bukti_live_wizard_step2.png',
    fullPage: false
  });
  console.log('✔ Screenshot 2 saved: bukti_live_wizard_step2.png');

  // Now test applicant role (Surveyor/Branch Non-SPM) to prove F01-F07 is hidden
  console.log('Testing applicant role (non-SPM)...');
  await page.goto('https://kjppnanangrahayu.com/portal-nolap.html?token=NSR-ADMIN-BDG-2026', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  await new Promise(r => setTimeout(r, 2000));

  // Check Tab 2 (Mitigasi Risiko & SPM)
  await page.click('#tab-btn-spm');
  await new Promise(r => setTimeout(r, 1000));

  const isFHidden = await page.evaluate(() => {
    const el = document.getElementById('spm-audit-panel-umum');
    if (!el) return true;
    const style = window.getComputedStyle(el);
    return style.display === 'none';
  });
  console.log('Is F01-F07 hidden for Admin Cabang / Applicant?:', isFHidden);

  // Screenshot 3: Tab 2 without F01-F07 for Applicant
  await page.screenshot({
    path: 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/bukti_live_spm_ui_isolated.png',
    fullPage: false
  });
  console.log('✔ Screenshot 3 saved: bukti_live_spm_ui_isolated.png');

  await browser.close();
  console.log('🎉 All live screenshots captured successfully!');
}

captureProof().catch(err => {
  console.error('Error capturing proof:', err);
  process.exit(1);
});
