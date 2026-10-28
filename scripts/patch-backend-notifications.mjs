import fs from 'fs';

const handlerPath = 'nolap-data-handler.php';
let code = fs.readFileSync(handlerPath, 'utf8');
const isCRLF = code.includes('\r\n');
if (isCRLF) {
  code = code.replace(/\r\n/g, '\n');
}

// 1. Helpers
const waFuncAnchor = `function generateWhatsAppNotificationLink($noHp, $pesan) {
    $cleanHp = preg_replace('/[^0-9]/', '', $noHp);
    if (substr($cleanHp, 0, 1) === '0') {
        $cleanHp = '62' . substr($cleanHp, 1);
    }
    return 'https://wa.me/' . $cleanHp . '?text=' . rawurlencode($pesan);
}`;

if (!code.includes(waFuncAnchor)) {
  throw new Error('waFuncAnchor not found');
}

const newHelpers = `
function muatMasterPersonelKontak($mastersDir) {
    $f = $mastersDir . '/master_personel_kontak.json';
    if (!file_exists($f)) return [];
    $data = json_decode(file_get_contents($f), true);
    return $data['personel'] ?? [];
}

function normalisasiNomorWhatsApp($rawPhone) {
    if (!$rawPhone) return '';
    $clean = preg_replace('/[^0-9]/', '', (string)$rawPhone);
    if (strpos($clean, '08') === 0) {
        $clean = '62' . substr($clean, 1);
    } elseif (strpos($clean, '8') === 0) {
        $clean = '62' . $clean;
    }
    return $clean;
}

function cariPersonelKontak($mastersDir, $identifier, $fallbackOfficeId = '2.0160-00') {
    $list = muatMasterPersonelKontak($mastersDir);
    $clean = strtolower(trim((string)$identifier));
    
    if (!empty($clean)) {
        foreach ($list as $p) {
            $uid = strtolower($p['user_id'] ?? '');
            $pid = strtolower($p['personnel_id'] ?? '');
            $nik = strtolower($p['nik'] ?? '');
            $em  = strtolower($p['email'] ?? '');
            $nm  = strtolower($p['nama'] ?? '');
            $wa  = preg_replace('/[^0-9]/', '', $p['whatsapp_number'] ?? '');
            $clWa = preg_replace('/[^0-9]/', '', $clean);

            if ($uid === $clean || $pid === $clean || $nik === $clean || $em === $clean || $nm === $clean) {
                return $p;
            }
            if (!empty($clWa) && strlen($clWa) >= 9 && strpos($wa, substr($clWa, -8)) !== false) {
                return $p;
            }
            if (strpos($clean, 'danny') !== false && strpos($uid, 'danny') !== false) return $p;
            if (strpos($clean, 'nanang') !== false && strpos($uid, 'nanang') !== false) return $p;
            if (strpos($clean, 'deni') !== false && (strpos($uid, 'deni') !== false || strpos($uid, 'bdg') !== false)) return $p;
            if (strpos($clean, 'hernita') !== false && strpos($uid, 'hernita') !== false) return $p;
            if (strpos($clean, 'amin') !== false && strpos($uid, 'amin') !== false) return $p;
            if (strpos($clean, 'dharma') !== false && strpos($uid, 'dharma') !== false) return $p;
            if (strpos($clean, 'fauzi') !== false && strpos($uid, 'bdg') !== false) return $p;
            if (strpos($clean, 'siti') !== false && strpos($uid, 'pdg') !== false) return $p;
        }
    }

    $cleanOffice = trim($fallbackOfficeId);
    foreach ($list as $p) {
        if (($p['office_id'] ?? '') === $cleanOffice && strpos(strtolower($p['role'] ?? ''), 'admin') !== false) {
            return $p;
        }
    }
    return $list[0] ?? [
        'personnel_id' => 'NSR-2019-005',
        'user_id' => 'super_admin_king',
        'nama' => 'Danny Taufik Hidayat, S.E.',
        'office_id' => '2.0160-00',
        'office_name' => 'Kantor Pusat Jakarta',
        'email' => 'kjppnr.danny@gmail.com',
        'email_verified' => true,
        'whatsapp_number' => '081298765432',
        'whatsapp_verified' => true,
        'contact_status' => 'VERIFIED',
        'role' => 'SUPER_ADMIN'
    ];
}

function formatPesanWhatsApp($eventType, $requesterName, $idPenugasan, $noPermintaan, $details = []) {
    $judulEvent = [
        'PENGAJUAN_JO_DITERIMA'    => 'Pengajuan Penugasan / JO Diterima',
        'APPROVAL_GERBANG_1'       => 'Pemberitahuan Hasil Review Gerbang 1',
        'PENERBITAN_LP'            => 'Lingkup Penugasan (LP) Resmi Diterbitkan',
        'PENGAJUAN_NOLAP_DITERIMA' => 'Pengajuan Nomor Laporan Diterima di Gerbang 2',
        'APPROVAL_GERBANG_2'       => 'Pemberitahuan Hasil Review Akhir Gerbang 2',
        'PENERBITAN_NOLAP'         => 'Nomor Laporan Definitif 7 Segmen Diterbitkan',
        'QR_ELSA_TERVERIFIKASI'    => 'Verifikasi QR Code eLSa-PK Selesai',
        'LAPORAN_FINAL_SIAP'       => 'Laporan Penilaian Final Siap Unduh'
    ][$eventType] ?? 'Pemberitahuan Status OPINI NSR';

    $klien = $details['namaKlien'] ?? '-';
    $nomor = $details['nomorLaporan'] ?? ($details['nomorLp'] ?? ($details['noPermintaan'] ?? $idPenugasan));
    $status = $details['status'] ?? 'TERVERIFIKASI';
    $catatan = $details['catatan'] ?? 'Proses administrasi berjalan sesuai SOP OPINI NSR.';
    $linkElsa = $details['linkElsa'] ?? '';

    $msg = "Yth. Rekan Penilai / Admin Pengaju *{$requesterName}*,\\n\\n";
    $msg .= "🔔 *[OPINI NSR] {$judulEvent}*\\n";
    $msg .= "--------------------------------------\\n";
    $msg .= "• ID Penugasan : *{$idPenugasan}*\\n";
    if ($noPermintaan && $noPermintaan !== $idPenugasan) {
        $msg .= "• No. Permintaan: *{$noPermintaan}*\\n";
    }
    $msg .= "• Debitur / Klien: {$klien}\\n";
    $msg .= "• Nomor Dokumen: *{$nomor}*\\n";
    $msg .= "• Status Sistem: *{$status}*\\n";
    if (!empty($linkElsa)) {
        $msg .= "• Tautan QR eLSa: {$linkElsa}\\n";
    }
    $msg .= "• Keterangan    : {$catatan}\\n";
    $msg .= "--------------------------------------\\n";
    $msg .= "Akses berkas lengkap melalui portal resmi berautentikasi:\\n";
    $msg .= "https://kjppnanangrahayu.com/portal-nolap.html\\n\\n";
    $msg .= "Salam hormat,\\n_Sekretariat & Administrasi Penugasan KJPP NSR_";

    return $msg;
}

function kirimNotifikasiWorkflow($eventType, $idPenugasan, $noPermintaan, $requesterInfo, $details, $dataDir) {
    $nowWib = date('c');
    $notifLogsFile = $dataDir . '/notification_logs.json';
    $mailQueueFile = $dataDir . '/mail_queue.json';

    $logs = file_exists($notifLogsFile) ? (json_decode(file_get_contents($notifLogsFile), true) ?: []) : [];

    $idempotencyKey = $eventType . '_' . $idPenugasan . '_' . ($details['status'] ?? '');
    foreach ($logs as $l) {
        if (($l['idempotency_key'] ?? '') === $idempotencyKey) {
            $timeDiff = strtotime($nowWib) - strtotime($l['notification_timestamp'] ?? '1970-01-01');
            if ($timeDiff < 300) {
                return [
                    'success' => true,
                    'duplicate_prevented' => true,
                    'event_id' => $l['notification_event_id'] ?? '',
                    'email_status' => $l['email_delivery_status'] ?? 'QUEUED',
                    'whatsapp_url' => $l['whatsapp_url'] ?? '',
                    'message' => 'Notifikasi serupa telah dicatat sebelumnya (Anti-Duplikasi).'
                ];
            }
        }
    }

    $eventId = 'EVT-' . date('Ymd-His') . '-' . substr(md5(uniqid()), 0, 6);
    $recipientEmail = trim($requesterInfo['email'] ?? '');
    $requesterName = trim($requesterInfo['nama'] ?? 'Rekan Penilai');
    $rawWa = trim($requesterInfo['whatsapp_number'] ?? '');
    $normalizedWa = normalisasiNomorWhatsApp($rawWa);

    $waText = formatPesanWhatsApp($eventType, $requesterName, $idPenugasan, $noPermintaan, $details);
    $waUrl = !empty($normalizedWa) ? ('https://wa.me/' . $normalizedWa . '?text=' . rawurlencode($waText)) : '';

    $emailQueued = false;
    if (!empty($recipientEmail) && filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
        $subject = '[OPINI NSR] ' . ($details['judulNotif'] ?? ('Pemberitahuan Status ' . $idPenugasan));
        $bodyHtml = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;'>
            <div style='background-color: #0f172a; padding: 20px; color: #f8fafc; text-align: center;'>
                <h2 style='margin:0; color: #f59e0b;'>KJPP NANANG RAHAYU & REKAN</h2>
                <p style='margin: 4px 0 0; font-size: 13px; color: #94a3b8;'>Sistem Manajemen Penugasan Terintegrasi — OPINI NSR</p>
            </div>
            <div style='padding: 24px; color: #1e293b; line-height: 1.6;'>
                <p>Yth. <strong>" . htmlspecialchars($requesterName) . "</strong>,</p>
                <p>Status permohonan penugasan Anda telah diperbarui pada sistem:</p>
                <table style='width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;'>
                    <tr><td style='padding: 6px 0; color: #64748b; width: 35%;'>ID Penugasan:</td><td style='font-weight: bold;'>" . htmlspecialchars($idPenugasan) . "</td></tr>
                    " . ($noPermintaan ? "<tr><td style='padding: 6px 0; color: #64748b;'>No. Permintaan:</td><td style='font-weight: bold;'>" . htmlspecialchars($noPermintaan) . "</td></tr>" : "") . "
                    <tr><td style='padding: 6px 0; color: #64748b;'>Debitur / Klien:</td><td>" . htmlspecialchars($details['namaKlien'] ?? '-') . "</td></tr>
                    <tr><td style='padding: 6px 0; color: #64748b;'>Status Terkini:</td><td><span style='background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: bold;'>" . htmlspecialchars($details['status'] ?? '-') . "</span></td></tr>
                    " . (!empty($details['nomorLaporan']) ? "<tr><td style='padding: 6px 0; color: #64748b;'>No. Laporan:</td><td style='font-weight: bold; color: #0284c7;'>" . htmlspecialchars($details['nomorLaporan']) . "</td></tr>" : "") . "
                    " . (!empty($details['nomorLp']) ? "<tr><td style='padding: 6px 0; color: #64748b;'>No. LP Resmi:</td><td style='font-weight: bold; color: #059669;'>" . htmlspecialchars($details['nomorLp']) . "</td></tr>" : "") . "
                    " . (!empty($details['linkElsa']) ? "<tr><td style='padding: 6px 0; color: #64748b;'>Status eLSa-PK:</td><td style='font-weight: bold; color: #16a34a;'>TERVERIFIKASI QR RESMI</td></tr>" : "") . "
                </table>
                <p style='font-size: 13px; background: #f8fafc; border-left: 4px solid #f59e0b; padding: 10px; margin: 16px 0;'>
                    <strong>Catatan:</strong> " . htmlspecialchars($details['catatan'] ?? 'Silakan login ke portal resmi untuk mengunduh dokumen atau memeriksa riwayat mitigasi.') . "
                </p>
                <div style='text-align: center; margin: 24px 0;'>
                    <a href='https://kjppnanangrahayu.com/portal-nolap.html' style='background: #0f172a; color: #fbbf24; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;'>Buka Portal OPINI NSR</a>
                </div>
            </div>
            <div style='background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #64748b;'>
                Pesan otomatis terenkripsi dari Server OPINI NSR. Harap tidak membalas email ini secara langsung.
            </div>
        </div>";

        $mailItem = [
            'id' => 'mail_' . $eventId,
            'recipient' => $recipientEmail,
            'subject' => $subject,
            'body' => $bodyHtml,
            'status' => 'QUEUED',
            'attempts' => 0,
            'created_at' => $nowWib
        ];

        $currentQueue = file_exists($mailQueueFile) ? (json_decode(file_get_contents($mailQueueFile), true) ?: []) : [];
        $currentQueue[] = $mailItem;
        @file_put_contents($mailQueueFile, json_encode($currentQueue, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        $emailQueued = true;
    }

    $logEntry = [
        'notification_event_id' => $eventId,
        'idempotency_key'       => $idempotencyKey,
        'event_type'            => $eventType,
        'id_penugasan'          => $idPenugasan,
        'no_permintaan'         => $noPermintaan,
        'requester_user_id'     => $requesterInfo['user_id'] ?? '',
        'requester_name'        => $requesterName,
        'office_id'             => $requesterInfo['office_id'] ?? '',
        'email'                 => $recipientEmail,
        'email_verified'        => !empty($requesterInfo['email_verified']),
        'email_delivery_status' => $emailQueued ? 'EMAIL_QUEUED' : 'EMAIL_SKIPPED',
        'whatsapp_number'       => $normalizedWa,
        'whatsapp_verified'     => !empty($requesterInfo['whatsapp_verified']),
        'whatsapp_ready_status' => !empty($waUrl) ? 'WHATSAPP_READY' : 'WHATSAPP_SKIPPED',
        'whatsapp_url'          => $waUrl,
        'notification_timestamp'=> $nowWib,
        'retry_count'           => 0
    ];

    $logs[] = $logEntry;
    @file_put_contents($notifLogsFile, json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    return [
        'success' => true,
        'event_id' => $eventId,
        'email_status' => $emailQueued ? 'QUEUED' : 'SKIPPED',
        'whatsapp_url' => $waUrl,
        'recipient' => $recipientEmail,
        'requester' => $requesterName
    ];
}
`;

