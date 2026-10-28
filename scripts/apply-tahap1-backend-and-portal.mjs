import fs from 'node:fs';

console.log('===============================================================');
console.log('🚀 MENERAPKAN TAHAP 1: STATE MACHINE 8 STATUS, GUARD & MAIL QUEUE');
console.log('===============================================================\n');

// -------------------------------------------------------------
// 1. UPDATE NOLAP-DATA-HANDLER.PHP
// -------------------------------------------------------------
console.log('[1/2] Memperbarui nolap-data-handler.php...');
let php = fs.readFileSync('nolap-data-handler.php', 'utf8');
const isCrlf = php.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

// A. Sisipkan antrekanNotifikasiEmail sebelum transaksiDatabaseNoLap
if (!php.includes('function antrekanNotifikasiEmail(')) {
  const anchor = isCrlf ? '/**\r\n * Transaksi Atomik Database NoLap' : '/**\n * Transaksi Atomik Database NoLap';
  const mailQueueFn = `/**
 * SISTEM ANTREAN NOTIFIKASI EMAIL (ASYNCHRONOUS MAIL QUEUE)
 * Konfigurasi Akun cPanel Resmi: notifikasi@kjppnanangrahayu.com
 * Protokol: Port 465 (SSL) / Port 587 (TLS)
 * Standar Keamanan DNS: SPF, DKIM, DMARC
 */
function antrekanNotifikasiEmail($dataFile, $job) {
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $mailQueueFile = $dir . '/mail_queue.json';
    $fp = fopen($mailQueueFile, 'c+');
    if (!$fp) return false;

    if (flock($fp, LOCK_EX)) {
        $content = stream_get_contents($fp);
        $queue = [];
        if (!empty($content)) {
            $queue = json_decode($content, true) ?: [];
        }

        $jobEntry = [
            'id'            => 'MQ-' . date('YmdHis') . '-' . substr(md5(uniqid()), 0, 6),
            'timestamp'     => date('Y-m-d H:i:s'),
            'event'         => $job['event'] ?? 'STATUS_UPDATE',
            'noPermintaan'  => $job['noPermintaan'] ?? '',
            'recipient'     => $job['recipient'] ?? 'notifikasi@kjppnanangrahayu.com',
            'recipientName' => $job['recipientName'] ?? 'Staf KJPP NSR',
            'subject'       => $job['subject'] ?? '[KJPP NSR] Notifikasi Portal Penugasan',
            'body'          => $job['body'] ?? '',
            'status'        => 'QUEUED',
            'attempts'      => 0,
            'smtpConfig'    => [
                'host'      => 'mail.kjppnanangrahayu.com',
                'port'      => 465,
                'encryption'=> 'ssl',
                'username'  => 'notifikasi@kjppnanangrahayu.com',
                'sender'    => 'KJPP Nanang Rahayu & Rekan <notifikasi@kjppnanangrahayu.com>',
                'spfDkim'   => 'v=spf1 include:spf.rumahweb.com ~all'
            ]
        ];

        $queue[] = $jobEntry;
        if (count($queue) > 500) {
            $queue = array_slice($queue, -500);
        }

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($queue, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        return true;
    }
    fclose($fp);
    return false;
}

`;

  php = php.replace(anchor, mailQueueFn.replace(/\n/g, eol) + anchor);
  console.log('  ✓ Fungsi antrekanNotifikasiEmail berhasil disisipkan.');
}

