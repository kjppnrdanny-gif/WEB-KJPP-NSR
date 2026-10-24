import fs from 'fs';
import assert from 'assert';

console.log('========================================================================');
console.log('TEST SUITE: USER REFINEMENT & SANITIZATION VERIFICATION');
console.log('========================================================================');

const nolap = fs.readFileSync('portal-nolap.html', 'utf8');
const kwitansi = fs.readFileSync('portal-kwitansi.html', 'utf8');
const mergeTags = fs.readFileSync('merge-tags-engine.php', 'utf8');
const handler = fs.readFileSync('nolap-data-handler.php', 'utf8');

// 1. Zero token leakage in portal-nolap.html
console.log('[1] Memeriksa Kebocoran Token & Proporsi Modal Token:');
assert.ok(!nolap.includes('placeholder="Contoh: NSR8899'), 'ERROR: Token leakage in placeholder!');
assert.ok(nolap.includes('placeholder="Masukkan token akses resmi Anda..."'), 'ERROR: Generic placeholder not found!');
assert.ok(nolap.includes('max-w-[460px]'), 'ERROR: Modal max-width 460px not set!');
assert.ok(nolap.includes('p-5 sm:p-6'), 'ERROR: Modal padding p-5 sm:p-6 not set!');
assert.ok(nolap.includes('text-[11px] font-bold text-slate-300'), 'ERROR: Modal label typography not set!');
console.log('  ✔ PASS: Token leakage eliminated from modal input');
console.log('  ✔ PASS: Generic secure placeholder verified');
console.log('  ✔ PASS: Modal proportion (max-w-[460px], p-5 sm:p-6) verified');

// 2. Presensi button normalization
console.log('[2] Memeriksa Normalisasi Tautan Presensi:');
assert.ok(!nolap.includes('https://script.google.com/macros/s/AKfycbwI'), 'ERROR: External script.google.com link found in portal-nolap.html!');
assert.ok(nolap.includes('href="portal-presensi.html" title="Buka Presensi Online"'), 'ERROR: Internal portal-presensi.html not found in portal-nolap.html!');
assert.ok(!kwitansi.includes('https://script.google.com/macros/s/AKfycbwI'), 'ERROR: External script.google.com link found in portal-kwitansi.html!');
assert.ok(kwitansi.includes('href="portal-presensi.html" title="Buka Presensi Online"'), 'ERROR: Internal portal-presensi.html not found in portal-kwitansi.html!');
assert.ok(fs.existsSync('presensi.html'), 'ERROR: presensi.html does not exist!');
console.log('  ✔ PASS: External Google Apps Script Presensi links removed');
console.log('  ✔ PASS: Internal portal-presensi.html linked in portal-nolap.html and portal-kwitansi.html');
console.log('  ✔ PASS: presensi.html alias created and verified');

// 3. Standardization of KJPP official legal name
console.log('[3] Memeriksa Standardisasi Nama Resmi Badan Usaha:');
assert.ok(nolap.includes('KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN'), 'ERROR: Official name not found in portal-nolap.html!');
assert.ok(!nolap.includes('KJPP NANANG RAHAYU SIGIT PARYANTO &amp; REKAN'), 'ERROR: Outdated ampersand legal name found in portal-nolap.html!');
assert.ok(handler.includes('KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN'), 'ERROR: Official name not found in nolap-data-handler.php!');
assert.ok(mergeTags.includes('KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN'), 'ERROR: Official name not found in merge-tags-engine.php!');
console.log('  ✔ PASS: Legal name standardized to "KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN" (with "DAN")');

// 4. Elimination of "Cabang: Pusat" in templates
console.log('[4] Memeriksa Eliminasi Frasa "Cabang: Pusat":');
assert.ok(!mergeTags.includes('| Cabang: {{kode_cabang}}'), 'ERROR: Static Cabang tag found in merge-tags-engine.php!');
assert.ok(mergeTags.includes('{{sub_header_cabang}}'), 'ERROR: Dynamic sub_header_cabang tag not found in merge-tags-engine.php!');
assert.ok(!nolap.includes('| Cabang: ${map[\'{{kode_cabang}}\']}'), 'ERROR: Client fallback still has static Cabang: template!');
console.log('  ✔ PASS: Dynamic branch subheader engine active (Pusat displays clean subtitle without "| Cabang: Pusat")');

// 5. Grid alignment of f-catatan-pemohon
console.log('[5] Memeriksa Tata Letak Grid Form Penugasan:');
const catatanSpan = /<div class="lg:col-span-4">\s*<label[^>]*>Catatan Tambahan Pemohon<\/label>/;
assert.ok(catatanSpan.test(nolap), 'ERROR: f-catatan-pemohon is not lg:col-span-4!');
console.log('  ✔ PASS: f-catatan-pemohon properly spans lg:col-span-4 (full width, zero gaps)');

console.log('========================================================================');
console.log('HASIL PENGUJIAN: SEMUA VERIFIKASI LOLOS 100%!');
console.log('========================================================================');
