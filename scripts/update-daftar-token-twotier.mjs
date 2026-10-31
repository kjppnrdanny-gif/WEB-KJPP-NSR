import fs from 'fs';
import path from 'path';

const filePath = path.resolve('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/daftar-token-akses-internal.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Update Title and Header Badges
html = html.replace(
  /<title>.*?<\/title>/i,
  '<title>Direktori Rahasia Kredensial & Matriks Otorisasi 2-Lapis | KJPP Nanang Rahayu & Rekan</title>'
);

const newHeader = `        <div class="flex items-center gap-2 mb-1.5 flex-wrap">
          <span class="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
            DIREKTORI RESMI KREDENSIAL
          </span>
          <span class="text-xs text-slate-400 font-semibold">Tahun Operasional 2026</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">12 Token Portal Aktif</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">48 NIK Personel Terdaftar</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Sistem 2-Lapis SSOT</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
          DIREKTORI TOKEN &amp; MATRIKS OTORISASI 2-LAPIS
        </h1>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Sinergi Token Gerbang Wilayah (Lapis 1) &amp; Otorisasi Personal NIK Eksekutor 7-Milestone (Lapis 2)
        </p>`;

html = html.replace(
  /<div class="flex items-center gap-2 mb-1\.5">[\s\S]*?Sistem Pengamanan Berbasis Peran[\s\S]*?<\/p>/i,
  newHeader
);

// 2. Add Architecture Overview Card (Two-Tier Security Card) right before BAGIAN 0
const twoTierCard = `    <!-- ================================================================= -->
    <!-- BAGIAN PENJELASAN ARSITEKTUR: SISTEM KEAMANAN 2-LAPIS (TWO-TIER)  -->
    <!-- ================================================================= -->
    <section class="mb-10">
      <div class="rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div class="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div class="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-black text-xl shrink-0">
            🛡️
          </div>
          <div>
            <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              ARSITEKTUR RESMI SISTEM (OPSI A)
            </span>
            <h2 class="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
              SISTEM KEAMANAN &amp; JEJAK AUDIT 2-LAPIS (TWO-TIER SECURITY &amp; AUDIT TRAIL)
            </h2>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-300">
          <!-- LAPIS 1 -->
          <div class="p-4 rounded-2xl bg-slate-950/70 border border-amber-400/30 space-y-2">
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                LAPIS 1: TOKEN GERBANG SISTEM
              </span>
              <span class="text-[10px] text-amber-300 font-bold font-mono-token">Modal index.html</span>
            </div>
            <h4 class="font-bold text-white text-xs">Pintu Masuk Portal &amp; Penguncian Batas Wilayah</h4>
            <p class="text-[11px] leading-relaxed text-slate-300">
              Digunakan saat pertama kali membuka portal operasional (NoLap, Kwitansi, Task Board) di beranda utama:
            </p>
            <ul class="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li><strong class="text-slate-200">Isolasi Wilayah (Branch Boundary):</strong> Mengunci komputer cabang hanya menampilkan berkas wilayahnya (<code class="text-sky-300">NSR-BDG-••••</code>, <code class="text-sky-300">NSR-PDG-••••</code>, dll).</li>
              <li><strong class="text-slate-200">Akses Penuh Nasional:</strong> Dibuka khusus untuk token pusat (<code class="text-amber-300">NSR-PST-••••</code>) dan King Token (<code class="text-amber-300">NSR••••</code>).</li>
              <li><strong class="text-slate-200">Efisiensi Kantor:</strong> Layar pemantauan <em>Task Board</em> dapat menyala seharian di ruang kerja tanpa perlu login NIK berulang-ulang.</li>
            </ul>
          </div>

          <!-- LAPIS 2 -->
          <div class="p-4 rounded-2xl bg-slate-950/70 border border-emerald-400/30 space-y-2">
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-white uppercase tracking-wider">
                LAPIS 2: OTORISASI EKSEKUTOR (NIK + PIN)
              </span>
              <span class="text-[10px] text-emerald-300 font-bold font-mono-token">Action Modal M-01 s/d M-07</span>
            </div>
            <h4 class="font-bold text-white text-xs">Verifikasi Personal &amp; Jejak Audit Permanen (SSOT)</h4>
            <p class="text-[11px] leading-relaxed text-slate-300">
              Dipicu setiap kali staf menekan tombol <strong>"Majukan Tahap / Perbarui Milestone"</strong> di <code class="text-emerald-300">portal-tracking.html</code>:
            </p>
            <ul class="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li><strong class="text-slate-200">Validasi NIK &amp; PIN Personal:</strong> Mencocokkan identitas eksekutor ke basis data 48 karyawan aktif di bawah.</li>
              <li><strong class="text-slate-200">Kepatuhan Anti Self-Review:</strong> Surveyor/Penilai dilarang mengesahkan M-05 (Kendali Mutu SPM) berkasnya sendiri.</li>
              <li><strong class="text-slate-200">Jejak Audit Tanpa Celah:</strong> Tabel <code class="text-emerald-300">LOG_PROGRESS</code> merekam secara sah: NIK, Nama, Jabatan, Wilayah, Jam WIB, dan Hasil Telaah.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

`;

html = html.replace(
  /([ \t]*<!-- =+ -->\r?\n[ \t]*<!-- BAGIAN 0: KUNCI INDUK MASTER)/i,
  twoTierCard + '$1'
);

// 3. Prepare Employees Data
const EMPLOYEES = [
  // PUSAT (22)
  { no: 1, nik: 'NSR-2019-001', nama: 'Nanang Rahayu', jabatan: 'Pemimpin Rekan', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-01 s/d M-07 (Master Override & Penandatangan Opini M-06)', audit: 'Pemimpin Rekan / Master Otoritas' },
  { no: 2, nik: 'NSR-2019-002', nama: 'Deni Siswandi', jabatan: 'Rekan', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-02 (Surat Tugas) & M-06 (Opini Nilai Resmi Kemenkeu)', audit: 'Rekan Penilai Publik Berizin' },
  { no: 3, nik: 'NSR-2019-003', nama: 'Mini Intan Cahyani', jabatan: 'Rekan', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-02 (Surat Tugas) & M-06 (Opini Nilai Resmi Kemenkeu)', audit: 'Rekan Penilai Publik Berizin' },
  { no: 4, nik: 'NSR-2019-004', nama: 'Milda Hidayati Dewi', jabatan: 'Manager Keuangan', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-07 (Verifikasi Pelunasan Invoice & Kwitansi)', audit: 'Manager Keuangan Pusat' },
  { no: 5, nik: 'NSR-2019-005', nama: 'Danny Taufik Hidayat', jabatan: 'Manager Admin & Umum', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-01 (Registrasi SPK & Kode Lacak) & M-07 (Serah Terima Laporan)', audit: 'Manager Admin & Pengendali JO' },
  { no: 6, nik: 'NSR-2019-006', nama: 'Arie Indra Permana', jabatan: 'Manager Marketing', kantor: 'Kantor Pusat Jakarta', wewenang: 'Registrasi Order Klien Baru & Tracking Tahapan Progres', audit: 'Marketing & Business Development' },
  { no: 7, nik: 'NSR-2019-007', nama: 'Tedi Setiadi', jabatan: 'Reviewer', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-05 (Kendali Mutu SPM SPI 102/103 & Anti Self-Review)', audit: 'Reviewer SPM Resmi (Komite Mutu)' },
  { no: 8, nik: 'NSR-2019-008', nama: 'Ricca Noer Farikha', jabatan: 'Accounting & Tax', kantor: 'Kantor Pusat Jakarta', wewenang: 'Verifikasi Pembayaran & Faktur Pajak Resmi', audit: 'Divisi Akuntansi & Perpajakan' },
  { no: 9, nik: 'NSR-2019-009', nama: 'Angga Malid Cahyadi', jabatan: 'Reviewer', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-05 (Kendali Mutu SPM SPI 102/103 & Anti Self-Review)', audit: 'Reviewer SPM Resmi (Komite Mutu)' },
  { no: 10, nik: 'NSR-2019-010', nama: 'Fadri Nurdin', jabatan: 'Surveyor', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Pusat' },
  { no: 11, nik: 'NSR-2019-011', nama: 'Erwandi', jabatan: 'Kurir', kantor: 'Kantor Pusat Jakarta', wewenang: 'Ekspedisi Dokumen & Tanda Terima Penyerahan Fisik', audit: 'Staf Ekspedisi & Kurir' },
  { no: 12, nik: 'NSR-2019-012', nama: 'Latief Satihi', jabatan: 'Kurir', kantor: 'Kantor Pusat Jakarta', wewenang: 'Ekspedisi Dokumen & Tanda Terima Penyerahan Fisik', audit: 'Staf Ekspedisi & Kurir' },
  { no: 13, nik: 'NSR-2019-013', nama: 'Aryanto', jabatan: 'Umum', kantor: 'Kantor Pusat Jakarta', wewenang: 'Dukungan Operasional & Logistik Penugasan', audit: 'Staf Umum & Rumah Tangga' },
  { no: 14, nik: 'NSR-2019-014', nama: 'Yanto', jabatan: 'Driver', kantor: 'Kantor Pusat Jakarta', wewenang: 'Transportasi Inspeksi Lapangan & Presensi Driver', audit: 'Pengemudi Operasional Survei' },
  { no: 15, nik: 'NSR-2019-015', nama: 'Lasiman', jabatan: 'Driver', kantor: 'Kantor Pusat Jakarta', wewenang: 'Transportasi Inspeksi Lapangan & Presensi Driver', audit: 'Pengemudi Operasional Survei' },
  { no: 16, nik: 'NSR-2019-016', nama: 'Sukirno', jabatan: 'Office Boy', kantor: 'Kantor Pusat Jakarta', wewenang: 'Dukungan Layanan Internal & Presensi', audit: 'Layanan Pendukung Kantor' },
  { no: 17, nik: 'NSR-2019-017', nama: 'Muhammad Syahrul Ruly', jabatan: 'Surveyor', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Pusat' },
  { no: 18, nik: 'NSR-2019-018', nama: 'Uci Sanusi', jabatan: 'Surveyor', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Pusat' },
  { no: 19, nik: 'NSR-2019-019', nama: 'Yasir Rizal', jabatan: 'Surveyor', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Pusat' },
  { no: 20, nik: 'NSR-2019-020', nama: 'Udin Syamsudin', jabatan: 'Security', kantor: 'Kantor Pusat Jakarta', wewenang: 'Keamanan Kantor & Presensi Kehadiran', audit: 'Staf Keamanan Kantor' },
  { no: 21, nik: 'NSR-2025-021', nama: 'Dhea Shafitri Ningrum', jabatan: 'Staf Admin', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-01 (Registrasi SPK) & M-07 (Serah Terima Laporan Final)', audit: 'Staf Administrasi Pusat' },
  { no: 22, nik: 'NSR-2026-022', nama: 'Siti Nuraeni Ependi', jabatan: 'Staf Admin', kantor: 'Kantor Pusat Jakarta', wewenang: 'M-01 (Registrasi SPK) & M-07 (Serah Terima Laporan Final)', audit: 'Staf Administrasi Pusat' },

  // PADANG (7)
  { no: 23, nik: 'NSR-PDG-2019-23', nama: 'Hernita', jabatan: 'Rekan', kantor: 'Cabang Padang', wewenang: 'M-02 (Surat Tugas) & M-06 (Opini Nilai Resmi Kemenkeu Cabang)', audit: 'Kepala Cabang / Penilai Publik Berizin' },
  { no: 24, nik: 'NSR-PDG-2019-24', nama: 'Rahmad Andika', jabatan: 'Penilai', kantor: 'Cabang Padang', wewenang: 'M-04 (Analisis Nilai & Kertas Kerja) & M-05 (Reviewer SPM Cabang)', audit: 'Penilai Pelaksana / Reviewer SPM PDG' },
  { no: 25, nik: 'NSR-PDG-2019-25', nama: 'Muhammad Al Amin', jabatan: 'Penilai', kantor: 'Cabang Padang', wewenang: 'M-04 (Analisis Nilai & Kertas Kerja) & M-05 (Reviewer SPM Cabang)', audit: 'Penilai Pelaksana / Reviewer SPM PDG' },
  { no: 26, nik: 'NSR-PDG-2019-26', nama: 'Rien Soneta', jabatan: 'Admin Keuangan', kantor: 'Cabang Padang', wewenang: 'Kasir Cabang (Kwitansi DP/Survei) & M-07 Pelunasan Cabang', audit: 'Keuangan & Kasir Cabang Padang' },
  { no: 27, nik: 'NSR-PDG-2019-27', nama: 'Kiki Yeza', jabatan: 'Tenaga Suporting', kantor: 'Cabang Padang', wewenang: 'Dukungan Pengumpulan Data Lapangan & Berkas JO', audit: 'Tenaga Pendukung Cabang Padang' },
  { no: 28, nik: 'NSR-PDG-2019-28', nama: 'Siti Syarah', jabatan: 'Admin', kantor: 'Cabang Padang', wewenang: 'M-01 (Registrasi JO Cabang) & M-07 (Serah Terima Laporan Final)', audit: 'Admin Operasional Cabang Padang' },
  { no: 29, nik: 'NSR-PDG-2019-29', nama: 'Oki Oktianil Putra', jabatan: 'Tenaga Suporting', kantor: 'Cabang Padang', wewenang: 'Dukungan Pengumpulan Data Lapangan & Berkas JO', audit: 'Tenaga Pendukung Cabang Padang' },

  // MAKASSAR (8)
  { no: 30, nik: 'NSR-MKS-2019-30', nama: 'Muhammad Amin Sade', jabatan: 'Rekan', kantor: 'Cabang Makassar', wewenang: 'M-02 (Surat Tugas) & M-06 (Opini Nilai Resmi Kemenkeu Cabang)', audit: 'Kepala Cabang / Penilai Publik Berizin' },
  { no: 31, nik: 'NSR-MKS-2019-31', nama: 'Wawan Kurniawan', jabatan: 'Penilai', kantor: 'Cabang Makassar', wewenang: 'M-04 (Analisis Nilai & Kertas Kerja) & M-05 (Reviewer SPM Cabang)', audit: 'Penilai Pelaksana / Reviewer SPM MKS' },
  { no: 32, nik: 'NSR-MKS-2019-32', nama: 'Alauddin Amin', jabatan: 'Surveyor', kantor: 'Cabang Makassar', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Cabang Makassar' },
  { no: 33, nik: 'NSR-MKS-2020-33', nama: 'M Fajrullah Danial', jabatan: 'Surveyor', kantor: 'Cabang Makassar', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Cabang Makassar' },
  { no: 34, nik: 'NSR-MKS-2021-34', nama: 'Rahmad Dwi Susanto', jabatan: 'Surveyor', kantor: 'Cabang Makassar', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Cabang Makassar' },
  { no: 35, nik: 'NSR-MKS-2020-35', nama: 'Andika Rifky Rifaldy', jabatan: 'Surveyor', kantor: 'Cabang Makassar', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Cabang Makassar' },
  { no: 36, nik: 'NSR-MKS-2019-36', nama: 'Ilyas Tandialla', jabatan: 'Surveyor', kantor: 'Cabang Makassar', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Cabang Makassar' },
  { no: 37, nik: 'NSR-MKS-2019-37', nama: 'Arman Mustajab', jabatan: 'Surveyor', kantor: 'Cabang Makassar', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Cabang Makassar' },

  // BANDUNG (6)
  { no: 38, nik: 'NSR-BDG-2020-38', nama: 'Heru Kurnia', jabatan: 'Business Development', kantor: 'Cabang Bandung', wewenang: 'Registrasi Klien Cabang & Pemantauan Progres JO', audit: 'Marketing & BD Cabang Bandung' },
  { no: 39, nik: 'NSR-BDG-2020-39', nama: 'Ardi Nurmayadi', jabatan: 'Penilai', kantor: 'Cabang Bandung', wewenang: 'M-04 (Analisis Nilai & Kertas Kerja) & M-05 (Reviewer SPM Cabang)', audit: 'Penilai Pelaksana / Reviewer SPM BDG' },
  { no: 40, nik: 'NSR-BDG-2020-40', nama: 'Andri Kusmandana', jabatan: 'Penilai', kantor: 'Cabang Bandung', wewenang: 'M-04 (Analisis Nilai & Kertas Kerja) & M-05 (Reviewer SPM Cabang)', audit: 'Penilai Pelaksana / Reviewer SPM BDG' },
  { no: 41, nik: 'NSR-BDG-2020-41', nama: 'Tiara Hurairah', jabatan: 'Admin Keuangan', kantor: 'Cabang Bandung', wewenang: 'Kasir Cabang (Kwitansi DP/Survei) & M-07 Pelunasan Cabang', audit: 'Keuangan & Kasir Cabang Bandung' },
  { no: 42, nik: 'NSR-BDG-2020-42', nama: 'Achmad Ilham Fauzan', jabatan: 'Admin', kantor: 'Cabang Bandung', wewenang: 'M-01 (Registrasi JO Cabang) & M-07 (Serah Terima Laporan Final)', audit: 'Admin Operasional Cabang Bandung' },
  { no: 43, nik: 'NSR-BDG-2020-43', nama: 'Rahmat Muhammad Hussein', jabatan: 'Surveyor', kantor: 'Cabang Bandung', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Cabang Bandung' },

  // PALEMBANG (5)
  { no: 44, nik: 'NSR-PLB-2022-44', nama: 'Dharma Priyanto Sih Budi Susilo', jabatan: 'Rekan', kantor: 'Cabang Palembang', wewenang: 'M-02 (Surat Tugas) & M-06 (Opini Nilai Resmi Kemenkeu Cabang)', audit: 'Kepala Cabang / Penilai Publik Berizin' },
  { no: 45, nik: 'NSR-PLB-2022-45', nama: 'Rafdinal Ardhi', jabatan: 'Penilai', kantor: 'Cabang Palembang', wewenang: 'M-04 (Analisis Nilai & Kertas Kerja) & M-05 (Reviewer SPM Cabang)', audit: 'Penilai Pelaksana / Reviewer SPM PLB' },
  { no: 46, nik: 'NSR-PLB-2022-46', nama: 'Arwin Saputra', jabatan: 'Surveyor', kantor: 'Cabang Palembang', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Cabang Palembang' },
  { no: 47, nik: 'NSR-PLB-2022-47', nama: 'Hadyan Fikhri', jabatan: 'Surveyor', kantor: 'Cabang Palembang', wewenang: 'M-03 (Inspeksi Fisik Lapangan, Upload BAPL & GPS)', audit: 'Surveyor Lapangan Cabang Palembang' },
  { no: 48, nik: 'NSR-PLB-2022-48', nama: 'M.Deo Tansila Putra', jabatan: 'Admin', kantor: 'Cabang Palembang', wewenang: 'M-01 (Registrasi JO Cabang) & M-07 (Serah Terima Laporan Final)', audit: 'Admin Operasional Cabang Palembang' },
];

function getBadgeOffice(kantor) {
  if (kantor.includes('Bandung')) return '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-400/20 text-sky-300 border border-sky-400/30">Cabang Bandung</span>';
  if (kantor.includes('Padang')) return '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">Cabang Padang</span>';
  if (kantor.includes('Makassar')) return '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-400/20 text-purple-300 border border-purple-400/30">Cabang Makassar</span>';
  if (kantor.includes('Palembang')) return '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-400/20 text-rose-300 border border-rose-400/30">Cabang Palembang</span>';
  return '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">Kantor Pusat Jakarta</span>';
}

function getBadgeRole(jabatan) {
  const j = jabatan.toUpperCase();
  if (j.includes('PEMIMPIN REKAN')) return '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950">👑 Pemimpin Rekan</span>';
  if (j.includes('REKAN')) return '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">📜 Rekan Berizin</span>';
  if (j.includes('REVIEWER')) return '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">🔍 Reviewer SPM</span>';
  if (j.includes('PENILAI')) return '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-sky-300 border border-blue-500/30">📐 Penilai Properti</span>';
  if (j.includes('SURVEYOR')) return '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">📍 Surveyor Lapangan</span>';
  if (j.includes('ADMIN') || j.includes('MANAGER ADMIN')) return '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">📑 Staf Admin</span>';
  if (j.includes('KEUANGAN') || j.includes('ACCOUNTING')) return '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">💰 Keuangan / Kasir</span>';
  return '<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">' + jabatan + '</span>';
}

let tableRows = '';
let currentSectionOffice = '';

EMPLOYEES.forEach((emp) => {
  if (emp.kantor !== currentSectionOffice) {
    currentSectionOffice = emp.kantor;
    tableRows += `
            <!-- HEADER SUB-WILAYAH: ${currentSectionOffice} -->
            <tr class="bg-slate-900/90 text-white font-bold border-y border-slate-700">
              <td colspan="7" class="py-2.5 px-4 text-xs tracking-wider uppercase flex items-center justify-between">
                <span>🏢 ${currentSectionOffice}</span>
                <span class="text-[10px] text-slate-400 font-normal">Kredensial Resmi SSOT</span>
              </td>
            </tr>`;
  }

  tableRows += `
            <tr class="hover:bg-slate-900/60 transition text-slate-300">
              <td class="p-2.5 text-center font-bold text-slate-400">${emp.no}</td>
              <td class="p-2.5 font-mono-token">
                <span class="font-bold text-sky-300 bg-slate-900 px-2 py-0.5 rounded border border-sky-400/30 text-[11px] inline-block">
                  ${emp.nik}
                </span>
              </td>
              <td class="p-2.5 font-bold text-white">${emp.nama}</td>
              <td class="p-2.5">${getBadgeRole(emp.jabatan)}</td>
              <td class="p-2.5">${getBadgeOffice(emp.kantor)}</td>
              <td class="p-2.5 text-[11px] leading-relaxed text-slate-300 font-medium">${emp.wewenang}</td>
              <td class="p-2.5 text-center text-[10px] text-slate-400 font-mono-token">${emp.audit}</td>
            </tr>`;
});

const bagian2EmployeesHTML = `
    <!-- ================================================================= -->
    <!-- BAGIAN 2: DIREKTORI RESMI 48 KARYAWAN & MATRIKS WEWENANG 7-MILESTONE (LAPIS 2) -->
    <!-- ================================================================= -->
    <section class="mb-12 page-break">
      <div class="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 class="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <span>👥</span> Direktori Resmi 48 Karyawan &amp; Matriks Otoritas Eksekusi 7-Milestone (Lapis 2)
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Basis Data Karyawan (Master Karyawan) untuk otorisasi eksekusi personal NIK + PIN &amp; jejak audit permanen (<code class="text-amber-300">LOG_PROGRESS</code>)
          </p>
        </div>
        <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
          Total: 48 Personel Aktif
        </span>
      </div>

      <!-- KARTU PANDUAN WEWENANG ESKALASI -->
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-5 text-xs text-slate-300">
        <div class="font-bold text-amber-400 mb-2 flex items-center gap-1.5">
          <span>📌</span> Panduan Wewenang Eskalasi 7-Milestone Berdasarkan Standar Penilaian Indonesia (SPI 105 &amp; KEPI):
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-[11px]">
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800"><strong class="text-sky-300 block">M-01: Registrasi SPK</strong>Admin Pusat &amp; Cabang</div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800"><strong class="text-purple-300 block">M-02: Surat Tugas</strong>Pimpinan Rekan / Kepala Cabang</div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800"><strong class="text-teal-300 block">M-03: Inspeksi Lapangan</strong>Surveyor Lapangan &amp; Penilai</div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800"><strong class="text-amber-300 block">M-04: Kalkulasi Nilai</strong>Penilai Pelaksana Teknis</div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800"><strong class="text-emerald-300 block">M-05: Kendali Mutu SPM</strong>Reviewer SPM (Anti Self-Review)</div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800"><strong class="text-rose-300 block">M-06: Otorisasi Opini</strong>5 Rekan Penilai Publik Berizin</div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800"><strong class="text-blue-300 block">M-07: Serah Terima</strong>Admin Kantor &amp; Finance Pusat</div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-amber-400/40"><strong class="text-amber-400 block">All Stages Override</strong>👑 Pemimpin Rekan (Master)</div>
        </div>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-slate-800 shadow-xl">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
              <th class="p-2.5 text-center w-10">No</th>
              <th class="p-2.5">NIK Karyawan</th>
              <th class="p-2.5">Nama Personel</th>
              <th class="p-2.5">Jabatan Resmi</th>
              <th class="p-2.5">Wilayah Satuan Kerja</th>
              <th class="p-2.5">Wewenang Milestone Penugasan</th>
              <th class="p-2.5 text-center">Fungsi Audit Trail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/80 text-slate-300">
${tableRows}
          </tbody>
        </table>
      </div>
    </section>
`;

// Insert BAGIAN 2 before the Cutting Slips section and rename cutting slip section to BAGIAN 3
const targetSlipHeader = /([ \t]*<!-- =+ -->\r?\n[ \t]*<!-- BAGIAN 2: SLIP PENYERAHAN KREDENSIAL INDIVIDUAL)/i;

if (targetSlipHeader.test(html)) {
  html = html.replace(targetSlipHeader, bagian2EmployeesHTML + '\n    <!-- ================================================================= -->\n    <!-- BAGIAN 3: SLIP PENYERAHAN KREDENSIAL INDIVIDUAL');
  console.log('✓ Bagian 2 (48 Employees Directory) inserted and Cutting Slips updated to Bagian 3');
} else {
  console.error('❌ Could not find targetSlipHeader');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('🎉 Successfully finished updating daftar-token-akses-internal.html');