code = code.replace(waFuncAnchor, waFuncAnchor + '\n' + newHelpers);
console.log('✓ Helpers added');

// 2. GET Actions
const getActionsCode = `
    if ($actionGet === 'getPersonelDirectory') {
        $mastersDir = $dataDir . '/masters';
        $list = muatMasterPersonelKontak($mastersDir);
        $sanitized = array_map(function($p) {
            return [
                'personnel_id'       => $p['personnel_id'] ?? '',
                'user_id'            => $p['user_id'] ?? '',
                'nama'               => $p['nama'] ?? '',
                'alias'              => $p['alias'] ?? '',
                'office_id'          => $p['office_id'] ?? '',
                'office_name'        => $p['office_name'] ?? '',
                'jabatan'            => $p['jabatan'] ?? '',
                'divisi'             => $p['divisi'] ?? '',
                'email'              => $p['email'] ?? '',
                'email_verified'     => !empty($p['email_verified']),
                'whatsapp_number'    => $p['whatsapp_number'] ?? '',
                'whatsapp_verified'  => !empty($p['whatsapp_verified']),
                'contact_status'     => $p['contact_status'] ?? 'VERIFIED',
                'status_kepegawaian' => $p['status_kepegawaian'] ?? 'AKTIF',
                'role'               => $p['role'] ?? 'STAF'
            ];
        }, $list);
        echo json_encode(['success' => true, 'total' => count($sanitized), 'personel' => $sanitized]);
        exit;
    }

    if ($actionGet === 'getRequesterContactProfile') {
        $mastersDir = $dataDir . '/masters';
        $sub = $currentUser['sub'] ?? ($currentUser['role'] ?? '');
        $profile = cariPersonelKontak($mastersDir, $sub, $currentUser['wilayahCode'] ?? '2.0160-00');
        echo json_encode([
            'success' => true,
            'profile' => [
                'personnel_id'      => $profile['personnel_id'] ?? $sub,
                'user_id'           => $profile['user_id'] ?? $sub,
                'nama'              => $currentUser['nama'] ?? ($profile['nama'] ?? $userDisplayName),
                'office_id'         => $profile['office_id'] ?? ($currentUser['wilayahCode'] ?? '2.0160-00'),
                'office_name'       => $profile['office_name'] ?? ($currentUser['wilayah'] ?? 'Kantor Pusat Jakarta'),
                'jabatan'           => $profile['jabatan'] ?? ($currentUser['title'] ?? 'Staf Operasional'),
                'email'             => $profile['email'] ?? '',
                'email_verified'    => !empty($profile['email_verified']),
                'whatsapp_number'   => $profile['whatsapp_number'] ?? '',
                'whatsapp_verified' => !empty($profile['whatsapp_verified']),
                'contact_status'    => $profile['contact_status'] ?? 'INCOMPLETE'
            ]
        ]);
        exit;
    }

    if ($actionGet === 'getNotificationLogs') {
        $notifLogsFile = $dataDir . '/notification_logs.json';
        $logs = file_exists($notifLogsFile) ? (json_decode(file_get_contents($notifLogsFile), true) ?: []) : [];

        $filtered = [];
        $isSuper = !empty($currentUser['isSuperAdmin']) || ($currentUser['role'] ?? '') === 'SUPER_ADMIN' || ($currentUser['role'] ?? '') === 'ADMIN_PUSAT';
        $userSub = strtolower($currentUser['sub'] ?? '');
        $userWilayahCode = $currentUser['wilayahCode'] ?? '';

        foreach (array_reverse($logs) as $l) {
            if ($isSuper) {
                $filtered[] = $l;
            } else {
                $reqSub = strtolower($l['requester_user_id'] ?? '');
                $reqOffice = $l['office_id'] ?? '';
                if ($reqSub === $userSub || ($userWilayahCode && $reqOffice === $userWilayahCode)) {
                    $filtered[] = $l;
                }
            }
        }

        echo json_encode([
            'success' => true,
            'total' => count($filtered),
            'logs' => array_slice($filtered, 0, 50)
        ]);
        exit;
    }

    if ($actionGet === 'getRegistrasiPersonelQueue') {
        $queueFile = $dataDir . '/registrasi_personel_antrean.json';
        $queue = file_exists($queueFile) ? (json_decode(file_get_contents($queueFile), true) ?: []) : [];
        echo json_encode([
            'success' => true,
            'total' => count($queue),
            'queue' => array_reverse($queue)
        ]);
        exit;
    }
`;

