import fs from 'fs';
import path from 'path';

const projectRoot = 'd:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const htmlPath = path.join(projectRoot, 'portal-penugasan-jo.html');

console.log('Membaca portal-penugasan-jo.html...');
let html = fs.readFileSync(htmlPath, 'utf8');

function replaceExact(source, target, replacement) {
    const normSource = source.replace(/\r\n/g, '\n');
    const normTarget = target.replace(/\r\n/g, '\n');
    const normReplacement = replacement.replace(/\r\n/g, '\n');
    if (!normSource.includes(normTarget)) {
        throw new Error('Target text not found: ' + normTarget.substring(0, 60) + '...');
    }
    const res = normSource.replace(normTarget, normReplacement);
    return res.replace(/\n/g, '\r\n');
}

// 1. UPDATE TAB 1 MODE SWITCHER MARKUP (lines ~468-490)
const oldModeSwitcher = `        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- ALUR 1: Pengajuan Verifikasi ke Kantor Pusat -->
          <label id="label-mode-central" onclick="pilihModeAlur('CENTRAL_APPROVAL')" class="flex items-start gap-3 p-3.5 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-slate-600 cursor-pointer transition opacity-70">
            <input type="radio" name="radio_mode_alur" id="alur_kerja_pusat" value="CENTRAL" class="mt-1 text-amber-400 focus:ring-0">
            <div>
              <span id="title-mode-central" class="block text-xs font-black text-amber-300">ALUR 1: Pengajuan Verifikasi ke Kantor Pusat (Central Approval)</span>
              <span id="sub-mode-central" class="block text-[11px] text-slate-300 mt-1 leading-snug">Kolom nomor dikunci otomatis. Data dikirim ke Google Sheet Pusat dengan status <strong class="text-amber-400">WAITING_APPROVAL</strong> untuk diverifikasi &amp; diterbitkan nomor resmi oleh Admin Pusat.</span>
            </div>
          </label>

          <!-- ALUR 2: Penerbitan Mandiri Cabang (Kewenangan Rekan Pemimpin Cabang) -->
          <label id="label-mode-private" onclick="pilihModeAlur('PRIVATE_CABANG')" class="flex items-start gap-3 p-3.5 rounded-xl border-2 border-emerald-400 bg-emerald-950/30 cursor-pointer transition shadow">
            <input type="radio" name="radio_mode_alur" id="alur_kerja_mandiri" value="MANDIRI" checked class="mt-1 text-emerald-400 focus:ring-0">
            <div>
              <span id="title-mode-private" class="block text-xs font-black text-emerald-300 flex items-center gap-1.5">
                <span>ALUR 2: Penerbitan Mandiri Cabang (Kewenangan Rekan Pemimpin Cabang)</span>
                <span class="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Mandiri</span>
              </span>
              <span id="sub-mode-private" class="block text-[11px] text-slate-300 mt-1 leading-snug">Nomor SPK &amp; JO terbit instan dari buku register cabang, tersinkronisasi ke database cabang.</span>
            </div>
          </label>
        </div>`;

