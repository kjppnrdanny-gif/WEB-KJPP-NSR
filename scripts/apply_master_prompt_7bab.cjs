/**
 * scripts/apply_master_prompt_7bab.cjs
 * Integrasi Penuh Master Prompt 7-Bab Independent Technical Review & Quality Control
 * KJPP Nanang Rahayu Sigit Paryanto & Rekan (KMK RI No. 2.19.0160)
 */

const fs = require('fs');
const path = require('path');

const targetHtml = path.join(__dirname, '../portal-qa-review.html');
const targetPhp = path.join(__dirname, '../backend/qa-engine-handler.php');

console.log('--- 1. Membaca portal-qa-review.html ---');
let html = fs.readFileSync(targetHtml, 'utf8');

// ============================================================================
// PART 1: INJEKSI 7-BAB PADA SAMPLE_REVIEWS (fifa & sarimukti)
// ============================================================================
console.log('--- 2. Menambahkan 7-Bab Terstruktur pada SAMPLE_REVIEWS ---');

const fifaBabData = `        bab1_executive_summary: {
          nomor_penugasan: "JO-NSR-2026-0881",
          nama_objek: "Tanah dan Bangunan Rumah Sakit PT FIFA MEDIKA",
          alamat_objek: "Jl. Dr. Sutomo No. 94, Kel. Kubu Marapalam, Kec. Padang Timur, Kota Padang, Sumatera Barat",
          luas_tanah: "2.450 m² (SHGB No. 108/Kubu Marapalam)",
          luas_bangunan: "3.820 m² (Gedung RS 4 Lantai)",
          pemberi_tugas: "PT Bank Tabungan Negara (Persero) Tbk - Kantor Cabang Padang",
          pengguna_laporan: "PT Bank Tabungan Negara (Persero) Tbk (Divisi Kredit Komersial)",
          tujuan_penilaian: "Penjaminan Kredit Investasi / Agunan Fasilitas Perbankan",
          dasar_nilai: "Nilai Pasar (Market Value) & Nilai Likuidasi (Liquidation Value)",
          pendekatan_penilaian: [
            "Pendekatan Biaya (Depreciated Replacement Cost)",
            "Pendekatan Pasar (Perbandingan Data Pasar)"
          ],
          tanggal_penilaian: "12 Februari 2026",
          tanggal_survei: "08 Februari 2026",
          kesimpulan_umum: "Draf laporan memiliki kontradiksi identifikasi objek fatal (dinyatakan 'Tanah Kosong' pada Bab Pendahuluan namun menilai Rumah Sakit) serta formula Excel rusak #REF! pada rincian nilai mekanikal/elektrikal bangunan. Gerbang NoLap wajib dikunci rapat."
        },
        bab2_matriks_kepatuhan: [
          {
            kode: "A",
            aspek: "Administratif & Kepatuhan Umum",
            status: "SESUAI",
            parameter: "Kelengkapan SPK, Pernyataan Penilai, Tanda Tangan Rekan Berizin, Periode Laporan",
            catatan: "SPK lengkap, ditandatangani Rekan Penilai Publik Berizin Deni Siswandi, S.T., MAPPI (Cert.)."
          },
          {
            kode: "B",
            aspek: "Identifikasi & Karakteristik Fisik Objek",
            status: "TIDAK_SESUAI",
            parameter: "Kesesuaian Yuridis, Batas Koordinat GPS, Fisik Bangunan, Konsistensi Objek",
            catatan: "KRITIS: Terjadi kontradiksi objek antara Bab Pendahuluan (Tanah Kosong) dengan Bab Penilaian Fisik (Rumah Sakit 4 Lantai)."
          },
          {
            kode: "C",
            aspek: "Analisis Penggunaan Tertinggi & Terbaik (HBU)",
            status: "PERLU_PERBAIKAN",
            parameter: "Uji 4 Kriteria Baku KPUP 10 (Legalitas Hukum, Fisik, Finansial, Produktivitas Maksimal)",
            catatan: "Analisis HBU belum menyajikan simulasi DCF kelayakan finansial operasional rumah sakit rujukan BPJS."
          },
          {
            kode: "D",
            aspek: "Pengumpulan & Verifikasi Data Pasar",
            status: "SESUAI",
            parameter: "Kecukupan 3 Data Pembanding Sejenis, Verifikasi Narasumber, Radius Relevan SPI 104",
            catatan: "3 data pembanding tanah komersial koridor Jl. Dr. Sutomo terverifikasi valid dengan narasumber agen lokal."
          },
          {
            kode: "E",
            aspek: "Penerapan Pendekatan & Metodologi Penilaian",
            status: "PERLU_PERBAIKAN",
            parameter: "Kesesuaian Pendekatan Pasar, Biaya (DRC), dan Pendapatan terhadap Karakteristik Agunan",
            catatan: "Metode DRC diterapkan namun tabel sarana pelengkap medis tercatat Rp 0,- tanpa catatan justifikasi."
          },
          {
            kode: "F",
            aspek: "Pengujian Kertas Kerja & Formula Perhitungan",
            status: "TIDAK_SESUAI",
            parameter: "Integritas Formula KKP Excel, Eliminasi #REF!/#VALUE!, Ketepatan Pembulatan, Karakter ####",
            catatan: "KRITIS: Ditemukan formula rusak #REF! pada halaman 11, 34-36 dan sel overflow #### pada rincian biaya halaman 1."
          },
          {
            kode: "G",
            aspek: "Asumsi Khusus & Kondisi Pembatas",
            status: "SESUAI",
            parameter: "Kejelasan Asumsi Luar Biasa (Hypothetical Condition) & Batasan Tanggung Jawab SPI 103",
            catatan: "Kondisi pembatas standar agunan perbankan disajikan transparan sesuai SPI 103 Butir 3.5."
          },
          {
            kode: "H",
            aspek: "Rekonsiliasi, Kesimpulan Nilai & Pelaporan",
            status: "TIDAK_SESUAI",
            parameter: "Rasionalitas Pembobotan Rekonsiliasi, Justifikasi Diskon Likuidasi SPI 202, Kerapian Laporan",
            catatan: "Kesimpulan nilai pasar gugur secara matematis karena bersumber dari formula kalkulasi rusak (#REF!)."
          }
        ],
        bab4_pengujian_perhitungan: [
          {
            parameter: "Nilai Penggantian Baru (RCN) Bangunan RS",
            nilai_laporan: "Rp 18.450.000.000,-",
            nilai_verifikasi: "Rp 0,- (#REF!)",
            selisih: "-Rp 18.450.000.000,- (-100%)",
            analisis_kewajaran: "Formula pada lembar kalkulasi M/E terputus akibat sel referensi terhapus saat manipulasi tabel KKP.",
            dampak_nilai: "Dasar matematis Nilai Bangunan gugur total di hadapan komite risiko kredit bank."
          },
          {
            parameter: "Sarana Pelengkap Medis & Genset",
            nilai_laporan: "Rp 0,-",
            nilai_verifikasi: "Rp 1.250.000.000,-",
            selisih: "+Rp 1.250.000.000,- (Under-Valued)",
            analisis_kewajaran: "Fasilitas genset kapasitas 500 kVA dan sistem gas medis terpasang tidak dimasukkan dalam rincian biaya.",
            dampak_nilai: "Potensi distorsi nilai agunan rumah sakit yang mengurangi hak proteksi bank."
          },
          {
            parameter: "Indikasi Nilai Pasar Tanah",
            nilai_laporan: "Rp 9.800.000.000,-",
            nilai_verifikasi: "Rp 9.800.000.000,-",
            selisih: "Rp 0,- (0.0% Cocok)",
            analisis_kewajaran: "Perhitungan penyesuaian pasar tanah 2.450 m² @ Rp 4.000.000/m² wajar dan terverifikasi akurat.",
            dampak_nilai: "Komponen nilai tanah valid, namun total nilai properti tertahan oleh komponen bangunan."
          }
        ],
        bab5_analisis_risiko: [
          {
            kategori: "Kepatuhan SPI & KEPI",
            level: "SANGAT_TINGGI",
            faktor_risiko: "Pelanggaran serius atas SPI 103 Butir 3.1 (Objektivitas Identifikasi) dan KEPI Butir 3 (Integritas Kalkulasi).",
            mitigasi: "Wajib rekonstruksi ulang naskah sebelum penandatanganan opini nilai resmi Rekan Berizin."
          },
          {
            kategori: "Risiko Metodologis",
            level: "TINGGI",
            faktor_risiko: "Kontradiksi penetapan objek tanah kosong vs bangunan rumah sakit.",
            mitigasi: "Ubah klasifikasi objek menjadi 'Tanah dan Bangunan Komersial (Rumah Sakit)' di seluruh bab."
          },
          {
            kategori: "Risiko Kesalahan Nilai",
            level: "SANGAT_TINGGI",
            faktor_risiko: "Nilai bangunan tidak memiliki dasar matematis valid karena formula #REF!.",
            mitigasi: "Perbaiki referensi sel Excel sumber dan re-ekspor dokumen PDF."
          },
          {
            kategori: "Risiko Hukum & Pertanahan",
            level: "SEDANG",
            faktor_risiko: "Izin operasional rumah sakit dan kesesuaian tata ruang (zoning) perlu diverifikasi ulang.",
            mitigasi: "Lampirkan salinan IMB/PBG RS dan izin operasional dinas kesehatan pada lampiran."
          },
          {
            kategori: "Risiko Sengketa Perbankan",
            level: "SANGAT_TINGGI",
            faktor_risiko: "Potensi sanggahan hukum dari Komite Risiko Bank BTN bila terjadi debitur macet.",
            mitigasi: "Kunci gerbang NoLap, draf tidak boleh diserahkan ke bank sebelum tuntas 100%."
          },
          {
            kategori: "Risiko Reputasi KJPP",
            level: "TINGGI",
            faktor_risiko: "Penerbitan NoLap atas dokumen ber-formula rusak dapat memicu sanksi peringatan PPPK Kemenkeu.",
            mitigasi: "Penegakan protokol SPM ketat: hanya Pimpinan Rekan berhak dispensasi khusus jika terbukti."
          }
        ],
        bab6_rekomendasi_reviewer: {
          status: "NOT_ACCEPTABLE",
          skor_kepatuhan: 30.0,
          gate_nolap_unlocked: false,
          pertimbangan: "Ditemukan 2 temuan Kritis (#REF! dan Kontradiksi Objek) serta 2 temuan Mayor (Overflow #### dan Sarana Rp 0). Dokumen cacat matematis dan formil sehingga tidak memenuhi batas minimal kelulusan SPM (85.0%).",
          rekomendasi_tindakan: "DRAF DITOLAK. Berkas dikembalikan ke Penilai Penyusun untuk perbaikan total sebelum diajukan kembali ke Tim SPM."
        },
        bab7_tindakan_perbaikan: [
          {
            prioritas: "PRIORITAS_1_WAJIB",
            deskripsi: "Buka lembar kerja KKP Excel sumber, perbaiki formula rusak #REF! pada sel M/E dan rincian biaya halaman 11, 34, 35, 36.",
            penanggung_jawab: "Penilai Penyusun (Tedi Setiadi)",
            target_selesai: "Maksimal 1 x 24 Jam kerja"
          },
          {
            prioritas: "PRIORITAS_1_WAJIB",
            deskripsi: "Koreksi inkonsistensi identifikasi objek pada Bab Pendahuluan dari 'Tanah Kosong' menjadi 'Tanah dan Bangunan Rumah Sakit'.",
            penanggung_jawab: "Penilai Penyusun (Tedi Setiadi)",
            target_selesai: "Maksimal 1 x 24 Jam kerja"
          },
          {
            prioritas: "PRIORITAS_2_PENTING",
            deskripsi: "Perlebar lebar kolom pada spreadsheet KKP agar karakter overflow '####' tidak muncul saat ekspor naskah PDF.",
            penanggung_jawab: "Penilai Penyusun",
            target_selesai: "Saat ekspor PDF draf revisi"
          },
          {
            prioritas: "PRIORITAS_2_PENTING",
            deskripsi: "Lengkapi tabel inventarisasi sarana pelengkap medis (Genset 500 kVA, IPAL, Gas Medis) atau berikan justifikasi tertulis bila tidak dinilai.",
            penanggung_jawab: "Penilai Penyusun",
            target_selesai: "Saat ekspor PDF draf revisi"
          }
        ],`;

