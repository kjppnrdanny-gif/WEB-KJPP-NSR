import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFooterLinks() {
  console.log('🧪 Menguji Interaktivitas 3 Tautan Footer pada GPS.html...\n');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const filePath = 'file://' + path.resolve(__dirname, '..', 'GPS.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'load' });

  // 1. Verifikasi Link 2: Kebijakan Privasi (UU PDP)
  const link2 = await page.$eval('a[title*="Kebijakan Privasi Resmi"]', el => ({
    text: el.innerText.trim(),
    href: el.getAttribute('href'),
    target: el.getAttribute('target')
  }));
  console.log('1. Tautan Kebijakan Privasi (UU PDP):', link2);
  if (link2.href !== 'https://kjppnanangrahayu.com/kebijakan-privasi.html' || link2.target !== '_blank') {
    throw new Error('Link Kebijakan Privasi tidak sesuai!');
  }
  console.log('   ✓ Tautan Kebijakan Privasi terverifikasi valid.');

  // 2. Verifikasi Link 3: Disclaimer Profesi
  const link3 = await page.$eval('a[title*="Disclaimer Profesi"]', el => ({
    text: el.innerText.trim(),
    href: el.getAttribute('href'),
    target: el.getAttribute('target')
  }));
  console.log('2. Tautan Disclaimer Profesi:', link3);
  if (link3.href !== 'https://kjppnanangrahayu.com/disclaimer.html' || link3.target !== '_blank') {
    throw new Error('Link Disclaimer Profesi tidak sesuai!');
  }
  console.log('   ✓ Tautan Disclaimer Profesi terverifikasi valid.');

  // 3. Verifikasi Link 1: Modal Pemberitahuan Privasi Karyawan
  const isModalHiddenInitial = await page.$eval('#modal-privasi-karyawan', el => el.classList.contains('hidden'));
  console.log('3. Status awal modal:', isModalHiddenInitial ? 'Tersembunyi (Hidden)' : 'Terlihat');
  if (!isModalHiddenInitial) throw new Error('Modal seharusnya hidden di awal');

  // Klik tombol buka modal
  console.log('   Mengklik tombol Pemberitahuan Privasi Karyawan...');
  await page.click('#btn-privasi-karyawan');
  await new Promise(r => setTimeout(r, 200));

  const isModalVisibleAfterClick = await page.$eval('#modal-privasi-karyawan', el => !el.classList.contains('hidden'));
  console.log('   Status modal setelah klik:', isModalVisibleAfterClick ? 'Terbuka (Visible)' : 'Gagal Terbuka');
  if (!isModalVisibleAfterClick) throw new Error('Modal gagal terbuka!');

  // Periksa 5 poin privasi di dalam modal
  const modalText = await page.$eval('#modal-privasi-karyawan', el => el.innerText);
  const poinCheck = [
    'Pemrosesan Data Karyawan',
    'Verifikasi Dua Langkah',
    'Pemrosesan Geolokasi (GPS) Snapshot',
    'Retensi & Keamanan Data (UU PDP No. 27/2022)',
    'Hak Karyawan sebagai Subjek Data'
  ];
  for (const p of poinCheck) {
    if (!modalText.includes(p)) {
      throw new Error(`Poin "${p}" tidak ditemukan di dalam modal!`);
    }
  }
  console.log('   ✓ Seluruh 5 poin kebijakan privasi karyawan terverifikasi ada dan lengkap.');

  // Uji tombol tutup (Escape key)
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 200));
  const isHiddenAfterEscape = await page.$eval('#modal-privasi-karyawan', el => el.classList.contains('hidden'));
  console.log('   Uji tombol Escape:', isHiddenAfterEscape ? 'Berhasil menutup' : 'Gagal');
  if (!isHiddenAfterEscape) throw new Error('Modal gagal ditutup dengan tombol Escape!');

  // Uji tombol tutup 'Saya Mengerti'
  await page.click('#btn-privasi-karyawan');
  await new Promise(r => setTimeout(r, 200));
  await page.click('#btn-tutup-privasi-bawah');
  await new Promise(r => setTimeout(r, 200));
  const isHiddenAfterButton = await page.$eval('#modal-privasi-karyawan', el => el.classList.contains('hidden'));
  console.log('   Uji tombol "Saya Mengerti":', isHiddenAfterButton ? 'Berhasil menutup' : 'Gagal');
  if (!isHiddenAfterButton) throw new Error('Modal gagal ditutup dengan tombol Saya Mengerti!');

  console.log('\n🎉 SELURUH PENGUJIAN LOKAL 3 TAUTAN FOOTER SUKSES!');
  await browser.close();
}

testFooterLinks().catch(err => {
  console.error('❌ PENGUJIAN GAGAL:', err);
  process.exit(1);
});
