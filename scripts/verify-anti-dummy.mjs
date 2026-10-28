import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const files = ['portal-presensi.html', 'presensi.html', 'portal-absensi.html', 'absensi-data-handler.php', 'gas-absensi-Code.gs', 'GPS.html'];

// The exact dummy literals that were previously used as the entire address
const dummyExactLiterals = [
  'Ragunan Raya No. 8',
  'alamat: "Bandung, Jawa Barat"',
  'alamat: "Padang, Sumatera Barat"',
  'alamat: "Palembang, Sumatera Selatan"',
  "'alamat' => 'Bandung, Jawa Barat'",
  "'alamat' => 'Padang, Sumatera Barat'",
  "'alamat' => 'Palembang, Sumatera Selatan'",
  'Contoh: NSR-2019-005',
  'PIN Default Standar: 123456'
];

let allPassed = true;
files.forEach(fn => {
  const fullPath = path.join(ROOT_DIR, fn);
  if (fs.existsSync(fullPath)) {
    const c = fs.readFileSync(fullPath, 'utf8');
    const leaks = [];
    dummyExactLiterals.forEach(p => {
      if (c.includes(p)) leaks.push(p);
    });
    if (leaks.length === 0) {
      console.log(`✓ ${fn}: BERSIH (0 dummy literals found)`);
    } else {
      console.error(`✗ ${fn}: TERDETEKSI: ${leaks.join(', ')}`);
      allPassed = false;
    }
  }
});

// Also verify that the REAL official addresses are present in all files
const officialAddresses = [
  'Jl. Hankam No. 5 RT.006 RW.001',
  'Perumahan Pancanaka Royal Garden II',
  'Jl. Parak Gadang VIII No. 19',
  'Jl. Nuri Lr. 301 No. 7',
  'Komplek Griya Hero Abadi Maskarebet'
];

console.log('\n--- VERIFIKASI KEBERADAAN ALAMAT LEGAL RESMI ---');
files.forEach(fn => {
  const fullPath = path.join(ROOT_DIR, fn);
  if (fs.existsSync(fullPath)) {
    const c = fs.readFileSync(fullPath, 'utf8');
    const missing = officialAddresses.filter(a => !c.includes(a));
    if (missing.length === 0) {
      console.log(`✓ ${fn}: SEMUA 5 ALAMAT LEGAL RESMI LENGKAP`);
    } else {
      console.error(`✗ ${fn}: HILANG ALAMAT: ${missing.join(', ')}`);
      allPassed = false;
    }
  }
});

if (allPassed) {
  console.log('\nSEMUA FILE 100% MEMENUHI STANDAR ANTI-DUMMY & ALAMAT LEGAL RESMI!');
} else {
  process.exit(1);
}
