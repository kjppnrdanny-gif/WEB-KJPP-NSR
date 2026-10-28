import fs from 'fs';

const filePath = 'portal-nolap-dev.html';
let content = fs.readFileSync(filePath, 'utf8');
const eol = content.includes('\r\n') ? '\r\n' : '\n';

const bridgeHtml = `          <!-- AUTO-POPULATE BRIDGE: TARIK DATA DARI PENUGASAN (SPK / LINGKUP PENUGASAN) -->
          <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border border-amber-400/40 shadow-xl space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-black text-sm">
                  ⚡
                </div>
                <div>
                  <h3 class="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Tarik Data Otomatis dari Penugasan (Auto-Populate Bridge)</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">SPI 103 &amp; SPI 204</span>
                  </h3>
                  <p class="text-[11px] text-slate-400">Ketik Nomor SPK / No. Lingkup Penugasan / ID JO untuk sinkronisasi otomatis Klien, Pengguna Laporan, Objek, dan Dasar Nilai.</p>
                </div>
              </div>
              <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                🔗 Single Source of Truth
              </span>
            </div>

            <div class="flex flex-col sm:flex-row gap-2 pt-1">
              <div class="relative flex-1">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  🔍
                </div>
                <input type="text" id="input_cari_spk_bridge" onkeydown="if(event.key==='Enter'){event.preventDefault();tarikDataDariPenugasan();}" placeholder="Ketik No. SPK / No. Lingkup Penugasan (misal: 0416/NSR/PN-APP/X/2026 atau SPK/2026/099)..." class="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition">
              </div>
              <button type="button" onclick="tarikDataDariPenugasan()" id="btn_tarik_spk_bridge" class="h-11 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-amber-500/20 hover:scale-[1.01] transition cursor-pointer flex items-center justify-center gap-2 shrink-0">
                <svg class="w-4 h-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <span>Tarik Data</span>
              </button>
            </div>

            <!-- Status / Feedback Banner Tarik Data -->
            <div id="status_tarik_bridge" class="hidden text-xs rounded-xl p-3"></div>
          </div>
`.replace(/\r?\n/g, eol);

// Read bridgeJs from apply-clean-nolap-bridge.mjs
const nolapContent = fs.readFileSync('portal-nolap.html', 'utf8');
const jsMarker = '// AUTO-POPULATE BRIDGE: TARIK DATA DARI DB PENUGASAN (SPK / LINGKUP PENUGASAN)';
const jsStart = nolapContent.indexOf(jsMarker);
const jsEnd = nolapContent.lastIndexOf('</script>');
const extractedBridgeJs = nolapContent.slice(jsStart - 4, jsEnd);

// 1. Insert HTML
const targetAnchor = `<div class="border-b border-slate-800 pb-4">` + eol +
`            <h3 class="text-base font-extrabold text-white flex items-center gap-2">` + eol +
`              <span class="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black">A</span>`;

const anchorPos = content.indexOf(targetAnchor);
if (anchorPos === -1) {
  throw new Error('Could not find targetAnchor in portal-nolap-dev.html');
}

content = content.slice(0, anchorPos) + bridgeHtml + eol + '          ' + content.slice(anchorPos);

// 2. Insert JS before the last </script>
const lastScriptEnd = content.lastIndexOf('</script>');
if (lastScriptEnd === -1) {
  throw new Error('Could not find lastScriptEnd in portal-nolap-dev.html');
}

content = content.slice(0, lastScriptEnd) + extractedBridgeJs + eol + '  ' + content.slice(lastScriptEnd);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleanly updated portal-nolap-dev.html');
