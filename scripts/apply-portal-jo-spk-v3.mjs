import fs from 'fs';

console.log('=== Memulai Implementasi Penyempurnaan Workflow & Formulir Lingkup Penugasan (SPI 103) ===');

let html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
let php = fs.readFileSync('nolap-data-handler.php', 'utf8');

// ============================================================================
// 1. PRIORITAS 2: PENGGUNA LAPORAN PENILAIAN (SPI 103 Klausul 3)
// ============================================================================
console.log('1. Mengaplikasikan Penyempurnaan Pengguna Laporan...');

const oldPenggunaStart = '<!-- Bagian Pengguna Laporan (SPI 103 Klausul 3) -->';
const oldPenggunaEndMarker = '<!-- 3. IDENTITAS DEBITUR & TABEL OBJEK PENILAIAN -->';

const idxPenggunaStart = html.indexOf(oldPenggunaStart);
const idxPenggunaEnd = html.indexOf(oldPenggunaEndMarker);

if (idxPenggunaStart === -1 || idxPenggunaEnd === -1) {
  console.error('ERROR: Marker Pengguna Laporan tidak ditemukan!');
  process.exit(1);
}

const newPenggunaHtml = `<!-- Bagian Pengguna Laporan (SPI 103 Klausul 3) -->
          <div class="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label class="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <span class="text-amber-400">3.</span> PENGGUNA LAPORAN PENILAIAN (SPI 103 Klausul 3)
                </label>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  Tentukan pihak yang berhak mengandalkan laporan penilaian (Kreditur / Bank / Instansi). Pemisahan tegas antara Pemberi Tugas, Pengguna Laporan, dan Debitur.
                </p>
              </div>

              <!-- Helper Toggle & Quick Chips -->
              <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                <button type="button" onclick="presetBankDebiturPenugasan()" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-semibold border border-sky-400/30 flex items-center gap-1 transition">
                  <span>🔘 Bank &amp; Debitur</span>
                </button>
                <button type="button" onclick="clearPenggunaLaporanPenugasan()" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 text-[11px] font-semibold border border-slate-700 flex items-center gap-1 transition">
                  <span>🔘 Bersihkan Isian</span>
                </button>
              </div>
            </div>

            <!-- Checkbox Toggle: Pengguna Laporan Sama dengan Pemberi Tugas -->
            <div class="p-3 rounded-xl bg-slate-950/80 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 shadow-inner">
              <label class="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" id="chk_pengguna_sama_pemberi" onchange="togglePenggunaSamaDenganPemberi()" class="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-950">
                <span class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>📋</span>
                  <span>Pengguna Laporan Sama dengan Pemberi Tugas</span>
                </span>
              </label>
              <span id="badge_pengguna_sync" class="hidden px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ✓ Sinkronisasi Aktif dari Pemberi Tugas
              </span>
            </div>

            <!-- Formulir Lengkap Pengguna Laporan Utama & Tambahan -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <!-- a. Pengguna Laporan Utama -->
              <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span class="font-bold text-amber-300 text-xs flex items-center gap-1">
                    <span>🏛️</span> a. Pengguna Laporan Utama <span class="text-rose-400">*</span>
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">Pihak Pengandal Utama</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="sm:col-span-2">
                    <label class="block font-semibold text-slate-200 mb-1">Nama Instansi / Badan Usaha <span class="text-rose-400">*</span></label>
                    <input type="text" id="pengguna_laporan_a" required placeholder="Contoh: PT BANK RAKYAT INDONESIA (PERSERO) TBK" class="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-bold focus:outline-none focus:border-amber-400">
                  </div>
                  
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Bidang Usaha Instansi</label>
                    <input type="text" id="pengguna_laporan_a_bidang" placeholder="Contoh: Perbankan / Finansial" class="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-400">
                  </div>

                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Nama PIC / Penanggung Jawab</label>
                    <input type="text" id="pengguna_laporan_a_pic" placeholder="Contoh: Bpk. Bambang Sutrisno" class="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-400">
                  </div>

                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Jabatan PIC</label>
                    <input type="text" id="pengguna_laporan_a_jabatan" placeholder="Contoh: Relationship Manager / Pemimpin Cabang" class="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-400">
                  </div>

                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">No. Telp / WhatsApp PIC</label>
                    <input type="text" id="pengguna_laporan_a_kontak" placeholder="Contoh: 0812-3456-7890" class="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-400">
                  </div>

                  <div class="sm:col-span-2">
                    <label class="block font-semibold text-slate-300 mb-1">Email Aktif PIC / Instansi</label>
                    <input type="email" id="pengguna_laporan_a_email" placeholder="Contoh: pic.pengguna@bankbri.co.id" class="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-400">
                  </div>

                  <div class="sm:col-span-2">
                    <label class="block font-semibold text-slate-400 mb-1">Alamat Kantor Pengguna Laporan <span class="text-rose-400">*</span></label>
                    <textarea id="pengguna_laporan_a_alamat" rows="2" placeholder="Contoh: Jl. Jend. Sudirman Kav. 44-46, Jakarta Pusat 10210" class="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"></textarea>
                  </div>
                </div>
              </div>

              <!-- b. Pengguna Laporan Tambahan / Debitur (Opsional) -->
              <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span class="font-bold text-slate-300 text-xs flex items-center gap-1">
                    <span>👤</span> b. Pengguna Laporan Tambahan / Debitur (Opsional)
                  </span>
                  <span class="text-[10px] text-slate-500 font-mono">Pihak Terkait</span>
                </div>

                <div class="space-y-2.5">
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Nama Pengguna Tambahan / Debitur</label>
                    <input type="text" id="pengguna_laporan_b" placeholder="Contoh: Bpk. H. AHMAD FAUZI / PT CITRA JAYA ABADI" class="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400">
                  </div>

                  <div>
                    <label class="block font-semibold text-slate-400 mb-1">Alamat Pengguna Tambahan / Lokasi Usaha</label>
                    <textarea id="pengguna_laporan_b_alamat" rows="2" placeholder="Contoh: Alamat domisili debitur / kantor operasional" class="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"></textarea>
                  </div>

                  <div class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    💡 <strong class="text-slate-300">Catatan SPI 103 Klausul 3:</strong> Debitur yang juga berstatus sebagai pengguna laporan berhak menerima salinan laporan jika ditegaskan di dalam perjanjian SPK.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        `;

