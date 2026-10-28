import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'portal-penugasan-jo.html');
let content = fs.readFileSync(filePath, 'utf-8');

console.log('Panjang awal file:', content.length);

// ==============================================================================
// 1. GANTI BLOK TAB 2 UI (HTML)
// ==============================================================================
const startNeedle = '<div id="tab-content-dashboard" class="hidden space-y-6">';
const endNeedle = '<!-- ========================================================\n         TAB 3: MESIN PRATINJAU & CETAK DOKUMEN A4';

const tab2StartIdx = content.indexOf(startNeedle);
const tab3StartIdx = content.indexOf('TAB 3: MESIN PRATINJAU & CETAK DOKUMEN A4');

if (tab2StartIdx === -1 || tab3StartIdx === -1) {
  console.error('❌ Needle batas Tab 2 tidak ditemukan!');
  process.exit(1);
}

// Cari penutup </div> terakhir sebelum komentar TAB 3
const preTab3 = content.lastIndexOf('<!-- ========================================================', tab3StartIdx);
const tab2HtmlOld = content.substring(tab2StartIdx, preTab3).trim();

const tab2HtmlNew = `<div id="tab-content-dashboard" class="hidden space-y-6">
      
      <!-- 4 KARTU RINGKASAN MONITORING PENUGASAN & DEADLINE (TAHAP 2) -->
      <div id="container-monitoring-cards" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <!-- KARTU 1: TOTAL PENUGASAN AKTIF -->
        <button type="button" onclick="filterDariKartu('AKTIF')" id="card-metric-aktif" class="group text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all duration-200 shadow-xl cursor-pointer relative overflow-hidden focus:outline-none">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-300 transition-colors">Penugasan Aktif</span>
            <div class="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-all">
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span id="metric-val-aktif" class="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">0</span>
            <span class="text-[11px] text-blue-400 font-semibold">Proyek</span>
          </div>
          <div class="mt-2 flex items-center justify-between text-[10.5px]">
            <span class="text-slate-500">Berjalan &amp; Terbit SPK</span>
            <span id="pill-filter-aktif" class="hidden px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">Filter Aktif</span>
          </div>
        </button>

        <!-- KARTU 2: MENDEKATI TENGGAT (H-3 s.d H-1) -->
        <button type="button" onclick="filterDariKartu('DEADLINE_NEAR')" id="card-metric-near" class="group text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all duration-200 shadow-xl cursor-pointer relative overflow-hidden focus:outline-none">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-amber-300 transition-colors">Mendekati Tenggat</span>
            <div class="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-all">
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span id="metric-val-near" class="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">0</span>
            <span class="text-[11px] text-amber-400/80 font-semibold">H-3 s.d H-1</span>
          </div>
          <div class="mt-2 flex items-center justify-between text-[10.5px]">
            <span class="text-slate-500">Prioritas Pengerjaan</span>
            <span id="pill-filter-near" class="hidden px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">Filter Aktif</span>
          </div>
        </button>

        <!-- KARTU 3: MELEWATI TENGGAT (OVERDUE) -->
        <button type="button" onclick="filterDariKartu('OVERDUE')" id="card-metric-overdue" class="group text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-rose-500/50 transition-all duration-200 shadow-xl cursor-pointer relative overflow-hidden focus:outline-none">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-rose-300 transition-colors">Melewati Tenggat</span>
            <div class="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/20 transition-all">
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span id="metric-val-overdue" class="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight">0</span>
            <span class="text-[11px] text-rose-400/80 font-semibold">Overdue</span>
          </div>
          <div class="mt-2 flex items-center justify-between text-[10.5px]">
            <span class="text-slate-500">Melewati Batas SLA</span>
            <span id="pill-filter-overdue" class="hidden px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">Filter Aktif</span>
          </div>
        </button>

        <!-- KARTU 4: PENUGASAN SELESAI -->
        <button type="button" onclick="filterDariKartu('SELESAI')" id="card-metric-selesai" class="group text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 shadow-xl cursor-pointer relative overflow-hidden focus:outline-none">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-300 transition-colors">Penugasan Selesai</span>
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span id="metric-val-selesai" class="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">0</span>
            <span class="text-[11px] text-emerald-400/80 font-semibold">Selesai</span>
          </div>
          <div class="mt-2 flex items-center justify-between text-[10.5px]">
            <span class="text-slate-500">Laporan Telah Terbit</span>
            <span id="pill-filter-selesai" class="hidden px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Filter Aktif</span>
          </div>
        </button>

      </div>
      
      <!-- Kontrol Filter & Statistik Cepat -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div class="flex flex-wrap items-center gap-3 text-xs">
          <!-- Filter Status & Tenggat -->
          <div>
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
          </div>

          <!-- Filter Kantor Wilayah -->
          <div id="wrapper-filter-wilayah">
            <label class="block text-[10px] text-slate-400 font-bold uppercase mb-1">Kantor Wilayah:</label>
            <select id="filter_wilayah" onchange="renderDashboardTabel()" class="h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none">
              <option value="ALL">Semua Wilayah</option>
              <option value="Kantor Pusat Jakarta">Kantor Pusat Jakarta</option>
              <option value="Kantor Cabang Bandung">Kantor Cabang Bandung</option>
              <option value="Kantor Cabang Padang">Kantor Cabang Padang</option>
              <option value="Kantor Cabang Makassar">Kantor Cabang Makassar</option>
              <option value="Kantor Cabang Palembang">Kantor Cabang Palembang</option>
            </select>
          </div>

          <!-- Filter PIC (Penilai/Reviewer/Marketing) -->
          <div>
            <label class="block text-[10px] text-slate-400 font-bold uppercase mb-1">PIC &amp; Tim Penilai:</label>
            <select id="filter_pic" onchange="renderDashboardTabel()" class="h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none min-w-[140px]">
              <option value="ALL">Semua PIC</option>
            </select>
          </div>

          <!-- Filter Periode Waktu -->
          <div>
            <label class="block text-[10px] text-slate-400 font-bold uppercase mb-1">Periode Waktu:</label>
            <select id="filter_periode" onchange="renderDashboardTabel()" class="h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none">
              <option value="ALL">Semua Periode</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="LAST_MONTH">Bulan Lalu</option>
              <option value="THIS_YEAR">Tahun 2026</option>
            </select>
          </div>

          <!-- Pencarian Cepat -->
          <div>
            <label class="block text-[10px] text-slate-400 font-bold uppercase mb-1">Pencarian Cepat:</label>
            <input type="text" id="cari_proyek" oninput="renderDashboardTabel()" placeholder="Cari klien, debitur, PIC..." class="h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none min-w-[160px]">
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Reset Filter Button jika ada filter aktif -->
          <button type="button" id="btn-reset-filter" onclick="resetSemuaFilterMonitoring()" class="hidden px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1 cursor-pointer">
            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            <span>Reset Filter</span>
          </button>

          <span id="dashboard-sync-status" class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span>Counter Terakhir:</span>
            <strong id="counter-val-badge" class="text-amber-400 font-bold">415</strong>
          </span>
          <button type="button" onclick="sinkronisasiDataServer()" class="px-3 py-2 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-bold border border-blue-700 transition flex items-center gap-1.5 cursor-pointer shadow">
            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span>Sinkronkan Server</span>
          </button>
          <button type="button" id="btn-backup-cabang" onclick="unduhBackupPrivatCabang()" class="px-3 py-2 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-bold border border-emerald-700 transition flex items-center gap-1.5 cursor-pointer shadow" title="Unduh Backup Arsip Mandiri Cabang (.json)">
            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Unduh Backup Cabang (.json)</span>
          </button>
          <button type="button" id="btn-restore-cabang" onclick="triggerRestorePrivatCabang()" class="px-3 py-2 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-xs font-bold border border-amber-700 transition flex items-center gap-1.5 cursor-pointer shadow" title="Pulihkan Arsip Mandiri Cabang (.json)">
            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Pulihkan Data Cabang (.json)</span>
          </button>
          <input type="file" id="input-restore-cabang" onchange="handleFileRestoreCabang(event)" accept=".json" class="hidden">
        </div>
      </div>

      <!-- Tabel Antrean & Monitoring Penugasan -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs divide-y divide-slate-800">
            <thead class="bg-slate-950 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3 px-3.5">No. Pengajuan / ID</th>
                <th class="py-3 px-3.5 min-w-[130px]">Kantor Wilayah</th>
                <th class="py-3 px-3.5 min-w-[190px]">Pemberi Tugas &amp; Debitur</th>
                <th class="py-3 px-3.5 min-w-[140px]">Objek &amp; Nilai</th>
                <th class="py-3 px-3.5 min-w-[160px]">PIC &amp; Tim Penilai</th>
                <th class="py-3 px-3.5 min-w-[160px]">Target Penyelesaian (SLA)</th>
                <th class="py-3 px-3.5 min-w-[140px]">Nomor Resmi (SPK &amp; JO)</th>
                <th class="py-3 px-3.5 text-center">Status</th>
                <th class="py-3 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody id="tbody_antrean" data-alias="tbody-dashboard" class="divide-y divide-slate-800/80 text-slate-200"></tbody>
          </table>
        </div>
      </div>
    </div>`;

