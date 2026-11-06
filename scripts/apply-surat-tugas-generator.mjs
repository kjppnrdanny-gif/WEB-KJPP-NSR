import fs from 'fs';
import path from 'path';

const filePath = path.resolve('portal-tracking.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Applying Surat Tugas & Tanda Terima Lapangan (M-03) Generator to portal-tracking.html...');

const hasCrlf = content.includes('\r\n');
let normContent = content.replace(/\r\n/g, '\n');

function replaceNorm(target, replacement, desc) {
  const normTarget = target.replace(/\r\n/g, '\n').trim();
  const normReplacement = replacement.replace(/\r\n/g, '\n');
  if (normContent.includes(normTarget)) {
    normContent = normContent.replace(normTarget, normReplacement);
    console.log(`✅ ${desc} successfully applied`);
    return true;
  } else {
    console.error(`❌ ${desc} FAILED: Target not found`);
    return false;
  }
}

// 1. Add CSS rules in <style>
const cssTarget = `      #modal-cetak-spm-pdf:not(.hidden), [data-modal="modal-pratinjau-spm"]:not(.hidden) {`;
const cssReplacement = `      body.modal-surat-tugas-open header,
      body.modal-surat-tugas-open main,
      body.modal-surat-tugas-open #modal-ganti-pengguna,
      body.modal-surat-tugas-open #modal-update-milestone,
      body.modal-surat-tugas-open #modal-filter-lanjutan,
      body.modal-surat-tugas-open #modal-detail-history,
      body.modal-surat-tugas-open #modal-cetak-spm-pdf,
      body.modal-surat-tugas-open #modal-qr-penugasan,
      body.modal-surat-tugas-open #modal-data-pembanding {
        display: none !important;
      }

      #modal-cetak-surat-tugas:not(.hidden) {
        position: static !important;
        inset: auto !important;
        display: block !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
        width: 100% !important;
        box-shadow: none !important;
      }

      #modal-cetak-surat-tugas:not(.hidden) > div {
        box-shadow: none !important;
        border: none !important;
        max-width: 100% !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        border-radius: 0 !important;
        overflow: visible !important;
      }

      #surat-tugas-printable-scroll {
        max-height: none !important;
        overflow: visible !important;
        padding: 0 !important;
      }

      .st-page-break {
        page-break-after: always !important;
        break-after: page !important;
      }

      #modal-cetak-spm-pdf:not(.hidden), [data-modal="modal-pratinjau-spm"]:not(.hidden) {`;

replaceNorm(cssTarget, cssReplacement, 'CSS Print Rules');

// 2. Add Buttons to #container-field-m03-m04
const m03Target = `              <button type="button" onclick="bukaModalInputPembanding(activeJob ? (activeJob.jo_number || activeJob.id) : '')" class="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10.5px] font-bold transition cursor-pointer">
                📷 +Input Data
              </button>
            </div>
          </div>
        </div>`;

const m03Replacement = `              <button type="button" onclick="bukaModalInputPembanding(activeJob ? (activeJob.jo_number || activeJob.id) : '')" class="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10.5px] font-bold transition cursor-pointer">
                📷 +Input Data
              </button>
            </div>
          </div>
          <!-- Opsi B: Generator Cetak Surat Tugas & Tanda Terima Lapangan (M-03) -->
          <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="text-[11px] font-bold text-slate-200">Dokumen Inspeksi Lapangan (M-03):</span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" onclick="cetakSuratTugasAktif()" class="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm">
                <span>📄 Cetak Surat Tugas</span>
              </button>
              <button type="button" onclick="cetakTandaTerimaAktif()" class="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[10.5px] font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm">
                <span>📋 Tanda Terima Lapangan (BAI)</span>
              </button>
            </div>
          </div>
        </div>`;

replaceNorm(m03Target, m03Replacement, 'Buttons in #container-field-m03-m04');

// 3. Add Quick Action in renderTaskBoardDetailActions
const detailActionsTarget = `      // 2. Tahap M-02, M-03, M-04 -> Tautan ke Portal Biaya Operasional (BOP)
      if (['M-02', 'M-03', 'M-04'].includes(currentM)) {`;

const detailActionsReplacement = `      // Tahap M-02, M-03, M-04 -> Cetak Surat Tugas & Tanda Terima Lapangan (M-03)
      if (['M-02', 'M-03', 'M-04'].includes(currentM)) {
        actionsHtml += \`
          <button type="button" onclick="bukaModalCetakSuratTugas('\${jo}')"
            class="w-full flex items-center justify-between rounded-lg border border-emerald-600/40 bg-emerald-950/20 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-500 hover:bg-emerald-900/30 shadow-sm cursor-pointer text-left">
            <span class="truncate">Surat Tugas &amp; Tanda Terima (M-03)</span>
            <span class="text-emerald-400 ml-1 shrink-0">📄</span>
          </button>
        \`;
      }

      // 2. Tahap M-02, M-03, M-04 -> Tautan ke Portal Biaya Operasional (BOP)
      if (['M-02', 'M-03', 'M-04'].includes(currentM)) {`;

replaceNorm(detailActionsTarget, detailActionsReplacement, 'Sidebar Quick Action');

// 4. Add "📄 Tugas" button to task board row
const rowTarget = `                  <button onclick="bukaModalQrPenugasan('\${job.id_jo}')" title="QR Surveyor Mobile" class="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 rounded text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer active:scale-95">
                    <span>📱 QR</span>
                  </button>`;