const newModeSwitcher = `        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- JALUR A: Penerbitan Mandiri Cabang (Kewenangan Rekan Pemimpin Cabang) -->
          <label id="label-mode-private" onclick="pilihModeAlur('PRIVATE_CABANG')" class="flex items-start gap-3 p-3.5 rounded-xl border-2 border-emerald-400 bg-emerald-950/30 cursor-pointer transition shadow">
            <input type="radio" name="radio_mode_alur" id="alur_kerja_mandiri" value="MANDIRI" checked class="mt-1 text-emerald-400 focus:ring-0">
            <div class="w-full">
              <div class="flex items-center justify-between gap-2">
                <span id="title-mode-private" class="block text-xs font-black text-emerald-300 flex items-center gap-1.5">
                  <span>JALUR A: Penerbitan Mandiri Cabang</span>
                </span>
                <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">Otorisasi Cabang</span>
              </div>
              <span id="sub-mode-private" class="block text-[11px] text-slate-300 mt-1 leading-snug">
                Penetapan nomor resmi langsung melalui buku register cabang berdasarkan kewenangan Pimpinan Cabang &amp; kompetensi Penilai Publik. Terbit sah dan tersimpan permanen di server.
              </span>
            </div>
          </label>

          <!-- JALUR B: Pengajuan Verifikasi ke Kantor Pusat (Central Approval) -->
          <label id="label-mode-central" onclick="pilihModeAlur('CENTRAL_APPROVAL')" class="flex items-start gap-3 p-3.5 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-slate-600 cursor-pointer transition opacity-70">
            <input type="radio" name="radio_mode_alur" id="alur_kerja_pusat" value="CENTRAL" class="mt-1 text-amber-400 focus:ring-0">
            <div class="w-full">
              <div class="flex items-center justify-between gap-2">
                <span id="title-mode-central" class="block text-xs font-black text-amber-300">JALUR B: Pengajuan ke Kantor Pusat</span>
                <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">Approval Pusat</span>
              </div>
              <span id="sub-mode-central" class="block text-[11px] text-slate-300 mt-1 leading-snug">
                Nomor dikunci otomatis. Permohonan masuk ke Meja Verifikasi &amp; Approval Admin Pusat (<strong class="text-amber-400">WAITING_APPROVAL</strong>). Nomor resmi diterbitkan setelah approval.
              </span>
            </div>
          </label>
        </div>

        <!-- Banner Dinamis Peringatan Kewenangan Profesional (PP vs PS) -->
        <div id="warning-kompetensi-cabang" class="hidden mt-3 p-3.5 rounded-xl border border-rose-500/50 bg-rose-950/40 text-rose-200 text-xs flex items-start gap-2.5 shadow-lg">
          <span class="text-xl shrink-0">⚠️</span>
          <div>
            <strong id="warning-kompetensi-title" class="font-bold text-rose-300">Peringatan Kewenangan Profesional Penilai Publik (PMK 101/2014 &amp; SPI 204):</strong>
            <p id="warning-kompetensi-text" class="mt-0.5 text-[11px] text-rose-200 leading-snug">
              Objek / Jasa penugasan ini berklasifikasi Komprehensif (non-sederhana) di luar batasan kewenangan Penilai Properti Sederhana (PS). Sesuai regulasi, penugasan ini <strong>WAJIB diajukan via JALUR B (Pengajuan ke Kantor Pusat)</strong> untuk penugasan Penilai Publik berizin Properti P (Ir. Nanang Rahayu / Deni Siswandi).
            </p>
          </div>
        </div>`;

html = replaceExact(html, oldModeSwitcher, newModeSwitcher);
console.log('✓ Mode switcher Tab 1 berhasil diperbarui!');

// 2. UPDATE TAB 2 FILTER (Add filter_jalur next to filter_status)
const oldTab2FilterStatus = `          <div>
            <label class="block text-[10px] text-slate-400 font-bold uppercase mb-1">Status &amp; Tenggat:</label>
            <select id="filter_status" onchange="tanganiGantiFilterStatus()" class="h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none">
              <option value="ALL">Semua Penugasan</option>
              <option value="AKTIF">Semua Aktif (Berjalan)</option>
              <option value="DEADLINE_NEAR">⏰ Mendekati Tenggat (H-3 s.d H-0)</option>
              <option value="OVERDUE">⚠️ Melewati Tenggat (Overdue)</option>
              <option value="SELESAI">✔ Penugasan Selesai</option>
              <option value="WAITING_APPROVAL">⏳ Menunggu Otorisasi Pusat</option>
              <option value="APPROVED">📄 Disetujui / SPK Terbit</option>
            </select>
          </div>`;

const newTab2FilterStatus = `          <div>
            <label class="block text-[10px] text-slate-400 font-bold uppercase mb-1">Status &amp; Tenggat:</label>
            <select id="filter_status" onchange="tanganiGantiFilterStatus()" class="h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none">
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">Semua Aktif (Berjalan)</option>
              <option value="DEADLINE_NEAR">⏰ Mendekati Tenggat (H-3 s.d H-0)</option>
              <option value="OVERDUE">⚠️ Melewati Tenggat (Overdue)</option>
              <option value="SELESAI">✔ Penugasan Selesai</option>
              <option value="WAITING_APPROVAL">⏳ Menunggu Otorisasi Pusat</option>
              <option value="APPROVED">📄 Disetujui / SPK Terbit</option>
            </select>
          </div>

          <!-- Filter Jalur Penerbitan Resmi -->
          <div>
            <label class="block text-[10px] text-slate-400 font-bold uppercase mb-1">Jalur Penerbitan:</label>
            <select id="filter_jalur" onchange="renderDashboardTabel()" class="h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none">
              <option value="ALL">Semua Jalur (Mandiri &amp; Pusat)</option>
              <option value="MANDIRI_CABANG">⚡ Jalur A: Mandiri Cabang</option>
              <option value="PENGAJUAN_PUSAT">⏳ Jalur B: Pengajuan Pusat</option>
            </select>
          </div>`;

html = replaceExact(html, oldTab2FilterStatus, newTab2FilterStatus);
console.log('✓ Tab 2 filter jalur berhasil ditambahkan!');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✓ File portal-penugasan-jo.html tahap 1 disimpan!');
