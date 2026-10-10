import fs from 'node:fs';

let content = fs.readFileSync('index.html', 'utf8');

// =========================================================================
// 1. OPTIMIZE HERO KREDENSIAL BOX (#profil)
// =========================================================================
const heroBoxMarker = '<!-- Kotak Kredensial Resmi di Kanan Hero -->';
const heroBoxStart = content.indexOf(heroBoxMarker);
const barKemitraanMarker = '<!-- Bar Kemitraan Bawah Hero -->';
const barKemitraanStart = content.indexOf(barKemitraanMarker);

const oldHeroRightBox = content.substring(heroBoxStart, barKemitraanStart);

const newHeroRightBox = `<!-- Kotak Kredensial Resmi di Kanan Hero -->
      <div class="lg:col-span-5">
        <div class="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 sm:p-7 shadow-2xl overflow-hidden relative">
          <div class="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-amber-400 block">Kredensial &amp; Legalitas Resmi</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-extrabold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Registrasi Aktif
              </span>
              <button type="button" onclick="const box = document.getElementById('kredensial-items-box'); box.classList.toggle('hidden'); this.textContent = box.classList.contains('hidden') ? 'Rincian ↓' : 'Tutup ↑';" class="sm:hidden text-sky-400 text-xs font-bold px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
                Rincian &darr;
              </button>
            </div>
          </div>

          <!-- Items list: hidden on mobile by default, always visible on sm/desktop -->
          <div id="kredensial-items-box" class="hidden sm:block mt-4 space-y-2.5">
            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                <svg class="w-3.5 h-3.5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
              <div class="min-w-0">
                <p class="font-bold text-white text-xs sm:text-sm">Kementerian Keuangan RI</p>
                <p class="text-slate-400 text-[11px] leading-tight">Izin Usaha KJPP No. 2.19.0160 (KMK No. 248/KM.1/2019)</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                <svg class="w-3.5 h-3.5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
              <div class="min-w-0">
                <p class="font-bold text-white text-xs sm:text-sm">Otoritas Jasa Keuangan (OJK)</p>
                <p class="text-slate-400 text-[11px] leading-tight">STTD OJK Pasar Modal &amp; Industri Keuangan Non-Bank</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                <svg class="w-3.5 h-3.5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
              <div class="min-w-0">
                <p class="font-bold text-white text-xs sm:text-sm">Kementerian ATR / BPN</p>
                <p class="text-slate-400 text-[11px] leading-tight">Lisensi Penilai Pertanahan Pengadaan Tanah Kepentingan Umum</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                <svg class="w-3.5 h-3.5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
              <div class="min-w-0">
                <p class="font-bold text-white text-xs sm:text-sm">Legalitas Terpadu &amp; Asosiasi</p>
                <p class="text-slate-400 text-[11px] leading-tight">NIB: 9120403581857 &bull; MAPPI &bull; Wilayah Kerja Seluruh NKRI</p>
              </div>
            </div>
          </div>

          <!-- Mobile Compact Summary -->
          <div class="sm:hidden mt-2.5 text-[11px] text-slate-300">
            <p class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Kemenkeu No. 2.19.0160 &bull; OJK &bull; BPN &bull; MAPPI</p>
          </div>

          <div class="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Standar Profesi:</span>
            <span class="font-semibold text-amber-300">SPI &amp; KEPI</span>
          </div>

        </div>
      </div>

    </div>

    `;

content = content.substring(0, heroBoxStart) + newHeroRightBox + content.substring(barKemitraanStart);
console.log('1. Hero Kredensial Box optimized for mobile!');

// =========================================================================
// 2. OPTIMIZE REKANAN & STATISTIK PADA HP (#rekanan)
// =========================================================================
const rekananStart = content.lastIndexOf('<section', content.indexOf('id="rekanan"'));
const sMutuStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));