content = content.substring(0, tab2StartIdx) + tab2HtmlNew + '\n\n    ' + content.substring(preTab3);
console.log('✔ Tab 2 UI berhasil diganti. Panjang baru:', content.length);

// ==============================================================================
// 2. ENRICH SEED_PROJECTS DENGAN BERBAGAI KONDISI DEADLINE & CABANG
// ==============================================================================
const seedStartNeedle = 'const SEED_PROJECTS = [';
const seedEndNeedle = '];\n\n    // ==========================================================';

const seedStartIdx = content.indexOf(seedStartNeedle);
const seedEndIdx = content.indexOf(seedEndNeedle, seedStartIdx);

if (seedStartIdx !== -1 && seedEndIdx !== -1) {
  const seedProjectsNew = `const SEED_PROJECTS = [
      {
        id: "NSR-2026-0415",
        status: "APPROVED",
        status_pekerjaan: "IN_PROGRESS",
        nomor_adm: "0415/JO/NSR/X/2026",
        nomor_lp: "0415/NSR/PN-APP/X/2026",
        jenis_laporan: "APP",
        kantor_wilayah: "Kantor Pusat Jakarta",
        mode_pengaju: "PUSAT",
        tanggal_surat: "2026-10-14",
        rujukan_surat_nomor: "012/SPK-SIM/X/2026",
        rujukan_surat_tanggal: "2026-10-11",
        masa_berlaku_lp: "2026-11-13",
        target_selesai: "2026-11-13",
        pemberi_tugas_nama: "PT BANK CONTOH NASIONAL TBK (SIMULASI)",
        bidang_usaha_klien: "Perbankan",
        pemberi_tugas_pic: "Divisi Kredit Komersial",
        pemberi_tugas_jabatan: "Pimpinan Bagian Agunan",
        pemberi_tugas_kontak: "021-5000-8899",
        pemberi_tugas_email: "kanwil_simulasi@bank-contoh.co.id",
        pemberi_tugas_alamat: "Jl. P. Diponegoro No. 15 Medan, Kel. Petisah Tengah, Kec. Medan Petisah, Kota Medan, Sumatera Utara",
        pemberi_tugas_npwp: "01.000.000.0-000.000 (Simulasi Perbankan)",
        pengguna_laporan_a: "PT BANK CONTOH NASIONAL TBK (SIMULASI)",
        pengguna_laporan_b: "-",
        debitur_nama: "PT SIMULASI DEBITUR PRIMA (CONTOH)",
        debitur_cp: "Bpk. Budi Santoso (Simulasi / 0812-0000-1111)",
        pemilik_sertipikat: "PT SIMULASI DEBITUR PRIMA (CONTOH)",
        hubungan_pemilik: "Milik Sendiri",
        tujuan_penilaian: "Penjaminan Utang / Agunan Kredit",
        dasar_nilai: "Nilai Pasar (SPI 101) & Indikasi Nilai Likuidasi (SPI 202)",
        pendekatan_penilaian: "Pendekatan Pasar dan Pendekatan Biaya",
        mata_uang: "Rupiah (IDR)",
        tanggal_penilaian: "2026-10-14",
        sumber_proyek: "Direct Klien - Divisi BD",
        pic_marketing: "Divisi BD & Marketing",
        marketing_nama: "Divisi BD & Marketing",
        rekan_nama: "Deni Siswandi, S.T., MAPPI (Cert.)",
        rekan_izin: "P-1.20.00581",
        reviewer_nama: "Angga Malid Cahyadi",
        penilai_nama: "Tedi Setiadi, S.T.",
        asisten_nama: "Yasir Rizal, A.Md.",
        surveyor_pendamping: "Heru Kurnia (15-A-05444) / Bpk. Budi Santoso (Simulasi)",
        survey_hari: "Kamis",
        survey_tanggal: "2026-10-15",
        sla_inspeksi: 2,
        sla_analisa: 3,
        sla_final: 2,
        sla_total: 7,
        ceklis_tanah: true,
        ceklis_bangunan: true,
        ceklis_ruko: false,
        ceklis_sarana: true,
        ceklis_mesin: false,
        ceklis_kendaraan: false,
        dok_sertifikat: true,
        dok_imb: true,
        dok_pbb: true,
        dok_denah: true,
        dok_invoice: false,
        dok_list: false,
        biaya_dpp: 15000000,
        biaya_ppn: 1650000,
        biaya_total: 16650000,
        terbilang: "Enam Belas Juta Enam Ratus Lima Puluh Ribu Rupiah",
        cara_pembayaran: "Pembayaran dilakukan 100% setelah Lingkup Penugasan (SPK) ditandatangani para pihak.",
        rekening_kode: "MANDIRI",
        rekening_resmi: DAFTAR_REKENING_NSR.MANDIRI.teksCetak,
        objek_list: [
          {
            debitur: "PT SIMULASI DEBITUR PRIMA (CONTOH)",
            jenis: "Tanah dan Bangunan Gudang",
            lt: "1500",
            lb: "850",
            milik: "Tunggal",
            status: "SHGB / Hak Milik Tunggal a.n. PT SIMULASI DEBITUR PRIMA",
            lokasi: "Kawasan Industri Terpadu Blok A No. 1, Banten"
          }
        ],
        approved_at: "2026-10-14T04:15:00.000Z",
        disetujui_oleh: "Admin Pusat (OTORISASI RESMI)",
        folder_drive_url: "-",
        created_at: "2026-10-14T04:00:00.000Z"
      },
      {
        id: "NSR-2026-0416",
        status: "APPROVED",
        status_pekerjaan: "IN_PROGRESS",
        nomor_adm: "0416/JO/NSR/X/2026",
        nomor_lp: "0416/NSR/PN-APP/X/2026",
        jenis_laporan: "APP",
        kantor_wilayah: "Kantor Cabang Bandung",
        mode_pengaju: "CABANG",
        tanggal_surat: "2026-10-17",
        rujukan_surat_nomor: "105/SPK/BCA/BDG/X/2026",
        rujukan_surat_tanggal: "2026-10-16",
        masa_berlaku_lp: "2026-10-24",
        target_selesai: "2026-10-24",
        pemberi_tugas_nama: "PT BANK CENTRAL ASIA TBK (BCA)",
        bidang_usaha_klien: "Perbankan Swasta",
        pemberi_tugas_pic: "Bpk. Rahmat Subagja",
        pemberi_tugas_jabatan: "Penilai Jaminan Kredit",
        pemberi_tugas_kontak: "022-420-1122",
        pemberi_tugas_email: "agunan_bdg@bca.co.id",
        pemberi_tugas_alamat: "Jl. Asia Afrika No. 122 Bandung",
        pemberi_tugas_npwp: "01.321.112.3-421.000",
        pengguna_laporan_a: "PT BANK CENTRAL ASIA TBK",
        pengguna_laporan_b: "-",
        debitur_nama: "PT KARYA MEGAH PROPERTINDO (CONTOH)",
        debitur_cp: "Bpk. Hendra (0812-2233-4455)",
        pemilik_sertipikat: "PT KARYA MEGAH PROPERTINDO",
        hubungan_pemilik: "Milik Sendiri",
        tujuan_penilaian: "Penjaminan Hutang / Agunan Kredit",
        dasar_nilai: "Nilai Pasar (SPI 101) & Indikasi Nilai Likuidasi (SPI 202)",
        pendekatan_penilaian: "Pendekatan Biaya (Cost) & Pasar (Market)",
        mata_uang: "Rupiah (IDR)",
        tanggal_penilaian: "2026-10-17",
        sumber_proyek: "KCU BCA Dago Bandung",
        pic_marketing: "Ardi Nurmayadi, S.T.",
        marketing_nama: "Ardi Nurmayadi, S.T.",
        rekan_nama: "Deni Siswandi, S.T., MAPPI (Cert.)",
        rekan_izin: "P-1.20.00581",
        reviewer_nama: "Danny Taufik Hidayat, S.H.",
        penilai_nama: "Ardi Nurmayadi, S.T.",
        asisten_nama: "Yasir Rizal, A.Md.",
        surveyor_pendamping: "Ardi Nurmayadi, S.T.",
        survey_hari: "Senin",
        survey_tanggal: "2026-10-19",
        sla_inspeksi: 1,
        sla_analisa: 2,
        sla_final: 2,
        sla_total: 5,
        biaya_dpp: 14000000,
        biaya_ppn: 1540000,
        biaya_total: 15540000,
        terbilang: "Lima Belas Juta Lima Ratus Empat Puluh Ribu Rupiah",
        cara_pembayaran: "Pembayaran 100% setelah SPK ditandatangani",
        rekening_kode: "MANDIRI",
        rekening_resmi: DAFTAR_REKENING_NSR.MANDIRI.teksCetak,
        objek_list: [
          {
            jenis: "Ruko 3 Lantai",
            lt: "180",
            lb: "360",
            status: "SHGB No. 441/Dago",
            lokasi: "Jl. Ir. H. Djuanda No. 99 Bandung"
          }
        ],
        approved_at: "2026-10-17T08:00:00.000Z",
        disetujui_oleh: "Admin Pusat (OTORISASI RESMI)",
        folder_drive_url: "-",
        created_at: "2026-10-17T07:30:00.000Z"
      },
      {
        id: "NSR-2026-0414",
        status: "APPROVED",
        status_pekerjaan: "IN_PROGRESS",
        nomor_adm: "0414/JO/NSR/X/2026",
        nomor_lp: "0414/NSR/PN-APP/X/2026",
        jenis_laporan: "APP",
        kantor_wilayah: "Kantor Cabang Padang",
        mode_pengaju: "CABANG",
        tanggal_surat: "2026-10-05",
        rujukan_surat_nomor: "055/SPK-NAGARI/X/2026",
        rujukan_surat_tanggal: "2026-10-04",
        masa_berlaku_lp: "2026-10-18",
        target_selesai: "2026-10-18",
        pemberi_tugas_nama: "PT BANK NAGARI (BPD SUMBAR)",
        bidang_usaha_klien: "Perbankan Daerah",
        pemberi_tugas_pic: "Ibu Nurhasanah",
        pemberi_tugas_jabatan: "Analis Kredit Komersial",
        pemberi_tugas_kontak: "0751-31500",
        pemberi_tugas_email: "kredit@banknagari.co.id",
        pemberi_tugas_alamat: "Jl. Pemuda No. 21 Padang, Sumatera Barat",
        pemberi_tugas_npwp: "01.001.223.4-201.000",
        pengguna_laporan_a: "PT BANK NAGARI",
        pengguna_laporan_b: "-",
        debitur_nama: "CV SUMATERA AGRO JAYA (CONTOH)",
        debitur_cp: "Bpk. Syamsul Bahri (0813-7411-8899)",
        pemilik_sertipikat: "CV SUMATERA AGRO JAYA",
        hubungan_pemilik: "Milik Sendiri",
        tujuan_penilaian: "Penjaminan Utang / Agunan Kredit",
        dasar_nilai: "Nilai Pasar (SPI 101)",
        pendekatan_penilaian: "Pendekatan Pasar dan Biaya",
        mata_uang: "Rupiah (IDR)",
        tanggal_penilaian: "2026-10-05",
        sumber_proyek: "Bank Nagari Kantor Pusat Padang",
        pic_marketing: "Ahmad Fadhil, S.E.",
        marketing_nama: "Ahmad Fadhil, S.E.",
        rekan_nama: "Deni Siswandi, S.T., MAPPI (Cert.)",
        rekan_izin: "P-1.20.00581",
        reviewer_nama: "Angga Malid Cahyadi",
        penilai_nama: "Tedi Setiadi, S.T.",
        asisten_nama: "Yasir Rizal, A.Md.",
        surveyor_pendamping: "Tedi Setiadi, S.T.",
        survey_hari: "Senin",
        survey_tanggal: "2026-10-06",
        sla_inspeksi: 2,
        sla_analisa: 4,
        sla_final: 2,
        sla_total: 8,
        biaya_dpp: 11000000,
        biaya_ppn: 1210000,
        biaya_total: 12210000,
        terbilang: "Dua Belas Juta Dua Ratus Sepuluh Ribu Rupiah",
        cara_pembayaran: "Pembayaran 100% setelah SPK ditandatangani",
        rekening_kode: "MANDIRI",
        rekening_resmi: DAFTAR_REKENING_NSR.MANDIRI.teksCetak,
        objek_list: [
          {
            jenis: "Pabrik Pengolahan Sawit",
            lt: "5000",
            lb: "1800",
            status: "SHM No. 891/Agam",
            lokasi: "Kec. Lubuk Basung, Kab. Agam, Sumatera Barat"
          }
        ],
        approved_at: "2026-10-05T09:00:00.000Z",
        disetujui_oleh: "Admin Pusat (OTORISASI RESMI)",
        folder_drive_url: "-",
        created_at: "2026-10-05T08:30:00.000Z"
      },
      {
        id: "NSR-2026-0413",
        status: "SELESAI",
        status_pekerjaan: "SELESAI",
        nomor_adm: "0413/JO/NSR/X/2026",
        nomor_lp: "0413/NSR/PN-APP/X/2026",
        jenis_laporan: "APP",
        kantor_wilayah: "Kantor Pusat Jakarta",
        mode_pengaju: "PUSAT",
        tanggal_surat: "2026-10-01",
        rujukan_surat_nomor: "010/SPK-BRI/X/2026",
        rujukan_surat_tanggal: "2026-09-30",
        masa_berlaku_lp: "2026-10-15",
        target_selesai: "2026-10-15",
        pemberi_tugas_nama: "PT BANK RAKYAT INDONESIA (PERSERO) TBK",
        bidang_usaha_klien: "Bank BUMN",
        pemberi_tugas_pic: "Divisi Agunan & Penilaian",
        pemberi_tugas_jabatan: "Manager Penilai Agunan",
        pemberi_tugas_kontak: "021-5758900",
        pemberi_tugas_email: "agunan@bri.co.id",
        pemberi_tugas_alamat: "Gedung BRI I Lt. 18, Jl. Jend. Sudirman Kav. 44-46 Jakarta Pusat",
        pemberi_tugas_npwp: "01.000.013.8-093.000",
        pengguna_laporan_a: "PT BANK RAKYAT INDONESIA TBK",
        pengguna_laporan_b: "-",
        debitur_nama: "PT LOGISTIK NUSANTARA RAYA (CONTOH)",
        debitur_cp: "Bpk. Bambang Wijaya (0811-9988-7766)",
        pemilik_sertipikat: "PT LOGISTIK NUSANTARA RAYA",
        hubungan_pemilik: "Milik Sendiri",
        tujuan_penilaian: "Penjaminan Utang / Agunan Kredit",
        dasar_nilai: "Nilai Pasar (SPI 101) & Nilai Likuidasi (SPI 202)",
        pendekatan_penilaian: "Pendekatan Pasar dan Biaya",
        mata_uang: "Rupiah (IDR)",
        tanggal_penilaian: "2026-10-01",
        sumber_proyek: "Divisi Corporate Banking BRI",
        pic_marketing: "Divisi BD & Marketing",
        marketing_nama: "Divisi BD & Marketing",
        rekan_nama: "Deni Siswandi, S.T., MAPPI (Cert.)",
        rekan_izin: "P-1.20.00581",
        reviewer_nama: "Deni Siswandi, S.T., MAPPI (Cert.)",
        penilai_nama: "Tedi Setiadi, S.T.",
        asisten_nama: "Yasir Rizal, A.Md.",
        surveyor_pendamping: "Tedi Setiadi, S.T.",
        survey_hari: "Kamis",
        survey_tanggal: "2026-10-02",
        sla_inspeksi: 2,
        sla_analisa: 3,
        sla_final: 2,
        sla_total: 7,
        biaya_dpp: 18000000,
        biaya_ppn: 1980000,
        biaya_total: 19980000,
        terbilang: "Sembilan Belas Juta Sembilan Ratus Delapan Puluh Ribu Rupiah",
        cara_pembayaran: "Pembayaran 100% setelah SPK ditandatangani",
        rekening_kode: "MANDIRI",
        rekening_resmi: DAFTAR_REKENING_NSR.MANDIRI.teksCetak,
        objek_list: [
          {
            jenis: "Tanah & Kompleks Pergudangan",
            lt: "3200",
            lb: "1950",
            status: "SHGB No. 1205/Cakung",
            lokasi: "Kawasan Pergudangan Cakung, Jakarta Timur"
          }
        ],
        approved_at: "2026-10-01T10:00:00.000Z",
        disetujui_oleh: "Admin Pusat (OTORISASI RESMI)",
        folder_drive_url: "-",
        created_at: "2026-10-01T09:30:00.000Z",
        selesai_at: "2026-10-15T15:00:00.000Z"
      },
      {
        id: "NSR-2026-REQ-001",
        status: "WAITING_APPROVAL",
        status_pekerjaan: "IN_PROGRESS",
        nomor_adm: "Menunggu Otorisasi Pusat",
        nomor_lp: "Menunggu Otorisasi Pusat",
        kantor_wilayah: "Kantor Cabang Bandung",
        mode_pengaju: "CABANG",
        tanggal_surat: "2026-10-14",
        rujukan_surat_nomor: "098/SPK-SIM/BDG/X/2026",
        rujukan_surat_tanggal: "2026-10-12",
        masa_berlaku_lp: "",
        target_selesai: "",
        pemberi_tugas_nama: "PT BANK CONTOH REGIONAL TBK (SIMULASI)",
        bidang_usaha_klien: "Perbankan",
        pemberi_tugas_pic: "Ibu Simulasi PIC",
        pemberi_tugas_jabatan: "Kepala Operasi Kredit Komersial",
        pemberi_tugas_kontak: "0813-0000-3333",
        pemberi_tugas_email: "pic@bank-simulasi.co.id",
        pemberi_tugas_alamat: "Jl. Asia Afrika No. 122, Sumur Bandung, Kota Bandung, Jawa Barat 40112",
        pemberi_tugas_npwp: "01.000.000.0-031.000 (Simulasi Perbankan)",
        pengguna_laporan_a: "PT BANK CONTOH REGIONAL TBK (SIMULASI)",
        pengguna_laporan_b: "PT Bank Contoh Regional Tbk KC Bandung",
        debitur_nama: "PT SIMULASI USAHA MANDIRI (CONTOH)",
        debitur_cp: "Bpk. Hendra (Simulasi / 0812-0000-2222)",
        pemilik_sertipikat: "PT SIMULASI USAHA MANDIRI (CONTOH)",
        hubungan_pemilik: "Milik Sendiri",
        tujuan_penilaian: "Penjaminan Hutang / Agunan Kredit",
        dasar_nilai: "Nilai Pasar (SPI 101) & Indikasi Nilai Likuidasi (SPI 202)",
        pendekatan_penilaian: "Pendekatan Biaya (Cost) & Pendekatan Data Pasar (Market)",
        mata_uang: "Rupiah (IDR)",
        tanggal_penilaian: "2026-10-14",
        sumber_proyek: "KCU Wilayah Bandung",
        pic_marketing: "Ardi Nurmayadi, S.T.",
        marketing_nama: "Ardi Nurmayadi, S.T.",
        rekan_nama: "Deni Siswandi, S.T., MAPPI (Cert.)",
        rekan_izin: "P-1.20.00581",
        reviewer_nama: "Danny Taufik Hidayat, S.H.",
        penilai_nama: "Ardi Nurmayadi, S.T.",
        asisten_nama: "Yasir Rizal, A.Md.",
        surveyor_pendamping: "Yasir Rizal, A.Md. / Bpk. Hendra (Simulasi)",
        survey_hari: "Selasa",
        survey_tanggal: "2026-10-15",
        sla_inspeksi: 1,
        sla_analisa: 2,
        sla_final: 2,
        sla_total: 5,
        ceklis_tanah: true,
        ceklis_bangunan: true,
        ceklis_ruko: true,
        ceklis_sarana: true,
        ceklis_mesin: false,
        ceklis_kendaraan: false,
        dok_sertifikat: true,
        dok_imb: true,
        dok_pbb: true,
        dok_denah: true,
        dok_invoice: false,
        dok_list: false,
        biaya_dpp: 12500000,
        biaya_ppn: 1375000,
        biaya_total: 13875000,
        terbilang: "Tiga Belas Juta Delapan Ratus Tujuh Puluh Lima Ribu Rupiah",
        cara_pembayaran: "Pembayaran dilakukan 100% setelah Lingkup Penugasan (SPK) ditandatangani para pihak.",
        rekening_kode: "MANDIRI",
        rekening_resmi: DAFTAR_REKENING_NSR.MANDIRI.teksCetak,
        objek_list: [
          {
            jenis: "Ruko / Rukan 3 Lantai",
            lt: "150",
            lb: "360",
            status: "SHGB No. 112/Simulasi",
            lokasi: "Jl. Terusan Buah Batu No. 88, Bandung, Jawa Barat"
          }
        ],
        approved_at: "-",
        disetujui_oleh: "-",
        folder_drive_url: "-",
        created_at: "2026-10-14T09:15:00Z"
      }
    ];`;

  content = content.substring(0, seedStartIdx) + seedProjectsNew + content.substring(seedEndIdx + 2);
  console.log('✔ SEED_PROJECTS berhasil diperkaya dengan 5 kondisi riil.');
} else {
  console.warn('⚠️ Batas SEED_PROJECTS tidak ditemukan persis.');
}