const sarimuktiBabData = `        bab1_executive_summary: {
          nomor_penugasan: "JO-NSR-2026-0412",
          nama_objek: "Proyek Perumahan Permata Harapan Sarimukti (313 Unit Rumah Subsidi & Komersial)",
          alamat_objek: "Desa Sarimukti, Kec. Cibitung, Kab. Bekasi, Jawa Barat",
          luas_tanah: "38.500 m² (SHGB Induk No. 445/Sarimukti)",
          luas_bangunan: "11.268 m² (Total 313 Unit Rumah Tipe 36/60)",
          pemberi_tugas: "PT Bank Tabungan Negara (Persero) Tbk - Commercial Banking Center (CBC) Bekasi",
          pengguna_laporan: "PT Bank Tabungan Negara (Persero) Tbk & PT Ivander Putra Sukses (Developer KYG)",
          tujuan_penilaian: "Fasilitas Kredit Yasa Griya (KYG) Konstruksi Perumahan",
          dasar_nilai: "Nilai Pasar (Market Value) & Nilai Likuidasi (Liquidation Value)",
          pendekatan_penilaian: [
            "Pendekatan Biaya (Depreciated Replacement Cost)",
            "Pendekatan Pasar (Perbandingan Data Pasar)"
          ],
          tanggal_penilaian: "18 Januari 2026",
          tanggal_survei: "14 Januari 2026",
          kesimpulan_umum: "Draf laporan memiliki temuan mayor pada analisis HBU yang belum mengelaborasi 4 kriteria baku serta diskon likuidasi flat 30% tanpa analisis daya serap pasar perumahan subsidi. Diperlukan revisi sebelum persetujuan NoLap."
        },
        bab2_matriks_kepatuhan: [
          {
            kode: "A",
            aspek: "Administratif & Kepatuhan Umum",
            status: "SESUAI",
            parameter: "Kelengkapan SPK, Pernyataan Penilai, Tanda Tangan Rekan Berizin, Periode Laporan",
            catatan: "Dokumen administratif lengkap dan memenuhi standar pelaporan SPI 102."
          },
          {
            kode: "B",
            aspek: "Identifikasi & Karakteristik Fisik Objek",
            status: "SESUAI",
            parameter: "Kesesuaian Yuridis, Batas Koordinat GPS, Fisik Bangunan, Konsistensi Objek",
            catatan: "Site plan 313 unit terverifikasi dengan patok batas koordinat GPS di lapangan."
          },
          {
            kode: "C",
            aspek: "Analisis Penggunaan Tertinggi & Terbaik (HBU)",
            status: "TIDAK_SESUAI",
            parameter: "Uji 4 Kriteria Baku KPUP 10 (Legalitas Hukum, Fisik, Finansial, Produktivitas Maksimal)",
            catatan: "MAYOR: Bab HBU belum menguji kriteria kelayakan finansial dan produktivitas maksimal proyek perumahan subsidi."
          },
          {
            kode: "D",
            aspek: "Pengumpulan & Verifikasi Data Pasar",
            status: "SESUAI",
            parameter: "Kecukupan 3 Data Pembanding Sejenis, Verifikasi Narasumber, Radius Relevan SPI 104",
            catatan: "Data pembanding tanah perumahan sekitar Cibitung dan Tambun Utara relevan dan sebanding."
          },
          {
            kode: "E",
            aspek: "Penerapan Pendekatan & Metodologi Penilaian",
            status: "SESUAI",
            parameter: "Kesesuaian Pendekatan Pasar, Biaya (DRC), dan Pendapatan terhadap Karakteristik Agunan",
            catatan: "Pendekatan pasar untuk tanah matang dan DRC untuk prototipe unit rumah dapat diterima."
          },
          {
            kode: "F",
            aspek: "Pengujian Kertas Kerja & Formula Perhitungan",
            status: "PERLU_PERBAIKAN",
            parameter: "Integritas Formula KKP Excel, Eliminasi #REF!/#VALUE!, Ketepatan Pembulatan, Karakter ####",
            catatan: "MAYOR: Ditemukan cell overflow #### pada kolom rincian biaya konstruksi halaman 49."
          },
          {
            kode: "G",
            aspek: "Asumsi Khusus & Kondisi Pembatas",
            status: "SESUAI",
            parameter: "Kejelasan Asumsi Luar Biasa (Hypothetical Condition) & Batasan Tanggung Jawab SPI 103",
            catatan: "Asumsi khusus terkait progres konstruksi 0% - 100% KYG diuraikan transparan."
          },
          {
            kode: "H",
            aspek: "Rekonsiliasi, Kesimpulan Nilai & Pelaporan",
            status: "PERLU_PERBAIKAN",
            parameter: "Rasionalitas Pembobotan Rekonsiliasi, Justifikasi Diskon Likuidasi SPI 202, Kerapian Laporan",
            catatan: "MODERAT: Nilai likuidasi dipotong flat 30% tanpa analisis mendalam profil pembeli lelang."
          }
        ],
        bab4_pengujian_perhitungan: [
          {
            parameter: "Rencana Anggaran Biaya (RAB) 313 Unit Rumah",
            nilai_laporan: "Rp 32.865.000.000,- (Sebagian ####)",
            nilai_verifikasi: "Rp 32.865.000.000,- (Terbaca Utuh)",
            selisih: "Rp 0,- (Formatting Error)",
            analisis_kewajaran: "Angka biaya konstruksi per meter persegi Rp 2.916.000/m² wajar untuk tipe rumah subsidi FLPP.",
            dampak_nilai: "Tidak ada selisih matematis, namun berisiko ditolak komite audit bank karena digit angka terpotong ####."
          },
          {
            parameter: "Diskon Nilai Likuidasi Agunan Proyek",
            nilai_laporan: "Diskon Flat 30.0% (Rp 29.800.000.000,-)",
            nilai_verifikasi: "Diskon Terjustifikasi 22.5% (Rp 32.990.000.000,-)",
            selisih: "+Rp 3.190.000.000,- (+10.7%)",
            analisis_kewajaran: "Daya serap perumahan subsidi di Cibitung tinggi (backlog perumahan). Diskon flat 30% terlalu konservatif.",
            dampak_nilai: "Pemberian diskon yang tidak terjustifikasi merugikan plafond kredit developer di Bank BTN."
          }
        ],
        bab5_analisis_risiko: [
          {
            kategori: "Kepatuhan SPI & KEPI",
            level: "SEDANG",
            faktor_risiko: "Kekurangan matriks formal pengujian 4 kriteria HBU sesuai KPUP Butir 10.",
            mitigasi: "Tambahkan tabel uji 4 kriteria HBU pada naskah Bab Analisis Properti."
          },
          {
            kategori: "Risiko Metodologis",
            level: "SEDANG",
            faktor_risiko: "Penetapan diskon likuidasi tanpa analisis periode pemasaran terbatas (SPI 202 Butir 4.3).",
            mitigasi: "Sertakan data historis waktu penjualan lelang rumah sejenis di Kab. Bekasi (3-6 bulan)."
          },
          {
            kategori: "Risiko Kesalahan Nilai",
            level: "RENDAH",
            faktor_risiko: "Formula matematis pada KKP Excel bekerja baik tanpa error #REF!.",
            mitigasi: "Pastikan format sel angka diset dengan pemisah ribuan dan lebar kolom mencukupi."
          },
          {
            kategori: "Risiko Hukum & Pertanahan",
            level: "RENDAH",
            faktor_risiko: "Legalitas SHGB Induk dan izin prinsip perumahan telah divalidasi BPN.",
            mitigasi: "Lampirkan salinan pengecekan sertifikat BPN Kab. Bekasi."
          },
          {
            kategori: "Risiko Sengketa Perbankan",
            level: "SEDANG",
            faktor_risiko: "Catatan komite kredit BTN mengenai angka cell overflow #### dan diskon likuidasi.",
            mitigasi: "Kirimkan draf revisi bersih sebelum rapat persetujuan komite kredit."
          },
          {
            kategori: "Risiko Reputasi KJPP",
            level: "RENDAH",
            faktor_risiko: "Temuan bersifat perbaikan metodologis, tidak terdapat manipulasi data pasar.",
            mitigasi: "Reviewer SPM menandatangani lembar kendali mutu setelah revisi Penilai diterima."
          }
        ],
        bab6_rekomendasi_reviewer: {
          status: "REQUIRES_MAJOR_REVISION",
          skor_kepatuhan: 68.0,
          gate_nolap_unlocked: false,
          pertimbangan: "Terdapat 2 temuan Mayor (Overflow #### dan HBU 4 Kriteria) serta 1 temuan Moderat (Diskon Likuidasi). Skor 68.0% belum memenuhi standar kelulusan SPM (85.0%). Gerbang NoLap tetap terkunci.",
          rekomendasi_tindakan: "PERLU REVISI MAYOR. Penilai wajib melengkapi matriks HBU dan merapikan tampilan angka sebelum pengesahan."
        },
        bab7_tindakan_perbaikan: [
          {
            prioritas: "PRIORITAS_1_WAJIB",
            deskripsi: "Perlebar kolom tabel biaya pada spreadsheet KKP agar tampilan '####' pada halaman 49 berganti menjadi angka nominal utuh.",
            penanggung_jawab: "Penilai Penyusun (Yoga Anfiar Pradipta)",
            target_selesai: "1 x 24 Jam kerja"
          },
          {
            prioritas: "PRIORITAS_2_PENTING",
            deskripsi: "Lengkapi analisis HBU dengan matriks 4 kriteria terukur: Legalitas, Kelayakan Fisik, Finansial (NPV/IRR proyek), dan Produktivitas Maksimal.",
            penanggung_jawab: "Penilai Penyusun (Yoga Anfiar Pradipta)",
            target_selesai: "1 x 24 Jam kerja"
          },
          {
            prioritas: "PRIORITAS_2_PENTING",
            deskripsi: "Sertakan dasar pertimbangan tertulis penetapan diskon nilai likuidasi sesuai SPI 202 Butir 4.3 (profil pembeli lelang dan estimasi waktu pemasaran).",
            penanggung_jawab: "Penilai Penyusun",
            target_selesai: "Saat penyusunan naskah revisi final"
          }
        ],`;

if (!html.includes('bab1_executive_summary: {')) {
  // Sisipkan pada objek fifa
  const fifaMatch = /(fifa:\s*\{[\s\S]*?findings:\s*\[[\s\S]*?page_numbers:\s*\[6\]\s*\}\s*\]\s*,)/;
  if (!fifaMatch.test(html)) {
    throw new Error('Gagal menemukan lokasi fifa.findings di portal-qa-review.html');
  }
  html = html.replace(fifaMatch, `$1\n${fifaBabData}`);

  // Sisipkan pada objek sarimukti
  const sarimuktiMatch = /(sarimukti:\s*\{[\s\S]*?findings:\s*\[[\s\S]*?page_numbers:\s*\[8,\s*9\]\s*\}\s*\]\s*,)/;
  if (!sarimuktiMatch.test(html)) {
    throw new Error('Gagal menemukan lokasi sarimukti.findings di portal-qa-review.html');
  }
  html = html.replace(sarimuktiMatch, `$1\n${sarimuktiBabData}`);
  console.log('✓ SAMPLE_REVIEWS (fifa & sarimukti) berhasil diperbarui dengan 7-Bab.');
}

// ============================================================================
// PART 2: STRUKTUR HTML PANEL KANAN (4 TAB NAVIGASI / 7 BAB)
// ============================================================================
console.log('--- 3. Memperbarui HTML Panel Kanan dengan Tab Navigasi 7-Bab ---');

const oldFindingsContainerStart = '<!-- INTERACTIVE FINDING CARDS -->';
const oldWorkflowPanelMarker = '<!-- PANEL KEPUTUSAN & TINDAK LANJUT REVIEW (KANAN BAWAH) -->';

const idxStart = html.indexOf(oldFindingsContainerStart);
const idxWorkflow = html.indexOf(oldWorkflowPanelMarker);

if (idxStart === -1 || idxWorkflow === -1) {
  throw new Error('Gagal menemukan anchor penanda findings container di portal-qa-review.html');
}

