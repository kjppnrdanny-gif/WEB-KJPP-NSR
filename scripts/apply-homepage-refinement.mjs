import fs from 'node:fs';

const filePath = 'index.html';
let rawContent = fs.readFileSync(filePath, 'utf8');
const isCrlf = rawContent.includes('\r\n');
let content = rawContent.replace(/\r\n/g, '\n');

console.log('Applying P1 Professional Homepage Refinement to index.html...');

// =========================================================================
// 1. HERO SECTION REFINEMENT
// =========================================================================
const lines = content.split('\n');

const startIdx = lines.findIndex(l => l.includes('<!-- Badge Kredensial Resmi Mengambang -->'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('<!-- Kotak Kredensial Resmi di Kanan Hero -->'));

if (startIdx !== -1 && endIdx !== -1) {
  const newHeroLines = [
    '        <!-- Badge Kredensial Resmi Mengambang -->',
    '        <div class="inline-flex items-center gap-2 py-1 px-3 mb-3.5 rounded-full border border-sky-400/30 bg-slate-900/90 backdrop-blur-md shadow-sm shadow-sky-500/10 text-xs">',
    '          <span class="relative flex h-2 w-2">',
    '            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>',
    '            <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>',
    '          </span>',
    '          <span class="font-bold tracking-wide text-sky-200 text-[11px] sm:text-xs uppercase">Kantor Jasa Penilai Publik (KJPP) &bull; KMK No. 2.19.0160</span>',
    '        </div>',
    '',
    '        <span class="block text-xs sm:text-sm font-extrabold tracking-wider mb-2 text-amber-400 uppercase">',
    '          KJPP Nanang Rahayu Sigit Paryanto dan Rekan',
    '        </span>',
    '',
    '        <h1 class="text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] leading-[1.18] font-black mb-3.5 text-white tracking-tight">',
    '          Kantor Jasa Penilai Publik Terpercaya &bull; <span class="bg-gradient-to-r from-sky-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">Opini Nilai Independen &amp; Akuntabel</span>',
    '        </h1>',
    '',
    '        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 max-w-xl font-normal">',
    '          Mitra strategis perbankan, BUMN, dan korporasi nasional dalam penilaian properti komersial, studi kelayakan usaha, agunan kredit, dan pengadaan tanah proyek strategis (SPI 204). Didukung 5 Rekan Penilai Publik berizin Kemenkeu RI, terdaftar di OJK, serta berlisensi Kementerian ATR/BPN di 5 kantor wilayah operasional.',
    '        </p>',
    '',
    '        <!-- Tombol Aksi Utama Hero -->',
    '        <div class="flex flex-wrap items-center gap-2.5 sm:gap-3.5 pt-1">',
    '          <button onclick="bukaModal(\'modal-rfp\')" class="px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-extrabold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-2">',
    '            <span>Minta Proposal &amp; Penawaran</span>',
    '            <svg class="w-4 h-4 text-slate-950 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>',
    '          </button>',
    '          <a href="Company%20Profile%20KJPP%20NSR%202026_S.pdf" download="Company Profile KJPP NSR 2026_S.pdf" class="group relative inline-flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl border border-slate-700 bg-slate-900/90 text-slate-200 hover:border-sky-400 hover:text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-sm cursor-pointer" title="Download Official Company Profile KJPP NSR (PDF)">',
    '            <svg class="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">',
    '              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
    '              <polyline points="7 10 12 15 17 10"/>',
    '              <line x1="12" x1="12" y1="15" y2="3"/>',
    '            </svg>',
    '            <span>Unduh Company Profile</span>',
    '          </a>',
    '          <a href="/portofolio-rekanan.html" id="hero-btn-portofolio" class="group inline-flex items-center gap-1.5 px-3 py-2.5 text-slate-300 hover:text-sky-300 font-semibold text-xs sm:text-sm transition" title="Buka Portofolio dan Rekanan KJPP NSR">',
    '            <span>Lihat Portofolio</span>',
    '            <span class="text-sky-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>',
    '          </a>',
    '        </div>',
    '',
    '      </div>',
    ''
  ];

  lines.splice(startIdx, endIdx - startIdx, ...newHeroLines);
  content = lines.join('\n');
  console.log('✓ 1. Hero Section refined cleanly via line replacement.');
} else {
  console.error('❌ Could not find Hero boundary markers');
}

// =========================================================================
// 2. HERO BOTTOM REKANAN BAR REFINEMENT
// =========================================================================
const oldHeroBar = `    <!-- Bar Kemitraan Bawah Hero -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pt-3 sm:mt-5 sm:pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/60">
      <div class="flex items-center gap-3 text-xs text-slate-400">
        <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
        <span>Terdaftar <strong>Mitra Perbankan &amp; Klien Institusi</strong>: Bank BUMN, Bank Swasta, Bank Pembangunan Daerah, BUMN Karya &amp; Korporasi Terbuka.</span>
      </div>
      <div class="flex items-center gap-3">
        <a href="#rekanan" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-white border border-slate-700/80 font-bold text-xs shadow-sm transition group">
          <span>Lihat Mitra &amp; Klien Utama</span>
          <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </a>
      </div>
    </div>`;

const newHeroBar = `    <!-- Bar Kemitraan Bawah Hero -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pt-3 sm:mt-5 sm:pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/60">
      <div class="flex items-center gap-2.5 text-xs text-slate-400">
        <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
        <span>Rekanan Terdaftar: <strong>Bank BUMN, Bank Swasta, BPD, BUMN Karya &amp; Korporasi Terbuka</strong>.</span>
      </div>
      <div class="flex items-center gap-3">
        <a href="#rekanan" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-white border border-slate-700/80 font-bold text-xs shadow-sm transition group">
          <span>Lihat 40+ Rekanan &amp; Klien</span>
          <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </a>
      </div>
    </div>`;

if (content.includes(oldHeroBar)) {
  content = content.replace(oldHeroBar, newHeroBar);
  console.log('✓ 2. Hero Bottom Bar refined.');
}

// =========================================================================
// 3. EKOSISTEM UTAMA TABS HEADER & LABELS REFINEMENT
// =========================================================================
const oldEkosistemHeader = `    <!-- TAB NAVIGATION CONTROLLER (Sticky/Prominent Header Bar) -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-6 sm:mb-8">
      <div class="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-sky-300 text-[11px] font-bold uppercase tracking-wider mb-2">
          EKSPLORASI EKOSISTEM UTAMA &bull; 4 TAB INTERAKTIF
        </span>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-center max-w-3xl mx-auto text-white">
          Tata Kelola Mutu, Layanan, Portofolio &amp; Kantor Cabang
        </h2>
        <p class="text-xs sm:text-sm text-slate-400 text-center max-w-2xl mx-auto mt-2.5 mb-6 sm:mb-8">
          Pilih tab di bawah untuk melihat rincian di tempat yang sama tanpa perlu scroll panjang:
        </p>
      </div>`;

const newEkosistemHeader = `    <!-- TAB NAVIGATION CONTROLLER (Sticky/Prominent Header Bar) -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-6 sm:mb-8">
      <div class="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-sky-300 text-[11px] font-bold uppercase tracking-wider mb-2">
          EKSPLORASI EKOSISTEM UTAMA &bull; 4 KATEGORI UTAMA
        </span>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-center max-w-3xl mx-auto text-white">
          Tata Kelola Mutu, Layanan, Dokumentasi &amp; Jaringan Kantor
        </h2>
        <p class="text-xs sm:text-sm text-slate-300 text-center max-w-2xl mx-auto mt-2.5 mb-6 sm:mb-8 leading-relaxed">
          Pilih kategori di bawah untuk meninjau tata kelola mutu penugasan, ruang lingkup penilaian, dokumentasi rekam jejak, dan jaringan 5 kantor operasional:
        </p>
      </div>`;

if (content.includes(oldEkosistemHeader)) {
  content = content.replace(oldEkosistemHeader, newEkosistemHeader);
  console.log('✓ 3. Ekosistem Header refined.');
}

// =========================================================================
// 4. TAB 1 CONTROL BAR TOGGLE EXTRA MUTU BUTTON
// =========================================================================
const oldMutuControlBar = `            <!-- Compact Control Bar & Actions -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-800/80">
              <div class="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Satu Pintu Registrasi NoLap &bull; Koordinasi Mutu 5 Wilayah</span>
              </div>
              <button type="button" onclick="bukaModalPortal()" class="min-h-[40px] sm:min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs transition shadow-md cursor-pointer">
                <svg class="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>Masuk Portal Internal →</span>
              </button>
            </div>`;

const newMutuControlBar = `            <!-- Compact Control Bar & Actions -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-800/80">
              <button type="button" onclick="toggleExtraMutu()" id="btn-toggle-extra-mutu" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sky-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer">
                <span id="txt-toggle-extra-mutu">Lihat 4 Level SPM &amp; Rincian Mutu</span>
                <span id="icon-toggle-extra-mutu" class="text-sky-400 font-bold">&darr;</span>
              </button>
              <button type="button" onclick="bukaModalPortal()" class="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs transition shadow-md cursor-pointer">
                <svg class="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>Masuk Portal Internal &rarr;</span>
              </button>
            </div>`;

if (content.includes(oldMutuControlBar)) {
  content = content.replace(oldMutuControlBar, newMutuControlBar);
  console.log('✓ 4. Tab Mutu Control Bar updated with clean collapsible toggle.');
}

if (isCrlf) {
  content = content.replace(/\n/g, '\r\n');
}
fs.writeFileSync(filePath, content, 'utf8');
console.log('🎉 Refinements written to index.html successfully.');
