import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  console.log('Launching Puppeteer to test portal-tracking.html...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  const fileUrl = 'file://' + path.join(ROOT_DIR, 'portal-tracking.html').replace(/\\\\/g, '/');
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // 1. Capture Task Board Default View (Danny Taufik - Nationwide Access)
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'bukti_tracking_taskboard_pusat.png'), fullPage: false });
  console.log('✓ Captured bukti_tracking_taskboard_pusat.png');

  // 2. Switch to Bandung branch preset
  console.log('Switching user to Cabang Bandung (Ardi Nurmayadi)...');
  await page.evaluate(() => {
    bukaModalGantiProfil();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'bukti_tracking_profile_switcher.png') });
  console.log('✓ Captured bukti_tracking_profile_switcher.png');

  // Click preset Bandung
  await page.evaluate(() => {
    loginPreset('NSR-BDG-2020-39', '123456');
  });
  await new Promise(r => setTimeout(r, 600));

  // Capture Task Board with Bandung Branch Isolation
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'bukti_tracking_branch_isolation_bandung.png') });
  console.log('✓ Captured bukti_tracking_branch_isolation_bandung.png');

  // 3. Open Update Milestone Modal with NIK + PIN Verification
  console.log('Opening Update Milestone Modal...');
  await page.evaluate(() => {
    bukaModalUpdateMilestone('JO-BDG-2026-0015');
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'bukti_tracking_modal_update_milestone.png') });
  console.log('✓ Captured bukti_tracking_modal_update_milestone.png');

  // Close Update Modal
  await page.evaluate(() => {
    tutupModalUpdateMilestone();
  });

  // 4. Switch to Registration Tab & Open Tarik Data JO Modal
  console.log('Opening Form Registrasi & Modal Tarik Data JO...');
  await page.evaluate(() => {
    switchTab('register');
    bukaModalPilihJO();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'bukti_tracking_modal_tarik_data_jo.png') });
  console.log('✓ Captured bukti_tracking_modal_tarik_data_jo.png');

  // Click "Pilih JO Ini" (index 0)
  await page.evaluate(() => {
    isiFormulirDariJO(0);
  });
  await new Promise(r => setTimeout(r, 500));

  // Capture Auto-Populated Form with editable fields, branch reviewer, and official appraiser
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'bukti_tracking_form_autopopulated.png'), fullPage: true });
  console.log('✓ Captured bukti_tracking_form_autopopulated.png');

  await browser.close();
  console.log('\nAll interactive screenshots captured successfully!');
}

main().catch(err => {
  console.error('Puppeteer test failed:', err);
  process.exit(1);
});
