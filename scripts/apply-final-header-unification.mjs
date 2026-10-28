import fs from 'node:fs';

console.log('=== MEMULAI SINKRONISASI KEDUA HEADER (PORTAL + GAS) ===');

// 1. Update portal-presensi.html
const presensiPath = 'portal-presensi.html';
let presensiHtml = fs.readFileSync(presensiPath, 'utf8').replace(/\r\n/g, '\n');

const presensiHeaderStart = presensiHtml.indexOf('<header');
const presensiHeaderEnd = presensiHtml.indexOf('</header>', presensiHeaderStart) + 9;

if (presensiHeaderStart === -1 || presensiHeaderEnd === -1) {
  console.error('[FAIL] Header tidak ditemukan di portal-presensi.html');
  process.exit(1);
}

const newPresensiHeader = `<header class="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shadow-xl shrink-0">
    <div class="max-w-7xl mx-auto px-2.5 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-3">
      
      <!-- Brand & Title -->
      <a href="index.html" class="flex items-center gap-2 sm:gap-3 group min-w-0 flex-1" title="Kembali ke Beranda">
        <!-- Logo NSR Resmi Sesuai Header Website Utama -->
        <svg class="h-7 sm:h-9 md:h-10 w-auto shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" viewBox="0 0 160 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Logo Resmi KJPP NSR">
          <defs>
            <linearGradient id="nsrBlueHeaderPresensi" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2563eb" />
              <stop offset="50%" stop-color="#1d4ed8" />
              <stop offset="100%" stop-color="#0b1b4f" />
            </linearGradient>
            <filter id="neonGlowHeaderPresensi" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#ef4444" flood-opacity="0.9"/>
            </filter>
          </defs>
          <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="50" letter-spacing="1" fill="none" stroke="#ef4444" stroke-width="7" stroke-linejoin="round" filter="url(#neonGlowHeaderPresensi)">NSR</text>
          <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="50" letter-spacing="1" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linejoin="round">NSR</text>
          <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="50" letter-spacing="1" fill="url(#nsrBlueHeaderPresensi)">NSR</text>
        </svg>

        <div class="leading-tight min-w-0 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[11px] sm:text-sm md:text-[14.5px] font-black text-white tracking-tight uppercase leading-[1.2] line-clamp-2 sm:line-clamp-none" title="KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN" data-official-name="KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN" data-prompt-alias="KJPP NANNAG RAHAYU SIGIT PARYANTO DAN REKAN">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</span>
            <span class="inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-400/10 text-amber-300 border border-amber-400/30">KMK No. 2.19.0160</span>
          </div>
          <p class="text-[9.5px] sm:text-xs text-amber-400 font-semibold tracking-tight leading-tight line-clamp-1 sm:line-clamp-none mt-0.5">
            Portal Presensi Kehadiran Online &bull; Verifikasi Lokasi &amp; OTP
          </p>
        </div>
      </a>

      <!-- Quick Navigation & Helper Tools -->
      <div class="flex items-center gap-1 sm:gap-2 shrink-0">
        <a href="portal-operasional.html" title="Buka Portal e-Operasional" class="hidden lg:inline-flex px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition items-center gap-1 border border-slate-700/60">
          <span>💼 e-Operasional</span>
        </a>
        <a href="portal-kwitansi.html" title="Buka Portal Kwitansi" class="hidden md:inline-flex px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition items-center gap-1 border border-slate-700/60">
          <span>🧾 Kwitansi</span>
        </a>
        <a href="portal-nolap.html" title="Buka Portal NoLap" class="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition items-center gap-1 border border-slate-700/60">
          <span>📋 NoLap</span>
        </a>
        
        <!-- Direct External Launch Button (Fallback) -->
        <a id="btn-external-gas"
           href="https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec"
           target="_blank"
           rel="noopener noreferrer"
           title="Buka form presensi secara langsung di tab baru jika browser membatasi izin lokasi"
           class="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 text-[11px] font-bold border border-emerald-500/40 transition flex items-center gap-1 btn-tactile">
          <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span class="hidden sm:inline">Buka Tab Baru &nearr;</span>
        </a>

        <!-- Back to Main Website -->
        <a href="index.html" title="Kembali ke Beranda" class="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] sm:text-[11px] font-semibold transition flex items-center gap-1 border border-slate-700 btn-tactile">
          <span>&larr; <span class="hidden sm:inline">Beranda</span></span>
        </a>
      </div>

    </div>
  </header>`;