html = html.substring(0, idxPenggunaStart) + newPenggunaHtml + html.substring(idxPenggunaEnd);
console.log('✓ Pengguna Laporan HTML berhasil diintegrasikan.');

// ============================================================================
// 2. PRIORITAS 3: TABEL OBJEK PENILAIAN DINAMIS (Tanah & Bangunan, Mesin, Alat Berat)
// ============================================================================
console.log('2. Mengaplikasikan Penyempurnaan Tabel Objek Penilaian Dinamis...');

const oldTabelStart = '<!-- Tabel Dinamis Multi-Baris Objek -->';
const oldTabelEndMarker = '<!-- Sub-Seksi Pengaturan Investigasi & Asumsi Khusus (SPI 103) -->';

const idxTabelStart = html.indexOf(oldTabelStart);
const idxTabelEnd = html.indexOf(oldTabelEndMarker);

if (idxTabelStart === -1 || idxTabelEnd === -1) {
  console.error('ERROR: Marker Tabel Objek tidak ditemukan!');
  process.exit(1);
}

const newTabelHtml = `<!-- Tabel Dinamis Multi-Baris Objek Adaptif (SPI 103) -->
          <div class="overflow-x-auto rounded-xl border border-slate-800 shadow-md">
            <table class="w-full text-left text-xs" id="tabel-objek-form">
              <thead class="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                <tr>
                  <th class="p-2.5 w-10 text-center">No</th>
                  <th class="p-2.5 min-w-[220px]">Kategori &amp; Identitas Objek</th>
                  <th class="p-2.5 min-w-[170px]">Spesifikasi / Luas / Model</th>
                  <th class="p-2.5 min-w-[170px]">Kapasitas / Dimensi / Unit</th>
                  <th class="p-2.5 min-w-[210px]">Dokumen Legalitas / Serial / Bukti</th>
                  <th class="p-2.5 min-w-[210px]">Alamat &amp; Lokasi Objek</th>
                  <th class="p-2.5 w-24 text-center">Urutan &amp; Aksi</th>
                </tr>
              </thead>
              <tbody id="tbody-objek" class="divide-y divide-slate-800/80">
                <!-- Baris objek akan diinject secara dinamis oleh renderTabelObjek() -->
              </tbody>
            </table>
          </div>

          `;

html = html.substring(0, idxTabelStart) + newTabelHtml + html.substring(idxTabelEnd);
console.log('✓ Tabel Objek Dinamis HTML berhasil diintegrasikan.');

// ============================================================================
// 3. PRIORITAS 4: POINT 7 BIAYA JASA PENILAIAN (Honorarium, Transport, Akomodasi, PPN)
// ============================================================================
console.log('3. Mengaplikasikan Penyempurnaan Biaya Jasa Penilaian...');