const newRekananHtml = `<section id="rekanan" aria-label="Kredibilitas Mitra Perbankan &amp; Klien Utama" class="w-full bg-slate-950 text-white border-y border-slate-800/80 py-6 sm:py-12 scroll-mt-20">
    <div id="trusted-by" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="text-center max-w-3xl mx-auto mb-5 sm:mb-8">
        <span class="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-900/40 border border-blue-700/50 text-sky-300 text-[11px] font-semibold mb-1.5">
          KREDIBILITAS INSTITUSI &bull; MITRA PERBANKAN &amp; BUMN
        </span>
        <h2 class="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
          Dipercaya Lembaga Keuangan, BUMN &amp; Instansi Pemerintah
        </h2>
        <p class="hidden sm:block text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          Dipercaya oleh institusi perbankan nasional terdaftar OJK, kementerian negara, dan BUMN strategis untuk opini penilaian aset independen berstandar SPI dan KEPI.
        </p>
      </div>

      <!-- DESKTOP GRID: 12 LOGO (hidden on mobile) -->
      <div class="hidden md:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 items-center">
        <!-- 1. BANK BRI -->
        <div class="h-20 sm:h-24 flex items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-sm group">
          <div class="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[130px] sm:w-[145px] h-11 sm:h-13">
            <img decoding="async" src="images/logos/bri.svg" alt="Bank BRI" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-300">
          </div>
        </div>
        <!-- 2. BANK BCA -->
        <div class="h-20 sm:h-24 flex items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-sm group">
          <div class="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[130px] sm:w-[145px] h-11 sm:h-13">
            <img decoding="async" src="images/logos/bca.svg" alt="Bank BCA" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-300">
          </div>
        </div>
        <!-- 3. BANK DKI -->
        <div class="h-20 sm:h-24 flex items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-sm group">
          <div class="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[130px] sm:w-[145px] h-11 sm:h-13">
            <img decoding="async" src="images/logos/bank-dki.svg" alt="Bank DKI" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-300">
          </div>
        </div>
        <!-- 4. BANK BTN -->
        <div class="h-20 sm:h-24 flex items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-sm group">
          <div class="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[130px] sm:w-[145px] h-11 sm:h-13">
            <img decoding="async" src="images/logos/btn.svg" alt="Bank BTN" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-300">
          </div>
        </div>
        <!-- 5. BANK KASIKORN -->
        <div class="h-20 sm:h-24 flex items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-sm group">
          <div class="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[130px] sm:w-[145px] h-11 sm:h-13">
            <img decoding="async" src="images/logos/kasikornbank.png" alt="Kasikornbank" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-300">
          </div>
        </div>
        <!-- 6. BANK BJB -->
        <div class="h-20 sm:h-24 flex items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-sm group">
          <div class="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[130px] sm:w-[145px] h-11 sm:h-13">
            <img decoding="async" src="images/logos/bjb.svg" alt="Bank BJB" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-300">
          </div>
        </div>
        <!-- 7. PT PLN -->
        <div class="h-20 sm:h-24 flex items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-sm group">
          <div class="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[130px] sm:w-[145px] h-11 sm:h-13">
            <img decoding="async" src="images/logos/pln.svg" alt="PT PLN (Persero)" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-300">
          </div>
        </div>
        <!-- 8. PT PERTAMINA -->
        <div class="h-20 sm:h-24 flex items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-sm group">
          <div class="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[130px] sm:w-[145px] h-11 sm:h-13">
            <img decoding="async" src="images/logos/pertamina.svg" alt="PT Pertamina (Persero)" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-300">
          </div>
        </div>
        <!-- 9. KEMENTERIAN PUPR -->
        <div class="h-20 sm:h-24 flex items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-sm group">
          <div class="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[130px] sm:w-[145px] h-11 sm:h-13">
            <img decoding="async" src="images/logos/kemen-pupr.svg" alt="Kementerian PUPR" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-300">
          </div>
        </div>
        <!-- 10. KEMENTERIAN ATR/BPN -->
        <div class="h-20 sm:h-24 flex items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-sm group">
          <div class="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[130px] sm:w-[145px] h-11 sm:h-13">
            <img decoding="async" src="images/logos/atr-bpn.png" alt="Kementerian ATR/BPN" class="h-9 sm:h-11 w-auto object-contain filter group-hover:brightness-105 transition-all duration-300">
          </div>
        </div>
        <!-- 11. PT SEMEN INDONESIA -->
        <div class="h-20 sm:h-24 flex items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-sm group">
          <div class="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[130px] sm:w-[145px] h-11 sm:h-13">
            <img decoding="async" src="images/logos/sig.svg" alt="PT Semen Indonesia (SIG)" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-300">
          </div>
        </div>
        <!-- 12. PT BIO FARMA -->
        <div class="h-20 sm:h-24 flex items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-sm group">
          <div class="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[130px] sm:w-[145px] h-11 sm:h-13">
            <img decoding="async" src="images/logos/bio-farma.svg" alt="PT Bio Farma (Persero)" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-300">
          </div>
        </div>
      </div>

      <!-- MOBILE HORIZONTAL SCROLL TICKER: Ramping & Tidak Menumpuk (md:hidden) -->
      <div class="md:hidden overflow-x-auto pb-2 flex items-center gap-2.5 no-scrollbar" style="scroll-snap-type: x mandatory;">
        <div class="shrink-0 w-24 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center shadow" style="scroll-snap-align: start;">
          <img decoding="async" src="images/logos/bri.svg" alt="BRI" class="max-h-full max-w-full object-contain">
        </div>
        <div class="shrink-0 w-24 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center shadow" style="scroll-snap-align: start;">
          <img decoding="async" src="images/logos/bca.svg" alt="BCA" class="max-h-full max-w-full object-contain">
        </div>
        <div class="shrink-0 w-24 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center shadow" style="scroll-snap-align: start;">
          <img decoding="async" src="images/logos/bank-dki.svg" alt="Bank DKI" class="max-h-full max-w-full object-contain">
        </div>
        <div class="shrink-0 w-24 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center shadow" style="scroll-snap-align: start;">
          <img decoding="async" src="images/logos/btn.svg" alt="BTN" class="max-h-full max-w-full object-contain">
        </div>
        <div class="shrink-0 w-24 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center shadow" style="scroll-snap-align: start;">
          <img decoding="async" src="images/logos/kasikornbank.png" alt="Kasikorn" class="max-h-full max-w-full object-contain">
        </div>
        <div class="shrink-0 w-24 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center shadow" style="scroll-snap-align: start;">
          <img decoding="async" src="images/logos/bjb.svg" alt="BJB" class="max-h-full max-w-full object-contain">
        </div>
        <div class="shrink-0 w-24 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center shadow" style="scroll-snap-align: start;">
          <img decoding="async" src="images/logos/pln.svg" alt="PLN" class="max-h-full max-w-full object-contain">
        </div>
        <div class="shrink-0 w-24 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center shadow" style="scroll-snap-align: start;">
          <img decoding="async" src="images/logos/pertamina.svg" alt="Pertamina" class="max-h-full max-w-full object-contain">
        </div>
        <div class="shrink-0 w-24 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center shadow" style="scroll-snap-align: start;">
          <img decoding="async" src="images/logos/kemen-pupr.svg" alt="PUPR" class="max-h-full max-w-full object-contain">
        </div>
        <div class="shrink-0 w-24 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center shadow" style="scroll-snap-align: start;">
          <img decoding="async" src="images/logos/atr-bpn.png" alt="ATR BPN" class="max-h-full max-w-full object-contain">
        </div>
      </div>

      <!-- Bottom Bar & Navigation to Full Directory -->
      <div class="mt-4 sm:mt-8 pt-3 sm:pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-center sm:text-left">
        <div class="text-[11px] sm:text-xs text-slate-400">
          <span class="font-bold text-slate-200">Terdaftar di 40+ Mitra Perbankan &amp; Klien Institusi</span> terkemuka di Indonesia.
        </div>
        <a href="portofolio-rekanan.html" class="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition group">
          <span>Lihat Direktori 40+ Mitra</span> &rarr;
        </a>
      </div>
    </div>
  </section>

  <!-- ==================== 5. STATISTIK KUNCI (MASTER DATA STATISTIK) ==================== -->
  <section class="bg-slate-950 text-white py-6 md:py-10 border-b border-slate-800/80 relative z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- DESKTOP STATS (hidden on mobile) -->
      <div class="hidden md:grid grid-cols-5 gap-4 text-center">
        <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-400/40 transition shadow-sm">
          <div class="text-3xl lg:text-4xl font-black text-amber-400 stat-number count-up-text" data-to="35" data-from="0" data-suffix="+" data-duration="2.2">35+</div>
          <p class="text-xs text-slate-300 mt-1 uppercase tracking-wider font-bold">Tahun Jam Terbang</p>
        </div>
        <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-400/40 transition shadow-sm">
          <div class="text-3xl lg:text-4xl font-black text-amber-400 stat-number count-up-text" data-to="5" data-from="0" data-duration="1.8">5</div>
          <p class="text-xs text-slate-300 mt-1 uppercase tracking-wider font-bold">Penilai Publik Berizin</p>
        </div>
        <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-400/40 transition shadow-sm">
          <div class="text-3xl lg:text-4xl font-black text-amber-400 stat-number count-up-text" data-to="5" data-from="0" data-duration="1.8">5</div>
          <p class="text-xs text-slate-300 mt-1 uppercase tracking-wider font-bold">Kantor Wilayah</p>
        </div>
        <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-400/40 transition shadow-sm">
          <div class="text-3xl lg:text-4xl font-black text-amber-400 stat-number count-up-text" data-to="40" data-from="0" data-suffix="+" data-duration="2.0">40+</div>
          <p class="text-xs text-slate-300 mt-1 uppercase tracking-wider font-bold">Mitra Bank &amp; BUMN</p>
        </div>
        <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-400/40 transition shadow-sm">
          <div class="text-3xl lg:text-4xl font-black text-amber-400 stat-number count-up-text" data-to="15" data-from="0" data-suffix="+" data-duration="1.8">15+</div>
          <p class="text-xs text-slate-300 mt-1 uppercase tracking-wider font-bold">Ruas Tol &amp; PSN</p>
        </div>
      </div>

      <!-- MOBILE STATS: Ramping & Kompak (md:hidden) -->
      <div class="md:hidden grid grid-cols-3 gap-2 text-center">
        <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div class="text-xl font-black text-amber-400 stat-number count-up-text" data-to="35" data-from="0" data-suffix="+">35+</div>
          <p class="text-[9px] text-slate-300 font-bold uppercase mt-0.5">Tahun Kolektif</p>
        </div>
        <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div class="text-xl font-black text-amber-400 stat-number count-up-text" data-to="5" data-from="0">5</div>
          <p class="text-[9px] text-slate-300 font-bold uppercase mt-0.5">Penilai Publik</p>
        </div>
        <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div class="text-xl font-black text-amber-400 stat-number count-up-text" data-to="5" data-from="0">5</div>
          <p class="text-[9px] text-slate-300 font-bold uppercase mt-0.5">Kantor Wilayah</p>
        </div>
      </div>

    </div>
  </section>`;

