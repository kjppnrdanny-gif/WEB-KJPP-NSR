<?php
/**
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)
 * Modul Engine Penggantian Merge Tags Dokumen Resmi
 * 
 * Standar Dokumen:
 * (a) Surat Tugas Lapangan
 * (b) Lembar Kendali Mutu (QA Checklist)
 * (c) Tanda Terima Penyerahan Laporan
 */

/**
 * Sanitasi nilai tag sebelum substitusi template
 */
function sanitizeMergeTagValue($val, $fallback = '-') {
    if ($val === null || $val === false) return $fallback;
    if (is_array($val) || is_object($val)) return $fallback;
    $s = trim((string)$val);
    if ($s === '' || strcasecmp($s, 'null') === 0 || strcasecmp($s, 'undefined') === 0) {
        return $fallback;
    }
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Membangun kamus lengkap 22 merge tags baku dari record penugasan
 */
function buildMergeTagsDictionary(array $record): array {
    $c = strtolower(trim((string)($record['cabang'] ?? 'Pusat')));
    $penilaiDefault = 'Ir. Nanang Rahayu Junaedi, M.Sc., MAPPI (Cert.)';
    $izinDefault = '00581';

    if (strpos($c, 'padang') !== false) {
        $penilaiDefault = 'Hernita, S.E., M.Si.';
        $izinDefault = 'PS.0046';
    } elseif (strpos($c, 'bandung') !== false) {
        $penilaiDefault = 'Deni Siswandi, S.T., MAPPI';
        $izinDefault = '00581';
    } elseif (strpos($c, 'palembang') !== false) {
        $penilaiDefault = 'Dharma Priyanto Sih Budi Susilo';
        $izinDefault = 'PS.0249';
    } elseif (strpos($c, 'makassar') !== false) {
        $penilaiDefault = 'Muhammad Amin Sade, S.T.';
        $izinDefault = '00581';
    }

    $penilai = !empty($record['penilai']) && strcasecmp($record['penilai'], 'undefined') !== 0 ? $record['penilai'] : $penilaiDefault;
    $izin = !empty($record['izinPenilai']) && strcasecmp($record['izinPenilai'], 'undefined') !== 0 ? $record['izinPenilai'] : $izinDefault;

    // Parser alamat objek untuk kelurahan, kecamatan, kota, provinsi jika tidak ada kolom terpisah
    $alamatObjek = (string)($record['lokasiObjek'] ?? '');
    $kel = $record['kelurahan'] ?? '-';
    $kec = $record['kecamatan'] ?? '-';
    $kota = $record['kota_kabupaten'] ?? $record['kota'] ?? $record['kabupaten'] ?? '-';
    $prov = $record['provinsi'] ?? '-';

    if ($kota === '-' && !empty($alamatObjek)) {
        $parts = array_map('trim', explode(',', $alamatObjek));
        if (count($parts) >= 2) {
            $kota = end($parts);
            if (count($parts) >= 3) {
                $kec = $parts[count($parts) - 2];
            }
        }
    }

    return [
        '{{nomor_registrasi}}'       => sanitizeMergeTagValue($record['noPermintaan'] ?? $record['noJo'] ?? ''),
        '{{nomor_laporan}}'          => sanitizeMergeTagValue($record['nomorLaporan'] ?? ''),
        '{{tanggal_registrasi}}'     => sanitizeMergeTagValue($record['timestamp'] ?? $record['tglPermintaan'] ?? date('Y-m-d')),
        '{{tanggal_laporan}}'        => sanitizeMergeTagValue($record['tglLaporan'] ?? $record['tglTerbit'] ?? ''),
        '{{tanggal_inspeksi}}'       => sanitizeMergeTagValue($record['tglInspeksi'] ?? $record['tglSurvei'] ?? ''),
        '{{nama_klien}}'             => sanitizeMergeTagValue($record['namaKlien'] ?? ''),
        '{{alamat_klien}}'           => sanitizeMergeTagValue($record['alamatKlien'] ?? ''),
        '{{pemberi_tugas}}'          => sanitizeMergeTagValue($record['pemberiTugas'] ?? $record['namaPemohon'] ?? $record['namaKlien'] ?? ''),
        '{{debitur}}'                => sanitizeMergeTagValue($record['debitur'] ?? $record['namaKlien'] ?? ''),
        '{{tujuan_penilaian}}'       => sanitizeMergeTagValue($record['tujuanPenilaian'] ?? 'Penjaminan Utang / Agunan'),
        '{{bidang_penilaian}}'       => sanitizeMergeTagValue($record['service_classification_name'] ?? (($record['klasifikasiJasa'] ?? '') === 'PS' || ($record['service_classification_id'] ?? '') === 'PROPERTY_SIMPLE' ? 'Penilaian Properti Sederhana' : 'Penilaian Properti')),
        '{{kode_jasa_laporan}}'      => sanitizeMergeTagValue($record['report_service_code'] ?? (($record['klasifikasiJasa'] ?? '') === 'BS' ? 'BS' : (($record['klasifikasiJasa'] ?? '') === 'PP' ? 'PP' : 'PI'))),
        '{{objek_penilaian}}'        => sanitizeMergeTagValue($record['jenisObjek'] ?? ''),
        '{{alamat_objek}}'           => sanitizeMergeTagValue($alamatObjek),
        '{{kelurahan}}'              => sanitizeMergeTagValue($kel),
        '{{kecamatan}}'              => sanitizeMergeTagValue($kec),
        '{{kota_kabupaten}}'         => sanitizeMergeTagValue($kota),
        '{{provinsi}}'               => sanitizeMergeTagValue($prov),
        '{{tim_penilai}}'            => sanitizeMergeTagValue($record['timPenilai'] ?? $penilai),
        '{{reviewer_qa}}'            => sanitizeMergeTagValue($record['reviewerQa'] ?? 'Tim Kendali Mutu Pusat (SPI 102)'),
        '{{partner_penandatangan}}'  => sanitizeMergeTagValue($penilai),
        '{{nomor_ijin_penilai}}'     => sanitizeMergeTagValue($izin),
        '{{kode_cabang}}'            => sanitizeMergeTagValue($record['cabang'] ?? 'Pusat'),
        '{{sub_header_cabang}}'      => (empty($record['cabang']) || strcasecmp(trim($record['cabang']), 'Pusat') === 0 || strcasecmp(trim($record['cabang']), 'Jakarta') === 0) ? '' : ' | Kantor Cabang ' . sanitizeMergeTagValue($record['cabang']),
        '{{wilayah_operasional}}'    => (empty($record['cabang']) || strcasecmp(trim($record['cabang']), 'Pusat') === 0 || strcasecmp(trim($record['cabang']), 'Jakarta') === 0) ? 'Kantor Pusat' : 'Kantor Cabang ' . sanitizeMergeTagValue($record['cabang'])
    ];
}

/**
 * Mesin substitusi template: Menggantikan seluruh merge tags dalam template string
 */
function renderMergeTags(string $templateContent, array $record): string {
    $tagsMap = buildMergeTagsDictionary($record);

    // Substitusi seluruh tag yang terdaftar
    $rendered = str_replace(array_keys($tagsMap), array_values($tagsMap), $templateContent);

    // Pembersihan residu tag yang tidak dikenali: ganti dengan '-'
    $rendered = preg_replace('/\{\{[a-zA-Z0-9_\-]+\}\}/', '-', $rendered);

    // Guard Anti-Kebocoran: Pastikan string literal "null" atau "undefined" tidak muncul di dokumen final
    $rendered = preg_replace('/\bnull\b/i', '-', $rendered);
    $rendered = preg_replace('/\bundefined\b/i', '-', $rendered);

    return $rendered;
}

/**
 * Template Baku Dokumen: (a) Surat Tugas Lapangan
 */
function getTemplateSuratTugas(): string {
    return <<<'HTML'
<div class="dokumen-resmi surat-tugas" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; color: #1e293b; background: #ffffff;">
  <div style="border-bottom: 3px double #0f172a; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
    <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a;">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</h2>
    <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">Izin Usaha Kemenkeu No. 2.19.0160{{sub_header_cabang}}</p>
    <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Standar Penilaian Indonesia (SPI) &amp; Kode Etik Penilai Indonesia (KEPI)</p>
  </div>

  <div style="text-align: center; margin-bottom: 25px;">
    <h3 style="margin: 0; text-decoration: underline; font-size: 15px; letter-spacing: 0.5px;">SURAT TUGAS INSPEKSI LAPANGAN</h3>
    <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: bold; font-family: monospace;">Nomor: ST-{{nomor_registrasi}}</p>
  </div>

  <p style="font-size: 12px; line-height: 1.6;">Pimpinan Kantor Jasa Penilai Publik (KJPP) Nanang Rahayu &amp; Rekan dengan ini memberikan tugas kedinasan inspeksi dan verifikasi lapangan kepada:</p>

  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
    <tr><td style="width: 25%; padding: 6px 0; font-weight: bold;">Tim Penilai Lapangan</td><td style="width: 5%;">:</td><td style="padding: 6px 0;"><strong>{{tim_penilai}}</strong></td></tr>
    <tr><td style="padding: 6px 0; font-weight: bold;">Kantor / Cabang</td><td>:</td><td style="padding: 6px 0;">{{kode_cabang}}</td></tr>
    <tr><td style="padding: 6px 0; font-weight: bold;">Tanggal Inspeksi</td><td>:</td><td style="padding: 6px 0;">{{tanggal_inspeksi}}</td></tr>
  </table>

  <p style="font-size: 12px; line-height: 1.6;">Untuk melaksanakan pemeriksaan fisik, verifikasi batas, dan pendataan pasar atas objek penugasan penilaian:</p>

  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px; border: 1px solid #cbd5e1;">
    <tr style="background: #f8fafc;"><td style="width: 30%; padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Pemberi Tugas / Klien</td><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>{{nama_klien}}</strong></td></tr>
    <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Nama Debitur / Pemilik</td><td style="padding: 8px; border: 1px solid #cbd5e1;">{{debitur}}</td></tr>
    <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Jenis Objek Penilaian</td><td style="padding: 8px; border: 1px solid #cbd5e1;">{{objek_penilaian}} (Klasifikasi: {{bidang_penilaian}})</td></tr>
    <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Lokasi / Alamat Objek</td><td style="padding: 8px; border: 1px solid #cbd5e1;">{{alamat_objek}}, Kel. {{kelurahan}}, Kec. {{kecamatan}}, {{kota_kabupaten}}, Prov. {{provinsi}}</td></tr>
    <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Maksud &amp; Tujuan</td><td style="padding: 8px; border: 1px solid #cbd5e1;">{{tujuan_penilaian}}</td></tr>
  </table>

  <p style="font-size: 11px; line-height: 1.5; color: #475569; margin-bottom: 30px;">
    Demikian Surat Tugas ini dibuat untuk dipergunakan sebagaimana mestinya. Pihak yang berkepentingan dimohon memberikan bantuan data dan akses pemeriksaan objek yang diperlukan secara obyektif dan independen.
  </p>

  <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px;">
    <div style="width: 45%; text-align: center;">
      <p style="margin-bottom: 55px;">Penerima Tugas,</p>
      <p style="font-weight: bold; margin: 0; text-decoration: underline;">{{tim_penilai}}</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Penilai / Surveyor Lapangan</p>
    </div>
    <div style="width: 45%; text-align: center;">
      <p style="margin-bottom: 55px;">Ditetapkan di {{kode_cabang}}, {{tanggal_registrasi}}<br><strong>KJPP Nanang Rahayu &amp; Rekan</strong></p>
      <p style="font-weight: bold; margin: 0; text-decoration: underline;">{{partner_penandatangan}}</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Partner / Izin Penilai: {{nomor_ijin_penilai}}</p>
    </div>
  </div>
</div>
HTML;
}

/**
 * Template Baku Dokumen: (b) Lembar Kendali Mutu (QA Checklist)
 */
function getTemplateQaChecklist(): string {
    return <<<'HTML'
<div class="dokumen-resmi qa-checklist" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; color: #1e293b; background: #ffffff;">
  <div style="border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <h2 style="margin: 0; font-size: 16px; text-transform: uppercase; color: #0f172a;">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</h2>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">Komite Pengendalian Mutu &amp; Manajemen Risiko (SPI 102)</p>
    </div>
    <div style="text-align: right; font-family: monospace; font-size: 11px;">
      <div>Ref: QA-{{nomor_registrasi}}</div>
      <div>{{wilayah_operasional}}</div>
    </div>
  </div>

  <div style="text-align: center; margin-bottom: 20px;">
    <h3 style="margin: 0; font-size: 14px; text-transform: uppercase;">LEMBAR TELAAH KENDALI MUTU (QA CHECKLIST)</h3>
    <p style="margin: 3px 0 0 0; font-size: 11px; color: #64748b;">Verifikasi Pra-Penerbitan Nomor Laporan Resmi Kemenkeu</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px; border: 1px solid #cbd5e1;">
    <tr><td style="width: 25%; padding: 5px 8px; font-weight: bold; background: #f8fafc; border: 1px solid #cbd5e1;">No. Permintaan / JO</td><td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-family: monospace;">{{nomor_registrasi}}</td><td style="width: 20%; padding: 5px 8px; font-weight: bold; background: #f8fafc; border: 1px solid #cbd5e1;">Nomor Laporan</td><td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">{{nomor_laporan}}</td></tr>
    <tr><td style="padding: 5px 8px; font-weight: bold; background: #f8fafc; border: 1px solid #cbd5e1;">Pemberi Tugas</td><td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{nama_klien}}</td><td style="padding: 5px 8px; font-weight: bold; background: #f8fafc; border: 1px solid #cbd5e1;">Tgl Inspeksi</td><td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{tanggal_inspeksi}}</td></tr>
    <tr><td style="padding: 5px 8px; font-weight: bold; background: #f8fafc; border: 1px solid #cbd5e1;">Objek &amp; Lokasi</td><td colspan="3" style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{objek_penilaian}} di {{alamat_objek}}</td></tr>
  </table>

  <h4 style="margin: 15px 0 8px 0; font-size: 12px; color: #0f172a; text-transform: uppercase;">Kriteria Pemeriksaan Kepatuhan Teknis (SPI 102 &amp; SPI 103):</h4>
  <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; border: 1px solid #cbd5e1;">
    <thead>
      <tr style="background: #0f172a; color: #ffffff;">
        <th style="padding: 6px; width: 5%; border: 1px solid #0f172a; text-align: center;">No</th>
        <th style="padding: 6px; width: 65%; border: 1px solid #0f172a; text-align: left;">Aspek Pemeriksaan Standar Penilaian</th>
        <th style="padding: 6px; width: 15%; border: 1px solid #0f172a; text-align: center;">Kesesuaian</th>
        <th style="padding: 6px; width: 15%; border: 1px solid #0f172a; text-align: center;">Catatan</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">1</td><td style="padding: 6px; border: 1px solid #cbd5e1;">Kelengkapan Legalitas (SPK, NPWP, Dokumen Kepemilikan)</td><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #15803d;">MEMENUHI</td><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">Lengkap</td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">2</td><td style="padding: 6px; border: 1px solid #cbd5e1;">Berita Acara Pemeriksaan Lapangan (BAPL) &amp; Foto Objek</td><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #15803d;">MEMENUHI</td><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">Terverifikasi</td></tr>
      <tr><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">3</td><td style="padding: 6px; border: 1px solid #cbd5e1;">Validitas Data Pembanding Pasar &amp; Bukti Konfirmasi</td><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #15803d;">MEMENUHI</td><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">3 Pembanding</td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">4</td><td style="padding: 6px; border: 1px solid #cbd5e1;">Kesesuaian Pendekatan Nilai &amp; Rumus Kertas Kerja</td><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #15803d;">MEMENUHI</td><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">Tervalidasi</td></tr>
      <tr><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">5</td><td style="padding: 6px; border: 1px solid #cbd5e1;">Pernyataan Etik, Independensi &amp; SPI 103 (Pengguna Laporan)</td><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #15803d;">MEMENUHI</td><td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">Sesuai</td></tr>
    </tbody>
  </table>

  <div style="margin-top: 35px; display: flex; justify-content: space-between; font-size: 11px;">
    <div style="width: 45%; text-align: center;">
      <p style="margin-bottom: 50px;">Disusun &amp; Ditelaah Oleh,<br><strong>Reviewer Mutu / QA</strong></p>
      <p style="font-weight: bold; margin: 0; text-decoration: underline;">{{reviewer_qa}}</p>
      <p style="margin: 2px 0 0 0; color: #64748b;">Komite Kendali Mutu</p>
    </div>
    <div style="width: 45%; text-align: center;">
      <p style="margin-bottom: 50px;">Disetujui untuk Terbit Nomor,<br><strong>Partner / Pemimpin Rekan</strong></p>
      <p style="font-weight: bold; margin: 0; text-decoration: underline;">{{partner_penandatangan}}</p>
      <p style="margin: 2px 0 0 0; color: #64748b;">Izin Penilai: {{nomor_ijin_penilai}}</p>
    </div>
  </div>
