import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(filePath, 'utf8');

// --- 1. PATCH SECTION 01 IN PORTAL-PENUGASAN-JO.HTML ---
const s1Search = `<select id="kantor_wilayah" required onchange="handleWilayahChange()" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-amber-400">
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
            </div>`;

const s1Replace = `<select id="kantor_wilayah" required onchange="handleWilayahChange()" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-amber-400">
                <option value="Kantor Pusat Jakarta">Kantor Pusat Jakarta</option>
                <option value="Kantor Cabang Bandung">Kantor Cabang Bandung</option>
                <option value="Kantor Cabang Padang">Kantor Cabang Padang</option>
                <option value="Kantor Cabang Makassar">Kantor Cabang Makassar</option>
                <option value="Kantor Cabang Palembang">Kantor Cabang Palembang</option>
              </select>
              <p id="sub-wilayah-info" class="text-[10.5px] text-amber-400/90 mt-1 hidden font-medium">ℹ️ Kantor Wilayah Penerbitan Ditetapkan oleh Admin Pusat saat Approval</p>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Tanggal Surat / SPK <span class="text-rose-400">*</span></label>
              <input type="date" id="tanggal_surat" required onchange="updateTanggalOtomatis()" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-amber-400">
              <p id="sub-tanggal-info" class="text-[10.5px] text-amber-400/90 mt-1 hidden font-medium">ℹ️ Tanggal Surat / SPK Resmi Ditetapkan oleh Admin Pusat saat Approval</p>
            </div>`;

// Replace CRLF-safe
function safeReplace(str, search, replacement) {
  const normStr = str.replace(/\r\n/g, '\n');
  const normSearch = search.replace(/\r\n/g, '\n');
  const normRepl = replacement.replace(/\r\n/g, '\n');
  if (!normStr.includes(normSearch)) {
    throw new Error('Search target not found in file!');
  }
  const result = normStr.replace(normSearch, normRepl);
  return result.replace(/\n/g, '\r\n');
}

content = safeReplace(content, s1Search, s1Replace);
console.log('Step 1: Section 01 HTML patched.');

// --- 2. PATCH MODAL APPROVAL PUSAT HTML ---
const modalOldFields = `<form id="form-approval-pusat" onsubmit="eksekusiApprovalPusatSubmit(event)" class="space-y-3.5">
          <input type="hidden" id="appr-target-project-id" value="">

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Jenis Laporan Penilaian <span class="text-rose-400">*</span></label>
            <select id="appr-jenis-laporan" onchange="handleApprovalJenisLaporanChange()" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-amber-400">
              <option value="APP">Long Report — Kode: PN-APP (Laporan Lengkap)</option>
              <option value="RTL">Short Report — Kode: PN-RTL (Laporan Ringkas / Retail)</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">No. Lingkup Penugasan (SPK) Resmi <span class="text-rose-400">*</span></label>
            <input type="text" id="appr-nomor-lp" required oninput="validasiApprovalDuplikatLive()" onblur="formatApprovalNomorInputOtomatis()" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400">
            <div class="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>ℹ️ Saran: <span id="appr-saran-seq" class="text-emerald-400 font-mono font-bold">0416</span></span>
              <button type="button" onclick="gunakanSaranApprovalNomor()" class="text-[10px] text-emerald-400 hover:underline font-mono">Gunakan Nomor Saran</button>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">No. Adm Job Order (JO) Resmi <span class="text-rose-400">*</span></label>
            <input type="text" id="appr-nomor-adm" required oninput="validasiApprovalDuplikatLive()" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-sky-300 font-mono font-bold focus:outline-none focus:border-amber-400">
          </div>`;

