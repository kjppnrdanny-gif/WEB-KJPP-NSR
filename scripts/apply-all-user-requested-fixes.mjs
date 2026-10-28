import fs from 'fs';

function toCrlf(str) {
  return str.replace(/\r?\n/g, '\r\n');
}

console.log('1. Patching portal-nolap.html...');
let nolap = fs.readFileSync('portal-nolap.html', 'utf8');
const isCrlf = nolap.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

// 1.1 Modal token sanitization & ratio
const oldModalBox = `<div id="box-auth-token" data-modal="modal-auth" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto text-center space-y-5 shadow-2xl mb-8">`;
const newModalBox = `<div id="box-auth-token" data-modal="modal-auth" class="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-[460px] mx-auto text-center space-y-4 shadow-2xl mb-8">`;
if (nolap.includes(oldModalBox)) {
  nolap = nolap.replace(oldModalBox, newModalBox);
  console.log('✓ Replaced modal box container');
} else {
  console.log('! Modal box container already updated or mismatch');
}

const oldModalIcon = `<div class="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-400/20 shadow-inner">
        <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">`;
const newModalIcon = `<div class="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-400/20 shadow-inner">
        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">`;
if (nolap.includes(isCrlf ? toCrlf(oldModalIcon) : oldModalIcon)) {
  nolap = nolap.replace(isCrlf ? toCrlf(oldModalIcon) : oldModalIcon, isCrlf ? toCrlf(newModalIcon) : newModalIcon);
  console.log('✓ Replaced modal icon size');
} else {
  console.log('! Modal icon already updated or mismatch');
}

const oldModalTitle = `<h2 class="text-xl font-bold text-white tracking-tight">Akses Terproteksi Sistem NoLap</h2>`;
const newModalTitle = `<h2 class="text-lg font-bold text-white tracking-tight">Akses Terproteksi Sistem NoLap</h2>`;
if (nolap.includes(oldModalTitle)) {
  nolap = nolap.replace(oldModalTitle, newModalTitle);
  console.log('✓ Replaced modal title size');
}

const oldDesc = `<p class="text-xs text-slate-400 mt-1">Masukkan Token Akses Resmi KJPP Nanang Rahayu Sigit Paryanto &amp; Rekan untuk membuka portal.</p>`;
const newDesc = `<p class="text-xs text-slate-400 mt-1">Masukkan Token Akses Resmi KJPP Nanang Rahayu Sigit Paryanto dan Rekan untuk membuka portal.</p>`;
if (nolap.includes(oldDesc)) {
  nolap = nolap.replace(oldDesc, newDesc);
  console.log('✓ Replaced modal description entity name');
}

const oldLabel = `<label class="block text-xs font-bold text-slate-200 mb-1.5 uppercase tracking-wider">Masukkan Token Akses NSR</label>`;
const newLabel = `<label class="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">Masukkan Token Akses NSR</label>`;
if (nolap.includes(oldLabel)) {
  nolap = nolap.replace(oldLabel, newLabel);
  console.log('✓ Replaced modal label styling');
}

const oldInput = `<input type="text" id="input-token-nolap" name="token" placeholder="Contoh: NSR8899 atau NSR-KING-..." class="w-full h-12 px-4 rounded-xl bg-slate-950 border-2 border-slate-700 font-mono text-amber-400 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 text-sm tracking-widest uppercase font-bold transition shadow-inner" required autocomplete="off" autofocus>`;
const newInput = `<input type="text" id="input-token-nolap" name="token" placeholder="Masukkan token akses resmi Anda..." class="w-full h-11 px-3.5 rounded-xl bg-slate-950 border-2 border-slate-700 font-mono text-amber-400 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 text-xs sm:text-sm tracking-wider uppercase font-bold transition shadow-inner" required autocomplete="off" autofocus>`;
if (nolap.includes(oldInput)) {
  nolap = nolap.replace(oldInput, newInput);
  console.log('✓ Sanitized token input placeholder and refined styles');
} else {
  console.log('! Token input already updated or mismatch');
}

const oldButton = `<button type="submit" id="btn-buka-nolap" class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2">`;
const newButton = `<button type="submit" id="btn-buka-nolap" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2">`;
if (nolap.includes(oldButton)) {
  nolap = nolap.replace(oldButton, newButton);
  console.log('✓ Replaced modal submit button styling');
}