content = content.substring(0, rekananStart) + newRekananHtml + '\r\n\r\n  ' + content.substring(sMutuStart);
console.log('2. Rekanan & Stats sections optimized for mobile (brought NSR Cloud much closer to Hero)!');

// =========================================================================
// 3. OPTIMIZE 3 PILAR SEBELUM DIAGRAM PADA HP (#sistem-mutu)
// =========================================================================
const pilarDesktopMarker = '<!-- 3 Pilar Kepercayaan Klien (Client Trust Pillars) -->';
const pilarStart = content.indexOf(pilarDesktopMarker);
const statusNodeMarker = '<!-- Status Node 5 Kantor Terkoneksi -->';
const statusNodeStart = content.indexOf(statusNodeMarker);

const old3Pilar = content.substring(pilarStart, statusNodeStart);

const new3Pilar = `<!-- 3 Pilar Kepercayaan Klien (Client Trust Pillars) -->
          <!-- Desktop 3 Pilar Cards (hidden on mobile) -->
          <div class="hidden sm:block mt-6 space-y-2.5 max-w-xl">
            <div class="rounded-xl border border-white/10 bg-white/[0.04] p-3.5 hover:border-sky-400/40 hover:bg-white/[0.07] transition group card-shimmer">
              <div class="flex items-start gap-3">
                <span class="w-9 h-9 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-110 transition-transform">
                  <svg class="w-4.5 h-4.5 text-sky-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                </span>
                <div>
                  <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition-colors">Registrasi Nomor Laporan Terpusat</h4>
                  <p class="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Satu pintu registrasi nomor laporan resmi (Nolap) dari Kantor Pusat guna menjamin keabsahan dokumen, mencegah duplikasi, dan memudahkan verifikasi perbankan.
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-white/10 bg-white/[0.04] p-3.5 hover:border-emerald-400/40 hover:bg-white/[0.07] transition group card-shimmer">
              <div class="flex items-start gap-3">
                <span class="w-9 h-9 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                  <svg class="w-4.5 h-4.5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </span>
                <div>
                  <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Kendali Mutu Berjenjang Standar SPI &amp; KEPI</h4>
                  <p class="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Kertas kerja lapangan diverifikasi berjenjang oleh Tim Quality Control dan Pimpinan Rekan Berizin Kemenkeu RI sebelum laporan diserahkan.
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-white/10 bg-white/[0.04] p-3.5 hover:border-amber-400/40 hover:bg-white/[0.07] transition group card-shimmer">
              <div class="flex items-start gap-3">
                <span class="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                  <svg class="w-4.5 h-4.5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <div>
                  <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">Kepatuhan Etika &amp; Kerahasiaan Dokumen Klien</h4>
                  <p class="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Informasi debitur, dokumen sertifikat, dan rahasia bisnis klien dijaga dengan komitmen kerahasiaan penuh sesuai Kode Etik Penilai Indonesia (KEPI) dan SPI 102.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile Compact 3 Pilar (Expandable details on tap) -->
          <div class="sm:hidden mt-3 space-y-1.5">
            <details class="group rounded-xl border border-white/10 bg-white/[0.04] p-2.5 transition">
              <summary class="flex items-center justify-between text-xs font-bold text-white cursor-pointer list-none">
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span>1. Registrasi NoLap Terpusat</span>
                </span>
                <span class="text-[10px] text-sky-400 group-open:rotate-180 transition-transform">&darr;</span>
              </summary>
              <p class="mt-2 text-[11px] text-slate-300 leading-relaxed pl-3 border-l border-sky-500/30">
                Satu pintu registrasi nomor laporan resmi (Nolap) dari Kantor Pusat guna menjamin keabsahan dokumen, mencegah duplikasi, dan memudahkan verifikasi perbankan.
              </p>
            </details>

            <details class="group rounded-xl border border-white/10 bg-white/[0.04] p-2.5 transition">
              <summary class="flex items-center justify-between text-xs font-bold text-white cursor-pointer list-none">
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>2. Kendali Mutu SPI &amp; KEPI</span>
                </span>
                <span class="text-[10px] text-emerald-400 group-open:rotate-180 transition-transform">&darr;</span>
              </summary>
              <p class="mt-2 text-[11px] text-slate-300 leading-relaxed pl-3 border-l border-emerald-500/30">
                Kertas kerja lapangan diverifikasi berjenjang oleh Tim Quality Control dan Pimpinan Rekan Berizin Kemenkeu RI sebelum laporan diserahkan.
              </p>
            </details>

            <details class="group rounded-xl border border-white/10 bg-white/[0.04] p-2.5 transition">
              <summary class="flex items-center justify-between text-xs font-bold text-white cursor-pointer list-none">
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>3. Etika &amp; Kerahasiaan Klien</span>
                </span>
                <span class="text-[10px] text-amber-400 group-open:rotate-180 transition-transform">&darr;</span>
              </summary>
              <p class="mt-2 text-[11px] text-slate-300 leading-relaxed pl-3 border-l border-amber-500/30">
                Informasi debitur, dokumen sertifikat, dan rahasia bisnis klien dijaga dengan komitmen kerahasiaan penuh sesuai Kode Etik Penilai Indonesia (KEPI) dan SPI 102.
              </p>
            </details>
          </div>

          `;

