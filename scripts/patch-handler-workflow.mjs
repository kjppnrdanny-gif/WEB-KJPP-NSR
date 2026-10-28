import fs from 'fs';

console.log('=== UPDATING NOLAP-DATA-HANDLER.PHP ===');
let php = fs.readFileSync('nolap-data-handler.php', 'utf8');

// 1. Update submitRequest logic
const targetSubmitSection = `        // 2. DETEKSI MODE PENGAJUAN (REGULER vs BOOKING NOLAP)
        $isBookingReq = !empty($payload['isBooking']) || 
                        (isset($payload['modePengajuan']) && strtoupper($payload['modePengajuan']) === 'BOOKING') || 
                        (isset($payload['tipePengajuan']) && strtoupper($payload['tipePengajuan']) === 'BOOKING') ||
                        (isset($payload['request_status']) && stripos($payload['request_status'], 'BOOKING') !== false) ||
                        (isset($payload['status']) && stripos($payload['status'], 'BOOKING') !== false);

        // 3. ENFORCE 3 TAUTAN DOKUMEN JIKA MODE REGULER
        if (!$isBookingReq) {
            $linkLaporan = trim($payload['linkLaporan'] ?? ($payload['File Laporan Penilaian'] ?? ($payload['drafLaporanUrl'] ?? ($payload['linkDrive'] ?? ''))));
            $linkPembanding = trim($payload['linkPembanding'] ?? ($payload['File Data Pembanding'] ?? ($payload['link_pembanding'] ?? '')));
            $linkBai = trim($payload['linkBai'] ?? ($payload['File Berita Acara Inspeksi'] ?? ($payload['baiUrl'] ?? ($payload['link_bai'] ?? ''))));

            if (empty($linkLaporan) || empty($linkPembanding) || empty($linkBai)) {
                http_response_code(422);
                echo json_encode([
                    'success'   => false,
                    'error'     => 'Validasi Gagal: Mode Reguler (Berkas Final Lengkap) mewajibkan seluruh 3 tautan berkas penilaian (Link File Laporan, Link Data Pembanding, dan Link Berita Acara Inspeksi/BAI) terisi dengan valid.',
                    'violation' => 'MISSING_MANDATORY_DOCUMENT_LINKS'
                ]);
                exit;
            }
        }

        // 4. ENFORCE SMART MITIGASI UNTUK SEMUA MODE (REGULER & BOOKING)
        $smartMitigasiReq = $payload['smart_mitigasi'] ?? ($payload['smartMitigasi'] ?? null);
        if (empty($smartMitigasiReq) || !is_array($smartMitigasiReq) || count($smartMitigasiReq) === 0) {
            http_response_code(422);
            echo json_encode([
                'success'   => false,
                'error'     => 'Validasi Gagal: Parameter Smart Mitigasi & SPM wajib diisi baik untuk pengajuan Reguler maupun Booking.',
                'violation' => 'MISSING_SMART_MITIGATION_PAYLOAD'
            ]);
            exit;
        }`;

const replacementSubmitSection = `        // 0. DETEKSI SIMPAN DRAF TERPADU (LANGKAH 1 + LANGKAH 2)
        $isDraftReq = !empty($payload['isDraft']) || !empty($payload['saveAsDraft']) || 
                      (isset($payload['status']) && strtoupper($payload['status']) === 'DRAFT') ||
                      (isset($payload['modePengajuan']) && strtoupper($payload['modePengajuan']) === 'DRAFT');

        // 2. DETEKSI MODE PENGAJUAN (REGULER vs BOOKING NOLAP)
        $isBookingReq = !empty($payload['isBooking']) || 
                        (isset($payload['modePengajuan']) && strtoupper($payload['modePengajuan']) === 'BOOKING') || 
                        (isset($payload['tipePengajuan']) && strtoupper($payload['tipePengajuan']) === 'BOOKING') ||
                        (isset($payload['request_status']) && stripos($payload['request_status'], 'BOOKING') !== false) ||
                        (isset($payload['status']) && stripos($payload['status'], 'BOOKING') !== false);

        // 3. ENFORCE 3 TAUTAN DOKUMEN JIKA MODE REGULER (DRAF DIKECUALIKAN)
        if (!$isBookingReq && !$isDraftReq) {
            $linkLaporan = trim($payload['linkLaporan'] ?? ($payload['File Laporan Penilaian'] ?? ($payload['drafLaporanUrl'] ?? ($payload['linkDrive'] ?? ''))));
            $linkPembanding = trim($payload['linkPembanding'] ?? ($payload['File Data Pembanding'] ?? ($payload['link_pembanding'] ?? '')));
            $linkBai = trim($payload['linkBai'] ?? ($payload['File Berita Acara Inspeksi'] ?? ($payload['baiUrl'] ?? ($payload['link_bai'] ?? ''))));

            if (empty($linkLaporan) || empty($linkPembanding) || empty($linkBai)) {
                http_response_code(422);
                echo json_encode([
                    'success'   => false,
                    'error'     => 'Validasi Gagal: Mode Reguler (Berkas Final Lengkap) mewajibkan seluruh 3 tautan berkas penilaian (Link File Laporan, Link Data Pembanding, dan Link Berita Acara Inspeksi/BAI) terisi dengan valid.',
                    'violation' => 'MISSING_MANDATORY_DOCUMENT_LINKS'
                ]);
                exit;
            }
        }

        // 4. ENFORCE SMART MITIGASI UNTUK SEMUA MODE (REGULER & BOOKING, DRAF DIKECUALIKAN)
        $smartMitigasiReq = $payload['smart_mitigasi'] ?? ($payload['smartMitigasi'] ?? null);
        if (!$isDraftReq && (empty($smartMitigasiReq) || !is_array($smartMitigasiReq) || count($smartMitigasiReq) === 0)) {
            http_response_code(422);
            echo json_encode([
                'success'   => false,
                'error'     => 'Validasi Gagal: Parameter Smart Mitigasi & SPM wajib diisi baik untuk pengajuan Reguler maupun Booking.',
                'violation' => 'MISSING_SMART_MITIGATION_PAYLOAD'
            ]);
            exit;
        }`;

