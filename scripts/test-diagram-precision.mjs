import fs from 'node:fs';

const PREVIEW_FILE = 'preview-diagram-opini-nsr.html';
let html = fs.readFileSync(PREVIEW_FILE, 'utf8');

// The new desktop diagram markup
const desktopDiagram = `
      <!-- ======================================================== -->
      <!-- TAMPILAN 1: DESKTOP & TABLET (HORIZONTAL SVG MINDMAP)     -->
      <!-- Aktif pada breakpoint md ke atas (>= 768px)               -->
      <!-- ======================================================== -->
      <div class="hidden md:block w-full py-6">
        <div class="w-full grid grid-cols-[26%_8%_32%_8%_26%] items-center relative z-10 gap-0">

          <!-- NODE KIRI: KANTOR PUSAT JAKARTA (w-[26%]) -->
          <div class="relative rounded-2xl bg-slate-950/95 border border-slate-800 hover:border-sky-400/60 p-3 lg:p-4 text-center transition group shadow-xl flex flex-col justify-center min-h-[140px]">
            <span class="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-slate-900 ring-2 ring-blue-400/80 shadow-[0_0_12px_rgba(59,130,246,1)] z-20"></span>
            
            <div class="mx-auto w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform shadow-inner mb-1.5">
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
                <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                <path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
              </svg>
            </div>
            
            <p class="text-xs lg:text-sm font-black text-white leading-tight">
              Kantor Pusat<br><span class="text-sky-300">Jakarta</span>
            </p>
            
            <p class="mt-1 text-[9.5px] text-amber-400 font-extrabold flex items-center justify-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Otoritas Manajemen, SPM &amp; Divtek
            </p>

            <span class="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-[8px] font-mono text-slate-300 font-semibold truncate">
              Alokasi NoLap Kemenkeu &bull; Otorisasi 5-Tier
            </span>
          </div>

          <!-- KONEKTOR KIRI: Pusat ↔ Core (w-[8%]) -->
          <div class="h-36 w-full relative flex items-center justify-center overflow-visible pointer-events-none">
            <!-- Label Gerbang 1: JO & SPK (Simetris Sejajar) -->
            <div id="badge-gerbang-1" class="absolute top-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide bg-slate-950/95 text-teal-300 border border-teal-500/50 shadow-[0_0_12px_rgba(20,184,166,0.3)] whitespace-nowrap">
                <span class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
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

          <!-- NODE TENGAH: OPINI NSR CORE ENGINE (w-[32%]) DENGAN LOGO RESMI -->
          <div class="relative rounded-2xl bg-gradient-to-br from-amber-500/15 via-sky-600/15 to-slate-950 border-2 border-sky-400/60 p-3.5 lg:p-4 text-center shadow-2xl animate-cloud-glow flex flex-col justify-center min-h-[140px]">
            <span class="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-sky-400 border-2 border-slate-900 ring-2 ring-sky-300 shadow-[0_0_12px_rgba(56,189,248,1)] z-20"></span>
            <span class="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-900 ring-2 ring-amber-300 shadow-[0_0_12px_rgba(245,158,11,1)] z-20"></span>
            
            <!-- Logo Resmi KJPP NSR (Bukan Placeholder Kosong) -->
            <div class="flex items-center justify-center mb-2">
              <img src="logo-nsr.png" 
                   alt="Logo Resmi KJPP NSR" 
                   class="h-9 w-auto max-w-[110px] object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]"
                   onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden');">
              <!-- Inline SVG Emblem Fallback Resmi -->
              <svg class="hidden h-8 w-auto drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]" viewBox="0 0 160 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="nsrCoreBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#38bdf8" />
                    <stop offset="50%" stop-color="#2563eb" />
                    <stop offset="100%" stop-color="#0b1b4f" />
                  </linearGradient>
                  <filter id="neonCoreGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#ef4444" flood-opacity="0.9"/>
                  </filter>
                </defs>
                <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="50" letter-spacing="1" fill="none" stroke="#ef4444" stroke-width="7" stroke-linejoin="round" filter="url(#neonCoreGlow)">NSR</text>
                <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="50" letter-spacing="1" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linejoin="round">NSR</text>
                <text x="4" y="44" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="50" letter-spacing="1" fill="url(#nsrCoreBlue)">NSR</text>
              </svg>
            </div>
            
            <!-- Tipografi Presisi Core Engine Sesuai Instruksi -->
            <p class="text-xs font-black tracking-wider text-amber-400 uppercase leading-snug">
              OPINI NSR CORE ENGINE
            </p>
            <p class="text-[10.5px] text-slate-300 font-medium block mt-1">
              Dual-Gate Governance &amp; Control Tower
            </p>
            <div>
              <span class="px-2.5 py-1 text-[9.5px] font-mono text-amber-300/90 bg-amber-950/40 border border-amber-800/40 rounded-lg inline-block mt-2">
                Kemenkeu eLSa &bull; Audit Trail Terpadu
              </span>
            </div>
          </div>

          <!-- KONEKTOR KANAN: Core ↔ 4 Cabang (w-[8%]) -->
          <div class="h-48 sm:h-52 w-full relative flex items-center justify-center overflow-visible pointer-events-none">
            <!-- Label Gerbang 2: SPM & Review (Simetris & Sejajar Presisi dengan Gerbang 1) -->
            <div id="badge-gerbang-2" class="absolute top-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide bg-slate-950/95 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)] whitespace-nowrap">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
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

          <!-- NODE KANAN: 4 KANTOR CABANG OPERASIONAL (w-[26%]) BEBAS TERPOTONG -->
          <div class="flex flex-col gap-2 relative z-10 min-w-[130px]">

            <!-- 1. Bandung -->
            <div class="relative py-1.5 px-2.5 rounded-xl bg-slate-950/95 border border-emerald-700/40 hover:border-emerald-400/70 transition group shadow-md flex items-center gap-2 min-w-0">
              <span class="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 ring-1 ring-emerald-300 shadow-[0_0_8px_rgba(52,211,153,1)] z-20"></span>
              <div class="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="min-w-0 flex-1 leading-tight">
                <p class="text-xs font-bold text-white whitespace-nowrap">Bandung</p>
                <span class="text-[9.5px] font-mono text-emerald-400 font-semibold block mt-0.5">Klasifikasi P</span>
              </div>
            </div>

            <!-- 2. Padang -->
            <div class="relative py-1.5 px-2.5 rounded-xl bg-slate-950/95 border border-amber-700/40 hover:border-amber-400/70 transition group shadow-md flex items-center gap-2 min-w-0">
              <span class="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-slate-900 ring-1 ring-amber-300 shadow-[0_0_8px_rgba(251,191,36,1)] z-20"></span>
              <div class="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="min-w-0 flex-1 leading-tight">
                <p class="text-xs font-bold text-white whitespace-nowrap">Padang</p>
                <span class="text-[9.5px] font-mono text-amber-400 font-semibold block mt-0.5">Klasifikasi PS</span>
              </div>
            </div>

            <!-- 3. Makassar -->
            <div class="relative py-1.5 px-2.5 rounded-xl bg-slate-950/95 border border-violet-700/40 hover:border-violet-400/70 transition group shadow-md flex items-center gap-2 min-w-0">
              <span class="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-violet-400 border-2 border-slate-900 ring-1 ring-violet-300 shadow-[0_0_8px_rgba(167,139,250,1)] z-20"></span>
              <div class="w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-400/30 flex items-center justify-center text-violet-400 shrink-0 group-hover:scale-110 transition-transform">
                <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="min-w-0 flex-1 leading-tight">
                <p class="text-xs font-bold text-white whitespace-nowrap">Makassar</p>
                <span class="text-[9.5px] font-mono text-violet-400 font-semibold block mt-0.5">Klasifikasi PS</span>
              </div>
            </div>

            <!-- 4. Palembang -->
            <div class="relative py-1.5 px-2.5 rounded-xl bg-slate-950/95 border border-orange-700/40 hover:border-orange-400/70 transition group shadow-md flex items-center gap-2 min-w-0">
              <span class="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-orange-400 border-2 border-slate-900 ring-1 ring-orange-300 shadow-[0_0_8px_rgba(251,146,60,1)] z-20"></span>
              <div class="w-6 h-6 rounded-lg bg-orange-500/15 border border-orange-400/30 flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-110 transition-transform">
                <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="min-w-0 flex-1 leading-tight">
                <p class="text-xs font-bold text-white whitespace-nowrap">Palembang</p>
                <span class="text-[9.5px] font-mono text-orange-400 font-semibold block mt-0.5">Klasifikasi PS</span>
              </div>
            </div>

          </div><!-- end 4 cabang stack -->

        </div>
      </div>
`;

// Replace in preview-diagram-opini-nsr.html
const startComment = '<!-- ======================================================== -->\n      <!-- TAMPILAN 1: DESKTOP & TABLET (HORIZONTAL SVG MINDMAP)';
const endComment = '<!-- ======================================================== -->\n      <!-- TAMPILAN 2: MOBILE / SMARTPHONE';

const sIdx = html.indexOf(startComment);
const eIdx = html.indexOf(endComment);

if (sIdx !== -1 && eIdx !== -1) {
  html = html.slice(0, sIdx) + desktopDiagram.trim() + '\n\n      ' + html.slice(eIdx);
  fs.writeFileSync(PREVIEW_FILE, html, 'utf8');
  console.log('✔ preview-diagram-opini-nsr.html updated with precision diagram!');
} else {
  console.error('Could not find comment boundaries in preview file');
}
