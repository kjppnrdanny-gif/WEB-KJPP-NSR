import fs from 'fs';

console.log('--- PATCHING PORTAL-NOLAP.HTML WITH OFFICIAL MASTER CODES & REGISTER MANAGEMENT ---');

let html = fs.readFileSync('portal-nolap.html', 'utf8');

// 1. Update MASTER_KANTOR
const oldMasterKantor = `const MASTER_KANTOR = {
      "Pusat": { kode: "2.19.0160", kodeSegmen: "2.0160-00", nama: "Kantor Pusat Jakarta" },
      "PUSAT": { kode: "2.19.0160", kodeSegmen: "2.0160-00", nama: "Kantor Pusat Jakarta" },
      "Padang": { kode: "2.0160-01", kodeSegmen: "2.0160-01", nama: "Kantor Cabang Padang" },
      "PADANG": { kode: "2.0160-01", kodeSegmen: "2.0160-01", nama: "Kantor Cabang Padang" },
      "Makassar": { kode: "2.0160-02", kodeSegmen: "2.0160-02", nama: "Kantor Cabang Makassar" },
      "MAKASSAR": { kode: "2.0160-02", kodeSegmen: "2.0160-02", nama: "Kantor Cabang Makassar" },
      "Bandung": { kode: "2.0160-04", kodeSegmen: "2.0160-04", nama: "Kantor Cabang Bandung" },
      "BANDUNG": { kode: "2.0160-04", kodeSegmen: "2.0160-04", nama: "Kantor Cabang Bandung" },
      "Palembang": { kode: "2.0160-03", kodeSegmen: "2.0160-03", nama: "Kantor Cabang Palembang" },
      "PALEMBANG": { kode: "2.0160-03", kodeSegmen: "2.0160-03", nama: "Kantor Cabang Palembang" }
    };`;

const newMasterKantor = `const MASTER_KANTOR = {
      "Pusat": { kode: "2.19.0160", kodeSegmen: "2.0160-00", nama: "Kantor Pusat Jakarta" },
      "PUSAT": { kode: "2.19.0160", kodeSegmen: "2.0160-00", nama: "Kantor Pusat Jakarta" },
      "Padang": { kode: "2.0160-02", kodeSegmen: "2.0160-02", nama: "Kantor Cabang Padang" },
      "PADANG": { kode: "2.0160-02", kodeSegmen: "2.0160-02", nama: "Kantor Cabang Padang" },
      "Makassar": { kode: "2.0160-03", kodeSegmen: "2.0160-03", nama: "Kantor Cabang Makassar" },
      "MAKASSAR": { kode: "2.0160-03", kodeSegmen: "2.0160-03", nama: "Kantor Cabang Makassar" },
      "Bandung": { kode: "2.0160-04", kodeSegmen: "2.0160-04", nama: "Kantor Cabang Bandung" },
      "BANDUNG": { kode: "2.0160-04", kodeSegmen: "2.0160-04", nama: "Kantor Cabang Bandung" },
      "Palembang": { kode: "2.0160-05", kodeSegmen: "2.0160-05", nama: "Kantor Cabang Palembang" },
      "PALEMBANG": { kode: "2.0160-05", kodeSegmen: "2.0160-05", nama: "Kantor Cabang Palembang" }
    };`;

html = html.replace(oldMasterKantor, newMasterKantor);

// 2. Update REKAN_CABANG_CONFIG
const oldRekanConfig = `const REKAN_CABANG_CONFIG = {
      "Pusat": { nama: "Nanang Rahayu", label: "Ir. Nanang Rahayu — Izin: 0218", izin: "0218", kodeSegmen: "2.0160-00" },
      "Padang": { nama: "Hernita", label: "Hernita — Izin: PS.0046", izin: "PS.0046", kodeSegmen: "2.0160-01" },
      "Makassar": { nama: "Muhammad Amin Sade", label: "Muhammad Amin Sade — Izin: PS.0126", izin: "PS.0126", kodeSegmen: "2.0160-02" },
      "Bandung": { nama: "Deni Siswandi", label: "Deni Siswandi — Izin: 00581", izin: "00581", kodeSegmen: "2.0160-04" },
      "Palembang": { nama: "Dharma Priyanto Sih Budi Susilo", label: "Dharma Priyanto S.B.S. — Izin: PS.0249", izin: "PS.0249", kodeSegmen: "2.0160-03" }
    };`;

