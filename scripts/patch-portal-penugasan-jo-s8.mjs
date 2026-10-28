import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production');
const filePath = path.join(projectRoot, 'portal-penugasan-jo.html');
let html = fs.readFileSync(filePath, 'utf8');

// Normalize line endings for replacement operations
const isCrlf = html.includes('\r\n');
let norm = html.replace(/\r\n/g, '\n');

// 1. Replace Section 08 Radios with 6-parameter Card & Roster
const s8Regex = /<!-- Pilihan Penilai Publik Ditunjuk -->[\s\S]*?<\/label>\s*<\/div>\s*<\/div>/;

const s8Replacement = `<!-- 8.1 PENUNJUKAN PENILAI PUBLIK PENANGGUNG JAWAB & VALIDASI KELAYAKAN PROFESIONAL -->
          <div class="space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label class="block font-bold text-amber-300 text-xs tracking-wide">
                Penilai Publik Penanggung Jawab Laporan (SSOT 5 Rekan) <span class="text-rose-400">*</span>
              </label>
              <span class="text-[10px] text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                🔗 Terhubung Sinkron Dua Arah dengan Section 05
              </span>
            </div>

            <!-- Kartu Validasi Kelayakan Profesional (Inherited dari Section 05) -->
            <div id="g1-selected-penilai-card" class="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/50 space-y-2.5 shadow-md">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span class="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Penilai Diusulkan (Section 05):</span>
                  <strong id="g1-display-penilai-nama" class="text-white text-xs sm:text-sm font-black">-</strong>
                </div>
                <div class="flex items-center gap-1.5">
                  <span id="g1-display-penilai-klasifikasi-badge" class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Klasifikasi: P
                  </span>
                  <span id="g1-display-penilai-kantor-badge" class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    Kantor Pusat
                  </span>
                </div>
              </div>

              <!-- Matriks 6 Parameter Kelayakan Profesional -->
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-[10px] font-mono">
                <div class="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span class="text-slate-400 block">Izin Kemenkeu</span>
                  <strong id="g1-val-izin" class="text-sky-300 font-bold block truncate">-</strong>
                  <span class="text-[9px] text-emerald-400 font-bold">✔ Aktif / Valid</span>
                </div>
                <div class="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span class="text-slate-400 block">Klasifikasi Jasa</span>
                  <strong id="g1-val-klasifikasi" class="text-amber-300 font-bold block truncate">-</strong>
                  <span id="g1-val-klasifikasi-status" class="text-[9px] text-emerald-400 font-bold">✔ Sesuai Objek</span>
                </div>
                <div class="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span class="text-slate-400 block">No. RMK &amp; MAPPI</span>
                  <strong id="g1-val-rmk-mappi" class="text-slate-200 font-bold block truncate">-</strong>
                  <span class="text-[9px] text-emerald-400 font-bold">✔ Terdaftar Asosiasi</span>
                </div>
                <div class="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span class="text-slate-400 block">Independensi SPI 103</span>
                  <strong id="g1-val-independensi" class="text-emerald-300 font-bold block">BEBAS KONFLIK</strong>
                  <span class="text-[9px] text-emerald-400 font-bold">✔ KEPI Butir 3</span>
                </div>
                <div class="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span class="text-slate-400 block">Kewenangan TTD</span>
                  <strong id="g1-val-kewenangan" class="text-purple-300 font-bold block truncate">Pusat &amp; Cabang</strong>
                  <span class="text-[9px] text-purple-400 font-bold">✔ Mandat Sah</span>
                </div>
                <div class="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span class="text-slate-400 block">Beban Penugasan</span>
                  <strong id="g1-val-beban" class="text-teal-300 font-bold block">Optimal</strong>
                  <span class="text-[9px] text-teal-400 font-bold">✔ Jadwal Tersedia</span>
                </div>
              </div>

              <!-- Baris Alert Kelayakan / Catatan Regulasi Khusus -->
              <div id="g1-kelayakan-alert-box" class="hidden p-2 rounded-lg bg-amber-950/40 border border-amber-600/50 text-[11px] text-amber-200 flex items-start gap-2">
                <span class="text-amber-400 text-sm">⚠️</span>
                <span id="g1-kelayakan-alert-text">Catatan regulasi kelayakan.</span>
              </div>
            </div>

            <!-- Daftar Lengkap Kelima Kandidat Penilai Publik (Two-Way Binding & Penjelasan Kualifikasi) -->
            <div class="pt-1">
              <span class="text-[11px] text-slate-300 font-semibold block mb-2">
                Daftar Kandidat 5 Penilai Publik Resmi KJPP NSR (Klik untuk memilih atau mengubah usulan):
              </span>
              <div id="g1-roster-penilai-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <!-- Di-render dinamis oleh renderRosterPenilaiPublik() -->
              </div>
            </div>
          </div>`;