const oldBiayaStart = '<!-- 7. BIAYA JASA PENILAIAN, PPN 11% & TERBILANG RUPIAH -->';
const oldBiayaEndMarker = '<!-- 8. SMART MITIGASI AWAL & PENUNJUKAN PENILAI PUBLIK (GERBANG 1) -->';

const idxBiayaStart = html.indexOf(oldBiayaStart);
const idxBiayaEnd = html.indexOf(oldBiayaEndMarker);

if (idxBiayaStart === -1 || idxBiayaEnd === -1) {
  console.error('ERROR: Marker Biaya Jasa tidak ditemukan!');
  process.exit(1);
}

const newBiayaHtml = `<!-- 7. BIAYA JASA PENILAIAN, TRANSPORTASI, AKOMODASI & PAJAK (SPI 103) -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 class="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <span class="w-6 h-6 rounded-md bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs">07</span>
              <span>Biaya Jasa Penilaian, Transportasi, Akomodasi &amp; Pajak</span>
            </h3>

            <!-- Opsi Status: Biaya Belum Disepakati -->
            <label class="flex items-center gap-2 cursor-pointer select-none bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-amber-400 transition">
              <input type="checkbox" id="chk_biaya_belum_disepakati" onchange="kalkulasiBiaya()" class="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400">
              <span class="text-xs font-bold text-amber-300">Biaya Belum Disepakati (Tahap Penawaran Awal)</span>
            </label>
          </div>

          <!-- Rincian Biaya Transparan: Honorarium, Transportasi, Akomodasi, Operasional -->
          <div id="wrapper_rincian_biaya" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <!-- 1. Honorarium Jasa -->
              <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <label class="block font-bold text-slate-200">
                  1. Honorarium Jasa (Rp) <span class="text-rose-400">*</span>
                </label>
                <input type="number" id="biaya_honorarium" min="0" step="1000" oninput="kalkulasiBiaya()" placeholder="Contoh: 15000000" class="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-400">
                <span id="view_honorarium_formatted" class="block text-[10px] text-slate-400 font-mono">Rp 0,-</span>
              </div>

              <!-- 2. Transportasi -->
              <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="font-bold text-slate-200">2. Transportasi (Rp)</label>
                  <select id="status_transportasi" onchange="kalkulasiBiaya()" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 focus:outline-none">
                    <option value="INCLUDED" selected>Included (Termasuk)</option>
                    <option value="EXCLUDED">Excluded (Ditagihkan)</option>
                  </select>
                </div>
                <input type="number" id="biaya_transportasi" min="0" step="1000" oninput="kalkulasiBiaya()" placeholder="Contoh: 2500000" class="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono font-semibold text-xs focus:outline-none focus:border-amber-400">
                <span id="view_transportasi_formatted" class="block text-[10px] text-slate-400 font-mono">Rp 0,-</span>
              </div>

              <!-- 3. Akomodasi -->
              <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="font-bold text-slate-200">3. Akomodasi (Rp)</label>
                  <select id="status_akomodasi" onchange="kalkulasiBiaya()" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 focus:outline-none">
                    <option value="INCLUDED" selected>Included (Termasuk)</option>
                    <option value="EXCLUDED">Excluded (Ditagihkan)</option>
                  </select>
                </div>
                <input type="number" id="biaya_akomodasi" min="0" step="1000" oninput="kalkulasiBiaya()" placeholder="Contoh: 1500000" class="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono font-semibold text-xs focus:outline-none focus:border-amber-400">
                <span id="view_akomodasi_formatted" class="block text-[10px] text-slate-400 font-mono">Rp 0,-</span>
              </div>

              <!-- 4. Biaya Operasional Lainnya -->
              <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="font-bold text-slate-200">4. Operasional Lain (Rp)</label>
                  <select id="status_operasional_lain" onchange="kalkulasiBiaya()" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 focus:outline-none">
                    <option value="INCLUDED" selected>Included (Termasuk)</option>
                    <option value="EXCLUDED">Excluded (Ditagihkan)</option>
                  </select>
                </div>
                <input type="number" id="biaya_operasional_lain" min="0" step="1000" oninput="kalkulasiBiaya()" placeholder="0" class="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono font-semibold text-xs focus:outline-none focus:border-amber-400">
                <span id="view_operasional_formatted" class="block text-[10px] text-slate-400 font-mono">Rp 0,-</span>
              </div>
            </div>

            <!-- Ringkasan Pajak & Total Tagihan -->
            <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Dasar Pengenaan Pajak (DPP Rp)</label>
                <input type="number" id="biaya_dpp" readonly class="w-full h-10 px-3 rounded-lg bg-slate-900/80 border border-slate-700 text-amber-300 font-mono font-bold text-sm focus:outline-none">
                <span id="view_dpp_formatted" class="block text-[10px] text-slate-400 mt-1 font-mono">Rp 0,-</span>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="font-semibold text-slate-300">PPN 11% (Rp)</label>
                  <label class="flex items-center gap-1 cursor-pointer text-[10.5px] text-slate-400 select-none">
                    <input type="checkbox" id="chk_kena_ppn" checked onchange="kalkulasiBiaya()" class="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-amber-500">
                    <span>Kena PPN</span>
                  </label>
                </div>
                <input type="text" id="biaya_ppn" readonly class="w-full h-10 px-3 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 font-mono font-bold focus:outline-none">
                <span id="view_ppn_formatted" class="block text-[10px] text-slate-400 mt-1 font-mono">Rp 0,-</span>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Total Biaya Kontrak / Tagihan (Rp)</label>
                <input type="text" id="biaya_total" readonly class="w-full h-10 px-3 rounded-lg bg-slate-900/80 border border-slate-700 text-emerald-400 font-mono font-extrabold text-sm focus:outline-none">
                <span id="view_total_formatted" class="block text-[10px] text-emerald-300 mt-1 font-mono">Rp 0,-</span>
              </div>
            </div>

            <!-- Banner Notifikasi Saat Biaya Belum Disepakati -->
            <div id="banner_biaya_belum_disepakati" class="hidden p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span><strong>Status: Biaya Jasa Belum Disepakati.</strong> Dokumen SPK &amp; JO akan mencantumkan klausul kesepakatan tertulis terpisah (Tahap Penawaran / Negosiasi).</span>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800/80">
            <label class="block font-semibold text-slate-300 text-xs mb-1">Kalimat Terbilang Rupiah (Otomatis):</label>
            <div id="view_terbilang" class="p-3 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-bold text-xs italic tracking-wide">
              Nol Rupiah
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800/80">
            <div class="flex items-center justify-between mb-2">
              <label class="block font-semibold text-slate-300 text-xs">Skema Termin Penagihan (Pilihan Cepat):</label>
              <span class="text-[10px] text-amber-400 font-mono">Standar SOP KJPP NSR</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5">
              <button type="button" onclick="setSkemaTerminPenugasan('LUNAS_DIMUKA')" class="p-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 text-left transition hover:bg-slate-900 group cursor-pointer shadow-sm">
                <div class="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <span>💰</span>
                  <span>100% di Muka / Pra-Final</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">Pembayaran Penuh 100% di Muka / Sebelum Final diserahkan</div>
              </button>
              <button type="button" onclick="setSkemaTerminPenugasan('DP50_PELUNASAN50')" class="p-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 text-left transition hover:bg-slate-900 group cursor-pointer shadow-sm">
                <div class="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <span>⚖️</span>
                  <span>DP 50% + Pelunasan 50%</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">DP 50% saat SPK &amp; Pelunasan 50% saat final</div>
              </button>
              <button type="button" onclick="setSkemaTerminPenugasan('BAST_100')" class="p-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-sky-400 text-left transition hover:bg-slate-900 group cursor-pointer shadow-sm">
                <div class="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                  <span>🏛️</span>
                  <span>100% Pascaterbit / BAST</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">Termin 100% Pascaterbit / BAST (Proyek Pemerintah / BUMN)</div>
              </button>
            </div>
          </div>

          <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Ketentuan Cara Pembayaran <span class="text-rose-400">*</span></label>
              <input type="text" id="cara_pembayaran" value="Pembayaran dilakukan 100% setelah Lingkup Penugasan (SPK) ditandatangani para pihak." class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400">
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Rekening Resmi Pembayaran KJPP NSR</label>
              <select id="rekening_resmi" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-amber-400">
                <option value="MANDIRI" selected>Bank Mandiri Cab. Jakarta Ampera Raya — 127-00-1014166-9 (Default)</option>
                <option value="BJB">Bank BJB — 0124084891001</option>
                <option value="BRI">Bank BRI — 042501000955306</option>
                <option value="BTN">Bank BTN — 0019301300001254</option>
              </select>
            </div>
          </div>
        </div>

        `;

html = html.substring(0, idxBiayaStart) + newBiayaHtml + html.substring(idxBiayaEnd);
console.log('✓ Biaya Jasa HTML berhasil diintegrasikan.');

fs.writeFileSync('portal-penugasan-jo.html', html, 'utf8');
console.log('✓ Tahap 1, 2, 3 HTML berhasil disimpan.');