const newRekanConfig = `const REKAN_CABANG_CONFIG = {
      "Pusat": { nama: "Nanang Rahayu", label: "Ir. Nanang Rahayu — Izin: 0218", izin: "0218", kodeSegmen: "2.0160-00" },
      "Padang": { nama: "Hernita", label: "Hernita — Izin: PS.0046", izin: "PS.0046", kodeSegmen: "2.0160-02" },
      "Makassar": { nama: "Muhammad Amin Sade", label: "Muhammad Amin Sade — Izin: PS.0126", izin: "PS.0126", kodeSegmen: "2.0160-03" },
      "Bandung": { nama: "Deni Siswandi", label: "Deni Siswandi — Izin: 00581", izin: "00581", kodeSegmen: "2.0160-04" },
      "Palembang": { nama: "Dharma Priyanto Sih Budi Susilo", label: "Dharma Priyanto S.B.S. — Izin: PS.0249", izin: "PS.0249", kodeSegmen: "2.0160-05" }
    };`;

html = html.replace(oldRekanConfig, newRekanConfig);

// 3. Update Dropdown HTML Options
html = html.replace(/<option value="Padang" data-kode="2\.0160-01">Kantor Cabang Padang \(2\.0160-01\)<\/option>/g, '<option value="Padang" data-kode="2.0160-02">Kantor Cabang Padang (2.0160-02)</option>');
html = html.replace(/<option value="Makassar" data-kode="2\.0160-02">Kantor Cabang Makassar \(2\.0160-02\)<\/option>/g, '<option value="Makassar" data-kode="2.0160-03">Kantor Cabang Makassar (2.0160-03)</option>');
html = html.replace(/<option value="Palembang" data-kode="2\.0160-03">Kantor Cabang Palembang \(2\.0160-03\)<\/option>/g, '<option value="Palembang" data-kode="2.0160-05">Kantor Cabang Palembang (2.0160-05)</option>');

// 4. Update Segmen 6 NPWP Label
html = html.replace(/<span class="text-slate-400 block text-\[10px\]">6\. NPWP<\/span>/g, '<span class="text-slate-400 block text-[10px]">6. NPWP (1/0)</span>');

// 5. Tambahkan Tombol "Register Resmi" di Navbar
const syncGsheetBtn = `<button onclick="sinkronkanDariSpreadsheetLive()" id="btn-sync-gsheet"`;
const registerNavBtn = `<button onclick="bukaModalPengaturanRegister()" id="btn-kelola-register" title="Pengaturan Register Nomor Resmi OPINI NSR" class="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 font-semibold transition border border-indigo-700/50 flex items-center gap-1.5 cursor-pointer">
            <span>🏛️ Register Resmi</span>
          </button>
          <button onclick="sinkronkanDariSpreadsheetLive()" id="btn-sync-gsheet"`;

if (!html.includes('id="btn-kelola-register"')) {
  html = html.replace(syncGsheetBtn, registerNavBtn);
}

