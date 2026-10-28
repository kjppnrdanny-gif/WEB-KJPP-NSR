import fs from 'node:fs';

const filePath = 'd:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/portal-presensi.html';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF
let norm = content.replace(/\r\n/g, '\n');

// 1. Meta Title & Description
const oldMeta = `  <title>Portal Presensi &amp; Kehadiran Online | KJPP Nanang Rahayu &amp; Rekan</title>
  <meta name="description" content="Portal Presensi Kehadiran Online dan Layanan Mandiri Karyawan KJPP Nanang Rahayu Sigit Paryanto dan Rekan (KMK No. 2.19.0160).">`;

const newMeta = `  <title>Portal Presensi &amp; Kehadiran Online | KJPP Nanang Rahayu Sigit Paryanto dan Rekan</title>
  <meta name="description" content="Sistem Presensi Kehadiran Online dan Layanan Mandiri Karyawan KJPP Nanang Rahayu Sigit Paryanto dan Rekan (KMK No. 2.19.0160).">`;

if (norm.includes(oldMeta)) {
  norm = norm.replace(oldMeta, newMeta);
  console.log('[PASS] Updated meta title');
}

// 2. Header Brand & Logo
const oldBrand = `      <!-- Brand & Title -->
      <a href="index.html" class="flex items-center gap-2.5 sm:gap-3 group min-w-0" title="Kembali ke Beranda">
        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 p-0.5 shadow-md shadow-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
          <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center p-1">
            <svg class="h-5 sm:h-6 w-auto" viewBox="0 0 160 55" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="nsrGreenHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#34d399" />
                  <stop offset="100%" stop-color="#059669" />
                </linearGradient>
              </defs>
              <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="52" fill="none" stroke="#059669" stroke-width="6" stroke-linejoin="round">NSR</text>
              <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="52" fill="url(#nsrGreenHeader)">NSR</text>
            </svg>
          </div>
        </div>

        <div class="leading-tight min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase truncate">KJPP NANANG RAHAYU &amp; REKAN</span>
            <span class="hidden md:inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-400/10 text-emerald-400 border border-emerald-400/30">KMK No. 2.19.0160</span>
          </div>
          <p class="text-[10.5px] sm:text-xs text-emerald-400/90 font-medium truncate flex items-center gap-1">
            <span>Portal Presensi Kehadiran Online</span>
            <span class="text-slate-500">&bull;</span>
            <span class="text-slate-400">Verifikasi Lokasi &amp; OTP</span>
          </p>
        </div>
      </a>`;

const newBrand = `      <!-- Brand & Title -->
      <a href="index.html" class="flex items-center gap-2.5 sm:gap-3 group min-w-0" title="Kembali ke Beranda">
        <!-- Logo NSR Resmi Sesuai Header Website Utama -->
        <svg class="h-8 sm:h-9 md:h-10 w-auto shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" viewBox="0 0 160 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Logo Resmi KJPP NSR">
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

        <div class="leading-tight min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs sm:text-sm md:text-[14.5px] font-black text-white tracking-tight uppercase truncate" title="KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN" data-official-name="KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN" data-prompt-alias="KJPP NANNAG RAHAYU SIGIT PARYANTO DAN REKAN">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</span>
            <span class="hidden xl:inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-400/10 text-amber-300 border border-amber-400/30">KMK No. 2.19.0160</span>
          </div>
          <p class="text-[10px] sm:text-xs text-amber-400 font-semibold tracking-normal truncate mt-0.5">
            Sistem Presensi &amp; Layanan Mandiri Karyawan
          </p>
        </div>
      </a>`;

if (!norm.includes(oldBrand)) {
  console.error('[FAIL] oldBrand not found in portal-presensi.html!');
  process.exit(1);
}

norm = norm.replace(oldBrand, newBrand);
console.log('[PASS] Updated brand & logo in portal-presensi.html');

fs.writeFileSync(filePath, norm.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully saved portal-presensi.html!');
