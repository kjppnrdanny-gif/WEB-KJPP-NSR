import fs from 'node:fs';

console.log('=== APPLY OPINI NSR REBRANDING & MODAL RESTRUCTURING ===');

let html = fs.readFileSync('index.html', 'utf8');

// 1. RESTRUCTURE MODAL CONTAINER & HEADER & CARDS
const oldModalRegex = /<!-- MODAL LOGIN PORTAL INTERNAL -->[\s\S]*?<!-- ==================== MODAL PERMOHONAN AKSES DOKUMEN & SOP INTERNAL ==================== -->/;

const newModalHtml = `<!-- MODAL LOGIN PORTAL INTERNAL (OPINI NSR) -->
  <!-- POP-UP MODAL PORTAL OPERASIONAL INTERNAL (PROTEKSI SERVER-SIDE) -->
  <div id="modal-portal" class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md hidden flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-hidden="true" onclick="if(event.target === this) tutupModalPortal()">
    <div id="modal-portal-dialog" class="bg-slate-950 text-slate-100 max-w-4xl lg:max-w-5xl w-full mx-auto p-4 sm:p-6 my-auto max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-800 relative text-xs">
      
      <!-- Header Modal OPINI NSR -->
      <div class="flex items-start justify-between pb-3 sm:pb-3.5 border-b border-slate-800/80 mb-3 sm:mb-4 shrink-0">
        <div class="min-w-0 pr-3 sm:pr-4">
          <div class="flex items-center gap-2 flex-wrap mb-1 sm:mb-1.5">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/30">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Lembaga Berizin KMK No. 2.19.0160
            </span>
            <span class="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9.5px] font-semibold tracking-wide bg-slate-800 text-slate-300 border border-slate-700">
              Akses Terpadu 5 Kantor
            </span>
          </div>
          <div class="flex items-baseline gap-2 flex-wrap">
            <h3 class="text-base sm:text-lg md:text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
              <span class="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">OPINI NSR</span>
            </h3>
            <span class="text-[11px] sm:text-xs font-semibold text-slate-300">
              (Otorisasi Penilaian, Informasi, &amp; Navigasi Internal KJPP NSR)
            </span>
          </div>
          <p class="text-[11px] sm:text-xs text-amber-400/90 font-medium tracking-tight mt-1">
            OPINI NSR &bull; Dari Data Lapangan Menjadi Opini yang Andal
          </p>
          <div id="banner-warning-portal" class="mt-2 flex items-center gap-1.5 text-[10.5px] text-amber-300/90 font-medium bg-amber-950/30 border border-amber-500/20 px-2.5 py-1 rounded-lg">
            <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Akses dibatasi untuk staf resmi &mdash; masukkan token otorisasi cabang atau pusat untuk membuka modul operasional.</span>
          </div>
        </div>
        <button onclick="tutupModalPortal()" class="text-slate-400 hover:text-white text-xl font-bold w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center cursor-pointer shrink-0 transition" aria-label="Tutup Modal">&times;</button>
      </div>

      <!-- FORMULIR MASUKKAN TOKEN AKSES -->
      <form onsubmit="verifikasiTokenPortal(event)" id="form-token-portal" class="space-y-4 pt-4 border-t border-slate-800/80 max-w-md mx-auto w-full my-auto py-6">
        <div>
          <label for="input-token" class="block text-xs font-bold leading-none text-slate-300 mb-2">Token Akses Kantor Cabang / Pejabat Pusat</label>
          <div class="relative">
            <input type="password" id="input-token" placeholder="Masukkan token otorisasi resmi..." required class="input-basic flex h-11 w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-3.5 pr-11 py-2 text-sm sm:text-base text-white font-mono font-bold placeholder:text-slate-500 placeholder:font-sans placeholder:font-normal shadow-inner transition-colors tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:border-amber-400/60 disabled:cursor-not-allowed disabled:opacity-50" autocomplete="current-password">
            <button type="button" id="btn-toggle-token" onclick="toggleTokenVisibility()" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white focus:outline-none cursor-pointer" aria-label="Tampilkan token" title="Tampilkan / sembunyikan token">
              <svg id="icon-eye-show" class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1 19.876 0"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg id="icon-eye-hide" class="w-5 h-5 hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>
                <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>
                <path d="M17.479 17.499A10.75 10.75 0 0 1 2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 5.275-5.275"/>
                <line x1="2" x2="22" y1="2" y2="22"/>
              </svg>
            </button>
          </div>
          <p id="pesan-error" class="text-xs text-rose-400 font-semibold mt-2 hidden flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/40 border border-rose-500/30">
            <svg class="w-3.5 h-3.5 text-rose-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            <span id="pesan-error-text">Token tidak terdaftar. Pastikan memasukkan token kantor cabang atau pusat yang valid.</span>
          </p>
        </div>
        <button type="submit" id="btn-submit-token" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-950/50 border border-blue-400/30 btn-tactile">
          <span id="btn-submit-text">Verifikasi Otorisasi Token OPINI</span> &rarr;
        </button>
      </form>

      <!-- MENU PORTAL OPERASIONAL OPINI NSR (GRID DARK EXECUTIVE GLASSMORPHISM) -->
      <div id="panel-layanan" class="hidden flex-1 flex flex-col min-h-0 overflow-hidden">
        <!-- Bar Status Verifikasi -->
        <div class="p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800 mb-3 flex items-center justify-between text-xs sm:text-sm shrink-0">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
            <p class="text-slate-200 font-semibold text-xs sm:text-sm truncate" id="label-lokasi">Token Terverifikasi</p>
          </div>
          <button type="button" onclick="resetTokenSesi()" class="text-[11px] font-semibold text-slate-400 hover:text-rose-400 underline cursor-pointer shrink-0 ml-2 transition">Ganti Token / Keluar</button>
        </div>

        <div id="container-kartu-layanan" class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 overflow-y-auto pr-1 custom-scrollbar-thin flex-1">
          
          <!-- KARTU 1: LINGKUP PENUGASAN & JOB ORDER (JO) -->
          <div class="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md">
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </span>
                <div class="min-w-0">
                  <h4 id="title-portal-penugasan" class="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">Lingkup Penugasan &amp; Job Order (JO)</h4>
                  <p id="sub-portal-penugasan" class="text-[11px] sm:text-xs text-slate-400 leading-normal line-clamp-1 mt-0.5">Sistem Otomasi SPK, Surat Representasi &amp; 7 Dokumen Bundel JO</p>
                </div>
              </div>
              <a id="link-portal-penugasan" href="portal-penugasan-jo.html" onclick="if (!dapatkanSesiTervalidasi()) { event.preventDefault(); bukaModalPortal('penugasan'); }" class="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition shrink-0 inline-flex items-center gap-1 shadow-sm">
                <span id="btn-text-portal-penugasan">Masuk Portal &nearr;</span>
              </a>
            </div>
            <div id="sublink-portal-penugasan" class="hidden mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10.5px] sm:text-[11px] opacity-75 hover:opacity-100 transition-opacity">
              <span class="text-indigo-300">🏛️ Layanan Kantor Pusat (Kewenangan Penandatanganan)</span>
              <a href="portal-penugasan-jo.html?mode=pusat" class="text-amber-400 font-bold hover:underline">[Akses ➔]</a>
            </div>
          </div>

          <!-- KARTU 2: PORTAL NOMOR LAPORAN (NOLAP) -->
          <div id="box-card-nolap" class="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md">
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-3 min-w-0">
                <span id="icon-box-nolap" class="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-sky-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                </span>
                <div class="min-w-0">
                  <h4 id="title-portal-nolap" class="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">Portal Nomor Laporan (NoLap)</h4>
                  <p id="sub-portal-nolap" class="text-[11px] sm:text-xs text-slate-400 leading-normal line-clamp-1 mt-0.5">Registrasi 7 Segmen Kemenkeu &amp; SPM Mitigasi</p>
                </div>
              </div>
              <a id="link-portal-nolap" href="portal-nolap.html" class="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition shrink-0 inline-flex items-center gap-1 shadow-sm">
                <span id="btn-text-portal-nolap">Masuk Portal &nearr;</span>
              </a>
            </div>
            <div id="sublink-portal-nolap" class="hidden mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10.5px] sm:text-[11px] opacity-75 hover:opacity-100 transition-opacity">
              <span class="text-sky-300">🏛️ Layanan Kantor Pusat (Kewenangan Penandatanganan)</span>
              <a href="portal-nolap.html" class="text-amber-400 font-bold hover:underline">[Buka Portal Pusat ➔]</a>
            </div>
          </div>

          <!-- KARTU 3: PORTAL KWITANSI & KEUANGAN -->
          <div class="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md">
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>
                </span>
                <div class="min-w-0">
                  <h4 id="title-portal-kwitansi" class="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">Portal Kwitansi &amp; Keuangan</h4>
                  <p id="sub-portal-kwitansi" class="text-[11px] sm:text-xs text-slate-400 leading-normal line-clamp-1 mt-0.5">Draf Tagihan Cabang &amp; Verifikasi Keuangan Pusat</p>
                </div>
              </div>
              <a id="link-portal-kwitansi" href="portal-kwitansi.html" class="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition shrink-0 inline-flex items-center gap-1 shadow-sm">
                <span id="btn-text-portal-kwitansi">Masuk Portal &nearr;</span>
              </a>
            </div>
            <div id="sublink-portal-kwitansi" class="hidden mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10.5px] sm:text-[11px] opacity-75 hover:opacity-100 transition-opacity">
              <span class="text-amber-300">🏛️ Rekonsiliasi &amp; Penagihan Kantor Pusat</span>
              <a href="portal-kwitansi.html?mode=pusat" class="text-amber-400 font-bold hover:underline">[Akses ➔]</a>
            </div>
          </div>

          <!-- KARTU 4: PORTAL BIAYA OPERASIONAL (e-OPERASIONAL) -->
          <div id="kartu-e-operasional" class="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md">
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg>
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <h4 id="title-portal-operasional" class="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">Portal Biaya Operasional</h4>
                    <span id="badge-portal-operasional" class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase shrink-0">MEJA APPROVAL 5 TIER</span>
                  </div>
                  <p id="sub-portal-operasional" class="text-[11px] sm:text-xs text-slate-400 leading-normal line-clamp-1 mt-0.5">Pengajuan Survey, Meeting &amp; Beban Umum Kantor</p>
                </div>
              </div>
              <a id="link-portal-operasional" href="portal-operasional.html" class="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition shrink-0 inline-flex items-center gap-1 shadow-sm">
                <span id="btn-text-portal-operasional">Masuk Portal &nearr;</span>
              </a>
            </div>
          </div>

          <!-- KARTU 5: BUKU AGENDA SURAT UMUM (SU - PUSAT ONLY) -->
          <div id="kartu-surat-umum" data-access="pusat-only" class="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md">
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-11 h-11 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <h4 class="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">Buku Agenda Surat Umum (SU)</h4>
                    <span class="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[9px] font-black uppercase shrink-0">Pusat</span>
                  </div>
                  <p class="text-[11px] sm:text-xs text-slate-400 leading-normal line-clamp-1 mt-0.5">Penomoran Surat Keluar Resmi &amp; Arsip Drive</p>
                </div>
              </div>
              <a id="link-portal-surat-umum" href="portal-surat-umum.html" class="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition shrink-0 inline-flex items-center gap-1 shadow-sm">
                <span>Masuk Portal &nearr;</span>
              </a>
            </div>
          </div>

          <!-- KARTU 6: FOLDER DOKUMEN & SOP CABANG -->
          <div id="kartu-sop-wrapper" class="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md">
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-11 h-11 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-violet-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                </span>
                <div class="min-w-0">
                  <h4 id="title-portal-sop" class="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">Folder Dokumen &amp; SOP Cabang</h4>
                  <p id="sub-portal-sop" class="text-[11px] sm:text-xs text-slate-400 leading-normal line-clamp-1 mt-0.5">Format Laporan, Template &amp; SOP Internal</p>
                </div>
              </div>
              <a id="link-portal-sop" href="javascript:void(0)" class="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition shrink-0 inline-flex items-center gap-1 shadow-sm">
                <span id="btn-text-portal-sop">Buka Dokumen &nearr;</span>
              </a>
            </div>
          </div>

          <!-- KARTU 7: PRESENSI KEHADIRAN ONLINE -->
          <div id="kartu-presensi-wrapper" class="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md">
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-teal-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>
                <div class="min-w-0">
                  <h4 class="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">Presensi Kehadiran Online</h4>
                  <p class="text-[11px] sm:text-xs text-slate-400 leading-normal line-clamp-1 mt-0.5">Presensi Kehadiran, Titik WFH &amp; Layanan Cuti</p>
                </div>
              </div>
              <a id="link-portal-absen" href="portal-presensi.html" class="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition shrink-0 inline-flex items-center gap-1 shadow-sm">
                <span>Buka Form &nearr;</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>

  <!-- ==================== MODAL PERMOHONAN AKSES DOKUMEN & SOP INTERNAL ==================== -->`;