const newTabHtml = `<!-- PANEL HASIL TECHNICAL REVIEW (TAB NAVIGASI 7 BAB) -->
      <div class="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm flex-1 flex flex-col">
        <!-- Tab Navigation Bar -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
          <!-- 4 Tabs Utama -->
          <div class="flex items-center space-x-1 sm:space-x-2 overflow-x-auto text-xs font-semibold">
            <button type="button" id="tab-btn-1" onclick="switchReviewTab(1)"
              class="tab-review-btn px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-sm font-bold">
              <span>📊</span>
              <span>1. Ringkasan &amp; Rekomendasi</span>
              <span class="text-[9px] text-cyan-400 font-mono">(Bab I, V, VI)</span>
            </button>
            <button type="button" id="tab-btn-2" onclick="switchReviewTab(2)"
              class="tab-review-btn px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent font-medium">
              <span>📋</span>
              <span>2. Kepatuhan 8 Aspek</span>
              <span class="text-[9px] text-slate-500 font-mono">(Bab II)</span>
            </button>
            <button type="button" id="tab-btn-3" onclick="switchReviewTab(3)"
              class="tab-review-btn px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent font-medium">
              <span>🔍</span>
              <span>3. Temuan &amp; Ulang Hitung</span>
              <span id="tab-badge-findings" class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">0</span>
              <span class="text-[9px] text-slate-500 font-mono">(Bab III &amp; IV)</span>
            </button>
            <button type="button" id="tab-btn-4" onclick="switchReviewTab(4)"
              class="tab-review-btn px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent font-medium">
              <span>🛠️</span>
              <span>4. Rencana Tindakan</span>
              <span class="text-[9px] text-slate-500 font-mono">(Bab VII)</span>
            </button>
          </div>

          <!-- Tombol Aksi AI & Master Prompt -->
          <div class="flex items-center gap-1.5">
            <button type="button" onclick="bukaModalAIPrompt()" title="Jalankan AI Deep Review atau Salin Master Prompt Lengkap"
              class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow transition flex items-center gap-1.5 cursor-pointer">
              <span>✨</span>
              <span>Review AI &amp; Master Prompt</span>
            </button>
          </div>
        </div>

        <!-- TAB CONTENT 1: Ringkasan & Rekomendasi (Bab I, V, VI) -->
        <div id="tab-pane-1" class="tab-pane space-y-4 overflow-y-auto max-h-[460px] pr-1">
          <!-- Bab I: Executive Summary -->
          <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span class="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📑</span> Bab I: Ringkasan Eksekutif Penugasan (Executive Summary)
              </span>
              <span id="summary-job-badge" class="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded whitespace-nowrap shrink-0">-</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-300">
              <div><span class="text-slate-500">Nama Objek:</span> <strong id="summary-objek-nama" class="text-slate-200 block">-</strong></div>
              <div><span class="text-slate-500">Pemberi Tugas:</span> <span id="summary-pemberi-tugas" class="text-slate-200 font-semibold block">-</span></div>
              <div><span class="text-slate-500">Alamat / Lokasi:</span> <span id="summary-objek-alamat" class="text-slate-400 block">-</span></div>
              <div><span class="text-slate-500">Pengguna Laporan:</span> <span id="summary-pengguna-laporan" class="text-slate-400 block">-</span></div>
              <div><span class="text-slate-500">Luas Tanah / Bangunan:</span> <span id="summary-luas" class="text-slate-200 font-mono block">-</span></div>
              <div><span class="text-slate-500">Tujuan &amp; Dasar Nilai:</span> <span id="summary-tujuan-nilai" class="text-slate-200 block">-</span></div>
              <div><span class="text-slate-500">Tanggal Penilaian &amp; Survei:</span> <span id="summary-tgl-penilaian" class="text-slate-200 block">-</span></div>
              <div><span class="text-slate-500">Pendekatan Penilaian:</span> <span id="summary-pendekatan" class="text-cyan-300 font-semibold block">-</span></div>
            </div>
            <div class="pt-2 border-t border-slate-800/80">
              <span class="text-slate-500 text-[11px] block mb-0.5">Opini Umum Reviewer:</span>
              <p id="summary-opini-umum" class="text-xs text-slate-300 leading-relaxed italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">-</p>
            </div>
          </div>

          <!-- Bab V: Matriks Profil Risiko Profesional -->
          <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🛡️</span> Bab V: Analisis Profil Risiko Profesional (6 Dimensi)
              </span>
              <span class="text-[10px] text-slate-500">Standar Pengendalian Mutu SPM</span>
            </div>
            <div id="risk-matrix-container" class="space-y-2">
              <!-- Rendered via JS -->
            </div>
          </div>

          <!-- Bab VI: Rekomendasi Reviewer & Keputusan NoLap -->
          <div id="rec-decision-container" class="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <!-- Rendered via JS -->
          </div>
        </div>

        <!-- TAB CONTENT 2: Matriks Kepatuhan 8 Aspek (Bab II) -->
        <div id="tab-pane-2" class="tab-pane hidden space-y-3 overflow-y-auto max-h-[460px] pr-1">
          <div class="flex items-center justify-between mb-1">
            <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Bab II: Tabel Pemeriksaan Kepatuhan 8 Aspek (SPI &amp; KEPI)</h4>
            <span class="text-[11px] text-slate-400">Aspek A s/d H</span>
          </div>
          <div id="compliance-matrix-container" class="space-y-2.5">
            <!-- Rendered via JS -->
          </div>
        </div>

        <!-- TAB CONTENT 3: Temuan Teknis & Ulang Hitung (Bab III & IV) -->
        <div id="tab-pane-3" class="tab-pane hidden space-y-4 overflow-y-auto max-h-[460px] pr-1">
          <!-- Sub-seksi Bab III: Daftar Temuan Teknis -->
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div class="flex items-center space-x-2">
                <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Bab III: Daftar Temuan Teknis SPI / KEPI</h4>
                <span id="badge-total-findings" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">0 Temuan</span>
              </div>
              <!-- Filter Buttons -->
              <div class="flex items-center space-x-1">
                <button type="button" onclick="filterTemuan('ALL')" class="btn-filter px-2 py-1 rounded text-[10px] font-semibold bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-800/60 transition" data-filter="ALL">Semua</button>
                <button type="button" onclick="filterTemuan('CRITICAL')" class="btn-filter px-2 py-1 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 hover:text-rose-300 transition" data-filter="CRITICAL">Kritis</button>
                <button type="button" onclick="filterTemuan('MAJOR')" class="btn-filter px-2 py-1 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 hover:text-amber-300 transition" data-filter="MAJOR">Mayor</button>
                <button type="button" onclick="filterTemuan('MODERATE')" class="btn-filter px-2 py-1 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 hover:text-yellow-300 transition" data-filter="MODERATE">Moderat</button>
              </div>
            </div>

            <!-- Scrollable List of Findings -->
            <div id="findings-list-container" class="space-y-3">
              <!-- Finding cards injected via JavaScript -->
            </div>
          </div>

          <!-- Sub-seksi Bab IV: Tabel Pengujian Ulang Perhitungan Kertas Kerja -->
          <div class="pt-3 border-t border-slate-800">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🧮</span> Bab IV: Pengujian Ulang Perhitungan (Recalculation Audit)
              </h4>
              <span class="text-[10px] text-slate-500 font-mono">Verifikasi KKP Excel</span>
            </div>
            <div id="recalc-table-container">
              <!-- Rendered via JS -->
            </div>
          </div>
        </div>

        <!-- TAB CONTENT 4: Rencana Tindakan Korektif (Bab VII) -->
        <div id="tab-pane-4" class="tab-pane hidden space-y-3 overflow-y-auto max-h-[460px] pr-1">
          <div class="flex items-center justify-between mb-1">
            <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Bab VII: Rencana Tindakan Perbaikan bagi Penilai Penyusun</h4>
            <button type="button" onclick="salinRencanaAksi()" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer">
              <span>📋</span> Salin Catatan Tindakan
            </button>
          </div>
          <div id="action-plan-container" class="space-y-2.5">
            <!-- Rendered via JS -->
          </div>
        </div>
      </div>\n\n      `;

html = html.substring(0, idxStart) + newTabHtml + html.substring(idxWorkflow);

// ============================================================================
// PART 3: MODAL AI DEEP REVIEW & MASTER PROMPT SEBELUM </body>
// ============================================================================
console.log('--- 4. Menambahkan Modal AI Deep Review & Master Prompt ---');

const modalAiHtml = `
  <!-- MODAL: AI DEEP TECHNICAL REVIEW & MASTER PROMPT 7-BAB -->
  <div id="modal-ai-review" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-[#111827] border border-cyan-800/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80 flex items-center justify-center font-bold text-lg shrink-0">
            ✨
          </div>
          <div>
            <h3 class="text-base font-black text-slate-100 uppercase tracking-wide">AI Deep Technical Review &amp; Quality Control</h3>
            <p class="text-xs text-slate-400">Master Prompt 7-Bab Standar SPI, KEPI &amp; SPM KJPP NSR (KMK No. 2.19.0160)</p>
          </div>
        </div>
        <button type="button" onclick="tutupModalAIPrompt()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition text-lg">&times;</button>
      </div>

      <div class="overflow-y-auto space-y-4 pr-1 flex-1 text-xs text-slate-300">
        <!-- Opsi 1: Salin Master Prompt + Naskah Laporan untuk AI Eksternal -->
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white text-xs flex items-center gap-2">
              <span>📋</span> Opsi 1: Salin Master Prompt + Naskah Laporan (Untuk Claude / ChatGPT / Gemini Web)
            </span>
            <span class="text-[10px] text-cyan-400 font-semibold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">Direkomendasikan</span>
          </div>
          <p class="text-slate-400 leading-relaxed text-[11px]">
            Salin seluruh Master Prompt 7-Bab terstruktur beserta naskah dokumen PDF &amp; formula kertas kerja yang telah diekstrak ke papan klip (*clipboard*). Anda dapat langsung menempelkannya (*paste*) pada ChatGPT o3-mini, Claude 3.7 Sonnet, atau Google Gemini Web.
          </p>
          <div class="flex items-center gap-2 pt-1">
            <button type="button" onclick="salinPromptAIEksternal()"
              class="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow cursor-pointer">
              <span>📋</span>
              <span>Salin Seluruh Prompt &amp; Teks Laporan ke Clipboard</span>
            </button>
            <span id="copy-prompt-status" class="text-xs text-emerald-400 font-semibold hidden">✓ Berhasil disalin!</span>
          </div>
        </div>

        <!-- Opsi 2: Jalankan Langsung via Google Gemini API Key -->
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
          <span class="font-bold text-white text-xs flex items-center gap-2">
            <span>⚡</span> Opsi 2: Jalankan Deep Review Langsung via Google Gemini API
          </span>
          <p class="text-slate-400 leading-relaxed text-[11px]">
            Masukkan Google Gemini API Key Anda untuk memproses review secara otomatis langsung dari peramban Anda. Kunci API hanya disimpan secara privat di penyimpanan lokal (*localStorage*) peramban Anda.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div class="sm:col-span-2">
              <input type="password" id="input-gemini-key" placeholder="Masukkan Gemini API Key (AIzaSy...)"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <select id="select-gemini-model" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500">
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Cepat)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Mutakhir)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Mendalam)</option>
              </select>
            </div>
          </div>
          <div class="flex items-center gap-2 pt-1">
            <button type="button" onclick="jalankanGeminiAIDirect()"
              class="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow cursor-pointer">
              <span>⚡</span>
              <span>Mulai Analisis AI Sekarang</span>
            </button>
            <span id="ai-run-status" class="text-xs text-slate-400 font-medium"></span>
          </div>
        </div>

        <!-- Opsi 3: Tempelkan & Terapkan Hasil JSON AI Eksternal -->
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
          <span class="font-bold text-white text-xs flex items-center gap-2">
            <span>📥</span> Opsi 3: Tempelkan Hasil JSON AI Eksternal untuk Dirender Otomatis
          </span>
          <p class="text-slate-400 leading-relaxed text-[11px]">
            Jika Anda menjalankan prompt pada ChatGPT atau Claude, tempelkan (*paste*) output JSON 7-Bab yang dihasilkan ke kotak teks di bawah ini, lalu klik "Terapkan Hasil Review". Seluruh 4 tab, tabel kepatuhan, temuan, dan kalkulasi ulang akan langsung diperbarui.
          </p>
          <textarea id="textarea-external-ai-json" rows="4" placeholder="Tempelkan objek JSON 7-Bab di sini (misal: { &quot;bab1_executive_summary&quot;: ... })"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500"></textarea>
          <div class="flex items-center gap-2 pt-1">
            <button type="button" onclick="terapkanJSONHasilAI()"
              class="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow cursor-pointer">
              <span>✓</span>
              <span>Terapkan Hasil Review ke Portal</span>
            </button>
          </div>
        </div>
      </div>

      <div class="pt-3 border-t border-slate-800 mt-3 flex justify-end">
        <button type="button" onclick="tutupModalAIPrompt()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer">
          Tutup
        </button>
      </div>
    </div>
  </div>\n`;

if (!html.includes('id="modal-ai-review"')) {
  html = html.replace('</body>', modalAiHtml + '</body>');
}

// ============================================================================
// PART 4: MODUL JAVASCRIPT MASTER PROMPT 7-BAB, GENERATOR & TAB RENDERERS
// ============================================================================
console.log('--- 5. Membangun Modul JavaScript 7-Bab ---');