const rowReplacement = `                  <button onclick="bukaModalQrPenugasan('\${job.id_jo}')" title="QR Surveyor Mobile" class="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 rounded text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer active:scale-95">
                    <span>📱 QR</span>
                  </button>
                  <button onclick="bukaModalCetakSuratTugas('\${job.id_jo}')" title="Cetak Surat Tugas &amp; Tanda Terima Lapangan (M-03)" class="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer active:scale-95">
                    <span>📄 Tugas</span>
                  </button>`;

replaceNorm(rowTarget, rowReplacement, 'Task Board Row Button');

// 5. Add Modal Markup for #modal-cetak-surat-tugas
const modalMarkup = `
  <!-- ==================== MODAL CETAK SURAT TUGAS & TANDA TERIMA LAPANGAN (PDF / PRINT-READY) ==================== -->
  <div id="modal-cetak-surat-tugas" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
    <div class="bg-white text-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl relative overflow-hidden flex flex-col print:p-0 print:shadow-none print:w-full print:max-w-none print:rounded-none">
      
      <!-- FLOATING ACTION TOOLBAR (Hanya Tampil di Layar / Tidak Tercetak) -->
      <div class="no-print sticky top-0 left-0 right-0 z-50 bg-slate-900 border-b-2 border-slate-700 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl font-sans rounded-t-2xl">
        <div class="flex items-center gap-2.5 sm:gap-3">
          <span class="bg-emerald-600 text-white text-[11px] font-black px-2 py-1 rounded tracking-wide shrink-0">M-03 LAPANGAN</span>
          <span class="text-slate-100 text-xs sm:text-sm font-bold">Surat Tugas &amp; Tanda Terima Lapangan — KJPP NSR</span>
          <span class="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-[10px] border border-slate-700" id="print-st-jo-badge">JO-...</span>
        </div>

        <!-- Mode Tampilan & Cetak Selector -->
        <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
          <button type="button" id="btn-mode-st-all" onclick="setModeCetakSuratTugas('all')" class="px-2.5 py-1 rounded-lg font-bold transition text-amber-400 bg-slate-800 border border-amber-500/40">
            📄 Lengkap (Semua)
          </button>
          <button type="button" id="btn-mode-st-only" onclick="setModeCetakSuratTugas('surat_tugas')" class="px-2.5 py-1 rounded-lg font-medium text-slate-400 hover:text-white transition">
            📄 Surat Tugas
          </button>
          <button type="button" id="btn-mode-bai-only" onclick="setModeCetakSuratTugas('tanda_terima')" class="px-2.5 py-1 rounded-lg font-medium text-slate-400 hover:text-white transition">
            📋 Tanda Terima (BAI)
          </button>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button type="button" onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white border-0 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow transition">
            🖨️ Cetak / PDF (A4)
          </button>
          <button type="button" onclick="tutupModalCetakSuratTugas()" class="bg-slate-700 hover:bg-slate-600 text-white border-0 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition">
            ✕ Tutup
          </button>
        </div>
      </div>

      <!-- KONTEN DOKUMEN CETAK RESMI A4 (BUNGKUS SCROLLABLE) -->
      <div id="surat-tugas-printable-scroll" class="overflow-y-auto max-h-[82vh] p-6 sm:p-8 bg-white text-slate-900 font-sans print:max-h-none print:overflow-visible print:p-0">
        
        <!-- ==================== LEMBAR 1: SURAT TUGAS INSPEKSI LAPANGAN ==================== -->
        <div id="lembar-surat-tugas" class="st-page-break text-slate-900 text-xs leading-normal mb-8 print:mb-0">
          
          <!-- KOP SURAT RESMI STANDAR KEMENKEU RI -->
          <div class="border-b-2 border-slate-900 pb-3 mb-4 text-center">
            <h2 class="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900">KJPP NANANG RAHAYU SIGIT PARYANTO &amp; REKAN</h2>
            <p class="text-[10.5px] sm:text-[11.5px] font-bold text-slate-800">KANTOR JASA PENILAI PUBLIK (KJPP)</p>
            <p class="text-[10px] sm:text-[10.5px] font-semibold text-slate-700">Izin Usaha Menteri Keuangan RI No. 2.19.0160 (KMK No. 248/KM.1/2019)</p>
            <p class="text-[9px] text-slate-600 mt-0.5">Kantor Pusat: Jakarta &bull; Cabang: Bandung | Padang | Makassar | Palembang</p>
            <p class="text-[9px] text-slate-500 font-mono">Website: kjppnanangrahayu.com &bull; Email: info@kjppnanangrahayu.com &bull; Hotline: +62 851-1051-3157</p>
          </div>

          <!-- JUDUL DOKUMEN -->
          <div class="text-center my-3">
            <h3 class="text-sm font-black uppercase tracking-wider text-slate-900">SURAT TUGAS INSPEKSI LAPANGAN</h3>
            <p class="text-[11px] font-mono font-bold text-slate-800 mt-0.5">Nomor: <span id="st-nomor-surat">ST/NSR-PUSAT/2026/0001</span></p>
          </div>

          <p class="text-[11px] text-slate-700 leading-relaxed my-2.5">
            Pimpinan Rekan Kantor Jasa Penilai Publik (KJPP) Nanang Rahayu Sigit Paryanto &amp; Rekan dengan ini memberikan tugas kedinasan pemeriksaan fisik objek properti kepada personil di bawah ini:
          </p>

          <!-- TABEL 1: PERSONIL YANG DITUGASKAN -->
          <div class="border border-slate-300 rounded-lg p-2.5 my-2.5 bg-slate-50/70">
            <h4 class="font-bold text-[10.5px] uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
              <span>I. PERSONIL PENILAI / SURVEYOR PELAKSANA</span>
            </h4>
            <table class="w-full text-[11px]">
              <tbody>
                <tr>
                  <td class="w-32 font-semibold text-slate-600 py-0.5">Nama Petugas</td>
                  <td class="w-3 text-slate-400">:</td>
                  <td class="font-bold text-slate-900" id="st-petugas-nama">-</td>
                  <td class="w-28 font-semibold text-slate-600 py-0.5">NIK Pegawai</td>
                  <td class="w-3 text-slate-400">:</td>
                  <td class="font-mono text-slate-800" id="st-petugas-nik">-</td>
                </tr>
                <tr>
                  <td class="font-semibold text-slate-600 py-0.5">Jabatan / Peran</td>
                  <td class="text-slate-400">:</td>
                  <td id="st-petugas-jabatan">Penilai Pelaksana / Surveyor Lapangan</td>
                  <td class="font-semibold text-slate-600 py-0.5">Unit Kantor</td>
                  <td class="text-slate-400">:</td>
                  <td id="st-petugas-kantor">-</td>
                </tr>
                <tr>
                  <td class="font-semibold text-slate-600 py-0.5">Kontak Surveyor</td>
                  <td class="text-slate-400">:</td>
                  <td colspan="4" class="font-mono text-slate-800" id="st-petugas-kontak">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- TABEL 2: DASAR PENUGASAN & OBJEK PENILAIAN -->
          <div class="border border-slate-300 rounded-lg p-2.5 my-2.5 bg-white">
            <h4 class="font-bold text-[10.5px] uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
              <span>II. DASAR PENUGASAN &amp; DATA OBJEK PENILAIAN</span>
            </h4>
            <table class="w-full text-[11px]">
              <tbody>
                <tr>
                  <td class="w-32 font-semibold text-slate-600 py-0.5">Nomor Job Order (JO)</td>
                  <td class="w-3 text-slate-400">:</td>
                  <td class="font-mono font-bold text-slate-900" id="st-jo-number">-</td>
                  <td class="w-28 font-semibold text-slate-600 py-0.5">No. SPK / Order</td>
                  <td class="w-3 text-slate-400">:</td>
                  <td class="font-mono text-slate-800" id="st-spk-number">-</td>
                </tr>
                <tr>
                  <td class="font-semibold text-slate-600 py-0.5">Pemberi Tugas</td>
                  <td class="text-slate-400">:</td>
                  <td class="font-semibold text-slate-900" id="st-pemberi-tugas">-</td>
                  <td class="font-semibold text-slate-600 py-0.5">Tgl. SPK / Order</td>
                  <td class="text-slate-400">:</td>
                  <td class="font-mono" id="st-spk-date">-</td>
                </tr>
                <tr>
                  <td class="font-semibold text-slate-600 py-0.5">Pengguna Laporan</td>
                  <td class="text-slate-400">:</td>
                  <td id="st-pengguna-laporan">-</td>
                  <td class="font-semibold text-slate-600 py-0.5">Tujuan Penilaian</td>
                  <td class="text-slate-400">:</td>
                  <td id="st-tujuan-penilaian">-</td>
                </tr>
                <tr>
                  <td class="font-semibold text-slate-600 py-0.5">Debitur / Pemilik Aset</td>
                  <td class="text-slate-400">:</td>
                  <td class="font-bold text-slate-900" id="st-debitur">-</td>
                  <td class="font-semibold text-slate-600 py-0.5">Jenis Properti</td>
                  <td class="text-slate-400">:</td>
                  <td class="font-semibold" id="st-jenis-properti">-</td>
                </tr>
                <tr>
                  <td class="font-semibold text-slate-600 py-0.5">Alamat / Lokasi Objek</td>
                  <td class="text-slate-400">:</td>
                  <td colspan="4" class="text-slate-800" id="st-lokasi-aset">-</td>
                </tr>
                <tr>
                  <td class="font-semibold text-slate-600 py-0.5">Estimasi Luas Aset</td>
                  <td class="text-slate-400">:</td>
                  <td id="st-luas-aset">-</td>
                  <td class="font-semibold text-slate-600 py-0.5">Dokumen Legalitas</td>
                  <td class="text-slate-400">:</td>
                  <td id="st-dokumen-legalitas">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- LINGKUP INSTRUKSI TUGAS LAPANGAN -->
          <div class="border border-slate-300 rounded-lg p-2.5 my-2.5 bg-slate-50/50 text-[10.5px]">
            <h4 class="font-bold uppercase tracking-wider text-slate-800 mb-1">III. LINGKUP INSTRUKSI TUGAS LAPANGAN (SPI 103):</h4>
            <ol class="list-decimal pl-4 space-y-0.5 text-slate-700 leading-normal">
              <li>Menunjukkan Surat Tugas ini kepada pemilik aset / debitur / pihak yang berwenang mendampingi di lokasi inspeksi.</li>
              <li>Melakukan pengamatan fisik menyeluruh (eksterior &amp; interior) dan pengukuran luas batas fisik aset.</li>
              <li>Mengambil dokumentasi foto properti lengkap dengan perekaman titik koordinat GPS (geotagging) untuk audit eLSa-PK Kemenkeu RI.</li>
              <li>Mengumpulkan minimal 3 (tiga) data pasar pembanding properti sejenis di sekitar lingkungan objek penilaian.</li>
              <li>Mengisi Formulir Berita Acara Inspeksi &amp; Tanda Terima Lapangan (BAI) serta meminta tanda tangan pihak pendamping.</li>
            </ol>
          </div>

          <!-- OTENTIKASI QR CODE & TANDA TANGAN PEMBERI TUGAS -->
          <div class="grid grid-cols-2 gap-4 mt-5 pt-2 text-[10.5px] items-end">
            <!-- Box QR Code SSOT -->
            <div class="flex items-start gap-3">
              <div id="st-qrcode-box" class="w-[100px] h-[100px] bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 shadow-sm">
                <!-- QR Code canvas/img injected by JS -->
              </div>
              <div class="text-[9.5px] text-slate-600 leading-tight">
                <span class="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 text-[9px] mb-1">
                  ✓ TERVERIFIKASI SSOT
                </span>
                <p class="font-semibold text-slate-800">Scan QR untuk Keabsahan Dokumen:</p>
                <p class="font-mono text-slate-500 mt-0.5 text-[8.5px]" id="st-kode-lacak">TRK-...</p>
                <p class="text-[8px] text-slate-400 mt-1">Dokumen resmi diterbitkan dari Sistem Operasional Terpadu KJPP Nanang Rahayu Sigit Paryanto &amp; Rekan.</p>
              </div>
            </div>

            <!-- Tanda Tangan Pimpinan Rekan / Kepala Kantor -->
            <div class="text-right">
              <p class="text-slate-600 font-medium" id="st-kota-tanggal">Jakarta, 26 Oktober 2026</p>
              <p class="text-slate-800 font-bold mt-0.5">Pemberi Tugas Internal,</p>
              <p class="text-[10px] font-semibold text-slate-700">KJPP Nanang Rahayu Sigit Paryanto &amp; Rekan</p>
              <div class="h-12 flex items-center justify-end">
                <span class="inline-block px-2.5 py-0.5 rounded border border-dashed border-slate-400 text-slate-400 font-mono text-[8.5px] uppercase">
                  [ Tanda Tangan Digital Terotorisasi ]
                </span>
              </div>
              <p class="font-extrabold text-slate-900 uppercase" id="st-pimpinan-nama">Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)</p>
              <p class="text-[9px] text-slate-600 font-mono" id="st-pimpinan-jabatan">Pemimpin Rekan &bull; Izin Penilai Publik: P-1.19.00160</p>
            </div>
          </div>
        </div>

        <!-- ==================== LEMBAR 2: BERITA ACARA INSPEKSI & TANDA TERIMA LAPANGAN (BAI) ==================== -->
        <div id="lembar-tanda-terima" class="text-slate-900 text-xs leading-normal">
          
          <!-- KOP SURAT RESMI STANDAR KEMENKEU RI -->
          <div class="border-b-2 border-slate-900 pb-3 mb-4 text-center">
            <h2 class="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900">KJPP NANANG RAHAYU SIGIT PARYANTO &amp; REKAN</h2>
            <p class="text-[10.5px] sm:text-[11.5px] font-bold text-slate-800">KANTOR JASA PENILAI PUBLIK (KJPP)</p>
            <p class="text-[10px] sm:text-[10.5px] font-semibold text-slate-700">Izin Usaha Menteri Keuangan RI No. 2.19.0160 (KMK No. 248/KM.1/2019)</p>
            <p class="text-[9px] text-slate-600 mt-0.5">Kantor Pusat: Jakarta &bull; Cabang: Bandung | Padang | Makassar | Palembang</p>
          </div>

          <!-- JUDUL BERITA ACARA -->
          <div class="text-center my-3">
            <h3 class="text-sm font-black uppercase tracking-wider text-slate-900">BERITA ACARA INSPEKSI &amp; TANDA TERIMA LAPANGAN (BAI)</h3>
            <p class="text-[11px] font-mono font-bold text-slate-800 mt-0.5">Nomor: <span id="bai-nomor-surat">BAI/NSR-PUSAT/2026/0001</span> &bull; Ref. JO: <span id="bai-ref-jo" class="font-mono">JO-...</span></p>
          </div>

          <p class="text-[11px] text-slate-700 leading-relaxed my-2">
            Pada hari ini <span class="font-bold underline" id="bai-hari-tgl">................................................</span>, bertempat di lokasi objek agunan / penilaian, telah dilaksanakan pemeriksaan fisik lapangan secara bersama-sama atas objek properti di bawah ini:
          </p>

          <!-- TABEL METADATA OBJEK SINGKAT -->
          <div class="border border-slate-300 rounded-lg p-2.5 my-2 bg-slate-50/70">
            <table class="w-full text-[11px]">
              <tbody>
                <tr>
                  <td class="w-32 font-semibold text-slate-600 py-0.5">Debitur / Pemilik Aset</td>
                  <td class="w-3 text-slate-400">:</td>
                  <td class="font-bold text-slate-900" id="bai-debitur">-</td>
                  <td class="w-28 font-semibold text-slate-600 py-0.5">Bank / Pemberi Tugas</td>
                  <td class="w-3 text-slate-400">:</td>
                  <td class="font-semibold" id="bai-bank">-</td>
                </tr>
                <tr>
                  <td class="font-semibold text-slate-600 py-0.5">Alamat Objek Properti</td>
                  <td class="text-slate-400">:</td>
                  <td colspan="4" class="text-slate-800" id="bai-lokasi">-</td>
                </tr>
                <tr>
                  <td class="font-semibold text-slate-600 py-0.5">Surveyor KJPP NSR</td>
                  <td class="text-slate-400">:</td>
                  <td class="font-bold" id="bai-surveyor">-</td>
                  <td class="font-semibold text-slate-600 py-0.5">Jenis Objek</td>
                  <td class="text-slate-400">:</td>
                  <td id="bai-jenis-objek">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- FORMULIR ISIAN TANDA TERIMA FISIK & AKSES LAPANGAN -->
          <div class="border border-slate-300 rounded-lg p-3 my-2.5 bg-white space-y-2 text-[10.5px]">
            <h4 class="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              KOLOM ISIAN TANDA TERIMA FISIK &amp; KONDISI LAPANGAN (DIISI SAAT INSPEKSI)
            </h4>

            <!-- 1. Identitas Pendamping Lapangan -->
            <div class="pt-1">
              <p class="font-bold text-slate-800">1. IDENTITAS PENDAMPING LAPANGAN (PIHAK DEBITUR / KLIEN):</p>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1 text-[11px]">
                <div>
                  <span class="text-slate-600">Nama Lengkap Pendamping:</span>
                  <div class="border-b border-dotted border-slate-700 h-5 mt-0.5"></div>
                </div>
                <div>
                  <span class="text-slate-600">No. Kontak / WhatsApp:</span>
                  <div class="border-b border-dotted border-slate-700 h-5 mt-0.5"></div>
                </div>
                <div>
                  <span class="text-slate-600">Nomor KTP / Identitas:</span>
                  <div class="border-b border-dotted border-slate-700 h-5 mt-0.5"></div>
                </div>
                <div>
                  <span class="text-slate-600">Hubungan / Kapasitas Pendamping:</span>
                  <div class="flex items-center gap-3 mt-1 text-[10px] text-slate-700">
                    <label class="inline-flex items-center gap-1"><span class="w-3 h-3 border border-slate-400 inline-block rounded-sm"></span> Pemilik/Debitur</label>
                    <label class="inline-flex items-center gap-1"><span class="w-3 h-3 border border-slate-400 inline-block rounded-sm"></span> Keluarga</label>
                    <label class="inline-flex items-center gap-1"><span class="w-3 h-3 border border-slate-400 inline-block rounded-sm"></span> Pengelola/Penyewa</label>
                    <label class="inline-flex items-center gap-1"><span class="w-3 h-3 border border-slate-400 inline-block rounded-sm"></span> Kuasa Bank</label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Waktu & Kondisi Inspeksi -->
            <div class="pt-2 border-t border-slate-200">
              <p class="font-bold text-slate-800">2. WAKTU PELAKSANAAN &amp; KONDISI LINGKUNGAN:</p>
              <div class="grid grid-cols-3 gap-3 mt-1 text-[10.5px]">
                <div>
                  <span class="text-slate-600">Tanggal Inspeksi:</span>
                  <div class="font-semibold text-slate-900 mt-0.5" id="bai-tgl-inspeksi">...</div>
                </div>
                <div>
                  <span class="text-slate-600">Waktu Mulai - Selesai:</span>
                  <div class="border-b border-dotted border-slate-700 h-5 mt-0.5"></div>
                </div>
                <div>
                  <span class="text-slate-600">Cuaca saat Inspeksi:</span>
                  <div class="flex items-center gap-2.5 mt-1 text-[10px] text-slate-700">
                    <label class="inline-flex items-center gap-1"><span class="w-3 h-3 border border-slate-400 inline-block rounded-sm"></span> Cerah</label>
                    <label class="inline-flex items-center gap-1"><span class="w-3 h-3 border border-slate-400 inline-block rounded-sm"></span> Berawan</label>
                    <label class="inline-flex items-center gap-1"><span class="w-3 h-3 border border-slate-400 inline-block rounded-sm"></span> Hujan</label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Lingkup Akses Fisik & Batas Lapangan -->
            <div class="pt-2 border-t border-slate-200">
              <p class="font-bold text-slate-800">3. LINGKUP AKSES FISIK &amp; VERIFIKASI BATAS LAPANGAN:</p>
              <div class="grid grid-cols-2 gap-3 mt-1 text-[10.5px]">
                <div>
                  <span class="text-slate-600">Akses Objek:</span>
                  <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-700">
                    <label class="inline-flex items-center gap-1"><span class="w-3 h-3 border border-slate-400 inline-block rounded-sm"></span> Eksterior Penuh</label>
                    <label class="inline-flex items-center gap-1"><span class="w-3 h-3 border border-slate-400 inline-block rounded-sm"></span> Interior Lengkap</label>
                    <label class="inline-flex items-center gap-1"><span class="w-3 h-3 border border-slate-400 inline-block rounded-sm"></span> Terbatas</label>
                  </div>
                </div>
                <div>
                  <span class="text-slate-600">Batas Properti:</span>
                  <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-700">
                    <label class="inline-flex items-center gap-1"><span class="w-3 h-3 border border-slate-400 inline-block rounded-sm"></span> Patok / Pagar Jelas</label>
                    <label class="inline-flex items-center gap-1"><span class="w-3 h-3 border border-slate-400 inline-block rounded-sm"></span> Ditunjukkan Pendamping</label>
                  </div>
                </div>
              </div>
              <div class="mt-2">
                <span class="text-slate-600">Catatan Akses Lapangan / Kondisi Khusus Objek:</span>
                <div class="border-b border-dotted border-slate-700 h-5 mt-0.5"></div>
                <div class="border-b border-dotted border-slate-700 h-5 mt-1.5"></div>
              </div>
            </div>

            <!-- 4. Pernyataan Kesaksian Integritas -->
            <div class="pt-2 border-t border-slate-200 text-[10px] text-slate-600 italic leading-relaxed">
              <strong>Pernyataan Kepatuhan Integritas (KEPI &amp; SPI 103):</strong>
              Pemeriksaan fisik telah disaksikan langsung oleh pihak pendamping yang berhak di lokasi agunan, tanpa ada paksaan maupun intervensi yang dapat mempengaruhi objektivitas dan independensi penilai publik.
            </div>
          </div>

          <!-- KOLOM TANDA TANGAN DUA BELAH PIHAK -->
          <div class="grid grid-cols-2 gap-6 mt-4 pt-2 text-[10.5px]">
            <!-- Pendamping Lapangan -->
            <div class="text-center border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
              <p class="font-semibold text-slate-700">Pihak Pendamping Lapangan,</p>
              <p class="text-[9.5px] text-slate-500">(Debitur / Pemilik / Kuasa yang Mendampingi)</p>
              <div class="h-16 flex items-center justify-center">
                <span class="text-slate-400 font-mono text-[9px] italic">[ Tanda Tangan &amp; Nama Jelas ]</span>
              </div>
              <div class="border-t border-slate-400 pt-1">
                <p class="text-slate-700 text-[10px]">Nama: ..............................................................</p>
                <p class="text-slate-500 text-[9px] mt-0.5">Tanggal: ........................................................</p>
              </div>
            </div>

            <!-- Surveyor KJPP NSR -->
            <div class="text-center border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
              <p class="font-semibold text-slate-700">Petugas Penilai / Surveyor Lapangan,</p>
              <p class="text-[9.5px] font-bold text-slate-900">KJPP Nanang Rahayu Sigit Paryanto &amp; Rekan</p>
              <div class="h-16 flex items-center justify-center">
                <span class="inline-block px-2.5 py-0.5 rounded border border-dashed border-slate-400 text-slate-400 font-mono text-[8.5px] uppercase">
                  [ Tanda Tangan &amp; Cap Lapangan ]
                </span>
              </div>
              <div class="border-t border-slate-400 pt-1">
                <p class="font-extrabold text-slate-900 uppercase" id="bai-ttd-surveyor">-</p>
                <p class="text-slate-600 font-mono text-[9.5px]" id="bai-ttd-nik">NIK: -</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
`;

