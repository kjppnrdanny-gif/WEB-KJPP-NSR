import fs from 'node:fs';

let content = fs.readFileSync('portal-tracking.html', 'utf8');
let isCRLF = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

// 1. Update the registration form HTML
const oldFormStart = `<form id="form-registrasi-jo" onsubmit="eksekusiRegistrasiJO(event)" class="space-y-5">
          
          <!-- Section 1: Informasi Dokumen & Instansi -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">Nomor SPK / Surat Penugasan Bank <span class="text-rose-400">*</span></label>
              <input type="text" id="reg-spk-number" required placeholder="Contoh: 045/BTN-JKT/SPK/X/2026" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">Tanggal SPK Terbit <span class="text-rose-400">*</span></label>
              <input type="date" id="reg-spk-date" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">Lingkup Penugasan / Dokumen LP</label>
              <input type="text" id="reg-lingkup-penugasan" placeholder="Contoh: Penilaian Agunan Properti / 0416/2.0160-00/LP/X/2026" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">Tanggal Dokumen Lingkup Penugasan</label>
              <input type="date" id="reg-tgl-lingkup" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">Instansi Pemohon (Isian Bebas) <span class="text-rose-400">*</span></label>
              <input type="text" id="reg-instansi" list="list-instansi-saran" required placeholder="Ketik atau pilih instansi..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
              <datalist id="list-instansi-saran">
                <option value="PT Bank Tabungan Negara (Persero) Tbk">
                <option value="PT Bank Mandiri (Persero) Tbk">
                <option value="PT Bank Rakyat Indonesia (Persero) Tbk">
                <option value="PT Bank Central Asia Tbk">
                <option value="PT Bank Negara Indonesia (Persero) Tbk">
                <option value="PT Bank Syariah Indonesia Tbk">
                <option value="PT Bank DKI">
                <option value="PT Bank Nagari">
                <option value="PT Bank Sumsel Babel">
                <option value="BUMN / Instansi Korporasi Lain">
              </datalist>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">Unit Kerja / Cabang Bank</label>
              <input type="text" id="reg-unit-kerja" placeholder="Contoh: KC Jakarta Kuningan" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">Kantor Pelaksana Penilaian <span class="text-rose-400">*</span></label>
              <select id="reg-kantor" onchange="sesuaikanDropdownWilayah(this.value)" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
                <option value="Kantor Pusat Jakarta">Kantor Pusat Jakarta</option>
                <option value="Cabang Bandung">Cabang Bandung</option>
                <option value="Cabang Padang">Cabang Padang</option>
                <option value="Cabang Makassar">Cabang Makassar</option>
                <option value="Cabang Palembang">Cabang Palembang</option>
              </select>
            </div>
          </div>

          <!-- Section 2: Informasi Debitur & Objek Agunan -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">Nama Debitur / Pemohon <span class="text-rose-400">*</span></label>
              <input type="text" id="reg-debitur" required placeholder="Contoh: PT Bangun Prima Perkasa" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">Nomor WhatsApp PIC Debitur <span class="text-rose-400">*</span></label>
              <input type="text" id="reg-pic-contact" required placeholder="Contoh: 081288997766" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
            </div>
          </div>`;