presensiHtml = presensiHtml.substring(0, presensiHeaderStart) + newPresensiHeader + presensiHtml.substring(presensiHeaderEnd);
fs.writeFileSync(presensiPath, presensiHtml.replace(/\n/g, '\r\n'), 'utf8');
console.log('✓ portal-presensi.html berhasil diperbarui dengan Subjudul resmi dan Badge KMK!');

// 2. Update GPS.html
const gpsPath = 'GPS.html';
let gpsHtml = fs.readFileSync(gpsPath, 'utf8').replace(/\r\n/g, '\n');

const gpsHeaderStart = gpsHtml.indexOf('<header');
const gpsHeaderEnd = gpsHtml.indexOf('</header>', gpsHeaderStart) + 9;

if (gpsHeaderStart === -1 || gpsHeaderEnd === -1) {
  console.error('[FAIL] Header tidak ditemukan di GPS.html');
  process.exit(1);
}

const newGpsHeader = `<header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
    <div class="max-w-xl mx-auto px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-3">
      <div class="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <!-- Logo Resmi NSR Sesuai Header Website Utama -->
        <svg class="h-8 sm:h-9 w-auto shrink-0 drop-shadow-sm" viewBox="0 0 160 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Logo Resmi KJPP NSR">
          <defs>
            <linearGradient id="nsrBlueHeaderGas" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2563eb" />
              <stop offset="50%" stop-color="#1d4ed8" />
              <stop offset="100%" stop-color="#0b1b4f" />
            </linearGradient>
            <filter id="neonGlowHeaderGas" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#ef4444" flood-opacity="0.9"/>
            </filter>
          </defs>
          <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="50" letter-spacing="1" fill="none" stroke="#ef4444" stroke-width="7" stroke-linejoin="round" filter="url(#neonGlowHeaderGas)">NSR</text>
          <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="50" letter-spacing="1" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linejoin="round">NSR</text>
          <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="50" letter-spacing="1" fill="url(#nsrBlueHeaderGas)">NSR</text>
        </svg>

        <div class="leading-tight min-w-0 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <h1 class="text-xs sm:text-sm font-black text-white uppercase tracking-tight" title="KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</h1>
            <span class="inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-400/10 text-amber-300 border border-amber-400/30">KMK No. 2.19.0160</span>
          </div>
          <p class="text-[9.5px] sm:text-[10.5px] text-amber-400 font-semibold tracking-tight mt-0.5">Portal Presensi Kehadiran Online &bull; Verifikasi Lokasi &amp; OTP</p>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">Terhubung</span>
    </div>
  </header>`;

gpsHtml = gpsHtml.substring(0, gpsHeaderStart) + newGpsHeader + gpsHtml.substring(gpsHeaderEnd);
fs.writeFileSync(gpsPath, gpsHtml.replace(/\n/g, '\r\n'), 'utf8');
console.log('✓ GPS.html berhasil diperbarui dengan Logo Resmi NSR, Nama Lengkap & KMK Badge!');

// 3. Update gas-portal-absensi-template.html
const templatePath = 'gas-portal-absensi-template.html';
if (fs.existsSync(templatePath)) {
  let templateHtml = fs.readFileSync(templatePath, 'utf8').replace(/\r\n/g, '\n');
  const tplHeaderStart = templateHtml.indexOf('<header');
  const tplHeaderEnd = templateHtml.indexOf('</header>', tplHeaderStart) + 9;
  if (tplHeaderStart !== -1 && tplHeaderEnd !== -1) {
    templateHtml = templateHtml.substring(0, tplHeaderStart) + newGpsHeader + templateHtml.substring(tplHeaderEnd);
    fs.writeFileSync(templatePath, templateHtml.replace(/\n/g, '\r\n'), 'utf8');
    console.log('✓ gas-portal-absensi-template.html berhasil disinkronkan!');
  }
}

// 4. Update gas-absensi-Code.gs (Email OTP template & comments)
const codeGsPath = 'gas-absensi-Code.gs';
let codeGs = fs.readFileSync(codeGsPath, 'utf8').replace(/\r\n/g, '\n');
codeGs = codeGs.replace('KJPP NANANG RAHAYU & REKAN', 'KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN');
codeGs = codeGs.replace('Sistem Presensi & Layanan Mandiri Karyawan', 'Portal Presensi Kehadiran Online &bull; Verifikasi Lokasi &amp; OTP');
fs.writeFileSync(codeGsPath, codeGs.replace(/\n/g, '\r\n'), 'utf8');
console.log('✓ gas-absensi-Code.gs berhasil diperbarui!');

console.log('=== SEMUA FILE LOKAL TELAH DISINKRONKAN DENGAN SUKSES ===');