content = content.substring(0, pilarStart) + new3Pilar + content.substring(statusNodeStart);
console.log('3. Three trust pillars in NSR Cloud optimized for mobile!');

// =========================================================================
// 4. FIX GOOGLE MAPS DI HP (#kontak): IFRAME + FALLBACK LENGKAP
// =========================================================================
const mapContainerMarker = '<!-- Responsive Iframe -->';
const mapContainerStart = content.indexOf(mapContainerMarker);
const fallbackBarMarker = '<!-- Fallback: Buka di Google Maps & Pilihan Lokasi Jakarta -->';
const fallbackBarStart = content.indexOf(fallbackBarMarker);

const newMapContainerHtml = `<!-- Responsive Iframe with Fallback Overlay -->
          <div class="relative w-full flex-1 h-[240px] sm:h-[320px] md:h-[420px] bg-slate-900 overflow-hidden">
            <!-- Visual Fallback Map Card (Visible while iframe loads or if embed fails) -->
            <div id="map-fallback-overlay" class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 border border-slate-800 z-[1]">
              <div class="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-sky-400 mb-2 shadow-inner">
                <svg class="w-5 h-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <p id="map-fallback-nama" class="text-xs sm:text-sm font-bold text-white">Kantor Pusat Jakarta Selatan</p>
              <p id="map-fallback-alamat" class="text-[11px] text-slate-300 max-w-sm mt-1 leading-relaxed">Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Jakarta Selatan 12550</p>
              <a id="btn-fallback-navigasi" href="https://maps.google.com/?q=Jl.+Hankam+No.+5,+Ragunan,+Pasar+Minggu,+Jakarta+Selatan" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md">
                <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Buka Navigasi di Google Maps &nearr;</span>
              </a>
            </div>

            <!-- Google Maps Embed Iframe (z-10 on top) -->
            <iframe 
              id="map-iframe-kantor"
              src="https://www.google.com/maps?q=-6.3056,106.8208&hl=id&z=17&output=embed" 
              data-src="https://www.google.com/maps?q=-6.3056,106.8208&hl=id&z=17&output=embed" 
              width="100%" 
              height="100%" 
              class="w-full h-full border-0 relative z-10"
              allowfullscreen="" 
              loading="lazy" 
              referrerpolicy="no-referrer-when-downgrade"
              title="Peta Lokasi Kantor KJPP NSR">
            </iframe>
          </div>
          `;