const modalAnchor = `  <!-- ==================== MODAL QR CODE AKSES CEPAT SURVEYOR ==================== -->`;
replaceNorm(modalAnchor, modalMarkup + '\n\n' + modalAnchor, 'Modal Markup');

// 6. Add JavaScript Engine for Surat Tugas & Tanda Terima
const jsEngine = `
    // =========================================================================
    // OPSI B: GENERATOR CETAK SURAT TUGAS & TANDA TERIMA LAPANGAN (M-03)
    // =========================================================================
    let currentSuratTugasJob = null;
    let currentSuratTugasMode = 'all';

    function bukaModalCetakSuratTugas(joId, mode = 'all') {
      const job = (typeof globalJobs !== 'undefined' ? globalJobs.find(x => x.jo_number === joId || x.id === joId || x.id_jo === joId) : null) || activeJob;
      if (!job) {
        alert('Data penugasan tidak ditemukan untuk mencetak Surat Tugas.');
        return;
      }
      currentSuratTugasJob = job;

      // Helper Kode Wilayah & Penomoran Resmi
      const kCode = job.kantor_code || (job.kantor && job.kantor.includes('Bandung') ? 'BDG' : job.kantor && job.kantor.includes('Padang') ? 'PDG' : job.kantor && job.kantor.includes('Makassar') ? 'MKS' : job.kantor && job.kantor.includes('Palembang') ? 'PLB' : 'PUSAT');
      const joSuffix = (job.jo_number || '').split('-').pop() || '0001';
      const romanMonths = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
      const now = new Date();
      const currMonth = romanMonths[now.getMonth()];
      const currYear = now.getFullYear();

      const nomorST = 'ST/NSR-' + kCode + '/' + currMonth + '/' + currYear + '/' + joSuffix;
      const nomorBAI = 'BAI/NSR-' + kCode + '/' + currMonth + '/' + currYear + '/' + joSuffix;
      const dateId = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
      const city = job.kantor ? job.kantor.replace('Kantor Cabang ', '').replace('Kantor Pusat ', '') : 'Jakarta';

      // Identitas Personel Pelaksana
      const surveyorNama = job.surveyor || job.penilai_pelaksana || 'Penilai Pelaksana Terdaftar';
      const surveyorNik = job.surveyor_nik || job.penilai_pelaksana_nik || '-';
      const surveyorKontak = job.surveyor_phone || job.survey_contact_phone || job.penilai_pelaksana_phone || '-';

      // 1. Isi Data Lembar 1: Surat Tugas
      const stBadge = document.getElementById('print-st-jo-badge');
      if (stBadge) stBadge.textContent = job.jo_number || '-';
      const stNomor = document.getElementById('st-nomor-surat');
      if (stNomor) stNomor.textContent = nomorST;
      const stNama = document.getElementById('st-petugas-nama');
      if (stNama) stNama.textContent = surveyorNama;
      const stNik = document.getElementById('st-petugas-nik');
      if (stNik) stNik.textContent = surveyorNik;
      const stKantor = document.getElementById('st-petugas-kantor');
      if (stKantor) stKantor.textContent = job.kantor || 'Kantor Pusat Jakarta';
      const stKontak = document.getElementById('st-petugas-kontak');
      if (stKontak) stKontak.textContent = surveyorKontak;

      const stJo = document.getElementById('st-jo-number');
      if (stJo) stJo.textContent = job.jo_number || '-';
      const stSpk = document.getElementById('st-spk-number');
      if (stSpk) stSpk.textContent = job.spk_number || '-';
      const stSpkDate = document.getElementById('st-spk-date');
      if (stSpkDate) stSpkDate.textContent = job.spk_date || '-';
      const stPemberi = document.getElementById('st-pemberi-tugas');
      if (stPemberi) stPemberi.textContent = job.pemberi_tugas || job.instansi || '-';
      const stPengguna = document.getElementById('st-pengguna-laporan');
      if (stPengguna) stPengguna.textContent = job.pengguna_laporan || job.pemberi_tugas || '-';
      const stTujuan = document.getElementById('st-tujuan-penilaian');
      if (stTujuan) stTujuan.textContent = job.tujuan_penilaian || 'Penjaminan Utang / Agunan Kredit';
      const stDebitur = document.getElementById('st-debitur');
      if (stDebitur) stDebitur.textContent = job.debitur || '-';
      const stJenis = document.getElementById('st-jenis-properti');
      if (stJenis) stJenis.textContent = job.jenis_properti || '-';
      const stLokasi = document.getElementById('st-lokasi-aset');
      if (stLokasi) stLokasi.textContent = job.lokasi_aset || '-';
      const stLuas = document.getElementById('st-luas-aset');
      if (stLuas) stLuas.textContent = 'Tanah: ' + (job.luas_tanah || '-') + ' • Bangunan: ' + (job.luas_bangunan || '-');
      const stDok = document.getElementById('st-dokumen-legalitas');
      if (stDok) stDok.textContent = job.dokumen_kepemilikan || '-';
      const stKota = document.getElementById('st-kota-tanggal');
      if (stKota) stKota.textContent = city + ', ' + dateId;
      const stLacak = document.getElementById('st-kode-lacak');
      if (stLacak) stLacak.textContent = 'Kode Lacak: ' + (job.kode_lacak || job.tracking_code || '-');

      // TTD Pimpinan Pemberi Tugas (Disesuaikan Cabang / Pusat)
      const stPimpNama = document.getElementById('st-pimpinan-nama');
      const stPimpJab = document.getElementById('st-pimpinan-jabatan');
      if (stPimpNama && stPimpJab) {
        if (kCode === 'BDG') {
          stPimpNama.textContent = 'Deni Supriatna, S.Pd., M.M.';
          stPimpJab.textContent = 'Kepala Cabang Bandung • KJPP NSR';
        } else if (kCode === 'PDG') {
          stPimpNama.textContent = 'Drs. Asrizal Tatang, MAPPI (Cert.)';
          stPimpJab.textContent = 'Kepala Cabang Padang • KJPP NSR';
        } else if (kCode === 'MKS') {
          stPimpNama.textContent = 'Drs. H. M. Said, M.Si., MAPPI (Cert.)';
          stPimpJab.textContent = 'Kepala Cabang Makassar • KJPP NSR';
        } else if (kCode === 'PLB') {
          stPimpNama.textContent = 'Drs. Muhammad Husni, MAPPI (Cert.)';
          stPimpJab.textContent = 'Kepala Cabang Palembang • KJPP NSR';
        } else {
          stPimpNama.textContent = 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)';
          stPimpJab.textContent = 'Pemimpin Rekan • Izin Penilai: P-1.19.00160';
        }
      }

      // Render Dynamic QR Code Keabsahan Surat Tugas (SSOT)
      const qrBox = document.getElementById('st-qrcode-box');
      if (qrBox) {
        qrBox.innerHTML = '';
        const publicTrackUrl = 'https://kjppnanangrahayu.com/portal-tracking.html?action=track_public&jo=' + encodeURIComponent(job.jo_number || '') + '&code=' + encodeURIComponent(job.kode_lacak || job.tracking_code || '');
        if (typeof QRCode !== 'undefined') {
          try {
            new QRCode(qrBox, {
              text: publicTrackUrl,
              width: 90,
              height: 90,
              colorDark: '#0f172a',
              colorLight: '#ffffff',
              correctLevel: (QRCode.CorrectLevel && QRCode.CorrectLevel.M !== undefined) ? QRCode.CorrectLevel.M : 0
            });
          } catch (e) {
            if (typeof renderFallbackQrCanvas === 'function') renderFallbackQrCanvas(qrBox, publicTrackUrl, job.jo_number);
          }
        } else if (typeof renderFallbackQrCanvas === 'function') {
          renderFallbackQrCanvas(qrBox, publicTrackUrl, job.jo_number);
        }
      }

      // 2. Isi Data Lembar 2: Berita Acara Inspeksi (BAI) & Tanda Terima
      const baiNomor = document.getElementById('bai-nomor-surat');
      if (baiNomor) baiNomor.textContent = nomorBAI;
      const baiRef = document.getElementById('bai-ref-jo');
      if (baiRef) baiRef.textContent = job.jo_number || '-';
      const baiHari = document.getElementById('bai-hari-tgl');
      if (baiHari) baiHari.textContent = dayName + ', ' + dateId;
      const baiDebitur = document.getElementById('bai-debitur');
      if (baiDebitur) baiDebitur.textContent = job.debitur || '-';
      const baiBank = document.getElementById('bai-bank');
      if (baiBank) baiBank.textContent = job.pemberi_tugas || job.instansi || '-';
      const baiLokasi = document.getElementById('bai-lokasi');
      if (baiLokasi) baiLokasi.textContent = job.lokasi_aset || '-';
      const baiSurv = document.getElementById('bai-surveyor');
      if (baiSurv) baiSurv.textContent = surveyorNama;
      const baiJenis = document.getElementById('bai-jenis-objek');
      if (baiJenis) baiJenis.textContent = (job.jenis_properti || '-') + ' (' + (job.luas_tanah || '-') + ' / ' + (job.luas_bangunan || '-') + ')';
      const baiTgl = document.getElementById('bai-tgl-inspeksi');
      if (baiTgl) baiTgl.textContent = dateId;
      const baiTtdSurv = document.getElementById('bai-ttd-surveyor');
      if (baiTtdSurv) baiTtdSurv.textContent = surveyorNama;
      const baiTtdNik = document.getElementById('bai-ttd-nik');
      if (baiTtdNik) baiTtdNik.textContent = 'NIK: ' + surveyorNik;

      // Set Mode Tampilan
      setModeCetakSuratTugas(mode);

      // Tampilkan Modal
      const modal = document.getElementById('modal-cetak-surat-tugas');
      if (modal) modal.classList.remove('hidden');
      document.body.classList.add('modal-surat-tugas-open');
    }

    function setModeCetakSuratTugas(mode) {
      currentSuratTugasMode = mode;
      const l1 = document.getElementById('lembar-surat-tugas');
      const l2 = document.getElementById('lembar-tanda-terima');
      const bAll = document.getElementById('btn-mode-st-all');
      const bSt = document.getElementById('btn-mode-st-only');
      const bBai = document.getElementById('btn-mode-bai-only');

      [bAll, bSt, bBai].forEach(b => {
        if (b) {
          b.className = 'px-2.5 py-1 rounded-lg font-medium text-slate-400 hover:text-white transition';
        }
      });

      if (mode === 'surat_tugas') {
        if (l1) { l1.style.display = 'block'; l1.classList.remove('st-page-break'); }
        if (l2) l2.style.display = 'none';
        if (bSt) bSt.className = 'px-2.5 py-1 rounded-lg font-bold transition text-amber-400 bg-slate-800 border border-amber-500/40';
      } else if (mode === 'tanda_terima') {
        if (l1) l1.style.display = 'none';
        if (l2) { l2.style.display = 'block'; l2.classList.remove('st-page-break'); }
        if (bBai) bBai.className = 'px-2.5 py-1 rounded-lg font-bold transition text-amber-400 bg-slate-800 border border-amber-500/40';
      } else {
        // all
        if (l1) { l1.style.display = 'block'; l1.classList.add('st-page-break'); }
        if (l2) l2.style.display = 'block';
        if (bAll) bAll.className = 'px-2.5 py-1 rounded-lg font-bold transition text-amber-400 bg-slate-800 border border-amber-500/40';
      }
    }

    function tutupModalCetakSuratTugas() {
      const modal = document.getElementById('modal-cetak-surat-tugas');
      if (modal) modal.classList.add('hidden');
      document.body.classList.remove('modal-surat-tugas-open');
    }

    function cetakSuratTugasAktif() {
      const jo = (typeof activeJob !== 'undefined' && activeJob) ? (activeJob.jo_number || activeJob.id || activeJob.id_jo) : null;
      if (jo) bukaModalCetakSuratTugas(jo, 'surat_tugas');
    }

    function cetakTandaTerimaAktif() {
      const jo = (typeof activeJob !== 'undefined' && activeJob) ? (activeJob.jo_number || activeJob.id || activeJob.id_jo) : null;
      if (jo) bukaModalCetakSuratTugas(jo, 'tanda_terima');
    }

    // Expose Global
    window.bukaModalCetakSuratTugas = bukaModalCetakSuratTugas;
    window.setModeCetakSuratTugas = setModeCetakSuratTugas;
    window.tutupModalCetakSuratTugas = tutupModalCetakSuratTugas;
    window.cetakSuratTugasAktif = cetakSuratTugasAktif;
    window.cetakTandaTerimaAktif = cetakTandaTerimaAktif;

    // ESC Key listener
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const modal = document.getElementById('modal-cetak-surat-tugas');
        if (modal && !modal.classList.contains('hidden')) {
          tutupModalCetakSuratTugas();
        }
      }
    });
`;

const jsAnchor = `    // =========================================================================\n    // GENERATOR QR CODE AKSES CEPAT SURVEYOR LAPANGAN (SPI 105)`;
replaceNorm(jsAnchor, jsEngine + '\n\n' + jsAnchor, 'JavaScript Engine');

// Restore original line ending
const finalContent = hasCrlf ? normContent.replace(/\n/g, '\r\n') : normContent;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('🎉 Successfully applied all Surat Tugas updates to portal-tracking.html');