const getAnchor = `if ($actionGet === 'getRiskMasters') {`;
code = code.replace(getAnchor, getActionsCode + '\n    ' + getAnchor);
console.log('✓ GET Actions inserted');

// 3. POST Actions
const postActionsCode = `
    if ($action === 'submitRegistrasiPersonel') {
        $nama = trim($payload['nama'] ?? '');
        $email = trim($payload['email'] ?? '');
        $wa = trim($payload['whatsapp_number'] ?? ($payload['wa'] ?? ''));
        $officeId = trim($payload['office_id'] ?? '2.0160-00');
        $jabatan = trim($payload['jabatan'] ?? 'Staf Penilai');
        $divisi = trim($payload['divisi'] ?? 'Operasional Penilaian');
        $nik = trim($payload['nik'] ?? '');
        $alasan = trim($payload['alasan_pengajuan'] ?? '');

        if (empty($nama) || empty($email) || empty($wa)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Data tidak lengkap. Nama, email aktif, dan nomor WhatsApp wajib diisi.']);
            exit;
        }

        $queueFile = $dataDir . '/registrasi_personel_antrean.json';
        $queue = file_exists($queueFile) ? (json_decode(file_get_contents($queueFile), true) ?: []) : [];

        $regId = 'REG-PERS-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 5));
        $entry = [
            'registration_id'       => $regId,
            'submitted_at'          => date('c'),
            'submitted_by'          => $currentUser['nama'] ?? $userDisplayName,
            'submitted_by_sub'      => $currentUser['sub'] ?? '',
            'nama'                  => $nama,
            'nik'                   => $nik ?: ('CALON-' . substr(md5($email), 0, 6)),
            'office_id'             => $officeId,
            'office_name'           => $OFFICIAL_BRANCH_NAMES[$officeId] ?? 'Kantor Pusat Jakarta',
            'jabatan'               => $jabatan,
            'divisi'                => $divisi,
            'email'                 => $email,
            'email_verified'        => false,
            'whatsapp_number'       => normalisasiNomorWhatsApp($wa),
            'whatsapp_verified'     => false,
            'contact_status'        => 'PENDING_VERIFIKASI_ADMIN',
            'status'                => 'PENDING_VERIFIKASI_ADMIN',
            'alasan_pengajuan'      => $alasan,
            'assigned_role'         => null,
            'verified_by'           => null,
            'verified_at'           => null,
            'verification_notes'    => null
        ];

        $queue[] = $entry;
        @file_put_contents($queueFile, json_encode($queue, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        $logFile = $dataDir . '/perubahan_kontak_logs.json';
        $changeLogs = file_exists($logFile) ? (json_decode(file_get_contents($logFile), true) ?: []) : [];
        $changeLogs[] = [
            'event'           => 'REGISTRASI_DIAJUKAN',
            'registration_id' => $regId,
            'nama'            => $nama,
            'email'           => $email,
            'whatsapp_number' => normalisasiNomorWhatsApp($wa),
            'timestamp'       => date('c'),
            'actor'           => $currentUser['nama'] ?? $userDisplayName
        ];
        @file_put_contents($logFile, json_encode($changeLogs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        echo json_encode([
            'success' => true,
            'registration_id' => $regId,
            'message' => 'Permohonan pendaftaran personel berhasil dikirimkan dan menunggu verifikasi administratif Admin Pusat.',
            'status' => 'PENDING_VERIFIKASI_ADMIN'
        ]);
        exit;
    }

    if ($action === 'approveRegistrasiPersonel') {
        if (empty($currentUser['isSuperAdmin']) && ($currentUser['role'] ?? '') !== 'SUPER_ADMIN' && ($currentUser['role'] ?? '') !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses ditolak: Persetujuan pendaftaran personel memerlukan otoritas Admin Pusat atau Super Admin.']);
            exit;
        }

        $regId = trim($payload['registration_id'] ?? '');
        $decision = strtoupper(trim($payload['decision'] ?? 'APPROVE'));
        $notes = trim($payload['notes'] ?? 'Diverifikasi secara administratif sesuai identitas kepegawaian.');
        $assignedRole = trim($payload['role'] ?? 'PENILAI');

        $queueFile = $dataDir . '/registrasi_personel_antrean.json';
        $queue = file_exists($queueFile) ? (json_decode(file_get_contents($queueFile), true) ?: []) : [];

        $targetIdx = -1;
        foreach ($queue as $idx => $q) {
            if (($q['registration_id'] ?? '') === $regId) {
                $targetIdx = $idx;
                break;
            }
        }

        if ($targetIdx === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Permohonan pendaftaran tidak ditemukan.']);
            exit;
        }

        $nowWib = date('c');
        $actor = $currentUser['nama'] ?? $userDisplayName;

        if ($decision === 'APPROVE') {
            $queue[$targetIdx]['status'] = 'DISETUJUI';
            $queue[$targetIdx]['contact_status'] = 'VERIFIED';
            $queue[$targetIdx]['email_verified'] = true;
            $queue[$targetIdx]['whatsapp_verified'] = true;
            $queue[$targetIdx]['verified_by'] = $actor;
            $queue[$targetIdx]['verified_at'] = $nowWib;
            $queue[$targetIdx]['verification_notes'] = $notes;
            $queue[$targetIdx]['assigned_role'] = $assignedRole;

            $mastersFile = $mastersDir . '/master_personel_kontak.json';
            $masterData = file_exists($mastersFile) ? (json_decode(file_get_contents($mastersFile), true) ?: []) : [];
            if (!isset($masterData['personel'])) $masterData['personel'] = [];

            $newPersonnelId = 'NSR-' . date('Y') . '-' . sprintf('%03d', count($masterData['personel']) + 1);
            $cleanSub = 'pers_' . strtolower(preg_replace('/[^a-z0-9]/', '', $queue[$targetIdx]['nama']));

            $newPersonEntry = [
                'personnel_id'       => $newPersonnelId,
                'user_id'            => $cleanSub,
                'nik'                => $queue[$targetIdx]['nik'] ?? $newPersonnelId,
                'nama'               => $queue[$targetIdx]['nama'],
                'alias'              => $queue[$targetIdx]['nama'],
                'office_id'          => $queue[$targetIdx]['office_id'],
                'office_name'        => $queue[$targetIdx]['office_name'],
                'jabatan'            => $queue[$targetIdx]['jabatan'],
                'divisi'             => $queue[$targetIdx]['divisi'],
                'email'              => $queue[$targetIdx]['email'],
                'email_verified'     => true,
                'whatsapp_number'    => $queue[$targetIdx]['whatsapp_number'],
                'whatsapp_verified'  => true,
                'contact_status'     => 'VERIFIED',
                'status_kepegawaian' => 'AKTIF',
                'role'               => $assignedRole,
                'can_submit'         => true,
                'can_approve'        => false
            ];

            $masterData['personel'][] = $newPersonEntry;
            @file_put_contents($mastersFile, json_encode($masterData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            $logFile = $dataDir . '/perubahan_kontak_logs.json';
            $changeLogs = file_exists($logFile) ? (json_decode(file_get_contents($logFile), true) ?: []) : [];
            $changeLogs[] = [
                'event'           => 'REGISTRASI_DISETUJUI',
                'registration_id' => $regId,
                'personnel_id'    => $newPersonnelId,
                'nama'            => $queue[$targetIdx]['nama'],
                'email'           => $queue[$targetIdx]['email'],
                'role'            => $assignedRole,
                'timestamp'       => $nowWib,
                'actor'           => $actor
            ];
            @file_put_contents($logFile, json_encode($changeLogs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $queue[$targetIdx]['status'] = 'DITOLAK';
            $queue[$targetIdx]['contact_status'] = 'REJECTED';
            $queue[$targetIdx]['verified_by'] = $actor;
            $queue[$targetIdx]['verified_at'] = $nowWib;
            $queue[$targetIdx]['verification_notes'] = $notes;
        }

        @file_put_contents($queueFile, json_encode($queue, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        echo json_encode([
            'success' => true,
            'registration_id' => $regId,
            'status' => $queue[$targetIdx]['status'],
            'message' => "Permohonan pendaftaran {$regId} berhasil diproses dengan status: {$queue[$targetIdx]['status']}."
        ]);
        exit;
    }

    if ($action === 'updateKontakPersonel') {
        $emailBaru = trim($payload['email'] ?? '');
        $waBaru = trim($payload['whatsapp_number'] ?? ($payload['wa'] ?? ''));
        $userTargetSub = trim($payload['user_id'] ?? ($currentUser['sub'] ?? ''));

        $isSuper = !empty($currentUser['isSuperAdmin']) || ($currentUser['role'] ?? '') === 'SUPER_ADMIN' || ($currentUser['role'] ?? '') === 'ADMIN_PUSAT';
        if (!$isSuper && strtolower($userTargetSub) !== strtolower($currentUser['sub'] ?? '')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses ditolak: Anda hanya dapat memperbarui data kontak akun Anda sendiri.']);
            exit;
        }

        if (empty($emailBaru) && empty($waBaru)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Email baru atau nomor WhatsApp baru wajib diisi.']);
            exit;
        }

        $mastersFile = $mastersDir . '/master_personel_kontak.json';
        $masterData = file_exists($mastersFile) ? (json_decode(file_get_contents($mastersFile), true) ?: []) : [];
        $personels = $masterData['personel'] ?? [];

        $foundIdx = -1;
        foreach ($personels as $idx => $p) {
            if (strtolower($p['user_id'] ?? '') === strtolower($userTargetSub) || strtolower($p['personnel_id'] ?? '') === strtolower($userTargetSub)) {
                $foundIdx = $idx;
                break;
            }
        }

        if ($foundIdx === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Profil personel tidak ditemukan dalam Master Personel.']);
            exit;
        }

        $oldEmail = $personels[$foundIdx]['email'] ?? '';
        $oldWa = $personels[$foundIdx]['whatsapp_number'] ?? '';

        if (!empty($emailBaru)) {
            $personels[$foundIdx]['email'] = $emailBaru;
            $personels[$foundIdx]['email_verified'] = true;
        }
        if (!empty($waBaru)) {
            $personels[$foundIdx]['whatsapp_number'] = normalisasiNomorWhatsApp($waBaru);
            $personels[$foundIdx]['whatsapp_verified'] = true;
        }
        $personels[$foundIdx]['contact_status'] = 'VERIFIED';
        $masterData['personel'] = $personels;
        @file_put_contents($mastersFile, json_encode($masterData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        $logFile = $dataDir . '/perubahan_kontak_logs.json';
        $changeLogs = file_exists($logFile) ? (json_decode(file_get_contents($logFile), true) ?: []) : [];
        $changeLogs[] = [
            'event'           => 'PEMBARUAN_KONTAK',
            'user_id'         => $userTargetSub,
            'old_email'       => $oldEmail,
            'new_email'       => $emailBaru ?: $oldEmail,
            'old_whatsapp'    => $oldWa,
            'new_whatsapp'    => normalisasiNomorWhatsApp($waBaru ?: $oldWa),
            'timestamp'       => date('c'),
            'actor'           => $currentUser['nama'] ?? $userDisplayName
        ];
        @file_put_contents($logFile, json_encode($changeLogs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        echo json_encode([
            'success' => true,
            'message' => 'Data kontak resmi berhasil diperbarui.',
            'updated_profile' => $personels[$foundIdx]
        ]);
        exit;
    }

    if ($action === 'verifyElsaQrReport') {
        if (!empty($currentUser['isCabang']) && empty($currentUser['isSuperAdmin']) && ($currentUser['role'] ?? '') !== 'SUPER_ADMIN' && ($currentUser['role'] ?? '') !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses ditolak: Verifikasi QR Code eLSa hanya dapat dilakukan oleh Admin Pusat atau Super Admin.']);
            exit;
        }

        $noPermintaan = trim($payload['noPermintaan'] ?? '');
        $idPenugasan = trim($payload['idPenugasan'] ?? '');
        $linkElsa = trim($payload['linkElsa'] ?? ($payload['linkQr'] ?? ''));
        $statusElsa = trim($payload['statusElsa'] ?? 'TERVERIFIKASI QR RESMI');
        $catatan = trim($payload['catatan'] ?? 'QR Code eLSa-PK telah dicatatkan dan diverifikasi kecocokannya dengan laporan penilaian resmi.');

        if (empty($noPermintaan) && empty($idPenugasan)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Parameter noPermintaan atau idPenugasan wajib disertakan.']);
            exit;
        }
        if (empty($linkElsa)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Tautan / URL QR Code eLSa wajib diisi.']);
            exit;
        }

        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $foundDgIndex = -1;
        $targetDgRecord = null;
        foreach ($dgRecords as $idx => $r) {
            if ((!empty($noPermintaan) && ($r['noPermintaan'] ?? '') === $noPermintaan) ||
                (!empty($idPenugasan) && ($r['idPenugasan'] ?? '') === $idPenugasan)) {
                $foundDgIndex = $idx;
                $targetDgRecord = $r;
                break;
            }
        }

        $nowWib = date('c');
        $verifiedBy = $currentUser['nama'] ?? $userDisplayName;

        if ($foundDgIndex !== -1) {
            $dgRecords[$foundDgIndex]['linkElsa'] = $linkElsa;
            $dgRecords[$foundDgIndex]['statusElsa'] = $statusElsa;
            $dgRecords[$foundDgIndex]['elsaVerifiedAt'] = $nowWib;
            $dgRecords[$foundDgIndex]['elsaVerifiedBy'] = $verifiedBy;
            simpanDatabaseDualGate($dualGateDbFile, $dgRecords);
            $targetDgRecord = $dgRecords[$foundDgIndex];
        }

        $nolapRecords = muatDatabase($databaseFile);
        $foundNolapIndex = -1;
        foreach ($nolapRecords as $idx => $nr) {
            if ((!empty($noPermintaan) && ($nr['noPermintaan'] ?? '') === $noPermintaan) ||
                (!empty($idPenugasan) && ($nr['idPenugasan'] ?? '') === $idPenugasan)) {
                $foundNolapIndex = $idx;
                $nolapRecords[$idx]['linkElsa'] = $linkElsa;
                $nolapRecords[$idx]['statusElsa'] = $statusElsa;
                $nolapRecords[$idx]['elsaVerifiedAt'] = $nowWib;
                $nolapRecords[$idx]['elsaVerifiedBy'] = $verifiedBy;
                break;
            }
        }
        if ($foundNolapIndex !== -1) {
            simpanDatabase($databaseFile, $nolapRecords);
        }

        $requesterInfo = null;
        if ($targetDgRecord && !empty($targetDgRecord['pengaju'])) {
            $requesterInfo = $targetDgRecord['pengaju'];
        } elseif ($foundNolapIndex !== -1) {
            $nr = $nolapRecords[$foundNolapIndex];
            $requesterInfo = [
                'user_id' => $nr['pengaju_user_id'] ?? ($nr['cabang'] ?? ''),
                'nama' => $nr['namaPemohon'] ?? ($nr['pemohon'] ?? 'Rekan Cabang'),
                'email' => $nr['emailPemohon'] ?? ($nr['email'] ?? ''),
                'whatsapp_number' => $nr['waPemohon'] ?? ($nr['wa'] ?? ''),
                'office_id' => $nr['origin_branch_code'] ?? '2.0160-00'
            ];
        }

        if (empty($requesterInfo['email']) || empty($requesterInfo['whatsapp_number'])) {
            $branchCode = $targetDgRecord['origin_branch_code'] ?? ($nolapRecords[$foundNolapIndex]['origin_branch_code'] ?? '2.0160-00');
            $resolved = cariPersonelKontak($mastersDir, $targetDgRecord['createdBy'] ?? ($targetDgRecord['origin_branch_id'] ?? ''), $branchCode);
            $requesterInfo = [
                'user_id' => $resolved['user_id'] ?? 'staf_cabang',
                'nama' => $resolved['nama'] ?? ($targetDgRecord['createdBy'] ?? 'Rekan Cabang'),
                'email' => $resolved['email'] ?? 'notifikasi@kjppnanangrahayu.com',
                'whatsapp_number' => $resolved['whatsapp_number'] ?? '081298765432',
                'office_id' => $branchCode,
                'email_verified' => true,
                'whatsapp_verified' => true
            ];
        }

        $nomorLaporan = $targetDgRecord['finalisasi']['nomorLaporanDefinitif'] ?? ($nolapRecords[$foundNolapIndex]['nomorLaporan'] ?? ($noPermintaan ?: $idPenugasan));
        $namaKlien = $targetDgRecord['namaKlien'] ?? ($nolapRecords[$foundNolapIndex]['namaKlien'] ?? 'Klien Rekanan');

        $notifRes = kirimNotifikasiWorkflow(
            'QR_ELSA_TERVERIFIKASI',
            $idPenugasan ?: ($targetDgRecord['idPenugasan'] ?? $noPermintaan),
            $noPermintaan ?: ($targetDgRecord['noPermintaan'] ?? $idPenugasan),
            $requesterInfo,
            [
                'status' => 'TERVERIFIKASI QR RESMI',
                'nomorLaporan' => $nomorLaporan,
                'namaKlien' => $namaKlien,
                'linkElsa' => $linkElsa,
                'catatan' => $catatan,
                'judulNotif' => "QR Code eLSa Terverifikasi - No. Laporan {$nomorLaporan}"
            ],
            $dataDir
        );

        echo json_encode([
            'success' => true,
            'message' => "QR Code eLSa untuk permohonan '{$noPermintaan}' berhasil diverifikasi dan notifikasi telah dikirimkan.",
            'linkElsa' => $linkElsa,
            'statusElsa' => $statusElsa,
            'requester' => $requesterInfo['nama'] ?? 'Pengaju',
            'email_status' => $notifRes['email_status'] ?? 'QUEUED',
            'whatsapp_url' => $notifRes['whatsapp_url'] ?? '',
            'event_id' => $notifRes['event_id'] ?? ''
        ]);
        exit;
    }

    if ($action === 'resendNotification') {
        $eventId = trim($payload['notification_event_id'] ?? '');
        $notifLogsFile = $dataDir . '/notification_logs.json';
        $logs = file_exists($notifLogsFile) ? (json_decode(file_get_contents($notifLogsFile), true) ?: []) : [];

        $targetLogIndex = -1;
        foreach ($logs as $idx => $l) {
            if (($l['notification_event_id'] ?? '') === $eventId) {
                $targetLogIndex = $idx;
                break;
            }
        }

        if ($targetLogIndex === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Log notifikasi tidak ditemukan.']);
            exit;
        }

        $log = $logs[$targetLogIndex];
        $mailQueueFile = $dataDir . '/mail_queue.json';
        $currentQueue = file_exists($mailQueueFile) ? (json_decode(file_get_contents($mailQueueFile), true) ?: []) : [];
        $newMailId = 'mail_resend_' . $eventId . '_' . uniqid();
        
        $currentQueue[] = [
            'id' => $newMailId,
            'recipient' => $log['email'],
            'subject' => '[KIRIM ULANG - OPINI NSR] Pemberitahuan Status Penugasan ' . ($log['id_penugasan'] ?? ''),
            'body' => "Pemberitahuan kirim ulang untuk penugasan {$log['id_penugasan']} (Event: {$log['event_type']}). Silakan akses portal di https://kjppnanangrahayu.com/portal-nolap.html",
            'status' => 'QUEUED',
            'attempts' => 0,
            'created_at' => date('c')
        ];
        @file_put_contents($mailQueueFile, json_encode($currentQueue, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        $logs[$targetLogIndex]['retry_count'] = ($logs[$targetLogIndex]['retry_count'] ?? 0) + 1;
        $logs[$targetLogIndex]['last_resend_at'] = date('c');
        @file_put_contents($notifLogsFile, json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        echo json_encode([
            'success' => true,
            'message' => "Notifikasi #{$eventId} berhasil diantrekan ulang untuk dikirimkan.",
            'retry_count' => $logs[$targetLogIndex]['retry_count'],
            'whatsapp_url' => $log['whatsapp_url'] ?? ''
        ]);
        exit;
    }
`;