content = content.substring(0, mapContainerStart) + newMapContainerHtml + content.substring(fallbackBarStart);
console.log('4. Google Maps container and visual fallback updated!');

// Update pilihKantorPeta JS to also update fallback overlay
const pilihKantorMarker = 'if (elLabelPeta) elLabelPeta.innerHTML = \'Peta Lokasi: \' + data.nama;';
const pilihKantorIdx = content.indexOf(pilihKantorMarker);
if (pilihKantorIdx !== -1) {
  const extraJs = `if (elLabelPeta) elLabelPeta.innerHTML = 'Peta Lokasi: ' + data.nama;
      const elFallbackNama = document.getElementById('map-fallback-nama');
      const elFallbackAlamat = document.getElementById('map-fallback-alamat');
      const elFallbackNav = document.getElementById('btn-fallback-navigasi');
      if (elFallbackNama) elFallbackNama.textContent = data.nama;
      if (elFallbackAlamat) elFallbackAlamat.innerHTML = data.alamat;
      if (elFallbackNav && (data.directMapUrl || data.gmaps)) elFallbackNav.href = data.directMapUrl || data.gmaps;`;
  content = content.substring(0, pilihKantorIdx) + extraJs + content.substring(pilihKantorIdx + pilihKantorMarker.length);
  console.log('5. pilihKantorPeta JS updated with fallback sync!');
}

fs.writeFileSync('index.html', content, 'utf8');
console.log('All mobile optimizations successfully written to index.html!');