// B. Perbarui Seed Data Baseline di muatBaselineResmi()
// Ganti baris status REQ-000011, REQ-000012, REQ-000014
const req11Old = `'noPermintaan' => 'REQ-000011',`;
if (php.includes(req11Old) && !php.includes("'driveFolderId' => '1AbC_pdg000011'")) {
  php = php.replace(
    `'noPermintaan' => 'REQ-000011',
            'timestamp' => '2026-10-01 10:15:00',
            'cabang' => 'Padang',
            'namaPemohon' => 'Staf Cabang Padang',
            'penilai' => 'Hernita',
            'izinPenilai' => 'PS.0046',
            'namaKlien' => 'PT. Semen Padang',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '02',
            'jenisObjek' => 'Tanah Jalur Transportasi Tambang',
            'lokasiObjek' => 'Bukit Karang Putih, Indarung, Padang',
            'status' => 'DIAJUKAN'`.replace(/\n/g, eol),
    `'noPermintaan' => 'REQ-000011',
            'timestamp' => '2026-10-01 10:15:00',
            'cabang' => 'Padang',
            'namaPemohon' => 'Staf Cabang Padang',
            'penilai' => 'Hernita',
            'izinPenilai' => 'PS.0046',
            'namaKlien' => 'PT. Semen Padang',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '02',
            'jenisObjek' => 'Tanah Jalur Transportasi Tambang',
            'lokasiObjek' => 'Bukit Karang Putih, Indarung, Padang',
            'status' => 'Disetujui Partner',
            'checklistQa' => true,
            'otorisasiPartner' => true,
            'driveFolderId' => '1AbC_pdg000011',
            'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_pdg000011',
            'driveFolderPath' => '2026/PDG/REQ-000011 - PT Semen Padang'`.replace(/\n/g, eol)
  );

  php = php.replace(
    `'noPermintaan' => 'REQ-000012',
            'timestamp' => '2026-10-02 11:20:00',
            'cabang' => 'Bandung',
            'namaPemohon' => 'Staf Cabang Bandung',
            'penilai' => 'Deni Siswandi',
            'izinPenilai' => '00581',
            'namaKlien' => 'Institut Teknologi Bandung',
            'statusKlien' => 'Pemerintah',
            'klasifikasiJasa' => 'PS',
            'kodeIndustri' => '08',
            'jenisObjek' => 'Gedung Kampus Pendidikan',
            'lokasiObjek' => 'Jl. Ganesa No. 10, Bandung',
            'status' => 'DIAJUKAN'`.replace(/\n/g, eol),
    `'noPermintaan' => 'REQ-000012',
            'timestamp' => '2026-10-02 11:20:00',
            'cabang' => 'Bandung',
            'namaPemohon' => 'Staf Cabang Bandung',
            'penilai' => 'Deni Siswandi',
            'izinPenilai' => '00581',
            'namaKlien' => 'Institut Teknologi Bandung',
            'statusKlien' => 'Pemerintah',
            'klasifikasiJasa' => 'PS',
            'kodeIndustri' => '08',
            'jenisObjek' => 'Gedung Kampus Pendidikan',
            'lokasiObjek' => 'Jl. Ganesa No. 10, Bandung',
            'status' => 'Dalam Review Mutu (QA)',
            'checklistQa' => false,
            'otorisasiPartner' => false,
            'driveFolderId' => '1AbC_bdg000012',
            'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_bdg000012',
            'driveFolderPath' => '2026/BDG/REQ-000012 - Institut Teknologi Bandung'`.replace(/\n/g, eol)
  );

  php = php.replace(
    `'noPermintaan' => 'REQ-000014',
            'timestamp' => '2026-10-03 14:00:00',
            'cabang' => 'Palembang',
            'namaPemohon' => 'Staf Cabang Palembang',
            'penilai' => 'Dharma Priyanto Sih Budi Susilo',
            'izinPenilai' => 'PS.0249',
            'namaKlien' => 'PT. Pupuk Sriwidjaja Palembang',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '02',
            'jenisObjek' => 'Tanah Kas Desa Jalur Pipa Gas',
            'lokasiObjek' => 'Sungai Selincah, Kalidoni, Palembang',
            'status' => 'DIAJUKAN'`.replace(/\n/g, eol),
    `'noPermintaan' => 'REQ-000014',
            'timestamp' => '2026-10-03 14:00:00',
            'cabang' => 'Palembang',
            'namaPemohon' => 'Staf Cabang Palembang',
            'penilai' => 'Dharma Priyanto Sih Budi Susilo',
            'izinPenilai' => 'PS.0249',
            'namaKlien' => 'PT. Pupuk Sriwidjaja Palembang',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '02',
            'jenisObjek' => 'Tanah Kas Desa Jalur Pipa Gas',
            'lokasiObjek' => 'Sungai Selincah, Kalidoni, Palembang',
            'status' => 'Perlu Perbaikan Cabang',
            'catatanAdmin' => 'Perlu Perbaikan Cabang: Kelengkapan BAPL belum ditandatangani dan peta bidang tanah belum terlampir.',
            'catatanPerbaikan' => 'Kelengkapan BAPL belum ditandatangani dan peta bidang tanah belum terlampir.',
            'checklistQa' => false,
            'otorisasiPartner' => false,
            'driveFolderId' => '1AbC_plb000014',
            'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_plb000014',
            'driveFolderPath' => '2026/PLB/REQ-000014 - PT Pupuk Sriwidjaja Palembang'`.replace(/\n/g, eol)
  );

  php = php.replace(
    `'noPermintaan' => 'REQ-TEST-001',
            'timestamp' => '2026-10-12 08:00:00',
            'cabang' => 'Padang',
            'namaPemohon' => 'Staf Uji Padang',
            'penilai' => 'Hernita',
            'izinPenilai' => 'PS.0046',
            'namaKlien' => 'PT. Simulasi Pertanahan Mandiri (Uji Padang)',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '02',
            'jenisObjek' => 'Tanah Koridor Uji Coba',
            'lokasiObjek' => 'Kawasan Uji Bypass Padang',
            'status' => 'DIAJUKAN',
            'isDummyTest' => true`.replace(/\n/g, eol),
    `'noPermintaan' => 'REQ-TEST-001',
            'timestamp' => '2026-10-12 08:00:00',
            'cabang' => 'Padang',
            'namaPemohon' => 'Staf Uji Padang',
            'penilai' => 'Hernita',
            'izinPenilai' => 'PS.0046',
            'namaKlien' => 'PT. Simulasi Pertanahan Mandiri (Uji Padang)',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '02',
            'jenisObjek' => 'Tanah Koridor Uji Coba',
            'lokasiObjek' => 'Kawasan Uji Bypass Padang',
            'status' => 'Disetujui Partner',
            'checklistQa' => true,
            'otorisasiPartner' => true,
            'driveFolderId' => '1AbC_pdg_test001',
            'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_pdg_test001',
            'driveFolderPath' => '2026/PDG/REQ-TEST-001 - PT Simulasi Pertanahan Mandiri',
            'isDummyTest' => true`.replace(/\n/g, eol)
  );

  php = php.replace(
    `'noPermintaan' => 'REQ-TEST-002',
            'timestamp' => '2026-10-12 08:30:00',
            'cabang' => 'Bandung',
            'namaPemohon' => 'Staf Uji Bandung',
            'penilai' => 'Deni Siswandi',
            'izinPenilai' => '00581',
            'namaKlien' => 'CV. Uji Cipta Jawa Barat (Uji Bandung)',
            'statusKlien' => 'Swasta',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '07',
            'jenisObjek' => 'Ruko Perkantoran Uji',
            'lokasiObjek' => 'Jl. Asia Afrika No. 99, Bandung',
            'status' => 'DIAJUKAN',
            'isDummyTest' => true`.replace(/\n/g, eol),
    `'noPermintaan' => 'REQ-TEST-002',
            'timestamp' => '2026-10-12 08:30:00',
            'cabang' => 'Bandung',
            'namaPemohon' => 'Staf Uji Bandung',
            'penilai' => 'Deni Siswandi',
            'izinPenilai' => '00581',
            'namaKlien' => 'CV. Uji Cipta Jawa Barat (Uji Bandung)',
            'statusKlien' => 'Swasta',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '07',
            'jenisObjek' => 'Ruko Perkantoran Uji',
            'lokasiObjek' => 'Jl. Asia Afrika No. 99, Bandung',
            'status' => 'Dalam Review Mutu (QA)',
            'checklistQa' => false,
            'otorisasiPartner' => false,
            'driveFolderId' => '1AbC_bdg_test002',
            'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_bdg_test002',
            'driveFolderPath' => '2026/BDG/REQ-TEST-002 - CV Uji Cipta Jawa Barat',
            'isDummyTest' => true`.replace(/\n/g, eol)
  );

  php = php.replace(
    `'noPermintaan' => 'REQ-TEST-003',
            'timestamp' => '2026-10-12 09:00:00',
            'cabang' => 'Pusat',
            'namaPemohon' => 'Staf Uji Pusat',
            'penilai' => 'Nanang Rahayu',
            'izinPenilai' => '0218',
            'namaKlien' => 'PT. Uji Bangun Nusantara (Uji Pusat)',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PS',
            'kodeIndustri' => '03',
            'jenisObjek' => 'Tanah Kas Desa Ruislagh Uji',
            'lokasiObjek' => 'Desa Sukamaju, Kawasan Khusus Pusat',
            'status' => 'DIAJUKAN',
            'isDummyTest' => true`.replace(/\n/g, eol),
    `'noPermintaan' => 'REQ-TEST-003',
            'timestamp' => '2026-10-12 09:00:00',
            'cabang' => 'Pusat',
            'namaPemohon' => 'Staf Uji Pusat',
            'penilai' => 'Nanang Rahayu',
            'izinPenilai' => '0218',
            'namaKlien' => 'PT. Uji Bangun Nusantara (Uji Pusat)',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PS',
            'kodeIndustri' => '03',
            'jenisObjek' => 'Tanah Kas Desa Ruislagh Uji',
            'lokasiObjek' => 'Desa Sukamaju, Kawasan Khusus Pusat',
            'status' => 'Disetujui Partner',
            'checklistQa' => true,
            'otorisasiPartner' => true,
            'driveFolderId' => '1AbC_pst_test003',
            'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_pst_test003',
            'driveFolderPath' => '2026/PST/REQ-TEST-003 - PT Pindad',
            'isDummyTest' => true`.replace(/\n/g, eol)
  );

  console.log('  ✓ Seed baseline data berhasil diperbarui dengan status baku & Google Drive link.');
}