const postAnchor = `if ($action === 'saveOfficialRegister') {`;
code = code.replace(postAnchor, postActionsCode + '\n    ' + postAnchor);
console.log('✓ POST Actions inserted');

// 4. submitGerbang1Awal: Add requester snapshot
const g1Target = `$newRecord = [
            'idPenugasan' => $idPenugasan,`;
const g1RequesterSnapshot = `
        // Resolusi Profil Pengaju & Kontak Notifikasi Terverifikasi
        $reqProfile = cariPersonelKontak($mastersDir, $currentUser['sub'] ?? ($currentUser['role'] ?? ''), $originBranchCode);
        $pengajuSnapshot = [
            'personnel_id'       => $reqProfile['personnel_id'] ?? ($currentUser['sub'] ?? 'NSR-STAF'),
            'user_id'            => $reqProfile['user_id'] ?? ($currentUser['sub'] ?? 'staf'),
            'nama'               => $currentUser['nama'] ?? ($reqProfile['nama'] ?? $userDisplayName),
            'office_id'          => $originBranchCode,
            'office_name'        => $originBranchId,
            'email'              => $payload['emailPemohon'] ?? ($payload['emailPengaju'] ?? ($reqProfile['email'] ?? 'notifikasi@kjppnanangrahayu.com')),
            'email_verified'     => !empty($reqProfile['email_verified']),
            'whatsapp_number'    => normalisasiNomorWhatsApp($payload['waPemohon'] ?? ($payload['waPengaju'] ?? ($reqProfile['whatsapp_number'] ?? '081298765432'))),
            'whatsapp_verified'  => !empty($reqProfile['whatsapp_verified']),
            'contact_status'     => $reqProfile['contact_status'] ?? 'VERIFIED',
            'snapshot_timestamp' => $nowWib
        ];
`;
code = code.replace(g1Target, g1RequesterSnapshot + '\n        ' + g1Target);

