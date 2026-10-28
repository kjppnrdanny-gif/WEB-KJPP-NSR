import fs from 'fs';
import path from 'path';

const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';

const files = [
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

function findDivBounds(html, searchStr) {
  const targetIdx = html.indexOf(searchStr);
  if (targetIdx === -1) return null;
  const tagStart = html.lastIndexOf('<div', targetIdx);

  let depth = 0;
  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = tagStart;

  let match;
  let tagEnd = -1;
  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[0];
    if (!tag.endsWith('/>')) {
      if (tag.startsWith('</')) {
        depth--;
        if (depth === 0) {
          tagEnd = match.index + tag.length;
          break;
        }
      } else {
        depth++;
      }
    }
  }

  return { tagStart, tagEnd };
}

function buildNewModalHtml(cardsHtml) {
  return `<div id="modal-portal" class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md hidden flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-hidden="true" onclick="if(event.target === this) tutupModalPortal()">
    <div id="modal-portal-dialog" class="bg-slate-950 text-slate-100 max-w-4xl lg:max-w-5xl w-full mx-auto my-auto max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-800 relative text-xs p-0">
      
      <!-- Tombol Tutup Modal (Global Sudut Kanan Atas) -->
      <button type="button"
              onclick="tutupModalPortal()"
              class="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 text-slate-400 hover:text-white text-xl font-bold w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center cursor-pointer transition btn-tactile shadow-md"
              aria-label="Tutup Dialog Modal">
        &times;
      </button>

      <!-- ========================================================
           REDESIGN PREMIUM DUA PANEL: LOGIN OPINI NSR
           Sisi Kiri: Identitas Resmi, Brand & Cakupan 5 Kantor
           Sisi Kanan: Autentikasi Token Eksklusif & Tombol Verifikasi & Masuk
           ======================================================== -->
      <form onsubmit="verifikasiTokenPortal(event)" id="form-token-portal" class="grid grid-cols-1 md:grid-cols-12 w-full overflow-hidden">
        
        <!-- PANEL KIRI: IDENTITAS RESMI, BRAND & CAKUPAN 5 KANTOR -->
        <div class="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 sm:p-6 md:p-7 border-b md:border-b-0 md:border-r border-slate-800/80 flex flex-col justify-between relative overflow-hidden select-none">
          
          <!-- Subtle Ambient Glow -->
          <div class="absolute -top-12 -left-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-12 -right-12 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Top Brand Section -->
          <div class="relative z-10">
            <!-- Badge Izin Usaha KMK -->
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/30 shadow-sm w-fit mb-3">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
              <span>KMK No. 2.19.0160</span>
            </div>

            <!-- Logo NSR Resmi SVG -->
            <div class="mb-3">
              <svg class="h-8 sm:h-9 md:h-10 w-auto shrink-0 drop-shadow-md" viewBox="0 0 160 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Logo Resmi KJPP NSR">
                <defs>
                  <linearGradient id="nsrBlueLoginModal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2563eb" />
                    <stop offset="50%" stop-color="#1d4ed8" />
                    <stop offset="100%" stop-color="#0b1b4f" />
                  </linearGradient>
                  <filter id="neonGlowLoginModal" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#ef4444" flood-opacity="0.9"/>
                  </filter>
                </defs>
                <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="50" letter-spacing="1" fill="none" stroke="#ef4444" stroke-width="7" stroke-linejoin="round" filter="url(#neonGlowLoginModal)">NSR</text>
                <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="50" letter-spacing="1" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linejoin="round">NSR</text>
                <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="50" letter-spacing="1" fill="url(#nsrBlueLoginModal)">NSR</text>
              </svg>
            </div>

            <!-- Nama Entitas Resmi -->
            <p class="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wide leading-tight line-clamp-2">
              KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN
            </p>

            <!-- Judul OPINI NSR & Subjudul -->
            <div class="mt-3">
              <h3 class="text-xl sm:text-2xl font-black text-amber-400 tracking-tight leading-none flex items-baseline gap-1.5">
                OPINI NSR
              </h3>
              <p class="text-[10.5px] sm:text-[11.5px] text-slate-200 font-semibold leading-tight mt-1">
                Otorisasi Penilaian, Informasi, &amp; Navigasi Internal KJPP NSR
              </p>
              <p class="text-[10px] sm:text-[10.5px] text-amber-300/90 italic mt-1 font-medium leading-snug">
                &ldquo;Dari Data Lapangan Menjadi Opini yang Andal&rdquo;
              </p>
            </div>
          </div>

          <!-- Middle Section: Cakupan 5 Kantor Resmi -->
          <div class="mt-4 pt-3 border-t border-slate-800/80 relative z-10">
            <p class="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Cakupan Wilayah 5 Kantor</span>
            </p>
            <div class="grid grid-cols-2 gap-1.5 text-[10px]">
              <div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-200" title="Kantor Pusat Jakarta">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <span class="truncate">Pusat Jakarta</span>
              </div>
              <div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-200" title="Kantor Cabang Bandung">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <span class="truncate">Cabang Bandung</span>
              </div>
              <div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-200" title="Kantor Cabang Padang">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <span class="truncate">Cabang Padang</span>
              </div>
              <div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-200" title="Kantor Cabang Makassar">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <span class="truncate">Cabang Makassar</span>
              </div>
              <div class="col-span-2 flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-200" title="Kantor Cabang Palembang">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <span class="truncate">Cabang Palembang</span>
              </div>
            </div>
          </div>

          <!-- Bottom Trust Badge -->
          <div class="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[9.5px] text-slate-400 relative z-10">
            <span class="flex items-center gap-1">
              <svg class="w-3 h-3 text-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Zero-Trust Security</span>
            </span>
            <span>Standar SPI &amp; KEPI</span>
          </div>

        </div>

        <!-- PANEL KANAN: KHUSUS AUTENTIKASI TOKEN & VERIFIKASI MASUK -->
        <div class="md:col-span-7 bg-slate-950 p-5 sm:p-7 md:p-8 flex flex-col justify-center relative">
          
          <!-- Header Form -->
          <div class="mb-4 sm:mb-5 pr-8">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-sky-300 bg-sky-950/60 border border-sky-500/30 mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span>Akses Khusus Staf &amp; Rekan</span>
            </div>
            <h4 class="text-lg sm:text-xl font-bold text-white tracking-tight">
              Autentikasi Token OPINI
            </h4>
            <p class="text-[11.5px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
              Masukkan token otorisasi resmi Anda untuk membuka portal internal penugasan, registrasi NoLap, kwitansi, dan e-Operasional.
            </p>
          </div>

          <!-- Input Field Token & Validation -->
          <div class="space-y-4">
            <div>
              <label for="input-token" class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span>Token Otorisasi Akses <span class="text-rose-400">*</span></span>
                <span class="text-[10px] font-normal text-slate-400">Rahasia &bull; Sesuai Peran</span>
              </label>

              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg class="w-4 h-4 text-amber-400/80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
                </div>
                
                <input type="password"
                       id="input-token"
                       placeholder="Masukkan token otorisasi..."
                       required
                       class="input-basic flex h-11 w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-10 pr-11 py-2 text-sm text-white font-mono font-bold placeholder:text-slate-500 placeholder:font-sans placeholder:font-normal shadow-inner transition-colors tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:border-amber-400/70"
                       autocomplete="current-password">

                <button type="button"
                        id="btn-toggle-token"
                        onclick="toggleTokenVisibility()"
                        class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white focus:outline-none cursor-pointer transition"
                        aria-label="Tampilkan token"
                        title="Tampilkan / sembunyikan token">
                  <svg id="icon-eye-show" class="w-4 h-4 sm:w-5 sm:h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1 19.876 0"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg id="icon-eye-hide" class="w-4 h-4 sm:w-5 sm:h-5 hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>
                    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>
                    <path d="M17.479 17.499A10.75 10.75 0 0 1 2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 5.275-5.275"/>
                    <line x1="2" x2="22" y1="2" y2="22"/>
                  </svg>
                </button>
              </div>

              <!-- Pesan Kesalahan Terpadu -->
              <p id="pesan-error" class="text-xs text-rose-300 font-medium mt-2.5 hidden flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30">
                <svg class="w-4 h-4 text-rose-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                <span id="pesan-error-text">Token tidak terdaftar. Pastikan memasukkan token kantor cabang atau pusat yang valid.</span>
              </p>
            </div>

            <!-- Tombol Submit Utama: Verifikasi & Masuk -->
            <button type="submit"
                    id="btn-submit-token"
                    class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-950/60 border border-blue-400/40 btn-tactile">
              <span id="btn-submit-text">Verifikasi &amp; Masuk</span>
              <svg class="w-4 h-4 text-blue-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>

          <!-- Footer Bantuan & Keamanan -->
          <div class="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span class="flex items-center gap-1.5 text-[10px]">
              <svg class="w-3.5 h-3.5 text-amber-400/80 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Enkripsi Server-Side SHA-256</span>
            </span>
            <a href="https://wa.me/6281298765432?text=Halo%20Admin%20Pusat%20KJPP%20NSR%2C%20mohon%20bantuan%20token%20akses%20OPINI%20NSR"
               target="_blank"
               rel="noopener noreferrer"
               class="text-amber-400 hover:text-amber-300 font-semibold hover:underline flex items-center gap-1 transition">
              <span>Bantuan Admin</span> &nearr;
            </a>
          </div>

        </div>

      </form>

      <!-- MENU PORTAL OPERASIONAL OPINI NSR (AUTHENTICATED VIEW) -->
      <div id="panel-layanan" class="hidden flex-1 flex flex-col min-h-0 overflow-hidden p-4 sm:p-6">
        
        <!-- Header Modal OPINI NSR (Tampil Saat Sudah Terverifikasi) -->
        <div class="flex items-start justify-between pb-3 sm:pb-3.5 border-b border-slate-800/80 mb-3 sm:mb-4 shrink-0">
          <div class="min-w-0 pr-3 sm:pr-4 flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30 shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                <span class="leading-snug break-words">KJPP Nanang Rahayu Sigit Paryanto dan Rekan • Izin KMK No. 2.19.0160</span>
              </div>
              <div class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold text-slate-300 bg-slate-800/80 border border-slate-700/80">
                Akses Terpadu 5 Kantor
              </div>
            </div>
            <div>
              <h3 class="text-xl sm:text-2xl font-black text-amber-400 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                <span>OPINI NSR</span>
                <span class="text-xs sm:text-sm font-semibold text-slate-300">
                  (Otorisasi Penilaian, Informasi, &amp; Navigasi Internal KJPP NSR)
                </span>
              </h3>
              <p class="text-[11px] sm:text-xs text-amber-400/90 font-medium mt-0.5">
                OPINI NSR • Dari Data Lapangan Menjadi Opini yang Andal
              </p>
            </div>
          </div>
          <button onclick="tutupModalPortal()" class="text-slate-400 hover:text-white text-xl font-bold w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center cursor-pointer shrink-0 transition" aria-label="Tutup Modal">&times;</button>
        </div>

        <!-- Bar Status Verifikasi -->
        <div class="p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800 mb-3 flex items-center justify-between text-xs sm:text-sm shrink-0">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
            <p class="text-slate-200 font-semibold text-xs sm:text-sm truncate" id="label-lokasi">Token Terverifikasi</p>
          </div>
          <button type="button" onclick="resetTokenSesi()" class="text-[11px] font-semibold text-slate-400 hover:text-rose-400 underline cursor-pointer shrink-0 ml-2 transition">Ganti Token / Keluar</button>
        </div>

        ${cardsHtml}
      </div>

    </div>
  </div>`;
}

files.forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  const html = fs.readFileSync(filePath, 'utf8');

  const modalBounds = findDivBounds(html, 'id="modal-portal"');
  if (!modalBounds) {
    console.error(`Cannot find modal-portal bounds in ${file}`);
    return;
  }

  const panelBounds = findDivBounds(html, 'id="panel-layanan"');
  if (!panelBounds) {
    console.error(`Cannot find panel-layanan bounds in ${file}`);
    return;
  }

  const containerIdx = html.indexOf('id="container-kartu-layanan"', panelBounds.tagStart);
  if (containerIdx === -1) {
    console.error(`Cannot find container-kartu-layanan in ${file}`);
    return;
  }

  // Cards html is from containerIdx up to the closing </div> of panel-layanan
  const cardsHtml = html.slice(containerIdx, panelBounds.tagEnd - 6).trim();

  const newModal = buildNewModalHtml(cardsHtml);
  const updatedHtml = html.slice(0, modalBounds.tagStart) + newModal + html.slice(modalBounds.tagEnd);

  fs.writeFileSync(filePath, updatedHtml, 'utf8');
  console.log(`SUCCESS: Applied redesign to ${file} (Cards: ${cardsHtml.length} chars)`);
});