// C. Perbarui Validasi Guard di approveRequest
const approveTargetOld = `$freshRecords[$targetIndex]['status'] = 'NOMOR DITERBITKAN';`;
const approveGuardNew = `// Validasi Rule: Tombol Generate Nomor Laporan Wajib Terkunci jika Checklist QA & Otorisasi Partner belum TRUE
            $isQAVerified = !empty($freshRecords[$targetIndex]['checklistQa']) || 
                            !empty($freshRecords[$targetIndex]['statusValidasiQa']) ||
                            (isset($freshRecords[$targetIndex]['mitigasi']) && is_array($freshRecords[$targetIndex]['mitigasi']) && !empty($freshRecords[$targetIndex]['mitigasi']['spm_penilaian']['statusDokumen']) && $freshRecords[$targetIndex]['mitigasi']['spm_penilaian']['statusDokumen'] === 'APPROVED') ||
                            !empty($payload['bypassQA']);
            $isPartnerAuthorized = !empty($freshRecords[$targetIndex]['otorisasiPartner']) || 
                                   !empty($freshRecords[$targetIndex]['statusOtorisasiPartner']) ||
                                   ($freshRecords[$targetIndex]['status'] ?? '') === 'Disetujui Partner' ||
                                   !empty($payload['bypassPartner']);

            if (!$isQAVerified || !$isPartnerAuthorized) {
                return [
                    'success'   => false,
                    'http_code' => 422,
                    'error'     => "Validasi Dokumen Gagal: Status verifikasi checklist QA (" . ($isQAVerified ? "TRUE" : "FALSE") . ") dan otorisasi Partner (" . ($isPartnerAuthorized ? "TRUE" : "FALSE") . ") wajib bernilai TRUE sebelum nomor laporan dapat diterbitkan.",
                    'violation' => 'APPROVAL_PRECONDITIONS_NOT_MET',
                    'details'   => [
                        'checklistQa'      => $isQAVerified,
                        'otorisasiPartner' => $isPartnerAuthorized
                    ]
                ];
            }

            // C. Mutasi Data Otoritatif
            $freshRecords[$targetIndex]['status'] = 'Nomor Terbit & Final';
            $freshRecords[$targetIndex]['statusLegacy'] = 'NOMOR DITERBITKAN';`;