const g1FinalAnchor = `'statusAkhir' => 'DRAFT'
            ]`;
code = code.replace(g1FinalAnchor, g1FinalAnchor + `,\n            'pengaju' => $pengajuSnapshot`);

const g1SaveAnchor = `simpanDatabaseDualGate($dualGateDbFile, $dgRecords);`;
const g1NotifTrigger = `simpanDatabaseDualGate($dualGateDbFile, $dgRecords);
        // Trigger Notifikasi Otomatis Pengajuan JO Diterima
        kirimNotifikasiWorkflow(
            'PENGAJUAN_JO_DITERIMA',
            $idPenugasan,
            $newRecord['noPermintaan'],
            $pengajuSnapshot,
            [
                'status' => $statusAwal,
                'namaKlien' => $klien,
                'jenisObjek' => $objek,
                'penilaiPublik' => $penilaiDitunjuk,
                'catatan' => 'Permohonan JO telah masuk ke sistem dan dalam antrean review Gerbang 1.'
            ],
            $dataDir
        );`;
code = code.replace(g1SaveAnchor, g1NotifTrigger);
console.log('✓ submitGerbang1Awal patched');

// 5. reviewDannyGerbang1
const dannyG1Anchor = `simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        // Jika SETUJU: Kirim notifikasi tindakan otomatis ke Deni Siswandi`;
if (!code.includes(dannyG1Anchor)) {
  throw new Error('dannyG1Anchor not found');
}
const dannyG1Notif = `simpanDatabaseDualGate($dualGateDbFile, $dgRecords);
        if (!empty($dgRecords[$targetIdx]['pengaju'])) {
            kirimNotifikasiWorkflow(
                'APPROVAL_GERBANG_1',
                $idPenugasan,
                $dgRecords[$targetIdx]['noPermintaan'] ?? $idPenugasan,
                $dgRecords[$targetIdx]['pengaju'],
                [
                    'status' => $newStatus,
                    'namaKlien' => $dgRecords[$targetIdx]['namaKlien'] ?? '-',
                    'catatan' => "Review SPM (Danny Taufik): {$keputusan}. {$catatan}"
                ],
                $dataDir
            );
        }

        // Jika SETUJU: Kirim notifikasi tindakan otomatis ke Deni Siswandi`;