// 6. Tambahkan Modal Pengaturan Register Resmi di akhir berkas (sebelum modal-overlay penutup)
const registerModalHtml = `
  <!-- =========================================================================
       MODAL: PENGATURAN REGISTER NOMOR RESMI OPINI NSR (GO-LIVE READY)
       ========================================================================= -->
  <div id="modal-pengaturan-register" class="fixed inset-0 z-50 hidden bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
      
      <!-- HEADER MODAL -->
      <div class="flex items-start justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-lg">
            🏛️
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-black text-white flex items-center gap-2">
              PENGATURAN REGISTER NOMOR RESMI OPINI NSR
              <span class="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase" id="badge-register-role">SUPER ADMIN</span>
            </h3>
            <p class="text-[11px] text-slate-400">Pusat Administrasi & Penetapan Saldo Awal Nomor Resmi (Pusat & 4 Cabang Kemenkeu RI)</p>
          </div>
        </div>
        <button onclick="tutupModalPengaturanRegister()" class="text-slate-400 hover:text-white p-1 text-base">&times;</button>
      </div>

      <!-- TAB PILIHAN SUB-MODUL -->
      <div class="flex border-b border-slate-800 gap-2">
        <button id="tab-reg-btn-daftar" onclick="gantiTabRegister('daftar')" class="py-2 px-3 font-bold border-b-2 border-indigo-400 text-indigo-300 transition">
          📋 1. Saldo & Daftar Register Aktif
        </button>
        <button id="tab-reg-btn-form" onclick="gantiTabRegister('form')" class="py-2 px-3 font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition">
          ✏️ 2. Input / Penyesuaian Saldo Awal
        </button>
        <button id="tab-reg-btn-audit" onclick="gantiTabRegister('audit')" class="py-2 px-3 font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition">
          📜 3. Riwayat Perubahan (Audit Log)
        </button>
        <button id="tab-reg-btn-template" onclick="gantiTabRegister('template')" class="py-2 px-3 font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition">
          📥 4. Template Rekonsiliasi Cabang
        </button>
      </div>

      <!-- KONTEN TAB 1: DAFTAR REGISTER -->
      <div id="tab-reg-content-daftar" class="space-y-3">
        <div class="flex items-center justify-between">
          <p class="text-slate-300">Posisi saldo nomor administrasi resmi yang terdaftar di basis data sistem:</p>
          <button onclick="muatDataRegisterResmi()" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 font-semibold">
            🔄 Muat Ulang Register
          </button>
        </div>
        <div class="overflow-x-auto border border-slate-800 rounded-xl">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-950/80 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th class="p-2.5">Kantor Wilayah</th>
                <th class="p-2.5">Kode Segmen</th>
                <th class="p-2.5">Jenis Register</th>
                <th class="p-2.5">Saldo Nomor Terakhir</th>
                <th class="p-2.5">Kandidat Berikutnya</th>
                <th class="p-2.5">Status</th>
                <th class="p-2.5">Bukti Administrasi</th>
                <th class="p-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody id="tbody-register-daftar" class="divide-y divide-slate-800 text-[11px]">
              <tr><td colspan="8" class="p-4 text-center text-slate-500">Memuat data register resmi...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- KONTEN TAB 2: FORM PENYESUAIAN -->
      <div id="tab-reg-content-form" class="hidden space-y-4">
        <div class="bg-indigo-950/20 border border-indigo-800/40 rounded-xl p-3 text-indigo-300 text-[11px]">
          ℹ️ <strong>Catatan Pengaturan Saldo:</strong> Penyesuaian saldo awal nomor operasional hanya dapat dilakukan oleh SUPER ADMIN KING atau Admin Pusat dengan mencantumkan sumber buku fisik dan alasan yang sah. Sistem akan menyarankan nomor berikutnya secara otomatis.
        </div>
        <form id="form-edit-register" onsubmit="simpanPenyesuaianRegister(event)" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Kantor / Kewenangan Register *</label>
            <select id="reg-kantor" required onchange="updateRegisterFormPreview()" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200">
              <option value="Pusat">Kantor Pusat Jakarta (2.0160-00)</option>
              <option value="Padang">Kantor Cabang Padang (2.0160-02)</option>
              <option value="Makassar">Kantor Cabang Makassar (2.0160-03)</option>
              <option value="Bandung">Kantor Cabang Bandung (2.0160-04)</option>
              <option value="Palembang">Kantor Cabang Palembang (2.0160-05)</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Jenis Register Dokumen *</label>
            <select id="reg-jenis" required onchange="updateRegisterFormPreview()" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200">
              <option value="NoLap">NoLap — Nomor Laporan Penilaian Definitif</option>
              <option value="LP_SPK">LP_SPK — Nomor Lingkup Penugasan / SPK</option>
              <option value="JO">JO — Nomor Administrasi Job Order</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Periode / Tahun *</label>
            <input type="text" id="reg-periode" required value="2026" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono">
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Nomor Terakhir Buku Register Fisik *</label>
            <input type="number" id="reg-nomor-terakhir" required min="0" placeholder="Contoh: 127" oninput="updateRegisterFormPreview()" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono font-bold">
            <span class="text-[10px] text-slate-400">Masukkan angka desimal terakhir (Sistem akan memformat 5 digit: <span id="reg-preview-5digit" class="font-bold text-amber-400">00000</span>).</span>
          </div>
          <div class="md:col-span-2">
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-slate-400 text-[11px] block">Kandidat Nomor Berikutnya yang Akan Disarankan:</span>
                <strong id="reg-kandidat-preview" class="text-emerald-400 text-sm font-mono font-black">00001</strong>
              </div>
              <span class="text-[11px] text-slate-500">Otomatis Terkalkulasi (Saldo Terakhir + 1)</span>
            </div>
          </div>
          <div class="md:col-span-2">
            <label class="block font-semibold text-slate-300 mb-1">Sumber Dokumen / Buku Register Fisik *</label>
            <input type="text" id="reg-sumber-bukti" required placeholder="Contoh: Buku Register Fisik NoLap Pusat 2026 Halaman 45" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200">
          </div>
          <div class="md:col-span-2">
            <label class="block font-semibold text-slate-300 mb-1">Alasan Penyesuaian / Rekonsiliasi *</label>
            <textarea id="reg-alasan" required rows="2" placeholder="Jelaskan dasar rekonsiliasi nomor awal operasional..." class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"></textarea>
          </div>
          <div class="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onclick="tutupModalPengaturanRegister()" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition">
              Batal
            </button>
            <button type="submit" id="btn-simpan-register" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30">
              💾 Simpan Saldo Register Resmi
            </button>
          </div>
        </form>
      </div>

      <!-- KONTEN TAB 3: AUDIT LOG RIWAYAT -->
      <div id="tab-reg-content-audit" class="hidden space-y-3">
        <p class="text-slate-300">Jejak audit perubahan saldo register yang terekam permanen:</p>
        <div class="overflow-x-auto border border-slate-800 rounded-xl">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-950/80 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th class="p-2.5">Waktu (WIB)</th>
                <th class="p-2.5">Petugas</th>
                <th class="p-2.5">Kantor & Dokumen</th>
                <th class="p-2.5">Saldo Lama &rarr; Baru</th>
                <th class="p-2.5">Kandidat Berikutnya</th>
                <th class="p-2.5">Sumber Bukti</th>
                <th class="p-2.5">Alasan</th>
              </tr>
            </thead>
            <tbody id="tbody-register-audit" class="divide-y divide-slate-800 text-[11px]">
              <tr><td colspan="7" class="p-4 text-center text-slate-500">Belum ada riwayat perubahan register.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- KONTEN TAB 4: TEMPLATE REKONSILIASI CABANG -->
      <div id="tab-reg-content-template" class="hidden space-y-3">
        <p class="text-slate-300">Gunakan format tabel berikut untuk meminta data register nomor resmi dari Admin Pusat dan seluruh Kepala Cabang:</p>
        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <pre id="pre-template-rekonsiliasi" class="text-[11px] text-emerald-400 font-mono overflow-x-auto whitespace-pre">
Kantor | Kode Kantor | Jenis Register | Nomor Terakhir Digunakan | Kandidat Nomor Berikutnya | Periode | Sumber Buku Administrasi | Penanggung Jawab
Kantor Pusat Jakarta | 2.0160-00 | NoLap | [Diisi Admin Pusat] | [Diisi Admin Pusat] | 2026 | Buku Register NoLap Pusat | Deni Siswandi / Danny Taufik
Kantor Pusat Jakarta | 2.0160-00 | LP_SPK | [Diisi Admin Pusat] | [Diisi Admin Pusat] | 2026 | Buku Register SPK Pusat | Admin Pusat
Kantor Pusat Jakarta | 2.0160-00 | JO | [Diisi Admin Pusat] | [Diisi Admin Pusat] | 2026 | Buku Register JO Pusat | Admin Pusat
Kantor Cabang Padang | 2.0160-02 | NoLap | [Diisi Cabang Padang] | [Diisi Cabang Padang] | 2026 | Buku Register Padang | Admin Cabang Padang
Kantor Cabang Padang | 2.0160-02 | LP_SPK | [Diisi Cabang Padang] | [Diisi Cabang Padang] | 2026 | Buku Register Padang | Admin Cabang Padang
Kantor Cabang Makassar | 2.0160-03 | NoLap | [Diisi Cabang Makassar] | [Diisi Cabang Makassar] | 2026 | Buku Register Makassar | Admin Cabang Makassar
Kantor Cabang Makassar | 2.0160-03 | LP_SPK | [Diisi Cabang Makassar] | [Diisi Cabang Makassar] | 2026 | Buku Register Makassar | Admin Cabang Makassar
Kantor Cabang Bandung | 2.0160-04 | NoLap | [Diisi Cabang Bandung] | [Diisi Cabang Bandung] | 2026 | Buku Register Bandung | Admin Cabang Bandung
Kantor Cabang Bandung | 2.0160-04 | LP_SPK | [Diisi Cabang Bandung] | [Diisi Cabang Bandung] | 2026 | Buku Register Bandung | Admin Cabang Bandung
Kantor Cabang Palembang | 2.0160-05 | NoLap | [Diisi Cabang Palembang] | [Diisi Cabang Palembang] | 2026 | Buku Register Palembang | Admin Cabang Palembang
Kantor Cabang Palembang | 2.0160-05 | LP_SPK | [Diisi Cabang Palembang] | [Diisi Cabang Palembang] | 2026 | Buku Register Palembang | Admin Cabang Palembang</pre>
        </div>
        <button onclick="salinTemplateRekonsiliasi()" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition">
          📋 Salin Template Rekonsiliasi ke Clipboard
        </button>
      </div>

    </div>
  </div>
`;