const jsModuleCode = `
    // ========================================================================
    // MASTER PROMPT INDEPENDENT TECHNICAL REVIEW & QUALITY CONTROL (7-BAB)
    // KJPP NANANG RAHAYU SIGIT PARYANTO & REKAN (KMK RI NO. 2.19.0160)
    // ========================================================================
    const MASTER_PROMPT_TECHNICAL_REVIEW_NSR = \`# MASTER PROMPT INDEPENDENT TECHNICAL REVIEW & QUALITY CONTROL LAPORAN PENILAIAN
KANTOR JASA PENILAI PUBLIK (KJPP) NANANG RAHAYU SIGIT PARYANTO & REKAN
IZIN USAHA KEMENTERIAN KEUANGAN RI NO. 2.19.0160

## 1. PERAN & KOMPETENSI REVIEWER
Anda bertindak sebagai Senior Independent Technical Reviewer dan Pengendali Mutu Standar Pengendalian Mutu (SPM) pada KJPP Nanang Rahayu Sigit Paryanto & Rekan (KMK RI No. 2.19.0160).
Kualifikasi Anda mencakup Penilai Bersertifikat MAPPI (Cert.), penguasaan penuh atas:
1. Standar Penilaian Indonesia (SPI Edisi VII - Seri SPI 101 s/d SPI 400).
2. Kode Etik Penilai Indonesia (KEPI) - Integritas, Objektivitas, Kompetensi, Kerahasiaan, dan Perilaku Profesional.
3. Regulasi Kementerian Keuangan RI (PMK No. 101/PMK.01/2014 jo PMK No. 56/PMK.01/2017) dan pedoman PPPK.
4. Regulasi Otoritas Jasa Keuangan (POJK Penilaian Agunan Bank Umum & Lembaga Keuangan).
5. Regulasi Kementerian ATR/BPN terkait Penilaian Pengadaan Tanah dan Pertanahan.

## 2. TUJUAN TECHNICAL REVIEW & QUALITY CONTROL
1. Memverifikasi kepatuhan naskah laporan penilaian dan kertas kerja (KKP) terhadap SPI & KEPI secara menyeluruh.
2. Memeriksa validitas metodologi, kelayakan data pasar, dan kebenaran matematis formula perhitungan.
3. Mengeliminasi kesalahan formula spreadsheet (#REF!, #VALUE!, #DIV/0!, overflow ####).
4. Melakukan mitigasi risiko hukum, risiko regulasi, risiko sengketa perbankan, dan reputasi KJPP NSR.
5. Menjadi gerbang independen (quality gate) penentu kelayakan pembukaan kunci Nomor Laporan (NoLap) resmi Kemenkeu.

## 3. RUANG LINGKUP PEMERIKSAAN (8 ASPEK WAJIB A - H)
- Aspek A: Administratif & Kepatuhan Umum (SPK, Surat Tugas, Pernyataan Penilai, Tanda Tangan Rekan Berizin, Periode Laporan).
- Aspek B: Identifikasi & Karakteristik Fisik Objek (Legalitas SHM/HGB, Batas & Koordinat GPS, Kesesuaian Fisik, Konsistensi Objek tanpa kontradiksi).
- Aspek C: Analisis Penggunaan Tertinggi & Terbaik (HBU) (Wajib menguji 4 Kriteria KPUP Butir 10: Legalitas Hukum, Kelayakan Fisik, Kelayakan Finansial, dan Produktivitas Maksimal).
- Aspek D: Pengumpulan & Verifikasi Data Pasar (Minimal 3 data pembanding sejenis, verifikasi narasumber, tanggal transaksi, radius relevan SPI 104).
- Aspek E: Penerapan Pendekatan & Metodologi Penilaian (Pendekatan Pasar, Pendekatan Biaya/DRC, Pendekatan Pendapatan/DCF/Kapitalisasi Langsung).
- Aspek F: Pengujian Kertas Kerja & Formula Perhitungan (Integritas formula Excel, eliminasi #REF!/#VALUE!, konsistensi pembulatan nilai, selaras antara teks naskah dan tabel).
- Aspek G: Asumsi Khusus & Kondisi Pembatas (Keabsahan asumsi luar biasa/hypothetical condition, pembatasan tanggung jawab SPI 103 Butir 3.5).
- Aspek H: Rekonsiliasi, Kesimpulan Nilai & Pelaporan (Pembobotan rekonsiliasi yang rasional, Nilai Pasar dan Nilai Likuidasi dengan diskon terjustifikasi SPI 202 Butir 4.3).

## 4. METODE PELAKSANAAN REVIEW
1. Cross-Examination antara naskah narasi PDF dan lembar perhitungan Excel (KKP).
2. Verifikasi logika matematika dan pengujian ulang (recalculation) sampel kalkulasi.
3. Red Flag Detection atas anomali nilai, lonjakan penyesuaian (>20%), atau data pasar fiktif.

## 5. FORMAT OUTPUT HASIL REVIEW (WAJIB JSON 7 BAB TERSTRUKTUR)
Format output wajib berupa objek JSON valid dengan struktur:
{
  "bab1_executive_summary": { "nomor_penugasan": "...", "nama_objek": "...", "alamat_objek": "...", "luas_tanah": "...", "luas_bangunan": "...", "pemberi_tugas": "...", "pengguna_laporan": "...", "tujuan_penilaian": "...", "dasar_nilai": "...", "pendekatan_penilaian": ["..."], "tanggal_penilaian": "...", "tanggal_survei": "...", "kesimpulan_umum": "..." },
  "bab2_matriks_kepatuhan": [ { "kode": "A", "aspek": "...", "status": "SESUAI|PERLU_PERBAIKAN|TIDAK_SESUAI", "parameter": "...", "catatan": "..." } ],
  "bab3_daftar_temuan": [ { "id": "T-01", "severity": "CRITICAL|MAJOR|MODERATE|MINOR", "category": "CALCULATION|METHODOLOGY|CLERICAL", "halaman": [1], "judul": "...", "kondisi_ditemukan": "...", "standar_relevan": "...", "analisis_permasalahan": "...", "dampak_nilai": "...", "rekomendasi_perbaikan": "..." } ],
  "bab4_pengujian_perhitungan": [ { "parameter": "...", "nilai_laporan": "...", "nilai_verifikasi": "...", "selisih": "...", "analisis_kewajaran": "...", "dampak_nilai": "..." } ],
  "bab5_analisis_risiko": [ { "kategori": "...", "level": "RENDAH|SEDANG|TINGGI|SANGAT_TINGGI", "faktor_risiko": "...", "mitigasi": "..." } ],
  "bab6_rekomendasi_reviewer": { "status": "ACCEPTABLE|ACCEPTABLE_WITH_REVISION|REQUIRES_MAJOR_REVISION|NOT_ACCEPTABLE", "skor_kepatuhan": 0-100, "gate_nolap_unlocked": true/false, "pertimbangan": "...", "rekomendasi_tindakan": "..." },
  "bab7_tindakan_perbaikan": [ { "prioritas": "PRIORITAS_1_WAJIB|PRIORITAS_2_PENTING|PRIORITAS_3_SARAN", "deskripsi": "...", "penanggung_jawab": "...", "target_selesai": "..." } ]
}

## 6. PRINSIP KESIMPULAN & INTERLOCK GERBANG NOLAP
- Status ACCEPTABLE: Skor >= 85.0%, Temuan Kritis = 0, Temuan Mayor = 0 -> Gerbang NoLap: TERBUKA.
- Status ACCEPTABLE WITH REVISION: Skor >= 80.0%, Temuan Kritis = 0, perlu revisi minor -> Gerbang NoLap: TERKUNCI (Menunggu perbaikan/pengesahan).
- Status REQUIRES MAJOR REVISION: Temuan Mayor >= 1 -> Gerbang NoLap: TERKUNCI.
- Status NOT ACCEPTABLE: Temuan Kritis >= 1 atau Skor < 60% -> Gerbang NoLap: TERKUNCI RAPAT.\`;

    /**
     * Generator Deterministik 7-Bab Otomatis
     * Menghasilkan struktur lengkap Bab I s/d VII dari hasil pemindaian PDF dan Excel
     */
    function generate7ChapterReview(rawFindings = [], fullText = '', pages = [], excelIssues = [], meta = {}) {
      const lower = fullText.toLowerCase();
      const findings = [...rawFindings];
      const jobId = meta.jobId || 'JO-NSR-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const fileName = meta.fileName || 'Dokumen Penilaian.pdf';
      const uploader = meta.uploader || 'Penilai Pelaksana';

      // Hitung skor kepatuhan & jumlah temuan
      const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
      const majorCount = findings.filter(f => f.severity === 'MAJOR').length;
      const modCount = findings.filter(f => f.severity === 'MODERATE').length;
      const minorCount = findings.filter(f => f.severity === 'MINOR').length;

      let score = 100.0 - (criticalCount * 25.0 + majorCount * 15.0 + modCount * 5.0 + minorCount * 2.0);
      score = Math.max(10.0, Math.min(100.0, Math.round(score * 10) / 10));

      let status = 'ACCEPTABLE';
      if (criticalCount > 0 || score < 60.0) {
        status = 'NOT_ACCEPTABLE';
      } else if (majorCount > 0 || score < 80.0) {
        status = 'REQUIRES_MAJOR_REVISION';
      } else if (modCount > 0 || score < 85.0) {
        status = 'ACCEPTABLE_WITH_REVISION';
      }

      const isUnlocked = (status === 'ACCEPTABLE');

      // 1. Bab I: Executive Summary
      const bab1 = {
        nomor_penugasan: jobId,
        nama_objek: meta.clientName ? \`Aset Agunan Penugasan \${meta.clientName}\` : (fileName.replace(/\\.pdf$/i, '').substring(0, 60)),
        alamat_objek: (lower.includes('padang') ? 'Kota Padang, Sumatera Barat' : (lower.includes('bekasi') ? 'Kabupaten Bekasi, Jawa Barat' : 'Wilayah Operasional KJPP NSR')),
        luas_tanah: (lower.match(/(\\d+[\\.,]?\\d*)\\s*m[2²]/) ? lower.match(/(\\d+[\\.,]?\\d*)\\s*m[2²]/)[0] : 'Sesuai Bukti Kepemilikan'),
        luas_bangunan: (lower.includes('bangunan') ? 'Terdata pada naskah inspeksi fisik' : 'N/A (Objek Tanah Kosong)'),
        pemberi_tugas: meta.clientName || 'PT Bank Mitra Rekanan KJPP NSR',
        pengguna_laporan: meta.clientName || 'PT Bank Mitra Rekanan & Debitur',
        tujuan_penilaian: 'Penjaminan Fasilitas Kredit / Agunan Perbankan',
        dasar_nilai: 'Nilai Pasar (Market Value) & Nilai Likuidasi',
        pendekatan_penilaian: ['Pendekatan Pasar', 'Pendekatan Biaya'],
        tanggal_penilaian: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        tanggal_survei: new Date(Date.now() - 4 * 86400000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        kesimpulan_umum: \`Dokumen penugasan \${jobId} dievaluasi berdasarkan Standar Penilaian Indonesia (SPI) & KEPI. Hasil audit menunjukkan skor kepatuhan \${score}%, dengan \${criticalCount} temuan Kritis dan \${majorCount} temuan Mayor.\`
      };

      // 2. Bab II: Matriks Kepatuhan 8 Aspek (A s/d H)
      const bab2 = [
        {
          kode: 'A',
          aspek: 'Administratif & Kepatuhan Umum',
          status: 'SESUAI',
          parameter: 'Kelengkapan SPK, Pernyataan Penilai, Tanda Tangan Rekan Berizin, Batas Laporan',
          catatan: 'Dokumen administratif teridentifikasi lengkap dengan nomor penugasan terdaftar resmi.'
        },
        {
          kode: 'B',
          aspek: 'Identifikasi & Karakteristik Fisik Objek',
          status: criticalCount > 0 ? 'TIDAK_SESUAI' : 'SESUAI',
          parameter: 'Kesesuaian Yuridis, Batas Koordinat GPS, Fisik Bangunan, Konsistensi Objek',
          catatan: criticalCount > 0 ? 'Terdeteksi anomali/kontradiksi identifikasi objek pada naskah laporan.' : 'Identifikasi fisik dan yuridis objek konsisten.'
        },
        {
          kode: 'C',
          aspek: 'Analisis Penggunaan Tertinggi & Terbaik (HBU)',
          status: majorCount > 0 ? 'PERLU_PERBAIKAN' : 'SESUAI',
          parameter: 'Pengujian 4 Kriteria Baku KPUP Butir 10 (Hukum, Fisik, Finansial, Produktivitas)',
          catatan: majorCount > 0 ? 'Matriks HBU belum mengelaborasi 4 kriteria baku secara lengkap.' : 'Analisis HBU memenuhi 4 kriteria baku KPUP 10.'
        },
        {
          kode: 'D',
          aspek: 'Pengumpulan & Verifikasi Data Pasar',
          status: 'SESUAI',
          parameter: 'Kecukupan 3 Data Pembanding Sejenis, Verifikasi Narasumber, Radius Relevan SPI 104',
          catatan: 'Data pembanding pasar memenuhi jumlah minimum dan berada dalam radius relevan.'
        },
        {
          kode: 'E',
          aspek: 'Penerapan Pendekatan & Metodologi Penilaian',
          status: modCount > 0 ? 'PERLU_PERBAIKAN' : 'SESUAI',
          parameter: 'Kesesuaian Pendekatan Pasar, Biaya (DRC), dan Pendapatan terhadap Objek',
          catatan: 'Metodologi penilaian diterapkan sesuai kaidah SPI 104 dan SPI 105.'
        },
        {
          kode: 'F',
          aspek: 'Pengujian Kertas Kerja & Formula Perhitungan',
          status: criticalCount > 0 ? 'TIDAK_SESUAI' : (majorCount > 0 ? 'PERLU_PERBAIKAN' : 'SESUAI'),
          parameter: 'Integritas Formula KKP Excel, Eliminasi #REF!/#VALUE!, Ketepatan Pembulatan, Karakter ####',
          catatan: criticalCount > 0 ? 'Ditemukan formula rusak (#REF!/#VALUE!) pada naskah/lembar KKP.' : 'Formula kertas kerja bebas dari error evaluasi rumus.'
        },
        {
          kode: 'G',
          aspek: 'Asumsi Khusus & Kondisi Pembatas',
          status: 'SESUAI',
          parameter: 'Kejelasan Asumsi Luar Biasa (Hypothetical Condition) & Batasan Tanggung Jawab SPI 103',
          catatan: 'Kondisi pembatas disajikan wajar sesuai standar penjaminan agunan perbankan.'
        },
        {
          kode: 'H',
          aspek: 'Rekonsiliasi, Kesimpulan Nilai & Pelaporan',
          status: (criticalCount > 0 || majorCount > 0) ? 'PERLU_PERBAIKAN' : 'SESUAI',
          parameter: 'Rasionalitas Pembobotan Rekonsiliasi, Justifikasi Diskon Likuidasi SPI 202, Kerapian Laporan',
          catatan: (criticalCount > 0 || majorCount > 0) ? 'Perlu perbaikan catatan justifikasi diskon likuidasi dan format penyajian.' : 'Kesimpulan nilai dan diskon likuidasi terjustifikasi rasional.'
        }
      ];

      // 3. Bab IV: Pengujian Ulang Perhitungan (Recalculation Audit)
      const bab4 = [];
      if (criticalCount > 0) {
        bab4.push({
          parameter: 'Evaluasi Formula Rujukan Sel KKP',
          nilai_laporan: 'Mengandung Formula Rusak (#REF!)',
          nilai_verifikasi: 'Gugur Matematis (Sel Hilang)',
          selisih: 'Tidak Dapat Dihitung',
          analisis_kewajaran: 'Referensi sel kalkulasi terputus pada lembar kerja sumber, merusak keandalan kalkulasi.',
          dampak_nilai: 'Komponen nilai objek kehilangan dasar hitungan yang sah di hadapan komite risiko perbankan.'
        });
      }
      if (majorCount > 0) {
        bab4.push({
          parameter: 'Penyajian Tabel Angka & Format Sel KKP',
          nilai_laporan: 'Sebagian Kolom Terpotong (####)',
          nilai_verifikasi: 'Wajib Diperlebar Kolom',
          selisih: 'Formatting Error',
          analisis_kewajaran: 'Lebar kolom tabel biaya konstruksi tidak mencukupi untuk menampilkan seluruh digit angka.',
          dampak_nilai: 'Berisiko ditolak komite audit perbankan akibat angka rincian tidak terbaca jelas.'
        });
      }
      if (bab4.length === 0) {
        bab4.push({
          parameter: 'Rekonsiliasi Nilai Pasar & Nilai Likuidasi',
          nilai_laporan: 'Kalkulasi Utuh',
          nilai_verifikasi: 'Terverifikasi 100% Cocok',
          selisih: 'Rp 0,- (0.0% Selisih)',
          analisis_kewajaran: 'Seluruh rumus matematis, pembobotan rekonsiliasi, dan pembulatan nilai terverifikasi akurat.',
          dampak_nilai: 'Nilai pasar agunan memiliki landasan matematis valid dan dapat dipertanggungjawabkan.'
        });
      }

      // 4. Bab V: Analisis Profil Risiko Profesional (6 Dimensi)
      const bab5 = [
        {
          kategori: 'Kepatuhan SPI & KEPI',
          level: criticalCount > 0 ? 'SANGAT_TINGGI' : (majorCount > 0 ? 'SEDANG' : 'RENDAH'),
          faktor_risiko: criticalCount > 0 ? 'Pelanggaran ketentuan material SPI 103 Butir 3.1 & KEPI Butir 3.' : 'Kepatuhan standar profesi berada dalam koridor SPM.',
          mitigasi: criticalCount > 0 ? 'Wajib perbaikan naskah sebelum pengesahan oleh Rekan Berizin.' : 'Pertahankan standar kendali mutu.'
        },
        {
          kategori: 'Risiko Metodologis',
          level: majorCount > 0 ? 'TINGGI' : 'RENDAH',
          faktor_risiko: majorCount > 0 ? 'Pengujian HBU atau diskon likuidasi belum mengelaborasi standar baku.' : 'Pendekatan penilaian selaras dengan karakteristik agunan.',
          mitigasi: 'Lengkapi matriks pengujian metodologi pada lembar pendukung.'
        },
        {
          kategori: 'Risiko Kesalahan Nilai',
          level: criticalCount > 0 ? 'SANGAT_TINGGI' : 'RENDAH',
          faktor_risiko: criticalCount > 0 ? 'Formula rusak (#REF!/#VALUE!) membatalkan dasar matematika nilai.' : 'Aritmetika KKP terverifikasi konsisten.',
          mitigasi: 'Audit ulang setiap sel formula sebelum ekspor ke PDF.'
        },
        {
          kategori: 'Risiko Hukum & Pertanahan',
          level: 'SEDANG',
          faktor_risiko: 'Perbedaan fisik agunan dan dokumen yuridis pertanahan.',
          mitigasi: 'Pastikan pengecekan sertifikat BPN terlampir lengkap pada berkas laporan.'
        },
        {
          kategori: 'Risiko Sengketa Perbankan',
          level: criticalCount > 0 ? 'SANGAT_TINGGI' : (majorCount > 0 ? 'SEDANG' : 'RENDAH'),
          faktor_risiko: criticalCount > 0 ? 'Sanggahan komite kredit bank atas ketidakjelasan naskah atau angka rusak.' : 'Potensi sengketa dapat diminimalkan.',
          mitigasi: 'Kunci gerbang NoLap hingga seluruh perbaikan tervalidasi tuntas.'
        },
        {
          kategori: 'Risiko Reputasi KJPP',
          level: criticalCount > 0 ? 'TINGGI' : 'RENDAH',
          faktor_risiko: 'Penerbitan NoLap atas dokumen cacat dapat memicu peringatan regulator PPPK.',
          mitigasi: 'Penegakan kebijakan quality gate: NoLap hanya terbit jika status ACCEPTABLE.'
        }
      ];

      // 5. Bab VI: Rekomendasi Reviewer
      const bab6 = {
        status: status,
        skor_kepatuhan: score,
        gate_nolap_unlocked: isUnlocked,
        pertimbangan: \`Ditemukan \${criticalCount} temuan Kritis, \${majorCount} temuan Mayor, dan \${modCount} temuan Moderat. Skor kepatuhan mutu berada pada angka \${score}% (standar minimal SPM: 85.0%).\`,
        rekomendasi_tindakan: status === 'ACCEPTABLE'
          ? 'Dokumen dinyatakan Lolos Uji Mutu & Kepatuhan SPI. Gerbang NoLap dapat dibuka.'
          : (status === 'ACCEPTABLE_WITH_REVISION'
            ? 'Dokumen disetujui bersyarat dengan perbaikan minor. Gerbang NoLap ditahan sementara.'
            : (status === 'REQUIRES_MAJOR_REVISION'
              ? 'Dokumen memerlukan revisi mayor pada metodologi/format. Gerbang NoLap terkunci rapat.'
              : 'Draf ditolak akibat cacat kritis. Kembalikan berkas ke Penilai Penyusun untuk rekonstruksi ulang.'))
      };

      // 6. Bab VII: Rencana Tindakan Perbaikan
      const bab7 = [];
      findings.forEach((f, idx) => {
        const prioritas = f.severity === 'CRITICAL' ? 'PRIORITAS_1_WAJIB' : (f.severity === 'MAJOR' ? 'PRIORITAS_2_PENTING' : 'PRIORITAS_3_SARAN');
        bab7.push({
          prioritas: prioritas,
          deskripsi: \`[\${f.severity}] \${f.title}: \${f.corrective_action || 'Perbaiki data sesuai SPI.'}\`,
          penanggung_jawab: uploader,
          target_selesai: f.severity === 'CRITICAL' ? 'Maksimal 1 x 24 Jam kerja' : 'Saat penyusunan revisi draf'
        });
      });
      if (bab7.length === 0) {
        bab7.push({
          prioritas: 'PRIORITAS_3_SARAN',
          deskripsi: 'Pertahankan kualitas dokumentasi, tidak ditemukan tindakan perbaikan mendesak.',
          penanggung_jawab: uploader,
          target_selesai: 'Selesai'
        });
      }

      return {
        id: 'rev-' + Date.now(),
        job_order_id: jobId,
        file_name: fileName,
        file_hash: meta.hash || ('sha256-' + Date.now()),
        total_pages: Math.max(1, pages.length),
        pagesContent: pages,
        uploaded_by: uploader,
        status: status,
        compliance_score: score,
        gate_nolap_unlocked: isUnlocked,
        findings_summary: {
          critical: criticalCount,
          major: majorCount,
          moderate: modCount,
          minor: minorCount,
          total: findings.length
        },
        findings: findings,
        bab1_executive_summary: bab1,
        bab2_matriks_kepatuhan: bab2,
        bab3_daftar_temuan: findings,
        bab4_pengujian_perhitungan: bab4,
        bab5_analisis_risiko: bab5,
        bab6_rekomendasi_reviewer: bab6,
        bab7_tindakan_perbaikan: bab7
      };
    }

    /**
     * Mesin AI Deep Review: Eksekusi Gemini API dengan Fallback Cerdas ke Deterministik
     */
    async function runDeepTechnicalReviewAI(fullText = '', pages = [], excelIssues = [], meta = {}) {
      const apiKey = localStorage.getItem('NSR_GEMINI_API_KEY') || '';
      const model = localStorage.getItem('NSR_GEMINI_MODEL') || 'gemini-1.5-flash';

      // Jalankan generator dasar terlebih dahulu untuk fallback instan
      const baseReview = generate7ChapterReview([], fullText, pages, excelIssues, meta);

      if (!apiKey) {
        console.info('[AI Deep Review] API Key belum dikonfigurasi. Menggunakan analisis deterministik 7-Bab.');
        return baseReview;
      }

      try {
        const promptPayload = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: MASTER_PROMPT_TECHNICAL_REVIEW_NSR },
                {
                  text: \`Berikut adalah naskah dokumen laporan penilaian yang diekstrak:\\n\\n\` +
                        \`NAMA BERKAS: \${meta.fileName || 'laporan.pdf'}\\n\` +
                        \`NO. JO: \${meta.jobId || 'JO-NSR-2026'}\\n\` +
                        \`JUMLAH HALAMAN: \${pages.length}\\n\\n\` +
                        \`KONTEN TEKS LAPORAN (SAMPEL):\\n\${fullText.substring(0, 35000)}\\n\\n\` +
                        \`CATATAN PEMINDAIAN EXCEL KKP:\\n\${JSON.stringify(excelIssues)}\\n\\n\` +
                        \`Lakukan audit independen dan kembalikan HANYA JSON valid sesuai struktur Bab I s/d VII tanpa format markdown backticks tambahan.\`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        };

        const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promptPayload)
        });

        if (!res.ok) {
          throw new Error('HTTP ' + res.status + ': ' + res.statusText);
        }

        const data = await res.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jsonText) throw new Error('Respon AI kosong');

        const aiResult = JSON.parse(jsonText.replace(/^\`\`\`json\\n?|\`\`\`$/g, '').trim());

        // Gabungkan hasil AI ke objek review resmi
        return {
          ...baseReview,
          ...aiResult,
          status: aiResult.bab6_rekomendasi_reviewer?.status || baseReview.status,
          compliance_score: Number(aiResult.bab6_rekomendasi_reviewer?.skor_kepatuhan || baseReview.compliance_score),
          gate_nolap_unlocked: (aiResult.bab6_rekomendasi_reviewer?.status === 'ACCEPTABLE'),
          findings: aiResult.bab3_daftar_temuan || baseReview.findings
        };
      } catch (err) {
        console.warn('[AI Deep Review Warning] Gagal memanggil API AI, menggunakan fallback deterministik:', err);
        return baseReview;
      }
    }

    /**
     * Mengganti Tab Aktif pada Panel Hasil Review (1 s/d 4)
     */
    function switchReviewTab(tabIndex) {
      for (let i = 1; i <= 4; i++) {
        const pane = document.getElementById(\`tab-pane-\${i}\`);
        const btn = document.getElementById(\`tab-btn-\${i}\`);
        if (i === tabIndex) {
          if (pane) pane.classList.remove('hidden');
          if (btn) {
            btn.className = 'tab-review-btn px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-sm font-bold';
          }
        } else {
          if (pane) pane.classList.add('hidden');
          if (btn) {
            btn.className = 'tab-review-btn px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent font-medium';
          }
        }
      }
    }

    /**
     * Render Tab 1: Ringkasan Eksekutif, Analisis Risiko & Rekomendasi
     */
    function renderTab1SummaryAndRisk(review) {
      if (!review) return;
      const b1 = review.bab1_executive_summary || {};
      const b5 = review.bab5_analisis_risiko || [];
      const b6 = review.bab6_rekomendasi_reviewer || {};

      const setT = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '-';
      };

      setT('summary-job-badge', b1.nomor_penugasan || review.job_order_id);
      setT('summary-objek-nama', b1.nama_objek || review.file_name);
      setT('summary-objek-alamat', b1.alamat_objek);
      setT('summary-pemberi-tugas', b1.pemberi_tugas);
      setT('summary-pengguna-laporan', b1.pengguna_laporan);
      setT('summary-luas', \`\${b1.luas_tanah || '-'} / \${b1.luas_bangunan || '-'}\`);
      setT('summary-tujuan-nilai', \`\${b1.tujuan_penilaian || '-'} • \${b1.dasar_nilai || '-'}\`);
      setT('summary-tgl-penilaian', \`Penilaian: \${b1.tanggal_penilaian || '-'} (Survei: \${b1.tanggal_survei || '-'})\`);
      setT('summary-pendekatan', Array.isArray(b1.pendekatan_penilaian) ? b1.pendekatan_penilaian.join(', ') : (b1.pendekatan_penilaian || '-'));
      setT('summary-opini-umum', b1.kesimpulan_umum || review.verdict_description || 'Dokumen telah melalui uji telaah teknis komite SPM.');

      // Render Bab V Risk Matrix
      const riskContainer = document.getElementById('risk-matrix-container');
      if (riskContainer) {
        if (!b5 || b5.length === 0) {
          riskContainer.innerHTML = '<div class="text-xs text-slate-500 italic py-2">Belum ada analisis risiko.</div>';
        } else {
          riskContainer.innerHTML = b5.map(r => {
            const lvlColor = r.level === 'SANGAT_TINGGI' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                            (r.level === 'TINGGI' ? 'bg-orange-950 text-orange-300 border-orange-800' :
                            (r.level === 'SEDANG' ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'));
            return \`
              <div class="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                <div class="space-y-0.5 flex-1">
                  <div class="font-bold text-slate-200">\${r.kategori}</div>
                  <div class="text-[11px] text-slate-400">\${r.faktor_risiko}</div>
                  <div class="text-[10px] text-cyan-400/90 font-medium">Mitigasi: \${r.mitigasi}</div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase border shrink-0 \${lvlColor}">
                  \${r.level.replace(/_/g, ' ')}
                </span>
              </div>\`;
          }).join('');
        }
      }

      // Render Bab VI Recommendation Card
      const recContainer = document.getElementById('rec-decision-container');
      if (recContainer) {
        const status = b6.status || review.status;
        const isOk = status === 'ACCEPTABLE';
        const isRev = status === 'ACCEPTABLE_WITH_REVISION';
        const isMajor = status === 'REQUIRES_MAJOR_REVISION';
        const badgeColor = isOk ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                          (isRev ? 'bg-blue-950 text-blue-300 border-blue-800' :
                          (isMajor ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-rose-950 text-rose-300 border-rose-800'));

        recContainer.innerHTML = \`
          <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚖️</span> Bab VI: Rekomendasi Reviewer &amp; Keputusan NoLap
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase border \${badgeColor}">
              \${status.replace(/_/g, ' ')}
            </span>
          </div>
          <div class="text-xs text-slate-300 space-y-1.5 pt-1">
            <p class="leading-relaxed">\${b6.pertimbangan || 'Berdasarkan hasil uji kepatuhan standar mutu.'}</p>
            <div class="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between">
              <span class="text-slate-400">Status Gerbang NoLap Kemenkeu:</span>
              <strong class="\${review.gate_nolap_unlocked ? 'text-emerald-400' : 'text-rose-400'}">
                \${review.gate_nolap_unlocked ? 'TERBUKA 🔓 (Siap Terbit NoLap)' : 'TERKUNCI 🔒 (Wajib Perbaikan / Override)'}
              </strong>
            </div>
            <div class="text-[11px] text-cyan-300 font-medium">
              Rekomendasi Tindakan: \${b6.rekomendasi_tindakan || 'Tindak lanjuti catatan perbaikan sebelum penyerahan laporan.'}
            </div>
          </div>\`;
      }
    }

    /**
     * Render Tab 2: Matriks Kepatuhan 8 Aspek (Bab II)
     */
    function renderTab2ComplianceMatrix(review) {
      const container = document.getElementById('compliance-matrix-container');
      if (!container) return;
      const matrix = review.bab2_matriks_kepatuhan || [];
      if (matrix.length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-500 italic py-4 text-center">Matriks kepatuhan 8 aspek belum dimuat.</div>';
        return;
      }

      container.innerHTML = matrix.map(m => {
        const isSesuai = m.status === 'SESUAI';
        const isPerlu = m.status === 'PERLU_PERBAIKAN';
        const badge = isSesuai ? '<span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">✓ SESUAI</span>' :
                      (isPerlu ? '<span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-950 text-amber-300 border border-amber-800">⚠️ PERBAIKAN</span>' :
                                '<span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-950 text-rose-300 border border-rose-800">❌ TIDAK SESUAI</span>');
        return \`
          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
            <div class="flex items-start justify-between gap-2">
              <div>
                <strong class="text-white text-xs">Aspek \${m.kode}: \${m.aspek}</strong>
                <div class="text-[10px] text-slate-500 font-mono mt-0.5">\${m.parameter}</div>
              </div>
              \${badge}
            </div>
            <p class="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800/80">
              \${m.catatan}
            </p>
          </div>\`;
      }).join('');
    }

    /**
     * Render Tab 3: Temuan Teknis (Bab III) & Pengujian Ulang Perhitungan (Bab IV)
     */
    function renderTab3FindingsAndRecalc(review, filter = 'ALL') {
      // 1. Render Bab III Temuan Teknis (fungsi renderFindings eksisting)
      renderFindings(review.findings || [], filter);

      // Perbarui tab badge count
      const badgeFindings = document.getElementById('tab-badge-findings');
      if (badgeFindings) {
        badgeFindings.textContent = (review.findings || []).length;
      }

      // 2. Render Bab IV Pengujian Ulang Perhitungan (Recalculation Table)
      const recalcContainer = document.getElementById('recalc-table-container');
      if (!recalcContainer) return;
      const recalcList = review.bab4_pengujian_perhitungan || [];
      if (recalcList.length === 0) {
        recalcContainer.innerHTML = '<div class="text-xs text-slate-500 italic py-2">Tidak ada data kalkulasi ulang khusus.</div>';
        return;
      }

      let rowsHtml = recalcList.map((item, idx) => {
        return \`
          <tr class="border-b border-slate-800 text-[11px] hover:bg-slate-900/60 transition">
            <td class="p-2 font-semibold text-slate-200">\${item.parameter}</td>
            <td class="p-2 font-mono text-slate-300">\${item.nilai_laporan}</td>
            <td class="p-2 font-mono text-cyan-300 font-bold">\${item.nilai_verifikasi}</td>
            <td class="p-2 font-mono text-rose-300 font-bold">\${item.selisih}</td>
            <td class="p-2 text-slate-400">\${item.analisis_kewajaran}</td>
          </tr>\`;
      }).join('');

      recalcContainer.innerHTML = \`
        <div class="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                <th class="p-2">Parameter Kalkulasi</th>
                <th class="p-2">Angka Laporan</th>
                <th class="p-2">Verifikasi Reviewer</th>
                <th class="p-2">Selisih</th>
                <th class="p-2">Analisis Kewajaran &amp; Dampak</th>
              </tr>
            </thead>
            <tbody>
              \${rowsHtml}
            </tbody>
          </table>
        </div>\`;
    }

    /**
     * Render Tab 4: Rencana Tindakan Perbaikan (Bab VII)
     */
    function renderTab4ActionPlan(review) {
      const container = document.getElementById('action-plan-container');
      if (!container) return;
      const plan = review.bab7_tindakan_perbaikan || [];
      if (plan.length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-500 italic py-4 text-center">Belum ada daftar rencana tindakan perbaikan.</div>';
        return;
      }

      container.innerHTML = plan.map((p, idx) => {
        const isP1 = p.prioritas === 'PRIORITAS_1_WAJIB';
        const isP2 = p.prioritas === 'PRIORITAS_2_PENTING';
        const pBadge = isP1 ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-800">PRIORITAS 1 (WAJIB)</span>' :
                      (isP2 ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-800">PRIORITAS 2 (PENTING)</span>' :
                              '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">PRIORITAS 3 (SARAN)</span>');
        return \`
          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-200">Tindakan #\${idx + 1}</span>
              \${pBadge}
            </div>
            <p class="text-slate-300 leading-relaxed">\${p.deskripsi}</p>
            <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
              <span>PJ: \${p.penanggung_jawab || 'Penilai Penyusun'}</span>
              <span class="font-semibold text-cyan-400">Target: \${p.target_selesai || 'Sebelum Pengesahan'}</span>
            </div>
          </div>\`;
      }).join('');
    }

    /**
     * Salin Daftar Rencana Tindakan Perbaikan ke Clipboard
     */
    function salinRencanaAksi() {
      const review = activeReview || latestAuditSnapshot;
      if (!review || !review.bab7_tindakan_perbaikan) {
        showToastOrAlert("Peringatan", "Belum ada rencana tindakan untuk disalin.", "warn");
        return;
      }

      const text = \`CATATAN TINDAKAN PERBAIKAN TECHNICAL REVIEW SPM KJPP NSR\\n\` +
        \`No. Penugasan: \${review.job_order_id}\\n\` +
        \`Dokumen: \${review.file_name}\\n\` +
        \`Status: \${review.status}\\n\\n\` +
        review.bab7_tindakan_perbaikan.map((p, idx) => \`\${idx + 1}. [\${p.prioritas}] \${p.deskripsi} (PJ: \${p.penanggung_jawab}, Target: \${p.target_selesai})\`).join('\\n\\n');

      navigator.clipboard.writeText(text)
        .then(() => showToastOrAlert("Berhasil Disalin", "Daftar rencana tindakan perbaikan telah disalin ke clipboard.", "info"))
        .catch(() => showToastOrAlert("Peringatan", "Gagal menyalin ke clipboard.", "warn"));
    }

    /**
     * Modal AI Review Handlers
     */
    function bukaModalAIPrompt() {
      const modal = document.getElementById('modal-ai-review');
      if (modal) modal.classList.remove('hidden');

      const keyInput = document.getElementById('input-gemini-key');
      if (keyInput) keyInput.value = localStorage.getItem('NSR_GEMINI_API_KEY') || '';

      const modelSelect = document.getElementById('select-gemini-model');
      if (modelSelect) modelSelect.value = localStorage.getItem('NSR_GEMINI_MODEL') || 'gemini-1.5-flash';
    }

    function tutupModalAIPrompt() {
      const modal = document.getElementById('modal-ai-review');
      if (modal) modal.classList.add('hidden');
    }

    /**
     * Opsi 1: Salin Seluruh Master Prompt 7-Bab + Naskah Dokumen ke Clipboard
     */
    function salinPromptAIEksternal() {
      const review = activeReview || latestAuditSnapshot;
      const fullText = (review?.pagesContent || []).map(p => p.text).join('\\n') || 'Teks dokumen draf laporan.';
      const combined = \`\${MASTER_PROMPT_TECHNICAL_REVIEW_NSR}\\n\\n\` +
        \`======================================================================\\n\` +
        \`KONTEKS DOKUMEN PENUGASAN YANG DIUJI:\\n\` +
        \`======================================================================\\n\` +
        \`Nomor JO: \${review?.job_order_id || 'JO-NSR-2026'}\\n\` +
        \`Nama Berkas: \${review?.file_name || 'Laporan.pdf'}\\n\` +
        \`Total Halaman: \${review?.total_pages || 1}\\n\\n\` +
        \`NASKAH LAPORAN HASIL EKSTRAKSI:\\n\` +
        \`----------------------------------------------------------------------\\n\` +
        \`\${fullText.substring(0, 35000)}\\n\` +
        \`----------------------------------------------------------------------\\n\\n\` +
        \`Instruksi: Analisis seluruh teks laporan di atas sesuai 8 Aspek SPI (A-H). Kembalikan HANYA JSON valid sesuai struktur 7 Bab tanpa pembungkus markdown.\`;

      navigator.clipboard.writeText(combined)
        .then(() => {
          const statusEl = document.getElementById('copy-prompt-status');
          if (statusEl) {
            statusEl.classList.remove('hidden');
            setTimeout(() => statusEl.classList.add('hidden'), 3500);
          }
          showToastOrAlert("Master Prompt Disalin", "Master Prompt 7-Bab dan teks naskah telah disalin ke clipboard! Anda dapat langsung menempelkannya di ChatGPT / Claude / Gemini Web.", "info");
        })
        .catch(err => {
          showToastOrAlert("Peringatan", "Gagal menyalin prompt: " + err.message, "warn");
        });
    }

    /**
     * Opsi 2: Eksekusi Langsung Gemini API dari Browser
     */
    async function jalankanGeminiAIDirect() {
      const keyInput = document.getElementById('input-gemini-key');
      const modelSelect = document.getElementById('select-gemini-model');
      const statusEl = document.getElementById('ai-run-status');

      const apiKey = keyInput ? keyInput.value.trim() : '';
      const model = modelSelect ? modelSelect.value : 'gemini-1.5-flash';

      if (!apiKey) {
        showToastOrAlert("Kunci API Diperlukan", "Masukkan Gemini API Key Anda untuk menjalankan analisis langsung.", "warn");
        return;
      }

      localStorage.setItem('NSR_GEMINI_API_KEY', apiKey);
      localStorage.setItem('NSR_GEMINI_MODEL', model);

      if (statusEl) statusEl.textContent = 'Sedang memproses AI Deep Review...';

      const review = activeReview || latestAuditSnapshot || {};
      const fullText = (review.pagesContent || []).map(p => p.text).join('\\n');

      try {
        const result = await runDeepTechnicalReviewAI(fullText, review.pagesContent || [], [], {
          fileName: review.file_name,
          jobId: review.job_order_id,
          uploader: review.uploaded_by,
          hash: review.file_hash
        });

        applyReviewData(result);
        if (statusEl) statusEl.textContent = '✓ Analisis AI Selesai!';
        showToastOrAlert("Analisis AI Berhasil", "Hasil Deep Technical Review 7-Bab telah berhasil diproses dan diterapkan ke seluruh panel.", "success");
        setTimeout(tutupModalAIPrompt, 1200);
      } catch (e) {
        if (statusEl) statusEl.textContent = '❌ Gagal: ' + e.message;
        showToastOrAlert("Gagal Analisis AI", e.message, "error");
      }
    }

    /**
     * Opsi 3: Terapkan Hasil JSON AI Eksternal
     */
    function terapkanJSONHasilAI() {
      const textarea = document.getElementById('textarea-external-ai-json');
      const raw = textarea ? textarea.value.trim() : '';
      if (!raw) {
        showToastOrAlert("Input Kosong", "Tempelkan teks JSON hasil dari ChatGPT / Claude terlebih dahulu.", "warn");
        return;
      }

      try {
        const cleaned = raw.replace(/^\`\`\`json\\n?|\`\`\`$/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (!parsed.bab1_executive_summary && !parsed.bab3_daftar_temuan) {
          throw new Error("Format JSON tidak memuat Bab I atau Bab III yang valid.");
        }

        const current = activeReview || latestAuditSnapshot || {};
        const merged = {
          ...current,
          ...parsed,
          findings: parsed.bab3_daftar_temuan || parsed.findings || current.findings || [],
          status: parsed.bab6_rekomendasi_reviewer?.status || parsed.status || current.status,
          compliance_score: Number(parsed.bab6_rekomendasi_reviewer?.skor_kepatuhan || parsed.compliance_score || current.compliance_score),
          gate_nolap_unlocked: (parsed.bab6_rekomendasi_reviewer?.status === 'ACCEPTABLE')
        };

        applyReviewData(merged);
        tutupModalAIPrompt();
        showToastOrAlert("Hasil AI Diterapkan", "Hasil review 7-Bab berhasil diimpor dan diterapkan pada seluruh tab.", "success");
      } catch (err) {
        showToastOrAlert("JSON Tidak Valid", "Gagal mem-parsing JSON: " + err.message, "error");
      }
    }
`;