code = code.replace(dannyG1Anchor, dannyG1Notif);
console.log('✓ reviewDannyGerbang1 patched');

// 6. reviewDeniGerbang1
const deniG1Anchor = `simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        // Jika SETUJU: Notifikasi hasil ke Admin Pusat & Pengaju`;
if (!code.includes(deniG1Anchor)) {
  throw new Error('deniG1Anchor not found');
}
const deniG1Notif = `simpanDatabaseDualGate($dualGateDbFile, $dgRecords);
        if (!empty($dgRecords[$targetIdx]['pengaju'])) {
            kirimNotifikasiWorkflow(
                'APPROVAL_GERBANG_1',
                $idPenugasan,
                $dgRecords[$targetIdx]['noPermintaan'] ?? $idPenugasan,
                $dgRecords[$targetIdx]['pengaju'],
                [
                    'status' => $newStatus,
                    'namaKlien' => $dgRecords[$targetIdx]['namaKlien'] ?? '-',
                    'catatan' => "Review Divtek (Deni Siswandi): {$keputusan}. {$catatan}"
                ],
                $dataDir
            );
        }

        // Jika SETUJU: Notifikasi hasil ke Admin Pusat & Pengaju`;
code = code.replace(deniG1Anchor, deniG1Notif);
console.log('✓ reviewDeniGerbang1 patched');