// 1.2 Navbar Presensi in portal-nolap.html
const oldPresensiNav = `<a href="https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec" target="_blank" rel="noopener noreferrer" title="Buka Presensi Online" class="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition items-center gap-1.5 border border-slate-700">`;
const newPresensiNav = `<a href="portal-presensi.html" title="Buka Presensi Online" class="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition items-center gap-1.5 border border-slate-700">`;
if (nolap.includes(oldPresensiNav)) {
  nolap = nolap.replace(oldPresensiNav, newPresensiNav);
  console.log('✓ Replaced Presensi navbar link in portal-nolap.html');
}

// 1.3 Entity names in portal-nolap.html
const oldHeaderEntity = `<span class="text-sm sm:text-base font-extrabold text-white tracking-wide uppercase">KJPP NANANG RAHAYU SIGIT PARYANTO &amp; REKAN</span>`;
const newHeaderEntity = `<span class="text-sm sm:text-base font-extrabold text-white tracking-wide uppercase">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</span>`;
if (nolap.includes(oldHeaderEntity)) {
  nolap = nolap.replace(oldHeaderEntity, newHeaderEntity);
  console.log('✓ Standardized header entity name in portal-nolap.html');
}

const oldSpkEntity = `<p class="font-bold underline">KJPP Nanang Rahayu Sigit Paryanto &amp; Rekan</p>`;
const newSpkEntity = `<p class="font-bold underline">KJPP Nanang Rahayu Sigit Paryanto dan Rekan</p>`;
if (nolap.includes(oldSpkEntity)) {
  nolap = nolap.replace(oldSpkEntity, newSpkEntity);
  console.log('✓ Standardized SPK entity name in portal-nolap.html');
}

// 1.4 Client fallback document template in portal-nolap.html
const oldFallbackHeader = `<h2 style="margin: 0; font-size: 16px;">KJPP NANANG RAHAYU &amp; REKAN</h2>\r\n            <p style="margin: 3px 0 0 0; font-size: 11px; color: #475569;">Izin Usaha Kemenkeu No. 2.19.0160 | Cabang: \${map['{{kode_cabang}}']}</p>`;
const oldFallbackHeaderLF = `<h2 style="margin: 0; font-size: 16px;">KJPP NANANG RAHAYU &amp; REKAN</h2>\n            <p style="margin: 3px 0 0 0; font-size: 11px; color: #475569;">Izin Usaha Kemenkeu No. 2.19.0160 | Cabang: \${map['{{kode_cabang}}']}</p>`;

const newFallbackHeaderCode = `\${(() => {
            const rawCabang = (map['{{kode_cabang}}'] || '').toString().trim();
            const isPusat = !rawCabang || ['PUSAT', 'KANTOR PUSAT', 'JAKARTA'].includes(rawCabang.toUpperCase());
            const subCabang = isPusat ? '' : ' | Kantor Cabang ' + rawCabang;
            return '<h2 style="margin: 0; font-size: 16px;">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</h2>' +
                   '<p style="margin: 3px 0 0 0; font-size: 11px; color: #475569;">Izin Usaha Kemenkeu No. 2.19.0160' + subCabang + '</p>';
          })()}`;

if (nolap.includes(oldFallbackHeader)) {
  nolap = nolap.replace(oldFallbackHeader, newFallbackHeaderCode);
  console.log('✓ Standardized client fallback document header (CRLF)');
} else if (nolap.includes(oldFallbackHeaderLF)) {
  nolap = nolap.replace(oldFallbackHeaderLF, newFallbackHeaderCode);
  console.log('✓ Standardized client fallback document header (LF)');
} else {
  console.log('! Fallback header already replaced or mismatch');
}

// 1.5 Grid alignment: f-catatan-pemohon lg:col-span-4
const oldCatatanGrid = `<div class="lg:col-span-2">
              <label class="block font-semibold text-slate-300 mb-1">Catatan Tambahan Pemohon</label>
              <input type="text" id="f-catatan-pemohon" placeholder="Catatan urgensi akad / kebutuhan penomoran..." class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>`;
