import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. UPDATE SECTION 01 HTML (Add sub-badges for branch applicant)
const oldSection01 = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Kantor Wilayah Operasional <span class="text-rose-400">*</span></label>
              <select id="kantor_wilayah" required onchange="handleWilayahChange()" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-amber-400">
                <option value="Kantor Pusat Jakarta">Kantor Pusat Jakarta</option>
                <option value="Kantor Cabang Bandung">Kantor Cabang Bandung</option>
                <option value="Kantor Cabang Padang">Kantor Cabang Padang</option>
                <option value="Kantor Cabang Makassar">Kantor Cabang Makassar</option>
                <option value="Kantor Cabang Palembang">Kantor Cabang Palembang</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Tanggal Surat / SPK <span class="text-rose-400">*</span></label>
              <input type="date" id="tanggal_surat" required onchange="updateTanggalOtomatis()" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-amber-400">
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Jenis Laporan Penilaian <span class="text-rose-400">*</span></label>
              <select id="jenis_laporan" required onchange="handleJenisLaporanChange()" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-amber-400">
                <option value="APP" selected>Long Report — Kode: PN-APP (Laporan Lengkap)</option>
                <option value="RTL">Short Report — Kode: PN-RTL (Laporan Ringkas / Retail)</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">No. Lingkup Penugasan (SPK)</label>
              <input type="text" id="no_lingkup_penugasan" data-alias="nomor_lp" placeholder="Nomor Lingkup Penugasan" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400 transition">
              <div id="helper-nomor-terakhir" class="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                <span>ℹ️ Terakhir: <strong id="helper-last-seq" class="font-mono text-amber-400">[0415]</strong></span>
                <span>• Saran: <strong id="helper-next-seq" class="font-mono text-emerald-400">[0416]</strong></span>
                <button type="button" id="btn-gunakan-saran" onclick="terapkanSaranNomorUrut()" class="ml-1 px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold transition">Gunakan 0416</button>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">No. Adm Job Order (JO)</label>
              <input type="text" id="no_adm_jo" data-alias="nomor_adm" placeholder="Nomor Adm Job Order" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sky-300 font-mono font-bold focus:outline-none focus:border-amber-400 transition">
            </div>
          </div>`;

const newSection01 = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Kantor Wilayah Operasional <span class="text-rose-400">*</span></label>
              <select id="kantor_wilayah" required onchange="handleWilayahChange()" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-amber-400">
                <option value="Kantor Pusat Jakarta">Kantor Pusat Jakarta</option>
                <option value="Kantor Cabang Bandung">Kantor Cabang Bandung</option>
                <option value="Kantor Cabang Padang">Kantor Cabang Padang</option>
                <option value="Kantor Cabang Makassar">Kantor Cabang Makassar</option>
                <option value="Kantor Cabang Palembang">Kantor Cabang Palembang</option>
              </select>
              <p id="sub-wilayah-info" class="text-[10px] text-amber-400/80 mt-1 hidden">ℹ️ Wilayah penerbitan ditetapkan Admin Pusat saat Approval</p>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Tanggal Surat / SPK <span class="text-rose-400">*</span></label>
              <input type="date" id="tanggal_surat" required onchange="updateTanggalOtomatis()" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-amber-400">
              <p id="sub-tanggal-info" class="text-[10px] text-amber-400/80 mt-1 hidden">ℹ️ Tanggal SPK resmi ditetapkan Admin Pusat saat Approval</p>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Jenis Laporan Penilaian <span class="text-rose-400">*</span></label>
              <select id="jenis_laporan" required onchange="handleJenisLaporanChange()" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-amber-400">
                <option value="APP" selected>Long Report — Kode: PN-APP (Laporan Lengkap)</option>
                <option value="RTL">Short Report — Kode: PN-RTL (Laporan Ringkas / Retail)</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">No. Lingkup Penugasan (SPK)</label>
              <input type="text" id="no_lingkup_penugasan" data-alias="nomor_lp" placeholder="Nomor Lingkup Penugasan" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400 transition">
              <div id="helper-nomor-terakhir" class="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                <span>ℹ️ Terakhir: <strong id="helper-last-seq" class="font-mono text-amber-400">[0415]</strong></span>
                <span>• Saran: <strong id="helper-next-seq" class="font-mono text-emerald-400">[0416]</strong></span>
                <button type="button" id="btn-gunakan-saran" onclick="terapkanSaranNomorUrut()" class="ml-1 px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold transition">Gunakan 0416</button>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">No. Adm Job Order (JO)</label>
              <input type="text" id="no_adm_jo" data-alias="nomor_adm" placeholder="Nomor Adm Job Order" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sky-300 font-mono font-bold focus:outline-none focus:border-amber-400 transition">
            </div>
          </div>`;

if (!content.includes(oldSection01)) {
  console.error('Could not find oldSection01 verbatim!');
  process.exit(1);
}
content = content.replace(oldSection01, newSection01);
console.log('Section 01 HTML updated.');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Wrote Section 01 update.');