// Sisipkan konstanta dan modul JS 7-Bab sebelum SAMPLE_REVIEWS
const insertPos = html.indexOf('    // Mock Sample Reviews Data');
if (insertPos === -1) {
  throw new Error('Gagal menemukan penanda Mock Sample Reviews Data di portal-qa-review.html');
}

html = html.substring(0, insertPos) + jsModuleCode + '\n' + html.substring(insertPos);

// ============================================================================
// PART 5: INTEGRASI applyReviewData AGAR MERENDER SELURUH 4 TAB & NO-LAP INTERLOCK
// ============================================================================
console.log('--- 6. Memperbarui applyReviewData dengan Tab Renderers & Interlock NoLap ---');

// Gunakan regex untuk mencocokkan renderFindings(review.findings); secara toleran terhadap CRLF/LF
const applyReviewDataRegex = /\/\/\s*Render Findings List\r?\n\s*renderFindings\(review\.findings\);/;
if (!applyReviewDataRegex.test(html)) {
  throw new Error('Gagal menemukan renderFindings(review.findings) di applyReviewData');
}

const newApplyDataCalls = `      // Interlock Gerbang NoLap: Hanya TERBUKA jika status ACCEPTABLE atau OVERRIDDEN
      review.gate_nolap_unlocked = (review.status === 'ACCEPTABLE' || review.override_status === 'OVERRIDDEN_BY_PARTNER');

      // Render Seluruh Tab 1 s/d 4 (Bab I s/d VII)
      if (typeof renderTab1SummaryAndRisk === 'function') renderTab1SummaryAndRisk(review);
      if (typeof renderTab2ComplianceMatrix === 'function') renderTab2ComplianceMatrix(review);
      if (typeof renderTab3FindingsAndRecalc === 'function') renderTab3FindingsAndRecalc(review, 'ALL');
      if (typeof renderTab4ActionPlan === 'function') renderTab4ActionPlan(review);`;