const newFormStart = `<form id="form-registrasi-jo" onsubmit="eksekusiRegistrasiJO(event)" class="space-y-5">
          
          <!-- Section 1: Informasi Dokumen & Lingkup Penugasan (SPI 103 & KEPI) -->
          <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <h3 class="text-xs font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-amber-400"></span>
              Dasar Dokumen Penugasan &amp; Lingkup Penilaian (SPI 103)
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5">Nomor SPK / Surat Tugas Bank <span class="text-rose-400">*</span></label>
                <input type="text" id="reg-spk-number" required placeholder="Contoh: 045/BTN-JKT/SPK/X/2026" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5">Tanggal SPK Terbit <span class="text-rose-400">*</span></label>
                <input type="date" id="reg-spk-date" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5">Tujuan Penilaian (SPI 103) <span class="text-rose-400">*</span></label>
                <input type="text" id="reg-tujuan-penilaian" list="list-tujuan-saran" required placeholder="Pilih atau ketik tujuan..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
                <datalist id="list-tujuan-saran">
                  <option value="Penjaminan Utang / Agunan Kredit">
                  <option value="Pelaporan Keuangan (PSAK / IFRS)">
                  <option value="Pengadaan Tanah (SPI 204)">
                  <option value="Lelang / Eksekusi Hak Tanggungan">
                  <option value="Transaksi Jual Beli / Akuisisi">
                  <option value="Tujuan Internal Manajemen">
                </datalist>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5">Klasifikasi Kompetensi Izin Objek <span class="text-rose-400">*</span></label>
                <select id="reg-klasifikasi-izin-objek" onchange="periksaKepatuhanSpm()" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
                  <option value="PS">PS - Properti Sederhana (Retail / Rumah / Ruko)</option>
                  <option value="P">P - Properti Kompleks / Komersial / Industri / SPI 204</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5">Dokumen Kepemilikan / Bukti Hak</label>
                <input type="text" id="reg-dokumen-kepemilikan" placeholder="Contoh: SHM No. 402, SHGB No. 120, Girik" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5">Nomor Dokumen Lingkup Penugasan (LP)</label>
                <input type="text" id="reg-lingkup-penugasan" placeholder="Contoh: 0416/2.0160-00/LP/X/2026" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5">Tanggal Dokumen Lingkup Penugasan</label>
                <input type="date" id="reg-tgl-lingkup" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
              </div>
            </div>
          </div>

          <!-- Section 2: Pemisahan Entitas Penugasan & Kontak Resmi (KEPI & SPI 103) -->
          <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <h3 class="text-xs font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-amber-400"></span>
              Pemisahan Entitas Klien &amp; Jalur Kontak Resmi (Kerahasiaan KEPI)
            </h3>

            <!-- Entitas Klien -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5">Pemberi Tugas (Client) <span class="text-rose-400">*</span></label>
                <input type="text" id="reg-pemberi-tugas" list="list-instansi-saran" oninput="sinkronkanPenggunaLaporan()" required placeholder="Pihak yang berkontrak dengan KJPP..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
                <datalist id="list-instansi-saran">
                  <option value="PT Bank Tabungan Negara (Persero) Tbk">
                  <option value="PT Bank Mandiri (Persero) Tbk">
                  <option value="PT Bank Rakyat Indonesia (Persero) Tbk">
                  <option value="PT Bank Central Asia Tbk">
                  <option value="PT Bank Negara Indonesia (Persero) Tbk">
                  <option value="PT Bank Syariah Indonesia Tbk">
                  <option value="PT Bank DKI">
                  <option value="PT Bank Nagari">
                  <option value="PT Bank Sumsel Babel">
                  <option value="PT PLN (Persero) Unit Induk Pembangunan">
                  <option value="BUMN / Instansi Korporasi Lain">
                </datalist>
                <input type="hidden" id="reg-instansi">
              </div>
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold text-slate-300">Pengguna Laporan (Intended User) <span class="text-rose-400">*</span></label>
                  <label class="inline-flex items-center gap-1 text-[10px] text-amber-400 cursor-pointer font-semibold">
                    <input type="checkbox" id="check-pengguna-sama" onchange="togglePenggunaSama(this.checked)" checked class="rounded border-slate-700 bg-slate-900 text-amber-400 focus:ring-0">
                    <span>Sama dg Klien</span>
                  </label>
                </div>
                <input type="text" id="reg-pengguna-laporan" required placeholder="Pengguna laporan yang dituju..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5">Nama Debitur / Objek Entitas <span class="text-rose-400">*</span></label>
                <input type="text" id="reg-debitur" required placeholder="Contoh: PT Bangun Prima Perkasa / Hendra Wijaya" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5">Unit Kerja / Cabang Bank</label>
                <input type="text" id="reg-unit-kerja" placeholder="Contoh: KC Jakarta Harmoni / Divisi Kredit Komersial" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5">Kantor Pelaksana Penilaian <span class="text-rose-400">*</span></label>
                <select id="reg-kantor" onchange="sesuaikanDropdownWilayah(this.value)" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
                  <option value="Kantor Pusat Jakarta">Kantor Pusat Jakarta</option>
                  <option value="Cabang Bandung">Cabang Bandung</option>
                  <option value="Cabang Padang">Cabang Padang</option>
                  <option value="Cabang Makassar">Cabang Makassar</option>
                  <option value="Cabang Palembang">Cabang Palembang</option>
                </select>
              </div>
            </div>

            <!-- Pemisahan 2 Jalur Kontak WhatsApp -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              <!-- Kontak Pemberi Tugas (Eksklusif Penerima Kode Lacak) -->
              <div class="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                <div class="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                  <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  <span>Kontak Resmi Pemberi Tugas (Penerima Kode Lacak)</span>
                </div>
                <p class="text-[10px] text-slate-400 leading-tight">Khusus Penerima Resmi Kode Lacak Penugasan (TRK-...). Sesuai KEPI, kode lacak eksklusif hanya untuk Pemberi Tugas.</p>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Nama PIC Pemberi Tugas <span class="text-rose-400">*</span></label>
                  <input type="text" id="reg-client-pic-name" required placeholder="Contoh: Rian Pratama, S.E. (Loan Officer)" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">No. WhatsApp PIC Pemberi Tugas <span class="text-rose-400">*</span></label>
                  <input type="text" id="reg-client-pic-phone" required placeholder="Contoh: 081288997766" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
                  <input type="hidden" id="reg-pic-contact">
                </div>
              </div>

              <!-- Kontak Pendamping Lapangan (Hanya Koordinasi Survei) -->
              <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div class="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
                  <svg class="w-4 h-4 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span>Kontak Pendamping Lapangan / Debitur</span>
                </div>
                <p class="text-[10px] text-slate-400 leading-tight">Khusus Koordinasi Jadwal Survei Fisik M-03. <strong class="text-rose-300 font-normal">Tidak Diberikan Kode Lacak Penugasan</strong>.</p>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Nama Pendamping Lapangan / Debitur</label>
                  <input type="text" id="reg-survey-contact-name" placeholder="Contoh: Bambang Sudarsono (Debitur / Pengelola)" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">No. WhatsApp Pendamping Lapangan</label>
                  <input type="text" id="reg-survey-contact-phone" placeholder="Contoh: 081399887711" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
                </div>
              </div>

            </div>
          </div>`;