// ==============================================================================
// 3. UPDATE mapSheetRowToProject(r) UNTUK MENDUKUNG target_selesai
// ==============================================================================
const mapNeedle = 'masa_berlaku_lp: normDate(r.Masa_Berlaku_LP),';
const mapIdx = content.indexOf(mapNeedle);
if (mapIdx !== -1) {
  const replacement = `masa_berlaku_lp: normDate(r.Masa_Berlaku_LP),
        target_selesai: normDate(r.Target_Selesai || r.Tgl_Target_Selesai || r.Deadline || r.target_selesai || r.tgl_target_selesai || r.deadline || r.Masa_Berlaku_LP),
        status_pekerjaan: r.Status_Pekerjaan || r.status_pekerjaan || '',`;
  content = content.substring(0, mapIdx) + replacement + content.substring(mapIdx + mapNeedle.length);
  console.log('✔ mapSheetRowToProject berhasil diperbarui dengan target_selesai.');
} else {
  console.warn('⚠️ Needle masa_berlaku_lp di mapSheetRowToProject tidak ditemukan.');
}

// ==============================================================================
// 4. SUNTIKKAN HELPER MONITORING & TIMEZONE ASIA/JAKARTA (WIB)
// ==============================================================================
const helperBlock = `
    // ==========================================================
    // 9B. MODUL MONITORING PENUGASAN, SLA & DEADLINE (TAHAP 2)
    // ==========================================================
    let activeMonitoringFilter = null; // 'AKTIF' | 'DEADLINE_NEAR' | 'OVERDUE' | 'SELESAI' | null

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    /**
     * Dapatkan tanggal hari ini dalam format YYYY-MM-DD zona waktu Asia/Jakarta (WIB)
     */
    function getTodayDateWIB() {
      try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        return formatter.format(new Date());
      } catch (e) {
        const now = new Date();
        const wibMs = now.getTime() + (7 * 3600 * 1000 + now.getTimezoneOffset() * 60 * 1000);
        const d = new Date(wibMs);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return \`\${y}-\${m}-\${day}\`;
      }
    }

    /**
     * Memeriksa apakah penugasan sudah purna/selesai
     */
    function isProjectSelesai(p) {
      if (!p) return false;
      const st = String(p.status || '').toUpperCase().trim();
      const stKerja = String(p.status_pekerjaan || '').toUpperCase().trim();
      if (['SELESAI', 'COMPLETED', 'LAPORAN_TERBIT', 'CLOSED', 'FINISH', 'FINISHED'].includes(st) ||
          ['SELESAI', 'COMPLETED', 'LAPORAN_TERBIT', 'CLOSED', 'FINISH', 'FINISHED'].includes(stKerja)) {
        return true;
      }
      if (p.is_selesai === true) return true;
      return false;
    }

    /**
     * Ekstraksi tanggal target penyelesaian riil tanpa rekayasa
     */
    function getProjectTargetDate(p) {
      if (!p) return null;
      const raw = p.target_selesai || p.tgl_target_selesai || p.deadline || p.Target_Selesai || p.Tgl_Target_Selesai || p.Deadline || p.masa_berlaku_lp || p.Masa_Berlaku_LP;
      if (!raw) return null;
      const str = String(raw).trim();
      if (!str || str === '-' || str.toLowerCase() === 'belum ditentukan' || str.toLowerCase() === 'null') {
        return null;
      }
      const m = str.match(/(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})/);
      if (m) {
        return \`\${m[1]}-\${String(m[2]).padStart(2, '0')}-\${String(m[3]).padStart(2, '0')}\`;
      }
      return null;
    }

    /**
     * Menghitung selisih hari tanggal target dengan hari ini (WIB)
     */
    function hitungSelisihHariTenggat(targetDateStr, todayStr = getTodayDateWIB()) {
      if (!targetDateStr) return null;
      const [tY, tM, tD] = targetDateStr.split('-').map(Number);
      const [nowY, nowM, nowD] = todayStr.split('-').map(Number);
      if (!tY || !tM || !tD || !nowY || !nowM || !nowD) return null;
      
      const targetUtc = Date.UTC(tY, tM - 1, tD);
      const todayUtc = Date.UTC(nowY, nowM - 1, nowD);
      return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
    }

    /**
     * Evaluasi Status & Deadline Badge Sesuai Aturan Ketat:
     * 1. Selesai -> Kategori SELESAI (TIDAK PERNAH DIHITUNG OVERDUE)
     * 2. Tanpa Target -> Kategori BELUM_DITENTUKAN (BUKAN OVERDUE)
     * 3. Diff < 0 -> OVERDUE
     * 4. Diff 0 s.d 3 -> DEADLINE_NEAR (H-3 s.d H-0)
     * 5. Diff > 3 -> AMAN
     */
    function evaluasiDeadlinePenugasan(p, todayStr = getTodayDateWIB()) {
      const isSelesai = isProjectSelesai(p);
      const targetStr = getProjectTargetDate(p);

      if (isSelesai) {
        return {
          kategori: 'SELESAI',
          label: 'Selesai',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold',
          icon: '✔',
          diff: null,
          targetStr: targetStr || '-'
        };
      }

      if (!targetStr) {
        return {
          kategori: 'BELUM_DITENTUKAN',
          label: 'Belum ditentukan',
          badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700 font-medium',
          icon: '⏳',
          diff: null,
          targetStr: '-'
        };
      }

      const diff = hitungSelisihHariTenggat(targetStr, todayStr);

      if (diff < 0) {
        const lewat = Math.abs(diff);
        return {
          kategori: 'OVERDUE',
          label: \`Overdue (\${lewat} hr)\`,
          badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black animate-pulse',
          icon: '⚠️',
          diff: diff,
          targetStr: targetStr
        };
      } else if (diff <= 3) {
        const sisa = diff === 0 ? 'Hari Ini (H-0)' : (diff === 1 ? 'Besok (H-1)' : \`H-\${diff}\`);
        return {
          kategori: 'DEADLINE_NEAR',
          label: sisa,
          badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold',
          icon: '⏰',
          diff: diff,
          targetStr: targetStr
        };
      } else {
        return {
          kategori: 'AMAN',
          label: \`\${diff} hr lagi\`,
          badgeClass: 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium',
          icon: '🗓️',
          diff: diff,
          targetStr: targetStr
        };
      }
    }

    /**
     * Ambil daftar personil unik (Penilai, Reviewer, Marketing) untuk filter dinamis
     */
    function ambilDaftarPICUnik(list) {
      const setPic = new Set();
      list.forEach(p => {
        [p.penilai_nama, p.reviewer_nama, p.pic_marketing, p.marketing_nama, p.rekan_nama, p.asisten_nama].forEach(name => {
          if (name && typeof name === 'string') {
            const clean = name.trim();
            if (clean && clean !== '-' && clean.length > 2) {
              setPic.add(clean);
            }
          }
        });
      });
      return Array.from(setPic).sort((a, b) => a.localeCompare(b, 'id'));
    }

    /**
     * Interaktivitas Klik-to-Filter dari 4 Kartu Ringkasan
     */
    function filterDariKartu(filterType) {
      if (activeMonitoringFilter === filterType) {
        // Klik ulang kartu yang sama -> Reset ke Semua
        activeMonitoringFilter = null;
      } else {
        activeMonitoringFilter = filterType;
      }

      const selectStatus = document.getElementById('filter_status');
      if (selectStatus) {
        selectStatus.value = activeMonitoringFilter ? activeMonitoringFilter : 'ALL';
      }

      renderDashboardTabel();
    }

    /**
     * Handler saat dropdown status diubah manual
     */
    function tanganiGantiFilterStatus() {
      const selectStatus = document.getElementById('filter_status');
      const val = selectStatus ? selectStatus.value : 'ALL';
      if (['AKTIF', 'DEADLINE_NEAR', 'OVERDUE', 'SELESAI'].includes(val)) {
        activeMonitoringFilter = val;
      } else {
        activeMonitoringFilter = null;
      }
      renderDashboardTabel();
    }

    /**
     * Update visual ring & badge pill pada 4 kartu monitoring
     */
    function perbaruiTampilanKartuAktif(activeStatus) {
      const mapCards = {
        'AKTIF': { card: 'card-metric-aktif', pill: 'pill-filter-aktif', ring: 'ring-2 ring-blue-400 border-blue-500 bg-blue-950/40 shadow-blue-900/30' },
        'DEADLINE_NEAR': { card: 'card-metric-near', pill: 'pill-filter-near', ring: 'ring-2 ring-amber-400 border-amber-500 bg-amber-950/40 shadow-amber-900/30' },
        'OVERDUE': { card: 'card-metric-overdue', pill: 'pill-filter-overdue', ring: 'ring-2 ring-rose-400 border-rose-500 bg-rose-950/40 shadow-rose-900/30' },
        'SELESAI': { card: 'card-metric-selesai', pill: 'pill-filter-selesai', ring: 'ring-2 ring-emerald-400 border-emerald-500 bg-emerald-950/40 shadow-emerald-900/30' }
      };

      Object.entries(mapCards).forEach(([k, info]) => {
        const elCard = document.getElementById(info.card);
        const elPill = document.getElementById(info.pill);
        if (elCard) {
          // Bersihkan ring kelas lama
          info.ring.split(' ').forEach(cls => elCard.classList.remove(cls));
          if (activeStatus === k) {
            info.ring.split(' ').forEach(cls => elCard.classList.add(cls));
          }
        }
        if (elPill) {
          if (activeStatus === k) elPill.classList.remove('hidden');
          else elPill.classList.add('hidden');
        }
      });
    }

    /**
     * Reset semua filter ke kondisi awal
     */
    function resetSemuaFilterMonitoring() {
      activeMonitoringFilter = null;
      const s1 = document.getElementById('filter_status'); if (s1) s1.value = 'ALL';
      const s2 = document.getElementById('filter_wilayah'); if (s2) s2.value = 'ALL';
      const s3 = document.getElementById('filter_pic'); if (s3) s3.value = 'ALL';
      const s4 = document.getElementById('filter_periode'); if (s4) s4.value = 'ALL';
      const s5 = document.getElementById('cari_proyek'); if (s5) s5.value = '';
      renderDashboardTabel();
    }

    /**
     * Aksi Cepat: Tandai Selesai / Buka Kembali Status Penugasan
     */
    function toggleStatusSelesai(projectId, makeSelesai) {
      const p = projectDatabase.find(item => item.id === projectId);
      if (!p) return;

      const pesan = makeSelesai
        ? \`Konfirmasi penyelesaian pekerjaan "\\\${p.id}" (\${p.debitur_nama || 'Debitur'})?\\n\\nStatus akan diubah menjadi SELESAI dan laporan dinyatakan terbit.\`
        : \`Buka kembali status penugasan "\\\${p.id}"?\\n\\nPenugasan akan kembali berstatus AKTIF (Berjalan).\`;

      if (!confirm(pesan)) return;

      if (makeSelesai) {
        p.status = 'SELESAI';
        p.status_pekerjaan = 'SELESAI';
        p.selesai_at = new Date().toISOString();
      } else {
        p.status = p.nomor_lp && p.nomor_lp !== 'Menunggu Otorisasi Pusat' ? 'APPROVED' : 'WAITING_APPROVAL';
        p.status_pekerjaan = 'IN_PROGRESS';
        delete p.selesai_at;
      }

      simpanDatabaseLokal();
      renderDashboardTabel();
    }
`;