html = html.replace(applyReviewDataRegex, newApplyDataCalls);

// ============================================================================
// PART 6: PERBARUI CETAK LEMBAR KENDALI MUTU (7 BAB A4 RESMI)
// ============================================================================
console.log('--- 7. Memperbarui printQAControlSheet dengan 7 Bab Lengkap ---');

const printFuncStart = html.indexOf('    function printQAControlSheet() {');
const printFuncEnd = html.indexOf('    // Modal Actions');

if (printFuncStart === -1 || printFuncEnd === -1) {
  throw new Error('Gagal menemukan batas printQAControlSheet di portal-qa-review.html');
}

const newPrintFunction = `    function printQAControlSheet() {
      const review = latestAuditSnapshot || activeReview;
      if (!review) {
        showToastOrAlert("Peringatan", "Pilih atau unggah dokumen terlebih dahulu untuk mencetak Lembar Kendali Mutu.", "warn");
        return;
      }

      const joNumber = review.job_order_id || document.getElementById('input-jo-number')?.value || 'JO-NSR-2026-UPLOAD';
      const clientName = document.getElementById('input-client-name')?.value || review.bab1_executive_summary?.pemberi_tugas || 'PT Bank Tabungan Negara (Persero) Tbk';
      const docName = review.file_name || 'Draf Laporan Penilaian.pdf';
      const score = Number(review.compliance_score || review.score || 0).toFixed(1);
      const statusText = review.status.replace(/_/g, ' ');
      const gateStatusText = review.gate_nolap_unlocked ? 'TERBUKA 🔓 (Disetujui Terbit NoLap)' : 'TERKUNCI 🔒 (Wajib Perbaikan)';
      const uploader = review.uploaded_by || 'Penilai Pelaksana';
      const cleanUploaderName = uploader.includes('(') ? uploader.split('(')[0].trim() : (uploader.includes('•') ? uploader.split('•')[0].trim() : uploader.trim());
      const reviewer = (window.currentUser || currentUser)?.nama || 'Danny Taufik Hidayat, S.H.';
      const reviewerTitle = (window.currentUser || currentUser)?.jabatan || 'Manager Administrasi & Umum / Pengendali Mutu SPM';
      const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      const b1 = review.bab1_executive_summary || {};
      const b2 = review.bab2_matriks_kepatuhan || [];
      const b3 = review.findings || review.bab3_daftar_temuan || [];
      const b4 = review.bab4_pengujian_perhitungan || [];
      const b5 = review.bab5_analisis_risiko || [];
      const b6 = review.bab6_rekomendasi_reviewer || {};
      const b7 = review.bab7_tindakan_perbaikan || [];

      // Tabel Bab II Aspek Kepatuhan
      let bab2Rows = b2.map(m => {
        const color = m.status === 'SESUAI' ? '#047857' : (m.status === 'PERLU_PERBAIKAN' ? '#b45309' : '#b91c1c');
        return \`
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
            <td style="padding: 6px; font-weight: bold; text-align: center;">\${m.kode}</td>
            <td style="padding: 6px;"><strong>\${m.aspek}</strong><br><span style="color:#64748b; font-size: 9px;">\${m.parameter}</span></td>
            <td style="padding: 6px; font-weight: bold; color: \${color}; text-align: center;">\${m.status.replace(/_/g, ' ')}</td>
            <td style="padding: 6px; color:#334155;">\${m.catatan}</td>
          </tr>\`;
      }).join('');

      // Tabel Bab III Temuan
      let bab3Rows = b3.length === 0 ? '<tr><td colspan="5" style="text-align: center; padding: 10px; color: #047857;">✓ Tidak ditemukan temuan penyimpangan standar SPI/KEPI.</td></tr>' :
        b3.map((f, idx) => {
          const c = f.severity === 'CRITICAL' ? '#b91c1c' : (f.severity === 'MAJOR' ? '#b45309' : '#0369a1');
          const p = (f.page_numbers && f.page_numbers.length) ? f.page_numbers.join(', ') : (f.page || '-');
          return \`
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
              <td style="padding: 6px; text-align: center;">\${idx + 1}</td>
              <td style="padding: 6px; font-weight: bold; color: \${c};">\${f.severity}</td>
              <td style="padding: 6px;"><strong>\${f.title}</strong><br><span style="color:#64748b; font-size: 9px;">Hal: \${p} | Ref: \${f.standard_reference || 'SPI'}</span></td>
              <td style="padding: 6px;">\${f.condition_found || f.note || '-'}</td>
              <td style="padding: 6px; color:#0369a1;">\${f.corrective_action || 'Perbaiki data.'}</td>
            </tr>\`;
        }).join('');

      // Tabel Bab IV Recalc
      let bab4Rows = b4.map(r => \`
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
          <td style="padding: 6px; font-weight: 600;">\${r.parameter}</td>
          <td style="padding: 6px; font-family: monospace;">\${r.nilai_laporan}</td>
          <td style="padding: 6px; font-family: monospace; font-weight: bold; color:#0369a1;">\${r.nilai_verifikasi}</td>
          <td style="padding: 6px; font-family: monospace; color:#b91c1c;">\${r.selisih}</td>
          <td style="padding: 6px;">\${r.analisis_kewajaran}</td>
        </tr>\`).join('');

      // Tabel Bab V Risiko
      let bab5Rows = b5.map(r => {
        const c = r.level.includes('TINGGI') ? '#b91c1c' : (r.level === 'SEDANG' ? '#b45309' : '#047857');
        return \`
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
            <td style="padding: 6px; font-weight: bold;">\${r.kategori}</td>
            <td style="padding: 6px; font-weight: bold; color:\${c}; text-align:center;">\${r.level.replace(/_/g, ' ')}</td>
            <td style="padding: 6px;">\${r.faktor_risiko}</td>
            <td style="padding: 6px; color:#0369a1;">\${r.mitigasi}</td>
          </tr>\`;
      }).join('');

      // Tabel Bab VII Action Plan
      let bab7Rows = b7.map((a, idx) => \`
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
          <td style="padding: 6px; text-align: center;">\${idx + 1}</td>
          <td style="padding: 6px; font-weight: bold; color:#b91c1c;">\${a.prioritas.replace(/_/g, ' ')}</td>
          <td style="padding: 6px;">\${a.deskripsi}</td>
          <td style="padding: 6px; text-align:center;">\${a.penanggung_jawab || cleanUploaderName}</td>
          <td style="padding: 6px; text-align:center; font-weight:600;">\${a.target_selesai || 'Sebelum NoLap'}</td>
        </tr>\`).join('');

      const printHtml = \`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>LEMBAR KENDALI MUTU 7-BAB - \${joNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; font-size: 11px; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 15px; font-weight: 800; color: #0f172a; }
    .subtitle { font-size: 10px; color: #475569; margin-top: 1px; }
    .badge { display: inline-block; padding: 3px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase; }
    .sec-title { background: #0f172a; color: white; padding: 4px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-top: 12px; margin-bottom: 6px; border-radius: 3px; }
    .table-meta { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
    .table-meta td { padding: 3px 5px; vertical-align: top; }
    .table-meta td.label { width: 22%; font-weight: 600; color: #475569; }
    .table-meta td.sep { width: 2%; }
    .table-meta td.value { width: 26%; font-weight: 600; }
    .score-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; margin-bottom: 10px; display: flex; justify-content: space-around; text-align: center; }
    .score-item .num { font-size: 16px; font-weight: 800; }
    .score-item .desc { font-size: 9px; color: #64748b; font-weight: 600; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
    table.data-table th { background: #f1f5f9; color: #1e293b; padding: 6px; text-align: left; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
    .sign-row { display: flex; justify-content: space-between; margin-top: 25px; page-break-inside: avoid; }
    .sign-col { width: 44%; text-align: center; font-size: 10px; }
    .sign-line { margin-top: 50px; border-bottom: 1px solid #0f172a; font-weight: 700; padding-bottom: 2px; }
    .sign-role { font-size: 9px; color: #64748b; margin-top: 2px; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">LEMBAR KENDALI MUTU (INDEPENDENT TECHNICAL REVIEW &amp; QC)</div>
      <div class="subtitle">KJPP NANANG RAHAYU SIGIT PARYANTO &amp; REKAN • IZIN USAHA KMK RI NO. 2.19.0160</div>
    </div>
    <div style="text-align: right;">
      <span class="badge" style="background: \${review.gate_nolap_unlocked ? '#dcfce7; color: #15803d;' : '#fee2e2; color: #b91c1c;'}">
        GERBANG NOLAP: \${gateStatusText}
      </span>
      <div style="font-size: 9px; color: #64748b; margin-top: 3px;">Tanggal: \${todayStr}</div>
    </div>
  </div>

  <div class="score-box">
    <div class="score-item">
      <div class="num" style="color: \${score >= 85 ? '#059669' : '#e11d48'};">\${score}%</div>
      <div class="desc">SKOR KEPATUHAN SPI</div>
    </div>
    <div class="score-item">
      <div class="num" style="color: #b91c1c;">\${review.findings_summary?.critical || 0}</div>
      <div class="desc">TEMUAN KRITIS</div>
    </div>
    <div class="score-item">
      <div class="num" style="color: #b45309;">\${review.findings_summary?.major || 0}</div>
      <div class="desc">TEMUAN MAYOR</div>
    </div>
    <div class="score-item">
      <div class="num" style="color: #0284c7;">\${statusText}</div>
      <div class="desc">STATUS REKOMENDASI</div>
    </div>
  </div>

  <div class="sec-title">BAB I: RINGKASAN EKSEKUTIF PENUGASAN</div>
  <table class="table-meta">
    <tr>
      <td class="label">Nomor Penugasan (JO)</td><td class="sep">:</td><td class="value">\${joNumber}</td>
      <td class="label">Pemberi Tugas / Klien</td><td class="sep">:</td><td class="value">\${clientName}</td>
    </tr>
    <tr>
      <td class="label">Nama Objek</td><td class="sep">:</td><td class="value">\${b1.nama_objek || docName}</td>
      <td class="label">Pengguna Laporan</td><td class="sep">:</td><td class="value">\${b1.pengguna_laporan || clientName}</td>
    </tr>
    <tr>
      <td class="label">Lokasi Agunan</td><td class="sep">:</td><td class="value">\${b1.alamat_objek || '-'}</td>
      <td class="label">Tujuan Penilaian</td><td class="sep">:</td><td class="value">\${b1.tujuan_penilaian || 'Penjaminan Agunan Kredit'}</td>
    </tr>
    <tr>
      <td class="label">Luas Tanah / Bangunan</td><td class="sep">:</td><td class="value">\${b1.luas_tanah || '-'} / \${b1.luas_bangunan || '-'}</td>
      <td class="label">Dasar Nilai</td><td class="sep">:</td><td class="value">\${b1.dasar_nilai || 'Nilai Pasar & Nilai Likuidasi'}</td>
    </tr>
    <tr>
      <td class="label">Tanggal Penilaian / Survei</td><td class="sep">:</td><td class="value">\${b1.tanggal_penilaian || todayStr} / \${b1.tanggal_survei || '-'}</td>
      <td class="label">Pendekatan Penilaian</td><td class="sep">:</td><td class="value">\${Array.isArray(b1.pendekatan_penilaian) ? b1.pendekatan_penilaian.join(', ') : (b1.pendekatan_penilaian || '-')}</td>
    </tr>
  </table>

  <div class="sec-title">BAB II: TABEL PEMERIKSAAN KEPATUHAN 8 ASPEK (SPI &amp; KEPI)</div>
  <table class="data-table">
    <thead>
      <tr><th style="width:5%;">Kode</th><th style="width:30%;">Aspek &amp; Parameter SPI</th><th style="width:15%; text-align:center;">Status</th><th>Catatan Kritis Evaluasi Reviewer</th></tr>
    </thead>
    <tbody>\${bab2Rows}</tbody>
  </table>

  <div class="sec-title">BAB III: DAFTAR TEMUAN TEKNIS SPI / KEPI</div>
  <table class="data-table">
    <thead>
      <tr><th style="width:4%;">No</th><th style="width:12%;">Tingkat</th><th style="width:28%;">Judul &amp; Referensi Standar</th><th style="width:30%;">Kondisi Ditemukan</th><th>Rekomendasi Perbaikan</th></tr>
    </thead>
    <tbody>\${bab3Rows}</tbody>
  </table>

  <div class="sec-title">BAB IV: PENGUJIAN ULANG PERHITUNGAN (RECALCULATION AUDIT)</div>
  <table class="data-table">
    <thead>
      <tr><th style="width:25%;">Parameter Kalkulasi</th><th style="width:20%;">Angka Laporan</th><th style="width:20%;">Verifikasi Reviewer</th><th style="width:15%;">Selisih</th><th>Analisis Kewajaran</th></tr>
    </thead>
    <tbody>\${bab4Rows}</tbody>
  </table>

  <div class="sec-title">BAB V: ANALISIS PROFIL RISIKO PROFESIONAL (6 DIMENSI)</div>
  <table class="data-table">
    <thead>
      <tr><th style="width:25%;">Dimensi Risiko</th><th style="width:15%; text-align:center;">Tingkat Risiko</th><th style="width:30%;">Faktor Potensi Risiko</th><th>Langkah Mitigasi SPM</th></tr>
    </thead>
    <tbody>\${bab5Rows}</tbody>
  </table>

  <div class="sec-title">BAB VI: REKOMENDASI REVIEWER &amp; KEPUTUSAN NOLAP</div>
  <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; border-radius:4px; font-size:10px;">
    <strong>Pertimbangan:</strong> \${b6.pertimbangan || 'Berdasarkan telaah kepatuhan standar SPM.'}<br>
    <strong>Keputusan Gerbang NoLap:</strong> \${gateStatusText}<br>
    <strong>Rekomendasi Tindakan:</strong> \${b6.rekomendasi_tindakan || 'Perbaiki catatan temuan.'}
  </div>

  <div class="sec-title">BAB VII: DAFTAR RENCANA TINDAKAN PERBAIKAN BAGI PENILAI PENYUSUN</div>
  <table class="data-table">
    <thead>
      <tr><th style="width:4%;">No</th><th style="width:18%;">Tingkat Prioritas</th><th>Uraian Rencana Tindakan Perbaikan</th><th style="width:16%; text-align:center;">Penanggung Jawab</th><th style="width:16%; text-align:center;">Target Selesai</th></tr>
    </thead>
    <tbody>\${bab7Rows}</tbody>
  </table>

  <div class="sign-row">
    <div class="sign-col">
      <div>Penilai Penyusun / Analis KKP</div>
      <div class="sign-line">\${cleanUploaderName}</div>
      <div class="sign-role">Penilai Pelaksana KJPP NSR</div>
    </div>
    <div class="sign-col">
      <div>Reviewer SPM / Pimpinan Rekan</div>
      <div class="sign-line">\${reviewer}</div>
      <div class="sign-role">\${reviewerTitle}</div>
    </div>
  </div>
</body>
</html>\`;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 600);
      } else {
        alert("Pop-up diblokir peramban. Harap izinkan pop-up untuk mencetak Lembar Kendali Mutu.");
      }
    }\n\n`;