const newCatatanGrid = `<div class="lg:col-span-4">
              <label class="block font-semibold text-slate-300 mb-1">Catatan Tambahan Pemohon</label>
              <input type="text" id="f-catatan-pemohon" placeholder="Catatan urgensi akad / kebutuhan penomoran..." class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>`;

if (nolap.includes(isCrlf ? toCrlf(oldCatatanGrid) : oldCatatanGrid)) {
  nolap = nolap.replace(isCrlf ? toCrlf(oldCatatanGrid) : oldCatatanGrid, isCrlf ? toCrlf(newCatatanGrid) : newCatatanGrid);
  console.log('✓ Adjusted f-catatan-pemohon grid span to lg:col-span-4 (full width)');
} else {
  console.log('! f-catatan-pemohon grid span mismatch or already updated');
}

fs.writeFileSync('portal-nolap.html', nolap, 'utf8');
console.log('Saved portal-nolap.html successfully.');

// 2. Patch portal-kwitansi.html
console.log('2. Patching portal-kwitansi.html...');
let kwitansi = fs.readFileSync('portal-kwitansi.html', 'utf8');
const oldPresensiKwitansi = `<a href="https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec" target="_blank" rel="noopener noreferrer" title="Buka Presensi Online" class="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition items-center gap-1.5 border border-slate-700">`;
const newPresensiKwitansi = `<a href="portal-presensi.html" title="Buka Presensi Online" class="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition items-center gap-1.5 border border-slate-700">`;
if (kwitansi.includes(oldPresensiKwitansi)) {
  kwitansi = kwitansi.replace(oldPresensiKwitansi, newPresensiKwitansi);
  console.log('✓ Replaced Presensi navbar link in portal-kwitansi.html');
  fs.writeFileSync('portal-kwitansi.html', kwitansi, 'utf8');
} else {
  console.log('! Presensi link in portal-kwitansi.html mismatch or already updated');
}

// 3. Create presensi.html
console.log('3. Creating presensi.html from portal-presensi.html...');
fs.copyFileSync('portal-presensi.html', 'presensi.html');
console.log('✓ Created presensi.html successfully.');

// 4. Patch nolap-data-handler.php
console.log('4. Patching nolap-data-handler.php...');
let handler = fs.readFileSync('nolap-data-handler.php', 'utf8');
const oldHandlerH2 = `<h2 style='margin:0; color: #f59e0b;'>KJPP NANANG RAHAYU & REKAN</h2>`;
const newHandlerH2 = `<h2 style='margin:0; color: #f59e0b;'>KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</h2>`;
if (handler.includes(oldHandlerH2)) {
  handler = handler.replace(oldHandlerH2, newHandlerH2);
  console.log('✓ Replaced h2 entity name in nolap-data-handler.php');
}

const oldHandlerSender = `'sender'    => 'KJPP Nanang Rahayu & Rekan <notifikasi@kjppnanangrahayu.com>',`;
const newHandlerSender = `'sender'    => 'KJPP Nanang Rahayu Sigit Paryanto dan Rekan <notifikasi@kjppnanangrahayu.com>',`;
if (handler.includes(oldHandlerSender)) {
  handler = handler.replace(oldHandlerSender, newHandlerSender);
  console.log('✓ Replaced sender entity name in nolap-data-handler.php');
}
fs.writeFileSync('nolap-data-handler.php', handler, 'utf8');

// 5. Patch process-mail-queue.php
console.log('5. Patching process-mail-queue.php...');
let mailQueue = fs.readFileSync('process-mail-queue.php', 'utf8');
mailQueue = mailQueue.replace(/\* KJPP NANANG RAHAYU & REKAN \(KJPP NSR\)/g, '* KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)');
mailQueue = mailQueue.replace(/KJPP Nanang Rahayu & Rekan <notifikasi@kjppnanangrahayu\.com>/g, 'KJPP Nanang Rahayu Sigit Paryanto dan Rekan <notifikasi@kjppnanangrahayu.com>');
fs.writeFileSync('process-mail-queue.php', mailQueue, 'utf8');
console.log('✓ Replaced entity name in process-mail-queue.php');

console.log('All patches applied successfully!');