// ==============================================================================
// 5. UPGRADE LENGKAP renderDashboardTabel()
// ==============================================================================
const renderStartNeedle = '// 10. RENDER TABEL DASHBOARD ANTREAN';
const renderStartIdx = content.indexOf(renderStartNeedle);
const printEngineNeedle = '// 11. MESIN RENDER 9 DOKUMEN (PRINT & PREVIEW ENGINE)';
const printEngineIdx = content.indexOf(printEngineNeedle);

if (renderStartIdx === -1 || printEngineIdx === -1) {
  console.error('❌ Needle renderDashboardTabel tidak ditemukan!');
  process.exit(1);
}

const renderPreComment = content.lastIndexOf('// ==========================================================', renderStartIdx);

const renderFunctionNew = helperBlock + `
    // ==========================================================
    // 10. RENDER TABEL DASHBOARD ANTREAN & MONITORING PENUGASAN (TAHAP 2)
    // ==========================================================
    function renderDashboardTabel() {
      // 1. Ambil sesi autentikasi aktif:
      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const tbody = document.getElementById('tbody_antrean') || document.querySelector('#tab-2 tbody') || document.getElementById('tbody-dashboard') || document.querySelector('#tab-content-dashboard tbody');
      if (!tbody) return;

      const fStatus = document.getElementById('filter_status')?.value || 'ALL';
      const fWil = document.getElementById('filter_wilayah')?.value || 'ALL';
      const fPic = document.getElementById('filter_pic')?.value || 'ALL';
      const fPeriode = document.getElementById('filter_periode')?.value || 'ALL';
      const query = document.getElementById('cari_proyek')?.value.toLowerCase().trim() || '';

      const isCabangUser = Boolean(auth && (auth.isCabang || (auth.mode === 'CABANG' && !auth.isSuperAdmin)));

      // Kunci/sembunyikan filter wilayah untuk pengguna kantor cabang demi kepatuhan RBAC isolasi data
      const wrapWil = document.getElementById('wrapper-filter-wilayah');
      if (wrapWil) {
        if (isCabangUser) {
          wrapWil.classList.add('hidden');
        } else {
          wrapWil.classList.remove('hidden');
        }
      }

      // Gabungkan data cloud dengan arsip privat lokal cabang pengguna
      const localPrivate = ambilDataPrivatCabang((auth && auth.wilayah) || userSession.wilayah);
      let combined = [...localPrivate];
      projectDatabase.forEach(p => {
        if (!combined.some(x => x.id === p.id)) {
          combined.push(p);
        }
      });

      // 2. Jika sesi adalah KANTOR CABANG: terapkan isolasi data ketat
      let namaCabangSesi = '';
      if (auth && auth.isCabang) {
        const namaCabang = (auth.wilayahLabel || auth.wilayah || '').toLowerCase();
        const kataKunci = namaCabang.replace('kantor cabang', '').trim();
        const kodeKemenkeu = (auth.kodeWilayah || auth.kode || auth.kodeKantor || '').toLowerCase();
        namaCabangSesi = kataKunci;

        combined = combined.filter(item => {
          const wilayahItem = (item.kantor_wilayah || item.wilayah || '').toLowerCase();
          const kodeItem = (item.kode_kantor || item.kode || item.kodeWilayah || '').toLowerCase();
          const noSpkItem = (item.nomor_spk || item.no_spk || item.nomor_lp || '').toLowerCase();
          const noAdmItem = (item.nomor_adm || item.id || '').toLowerCase();
          const shortCode = (auth.wilayahCode || kataKunci.substring(0, 3)).toLowerCase();
          
          return wilayahItem.includes(kataKunci) || 
                 (kodeKemenkeu && kodeItem.includes(kodeKemenkeu)) || 
                 (noSpkItem && (noSpkItem.includes(\`nsr-\${shortCode}\`) || noSpkItem.includes(\`/\${shortCode}/\`) || noSpkItem.includes(\`nsr-\${kataKunci.substring(0, 3)}\`))) ||
                 (noAdmItem && (noAdmItem.includes(\`nsr-\${shortCode}\`) || noAdmItem.includes(\`/\${shortCode}/\`)));
        });
      }

      // 3. POPULASI FILTER PIC DINAMIS
      const selectPic = document.getElementById('filter_pic');
      if (selectPic) {
        const currentSelectedPic = selectPic.value || 'ALL';
        const picList = ambilDaftarPICUnik(combined);
        const optHtml = ['<option value="ALL">Semua PIC &amp; Tim Penilai</option>'];
        picList.forEach(pic => {
          const sel = (pic === currentSelectedPic) ? ' selected' : '';
          optHtml.push(\`<option value="\${escapeHtml(pic)}"\${sel}>\${escapeHtml(pic)}</option>\`);
        });
        selectPic.innerHTML = optHtml.join('');
      }

      // 4. HITUNG 4 METRIK MONITORING PENUGASAN (BERDASARKAN DATA SCOPE PENGGUNA)
      const todayWIB = getTodayDateWIB();
      let countAktif = 0;
      let countNear = 0;
      let countOverdue = 0;
      let countSelesai = 0;

      // Basis metrik: Jika pimpinan memilih cabang tertentu, hitung cabang tersebut. Jika ALL, hitung lintas kantor.
      const baseForMetrics = (!isCabangUser && fWil !== 'ALL')
        ? combined.filter(p => p.kantor_wilayah === fWil)
        : combined;

      baseForMetrics.forEach(p => {
        const isSelesai = isProjectSelesai(p);
        if (isSelesai) {
          countSelesai++;
        } else {
          countAktif++;
          const ev = evaluasiDeadlinePenugasan(p, todayWIB);
          if (ev.kategori === 'DEADLINE_NEAR') countNear++;
          else if (ev.kategori === 'OVERDUE') countOverdue++;
        }
      });

      const elValAktif = document.getElementById('metric-val-aktif');
      const elValNear = document.getElementById('metric-val-near');
      const elValOverdue = document.getElementById('metric-val-overdue');
      const elValSelesai = document.getElementById('metric-val-selesai');
      if (elValAktif) elValAktif.textContent = countAktif;
      if (elValNear) elValNear.textContent = countNear;
      if (elValOverdue) elValOverdue.textContent = countOverdue;
      if (elValSelesai) elValSelesai.textContent = countSelesai;

      // Update highlight kartu aktif
      perbaruiTampilanKartuAktif(fStatus);

      // Tampilkan/sembunyikan tombol Reset Filter
      const btnReset = document.getElementById('btn-reset-filter');
      if (btnReset) {
        const isAnyFilterActive = (fStatus !== 'ALL') || (!isCabangUser && fWil !== 'ALL') || (fPic !== 'ALL') || (fPeriode !== 'ALL') || Boolean(query);
        if (isAnyFilterActive) btnReset.classList.remove('hidden');
        else btnReset.classList.add('hidden');
      }

      // Update badge antrean count
      const waitingCount = combined.filter(p => p.status === "WAITING_APPROVAL" || p.status === "WAITING_BRANCH_ADMIN").length;
      const badgeCount = document.getElementById('badge-antrean-count');
      if (badgeCount) {
        if (isCabangUser) {
          badgeCount.classList.add('hidden');
        } else if (waitingCount > 0) {
          badgeCount.textContent = waitingCount;
          badgeCount.classList.remove('hidden');
        } else {
          badgeCount.classList.add('hidden');
        }
      }

      // Counter Terakhir
      const badgeCounter = document.getElementById('counter-val-badge');
      if (badgeCounter) {
        if (isCabangUser) {
          badgeCounter.textContent = combined.length;
        } else {
          badgeCounter.textContent = serverCounter.LAST_NO_ADM_JO || 415;
        }
      }

      // 5. SARING DATA SESUAI SELURUH FILTER AKTIF
      let list = combined.filter(p => {
        // Filter Wilayah (hanya untuk pusat)
        if (!isCabangUser && fWil !== "ALL" && p.kantor_wilayah !== fWil) return false;

        const isSelesai = isProjectSelesai(p);
        const ev = evaluasiDeadlinePenugasan(p, todayWIB);

        // Filter Status & Tenggat
        if (fStatus === "AKTIF") {
          if (isSelesai) return false;
        } else if (fStatus === "DEADLINE_NEAR") {
          if (isSelesai || ev.kategori !== "DEADLINE_NEAR") return false;
        } else if (fStatus === "OVERDUE") {
          if (isSelesai || ev.kategori !== "OVERDUE") return false;
        } else if (fStatus === "SELESAI") {
          if (!isSelesai) return false;
        } else if (fStatus === "WAITING_APPROVAL") {
          if (p.status !== "WAITING_APPROVAL" && p.status !== "WAITING_BRANCH_ADMIN") return false;
        } else if (fStatus === "APPROVED") {
          if (p.status !== "APPROVED" || isSelesai) return false;
        }

        // Filter PIC & Tim Penilai
        if (fPic !== "ALL") {
          const timList = [p.penilai_nama, p.reviewer_nama, p.pic_marketing, p.marketing_nama, p.rekan_nama, p.asisten_nama]
            .filter(Boolean)
            .map(s => String(s).trim().toLowerCase());
          if (!timList.includes(fPic.trim().toLowerCase())) return false;
        }

        // Filter Periode Waktu
        if (fPeriode !== "ALL") {
          const refDateStr = p.tanggal_surat || p.created_at || p.target_selesai;
          if (!refDateStr) return false;
          const dRef = new Date(refDateStr);
          const now = new Date();
          if (fPeriode === "THIS_MONTH") {
            if (dRef.getFullYear() !== now.getFullYear() || dRef.getMonth() !== now.getMonth()) return false;
          } else if (fPeriode === "LAST_MONTH") {
            const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            const lastMonthIdx = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            if (dRef.getFullYear() !== lastMonthYear || dRef.getMonth() !== lastMonthIdx) return false;
          } else if (fPeriode === "THIS_YEAR") {
            if (dRef.getFullYear() !== now.getFullYear() && dRef.getFullYear() !== 2026) return false;
          }
        }

        // Pencarian Cepat
        if (query) {
          const matchKlien = (p.pemberi_tugas_nama || "").toLowerCase().includes(query);
          const matchDebitur = (p.debitur_nama || "").toLowerCase().includes(query);
          const matchNo = (p.nomor_lp || p.nomor_spk || p.nomor_adm || p.id || "").toLowerCase().includes(query);
          const matchPic = [p.penilai_nama, p.reviewer_nama, p.pic_marketing, p.marketing_nama].some(s => (s || '').toLowerCase().includes(query));
          const matchWil = (p.kantor_wilayah || "").toLowerCase().includes(query);
          if (!matchKlien && !matchDebitur && !matchNo && !matchPic && !matchWil) return false;
        }

        return true;
      });

      // 6. TAMPILKAN EMPTY STATE JIKA BELUM ADA DATA COCOK
      if (list.length === 0) {
        if (auth && auth.isCabang) {
          tbody.innerHTML = \`
            <tr>
              <td colspan="9" class="text-center py-12 text-slate-400 bg-slate-800/20">
                <div class="flex flex-col items-center justify-center gap-2">
                  <span class="text-3xl">📋</span>
                  <p class="font-semibold text-slate-300">Belum Ada Riwayat Penugasan untuk \${escapeHtml(auth.wilayahLabel || 'Kantor Cabang')}</p>
                  <p class="text-xs text-slate-500">Seluruh penerbitan SPK &amp; JO mandiri cabang akan tercatat secara otomatis di sini.</p>
                </div>
              </td>
            </tr>
          \`;
        } else {
          tbody.innerHTML = \`
            <tr>
              <td colspan="9" class="py-12 text-center text-slate-400 bg-slate-800/10">
                <div class="flex flex-col items-center justify-center gap-2">
                  <span class="text-2xl">🔍</span>
                  <p class="font-semibold text-slate-300">Tidak ada penugasan yang sesuai kriteria filter.</p>
                  <p class="text-xs text-slate-500">Coba ubah status, pilihan PIC, atau klik tombol Reset Filter.</p>
                  <button type="button" onclick="resetSemuaFilterMonitoring()" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700">
                    Reset Semua Filter
                  </button>
                </div>
              </td>
            </tr>\`;
        }
        return;
      }

      // 7. RENDER 9 KOLOM RESMI DAFTAR PENUGASAN & MONITORING DEADLINE
      tbody.innerHTML = list.map(p => {
        const isApproved = (p.status === "APPROVED");
        const isSelesai = isProjectSelesai(p);
        const ev = evaluasiDeadlinePenugasan(p, todayWIB);

        // Status Badge Pekerjaan
        let statusBadge = "";
        if (p.is_private) {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
               🔒 MANDIRI CABANG
             </span>\`;
        } else if (isSelesai) {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
               ✔ SELESAI
             </span>\`;
        } else if (isApproved) {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
               <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span> SPK Terbit (Aktif)
             </span>\`;
        } else {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
               <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span> Menunggu Otorisasi
             </span>\`;
        }

        const displayFee = getMaskedFeeDisplay(p.biaya_total, userSession.role);
        const isFeeMasked = (userSession.role === 'REVIEWER' || userSession.role === 'PENILAI' || userSession.role === 'MARKETING');

        // Target Tenggat Display
        const targetStr = getProjectTargetDate(p);
        const targetFormatted = targetStr ? formatTanggalIndo(targetStr) : 'Belum ditentukan';
        const slaTotalText = p.sla_total ? \`\${p.sla_total} Hari Kerja\` : '-';

        // Objek Display
        const objekText = p.objek_list && p.objek_list[0] ? (p.objek_list[0].jenis || p.objek_list[0].debitur || 'Objek Properti') : '-';

        return \`
          <tr class="hover:bg-slate-800/40 transition">
            <!-- 1. No. Pengajuan / ID -->
            <td class="py-3 px-3.5 font-mono font-bold text-slate-300 text-xs">
              <span class="block">\${escapeHtml(p.id)}</span>
              \${p.is_private ? \`<span class="block text-[9.5px] text-emerald-400 font-semibold">Zero-Cloud Lokal</span>\` : ''}
            </td>

            <!-- 2. Kantor Wilayah & Tanggal Surat -->
            <td class="py-3 px-3.5 text-xs">
              <span class="block font-bold text-white leading-tight">\${escapeHtml(p.kantor_wilayah || 'Kantor Pusat Jakarta')}</span>
              <span class="text-slate-400 text-[10px] font-mono block pt-0.5">\${formatTanggalIndo(p.tanggal_surat)}</span>
            </td>

            <!-- 3. Pemberi Tugas & Debitur -->
            <td class="py-3 px-3.5 text-xs">
              <span class="block font-extrabold text-amber-300 line-clamp-1 leading-snug">\${escapeHtml(p.debitur_nama || '-')}</span>
              <span class="block text-[10.5px] text-slate-300 line-clamp-1 pt-0.5">\${escapeHtml(p.pemberi_tugas_nama || '-')}</span>
            </td>

            <!-- 4. Objek & Nilai Kontrak -->
            <td class="py-3 px-3.5 text-xs">
              <span class="block font-semibold text-slate-200 line-clamp-1">\${escapeHtml(objekText)}</span>
              <span class="block font-mono text-[11px] pt-0.5 \${isFeeMasked ? 'text-amber-300 font-semibold italic' : 'text-emerald-400 font-bold'}">\${displayFee}</span>
            </td>

            <!-- 5. PIC & Tim Penilai -->
            <td class="py-3 px-3.5 text-[11px]">
              <div class="space-y-0.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono uppercase font-bold shrink-0">Penilai</span>
                  <span class="text-slate-200 font-medium truncate max-w-[120px]">\${escapeHtml(p.penilai_nama || '-')}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono uppercase font-bold shrink-0">Review</span>
                  <span class="text-slate-300 truncate max-w-[120px]">\${escapeHtml(p.reviewer_nama || '-')}</span>
                </div>
                \${p.pic_marketing ? \`
                  <div class="flex items-center gap-1.5 text-slate-400">
                    <span class="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-500 font-mono uppercase font-bold shrink-0">Mktg</span>
                    <span class="truncate max-w-[120px]">\${escapeHtml(p.pic_marketing)}</span>
                  </div>
                \` : ''}
              </div>
            </td>

            <!-- 6. Target Penyelesaian (SLA) & Deadline Badge -->
            <td class="py-3 px-3.5 text-xs">
              <div class="space-y-1">
                <span class="block font-semibold \${targetStr ? 'text-slate-200' : 'text-slate-500 italic'}">\${targetFormatted}</span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] \${ev.badgeClass}">
                    <span>\${ev.icon}</span>
                    <span>\${ev.label}</span>
                  </span>
                  \${p.sla_total ? \`<span class="text-[9.5px] text-slate-400 font-mono">(\${slaTotalText})</span>\` : ''}
                </div>
              </div>
            </td>

            <!-- 7. Nomor Resmi (SPK & JO) -->
            <td class="py-3 px-3.5 font-mono text-[11px]">
              <span class="block font-bold \${isApproved ? 'text-sky-300' : 'text-slate-500'} truncate max-w-[140px]">\${escapeHtml(p.nomor_lp)}</span>
              <span class="block text-[10px] \${isApproved ? 'text-amber-400' : 'text-slate-600'} truncate max-w-[140px]">\${escapeHtml(p.nomor_adm)}</span>
            </td>

            <!-- 8. Status Pekerjaan -->
            <td class="py-3 px-3.5 text-center">
              \${statusBadge}
            </td>

            <!-- 9. Aksi -->
            <td class="py-3 px-3.5 text-right">
              <div class="inline-flex items-center gap-1.5 flex-wrap justify-end">
                
                <!-- Quick Toggle Selesai / Buka Kembali -->
                \${!isSelesai ? \`
                  <button type="button" onclick="toggleStatusSelesai('\${p.id}', true)" class="px-2 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 font-bold text-[10.5px] transition shadow flex items-center gap-1 cursor-pointer" title="Tandai Penugasan Selesai">
                    <span>✔ Selesai</span>
                  </button>
                \` : \`
                  <button type="button" onclick="toggleStatusSelesai('\${p.id}', false)" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10.5px] transition flex items-center gap-1 cursor-pointer" title="Buka Kembali Penugasan">
                    <span>↩ Buka</span>
                  </button>
                \`}

                <!-- Tombol Approve untuk Admin Pusat -->
                \${!isApproved && !p.is_private && (userSession.isSuperAdmin || userSession.role === "ADMIN_PUSAT" || userSession.role === "SUPER_ADMIN" || userSession.role === "SUPER ADMIN") ? \`
                  <button type="button" onclick="approveProyekPusat('\${p.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] transition shadow cursor-pointer" title="Approve &amp; Terbitkan Nomor Resmi">
                    Approve
                  </button>
                \` : ''}

                <!-- Cetak 9 Dokumen -->
                \${isApproved && p.metode_pengesahan === 'SCAN_BASAH' && p.berkas_scan_pdf ? \`
                  <a href="\${p.berkas_scan_pdf.file_url}" target="_blank" download="\${p.berkas_scan_pdf.nama_file}" class="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10.5px] transition shadow flex items-center gap-1" title="Unduh Berkas Scan Basah PDF">
                    Unduh Scan
                  </a>
                \` : \`
                  <button type="button" onclick="bukaPratinjauProyek('\${p.id}')" class="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] transition shadow cursor-pointer" title="Buka &amp; Cetak 9 Dokumen A4">
                    \${isApproved ? 'Pratinjau' : 'Cetak 9 Dok'}
                  </button>
                \`}

                <!-- Hapus Proyek (Otorisasi) -->
                \${(!isCabangUser && (auth.isSuperAdmin || userSession.role === 'ADMIN_PUSAT' || userSession.role === 'SUPER_ADMIN' || userSession.role === 'SUPER ADMIN')) || (isCabangUser && (p.is_private || (p.kantor_wilayah || '').toLowerCase().includes(namaCabangSesi))) ? \`
                  <button type="button" onclick="hapusProyek('\${p.id}')" class="p-1 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition cursor-pointer" title="Hapus">
                    <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                \` : ''}
              </div>
            </td>
          </tr>
        \`;
      }).join('');
    }
\n    `;

content = content.substring(0, renderPreComment) + renderFunctionNew + content.substring(printEngineIdx);
console.log('✔ renderDashboardTabel berhasil diperbarui dengan modul monitoring & deadline.');

// Tulis kembali ke file
fs.writeFileSync(filePath, content, 'utf-8');
console.log('🎉 Pembaruan portal-penugasan-jo.html selesai! Panjang akhir:', content.length);