// Normalize line endings for replacement
const normalizeText = (t) => t.replace(/\r\n/g, '\n');

if (normalizeText(php).includes(normalizeText(targetSubmitSection))) {
  // Use regex with CRLF flexibility
  const regexSubmit = new RegExp(targetSubmitSection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\r?\n\s*/g, '\\r?\\n\\s*'));
  php = php.replace(regexSubmit, replacementSubmitSection);
  console.log('✓ SubmitRequest draft detection & validation bypass added');
} else {
  console.warn('⚠️ targetSubmitSection pattern not found directly, trying line-based replacement...');
}

// 2. Update Status Machine (Remove MENUNGGU_VERIFIKASI_ADMIN interception)
const targetStatusSection = `        // 5. PENENTUAN STATUS ALUR KERJA (PEMISAHAN STAF FUNGSIONAL PUSAT VS ADMIN/SPM)
        if (!$isBranchOriginReq && in_array($userRole, ['SURVEYOR', 'PENILAI', 'MARKETING'], true)) {
            $initialStatus = 'MENUNGGU_VERIFIKASI_ADMIN';
            $requestStatus = 'MENUNGGU_VERIFIKASI_ADMIN';
        } elseif ($isBookingReq) {
            $initialStatus = 'BOOKING DIAJUKAN';
            $requestStatus = 'BOOKING DIAJUKAN';
        } else {
            $initialStatus = 'MENUNGGU_SPM_AKHIR';
            $requestStatus = 'MENUNGGU_SPM_AKHIR';
        }`;

const replacementStatusSection = `        // 5. PENENTUAN STATUS ALUR KERJA (ALUR TERPADU LANGSUNG KE KEPALA SPM)
        if ($isDraftReq) {
            $initialStatus = 'DRAFT';
            $requestStatus = 'DRAFT';
        } elseif ($isBookingReq) {
            $initialStatus = 'BOOKING DIAJUKAN';
            $requestStatus = 'BOOKING DIAJUKAN';
        } else {
            // Hapus intersep admin di awal! Baik Staf Pusat maupun Admin Cabang langsung mendarat di meja telaah Kepala SPM
            $initialStatus = 'MENUNGGU_SPM_AKHIR';
            $requestStatus = 'MENUNGGU_SPM_AKHIR';
        }`;

if (normalizeText(php).includes(normalizeText(targetStatusSection))) {
  const regexStatus = new RegExp(targetStatusSection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\r?\n\s*/g, '\\r?\\n\\s*'));
  php = php.replace(regexStatus, replacementStatusSection);
  console.log('✓ Status machine updated: MENUNGGU_VERIFIKASI_ADMIN removed, submissions route directly to Kepala SPM');
}

// 3. Update dgStatusGerbang2
php = php.replace(
  `$dgStatusGerbang2 = ($initialStatus === 'MENUNGGU_VERIFIKASI_ADMIN') ? 'MENUNGGU_VERIFIKASI_ADMIN' : 'MENUNGGU_SPM_AKHIR';`,
  `$dgStatusGerbang2 = $initialStatus;`
);
console.log('✓ dgStatusGerbang2 synced with initialStatus');

// 4. Update renderDocumentTemplate targetItem lookup to check both records & dualGate
const targetDocLookup = `        $targetItem = null;
        foreach ($records as $item) {
            if (($item['noPermintaan'] ?? '') === $noReq) {
                $targetItem = $item;
                break;
            }
        }`;

const replacementDocLookup = `        $targetItem = null;
        foreach ($records as $item) {
            if (($item['noPermintaan'] ?? '') === $noReq || ($item['idPenugasan'] ?? '') === $noReq) {
                $targetItem = $item;
                break;
            }
        }
        if (!$targetItem) {
            $dgList = muatDatabaseDualGate($dualGateDbFile);
            foreach ($dgList as $item) {
                if (($item['noPermintaan'] ?? '') === $noReq || ($item['idPenugasan'] ?? '') === $noReq) {
                    $targetItem = $item;
                    break;
                }
            }
        }`;

if (normalizeText(php).includes(normalizeText(targetDocLookup))) {
  const regexDoc = new RegExp(targetDocLookup.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\r?\n\s*/g, '\\r?\\n\\s*'));
  php = php.replace(regexDoc, replacementDocLookup);
  console.log('✓ renderDocumentTemplate updated to check both records and dualGate DB');
}

fs.writeFileSync('nolap-data-handler.php', php, 'utf8');
console.log('✓ nolap-data-handler.php saved successfully');
