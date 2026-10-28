// scripts/clean-index-tracking.mjs
import fs from 'fs';

const filePath = 'index.html';
let html = fs.readFileSync(filePath, 'utf8');

// 1. Remove "Contoh Penugasan" block
const contohRegex = /<div class="flex items-center gap-2 mt-1\.5 text-\[10px\] text-slate-400">[\s\S]*?<\/div>/;
if (contohRegex.test(html)) {
  html = html.replace(contohRegex, '');
  console.log('✓ Removed Contoh Penugasan block from hero widget.');
} else {
  console.warn('⚠️ Contoh Penugasan block not matched by regex.');
}

// 2. Clean input track-jo-input
html = html.replace(
  /<input type="text" id="track-jo-input"[^>]*>/,
  '<input type="text" id="track-jo-input" placeholder="Masukkan Nomor JO / Kode Lacak" value="" class="w-full rounded-xl border border-slate-700 bg-slate-950/90 pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 uppercase font-mono tracking-wider transition" required>'
);
console.log('✓ Cleaned track-jo-input (empty value, neutral placeholder).');

// 3. Clean input track-pic-input
html = html.replace(
  /<input type="text" id="track-pic-input"[^>]*>/,
  '<input type="tel" id="track-pic-input" placeholder="Nomor WhatsApp PIC Pemohon" value="" class="w-full rounded-xl border border-slate-700 bg-slate-950/90 pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 font-mono tracking-wider transition" required>'
);
console.log('✓ Cleaned track-pic-input (empty value, neutral placeholder).');

// 4. Remove isiContohPencarian function in JavaScript
html = html.replace(
  /\s*function isiContohPencarian[\s\S]*?window\.isiContohPencarian = isiContohPencarian;\s*/,
  '\n'
);
console.log('✓ Removed isiContohPencarian function.');

// 5. Update eksekusiLacakPenugasanPublik to validate inputs and not blindly fallback to mock
const oldEksekusiTarget = `      // Gunakan jobResult atau fallback ke Mock BTN\n      bukaModalTrackingPublik(jobResult || MOCK_BTN_JOB);`;
const newEksekusiReplacement = `      if (jobResult) {
        bukaModalTrackingPublik(jobResult);
      } else {
        alert("Status penugasan dengan Nomor JO / Kode Lacak atau Nomor WhatsApp tersebut tidak ditemukan.\\n\\nSilakan periksa kembali nomor Anda atau hubungi Admin Operasional KJPP NSR.");
      }`;

if (html.includes(oldEksekusiTarget)) {
  html = html.replace(oldEksekusiTarget, newEksekusiReplacement);
  console.log('✓ Updated eksekusiLacakPenugasanPublik validation and error handling.');
} else if (html.includes('bukaModalTrackingPublik(jobResult || MOCK_BTN_JOB);')) {
  html = html.replace(
    'bukaModalTrackingPublik(jobResult || MOCK_BTN_JOB);',
    newEksekusiReplacement
  );
  console.log('✓ Updated fallback in eksekusiLacakPenugasanPublik.');
}

// 6. Add "Manajemen Penugasan (7-Milestone)" to modal-portal cards if not already present
const cardTracking = `          <!-- KARTU 8: MANAJEMEN & REGISTRASI PENUGASAN (7-MILESTONE) -->
          <div id="kartu-tracking-wrapper" class="bg-slate-900/80 border border-amber-500/30 hover:border-amber-400/50 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md">
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <h4 class="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">Manajemen Penugasan (7-Milestone)</h4>
                    <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase shrink-0">Multi-Peran</span>
                  </div>
                  <p class="text-[11px] sm:text-xs text-slate-400 leading-normal line-clamp-1 mt-0.5">Registrasi SPK, Penunjukan Tim &amp; Kendali Mutu SPM</p>
                </div>
              </div>
              <a id="link-portal-tracking" href="portal-tracking.html" class="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl transition shrink-0 inline-flex items-center gap-1 shadow-sm shadow-amber-400/20">
                <span>Buka Task Board &nearr;</span>
              </a>
            </div>
          </div>`;

if (!html.includes('id="kartu-tracking-wrapper"')) {
  const insertBeforeMarker = '<!-- KARTU 7: PRESENSI KEHADIRAN ONLINE -->';
  if (html.includes(insertBeforeMarker)) {
    html = html.replace(insertBeforeMarker, cardTracking + '\n\n          ' + insertBeforeMarker);
    console.log('✓ Added Manajemen Penugasan card to modal-portal.');
  }
}

// 7. In stepper modal header, add Kode Lacak badge
if (!html.includes('pub-modal-kode-lacak')) {
  html = html.replace(
    '<p id="pub-modal-jo-number" class="text-base sm:text-lg font-black text-amber-300 font-mono tracking-wider">JO-JKT-2026-0001</p>',
    '<p id="pub-modal-jo-number" class="text-base sm:text-lg font-black text-amber-300 font-mono tracking-wider">JO-JKT-2026-0001</p>\n              <span id="pub-modal-kode-lacak" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">TRK-JKT-2026-A89F</span>'
  );
  html = html.replace(
    "document.getElementById('pub-modal-jo-number').textContent = job.jo_number || 'JO-JKT-2026-0001';",
    "document.getElementById('pub-modal-jo-number').textContent = job.jo_number || '-';\n      const elKode = document.getElementById('pub-modal-kode-lacak'); if (elKode) { elKode.textContent = job.kode_lacak ? ('Kode: ' + job.kode_lacak) : ''; elKode.style.display = job.kode_lacak ? 'inline-flex' : 'none'; }"
  );
  console.log('✓ Added Kode Lacak badge in stepper modal.');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('✓ index.html successfully cleaned and updated!');