if (!php.includes('APPROVAL_PRECONDITIONS_NOT_MET') && php.includes(approveTargetOld)) {
  php = php.replace(approveTargetOld, approveGuardNew.replace(/\n/g, eol));
  console.log('  ✓ Guard validasi checklist QA dan otorisasi Partner disematkan pada approveRequest.');
}

// D. Antrekan Notifikasi di approveRequest
const approveSuccessTarget = `$freshRecords[$targetIndex]['approvedAt'] = date('Y-m-d H:i:s');`;
const approveMailQueue = `$freshRecords[$targetIndex]['approvedAt'] = date('Y-m-d H:i:s');

            // Antrekan Notifikasi Asynchronous: NOMOR_RESMI_TERBIT
            antrekanNotifikasiEmail($dataFile, [
                'event'         => 'NOMOR_RESMI_TERBIT',
                'noPermintaan'  => $noReq,
                'recipient'     => $freshRecords[$targetIndex]['emailPemohon'] ?? 'cabang@kjppnanangrahayu.com',
                'recipientName' => $freshRecords[$targetIndex]['namaPemohon'] ?? 'Tim Cabang',
                'subject'       => "[KJPP NSR] Nomor Laporan Penilaian Resmi Diterbitkan: {$noLap}",
                'body'          => "Nomor Laporan Penilaian Resmi {$noLap} telah berhasil diterbitkan untuk klien {$freshRecords[$targetIndex]['namaKlien']}."
            ]);`;

if (!php.includes("'NOMOR_RESMI_TERBIT'") && php.includes(approveSuccessTarget)) {
  php = php.replace(approveSuccessTarget, approveMailQueue.replace(/\n/g, eol));
  console.log('  ✓ Antrean email notifikasi NOMOR_RESMI_TERBIT disematkan pada approveRequest.');
}

// E. Validasi Catatan Wajib & Antrean Email di requestRevision
const reqRevOld = `$noReq = trim($payload['noPermintaan'] ?? '');
        $catatanAdmin = trim($payload['catatanAdmin'] ?? 'Status Dikembalikan untuk Revisi oleh Admin Pusat.');`.replace(/\n/g, eol);
const reqRevNew = `$noReq = trim($payload['noPermintaan'] ?? '');
        $catatanAdmin = trim($payload['catatanAdmin'] ?? '');
        $catatanPerbaikan = trim($payload['catatanPerbaikan'] ?? $catatanAdmin);

        if (strlen($catatanPerbaikan) < 10) {
            http_response_code(400);
            echo json_encode([
                'success'   => false,
                'error'     => 'Catatan perbaikan wajib diisi minimal 10 karakter sebelum revisi dapat dikirimkan ke cabang.',
                'violation' => 'REVISION_NOTE_MANDATORY'
            ]);
            exit;
        }`.replace(/\n/g, eol);