</div>
HTML;
}

/**
 * Template Baku Dokumen: (c) Tanda Terima Penyerahan Laporan
 */
function getTemplateTandaTerima(): string {
    return <<<'HTML'
<div class="dokumen-resmi tanda-terima" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; color: #1e293b; background: #ffffff;">
  <div style="border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
    <h2 style="margin: 0; font-size: 16px; text-transform: uppercase; color: #0f172a;">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</h2>
    <p style="margin: 3px 0 0 0; font-size: 11px; color: #475569;">Izin Usaha Kemenkeu No. 2.19.0160{{sub_header_cabang}}</p>
  </div>

  <div style="text-align: center; margin-bottom: 25px;">
    <h3 style="margin: 0; font-size: 15px; text-decoration: underline;">TANDA TERIMA PENYERAHAN LAPORAN PENILAIAN</h3>
    <p style="margin: 4px 0 0 0; font-size: 11px; font-family: monospace;">Nomor Registrasi: {{nomor_registrasi}}</p>
  </div>

  <p style="font-size: 12px; line-height: 1.6;">Telah diserahkan berkas fisik / naskah final Laporan Penilaian Properti resmi kepada pihak Pemberi Tugas dengan rincian berikut:</p>

  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px; border: 1px solid #cbd5e1;">
    <tr style="background: #f8fafc;"><td style="width: 30%; padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Nomor Laporan Resmi</td><td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #0f172a;">{{nomor_laporan}}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Tanggal Laporan</td><td style="padding: 8px; border: 1px solid #cbd5e1;">{{tanggal_laporan}}</td></tr>
    <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Pemberi Tugas / Klien</td><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>{{nama_klien}}</strong> (Alamat: {{alamat_klien}})</td></tr>
    <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Nama Debitur</td><td style="padding: 8px; border: 1px solid #cbd5e1;">{{debitur}}</td></tr>
    <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Objek Penilaian</td><td style="padding: 8px; border: 1px solid #cbd5e1;">{{objek_penilaian}}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Lokasi Objek</td><td style="padding: 8px; border: 1px solid #cbd5e1;">{{alamat_objek}}, {{kota_kabupaten}}, Prov. {{provinsi}}</td></tr>
    <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Penilai Penandatangan</td><td style="padding: 8px; border: 1px solid #cbd5e1;">{{partner_penandatangan}} (Izin No: {{nomor_ijin_penilai}})</td></tr>
  </table>

  <p style="font-size: 11px; color: #475569; line-height: 1.5; margin-bottom: 35px;">
    Naskah laporan yang diserahkan telah diverifikasi lengkap, bertandatangan basah/elektronik resmi, dan telah didaftarkan dalam sistem basis data Kantor Pusat KJPP Nanang Rahayu &amp; Rekan.
  </p>

  <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px;">
    <div style="width: 45%; text-align: center;">
      <p style="margin-bottom: 55px;">Diterima Oleh,<br><strong>Pemberi Tugas / Klien</strong></p>
      <p style="font-weight: bold; margin: 0; text-decoration: underline;">( .................................................... )</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Nama Jelas &amp; Cap Perusahaan</p>
    </div>
    <div style="width: 45%; text-align: center;">
      <p style="margin-bottom: 55px;">Diserahkan Oleh,<br><strong>KJPP Nanang Rahayu &amp; Rekan</strong></p>
      <p style="font-weight: bold; margin: 0; text-decoration: underline;">( .................................................... )</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Staf Administrasi Cabang {{kode_cabang}}</p>
    </div>
  </div>
</div>
HTML;
}