if (norm.includes(oldFormStart)) {
  norm = norm.replace(oldFormStart, newFormStart);
  console.log('✓ Form registration sections 1 & 2 updated with SPI 103 & KEPI fields');
} else {
  console.log('oldFormStart not matched');
}

// 2. Add Guardrail Kepatuhan SPM alert banner in Section 4 of registration form
const oldSpmWarningTarget = `<!-- PENILAI PUBLIK BERIZIN RESMI DROPDOWN -->`;
const newSpmWarningTarget = `<!-- PENILAI PUBLIK BERIZIN RESMI DROPDOWN -->`;

const oldPenilaiSelect = `<select id="reg-penilai" onchange="cekPenilaiCustom(this.value)" required`;
const newPenilaiSelect = `<select id="reg-penilai" onchange="cekPenilaiCustom(this.value); periksaKepatuhanSpm();" required`;

if (norm.includes(oldPenilaiSelect)) {
  norm = norm.replace(oldPenilaiSelect, newPenilaiSelect);
  console.log('✓ reg-penilai onchange updated with periksaKepatuhanSpm');
}

// Add SPM guardrail warning container right above Section 4 submit button
const oldSubmitTarget = `<!-- Submit Button -->
          <div class="flex items-center justify-end gap-3 pt-3">`;

const newSubmitTarget = `<!-- Guardrail Kepatuhan SPM Banner -->
          <div id="warning-spm-klasifikasi" class="hidden p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
            <svg class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <div>
              <strong class="text-rose-200 block mb-0.5">Peringatan Kepatuhan SPM (Klasifikasi Kompetensi Izin):</strong>
              <span id="warning-spm-text">Objek klasifikasi Properti (P) wajib diotorisasi oleh Penilai Publik berizin P (Ir. Nanang Rahayu atau Deni Siswandi). Penilai Publik berizin PS hanya berwenang untuk Properti Sederhana (PS).</span>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="flex items-center justify-end gap-3 pt-3">`;

if (norm.includes(oldSubmitTarget)) {
  norm = norm.replace(oldSubmitTarget, newSubmitTarget);
  console.log('✓ SPM Guardrail warning banner added');
}

const finalContent = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync('portal-tracking.html', finalContent, 'utf8');
console.log('✓ portal-tracking.html saved');