const modalNewFields = `<form id="form-approval-pusat" onsubmit="eksekusiApprovalPusatSubmit(event)" class="space-y-3.5">
          <input type="hidden" id="appr-target-project-id" value="">

          <!-- Section 01 Lengkap di Meja Approval Admin Pusat / KING -->
          <div class="p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 class="font-black text-amber-400 text-xs flex items-center gap-2">
                <span class="w-5 h-5 rounded bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">01</span>
                <span>Penetapan Wilayah, Tanggal &amp; Smart Register SPK/JO</span>
              </h4>
              <button type="button" onclick="bukaModalRiwayatRegisterSpkJo()" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700 flex items-center gap-1 transition">
                <span>📜 History Register</span>
              </button>
            </div>

            <!-- Baris 1: Wilayah Operasional & Tanggal Surat Resmi -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block font-semibold text-slate-300 mb-1 text-[11px]">Kantor Wilayah Operasional Penerbitan <span class="text-rose-400">*</span></label>
                <select id="appr-kantor-wilayah" onchange="handleApprovalWilayahChange()" class="w-full h-9 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-amber-400 text-xs">
                  <option value="Kantor Pusat Jakarta">Kantor Pusat Jakarta</option>
                  <option value="Kantor Cabang Bandung">Kantor Cabang Bandung</option>
                  <option value="Kantor Cabang Padang">Kantor Cabang Padang</option>
                  <option value="Kantor Cabang Makassar">Kantor Cabang Makassar</option>
                  <option value="Kantor Cabang Palembang">Kantor Cabang Palembang</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1 text-[11px]">Tanggal Surat / SPK Resmi <span class="text-rose-400">*</span></label>
                <input type="date" id="appr-tanggal-surat" required onchange="handleApprovalTanggalChange()" class="w-full h-9 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400">
              </div>
            </div>

            <!-- Baris 2: Jenis Laporan Penilaian -->
            <div>
              <label class="block font-semibold text-slate-300 mb-1 text-[11px]">Jenis Laporan Penilaian <span class="text-rose-400">*</span></label>
              <select id="appr-jenis-laporan" onchange="handleApprovalJenisLaporanChange()" class="w-full h-9 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-amber-400 text-xs">
                <option value="APP">Long Report — Kode: PN-APP (Laporan Lengkap)</option>
                <option value="RTL">Short Report — Kode: PN-RTL (Laporan Ringkas / Retail)</option>
              </select>
            </div>

            <!-- Baris 3: Smart Register SPK (Terpisah) -->
            <div class="p-2.5 rounded-lg bg-slate-900 border border-amber-500/20 space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="font-bold text-amber-300 text-[11px] flex items-center gap-1.5">
                  <span>📘 Register SPK / Lingkup Penugasan</span>
                </label>
                <span class="text-[10px] font-mono text-amber-400/80">[Seq]/NSR/[Kode]/[Bulan]/[Tahun]</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div class="sm:col-span-1">
                  <label class="block text-[10px] text-slate-400 mb-0.5">No. Urut SPK (Manual)</label>
                  <input type="number" id="appr-spk-seq" min="1" placeholder="416" oninput="sinkronkanSeqKeNomorLp()" class="w-full h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-400">
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-[10px] text-slate-400 mb-0.5">Nomor SPK Lengkap Resmi</label>
                  <input type="text" id="appr-nomor-lp" required oninput="validasiApprovalDuplikatLive()" onblur="formatApprovalNomorInputOtomatis()" class="w-full h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-400">
                </div>
              </div>
              <div class="text-[11px] text-slate-400 flex items-center justify-between pt-0.5">
                <span>ℹ️ SPK Terakhir: <strong id="appr-spk-last" class="text-amber-400 font-mono">0415</strong> • Saran: <strong id="appr-spk-saran" class="text-emerald-400 font-mono">0416</strong></span>
                <button type="button" onclick="gunakanSaranSpk()" class="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-semibold transition">Gunakan Saran SPK</button>
              </div>
            </div>

            <!-- Baris 4: Smart Register JO (Terpisah) -->
            <div class="p-2.5 rounded-lg bg-slate-900 border border-sky-500/20 space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="font-bold text-sky-300 text-[11px] flex items-center gap-1.5">
                  <span>📁 Register Job Order (JO)</span>
                </label>
                <span class="text-[10px] font-mono text-sky-400/80">[Seq]/JO/NSR/[Bulan]/[Tahun]</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div class="sm:col-span-1">
                  <label class="block text-[10px] text-slate-400 mb-0.5">No. Urut JO (Manual)</label>
                  <input type="number" id="appr-jo-seq" min="1" placeholder="416" oninput="sinkronkanSeqKeNomorAdm()" class="w-full h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sky-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-400">
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-[10px] text-slate-400 mb-0.5">Nomor JO Lengkap Resmi</label>
                  <input type="text" id="appr-nomor-adm" required oninput="validasiApprovalDuplikatLive()" class="w-full h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sky-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-400">
                </div>
              </div>
              <div class="text-[11px] text-slate-400 flex items-center justify-between pt-0.5">
                <span>ℹ️ JO Terakhir: <strong id="appr-jo-last" class="text-sky-400 font-mono">0415</strong> • Saran: <strong id="appr-jo-saran" class="text-emerald-400 font-mono">0416</strong></span>
                <button type="button" onclick="gunakanSaranJo()" class="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-semibold transition">Gunakan Saran JO</button>
              </div>
            </div>

            <!-- Alert Peringatan Loncatan Nomor (>20 Nomor) -->
            <div id="appr-warning-loncatan" class="hidden p-2 rounded-lg bg-amber-950/80 border border-amber-500 text-amber-200 text-[11px] font-semibold leading-relaxed">
              ⚠️ <strong>Perhatian Loncatan Nomor:</strong> Nomor urut yang dimasukkan melompat >20 angka di atas nomor terakhir. Konfirmasi diperlukan sebelum penerbitan.
            </div>
          </div>`;

content = safeReplace(content, modalOldFields, modalNewFields);
console.log('Step 2: Modal Approval Pusat HTML patched.');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully saved partial HTML changes.');