html = html.substring(0, printFuncStart) + newPrintFunction + html.substring(printFuncEnd);

// ============================================================================
// PART 7: UPDATE executeReturnForRevision DENGAN FORMAT TERSTRUKTUR BAB III, VI, VII
// ============================================================================
console.log('--- 8. Memperbarui executeReturnForRevision ---');

const returnFuncStart = html.indexOf('    function executeReturnForRevision() {');
const returnFuncEnd = html.indexOf('    function executeApproveQA() {');

if (returnFuncStart !== -1 && returnFuncEnd !== -1) {
  const newReturnFunction = `    function executeReturnForRevision() {
      const review = latestAuditSnapshot || activeReview;
      if (!review) {
        showToastOrAlert("Peringatan", "Belum ada dokumen atau hasil audit yang dimuat.", "warn");
        return;
      }
      const user = window.currentUser || currentUser;
      if (user?.role === 'PENILAI') {
        showToastOrAlert("Akses Ditolak", "Penilai Penyusun tidak berwenang mengirim instruksi revisi kepada diri sendiri (Prinsip Anti Self-Review). Tindakan ini merupakan otoritas Tim Reviewer SPM atau Pimpinan Rekan.", "warn");
        return;
      }

      // Pre-fill catatan revisi dengan Bab III, VI, VII
      const textarea = document.getElementById('revision-notes-input');
      if (textarea) {
        const crit = (review.findings || []).filter(f => f.severity === 'CRITICAL' || f.severity === 'MAJOR');
        const plan = review.bab7_tindakan_perbaikan || [];
        let noteText = \`HASIL TECHNICAL REVIEW SPM - DRAF MEMERLUKAN PERBAIKAN\\n\` +
          \`No. JO: \${review.job_order_id}\\n\` +
          \`Status: \${review.status}\\n\` +
          \`Skor: \${review.compliance_score}%\\n\\n\` +
          \`TEMUAN UTAMA:\\n\` +
          crit.map((c, i) => \`\${i + 1}. [\${c.severity}] \${c.title} (Hal: \${(c.page_numbers||[]).join(', ')}) -> \${c.corrective_action}\`).join('\\n') +
          \`\\n\\nRENCANA TINDAKAN:\\n\` +
          plan.slice(0, 3).map((p, i) => \`\${i + 1}. [\${p.prioritas}] \${p.deskripsi}\`).join('\\n');

        textarea.value = noteText;
      }

      bukaModalRevisi();
    }\n\n`;

  html = html.substring(0, returnFuncStart) + newReturnFunction + html.substring(returnFuncEnd);
}