if (s8Regex.test(norm)) {
  norm = norm.replace(s8Regex, s8Replacement);
  console.log('✔ Section 08 successfully replaced with 6-parameter card and 5-candidate roster');
} else {
  console.warn('✘ Could not match s8Regex');
}

// 2. Update vlookupRekan()
const vlookupRegex = /(function vlookupRekan\(\) \{[\s\S]*?document\.getElementById\('view_rekan_ojk'\)\.textContent = [^;]+;)(\s*\})/;
if (vlookupRegex.test(norm)) {
  norm = norm.replace(vlookupRegex, `$1\n      if (typeof syncSection05ToSection08 === 'function') syncSection05ToSection08();\n    }`);
  console.log('✔ vlookupRekan() updated to call syncSection05ToSection08()');
}

// 3. Unlock Section 05 in Mandiri mode
const unlockRegex1 = /selRekan\.innerHTML = `<option value="\$\{partner\.nama\}">\$\{partner\.nama\} \(\$\{partner\.jabatan\}\) - Terkunci Cabang<\/option>`;\s*selRekan\.value = partner\.nama;\s*selRekan\.disabled = true;\s*vlookupRekan\(\);/g;
norm = norm.replace(unlockRegex1, `populateDropdownRekan(partner?.nama);`);
console.log('✔ Unlocked branch locking on selRekan');

const unlockRegex2 = /selRekan\.innerHTML = `<option value="\$\{partner\.nama\}">\$\{partner\.nama\} \(\$\{partner\.jabatan\}\) - Terkunci Cabang<\/option>`;\s*selRekan\.value = partner\.nama;\s*selRekan\.disabled = true;/g;
norm = norm.replace(unlockRegex2, `populateDropdownRekan(partner?.nama);`);

norm = norm.replaceAll('selRekan.disabled = true;', 'selRekan.disabled = false;');

// 4. Update form submit to read selected partner
const submitRegex = /rekan_nama:\s*\(isPrivateCabang && branchPartner\)\s*\?\s*branchPartner\.nama\s*:\s*document\.getElementById\('rekan_nama'\)\.value,\s*rekan_izin:\s*\(isPrivateCabang && branchPartner\)\s*\?\s*\(branchPartner\.izin\s*\|\|\s*'P-1\.20\.00581'\)\s*:\s*\(rekanSelected\.izin\s*\|\|\s*'P-1\.20\.00581'\),/;

const submitReplacement = `rekan_nama: document.getElementById('rekan_nama')?.value || (rekanSelected.nama || 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert)'),
        rekan_izin: rekanSelected.izin || 'P-1.09.00218',
        penilai_publik_id: rekanSelected.id || 'nanang_penilai',
        penilai_publik_klasifikasi: rekanSelected.klasifikasi_kode || 'P',
        appraiser_license_code: rekanSelected.izin_segmen || '0218',`;

if (submitRegex.test(norm)) {
  norm = norm.replace(submitRegex, submitReplacement);
  console.log('✔ Updated form submit payload for Penilai Publik');
} else {
  console.warn('✘ Could not match submitRegex');
}

// Restore line endings if originally CRLF
const finalContent = isCrlf ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('✔ Saved portal-penugasan-jo.html');