if (oldModalRegex.test(html)) {
  html = html.replace(oldModalRegex, newModalHtml);
  console.log('✓ Replaced modal-portal structure with OPINI NSR Dark Executive Glassmorphism');
} else {
  console.error('❌ Could not match oldModalRegex');
  process.exit(1);
}

// 2. UPDATE updateDynamicSmartCards(auth) IN JAVASCRIPT
const oldUpdateCardsRegex = /function updateDynamicSmartCards\(auth\) \{[\s\S]*?window\.updateDynamicSmartCards = updateDynamicSmartCards;/;

const newUpdateCardsCode = `function updateDynamicSmartCards(auth) {
      const isCabang = auth && (auth.isCabang || auth.mode === 'CABANG');
      const rawWilayah = (auth && auth.wilayah) ? auth.wilayah : '';
      const wilayahCode = (auth && (auth.wilayahCode || auth.branchCode)) ? (auth.wilayahCode || auth.branchCode).toUpperCase() : '';
      const wilayahCity = rawWilayah.replace(/^Kantor\\s+Cabang\\s+/i, '').replace(/^Kantor\\s+/i, '') || 'Cabang';

      // Sembunyikan banner peringatan jika token sudah valid
      const bannerWarning = document.getElementById('banner-warning-portal');
      if (bannerWarning) {
        if (auth) {
          bannerWarning.classList.add('hidden');
        } else {
          bannerWarning.classList.remove('hidden');
        }
      }

      // Elemen Kartu 1: Lingkup Penugasan & JO
      const titleJO = document.getElementById('title-portal-penugasan');
      const subJO = document.getElementById('sub-portal-penugasan');
      const btnJO = document.getElementById('btn-text-portal-penugasan');
      const linkJO = document.getElementById('link-portal-penugasan');
      const sublinkJO = document.getElementById('sublink-portal-penugasan');

      // Elemen Kartu 2: NoLap
      const titleNoLap = document.getElementById('title-portal-nolap');
      const subNoLap = document.getElementById('sub-portal-nolap');
      const btnNoLap = document.getElementById('btn-text-portal-nolap');
      const linkNoLap = document.getElementById('link-portal-nolap');
      const sublinkNoLap = document.getElementById('sublink-portal-nolap');

      // Elemen Kartu 3: Kwitansi
      const titleKw = document.getElementById('title-portal-kwitansi');
      const subKw = document.getElementById('sub-portal-kwitansi');
      const btnKw = document.getElementById('btn-text-portal-kwitansi');
      const linkKw = document.getElementById('link-portal-kwitansi');
      const sublinkKw = document.getElementById('sublink-portal-kwitansi');

      // Elemen Kartu 4: Biaya Operasional (Baru - e-Operasional)
      const kartuEOpr = document.getElementById('kartu-e-operasional');
      const titleEOpr = document.getElementById('title-portal-operasional');
      const subEOpr = document.getElementById('sub-portal-operasional');
      const badgeEOpr = document.getElementById('badge-portal-operasional');
      const linkEOpr = document.getElementById('link-portal-operasional');

      // Elemen Kartu 5: SOP
      const titleSOP = document.getElementById('title-portal-sop');
      const subSOP = document.getElementById('sub-portal-sop');
      const btnSOP = document.getElementById('btn-text-portal-sop');
      const linkSOP = document.getElementById('link-portal-sop');

      // Elemen Kartu 6: Presensi
      const kartuPresensiWrapper = document.getElementById('kartu-presensi-wrapper');
      const linkAbsen = document.getElementById('link-portal-absen');

      if (linkAbsen) {
        linkAbsen.href = 'portal-presensi.html';
        linkAbsen.onclick = null;
      }

      if (isCabang) {
        // ============================================
        // MODE KANTOR CABANG (PLB, PDG, MKS, BDG)
        // ============================================

        // 1. JO Cabang
        if (titleJO) titleJO.textContent = \`Lingkup Penugasan & Job Order (JO) Cabang \${wilayahCity}\`;
        if (subJO) subJO.textContent = 'Sistem Otomasi SPK Cabang, Surat Tugas & Rekapitulasi Kontrak';
        if (btnJO) btnJO.innerHTML = 'Masuk JO Cabang &nearr;';
        if (linkJO) linkJO.href = 'portal-penugasan-jo.html?mode=mandiri';
        if (sublinkJO) {
          sublinkJO.classList.remove('hidden');
          const sublinkA = sublinkJO.querySelector('a');
          if (sublinkA) sublinkA.href = 'portal-penugasan-jo.html?mode=pusat';
        }

        // 2. NoLap Cabang
        if (titleNoLap) titleNoLap.textContent = \`Portal NoLap Mandiri Cabang \${wilayahCity}\`;
        if (subNoLap) subNoLap.textContent = 'Penerbitan Laporan Definitif & Registrasi Draf Kewenangan Cabang';
        if (btnNoLap) btnNoLap.innerHTML = '⚡ Masuk Portal Cabang &nearr;';
        if (linkNoLap) linkNoLap.href = 'portal-nolap-cabang.html';
        if (sublinkNoLap) sublinkNoLap.classList.remove('hidden');

        // 3. Kwitansi Cabang
        if (titleKw) titleKw.textContent = \`Portal Kwitansi & Keuangan Cabang \${wilayahCity}\`;
        if (subKw) subKw.textContent = 'Penerbitan Invoice DP, Kwitansi Resmi & Rekening Kas Cabang';
        if (btnKw) btnKw.innerHTML = 'Masuk Kwitansi Cabang &nearr;';
        if (linkKw) linkKw.href = 'portal-kwitansi.html?mode=mandiri';
        if (sublinkKw) {
          sublinkKw.classList.remove('hidden');
          const sublinkA = sublinkKw.querySelector('a');
          if (sublinkA) sublinkA.href = 'portal-kwitansi.html?mode=pusat';
        }

        // 4. Biaya Operasional (Aktif untuk Cabang dengan badge FORM PENGAJUAN)
        if (kartuEOpr) kartuEOpr.style.display = 'flex';
        if (titleEOpr) titleEOpr.textContent = \`Portal Biaya Operasional Cabang \${wilayahCity}\`;
        if (subEOpr) subEOpr.textContent = \`Pengajuan Survey, Meeting & Beban Operasional Cabang \${wilayahCity}\`;
        if (badgeEOpr) {
          badgeEOpr.textContent = 'FORM PENGAJUAN';
          badgeEOpr.className = 'px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase shrink-0';
        }
        if (linkEOpr) {
          linkEOpr.href = wilayahCode ? \`portal-operasional.html?branch=\${encodeURIComponent(wilayahCode)}\` : 'portal-operasional.html';
        }

        // 5. Penegakan Filter RBAC: Sembunyikan mutlak elemen data-access="pusat-only" (Surat Umum)
        document.querySelectorAll('[data-access="pusat-only"]').forEach(el => {
          el.style.display = 'none';
        });

        // 6. SOP Cabang
        if (titleSOP) titleSOP.textContent = \`Folder Dokumen & SOP Cabang \${wilayahCity}\`;
        if (subSOP) subSOP.textContent = 'Format Laporan, Template & SOP Terkendali Pusat';
        if (btnSOP) btnSOP.innerHTML = '🔒 Minta Akses &nearr;';
        if (linkSOP) {
          linkSOP.href = 'javascript:void(0)';
          linkSOP.removeAttribute('target');
          linkSOP.onclick = (e) => {
            e.preventDefault();
            bukaModalRequestDokumenSOP();
          };
        }

        // Kartu presensi normal (grid 6 kartu simetris 2 kolom = 3 baris)
        if (kartuPresensiWrapper) kartuPresensiWrapper.classList.remove('md:col-span-2');

      } else {
        // ============================================
        // MODE KANTOR PUSAT / SUPER ADMIN / DEFAULT
        // ============================================

        // 1. JO Pusat
        if (titleJO) titleJO.textContent = 'Lingkup Penugasan & Job Order (JO)';
        if (subJO) subJO.textContent = 'Sistem Otomasi SPK, Surat Representasi & 7 Dokumen Bundel JO';
        if (btnJO) btnJO.innerHTML = 'Masuk Portal &nearr;';
        if (linkJO) linkJO.href = 'portal-penugasan-jo.html';
        if (sublinkJO) sublinkJO.classList.add('hidden');

        // 2. NoLap Pusat
        if (titleNoLap) titleNoLap.textContent = 'Portal Nomor Laporan (NoLap)';
        if (subNoLap) subNoLap.textContent = 'Registrasi 7 Segmen Kemenkeu & SPM Mitigasi';
        if (btnNoLap) btnNoLap.innerHTML = 'Masuk Portal &nearr;';
        if (linkNoLap) linkNoLap.href = 'portal-nolap.html';
        if (sublinkNoLap) sublinkNoLap.classList.add('hidden');

        // 3. Kwitansi Pusat
        if (titleKw) titleKw.textContent = 'Portal Kwitansi & Keuangan';
        if (subKw) subKw.textContent = 'Draf Tagihan Cabang & Verifikasi Keuangan Pusat';
        if (btnKw) btnKw.innerHTML = 'Masuk Portal &nearr;';
        if (linkKw) linkKw.href = 'portal-kwitansi.html';
        if (sublinkKw) sublinkKw.classList.add('hidden');

        // 4. Biaya Operasional (Pusat: MEJA APPROVAL 5 TIER)
        if (kartuEOpr) kartuEOpr.style.display = 'flex';
        if (titleEOpr) titleEOpr.textContent = 'Portal Biaya Operasional';
        if (subEOpr) subEOpr.textContent = 'Pengajuan Survey, Meeting & Beban Umum Kantor';
        if (badgeEOpr) {
          badgeEOpr.textContent = 'MEJA APPROVAL 5 TIER';
          badgeEOpr.className = 'px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase shrink-0';
        }
        if (linkEOpr) linkEOpr.href = 'portal-operasional.html';

        // 5. Tampilkan seluruh kartu ber-attribute data-access="pusat-only" secara lengkap
        document.querySelectorAll('[data-access="pusat-only"]').forEach(el => {
          el.style.display = 'flex';
        });

        // 6. SOP Pusat
        if (titleSOP) titleSOP.textContent = 'Folder Dokumen & SOP Cabang';
        if (subSOP) subSOP.textContent = 'Format Laporan, Template & SOP Internal';
        if (btnSOP) btnSOP.innerHTML = 'Buka Drive &nearr;';
        if (linkSOP) {
          linkSOP.href = 'javascript:void(0)';
          linkSOP.removeAttribute('target');
          linkSOP.onclick = (e) => {
            if (e) e.preventDefault();
            bukaAksesSopDrive(e);
          };
        }

        // 7. Presensi membentang 2 kolom penuh agar 7 kartu tersusun simetris
        if (kartuPresensiWrapper) kartuPresensiWrapper.classList.add('md:col-span-2');
      }

      // Pastikan kartu penugasan melewati gerbang login jika belum ada sesi valid
      if (linkJO) {
        if (!auth) {
          linkJO.onclick = function(e) {
            e.preventDefault();
            bukaModalPortal('penugasan');
          };
        } else {
          linkJO.onclick = null;
        }
      }
    }
    window.updateDynamicSmartCards = updateDynamicSmartCards;`;

if (oldUpdateCardsRegex.test(html)) {
  html = html.replace(oldUpdateCardsRegex, newUpdateCardsCode);
  console.log('✓ Replaced updateDynamicSmartCards with dynamic RBAC & 7-card styling');
} else {
  console.error('❌ Could not match oldUpdateCardsRegex');
  process.exit(1);
}

// 3. UPDATE DIRECT ROUTING FOR OPERASIONAL IN bukaModalPortal & verifikasiTokenPortal
// In bukaModalPortal:
const oldOperasionalRouteRegex = /if \(targetPortal === 'operasional'\) \{[\s\S]*?window\.location\.href = 'portal-operasional\.html';\s*return;\s*\}/;
const newOperasionalRouteCode = `if (targetPortal === 'operasional') {
                const bCode = (sess.wilayahCode || sess.branchCode || '').toUpperCase();
                window.location.href = (sess.isCabang || sess.mode === 'CABANG') && bCode
                  ? \`portal-operasional.html?branch=\${encodeURIComponent(bCode)}\`
                  : 'portal-operasional.html';
                return;
              }`;

if (oldOperasionalRouteRegex.test(html)) {
  html = html.replace(oldOperasionalRouteRegex, newOperasionalRouteCode);
  console.log('✓ Updated targetPortal === operasional in bukaModalPortal');
} else {
  console.error('❌ Could not match oldOperasionalRouteRegex');
}

// In verifikasiTokenPortal:
const oldVerifOperasionalRouteRegex = /if \(window\._targetPortal === 'operasional'\) \{[\s\S]*?window\.location\.href = 'portal-operasional\.html';\s*return;\s*\}/;
const newVerifOperasionalRouteCode = `if (window._targetPortal === 'operasional') {
        const bCode = (auth.wilayahCode || auth.branchCode || '').toUpperCase();
        window.location.href = (auth.isCabang || auth.mode === 'CABANG') && bCode
          ? \`portal-operasional.html?branch=\${encodeURIComponent(bCode)}\`
          : 'portal-operasional.html';
        return;
      }`;

if (oldVerifOperasionalRouteRegex.test(html)) {
  html = html.replace(oldVerifOperasionalRouteRegex, newVerifOperasionalRouteCode);
  console.log('✓ Updated window._targetPortal === operasional in verifikasiTokenPortal');
} else {
  console.error('❌ Could not match oldVerifOperasionalRouteRegex');
}

// 4. UPDATE TOPBAR & NAVBAR BUTTON TEXT (OPINI NSR)
html = html.replace(
  '<span class="tracking-wide">Portal Internal</span>',
  '<span class="tracking-wide">OPINI NSR</span>'
);

html = html.replace(
  '<span class="tracking-wide">Portal Internal &amp; SOP Cabang</span>',
  '<span class="tracking-wide">OPINI NSR &bull; Portal Internal</span>'
);

html = html.replace(
  '<span>Masuk Portal Internal &rarr;</span>',
  '<span>Masuk OPINI NSR (Portal Internal) &rarr;</span>'
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('=== OPINI NSR REBRANDING APPLIED SUCCESSFULLY! ===');