if (!html.includes('id="modal-pengaturan-register"')) {
  // Let's place it before the closing script or before modal container
  const footerEndAnchor = `  <div id="modal-terbitkan-nolap-manual"`;
  html = html.replace(footerEndAnchor, registerModalHtml + '\n' + footerEndAnchor);
}

// 7. Tambahkan JavaScript Logic untuk Register Modal
const scriptEndAnchor = `    // =========================================================================
    // 16. INISIALISASI HALAMAN SAAT DIMUAT (DOM READY)
    // =========================================================================`;

const registerJsLogic = `
    // =========================================================================
    // 15B. FITUR RESMI: PENGATURAN REGISTER NOMOR AWAL OPERASIONAL
    // =========================================================================
    let cacheRegisterResmi = [];
    let cacheRegisterAuditLogs = [];

    async function bukaModalPengaturanRegister() {
      const modal = document.getElementById('modal-pengaturan-register');
      if (!modal) return;
      modal.classList.remove('hidden');

      // Update badge role
      const roleBadge = document.getElementById('badge-register-role');
      if (roleBadge) {
        roleBadge.innerText = sesiAktif?.role || 'PENGGUNA';
      }

      // Atur hak akses: HANYA SUPER_ADMIN dan ADMIN_PUSAT yang boleh mengedit
      const canEdit = isSuperOrAdminPusat();
      const tabFormBtn = document.getElementById('tab-reg-btn-form');
      if (tabFormBtn) {
        if (!canEdit) {
          tabFormBtn.classList.add('hidden');
        } else {
          tabFormBtn.classList.remove('hidden');
        }
      }

      gantiTabRegister('daftar');
      await muatDataRegisterResmi();
    }

    function tutupModalPengaturanRegister() {
      const modal = document.getElementById('modal-pengaturan-register');
      if (modal) modal.classList.add('hidden');
    }

    function gantiTabRegister(tab) {
      const tabs = ['daftar', 'form', 'audit', 'template'];
      tabs.forEach(t => {
        const btn = document.getElementById('tab-reg-btn-' + t);
        const cnt = document.getElementById('tab-reg-content-' + t);
        if (btn) {
          if (t === tab) {
            btn.className = 'py-2 px-3 font-bold border-b-2 border-indigo-400 text-indigo-300 transition';
          } else {
            btn.className = 'py-2 px-3 font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition';
          }
        }
        if (cnt) {
          if (t === tab) cnt.classList.remove('hidden');
          else cnt.classList.add('hidden');
        }
      });
    }

    function updateRegisterFormPreview() {
      const nomorRaw = parseInt(document.getElementById('reg-nomor-terakhir')?.value || '0', 10);
      const str5 = String(nomorRaw).padStart(5, '0');
      const next5 = String(nomorRaw + 1).padStart(5, '0');
      const prev5 = document.getElementById('reg-preview-5digit');
      const prevKandidat = document.getElementById('reg-kandidat-preview');
      if (prev5) prev5.innerText = str5;
      if (prevKandidat) prevKandidat.innerText = next5;
    }

    async function muatDataRegisterResmi() {
      const tbodyDaftar = document.getElementById('tbody-register-daftar');
      const tbodyAudit = document.getElementById('tbody-register-audit');
      if (tbodyDaftar) tbodyDaftar.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-slate-500">Memuat data register resmi...</td></tr>';

      try {
        const token = sesiAktif?.token || (typeof getAuthToken === 'function' ? getAuthToken() : '');
        const res = await fetch(\`nolap-data-handler.php?action=getOfficialRegisters&token=\${encodeURIComponent(token)}\`);
        const json = await res.json();

        if (!json.success) {
          if (tbodyDaftar) tbodyDaftar.innerHTML = \`<tr><td colspan="8" class="p-4 text-center text-rose-400">\${json.error || 'Gagal memuat register'}</td></tr>\`;
          return;
        }

        cacheRegisterResmi = json.registers || [];
        cacheRegisterAuditLogs = json.auditLogs || [];

        // Render tabel daftar
        if (tbodyDaftar) {
          if (cacheRegisterResmi.length === 0) {
            tbodyDaftar.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-slate-500">Belum ada konfigurasi register terdaftar.</td></tr>';
          } else {
            tbodyDaftar.innerHTML = cacheRegisterResmi.map(r => {
              const terpakaiCount = (r.nomorTerpakai || []).length;
              const formattedTerakhir = String(r.nomorTerakhir || 0).padStart(5, '0');
              const statusBadge = (r.status === 'AKTIF') 
                ? '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">AKTIF</span>'
                : '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">MENUNGGU</span>';

              const btnEdit = json.canEdit ? \`<button onclick="isiFormRegister('\${r.kantor}', '\${r.jenisDokumen}', \${r.nomorTerakhir}, '\${escapeHtml(r.sumberBukti || '')}')" class="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 text-[10px] font-bold">Edit Saldo</button>\` : '<span class="text-slate-500 text-[10px]">Read-only</span>';

              return \`<tr class="hover:bg-slate-800/40 transition">
                <td class="p-2.5 font-bold text-slate-200">\${r.kantor}</td>
                <td class="p-2.5 font-mono text-cyan-300">\${r.kodeKantor || MASTER_KANTOR[r.kantor]?.kodeSegmen || '-'}</td>
                <td class="p-2.5 font-semibold text-amber-300">\${r.jenisDokumen}</td>
                <td class="p-2.5 font-mono font-bold text-white">\${formattedTerakhir}</td>
                <td class="p-2.5 font-mono font-bold text-emerald-400">\${r.kandidatBerikutnya || '00001'}</td>
                <td class="p-2.5">\${statusBadge}</td>
                <td class="p-2.5 text-slate-400 max-w-xs truncate" title="\${escapeHtml(r.sumberBukti || '')}">\${escapeHtml(r.sumberBukti || '-')}</td>
                <td class="p-2.5 text-center">\${btnEdit}</td>
              </tr>\`;
            }).join('');
          }
        }

        // Render tabel audit log
        if (tbodyAudit) {
          if (cacheRegisterAuditLogs.length === 0) {
            tbodyAudit.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-500">Belum ada riwayat perubahan register.</td></tr>';
          } else {
            tbodyAudit.innerHTML = cacheRegisterAuditLogs.slice().reverse().map(l => {
              return \`<tr class="hover:bg-slate-800/40 transition">
                <td class="p-2.5 text-slate-300 whitespace-nowrap">\${l.timestamp ? l.timestamp.replace('T', ' ').substring(0, 19) : '-'}</td>
                <td class="p-2.5 font-bold text-white">\${escapeHtml(l.petugas || '-')}</td>
                <td class="p-2.5 text-cyan-300 font-semibold">\${l.kantor} (\${l.jenisDokumen})</td>
                <td class="p-2.5 font-mono text-amber-300">\${String(l.saldoLama || 0).padStart(5, '0')} &rarr; <strong>\${String(l.saldoBaru || 0).padStart(5, '0')}</strong></td>
                <td class="p-2.5 font-mono text-emerald-400 font-bold">\${l.kandidatBerikutnya || '-'}</td>
                <td class="p-2.5 text-slate-300">\${escapeHtml(l.sumberBukti || '-')}</td>
                <td class="p-2.5 text-slate-400">\${escapeHtml(l.alasan || '-')}</td>
              </tr>\`;
            }).join('');
          }
        }

      } catch (err) {
        console.error('Gagal mengambil data register resmi:', err);
        if (tbodyDaftar) tbodyDaftar.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-rose-400">Terjadi kesalahan koneksi server saat mengambil data register.</td></tr>';
      }
    }

    function isiFormRegister(kantor, jenis, nomorTerakhir, sumberBukti) {
      gantiTabRegister('form');
      const elKantor = document.getElementById('reg-kantor');
      const elJenis = document.getElementById('reg-jenis');
      const elNomor = document.getElementById('reg-nomor-terakhir');
      const elSumber = document.getElementById('reg-sumber-bukti');
      if (elKantor) elKantor.value = kantor;
      if (elJenis) elJenis.value = jenis;
      if (elNomor) elNomor.value = nomorTerakhir;
      if (elSumber) elSumber.value = sumberBukti;
      updateRegisterFormPreview();
    }

    async function simpanPenyesuaianRegister(e) {
      e.preventDefault();
      const btn = document.getElementById('btn-simpan-register');
      if (btn) btn.disabled = true;

      const payload = {
        kantor: document.getElementById('reg-kantor')?.value,
        jenisDokumen: document.getElementById('reg-jenis')?.value,
        periode: document.getElementById('reg-periode')?.value || '2026',
        nomorTerakhir: parseInt(document.getElementById('reg-nomor-terakhir')?.value || '0', 10),
        sumberBukti: document.getElementById('reg-sumber-bukti')?.value.trim(),
        alasanPenyesuaian: document.getElementById('reg-alasan')?.value.trim()
      };

      try {
        const token = sesiAktif?.token || (typeof getAuthToken === 'function' ? getAuthToken() : '');
        const res = await fetch('nolap-data-handler.php?action=saveOfficialRegister', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': token
          },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          alert('✅ Sukses! Saldo Register Resmi berhasil diperbarui.');
          gantiTabRegister('daftar');
          await muatDataRegisterResmi();
        } else {
          alert('❌ Gagal menyimpan register: ' + (json.error || 'Terjadi kesalahan'));
        }
      } catch (err) {
        alert('❌ Terjadi kesalahan jaringan saat menyimpan register: ' + err.message);
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    function salinTemplateRekonsiliasi() {
      const txt = document.getElementById('pre-template-rekonsiliasi')?.innerText || '';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(txt).then(() => {
          alert('📋 Template Rekonsiliasi Register berhasil disalin ke clipboard!');
        });
      } else {
        prompt('Salin teks template berikut:', txt);
      }
    }
`;

if (!html.includes('bukaModalPengaturanRegister()')) {
  html = html.replace(scriptEndAnchor, registerJsLogic + '\n' + scriptEndAnchor);
}

fs.writeFileSync('portal-nolap.html', html, 'utf8');
console.log('portal-nolap.html successfully patched with register management & master codes!');
