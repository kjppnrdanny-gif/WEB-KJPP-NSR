import fs from 'fs';

function cleanModeB(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');

  // Ganti Card Mode B
  const oldCard = `<div class="flex items-center gap-2 text-emerald-300 font-extrabold text-xs">
                    <span>📋 MODE B: NOMOR DEFINITIF RESMI CABANG</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">Otorisasi PIN</span>
                  </div>
                  <p class="text-[11px] text-slate-300 mt-1">
                    Penerbitan nomor laporan definitif resmi (7 Segmen Kemenkeu) dengan verifikasi PIN Admin Cabang &amp; integrasi pengawasan.
                  </p>
                  <p class="text-[10px] font-mono text-emerald-400 mt-1">Format: [NO]/2.0160-[CBG]/[JASA]/[IND]/[IZIN]/[SERI]/[WKT]</p>
                </div>
                <button type="button" onclick="bukaModalPinAdminCabang()" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs tracking-wide shadow-lg shadow-emerald-900/30 transition cursor-pointer flex items-center justify-center gap-2">
                  <span>📋 Terbitkan Nomor Laporan Definitif Cabang &rarr;</span>
                </button>`;

  const newCard = `<div class="flex items-center gap-2 text-teal-300 font-extrabold text-xs">
                    <span>📋 MODE B: NOMOR DEFINITIF RESMI CABANG</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-mono">SOP 2026 Terpadu</span>
                  </div>
                  <p class="text-[11px] text-slate-300 mt-1">
                    Penerbitan nomor laporan definitif resmi (7 Segmen Kemenkeu) disinkronkan melalui register server terverifikasi untuk mencegah duplikasi nomor laporan antar kantor.
                  </p>
                  <p class="text-[10px] font-mono text-teal-400 mt-1">Format: [NO]/2.0160-[CBG]/[JASA]/[IND]/[IZIN]/[SERI]/[WKT]</p>
                </div>
                <button type="button" onclick="bukaModalKebijakanDefinitif()" class="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-teal-500/40 text-teal-300 font-black text-xs tracking-wide shadow-lg transition cursor-pointer flex items-center justify-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>📋 Ketentuan Penerbitan NoLap Definitif (SOP 2026) &rarr;</span>
                </button>`;

  if (c.includes(oldCard)) {
    c = c.replace(oldCard, newCard);
    console.log(`✔ [${filePath}] Card Mode B dibersihkan.`);
  }

  // Hapus blok legacy di JS
  const legacyBlockRegex = /function _legacyBukaModalPinAdminCabangDisabled\(\)[\s\S]*?function tutupModalPinAdminCabang\(\)\s*\{\s*const modal = document\.getElementById\('modal-pin-admin-cabang'\);\s*if \(modal\) modal\.classList\.add\('hidden'\);\s*\}/;

  if (legacyBlockRegex.test(c)) {
    c = c.replace(legacyBlockRegex, '');
    console.log(`✔ [${filePath}] Blok legacy JS dibersihkan.`);
  }

  fs.writeFileSync(filePath, c, 'utf8');
}

cleanModeB('portal-nolap-cabang.html');
cleanModeB('dist/portal-nolap-cabang.html');