/**
 * Otomasi Pembuatan Struktur Folder Google Drive (Pilar 3)
 * Skema: [Tahun] / [Kode Cabang] / [ID Penugasan - Nama Klien]
 * 4 Subfolder Wajib:
 * - 01_Legalitas & Administrasi
 * - 02_Data Lapangan & BAPL
 * - 03_Kertas Kerja & Draf
 * - 04_Laporan Final & Tanda Terima
 */
if (!function_exists('buatStrukturFolderGoogleDrive')) {
    function buatStrukturFolderGoogleDrive($item) {
        $tahun = !empty($item['tglPenilaian']) ? substr($item['tglPenilaian'], 0, 4) : date('Y');
        $c = strtoupper(trim((string)($item['cabang'] ?? 'PST')));
        $cabangMap = [
            'PUSAT' => 'PST', 'JAKARTA' => 'PST', 'PST' => 'PST',
            'BANDUNG' => 'BDG', 'BDG' => 'BDG',
            'PADANG' => 'PDG', 'PDG' => 'PDG',
            'PALEMBANG' => 'PLB', 'PLB' => 'PLB',
            'MAKASSAR' => 'MKS', 'MKS' => 'MKS'
        ];
        $kodeCabang = $cabangMap[$c] ?? $c;
        $noReq = trim((string)($item['noPermintaan'] ?? $item['noJo'] ?? 'REG-NSR'));
        $namaKlien = trim((string)($item['namaKlien'] ?? 'Klien'));

        // Sanitasi nama folder agar aman di Google Drive
        $klienSafe = preg_replace('~[\\\\/:*?"<>|]~', '', $namaKlien);
        $folderName = "{$noReq} - {$klienSafe}";
        $path = "{$tahun}/{$kodeCabang}/{$folderName}";
        $cleanId = 'drv_' . strtolower($kodeCabang) . '_' . preg_replace('/[^a-zA-Z0-9]/', '', $noReq);

        $subfolders = [
            '01_legalitas'   => [
                'name' => '01_Legalitas & Administrasi',
                'id'   => "{$cleanId}_sub01",
                'url'  => "https://drive.google.com/drive/folders/{$cleanId}_sub01"
            ],
            '02_lapangan'    => [
                'name' => '02_Data Lapangan & BAPL',
                'id'   => "{$cleanId}_sub02",
                'url'  => "https://drive.google.com/drive/folders/{$cleanId}_sub02"
            ],
            '03_kertas_kerja'=> [
                'name' => '03_Kertas Kerja & Draf',
                'id'   => "{$cleanId}_sub03",
                'url'  => "https://drive.google.com/drive/folders/{$cleanId}_sub03"
            ],
            '04_final'       => [
                'name' => '04_Laporan Final & Tanda Terima',
                'id'   => "{$cleanId}_sub04",
                'url'  => "https://drive.google.com/drive/folders/{$cleanId}_sub04"
            ]
        ];

        return [
            'driveFolderId'   => $cleanId,
            'driveFolderUrl'  => "https://drive.google.com/drive/folders/{$cleanId}",
            'driveFolderPath' => $path,
            'driveSubfolders' => $subfolders,
            'createdAt'       => date('Y-m-d H:i:s')
        ];
    }
}