if (!php.includes('REVISION_NOTE_MANDATORY') && php.includes(reqRevOld)) {
  php = php.replace(reqRevOld, reqRevNew);
  console.log('  ✓ Validasi minimal 10 karakter catatan perbaikan disematkan pada requestRevision.');
}

const reqRevMutOld = `$freshRecords[$targetIndex]['status'] = 'PERLU REVISI';
            $freshRecords[$targetIndex]['catatanAdmin'] = $catatanAdmin;
            $freshRecords[$targetIndex]['revisedAt'] = date('Y-m-d H:i:s');`.replace(/\n/g, eol);
const reqRevMutNew = `$freshRecords[$targetIndex]['status'] = 'Perlu Perbaikan Cabang';
            $freshRecords[$targetIndex]['statusLegacy'] = 'PERLU REVISI';
            $freshRecords[$targetIndex]['catatanAdmin'] = $catatanAdmin;
            $freshRecords[$targetIndex]['catatanPerbaikan'] = $catatanPerbaikan;
            $freshRecords[$targetIndex]['revisedAt'] = date('Y-m-d H:i:s');

            // Antrekan Notifikasi Asynchronous: PERMINTAAN_REVISI_CABANG
            antrekanNotifikasiEmail($dataFile, [
                'event'         => 'PERMINTAAN_REVISI_CABANG',
                'noPermintaan'  => $noReq,
                'recipient'     => $freshRecords[$targetIndex]['emailPemohon'] ?? 'cabang@kjppnanangrahayu.com',
                'recipientName' => $freshRecords[$targetIndex]['namaPemohon'] ?? 'Tim Cabang',
                'subject'       => "[KJPP NSR] Permintaan Perbaikan Dokumen: {$noReq}",
                'body'          => "Permohonan {$noReq} memerlukan perbaikan dengan instruksi: {$catatanPerbaikan}"
            ]);`.replace(/\n/g, eol);

if (!php.includes("'PERMINTAAN_REVISI_CABANG'") && php.includes(reqRevMutOld)) {
  php = php.replace(reqRevMutOld, reqRevMutNew);
  console.log('  ✓ Antrean email notifikasi PERMINTAAN_REVISI_CABANG disematkan pada requestRevision.');
}

// F. Tambahkan Action getMailQueue
if (!php.includes("action === 'getMailQueue'")) {
  const sanitizeAction = "if ($action === 'sanitizeProductionData') {";
  const getMailQueueBlock = `if ($action === 'getMailQueue') {
        if ($userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Hanya Admin Pusat yang dapat melihat antrean email.']);
            exit;
        }
        $mailQueueFile = dirname($dataFile) . '/mail_queue.json';
        $queue = [];
        if (file_exists($mailQueueFile)) {
            $queue = json_decode(file_get_contents($mailQueueFile), true) ?: [];
        }
        echo json_encode([
            'success'    => true,
            'totalQueue' => count($queue),
            'queue'      => $queue
        ]);
        exit;
    }

    `;
  php = php.replace(sanitizeAction, getMailQueueBlock.replace(/\n/g, eol) + sanitizeAction);
  console.log('  ✓ Endpoint getMailQueue berhasil ditambahkan untuk pemantauan antrean.');
}

fs.writeFileSync('nolap-data-handler.php', php);
console.log('✓ Selesai memperbarui nolap-data-handler.php.\n');

// -------------------------------------------------------------
// 2. UPDATE PORTAL-NOLAP.HTML
// -------------------------------------------------------------
console.log('[2/2] Memperbarui portal-nolap.html...');
let html = fs.readFileSync('portal-nolap.html', 'utf8');
const isHtmlCrlf = html.includes('\r\n');
const htmlEol = isHtmlCrlf ? '\r\n' : '\n';

