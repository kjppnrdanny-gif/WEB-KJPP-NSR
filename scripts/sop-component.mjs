// scripts/sop-component.mjs
// Component generator for: STANDARD OPERATING PROCEDURE — Alur Penugasan Penilaian Resmi

export function getSopComponentHtml() {
  return `    <!-- ==================== STANDARD OPERATING PROCEDURE — ALUR PENUGASAN PENILAIAN RESMI ==================== -->
    <section id="alur-penugasan-sop" aria-label="Standard Operating Procedure Alur Penugasan Penilaian Resmi" class="py-14 sm:py-16 bg-slate-950/80 text-white border-b border-slate-800 relative overflow-hidden">
      <!-- Glow ambient background -->
      <div class="absolute top-1/4 -left-32 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-10 -right-32 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <!-- Header Section (Ruang kosong dioptimalkan agar rapat & elegan) -->
        <div class="max-w-3xl mb-6 sm:mb-8">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/25 mb-2.5">
            <svg class="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            Standard Operating Procedure
          </span>
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Alur Penugasan Penilaian Resmi
          </h2>
          <p class="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Standar prosedur operasional baku berbasis KEPI &amp; SPI dengan kendali mutu berlapis (One-Gate Review), alokasi NoLap terverifikasi internal, dan pelaporan berkala ke eLSa-PK Kemenkeu RI.
          </p>
        </div>

        <!-- Timeline Container: Desktop Horizontal 5 Kolom & Mobile Vertical Timeline -->
        <div class="relative">
          
          <!-- Desktop Connecting Horizontal Line -->
          <div class="hidden lg:block absolute top-[42px] left-[6%] right-[6%] h-[2px] bg-gradient-to-r from-amber-400/40 via-amber-400/60 to-teal-400/70 z-0 pointer-events-none"></div>

          <!-- Mobile Vertical Timeline wrapper (padding kiri untuk jalur garis vertikal) -->
          <div class="relative pl-7 sm:pl-8 lg:pl-0">
            
            <!-- Mobile Vertical Connecting Line -->
            <div class="lg:hidden absolute left-[12px] sm:left-[14px] top-6 bottom-8 w-[2px] bg-gradient-to-b from-amber-400/50 via-amber-400/70 to-teal-400/80 pointer-events-none z-0"></div>

            <!-- Grid 5 Tahap -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-3.5 lg:gap-3.5 items-stretch relative z-10" id="sop-steps-grid">
              
              <!-- TAHAP 1 -->
              <div class="relative group">
                <!-- Mobile Node Indicator -->
                <div class="lg:hidden absolute -left-[24px] sm:-left-[26px] top-5 w-4 h-4 rounded-full bg-slate-950 border-2 border-amber-400 z-10 flex items-center justify-center">
                  <div class="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                </div>

                <div 
                  id="sop-card-1"
                  onclick="pilihTahapSop(1)" 
                  onkeydown="if(event.key==='Enter'||event.key===' '){pilihTahapSop(1);event.preventDefault();}"
                  role="button" 
                  tabindex="0"
                  aria-expanded="false"
                  aria-controls="sop-detail-panel"
                  class="sop-card-item active-sop-card h-full p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-amber-400/60 shadow-md shadow-amber-500/5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1.5 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                      <!-- Stage Icon -->
                      <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform duration-200">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </div>
                      <!-- Prominent Stage Number -->
                      <span class="font-mono font-black text-2xl sm:text-3xl text-amber-400/80 group-hover:text-amber-300 transition-colors">01</span>
                    </div>

                    <span class="text-[10px] font-black uppercase tracking-widest text-amber-400 block">TAHAP 01</span>
                    <h3 class="text-sm font-bold text-white mt-1 group-hover:text-amber-200 transition-colors">Permintaan &amp; Kontrak SPK</h3>
                    <p class="mt-2 text-xs text-slate-300 leading-relaxed">
                      Penelaahan permintaan penawaran, ruang lingkup pekerjaan, penerimaan penugasan, dan kesepakatan SPK.
                    </p>
                  </div>

                  <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span class="text-[11px] font-semibold text-sky-400 group-hover:text-sky-300 flex items-center gap-1">
                      Detail Tahap
                      <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </span>
                    <span class="inline-flex w-2 h-2 rounded-full bg-amber-400"></span>
                  </div>
                </div>

                <!-- Desktop Chevron Connector to Step 2 -->
                <div class="hidden lg:flex absolute -right-3.5 top-[30px] z-20 w-6 h-6 rounded-full bg-slate-900 border border-slate-700/80 items-center justify-center text-slate-400 shadow-sm pointer-events-none">
                  <svg class="w-3.5 h-3.5 text-amber-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>

              <!-- TAHAP 2 -->
              <div class="relative group">
                <!-- Mobile Node Indicator -->
                <div class="lg:hidden absolute -left-[24px] sm:-left-[26px] top-5 w-4 h-4 rounded-full bg-slate-950 border-2 border-amber-400 z-10 flex items-center justify-center">
                  <div class="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                </div>

                <div 
                  id="sop-card-2"
                  onclick="pilihTahapSop(2)" 
                  onkeydown="if(event.key==='Enter'||event.key===' '){pilihTahapSop(2);event.preventDefault();}"
                  role="button" 
                  tabindex="0"
                  aria-expanded="false"
                  aria-controls="sop-detail-panel"
                  class="sop-card-item h-full p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1.5 hover:border-amber-400/60 hover:shadow-md hover:shadow-amber-500/5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                      <!-- Stage Icon -->
                      <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform duration-200">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </div>
                      <!-- Prominent Stage Number -->
                      <span class="font-mono font-black text-2xl sm:text-3xl text-slate-500/70 group-hover:text-amber-400/80 transition-colors">02</span>
                    </div>

                    <span class="text-[10px] font-black uppercase tracking-widest text-amber-400/90 block">TAHAP 02</span>
                    <h3 class="text-sm font-bold text-white mt-1 group-hover:text-amber-200 transition-colors">Survei &amp; Pengumpulan Data</h3>
                    <p class="mt-2 text-xs text-slate-300 leading-relaxed">
                      Inspeksi objek jika dipersyaratkan, dokumentasi lapangan, serta verifikasi data dan dokumen pendukung.
                    </p>
                  </div>

                  <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span class="text-[11px] font-semibold text-sky-400 group-hover:text-sky-300 flex items-center gap-1">
                      Detail Tahap
                      <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </span>
                    <span class="inline-flex w-2 h-2 rounded-full bg-slate-700"></span>
                  </div>
                </div>

                <!-- Desktop Chevron Connector to Step 3 -->
                <div class="hidden lg:flex absolute -right-3.5 top-[30px] z-20 w-6 h-6 rounded-full bg-slate-900 border border-slate-700/80 items-center justify-center text-slate-400 shadow-sm pointer-events-none">
                  <svg class="w-3.5 h-3.5 text-amber-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>

              <!-- TAHAP 3 -->
              <div class="relative group">
                <!-- Mobile Node Indicator -->
                <div class="lg:hidden absolute -left-[24px] sm:-left-[26px] top-5 w-4 h-4 rounded-full bg-slate-950 border-2 border-amber-400 z-10 flex items-center justify-center">
                  <div class="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                </div>

                <div 
                  id="sop-card-3"
                  onclick="pilihTahapSop(3)" 
                  onkeydown="if(event.key==='Enter'||event.key===' '){pilihTahapSop(3);event.preventDefault();}"
                  role="button" 
                  tabindex="0"
                  aria-expanded="false"
                  aria-controls="sop-detail-panel"
                  class="sop-card-item h-full p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1.5 hover:border-amber-400/60 hover:shadow-md hover:shadow-amber-500/5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                      <!-- Stage Icon -->
                      <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform duration-200">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                      </div>
                      <!-- Prominent Stage Number -->
                      <span class="font-mono font-black text-2xl sm:text-3xl text-slate-500/70 group-hover:text-amber-400/80 transition-colors">03</span>
                    </div>

                    <span class="text-[10px] font-black uppercase tracking-widest text-amber-400/90 block">TAHAP 03</span>
                    <h3 class="text-sm font-bold text-white mt-1 group-hover:text-amber-200 transition-colors">Analisis &amp; Penyusunan Laporan</h3>
                    <p class="mt-2 text-xs text-slate-300 leading-relaxed">
                      Analisis data pasar dan penerapan pendekatan serta metode penilaian yang relevan sesuai SPI.
                    </p>
                  </div>

                  <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span class="text-[11px] font-semibold text-sky-400 group-hover:text-sky-300 flex items-center gap-1">
                      Detail Tahap
                      <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </span>
                    <span class="inline-flex w-2 h-2 rounded-full bg-slate-700"></span>
                  </div>
                </div>

                <!-- Desktop Chevron Connector to Step 4 -->
                <div class="hidden lg:flex absolute -right-3.5 top-[30px] z-20 w-6 h-6 rounded-full bg-slate-900 border border-slate-700/80 items-center justify-center text-slate-400 shadow-sm pointer-events-none">
                  <svg class="w-3.5 h-3.5 text-amber-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>

              <!-- TAHAP 4 -->
              <div class="relative group">
                <!-- Mobile Node Indicator -->
                <div class="lg:hidden absolute -left-[24px] sm:-left-[26px] top-5 w-4 h-4 rounded-full bg-slate-950 border-2 border-amber-400 z-10 flex items-center justify-center">
                  <div class="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                </div>

                <div 
                  id="sop-card-4"
                  onclick="pilihTahapSop(4)" 
                  onkeydown="if(event.key==='Enter'||event.key===' '){pilihTahapSop(4);event.preventDefault();}"
                  role="button" 
                  tabindex="0"
                  aria-expanded="false"
                  aria-controls="sop-detail-panel"
                  class="sop-card-item h-full p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1.5 hover:border-amber-400/60 hover:shadow-md hover:shadow-amber-500/5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                      <!-- Stage Icon -->
                      <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform duration-200">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                      </div>
                      <!-- Prominent Stage Number -->
                      <span class="font-mono font-black text-2xl sm:text-3xl text-slate-500/70 group-hover:text-amber-400/80 transition-colors">04</span>
                    </div>

                    <span class="text-[10px] font-black uppercase tracking-widest text-amber-400/90 block">TAHAP 04</span>
                    <h3 class="text-sm font-bold text-white mt-1 group-hover:text-amber-200 transition-colors">Review &amp; Pengendalian Mutu</h3>
                    <p class="mt-2 text-xs text-slate-300 leading-relaxed">
                      Penelaahan teknis, pemeriksaan kepatuhan, dan verifikasi oleh pihak berwenang sesuai prosedur kendali mutu.
                    </p>
                  </div>

                  <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span class="text-[11px] font-semibold text-sky-400 group-hover:text-sky-300 flex items-center gap-1">
                      Detail Tahap
                      <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </span>
                    <span class="inline-flex w-2 h-2 rounded-full bg-slate-700"></span>
                  </div>
                </div>

                <!-- Desktop Chevron Connector to Step 5 -->
                <div class="hidden lg:flex absolute -right-3.5 top-[30px] z-20 w-6 h-6 rounded-full bg-slate-900 border border-slate-700/80 items-center justify-center text-slate-400 shadow-sm pointer-events-none">
                  <svg class="w-3.5 h-3.5 text-teal-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>

              <!-- TAHAP 5 (TEAL ACCENT - PENANDA AKHIR PROSES) -->
              <div class="relative group">
                <!-- Mobile Node Indicator (Teal for final step) -->
                <div class="lg:hidden absolute -left-[24px] sm:-left-[26px] top-5 w-4 h-4 rounded-full bg-slate-950 border-2 border-teal-400 z-10 flex items-center justify-center">
                  <div class="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                </div>

                <div 
                  id="sop-card-5"
                  onclick="pilihTahapSop(5)" 
                  onkeydown="if(event.key==='Enter'||event.key===' '){pilihTahapSop(5);event.preventDefault();}"
                  role="button" 
                  tabindex="0"
                  aria-expanded="false"
                  aria-controls="sop-detail-panel"
                  class="sop-card-item h-full p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-teal-950/25 to-slate-950/95 border border-teal-500/40 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1.5 hover:border-teal-400/80 hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                      <!-- Stage Icon (Teal Completion Marker) -->
                      <div class="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-400/30 flex items-center justify-center text-teal-300 group-hover:scale-105 transition-transform duration-200">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <!-- Prominent Stage Number (Teal) -->
                      <span class="font-mono font-black text-2xl sm:text-3xl text-teal-500/60 group-hover:text-teal-300 transition-colors">05</span>
                    </div>

                    <span class="text-[10px] font-black uppercase tracking-widest text-teal-300 block">TAHAP 05 &bull; FINAL</span>
                    <h3 class="text-sm font-bold text-white mt-1 group-hover:text-teal-200 transition-colors">Finalisasi &amp; Serah Terima</h3>
                    <p class="mt-2 text-xs text-slate-300 leading-relaxed">
                      Finalisasi laporan penilaian dan penyerahan dokumen kepada pemberi tugas setelah seluruh persyaratan terpenuhi.
                    </p>
                  </div>

                  <div class="mt-4 pt-3 border-t border-teal-900/60 flex items-center justify-between">
                    <span class="text-[11px] font-semibold text-teal-300 group-hover:text-teal-200 flex items-center gap-1">
                      Detail Tahap
                      <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </span>
                    <span class="inline-flex w-2 h-2 rounded-full bg-teal-400"></span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- ==================== INTERACTIVE EXPANDABLE DETAIL PANEL ==================== -->
        <div 
          id="sop-detail-panel" 
          class="mt-6 rounded-2xl bg-slate-900/95 border border-slate-800 p-5 sm:p-7 shadow-2xl relative transition-all duration-200"
        >
          <!-- Panel Header & Quick Stage Selector Bar -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-800/80">
            <div class="flex items-center gap-3">
              <span id="sop-detail-badge" class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30">
                TAHAP 01 / 05
              </span>
              <div>
                <h4 id="sop-detail-title" class="text-base sm:text-lg font-bold text-white">
                  Tahap 1 — Permintaan &amp; Kontrak SPK
                </h4>
                <p id="sop-detail-subtitle" class="text-xs text-slate-400">
                  Pemberi tugas mengajukan kebutuhan penilaian resmi hingga kesepakatan SPK penugasan.
                </p>
              </div>
            </div>

            <!-- Stage quick switcher tabs -->
            <div class="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950/80 p-1 rounded-xl border border-slate-800" role="tablist" aria-label="Pilih Tahap SOP">
              <button type="button" onclick="pilihTahapSop(1)" id="sop-tab-btn-1" class="px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors bg-amber-500 text-slate-950 shadow-sm" aria-label="Tahap 1">01</button>
              <button type="button" onclick="pilihTahapSop(2)" id="sop-tab-btn-2" class="px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors text-slate-400 hover:text-white" aria-label="Tahap 2">02</button>
              <button type="button" onclick="pilihTahapSop(3)" id="sop-tab-btn-3" class="px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors text-slate-400 hover:text-white" aria-label="Tahap 3">03</button>
              <button type="button" onclick="pilihTahapSop(4)" id="sop-tab-btn-4" class="px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors text-slate-400 hover:text-white" aria-label="Tahap 4">04</button>
              <button type="button" onclick="pilihTahapSop(5)" id="sop-tab-btn-5" class="px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors text-slate-400 hover:text-white" aria-label="Tahap 5">05</button>
            </div>
          </div>

          <!-- 3 Structured Detail Blocks -->
          <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4" id="sop-detail-columns">
            
            <!-- Block 1: Aktivitas Kunci -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <h5 class="text-xs font-bold uppercase tracking-wider text-slate-200">Aktivitas Kunci</h5>
              </div>
              <p id="sop-detail-act" class="text-xs text-slate-300 leading-relaxed">
                Penelaahan dokumen permintaan penawaran (RFP), identifikasi awal objek aset, pemeriksaan integritas dan uji independensi/benturan kepentingan sesuai etika KEPI.
              </p>
            </div>

            <!-- Block 2: Dokumen & Acuan Standar -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <h5 class="text-xs font-bold uppercase tracking-wider text-slate-200">Dokumen &amp; Standar</h5>
              </div>
              <p id="sop-detail-doc" class="text-xs text-slate-300 leading-relaxed">
                Kerangka Acuan Kerja (TOR/RFP), Surat Penawaran Biaya (Proposal Teknis), Kode Etik Penilai Indonesia (KEPI) &amp; Standar Penilaian Indonesia (SPI).
              </p>
            </div>

            <!-- Block 3: Output & Deliverables -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h5 class="text-xs font-bold uppercase tracking-wider text-slate-200">Output Terverifikasi</h5>
              </div>
              <p id="sop-detail-out" class="text-xs text-slate-300 leading-relaxed">
                Surat Perintah Kerja (SPK) / Kontrak Penugasan sah bertandatangan dua belah pihak serta nomor registrasi penugasan internal KJPP NSR.
              </p>
            </div>

          </div>

          <!-- Special Clarification Callout Box (khusus Tahap 4 & Tahap 5 menyoroti alur NoLap yang tepat) -->
          <div id="sop-detail-callout" class="hidden mt-4 p-3.5 rounded-xl border text-xs leading-relaxed">
            <!-- Isi dinamis via JS -->
          </div>

          <!-- Bottom controls: Navigasi Prev/Next -->
          <div class="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <button 
              type="button" 
              id="sop-btn-prev"
              onclick="navigasiTahapSop(-1)"
              disabled
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-200 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              Tahap Sebelumnya
            </button>

            <span class="text-[11px] text-slate-400 hidden sm:inline">
              Klik kartu tahapan di atas untuk melihat rincian proses
            </span>

            <button 
              type="button" 
              id="sop-btn-next"
              onclick="navigasiTahapSop(1)"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-sm"
            >
              Tahap Berikutnya
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

        </div>

      </div>
    </section>

    <!-- Script Native SOP Timeline (Durasi transisi &lt;200ms, tanpa library eksternal) -->
    <script>
      (function() {
        var currentSopStep = 1;
        var sopData = {
          1: {
            badge: 'TAHAP 01 / 05',
            badgeClass: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
            title: 'Tahap 1 — Permintaan & Kontrak SPK',
            subtitle: 'Pemberi tugas mengajukan kebutuhan penilaian resmi hingga kesepakatan SPK penugasan.',
            act: 'Penelaahan dokumen permintaan penawaran (RFP), identifikasi awal objek aset, pemeriksaan integritas dan uji independensi/benturan kepentingan sesuai etika KEPI.',
            doc: 'Kerangka Acuan Kerja (TOR/RFP), Surat Penawaran Biaya (Proposal Teknis), Kode Etik Penilai Indonesia (KEPI) & Standar Penilaian Indonesia (SPI).',
            out: 'Surat Perintah Kerja (SPK) / Kontrak Penugasan sah bertandatangan dua belah pihak serta nomor registrasi penugasan internal KJPP NSR.',
            callout: null
          },
          2: {
            badge: 'TAHAP 02 / 05',
            badgeClass: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
            title: 'Tahap 2 — Survei & Pengumpulan Data',
            subtitle: 'Inspeksi objek fisik, dokumentasi koordinat GPS, dan verifikasi kelengkapan yuridis.',
            act: 'Inspeksi fisik langsung oleh Penilai Publik beregister / tim teknis berkompeten, geotagging foto objek, pemeriksaan batas fisik & yuridis, serta wawancara lingkungan sekitar objek.',
            doc: 'Berita Acara Survei (BAS), Bukti Kepemilikan (SHM/HGB/IMB/PBG/Faktur dsb.), Data Tata Ruang Kota (RTRW), dan dokumentasi lapangan ber-GPS.',
            out: 'Kertas kerja survei fisik terverifikasi, peta lokasi objek, dan rekonsiliasi data legalitas yang siap dianalisis matematis.',
            callout: null
          },
          3: {
            badge: 'TAHAP 03 / 05',
            badgeClass: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
            title: 'Tahap 3 — Analisis & Penyusunan Laporan',
            subtitle: 'Riset transaksi pasar pembanding dan pemodelan matematis nilai sesuai SPI.',
            act: 'Pengumpulan data pasar pembanding yang setara dan sejenis, analisis Highest and Best Use (HBU), serta aplikasi pendekatan penilaian relevan (Pendekatan Pasar, Biaya, dan/atau Pendapatan).',
            doc: 'Data transaksi pasar terkonfirmasi, database riset KJPP NSR, pedoman teknis SPI (Standar Penilaian Indonesia), dan formula depresiasi teknis.',
            out: 'Kertas Kerja Penilaian (KKP) komprehensif, kalkulasi nilai wajar/pasar yang dapat dipertanggungjawabkan, serta draf naratif laporan penilaian.',
            callout: null
          },
          4: {
            badge: 'TAHAP 04 / 05 &bull; KENDALI MUTU',
            badgeClass: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
            title: 'Tahap 4 — Review & Pengendalian Mutu (SPM)',
            subtitle: 'Pemeriksaan berjenjang (One-Gate Review), verifikasi kepatuhan, dan alokasi NoLap resmi.',
            act: 'Penelaahan teknis berjenjang oleh Komite Kendali Mutu (Sistem Pengendalian Mutu - SPM), audit silang kepatuhan metodologi terhadap KEPI & SPI, serta verifikasi final oleh Pimpinan Rekan.',
            doc: 'Ceklis Kendali Mutu SPM, Lembar Review Berjenjang (Peer-Review Sheet), dan Berita Acara Verifikasi Nilai.',
            out: 'Persetujuan resmi Komite Kendali Mutu (SPM Clearance) dan alokasi Nomor Registrasi Laporan (NoLap) resmi internal KJPP NSR.',
            callout: {
              type: 'amber',
              html: '<div class=\"flex items-start gap-2.5 text-amber-200/95\"><svg class=\"w-4 h-4 text-amber-400 shrink-0 mt-0.5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\"/></svg><div><strong class=\"text-amber-300 font-bold block mb-0.5\">Mekanisme Resmi Nomor Laporan (NoLap):</strong>Nomor Laporan (NoLap) bukan terbit tiba-tiba di tahap akhir. Alokasi dan verifikasi NoLap resmi internal dilakukan pada tahap kendali mutu internal (Tahap 4) oleh Kepala SPM / Partner berizin setelah seluruh kertas kerja terbukti patuh pada SPI &amp; KEPI.</div></div>'
            }
          },
          5: {
            badge: 'TAHAP 05 / 05 &bull; FINALISASI RESMI',
            badgeClass: 'bg-teal-400/20 text-teal-300 border-teal-400/40',
            title: 'Tahap 5 — Finalisasi & Serah Terima Dokumen',
            subtitle: 'Pencetakan laporan berstempel resmi, penyerahan ke klien, dan pelaporan berkala ke eLSa-PK.',
            act: 'Pencetakan buku laporan akhir berfitur pengaman/emboss, penandatanganan basah oleh Penilai Publik Berizin, penyerahan resmi kepada Pemberi Tugas, dan pengarsipan kepatuhan.',
            doc: 'Buku Laporan Penilaian Resmi Ber-NoLap Sah, Tanda Terima Dokumen Penyerahan, dan Dokumen Arsip Kerja Digital.',
            out: 'Buku Laporan Penilaian Resmi diterima Pemberi Tugas dan nomor laporan dicatatkan dalam pelaporan berkala ke PPPK Kemenkeu RI.',
            callout: {
              type: 'teal',
              html: '<div class=\"flex items-start gap-2.5 text-teal-200/95\"><svg class=\"w-4 h-4 text-teal-300 shrink-0 mt-0.5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z\"/></svg><div><strong class=\"text-teal-300 font-bold block mb-0.5\">Pelaporan ke PPPK Kemenkeu RI (eLSa-PK):</strong>Nomor register laporan yang telah dialokasikan dan disahkan pada tahap sebelumnya dicantumkan secara sah pada laporan final, kemudian dilaporkan secara berkala kepada PPPK Kementerian Keuangan RI melalui portal eLSa-PK sesuai ketentuan regulasi PMK Penilai Publik yang berlaku.</div></div>'
            }
          }
        };

        window.pilihTahapSop = function(step) {
          if (!sopData[step]) return;
          currentSopStep = step;
          var data = sopData[step];

          // 1. Update Card Highlights (max 200ms transition)
          for (var i = 1; i <= 5; i++) {
            var card = document.getElementById('sop-card-' + i);
            var tabBtn = document.getElementById('sop-tab-btn-' + i);
            if (card) {
              if (i === step) {
                card.setAttribute('aria-expanded', 'true');
                if (i === 5) {
                  card.className = 'sop-card-item active-sop-card h-full p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-teal-950/40 to-slate-950/95 border-2 border-teal-400 shadow-lg shadow-teal-500/15 flex flex-col justify-between cursor-pointer transition-all duration-200 -translate-y-1 focus:outline-none focus:ring-2 focus:ring-teal-400';
                } else {
                  card.className = 'sop-card-item active-sop-card h-full p-4 sm:p-5 rounded-2xl bg-slate-900 border-2 border-amber-400 shadow-lg shadow-amber-500/15 flex flex-col justify-between cursor-pointer transition-all duration-200 -translate-y-1 focus:outline-none focus:ring-2 focus:ring-amber-400';
                }
              } else {
                card.setAttribute('aria-expanded', 'false');
                if (i === 5) {
                  card.className = 'sop-card-item h-full p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-teal-950/25 to-slate-950/95 border border-teal-500/40 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1.5 hover:border-teal-400/80 hover:shadow-lg hover:shadow-teal-500/10 focus:outline-none focus:ring-2 focus:ring-teal-400';
                } else {
                  card.className = 'sop-card-item h-full p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1.5 hover:border-amber-400/60 hover:shadow-md hover:shadow-amber-500/5 focus:outline-none focus:ring-2 focus:ring-amber-400';
                }
              }
            }

            if (tabBtn) {
              if (i === step) {
                if (i === 5) {
                  tabBtn.className = 'px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors bg-teal-400 text-slate-950 shadow-sm';
                } else {
                  tabBtn.className = 'px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors bg-amber-500 text-slate-950 shadow-sm';
                }
              } else {
                tabBtn.className = 'px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors text-slate-400 hover:text-white';
              }
            }
          }

          // 2. Update Panel Content
          var badgeEl = document.getElementById('sop-detail-badge');
          var titleEl = document.getElementById('sop-detail-title');
          var subtitleEl = document.getElementById('sop-detail-subtitle');
          var actEl = document.getElementById('sop-detail-act');
          var docEl = document.getElementById('sop-detail-doc');
          var outEl = document.getElementById('sop-detail-out');
          var calloutEl = document.getElementById('sop-detail-callout');

          if (badgeEl) {
            badgeEl.innerHTML = data.badge;
            badgeEl.className = 'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ' + data.badgeClass;
          }
          if (titleEl) titleEl.textContent = data.title;
          if (subtitleEl) subtitleEl.textContent = data.subtitle;
          if (actEl) actEl.textContent = data.act;
          if (docEl) docEl.textContent = data.doc;
          if (outEl) outEl.textContent = data.out;

          if (calloutEl) {
            if (data.callout) {
              calloutEl.className = data.callout.type === 'teal' 
                ? 'mt-4 p-3.5 rounded-xl border border-teal-500/30 bg-teal-950/30 text-xs leading-relaxed block'
                : 'mt-4 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs leading-relaxed block';
              calloutEl.innerHTML = data.callout.html;
            } else {
              calloutEl.className = 'hidden';
              calloutEl.innerHTML = '';
            }
          }

          // 3. Update Prev / Next Button States
          var prevBtn = document.getElementById('sop-btn-prev');
          var nextBtn = document.getElementById('sop-btn-next');
          if (prevBtn) {
            prevBtn.disabled = (step === 1);
          }
          if (nextBtn) {
            if (step === 5) {
              nextBtn.disabled = true;
              nextBtn.className = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 opacity-50 cursor-not-allowed text-slate-400 text-xs font-bold transition-colors';
            } else {
              nextBtn.disabled = false;
              nextBtn.className = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-sm';
            }
          }
        };

        window.navigasiTahapSop = function(direction) {
          var target = currentSopStep + direction;
          if (target >= 1 && target <= 5) {
            window.pilihTahapSop(target);
          }
        };
      })();
    </script>
`;
}
