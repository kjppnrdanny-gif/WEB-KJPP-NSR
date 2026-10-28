import fs from 'node:fs';

const INDEX_PATH = 'index.html';
let html = fs.readFileSync(INDEX_PATH, 'utf8');

// 1. Identify start anchor
const startAnchor = '<!-- visual system flow: Jakarta Pusat → NSR Cloud Core → 4 Cabang terpisah -->';
const startIndex = html.indexOf(startAnchor);
if (startIndex === -1) {
  console.error('ERROR: startAnchor not found in index.html');
  process.exit(1);
}

// 2. Identify end anchor
const endAnchor = '<!-- PANEL 2: LAYANAN UNGGULAN (Hidden by default) -->';
const endIndex = html.indexOf(endAnchor);
if (endIndex === -1) {
  console.error('ERROR: endAnchor not found in index.html');
  process.exit(1);
}

// Replacement content containing the responsive Dual-Layout and clean CTA button
const cleanDiagramContent = `<!-- ======================================================== -->
            <!-- TAMPILAN 1: DESKTOP & TABLET (HORIZONTAL SVG MINDMAP)     -->
            <!-- Aktif pada breakpoint md ke atas (>= 768px)               -->
            <!-- ======================================================== -->
            <div class="hidden md:block w-full py-6">
              <div class="w-full grid grid-cols-[1.1fr_48px_1.3fr_48px_1.4fr] lg:grid-cols-[1.1fr_70px_1.3fr_70px_1.4fr] items-center relative z-10 gap-0">

                <!-- NODE KIRI: KANTOR PUSAT JAKARTA -->
                <div class="relative rounded-2xl bg-slate-950/95 border border-slate-800 hover:border-sky-400/60 p-3 lg:p-4 text-center transition group shadow-xl flex flex-col justify-center min-h-[110px]">
                  <span class="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-slate-900 ring-2 ring-blue-400/80 shadow-[0_0_12px_rgba(59,130,246,1)] z-20"></span>
                  
                  <div class="mx-auto w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform shadow-inner">
                    <svg class="w-5 h-5 lg:w-6 lg:h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
                      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
                      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                      <path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
                    </svg>
                  </div>
                  
                  <p class="mt-2 text-xs lg:text-sm font-black text-white leading-tight">
                    Kantor Pusat<br><span class="text-sky-300">Jakarta</span>
                  </p>
                  
                  <!-- Peran Terkini Sesuai Spesifikasi -->
                  <p class="mt-1 text-[9px] lg:text-[10px] text-amber-400 font-extrabold flex items-center justify-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    Otoritas Manajemen, SPM &amp; Divtek
                  </p>

                  <!-- Tag Tambahan -->
                  <span class="mt-1 inline-block px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-[7.5px] lg:text-[8px] font-mono text-slate-300 font-semibold truncate">
                    Alokasi NoLap Kemenkeu &bull; Otorisasi 5-Tier
                  </span>
                </div>

                <!-- KONEKTOR KIRI: Pusat ↔ Core (DILENGKAPI LABEL GERBANG 1) -->
                <div class="h-32 w-full relative flex items-center justify-center overflow-visible pointer-events-none">
                  <!-- Label Gerbang 1 -->
                  <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                    <span class="px-1.5 lg:px-2 py-0.5 rounded-full bg-slate-950 border border-sky-400/60 text-[7.5px] lg:text-[8.5px] font-mono font-black text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.3)] whitespace-nowrap">
                      Gerbang 1: JO &amp; SPK
                    </span>
                  </div>

                  <svg class="w-full h-full overflow-visible" viewBox="0 0 70 160" preserveAspectRatio="none" fill="none">
                    <defs>
                      <linearGradient id="wireGradPusat" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.9"/>
                        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.9"/>
                      </linearGradient>
                      <filter id="whitePulseGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>
                    <path d="M 0 80 C 35 80, 35 80, 70 80" stroke="url(#wireGradPusat)" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M 0 80 C 35 80, 35 80, 70 80" pathLength="100" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" class="animate-cloud-flow" filter="url(#whitePulseGlow)"/>
                  </svg>
                </div>

                <!-- NODE TENGAH: OPINI NSR CORE ENGINE (DILENGKAPI IKON AUDIT SHIELD / CONTROL TOWER) -->
                <div class="relative rounded-2xl bg-gradient-to-br from-amber-500/15 via-sky-600/15 to-slate-950 border-2 border-sky-400/60 p-3 lg:p-4 text-center shadow-2xl animate-cloud-glow flex flex-col justify-center min-h-[110px]">
                  <span class="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-sky-400 border-2 border-slate-900 ring-2 ring-sky-300 shadow-[0_0_12px_rgba(56,189,248,1)] z-20"></span>
                  <span class="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-900 ring-2 ring-amber-300 shadow-[0_0_12px_rgba(245,158,11,1)] z-20"></span>
                  
                  <div class="mx-auto w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-tr from-amber-500/20 to-sky-500/30 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-inner">
                    <i class="fa-solid fa-shield-halved text-base lg:text-lg animate-pulse text-amber-400"></i>
                  </div>
                  
                  <p class="mt-2 text-xs lg:text-sm font-black text-amber-300 tracking-wide uppercase">
                    OPINI NSR Core Engine
                  </p>
                  <p class="mt-0.5 text-[8px] lg:text-[9.5px] text-sky-200 font-mono font-bold">
                    Dual-Gate Governance &amp; Control Tower
                  </p>
                  <span class="mt-1 inline-block px-1.5 lg:px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-[7.5px] lg:text-[8px] font-mono text-amber-300 font-semibold truncate">
                    Kemenkeu eLSa &bull; Audit Trail Terpadu
                  </span>
                </div>

                <!-- KONEKTOR KANAN: Core ↔ 4 Cabang (DILENGKAPI LABEL GERBANG 2) -->
                <div class="h-48 sm:h-56 w-full relative flex items-center justify-center overflow-visible pointer-events-none">
                  <!-- Label Gerbang 2 -->
                  <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                    <span class="px-1.5 lg:px-2 py-0.5 rounded-full bg-slate-950 border border-emerald-400/60 text-[7.5px] lg:text-[8.5px] font-mono font-black text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)] whitespace-nowrap">
                      Gerbang 2: SPM &amp; Review
                    </span>
                  </div>

                  <svg class="w-full h-full overflow-visible" viewBox="0 0 70 240" preserveAspectRatio="none" fill="none">
                    <defs>
                      <linearGradient id="wBdg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/><stop offset="100%" stop-color="#10b981" stop-opacity="0.9"/></linearGradient>
                      <linearGradient id="wPdg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/><stop offset="100%" stop-color="#f59e0b" stop-opacity="0.9"/></linearGradient>
                      <linearGradient id="wMks" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/><stop offset="100%" stop-color="#a78bfa" stop-opacity="0.9"/></linearGradient>
                      <linearGradient id="wPlb" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/><stop offset="100%" stop-color="#fb923c" stop-opacity="0.9"/></linearGradient>
                    </defs>
                    <!-- Jalur Bandung (top) -->
                    <path d="M 0 120 C 35 120, 35 30, 70 30" stroke="url(#wBdg)" stroke-width="2" stroke-linecap="round"/>
                    <path d="M 0 120 C 35 120, 35 30, 70 30" pathLength="100" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" class="animate-cloud-flow" filter="url(#whitePulseGlow)" style="animation-delay:0s"/>
                    <!-- Jalur Padang -->
                    <path d="M 0 120 C 35 120, 35 90, 70 90" stroke="url(#wPdg)" stroke-width="2" stroke-linecap="round"/>
                    <path d="M 0 120 C 35 120, 35 90, 70 90" pathLength="100" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" class="animate-cloud-flow" filter="url(#whitePulseGlow)" style="animation-delay:0.45s"/>
                    <!-- Jalur Makassar -->
                    <path d="M 0 120 C 35 120, 35 150, 70 150" stroke="url(#wMks)" stroke-width="2" stroke-linecap="round"/>
                    <path d="M 0 120 C 35 120, 35 150, 70 150" pathLength="100" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round" class="animate-cloud-flow" filter="url(#whitePulseGlow)" style="animation-delay:0.9s"/>
                    <!-- Jalur Palembang (bottom) -->
                    <path d="M 0 120 C 35 120, 35 210, 70 210" stroke="url(#wPlb)" stroke-width="2" stroke-linecap="round"/>
                    <path d="M 0 120 C 35 120, 35 210, 70 210" pathLength="100" stroke="#fb923c" stroke-width="2.5" stroke-linecap="round" class="animate-cloud-flow" filter="url(#whitePulseGlow)" style="animation-delay:1.35s"/>
                  </svg>
                </div>

                <!-- NODE KANAN: 4 KANTOR CABANG DENGAN KLASIFIKASI LENGKAP -->
                <div class="flex flex-col gap-2 lg:gap-2.5 relative z-10">

                  <!-- 1. Bandung -->
                  <div class="relative py-1.5 lg:py-2 px-2.5 lg:px-3 rounded-xl bg-slate-950/95 border border-emerald-700/40 hover:border-emerald-400/70 transition group shadow-md flex items-center justify-between gap-2">
                    <span class="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 ring-1 ring-emerald-300 shadow-[0_0_8px_rgba(52,211,153,1)] z-20"></span>
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-6 h-6 lg:w-7 lg:h-7 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                        <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div class="min-w-0">
                        <p class="text-[11px] lg:text-xs font-bold text-white flex items-center gap-1">
                          <span>Bandung</span>
                          <span class="text-[8.5px] lg:text-[9px] text-emerald-400 font-normal">(Jabar)</span>
                        </p>
                        <p class="text-[8px] lg:text-[9px] text-emerald-300/90 font-mono font-semibold truncate">Klasifikasi P</p>
                      </div>
                    </div>
                  </div>

                  <!-- 2. Padang -->
                  <div class="relative py-1.5 lg:py-2 px-2.5 lg:px-3 rounded-xl bg-slate-950/95 border border-amber-700/40 hover:border-amber-400/70 transition group shadow-md flex items-center justify-between gap-2">
                    <span class="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-900 ring-1 ring-amber-300 shadow-[0_0_8px_rgba(251,191,36,1)] z-20"></span>
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-6 h-6 lg:w-7 lg:h-7 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                        <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div class="min-w-0">
                        <p class="text-[11px] lg:text-xs font-bold text-white flex items-center gap-1">
                          <span>Padang</span>
                          <span class="text-[8.5px] lg:text-[9px] text-amber-400 font-normal">(Sumbar)</span>
                        </p>
                        <p class="text-[8px] lg:text-[9px] text-amber-300/90 font-mono font-semibold truncate">Klasifikasi PS</p>
                      </div>
                    </div>
                  </div>

                  <!-- 3. Makassar -->
                  <div class="relative py-1.5 lg:py-2 px-2.5 lg:px-3 rounded-xl bg-slate-950/95 border border-violet-700/40 hover:border-violet-400/70 transition group shadow-md flex items-center justify-between gap-2">
                    <span class="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-violet-400 border-2 border-slate-900 ring-1 ring-violet-300 shadow-[0_0_8px_rgba(167,139,250,1)] z-20"></span>
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-6 h-6 lg:w-7 lg:h-7 rounded-lg bg-violet-500/15 border border-violet-400/30 flex items-center justify-center text-violet-400 shrink-0 group-hover:scale-110 transition-transform">
                        <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div class="min-w-0">
                        <p class="text-[11px] lg:text-xs font-bold text-white flex items-center gap-1">
                          <span>Makassar</span>
                          <span class="text-[8.5px] lg:text-[9px] text-violet-400 font-normal">(Sulsel)</span>
                        </p>
                        <p class="text-[8px] lg:text-[9px] text-violet-300/90 font-mono font-semibold truncate">Klasifikasi PS</p>
                      </div>
                    </div>
                  </div>

                  <!-- 4. Palembang -->
                  <div class="relative py-1.5 lg:py-2 px-2.5 lg:px-3 rounded-xl bg-slate-950/95 border border-orange-700/40 hover:border-orange-400/70 transition group shadow-md flex items-center justify-between gap-2">
                    <span class="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-orange-400 border-2 border-slate-900 ring-1 ring-orange-300 shadow-[0_0_8px_rgba(251,146,60,1)] z-20"></span>
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-6 h-6 lg:w-7 lg:h-7 rounded-lg bg-orange-500/15 border border-orange-400/30 flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-110 transition-transform">
                        <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div class="min-w-0">
                        <p class="text-[11px] lg:text-xs font-bold text-white flex items-center gap-1">
                          <span>Palembang</span>
                          <span class="text-[8.5px] lg:text-[9px] text-orange-400 font-normal">(Sumsel)</span>
                        </p>
                        <p class="text-[8px] lg:text-[9px] text-orange-300/90 font-mono font-semibold truncate">Klasifikasi PS</p>
                      </div>
                    </div>
                  </div>

                </div><!-- end 4 cabang stack -->

              </div>
            </div>

            <!-- ======================================================== -->
            <!-- TAMPILAN 2: MOBILE / SMARTPHONE (VERTICAL STEPPER PIPELINE)-->
            <!-- Aktif khusus pada layar kecil di bawah 768px (< md)      -->
            <!-- ======================================================== -->
            <div class="block md:hidden w-full py-2 space-y-2">

              <!-- KARTU 1 (ATAS): KANTOR PUSAT JAKARTA -->
              <div class="relative rounded-2xl bg-slate-950/95 border border-slate-800 p-4 text-center shadow-lg">
                <div class="mx-auto w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-sky-400 shadow-inner">
                  <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
                    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
                    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                    <path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
                  </svg>
                </div>
                <p class="mt-2 text-sm font-black text-white leading-tight">
                  Kantor Pusat <span class="text-sky-300">Jakarta</span>
                </p>
                <p class="mt-1 text-[10.5px] text-amber-400 font-extrabold flex items-center justify-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  Otoritas Manajemen, SPM &amp; Divtek
                </p>
                <span class="mt-1.5 inline-block px-3 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[9px] font-mono text-slate-300 font-semibold">
                  Alokasi NoLap Kemenkeu &bull; Otorisasi 5-Tier
                </span>
              </div>

              <!-- KONEKTOR 1 TURUN: Pusat -> Core (GERBANG 1) -->
              <div class="h-14 w-full relative flex items-center justify-center pointer-events-none my-0.5">
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
                  <span class="px-3 py-1 rounded-full bg-slate-950 border border-sky-400/70 text-[10px] font-mono font-black text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.35)] flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-arrow-down text-sky-400 text-xs animate-bounce"></i>
                    <span>Gerbang 1: JO &amp; SPK</span>
                  </span>
                </div>
                <svg class="h-full w-8 overflow-visible" viewBox="0 0 32 60" fill="none">
                  <path d="M 16 0 L 16 60" stroke="#38bdf8" stroke-width="2.5" stroke-opacity="0.4" stroke-linecap="round"/>
                  <path d="M 16 0 L 16 60" pathLength="100" stroke="#ffffff" stroke-width="3" stroke-linecap="round" class="animate-cloud-flow" filter="url(#whitePulseGlow)"/>
                </svg>
              </div>

              <!-- KARTU 2 (TENGAH): OPINI NSR CORE ENGINE -->
              <div class="relative rounded-2xl bg-gradient-to-br from-amber-500/15 via-sky-600/15 to-slate-950 border-2 border-sky-400/60 p-4 text-center shadow-xl animate-cloud-glow">
                <div class="mx-auto w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-sky-500/30 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-inner">
                  <i class="fa-solid fa-shield-halved text-lg animate-pulse text-amber-400"></i>
                </div>
                <p class="mt-2 text-sm font-black text-amber-300 uppercase tracking-wide">
                  OPINI NSR Core Engine
                </p>
                <p class="text-[10px] text-sky-200 font-mono font-bold mt-0.5">
                  Dual-Gate Governance &amp; Control Tower
                </p>
                <span class="mt-2 inline-block px-3 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-[9px] font-mono text-amber-300 font-semibold">
                  Kemenkeu eLSa &bull; Audit Trail Terpadu
                </span>
              </div>

              <!-- KONEKTOR 2 TURUN: Core -> Cabang (GERBANG 2) -->
              <div class="h-14 w-full relative flex items-center justify-center pointer-events-none my-0.5">
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
                  <span class="px-3 py-1 rounded-full bg-slate-950 border border-emerald-400/70 text-[10px] font-mono font-black text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.35)] flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-arrow-down text-emerald-400 text-xs animate-bounce"></i>
                    <span>Gerbang 2: SPM &amp; Review</span>
                  </span>
                </div>
                <svg class="h-full w-8 overflow-visible" viewBox="0 0 32 60" fill="none">
                  <path d="M 16 0 L 16 60" stroke="#10b981" stroke-width="2.5" stroke-opacity="0.4" stroke-linecap="round"/>
                  <path d="M 16 0 L 16 60" pathLength="100" stroke="#10b981" stroke-width="3" stroke-linecap="round" class="animate-cloud-flow" filter="url(#whitePulseGlow)"/>
                </svg>
              </div>

              <!-- KARTU 3 (BAWAH): 4 KANTOR CABANG OPERASIONAL (GRID 2 x 2) -->
              <div class="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-3.5 space-y-2.5 shadow-lg">
                <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span class="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider">4 Kantor Cabang Operasional</span>
                  </div>
                  <span class="text-[9px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Pelaksana Penugasan</span>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <!-- Bandung -->
                  <div class="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 shadow flex flex-col justify-between min-h-[64px]">
                    <div class="flex items-center justify-between gap-1">
                      <span class="text-xs font-black text-white">Bandung</span>
                      <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">P</span>
                    </div>
                    <p class="text-[9.5px] text-slate-400">Jawa Barat</p>
                    <p class="text-[8.5px] font-mono text-emerald-400/90 font-medium truncate">Klasifikasi P</p>
                  </div>

                  <!-- Padang -->
                  <div class="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 shadow flex flex-col justify-between min-h-[64px]">
                    <div class="flex items-center justify-between gap-1">
                      <span class="text-xs font-black text-white">Padang</span>
                      <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">PS</span>
                    </div>
                    <p class="text-[9.5px] text-slate-400">Sumatera Barat</p>
                    <p class="text-[8.5px] font-mono text-amber-400/90 font-medium truncate">Klasifikasi PS</p>
                  </div>

                  <!-- Makassar -->
                  <div class="p-2.5 rounded-xl bg-slate-900/90 border border-violet-500/30 shadow flex flex-col justify-between min-h-[64px]">
                    <div class="flex items-center justify-between gap-1">
                      <span class="text-xs font-black text-white">Makassar</span>
                      <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/40">PS</span>
                    </div>
                    <p class="text-[9.5px] text-slate-400">Sulawesi Selatan</p>
                    <p class="text-[8.5px] font-mono text-violet-400/90 font-medium truncate">Klasifikasi PS</p>
                  </div>

                  <!-- Palembang -->
                  <div class="p-2.5 rounded-xl bg-slate-900/90 border border-orange-500/30 shadow flex flex-col justify-between min-h-[64px]">
                    <div class="flex items-center justify-between gap-1">
                      <span class="text-xs font-black text-white">Palembang</span>
                      <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">PS</span>
                    </div>
                    <p class="text-[9.5px] text-slate-400">Sumatera Selatan</p>
                    <p class="text-[8.5px] font-mono text-orange-400/90 font-medium truncate">Klasifikasi PS</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- Tombol Aksi Navigasi Bawah (Bersih, Responsif & Terfokus) -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-4 border-t border-slate-800">
              <!-- Status Sistem Terintegrasi -->
              <div class="flex items-center gap-2.5 text-slate-400 text-[11px] sm:text-xs font-mono justify-center sm:justify-start text-center sm:text-left">
                <span class="relative flex h-2 w-2 shrink-0">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span class="text-slate-300 font-medium">Sistem Tata Kelola Mutu &amp; Operasional Terintegrasi 5 Kantor Wilayah</span>
              </div>

              <!-- Tombol Aksi Utama Tunggal -->
              <button type="button" onclick="bukaModalPortal()" 
                 class="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                <svg class="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>Masuk OPINI NSR (Portal Internal) &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

`;