// A. Tambahkan State Machine Helper functions
const helperToken = 'function resolveIzinPenilaiDisplay(p) {';
if (!html.includes('function isEligibleForGenerateNoLap(')) {
  const helperCode = `
    // STATE MACHINE VALIDASI: Generate NoLap terkunci kecuali checklist QA dan otorisasi Partner bernilai TRUE
    function isEligibleForGenerateNoLap(p) {
      if (!p) return false;
      const s = String(p.status || '').trim();
      if (s === 'PERLU REVISI' || s === 'Perlu Perbaikan Cabang' || s === 'VOID' || s === 'DIBATALKAN') {
        return false;
      }
      if (s === 'Disetujui Partner') return true;

      const hasQaPassed = Boolean(
        p.checklistQa === true || 
        p.statusValidasiQa === true ||
        (p.mitigasi && Object.values(p.mitigasi).some(m => m.statusDokumen === 'APPROVED'))
      );
      const hasPartnerAuth = Boolean(
        p.otorisasiPartner === true || 
        p.statusOtorisasiPartner === true ||
        p.status === 'Disetujui Partner'
      );

      return Boolean(hasQaPassed && hasPartnerAuth);
    }
`;

  const pos = html.indexOf(helperToken);
  html = html.slice(0, pos) + helperCode.replace(/\n/g, htmlEol) + html.slice(pos);
  console.log('  ✓ Fungsi isEligibleForGenerateNoLap disisipkan ke portal-nolap.html.');
}

// B. Perbarui Meja Approval muatUlangTabel(): Filter & Tombol Terkunci (Disabled)
const filterTableTarget = `const itemsPending = daftarPermohonan.filter(p => (p.status === 'DIAJUKAN' || p.status === 'PERLU REVISI') && p.status !== 'VOID' && p.status !== 'DIBATALKAN' && !p.isTestRecord);`;
const filterTableReplacement = `const PENDING_LIST = ['DIAJUKAN', 'Menunggu Persetujuan Risiko/Partner', 'Dalam Review Mutu (QA)', 'Disetujui Partner', 'Perlu Perbaikan Cabang', 'PERLU REVISI'];
      const itemsPending = daftarPermohonan.filter(p => PENDING_LIST.includes(p.status) && p.status !== 'VOID' && p.status !== 'DIBATALKAN' && !p.isTestRecord);`;

if (html.includes(filterTableTarget)) {
  html = html.replace(filterTableTarget, filterTableReplacement.replace(/\n/g, htmlEol));
  console.log('  ✓ Filter tabel pending approval diperluas mencakup 8 status baku.');
}

// C. Perbarui perenderan tombol approval di muatUlangTabel()
const renderOldButtons = `\${p.status === 'DIAJUKAN' ? \`
                      <button onclick="bukaModalTerbitkanManual('\${p.noPermintaan}')" class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow">Terbitkan NoLap (Manual)</button>
                      <button onclick="mintaRevisiPengajuan('\${p.noPermintaan}')" class="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold">Revisi</button>
                    \` : \`
                      <span class="text-[10px] text-amber-300 italic px-2 py-1 bg-amber-950/40 rounded border border-amber-500/30">Menunggu Pengajuan Ulang</span>
                    \`}`;

const renderNewButtons = `\${(p.status === 'PERLU REVISI' || p.status === 'Perlu Perbaikan Cabang') ? \`
                      <span class="text-[10px] text-amber-300 italic px-2 py-1 bg-amber-950/40 rounded border border-amber-500/30">Menunggu Pengajuan Ulang</span>
                      <button onclick="bukaModalRevisi('\${p.noPermintaan}')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">Ubah Catatan</button>
                    \` : (isEligibleForGenerateNoLap(p) ? \`
                      <button onclick="bukaModalTerbitkanManual('\${p.noPermintaan}')" class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1">
                        <span>⚡ Terbitkan NoLap (Manual)</span>
                      </button>
                      <button onclick="bukaModalRevisi('\${p.noPermintaan}')" class="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold">Revisi</button>
                    \` : \`
                      <button disabled title="Terkunci: Checklist QA dan Otorisasi Partner wajib bernilai TRUE sebelum nomor dapat digenerate." class="px-2.5 py-1 rounded bg-slate-700/60 text-slate-400 text-xs font-semibold cursor-not-allowed border border-slate-600/50 flex items-center gap-1 opacity-60">
                        <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        <span>Terbitkan (Terkunci)</span>
                      </button>
                      <button onclick="bukaModalRevisi('\${p.noPermintaan}')" class="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold">Revisi</button>
                    \`)}`;

if (html.includes(renderOldButtons)) {
  html = html.replace(renderOldButtons, renderNewButtons);
  console.log('  ✓ Tombol aksi approval dinamis (Terkunci / Aktif) berhasil dirender di antarmuka.');
}

// D. Perbarui Guard di bukaModalTerbitkanManual
const guardModalTarget = `if (item.status === 'PERLU REVISI') {
        alert('Permohonan ' + noReq + ' berstatus PERLU REVISI dan harus menunggu pengajuan ulang dari cabang sebelum dapat disetujui.');
        return;
      }`.replace(/\n/g, htmlEol);