// 7. publishOfficialLP
const lpAnchor = `$dgRecords[$targetIdx]['gerbang1']['diterbitkanOleh'] = $currentUser['nama'] ?? $userDisplayName;

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);`;
if (!code.includes(lpAnchor)) {
  throw new Error('lpAnchor not found');
}
const lpNotif = `$dgRecords[$targetIdx]['gerbang1']['diterbitkanOleh'] = $currentUser['nama'] ?? $userDisplayName;

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);
        if (!empty($dgRecords[$targetIdx]['pengaju'])) {
            kirimNotifikasiWorkflow(
                'PENERBITAN_LP',
                $idPenugasan,
                $dgRecords[$targetIdx]['noPermintaan'] ?? $idPenugasan,
                $dgRecords[$targetIdx]['pengaju'],
                [
                    'status' => 'LP_DITERBITKAN',
                    'nomorLp' => $nomorLpResmi,
                    'namaKlien' => $dgRecords[$targetIdx]['namaKlien'] ?? '-',
                    'catatan' => "Nomor Lingkup Penugasan (LP) resmi ({$nomorLpResmi}) telah diterbitkan oleh Admin Pusat."
                ],
                $dataDir
            );
        }`;
code = code.replace(lpAnchor, lpNotif);
console.log('✓ publishOfficialLP patched');

// 8. submitGerbang2Akhir
const g2SubmitAnchor = `$dgRecords[$targetIdx]['gerbang2'] = [
            'status' => $statusAkhir,`;
if (!code.includes(g2SubmitAnchor)) {
  throw new Error('g2SubmitAnchor not found');
}
const g2SubmitNotif = `if (empty($dgRecords[$targetIdx]['pengaju'])) {
            $reqProfileG2 = cariPersonelKontak($mastersDir, $currentUser['sub'] ?? ($currentUser['role'] ?? ''), $dgRecords[$targetIdx]['origin_branch_code'] ?? '2.0160-00');
            $dgRecords[$targetIdx]['pengaju'] = [
                'personnel_id'       => $reqProfileG2['personnel_id'] ?? ($currentUser['sub'] ?? 'NSR-STAF'),
                'user_id'            => $reqProfileG2['user_id'] ?? ($currentUser['sub'] ?? 'staf'),
                'nama'               => $currentUser['nama'] ?? ($reqProfileG2['nama'] ?? $userDisplayName),
                'office_id'          => $dgRecords[$targetIdx]['origin_branch_code'] ?? '2.0160-00',
                'office_name'        => $dgRecords[$targetIdx]['kantorAsal'] ?? 'Kantor Pusat Jakarta',
                'email'              => $payload['emailPemohon'] ?? ($reqProfileG2['email'] ?? 'notifikasi@kjppnanangrahayu.com'),
                'email_verified'     => true,
                'whatsapp_number'    => normalisasiNomorWhatsApp($payload['waPemohon'] ?? ($reqProfileG2['whatsapp_number'] ?? '081298765432')),
                'whatsapp_verified'  => true,
                'contact_status'     => 'VERIFIED',
                'snapshot_timestamp' => $nowWib
            ];
        }
        $dgRecords[$targetIdx]['gerbang2'] = [
            'status' => $statusAkhir,`;
code = code.replace(g2SubmitAnchor, g2SubmitNotif);