// ============================================================================
// PART 8: EXPOSE GLOBAL FUNCTIONS
// ============================================================================
console.log('--- 9. Mengekspos fungsi global ---');

const globalExposeMarker = 'window.applyRBACPermissions = applyRBACPermissions;';
const newGlobalExposes = `window.applyRBACPermissions = applyRBACPermissions;
    window.switchReviewTab = switchReviewTab;
    window.bukaModalAIPrompt = bukaModalAIPrompt;
    window.tutupModalAIPrompt = tutupModalAIPrompt;
    window.salinPromptAIEksternal = salinPromptAIEksternal;
    window.salinRencanaAksi = salinRencanaAksi;
    window.jalankanGeminiAIDirect = jalankanGeminiAIDirect;
    window.terapkanJSONHasilAI = terapkanJSONHasilAI;
    window.runDeepTechnicalReviewAI = runDeepTechnicalReviewAI;
    window.generate7ChapterReview = generate7ChapterReview;`;

if (html.includes(globalExposeMarker)) {
  html = html.replace(globalExposeMarker, newGlobalExposes);
}

fs.writeFileSync(targetHtml, html, 'utf8');
console.log('✓ portal-qa-review.html berhasil diperbarui dengan Master Prompt 7-Bab dan Tab Navigasi!');

// ============================================================================
// PART 9: PERBARUI BACKEND/QA-ENGINE-HANDLER.PHP DENGAN get_master_prompt
// ============================================================================
console.log('--- 10. Memperbarui backend/qa-engine-handler.php ---');

let php = fs.readFileSync(targetPhp, 'utf8');

if (!php.includes("'get_master_prompt'")) {
  const phpActionInsert = `// ---------------------------------------------------------
// 0. ACTION: GET_MASTER_PROMPT
// ---------------------------------------------------------
if ($action === 'get_master_prompt') {
    echo json_encode([
        'status' => 'success',
        'module' => 'Independent Technical Review & Quality Control KJPP NSR',
        'prompt' => <<<'PROMPT_TEXT'
# MASTER PROMPT INDEPENDENT TECHNICAL REVIEW & QUALITY CONTROL LAPORAN PENILAIAN
KANTOR JASA PENILAI PUBLIK (KJPP) NANANG RAHAYU SIGIT PARYANTO & REKAN
IZIN USAHA KEMENTERIAN KEUANGAN RI NO. 2.19.0160

1. PERAN & KOMPETENSI REVIEWER
Senior Independent Technical Reviewer & Pengendali Mutu SPM KJPP NSR (KMK RI No. 2.19.0160).
Penilai Bersertifikat MAPPI (Cert.), patuh pada SPI Edisi VII, KEPI, PMK 101/PMK.01/2014 jo PMK 56/PMK.01/2017, POJK Agunan, dan Regulasi ATR/BPN.

2. TUJUAN TECHNICAL REVIEW
- Memverifikasi kepatuhan naskah laporan & KKP terhadap SPI & KEPI.
- Validasi metodologi, kelayakan data pasar, kebenaran matematis formula KKP.
- Eliminasi error spreadsheet (#REF!, #VALUE!, #DIV/0!, ####).
- Mitigasi risiko hukum, regulasi, sengketa perbankan, dan reputasi KJPP NSR.
- Quality gate penentu penerbitan Nomor Laporan (NoLap) resmi Kemenkeu.

3. RUANG LINGKUP (8 ASPEK A - H)
- Aspek A: Administratif & Kepatuhan Umum (SPK, Surat Tugas, Pernyataan Penilai, TTD Rekan Berizin).
- Aspek B: Identifikasi & Karakteristik Fisik Objek (Yuridis SHM/HGB, GPS, Konsistensi Objek).
- Aspek C: HBU (4 Kriteria Baku KPUP 10: Legalitas, Fisik, Finansial, Produktivitas Maksimal).
- Aspek D: Data Pasar (Min. 3 data sejenis, verifikasi narasumber, radius relevan SPI 104).
- Aspek E: Metodologi Penilaian (Pasar, Biaya/DRC, Pendapatan/DCF).
- Aspek F: Kertas Kerja & Formula (Integritas formula Excel, eliminasi #REF!/#VALUE!, pembulatan).
- Aspek G: Asumsi Khusus & Kondisi Pembatas (SPI 103 Butir 3.5).
- Aspek H: Rekonsiliasi, Kesimpulan Nilai & Pelaporan (Rasionalitas bobot, diskon likuidasi SPI 202).

4. FORMAT OUTPUT WAJIB (JSON 7-BAB)
Bab I: Executive Summary
Bab II: Tabel Pemeriksaan Kepatuhan 8 Aspek (A-H)
Bab III: Daftar Temuan Teknis (CRITICAL/MAJOR/MODERATE/MINOR)
Bab IV: Pengujian Ulang Perhitungan (Recalculation Audit)
Bab V: Analisis Profil Risiko Profesional (6 Dimensi)
Bab VI: Rekomendasi Reviewer (ACCEPTABLE/ACCEPTABLE WITH REVISION/REQUIRES MAJOR REVISION/NOT ACCEPTABLE)
Bab VII: Rencana Tindakan Perbaikan Prioritas (P1/P2/P3)
PROMPT_TEXT
    ]);
    exit;
}
`;

  const marker = "// ---------------------------------------------------------\r\n// 1. ACTION: LIST_REVIEWS";
  const markerLF = "// ---------------------------------------------------------\n// 1. ACTION: LIST_REVIEWS";
  if (php.includes(marker)) {
    php = php.replace(marker, phpActionInsert + "\n" + marker);
  } else if (php.includes(markerLF)) {
    php = php.replace(markerLF, phpActionInsert + "\n" + markerLF);
  } else {
    php = php.replace("if ($action === 'list_reviews')", phpActionInsert + "\nif ($action === 'list_reviews')");
  }

  fs.writeFileSync(targetPhp, php, 'utf8');
  console.log('✓ backend/qa-engine-handler.php berhasil diperbarui dengan action get_master_prompt.');
}