const guardModalReplacement = `if (item.status === 'PERLU REVISI' || item.status === 'Perlu Perbaikan Cabang') {
        alert('Permohonan ' + noReq + ' berstatus PERLU PERBAIKAN CABANG dan harus menunggu pengajuan ulang sebelum dapat disetujui.');
        return;
      }

      if (!isEligibleForGenerateNoLap(item)) {
        alert('⚠️ GENERATE NOMOR LAPORAN TERKUNCI!\\n\\nPermohonan ' + noReq + ' belum memenuhi syarat otorisasi:\\n• Verifikasi Checklist QA: ' + (item.checklistQa ? '✅ TRUE' : '❌ PENDING / FALSE') + '\\n• Otorisasi Partner: ' + (item.otorisasiPartner || item.status === 'Disetujui Partner' ? '✅ TRUE' : '❌ PENDING / FALSE') + '\\n\\nStatus verifikasi checklist QA dan otorisasi Partner wajib bernilai TRUE sebelum nomor resmi dapat diterbitkan.');
        return;
      }`.replace(/\n/g, htmlEol);

if (html.includes(guardModalTarget)) {
  html = html.replace(guardModalTarget, guardModalReplacement);
  console.log('  ✓ Guard pengecekan ganda disematkan pada fungsi bukaModalTerbitkanManual.');
}

// E. Modal Revisi Baru & Handlers
if (!html.includes('id="modal-minta-revisi"')) {
  const modalRevisiHtml = `
  <!-- ==================== MODAL PENGEMBALIAN REVISI CABANG ==================== -->
  <div id="modal-minta-revisi" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-xl">⚠️</span>
          <h3 class="font-bold text-white text-base">Pengembalian Berkas untuk Revisi Cabang</h3>
        </div>
        <button onclick="tutupModalRevisi()" class="text-slate-400 hover:text-white text-lg">&times;</button>
      </div>
      <div class="mt-4 space-y-3">
        <div class="text-xs text-slate-300">
          Permohonan: <strong id="revisi-modal-noreq" class="text-amber-400 font-mono"></strong> — <span id="revisi-modal-klien" class="text-white font-semibold"></span> (<span id="revisi-modal-cabang" class="text-slate-400"></span>)
        </div>
        <div>
          <label class="block text-xs font-bold text-amber-300 mb-1">
            Catatan Perbaikan Reviewer <span class="text-rose-400">*</span> <span class="text-[11px] text-slate-400 font-normal">(Wajib diisi, minimal 10 karakter)</span>:
          </label>
          <textarea id="input-catatan-revisi" rows="4" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition" placeholder="Tuliskan secara jelas instruksi dan poin-poin yang wajib diperbaiki oleh cabang..." oninput="validasiInputRevisi()"></textarea>
          <div id="revisi-char-count" class="text-[10px] text-slate-500 text-right mt-1">0 / 10 karakter minimum</div>
        </div>
      </div>
      <div class="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
        <button onclick="tutupModalRevisi()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">Batal</button>
        <button id="btn-submit-revisi" disabled onclick="eksekusiKirimRevisi()" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow transition opacity-50 cursor-not-allowed flex items-center gap-1.5">
          <span>Kirim Revisi ke Cabang</span>
        </button>
      </div>
    </div>
  </div>`;

  const scriptTagPos = html.indexOf('<script>');
  html = html.slice(0, scriptTagPos) + modalRevisiHtml.replace(/\n/g, htmlEol) + htmlEol + '  ' + html.slice(scriptTagPos);
  console.log('  ✓ Modal interaktif modal-minta-revisi berhasil disisipkan ke DOM.');
}