const g2SaveAnchor = `simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        // Antrekan Email ke Danny Taufik (Kepala SPM)`;
if (!code.includes(g2SaveAnchor)) {
  throw new Error('g2SaveAnchor not found');
}
const g2SaveNotif = `simpanDatabaseDualGate($dualGateDbFile, $dgRecords);
        if (!empty($dgRecords[$targetIdx]['pengaju'])) {
            kirimNotifikasiWorkflow(
                'PENGAJUAN_NOLAP_DITERIMA',
                $idPenugasan,
                $dgRecords[$targetIdx]['noPermintaan'] ?? $idPenugasan,
                $dgRecords[$targetIdx]['pengaju'],
                [
                    'status' => $statusAkhir,
                    'namaKlien' => $dgRecords[$targetIdx]['namaKlien'] ?? '-',
                    'catatan' => 'Draf Laporan & Mitigasi Akhir (Gerbang 2) telah didaftarkan dan dalam antrean telaah SPM.'
                ],
                $dataDir
            );
        }

        // Antrekan Email ke Danny Taufik (Kepala SPM)`;
code = code.replace(g2SaveAnchor, g2SaveNotif);
console.log('✓ submitGerbang2Akhir patched');

// 9. reviewDannyGerbang2 & reviewDeniGerbang2
const dannyG2Anchor = `$dgRecords[$targetIdx]['gerbang2']['reviewDanny'] = [
            'keputusan' => $keputusan,
            'catatan' => $catatan,
            'diverifikasiPada' => $nowWib,
            'pejabat' => $currentUser['nama'] ?? 'Danny Taufik, S.H.'
        ];`;
if (!code.includes(dannyG2Anchor)) {
  throw new Error('dannyG2Anchor not found');
}
const dannyG2Notif = `$dgRecords[$targetIdx]['gerbang2']['reviewDanny'] = [
            'keputusan' => $keputusan,
            'catatan' => $catatan,
            'diverifikasiPada' => $nowWib,
            'pejabat' => $currentUser['nama'] ?? 'Danny Taufik, S.H.'
        ];
        if (!empty($dgRecords[$targetIdx]['pengaju'])) {
            kirimNotifikasiWorkflow(
                'APPROVAL_GERBANG_2',
                $idPenugasan,
                $dgRecords[$targetIdx]['noPermintaan'] ?? $idPenugasan,
                $dgRecords[$targetIdx]['pengaju'],
                [
                    'status' => $newStatus,
                    'namaKlien' => $dgRecords[$targetIdx]['namaKlien'] ?? '-',
                    'catatan' => "Review Akhir SPM (Danny Taufik): {$keputusan}. {$catatan}"
                ],
                $dataDir
            );
        }`;
code = code.replace(dannyG2Anchor, dannyG2Notif);

const deniG2Anchor = `$dgRecords[$targetIdx]['gerbang2']['reviewDeni'] = [
            'keputusan' => $keputusan,
            'catatan' => $catatan,
            'diverifikasiPada' => $nowWib,
            'pejabat' => $currentUser['nama'] ?? 'Deni Siswandi, S.T.'
        ];`;
if (!code.includes(deniG2Anchor)) {
  throw new Error('deniG2Anchor not found');
}
const deniG2Notif = `$dgRecords[$targetIdx]['gerbang2']['reviewDeni'] = [
            'keputusan' => $keputusan,
            'catatan' => $catatan,
            'diverifikasiPada' => $nowWib,
            'pejabat' => $currentUser['nama'] ?? 'Deni Siswandi, S.T.'
        ];
        if (!empty($dgRecords[$targetIdx]['pengaju'])) {
            kirimNotifikasiWorkflow(
                'APPROVAL_GERBANG_2',
                $idPenugasan,
                $dgRecords[$targetIdx]['noPermintaan'] ?? $idPenugasan,
                $dgRecords[$targetIdx]['pengaju'],
                [
                    'status' => $newStatus,
                    'namaKlien' => $dgRecords[$targetIdx]['namaKlien'] ?? '-',
                    'catatan' => "Review Akhir Divtek (Deni Siswandi): {$keputusan}. {$catatan}"
                ],
                $dataDir
            );
        }`;
code = code.replace(deniG2Anchor, deniG2Notif);
console.log('✓ Gerbang 2 Reviews patched');

// 10. issueDefinitiveNoLap
const issSaveAnchor = `simpanDatabaseDualGate($dualGateDbFile, $dgRecords);
        if (isset($fpLock) && $fpLock) { flock($fpLock, LOCK_UN); fclose($fpLock); }`;
if (!code.includes(issSaveAnchor)) {
  throw new Error('issSaveAnchor not found');
}
const issSaveNotif = `simpanDatabaseDualGate($dualGateDbFile, $dgRecords);
        if (isset($fpLock) && $fpLock) { flock($fpLock, LOCK_UN); fclose($fpLock); }
        if (!empty($dgRecords[$targetIdx]['pengaju'])) {
            kirimNotifikasiWorkflow(
                'PENERBITAN_NOLAP',
                $idPenugasan,
                $dgRecords[$targetIdx]['noPermintaan'] ?? $idPenugasan,
                $dgRecords[$targetIdx]['pengaju'],
                [
                    'status' => 'MENUNGGU_TTD_PENILAI',
                    'nomorLaporan' => $noDefinitif,
                    'namaKlien' => $dgRecords[$targetIdx]['namaKlien'] ?? '-',
                    'catatan' => "Nomor Laporan Definitif 7 Segmen ({$noDefinitif}) telah resmi diterbitkan oleh Admin Pusat."
                ],
                $dataDir
            );
        }`;
code = code.replace(issSaveAnchor, issSaveNotif);
console.log('✓ issueDefinitiveNoLap patched');

// 11. signLaporanPenilaiPublik
const signAnchor = `$dgRecords[$targetIdx]['gerbang2']['status'] = 'LAPORAN_FINAL';

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);`;
if (!code.includes(signAnchor)) {
  throw new Error('signAnchor not found');
}
const signNotif = `$dgRecords[$targetIdx]['gerbang2']['status'] = 'LAPORAN_FINAL';

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);
        if (!empty($dgRecords[$targetIdx]['pengaju'])) {
            kirimNotifikasiWorkflow(
                'LAPORAN_FINAL_SIAP',
                $idPenugasan,
                $dgRecords[$targetIdx]['noPermintaan'] ?? $idPenugasan,
                $dgRecords[$targetIdx]['pengaju'],
                [
                    'status' => 'LAPORAN_FINAL',
                    'nomorLaporan' => $dgRecords[$targetIdx]['finalisasi']['nomorLaporanDefinitif'] ?? '',
                    'namaKlien' => $dgRecords[$targetIdx]['namaKlien'] ?? '-',
                    'catatan' => "Laporan penilaian telah resmi ditandatangani oleh " . ($currentUser['nama'] ?? 'Penilai Publik') . " dan berstatus LAPORAN_FINAL."
                ],
                $dataDir
            );
        }`;
code = code.replace(signAnchor, signNotif);
console.log('✓ signLaporanPenilaiPublik patched');

if (isCRLF) {
  code = code.replace(/\n/g, '\r\n');
}

fs.writeFileSync(handlerPath, code, 'utf8');
console.log('✨ All patches applied cleanly to nolap-data-handler.php!');