// Perform the replacement
html = html.slice(0, startIndex) + cleanDiagramContent + html.slice(endIndex);

// Also remove toggleExtraMutu function definition
const fnToggle = `    // Toggle 4 Pilar Sistem Pengendalian Mutu & SOP
    function toggleExtraMutu() {
      const el = document.getElementById('mutu-extra-container');
      const txt = document.getElementById('txt-toggle-extra-mutu');
      const icon = document.getElementById('icon-toggle-extra-mutu');
      if (!el) return;
      const isHidden = el.classList.contains('hidden');
      if (isHidden) {
        el.classList.remove('hidden');
        if (txt) txt.textContent = 'Sembunyikan Pilar Tata Kelola Mutu';
        if (icon) icon.innerHTML = '&uarr;';
      } else {
        el.classList.add('hidden');
        if (txt) txt.textContent = 'Lihat 4 Level SPM & Portal Operasional';
        if (icon) icon.innerHTML = '&darr;';
      }
    }`;

// Replace function if present
if (html.includes('function toggleExtraMutu()')) {
  // Replace the function block cleanly
  html = html.replace(/function toggleExtraMutu\(\)[\s\S]*?^\s*\}/m, '/* function toggleExtraMutu removed (clean UI) */');
  console.log('✔ Function toggleExtraMutu successfully removed.');
}

fs.writeFileSync(INDEX_PATH, html, 'utf8');
console.log('✔ index.html successfully updated with clean Dual-Layout diagram and single CTA!');