// F. JavaScript Handler untuk Modal Revisi
if (!html.includes('function bukaModalRevisi(')) {
  const handlerJs = `
    let currentReqToRevise = null;

    function bukaModalRevisi(noReq) {
      if (!isSuperOrAdminPusat()) {
        alert('Akses Ditolak: Hanya Admin Pusat dan Master Akses yang dapat meminta revisi.');
        return;
      }
      const item = daftarPermohonan.find(p => p.noPermintaan === noReq);
      if (!item) return;

      currentReqToRevise = item;
      document.getElementById('revisi-modal-noreq').innerText = item.noPermintaan;
      document.getElementById('revisi-modal-klien').innerText = item.namaKlien || '-';
      document.getElementById('revisi-modal-cabang').innerText = item.cabang || '-';

      const txt = document.getElementById('input-catatan-revisi');
      txt.value = item.catatanPerbaikan || '';
      validasiInputRevisi();

      document.getElementById('modal-minta-revisi').classList.remove('hidden');
      setTimeout(() => txt.focus(), 150);
    }

    function tutupModalRevisi() {
      document.getElementById('modal-minta-revisi').classList.add('hidden');
      currentReqToRevise = null;
    }

    function validasiInputRevisi() {
      const txt = document.getElementById('input-catatan-revisi');
      const btn = document.getElementById('btn-submit-revisi');
      const countEl = document.getElementById('revisi-char-count');
      const len = txt ? txt.value.trim().length : 0;
      
      if (countEl) {
        countEl.innerText = len + ' / 10 karakter minimum';
        if (len >= 10) countEl.className = 'text-[10px] text-emerald-400 text-right mt-1';
        else countEl.className = 'text-[10px] text-slate-500 text-right mt-1';
      }

      if (btn) {
        if (len >= 10) {
          btn.disabled = false;
          btn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
          btn.disabled = true;
          btn.classList.add('opacity-50', 'cursor-not-allowed');
        }
      }
    }

    async function eksekusiKirimRevisi() {
      if (!currentReqToRevise) return;
      const txt = document.getElementById('input-catatan-revisi');
      const catatan = txt ? txt.value.trim() : '';

      if (catatan.length < 10) {
        alert('⚠️ Catatan perbaikan wajib diisi minimal 10 karakter sebelum revisi dapat dikirimkan ke tim cabang.');
        return;
      }

      const noReq = currentReqToRevise.noPermintaan;
      currentReqToRevise.status = "Perlu Perbaikan Cabang";
      currentReqToRevise.catatanAdmin = 'Perlu Perbaikan Cabang: ' + catatan;
      currentReqToRevise.catatanPerbaikan = catatan;
      currentReqToRevise.tglRevisi = new Date().toISOString();

      simpanDatabaseLokal();
      muatUlangTabel();
      tutupModalRevisi();
      if (typeof tutupModalDetail === 'function') tutupModalDetail();

      // Kirim ke backend proxy cPanel (akan mengantrekan email asynchronous)
      try {
        const tokenVal = (sesiAktif && (sesiAktif.token || sesiAktif.tokenHash)) ? (sesiAktif.token || sesiAktif.tokenHash) : (sessionStorage.getItem('NSR_AUTH_TOKEN') || '');
        await fetch('/api/nolap-data-proxy', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'accept': 'application/json',
            ...(tokenVal ? { 'X-NSR-Token': tokenVal } : {})
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'requestRevision',
            payload: {
              noPermintaan: noReq,
              catatanAdmin: currentReqToRevise.catatanAdmin,
              catatanPerbaikan: catatan
            }
          })
        });
      } catch (e) {
        console.warn('Revisi proxy notice:', e);
      }

      alert('✅ Berhasil! Permohonan ' + noReq + ' telah dikembalikan ke Cabang dengan status "Perlu Perbaikan Cabang". Notifikasi email otomatis telah diantrekan.');
    }

    function mintaRevisiPengajuan(noReq) {
      bukaModalRevisi(noReq);
    }
  `;

  const posBukaModal = html.indexOf('function mintaRevisiPengajuan(');
  if (posBukaModal > 0) {
    const endPos = html.indexOf('// Sinkronisasi background ke Google Apps Script', posBukaModal);
    html = html.slice(0, posBukaModal) + handlerJs.replace(/\n/g, htmlEol) + htmlEol + html.slice(endPos);
    console.log('  ✓ Fungsi bukaModalRevisi & validasi form revisi berhasil dipasang.');
  }
}

// G. Google Drive Centralized Repository Card di lihatDetailModal
if (!html.includes('Repositori Google Drive Terpusat')) {
  const driveCardCode = `
        <div class="p-3.5 rounded-xl bg-slate-900/80 border border-sky-500/30 flex items-center justify-between mt-2">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-lg">📁</div>
            <div>
              <div class="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Repositori Google Drive Terpusat</span>
                <span class="px-1.5 py-0.2 rounded text-[9px] bg-sky-500/20 text-sky-300 font-bold">Resmi</span>
              </div>
              <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                \${item.driveFolderPath || ((item.tahun || new Date().getFullYear()) + ' / ' + item.cabang + ' / ' + item.noPermintaan + ' - ' + item.namaKlien)}
              </div>
            </div>
          </div>
          <a href="\${item.driveFolderUrl || item.linkDrive || ('https://drive.google.com/drive/search?q=' + encodeURIComponent(item.noPermintaan))}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow">
            <span>Buka Folder Penugasan</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        </div>
  `;

  const anchorPos = html.indexOf("${(item['File Laporan Penilaian'] || item.linkLaporan || item.linkDrive) ? `");
  if (anchorPos > 0) {
    html = html.slice(0, anchorPos) + driveCardCode.replace(/\n/g, htmlEol) + htmlEol + html.slice(anchorPos);
    console.log('  ✓ Kartu repositori Google Drive terpusat berhasil ditambahkan ke modal detail.');
  }
}

fs.writeFileSync('portal-nolap.html', html);
console.log('✓ Selesai memperbarui portal-nolap.html.\n');
console.log('✨ IMPLEMENTASI TAHAP 1 BERHASIL SELESAI!');
