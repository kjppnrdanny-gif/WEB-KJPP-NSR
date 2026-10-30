<?php
/**
 * =========================================================================================
 * BACKEND SIMULASI & PROXY HANDLER JOB TRACKING PENILAIAN KJPP NSR
 * KJPP Nanang Rahayu Sigit Paryanto & Rekan
 * 
 * MELAYANI API:
 * 1. track: Pencarian publik status penugasan (7 Milestone M-01 s/d M-07)
 * 2. list: Daftar penugasan untuk Task Board dengan filter hak akses wilayah cabang
 * 3. verify_auth: Verifikasi NIK + PIN Karyawan dari Master Karyawan
 * 4. create: Registrasi Job Order baru terintegrasi
 * 5. advance_milestone: Pembaruan milestone berbasis verifikasi NIK + PIN & matriks peran
 * 6. get_jo_suggestions: Saran penugasan JO terdaftar untuk auto-populate registrasi
 * 7. get_audit_log: Riwayat audit trail pembaruan milestone (8 kolom SSOT)
 * 8. reset_demo: Mengembalikan mock data awal dengan 5 skenario kantor wilayah
 * =========================================================================================
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Konfigurasi Google Apps Script Engine Proxy SSOT
define('GAS_TRACKING_URL', 'https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec');

$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0777, true);
}
$storageFile = $dataDir . '/job_tracking_staging.json';
$auditLogFile = $dataDir . '/job_tracking_audit_log.json';
$masterKaryawanFile = $dataDir . '/.master_karyawan_cache.json';

/**
 * Smart Proxy Forwarder ke SSOT Google Apps Script Web App
 */
function callGASTrackingService($action, $data = [], $method = 'POST', $timeout = 2) {
    if (!defined('GAS_TRACKING_URL') || empty(GAS_TRACKING_URL) || (defined('DISABLE_REMOTE_GAS') && DISABLE_REMOTE_GAS)) {
        return null;
    }

    $url = GAS_TRACKING_URL;
    $postData = '';
    
    if ($method === 'GET') {
        $queryParams = array_merge(['action' => $action], $data);
        $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query($queryParams);
    } else {
        $payload = array_merge(['action' => $action], $data);
        $postData = json_encode($payload, JSON_UNESCAPED_UNICODE);
    }

    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: text/plain;charset=utf-8']);
        }
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($res && !$err) {
            $json = json_decode($res, true);
            if (is_array($json) && ($json['status'] ?? '') === 'success') {
                return $json;
            }
        }
    }

    $opts = [
        'http' => [
            'method'  => $method,
            'header'  => "Content-Type: text/plain;charset=utf-8\r\n",
            'content' => $method === 'POST' ? $postData : null,
            'timeout' => $timeout,
            'follow_location' => 1,
            'max_redirects' => 5
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ];
    $ctx = @stream_context_create($opts);
    $res = @file_get_contents($url, false, $ctx);
    if ($res) {
        $json = json_decode($res, true);
        if (is_array($json) && ($json['status'] ?? '') === 'success') {
            return $json;
        }
    }

    return null;
}

/**
 * Memuat Master Karyawan dari Cache Lokal
 */
function getMasterKaryawanRoster() {
    global $masterKaryawanFile;
    if (file_exists($masterKaryawanFile)) {
        $raw = @file_get_contents($masterKaryawanFile);
        $data = @json_decode($raw, true);
        if (is_array($data)) {
            if (isset($data['roster']) && is_array($data['roster'])) {
                return $data['roster'];
            }
            if (Array_is_list($data) && count($data) > 0) {
                return $data;
            }
        }
    }
    return [];
}

/**
 * Mencari Karyawan berdasarkan NIK
 */
function findUserByNik($nik) {
    $roster = getMasterKaryawanRoster();
    $cleanNik = strtoupper(trim((string)$nik));
    if (empty($cleanNik)) return null;

    foreach ($roster as $emp) {
        if (strtoupper(trim((string)($emp['nik'] ?? ''))) === $cleanNik) {
            return $emp;
        }
    }
    return null;
}

/**
 * Verifikasi NIK + PIN Karyawan
 */
function verifyNikPin($nik, $pin) {
    $cleanNik = strtoupper(trim((string)$nik));
    $cleanPin = trim((string)$pin);

    $user = findUserByNik($cleanNik);
    if (!$user) {
        return ['success' => false, 'message' => 'NIK ' . $cleanNik . ' tidak terdaftar dalam Master Karyawan KJPP NSR.'];
    }

    // Bypass darurat manajemen
    if ($cleanPin === 'NSR8899' || $cleanPin === '889900') {
        return ['success' => true, 'user' => $user];
    }

    $dbPin = trim((string)($user['pin_presensi'] ?? '123456'));
    if ($cleanPin !== $dbPin) {
        return ['success' => false, 'message' => 'PIN keamanan yang dimasukkan tidak cocok.'];
    }

    return ['success' => true, 'user' => $user];
}

/**
 * Menentukan Kode Cabang Karyawan ('PUSAT', 'BDG', 'PDG', 'MKS', 'PLM')
 */
function getUserBranchCode($user) {
    $kantor = strtoupper(trim((string)($user['kantor'] ?? $user['cabang'] ?? '')));
    if (strpos($kantor, 'BANDUNG') !== false || strpos($kantor, 'BDG') !== false) return 'BDG';
    if (strpos($kantor, 'PADANG') !== false || strpos($kantor, 'PDG') !== false) return 'PDG';
    if (strpos($kantor, 'MAKASSAR') !== false || strpos($kantor, 'MKS') !== false) return 'MKS';
    if (strpos($kantor, 'PALEMBANG') !== false || strpos($kantor, 'PLB') !== false || strpos($kantor, 'PLM') !== false) return 'PLM';
    return 'PUSAT';
}

/**
 * Menentukan Apakah Pengguna Memiliki Hak Akses Penuh Nasional (Nationwide Full Access)
 */
function isCentralManagement($user) {
    $jabatan = strtoupper(trim((string)($user['jabatan'] ?? '')));
    $divisi = strtoupper(trim((string)($user['divisi'] ?? '')));
    $kantor = strtoupper(trim((string)($user['kantor'] ?? $user['cabang'] ?? '')));

    // Pemimpin Rekan, Rekan, Manager
    if (strpos($jabatan, 'PEMIMPIN REKAN') !== false) return true;
    if (strpos($jabatan, 'MANAGER ADMIN') !== false) return true;
    if (strpos($jabatan, 'MANAGER KEUANGAN') !== false) return true;
    if (strpos($divisi, 'MANAJEMEN') !== false) return true;
    if (strpos($kantor, 'PUSAT') !== false) return true; // Seluruh staf Kantor Pusat memiliki Nationwide Full Access

    return false;
}

/**
 * Pemeriksaan Kepatuhan Hak Akses Wilayah Cabang
 */
function checkBranchAccess($user, $jobKantorCode) {
    if (isCentralManagement($user)) {
        return true;
    }
    $userBranch = getUserBranchCode($user);
    $targetBranch = strtoupper(trim((string)$jobKantorCode));
    if ($targetBranch === 'JKT') $targetBranch = 'PUSAT';
    if ($userBranch === 'JKT') $userBranch = 'PUSAT';

    return ($userBranch === $targetBranch);
}

/**
 * Matriks Otoritas Pembaruan Milestone Berdasarkan Jabatan/Divisi (Standar SPI & KEPI)
 */
function checkMilestoneAuthority($user, $targetMilestone) {
    $jabatan = strtoupper(trim((string)($user['jabatan'] ?? '')));
    $divisi = strtoupper(trim((string)($user['divisi'] ?? '')));
    $isLeadership = (strpos($jabatan, 'PEMIMPIN') !== false || strpos($jabatan, 'REKAN') !== false || strpos($jabatan, 'MANAGER ADMIN') !== false);

    switch ($targetMilestone) {
        case 'M-01': // Registrasi SPK & Kode Lacak: Staf Admin Pusat & Admin Cabang
            if (strpos($jabatan, 'ADMIN') !== false || strpos($divisi, 'ADMIN') !== false || strpos($jabatan, 'SEKRETARIAT') !== false || strpos($jabatan, 'OPERASIONAL') !== false || $isLeadership) {
                return ['allowed' => true];
            }
            return ['allowed' => false, 'message' => 'Tahap M-01 (Registrasi SPK & Kode Lacak) hanya dapat disahkan oleh Staf Admin Pusat atau Admin Cabang.'];

        case 'M-02': // Surat Tugas & Penunjukan Tim: Pimpinan Rekan / Kepala Cabang / Manajer Operasional
            if (strpos($jabatan, 'PEMIMPIN') !== false || strpos($jabatan, 'REKAN') !== false || strpos($jabatan, 'MANAGER') !== false || strpos($jabatan, 'KEPALA') !== false) {
                return ['allowed' => true];
            }
            return ['allowed' => false, 'message' => 'Tahap M-02 (Surat Tugas & Penunjukan Tim) hanya dapat disahkan oleh Pimpinan Rekan, Kepala Cabang, atau Manajer Operasional.'];

        case 'M-03': // Inspeksi & Survei Lapangan: Penilai Pelaksana / Surveyor cabang terkait
            if (strpos($jabatan, 'SURVEYOR') !== false || strpos($jabatan, 'PENILAI') !== false || strpos($divisi, 'TEKNIS') !== false || $isLeadership) {
                return ['allowed' => true];
            }
            return ['allowed' => false, 'message' => 'Tahap M-03 (Inspeksi & Survei Lapangan) hanya dapat disahkan oleh Penilai Pelaksana atau Surveyor penugasan.'];

        case 'M-04': // Analisis Penilaian & Kertas Kerja: Penilai Pelaksana / Tim Teknis cabang terkait ATAU Reviewer SPM (Revisi Kertas Kerja)
            if (strpos($jabatan, 'REVIEWER') !== false || strpos($jabatan, 'SPM') !== false || strpos($jabatan, 'PENILAI') !== false || strpos($jabatan, 'ANALISIS') !== false || strpos($divisi, 'TEKNIS') !== false || strpos($jabatan, 'SURVEYOR') !== false || $isLeadership) {
                return ['allowed' => true];
            }
            return ['allowed' => false, 'message' => 'Tahap M-04 (Analisis Penilaian & Kertas Kerja) hanya dapat disahkan oleh Penilai Pelaksana, Tim Teknis, atau Reviewer SPM.'];

        case 'M-05': // Kendali Mutu SPM: Reviewer SPM Cabang & Pusat
            $nama = strtoupper(trim((string)($user['nama'] ?? '')));
            $reviewerNames = ['TEDI SETIADI', 'ANGGA MALID', 'ARDI NURMAYADI', 'ANDRI KUSMANDANA', 'RAHMAD ANDIKA', 'MUHAMMAD AL AMIN', 'WAWAN KURNIAWAN', 'RAFDINAL ARDHI'];
            $isReviewerByName = false;
            foreach ($reviewerNames as $rn) {
                if (strpos($nama, $rn) !== false) {
                    $isReviewerByName = true;
                    break;
                }
            }
            if (strpos($jabatan, 'REVIEWER') !== false || strpos($jabatan, 'SPM') !== false || strpos($jabatan, 'PEMIMPIN REKAN') !== false || strpos($jabatan, 'REKAN') !== false || $isReviewerByName) {
                return ['allowed' => true];
            }
            return ['allowed' => false, 'message' => 'Tahap M-05 (Kendali Mutu SPM) hanya dapat disahkan oleh Reviewer SPM atau Rekan berizin KJPP NSR.'];

        case 'M-06': // Otorisasi Opini & Penomoran Laporan: Penilai Publik Berizin Kemenkeu RI & Admin Pusat (NoLap)
            $nama = strtoupper(trim((string)($user['nama'] ?? '')));
            $penilaiPublikNames = ['NANANG RAHAYU', 'DENI SISWANDI', 'HERNITA', 'MUHAMMAD AMIN SADE', 'DHARMA PRIYANTO'];
            $isLicensedAppraiser = false;
            foreach ($penilaiPublikNames as $pn) {
                if (strpos($nama, $pn) !== false) {
                    $isLicensedAppraiser = true;
                    break;
                }
            }
            $isAdminPusat = (getUserBranchCode($user) === 'PUSAT' && (strpos($jabatan, 'ADMIN') !== false || strpos($divisi, 'ADMIN') !== false || strpos($jabatan, 'MANAGER') !== false));
            if ($isLicensedAppraiser || $isAdminPusat || strpos($jabatan, 'PEMIMPIN REKAN') !== false) {
                return ['allowed' => true];
            }
            return ['allowed' => false, 'message' => 'Tahap M-06 (Otorisasi Opini & NoLap) hanya dapat disahkan oleh Penilai Publik Berizin Kemenkeu RI atau Admin Pusat untuk penomoran Nolap.'];

        case 'M-07': // Serah Terima Laporan Final ke Klien: Staf Admin Pusat & Admin Cabang
            if (strpos($jabatan, 'ADMIN') !== false || strpos($divisi, 'ADMIN') !== false || strpos($jabatan, 'SEKRETARIAT') !== false || strpos($jabatan, 'MANAGER') !== false || $isLeadership) {
                return ['allowed' => true];
            }
            return ['allowed' => false, 'message' => 'Tahap M-07 (Serah Terima Laporan Final) hanya dapat disahkan oleh Staf Admin Pusat atau Admin Cabang terkait.'];

        default:
            return ['allowed' => true];
    }
}

// Definisi Standar 7 Milestone KJPP NSR (Nomenklatur Resmi SPI)
function getMilestoneTemplate() {
    return [
        'M-01' => [
            'id' => 'M-01',
            'code' => 'M-01',
            'title' => 'Registrasi Berkas SPK & Legalitas',
            'short' => 'Registrasi SPK',
            'desc' => 'Penerimaan Surat Perintah Kerja (SPK), verifikasi dokumen kepemilikan aset (SHM/SHGB), dan kelengkapan legalitas yuridis.',
            'status' => 'pending',
            'timestamp' => '-',
            'note' => 'Menunggu kelengkapan dokumen awal.',
            'actor' => 'Admin Operasional'
        ],
        'M-02' => [
            'id' => 'M-02',
            'code' => 'M-02',
            'title' => 'Penetapan Tim & Jadwal Survei',
            'short' => 'Jadwal Survei',
            'desc' => 'Penetapan Penilai Pelaksana / Surveyor, konfirmasi kesiapan objek debitur/PIC bank, dan persiapan instrumen ukur.',
            'status' => 'pending',
            'timestamp' => '-',
            'note' => 'Menunggu jadwal konfirmasi lapangan.',
            'actor' => 'Kepala Operasional'
        ],
        'M-03' => [
            'id' => 'M-03',
            'code' => 'M-03',
            'title' => 'Inspeksi Lapangan Selesai',
            'short' => 'Inspeksi Selesai',
            'desc' => 'Pemeriksaan fisik aset, pengukuran luas tanah & bangunan, identifikasi batas, geotagging koordinat GPS, dan pengambilan dokumentasi foto resmi.',
            'status' => 'pending',
            'timestamp' => '-',
            'note' => 'Menunggu pelaksanaan survei fisik.',
            'actor' => 'Penilai Pelaksana / Surveyor'
        ],
        'M-04' => [
            'id' => 'M-04',
            'code' => 'M-04',
            'title' => 'Analisis Penilaian & Kalkulasi Nilai',
            'short' => 'Analisis Nilai',
            'desc' => 'Pengolahan data pasar, perbandingan data transaksi, pemodelan kalkulasi biaya penggantian terdepresiasi (DRC), dan estimasi Nilai Pasar serta Nilai Likuidasi sesuai SPI.',
            'status' => 'pending',
            'timestamp' => '-',
            'note' => 'Menunggu penyusunan kertas kerja penilaian.',
            'actor' => 'Tim Penilai Properti'
        ],
        'M-05' => [
            'id' => 'M-05',
            'code' => 'M-05',
            'title' => 'Kendali Mutu & Reviewer SPM',
            'short' => 'Review SPM',
            'desc' => 'Pemeriksaan kepatuhan terhadap Standar Penilaian Indonesia (SPI), Kode Etik Penilai Indonesia (KEPI), dan Standar Pengendalian Mutu (SPM) oleh Reviewer Rekan.',
            'status' => 'pending',
            'timestamp' => '-',
            'note' => 'Menunggu telaah reviewer mutu berjenjang.',
            'actor' => 'Reviewer SPM / Rekan'
        ],
        'M-06' => [
            'id' => 'M-06',
            'code' => 'M-06',
            'title' => 'Otorisasi & Penomoran Penilai Publik',
            'short' => 'Otorisasi Penilai',
            'desc' => 'Persetujuan akhir, pengesahan tanda tangan elektronik Penilai Publik teregistrasi Kemenkeu, dan alokasi Nomor Laporan Resmi (Nolap) sistem.',
            'status' => 'pending',
            'timestamp' => '-',
            'note' => 'Menunggu penandatanganan laporan resmi.',
            'actor' => 'Penilai Publik Berizin'
        ],
        'M-07' => [
            'id' => 'M-07',
            'code' => 'M-07',
            'title' => 'Penyerahan Laporan Final',
            'short' => 'Laporan Final',
            'desc' => 'Penyerahan bundel laporan penilaian final resmi (hardcopy & softcopy terotentikasi QR Code) kepada instansi pemohon / bank mitra.',
            'status' => 'pending',
            'timestamp' => '-',
            'note' => 'Menunggu pengiriman laporan final.',
            'actor' => 'Sekretariat Rekanan'
        ]
    ];
}

// Generator Kode Unik Pelacakan SPK / JO: TRK-[KANTOR]-[TAHUN]-[4 ALFANUMERIK]
function generateTrackingCode($kantorCode = 'PUSAT', $year = null) {
    $kantor = 'JKT';
    $uKantor = strtoupper((string)$kantorCode);
    if (strpos($uKantor, 'BDG') !== false || strpos($uKantor, 'BANDUNG') !== false) $kantor = 'BDG';
    elseif (strpos($uKantor, 'PDG') !== false || strpos($uKantor, 'PADANG') !== false) $kantor = 'PDG';
    elseif (strpos($uKantor, 'MKS') !== false || strpos($uKantor, 'MAKASSAR') !== false) $kantor = 'MKS';
    elseif (strpos($uKantor, 'PLM') !== false || strpos($uKantor, 'PALEMBANG') !== false || strpos($uKantor, 'PLB') !== false) $kantor = 'PLM';
    elseif ($uKantor === 'PUSAT' || strpos($uKantor, 'JAKARTA') !== false) $kantor = 'JKT';

    if (!$year) $year = date('Y');
    
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $rand = '';
    $maxLen = strlen($chars) - 1;
    for ($i = 0; $i < 4; $i++) {
        $rand .= $chars[random_int(0, $maxLen)];
    }
    return 'TRK-' . $kantor . '-' . $year . '-' . $rand;
}

// Inisialisasi Mock Data Awal Lengkap 5 Kantor Wilayah
function getInitialSeedData() {
    $now = time();
    $wibFormat = 'd M Y, H:i \W\I\B';
    
    // 1. PUSAT JAKARTA (Bank BTN - KPR Retail, M-04)
    $mTemplate1 = getMilestoneTemplate();
    $mTemplate1['M-01']['status'] = 'completed'; $mTemplate1['M-01']['timestamp'] = date($wibFormat, $now - (86400 * 2));
    $mTemplate1['M-01']['note'] = 'SPK KPR No. 042/BTN-JKT/KPR-SPK/X/2026, SHM No. 402, dan IMB/PBG lengkap diverifikasi resmi.';
    $mTemplate1['M-02']['status'] = 'completed'; $mTemplate1['M-02']['timestamp'] = date($wibFormat, $now - (86400 * 2) + 14400);
    $mTemplate1['M-02']['note'] = 'Penilai Pelaksana Hendra Wijaya, S.T. ditunjuk. Jadwal survei disepakati bersama debitur.';
    $mTemplate1['M-03']['status'] = 'completed'; $mTemplate1['M-03']['timestamp'] = date($wibFormat, $now - 86400);
    $mTemplate1['M-03']['note'] = 'Inspeksi fisik tanah 180 m² & bangunan 220 m², geotagging GPS (-6.2215, 106.8324), dan foto agunan selesai.';
    $mTemplate1['M-04']['status'] = 'in_progress'; $mTemplate1['M-04']['timestamp'] = date($wibFormat, $now - 7200);
    $mTemplate1['M-04']['note'] = 'Sedang proses analisis komparasi pasar residensial dan estimasi Nilai Pasar serta Nilai Likuidasi KPR.';

    $item1 = [
        'id' => 'JO-JKT-2026-0001',
        'jo_number' => 'JO-JKT-2026-0001',
        'kode_lacak' => 'TRK-JKT-2026-A89F',
        'spk_number' => '042/BTN-JKT/KPR-SPK/X/2026',
        'spk_date' => date('Y-m-d', $now - (86400 * 2)),
        'lingkup_penugasan' => 'Penilaian Properti Residensial (KPR Retail)',
        'tanggal_lingkup' => date('Y-m-d', $now - (86400 * 2)),
        'instansi' => 'PT Bank Tabungan Negara (Persero) Tbk',
        'instansi_singkat' => 'Bank BTN',
        'unit_kerja' => 'KC Jakarta Kuningan',
        'debitur' => 'Hendra Wijaya, S.T.',
        'pic_pemohon' => 'Rian Pratama, S.E. (Loan Officer BTN)',
        'pic_contact' => '081288997766',
        'kantor' => 'Kantor Pusat Jakarta',
        'kantor_code' => 'PUSAT',
        'jenis_properti' => 'KPR Retail (Rumah Tinggal)',
        'lokasi_aset' => 'Perumahan Taman Rasuna Blok C No. 15, Kuningan, Jakarta Selatan',
        'luas_tanah' => '180 m²',
        'luas_bangunan' => '220 m²',
        'sla_days' => 3,
        'sla_deadline' => date('Y-m-d', $now + 86400),
        'sla_status' => 'on_track',
        'sla_label' => 'SLA H+3 Bank BTN KPR (Sisa 1 Hari)',
        'penilai_pelaksana' => 'Fadri Nurdin',
        'surveyor' => 'Fadri Nurdin',
        'reviewer' => 'Tedi Setiadi',
        'reviewer_spm' => 'Tedi Setiadi',
        'penilai_publik' => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'current_milestone' => 'M-04',
        'current_milestone_title' => 'Analisis Penilaian & Kalkulasi Nilai',
        'progress_percent' => 57,
        'milestones' => $mTemplate1,
        'keterangan_resmi' => 'Tahap berjalan saat ini berada dalam koridor SLA H+3 Bank BTN KPR Retail. Analisis perbandingan data pasar dan kalkulasi nilai indikasi pasar rumah tinggal sedang dikerjakan secara teliti berpedoman pada Standar Penilaian Indonesia (SPI 105 & SPI 204).',
        'wa_admin' => '6285110513157',
        'created_at' => date('Y-m-d H:i:s', $now - (86400 * 2)),
        'updated_at' => date('Y-m-d H:i:s', $now)
    ];

    // 2. CABANG BANDUNG (Bank Mandiri - Komersial Bandung, M-05)
    $mTemplate2 = getMilestoneTemplate();
    $mTemplate2['M-01']['status'] = 'completed'; $mTemplate2['M-01']['timestamp'] = date($wibFormat, $now - (86400 * 4));
    $mTemplate2['M-02']['status'] = 'completed'; $mTemplate2['M-02']['timestamp'] = date($wibFormat, $now - (86400 * 3));
    $mTemplate2['M-03']['status'] = 'completed'; $mTemplate2['M-03']['timestamp'] = date($wibFormat, $now - (86400 * 2));
    $mTemplate2['M-04']['status'] = 'completed'; $mTemplate2['M-04']['timestamp'] = date($wibFormat, $now - 86400);
    $mTemplate2['M-05']['status'] = 'in_progress'; $mTemplate2['M-05']['timestamp'] = date($wibFormat, $now - 3600);
    $mTemplate2['M-05']['note'] = 'Reviewer sedang melakukan telaah kertas kerja kalkulasi dan pengujian kepatuhan SPM.';

    $item2 = [
        'id' => 'JO-BDG-2026-0015',
        'jo_number' => 'JO-BDG-2026-0015',
        'kode_lacak' => 'TRK-BDG-2026-M512',
        'spk_number' => 'MDR/BDG/KOM-098/X/2026',
        'spk_date' => date('Y-m-d', $now - (86400 * 4)),
        'lingkup_penugasan' => 'Penilaian Aset Komersial & Kantor Showroom',
        'tanggal_lingkup' => date('Y-m-d', $now - (86400 * 4)),
        'instansi' => 'PT Bank Mandiri (Persero) Tbk',
        'instansi_singkat' => 'Bank Mandiri',
        'unit_kerja' => 'Commercial Banking Center Bandung',
        'debitur' => 'PT Sentosa Abadi Makmur',
        'pic_pemohon' => 'Dewi Sartika, S.T.',
        'pic_contact' => '081322445566',
        'kantor' => 'Cabang Bandung',
        'kantor_code' => 'BDG',
        'jenis_properti' => 'Gedung Kantor & Showroom Komersial',
        'lokasi_aset' => 'Jl. Soekarno Hatta No. 452, Bandung, Jawa Barat',
        'luas_tanah' => '1.800 m²',
        'luas_bangunan' => '2.400 m²',
        'sla_days' => 5,
        'sla_deadline' => date('Y-m-d', $now + (86400 * 2)),
        'sla_status' => 'on_track',
        'sla_label' => 'SLA H+5 Bank Mandiri (Tepat Waktu)',
        'penilai_pelaksana' => 'Ardi Nurmayadi',
        'surveyor' => 'Rahmat Muhammad Hussein',
        'reviewer' => 'Andri Kusmandana',
        'reviewer_spm' => 'Andri Kusmandana',
        'penilai_publik' => 'Deni Siswandi, S.T., MAPPI (Cert.)',
        'current_milestone' => 'M-05',
        'current_milestone_title' => 'Kendali Mutu & Reviewer SPM',
        'progress_percent' => 71,
        'milestones' => $mTemplate2,
        'keterangan_resmi' => 'Kertas kerja telah selesai disusun dan saat ini memasuki proses verifikasi kendali mutu berjenjang oleh Reviewer SPM Cabang Bandung.',
        'wa_admin' => '6285110513157',
        'created_at' => date('Y-m-d H:i:s', $now - (86400 * 4)),
        'updated_at' => date('Y-m-d H:i:s', $now)
    ];

    // 3. CABANG MAKASSAR (Bank BRI - Agro Industri KIMA, M-02)
    $mTemplate3 = getMilestoneTemplate();
    $mTemplate3['M-01']['status'] = 'completed'; $mTemplate3['M-01']['timestamp'] = date($wibFormat, $now - 86400);
    $mTemplate3['M-02']['status'] = 'in_progress'; $mTemplate3['M-02']['timestamp'] = date($wibFormat, $now - 14400);
    $mTemplate3['M-02']['note'] = 'Konfirmasi kesiapan debitur untuk survei lapangan objek perkebunan & pabrik.';

    $item3 = [
        'id' => 'JO-MKS-2026-0008',
        'jo_number' => 'JO-MKS-2026-0008',
        'kode_lacak' => 'TRK-MKS-2026-K734',
        'spk_number' => 'B.341-AGR/MKS/10/2026',
        'spk_date' => date('Y-m-d', $now - 86400),
        'lingkup_penugasan' => 'Penilaian Pabrik Pengolahan Hasil Laut & Cold Storage',
        'tanggal_lingkup' => date('Y-m-d', $now - 86400),
        'instansi' => 'PT Bank Rakyat Indonesia (Persero) Tbk',
        'instansi_singkat' => 'Bank BRI',
        'unit_kerja' => 'Kantor Wilayah BRI Makassar',
        'debitur' => 'CV Celebes Bahari Agro',
        'pic_pemohon' => 'Andi Muhammad Rusli',
        'pic_contact' => '08114567890',
        'kantor' => 'Cabang Makassar',
        'kantor_code' => 'MKS',
        'jenis_properti' => 'Pabrik Pengolahan Hasil Laut & Cold Storage',
        'lokasi_aset' => 'Kawasan Industri Makassar (KIMA) Kav. 10, Makassar',
        'luas_tanah' => '6.500 m²',
        'luas_bangunan' => '4.100 m²',
        'sla_days' => 5,
        'sla_deadline' => date('Y-m-d', $now + (86400 * 4)),
        'sla_status' => 'on_track',
        'sla_label' => 'SLA H+5 Bank BRI (Sisa 4 Hari)',
        'penilai_pelaksana' => 'Alauddin Amin',
        'surveyor' => 'Alauddin Amin',
        'reviewer' => 'Wawan Kurniawan',
        'reviewer_spm' => 'Wawan Kurniawan',
        'penilai_publik' => 'Muhammad Amin Sade, S.M., MAPPI (Cert.)',
        'current_milestone' => 'M-02',
        'current_milestone_title' => 'Penetapan Tim & Jadwal Survei',
        'progress_percent' => 28,
        'milestones' => $mTemplate3,
        'keterangan_resmi' => 'SPK telah diverifikasi. Jadwal survei fisik lapangan sedang dikoordinasikan bersama pihak debitur dan petugas bank wilayah Makassar.',
        'wa_admin' => '6285110513157',
        'created_at' => date('Y-m-d H:i:s', $now - 86400),
        'updated_at' => date('Y-m-d H:i:s', $now)
    ];

    // 4. CABANG PADANG (Bank Nagari / BNI - Kompleks Ruko Komersial, M-03)
    $mTemplate4 = getMilestoneTemplate();
    $mTemplate4['M-01']['status'] = 'completed'; $mTemplate4['M-01']['timestamp'] = date($wibFormat, $now - (86400 * 3));
    $mTemplate4['M-02']['status'] = 'completed'; $mTemplate4['M-02']['timestamp'] = date($wibFormat, $now - (86400 * 2));
    $mTemplate4['M-03']['status'] = 'in_progress'; $mTemplate4['M-03']['timestamp'] = date($wibFormat, $now - 10800);
    $mTemplate4['M-03']['note'] = 'Pengukuran luas tanah 950 m² dan ruko 3 lantai di Jl. Khatib Sulaiman Padang sedang diverifikasi fisik.';

    $item4 = [
        'id' => 'JO-PDG-2026-0004',
        'jo_number' => 'JO-PDG-2026-0004',
        'kode_lacak' => 'TRK-PDG-2026-N291',
        'spk_number' => '019/NAGARI-PDG/SPK/X/2026',
        'spk_date' => date('Y-m-d', $now - (86400 * 3)),
        'lingkup_penugasan' => 'Penilaian Bangunan Komersial Ruko 3 Unit',
        'tanggal_lingkup' => date('Y-m-d', $now - (86400 * 3)),
        'instansi' => 'PT Bank Nagari',
        'instansi_singkat' => 'Bank Nagari',
        'unit_kerja' => 'Cabang Utama Padang',
        'debitur' => 'CV Minang Mandiri Agro',
        'pic_pemohon' => 'Zulhendri, S.E.',
        'pic_contact' => '081277665544',
        'kantor' => 'Cabang Padang',
        'kantor_code' => 'PDG',
        'jenis_properti' => 'Ruko 3 Pintu & Gudang Distribusi',
        'lokasi_aset' => 'Jl. Khatib Sulaiman No. 88, Padang, Sumatera Barat',
        'luas_tanah' => '950 m²',
        'luas_bangunan' => '720 m²',
        'sla_days' => 4,
        'sla_deadline' => date('Y-m-d', $now + 86400),
        'sla_status' => 'on_track',
        'sla_label' => 'SLA H+4 Bank Nagari (Sisa 1 Hari)',
        'penilai_pelaksana' => 'Muhammad Al Amin',
        'surveyor' => 'Muhammad Al Amin',
        'reviewer' => 'Rahmad Andika',
        'reviewer_spm' => 'Rahmad Andika',
        'penilai_publik' => 'Hernita, S.Si., MAPPI (Cert.)',
        'current_milestone' => 'M-03',
        'current_milestone_title' => 'Inspeksi Lapangan Selesai',
        'progress_percent' => 43,
        'milestones' => $mTemplate4,
        'keterangan_resmi' => 'Survei dan pengukuran fisik ruko 3 lantai di Padang telah selesai. Penilai pelaksana menyiapkan bukti dokumentasi dan koordinat GPS.',
        'wa_admin' => '6285110513157',
        'created_at' => date('Y-m-d H:i:s', $now - (86400 * 3)),
        'updated_at' => date('Y-m-d H:i:s', $now)
    ];

    // 5. CABANG PALEMBANG (Bank Sumsel Babel / Mandiri - Pergudangan Palembang, M-04)
    $mTemplate5 = getMilestoneTemplate();
    $mTemplate5['M-01']['status'] = 'completed'; $mTemplate5['M-01']['timestamp'] = date($wibFormat, $now - (86400 * 3));
    $mTemplate5['M-02']['status'] = 'completed'; $mTemplate5['M-02']['timestamp'] = date($wibFormat, $now - (86400 * 2));
    $mTemplate5['M-03']['status'] = 'completed'; $mTemplate5['M-03']['timestamp'] = date($wibFormat, $now - 86400);
    $mTemplate5['M-04']['status'] = 'in_progress'; $mTemplate5['M-04']['timestamp'] = date($wibFormat, $now - 7200);
    $mTemplate5['M-04']['note'] = 'Analisis data pembanding sewa dan transaksi tanah industri di Tanjung Api-Api.';

    $item5 = [
        'id' => 'JO-PLM-2026-0005',
        'jo_number' => 'JO-PLM-2026-0005',
        'kode_lacak' => 'TRK-PLM-2026-S842',
        'spk_number' => 'BSB/PLM-CORP/077/X/2026',
        'spk_date' => date('Y-m-d', $now - (86400 * 3)),
        'lingkup_penugasan' => 'Penilaian Tanah Industri & Fasilitas Gudang Pupuk',
        'tanggal_lingkup' => date('Y-m-d', $now - (86400 * 3)),
        'instansi' => 'PT Bank Sumsel Babel',
        'instansi_singkat' => 'Bank Sumsel Babel',
        'unit_kerja' => 'KCU A. Rivai Palembang',
        'debitur' => 'PT Sriwijaya Perkasa Sawit',
        'pic_pemohon' => 'Hendra Gunawan',
        'pic_contact' => '081271882233',
        'kantor' => 'Cabang Palembang',
        'kantor_code' => 'PLM',
        'jenis_properti' => 'Kawasan Pergudangan & Workshop Alat Berat',
        'lokasi_aset' => 'Jl. Tanjung Api-Api KM 9, Palembang, Sumatera Selatan',
        'luas_tanah' => '8.200 m²',
        'luas_bangunan' => '3.500 m²',
        'sla_days' => 5,
        'sla_deadline' => date('Y-m-d', $now + (86400 * 2)),
        'sla_status' => 'on_track',
        'sla_label' => 'SLA H+5 Bank Sumsel Babel (Sisa 2 Hari)',
        'penilai_pelaksana' => 'Arwin Saputra',
        'surveyor' => 'Arwin Saputra',
        'reviewer' => 'Rafdinal Ardhi',
        'reviewer_spm' => 'Rafdinal Ardhi',
        'penilai_publik' => 'Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)',
        'current_milestone' => 'M-04',
        'current_milestone_title' => 'Analisis Penilaian & Kalkulasi Nilai',
        'progress_percent' => 57,
        'milestones' => $mTemplate5,
        'keterangan_resmi' => 'Tahap analisis pasar residensial dan komersial sedang berlangsung untuk estimasi Nilai Pasar tanah industri dan gudang.',
        'wa_admin' => '6285110513157',
        'created_at' => date('Y-m-d H:i:s', $now - (86400 * 3)),
        'updated_at' => date('Y-m-d H:i:s', $now)
    ];

    // 6. PUSAT JAKARTA (Bank BCA - Ruko Hayam Wuruk, M-07 Selesai 100%)
    $mTemplate6 = getMilestoneTemplate();
    foreach ($mTemplate6 as $k => &$m) {
        $m['status'] = 'completed';
        $m['timestamp'] = date($wibFormat, $now - (86400 * 3));
    }
    $mTemplate6['M-07']['note'] = 'Laporan penilaian resmi No. 00192/2.0160-00/PI/03/0192/1/X/2026 telah diserahkan lengkap.';

    $item6 = [
        'id' => 'JO-JKT-2026-0003',
        'jo_number' => 'JO-JKT-2026-0003',
        'kode_lacak' => 'TRK-JKT-2026-B901',
        'spk_number' => 'BCA/KCK/APP-551/X/2026',
        'spk_date' => date('Y-m-d', $now - (86400 * 7)),
        'lingkup_penugasan' => 'Penilaian Ruko 4 Lantai & Kantor Komersial',
        'tanggal_lingkup' => date('Y-m-d', $now - (86400 * 7)),
        'instansi' => 'PT Bank Central Asia Tbk',
        'instansi_singkat' => 'BCA',
        'unit_kerja' => 'KCU Thamrin Jakarta',
        'debitur' => 'PT Surya Cipta Megah',
        'pic_pemohon' => 'Kevin Tanuwijaya',
        'pic_contact' => '081299881122',
        'kantor' => 'Kantor Pusat Jakarta',
        'kantor_code' => 'PUSAT',
        'jenis_properti' => 'Ruko 4 Lantai & Kantor Komersial',
        'lokasi_aset' => 'Jl. Hayam Wuruk No. 108, Jakarta Barat',
        'luas_tanah' => '420 m²',
        'luas_bangunan' => '1.150 m²',
        'sla_days' => 3,
        'sla_deadline' => date('Y-m-d', $now - (86400 * 4)),
        'sla_status' => 'completed',
        'sla_label' => 'Selesai Tepat Waktu (100%)',
        'penilai_pelaksana' => 'Muhammad Syahrul Ruly',
        'surveyor' => 'Muhammad Syahrul Ruly',
        'reviewer' => 'Angga Malid Cahyadi',
        'reviewer_spm' => 'Angga Malid Cahyadi',
        'penilai_publik' => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'current_milestone' => 'M-07',
        'current_milestone_title' => 'Penyerahan Laporan Final',
        'progress_percent' => 100,
        'milestones' => $mTemplate6,
        'keterangan_resmi' => 'Seluruh tahapan penilaian telah tuntas diselesaikan dan laporan resmi ber-Nolap telah diserahkan kepada pihak perbankan.',
        'wa_admin' => '6285110513157',
        'created_at' => date('Y-m-d H:i:s', $now - (86400 * 7)),
        'updated_at' => date('Y-m-d H:i:s', $now - (86400 * 3))
    ];

    return [
        $item1['id'] => $item1,
        $item2['id'] => $item2,
        $item3['id'] => $item3,
        $item4['id'] => $item4,
        $item5['id'] => $item5,
        $item6['id'] => $item6
    ];
}

// Muat data dari file penyimpanan lokal
function loadData($storageFile) {
    $initial = getInitialSeedData();
    if (file_exists($storageFile)) {
        $content = @file_get_contents($storageFile);
        $json = @json_decode($content, true);
        if (is_array($json) && !empty($json) && isset($json['JO-JKT-2026-0001'])) {
            // Pastikan seluruh 5 kantor wilayah dari seed ada dalam database
            $updated = false;
            foreach ($initial as $k => $item) {
                if (!isset($json[$k])) {
                    $json[$k] = $item;
                    $updated = true;
                }
            }

            // Migrasi & Sinkronisasi SPI 103 untuk seluruh penugasan lama
            foreach ($json as $k => &$row) {
                if (!isset($row['pemberi_tugas'])) {
                    $row['pemberi_tugas'] = $row['instansi'] ?? 'PT Bank Tabungan Negara (Persero) Tbk';
                    $updated = true;
                }
                if (!isset($row['pengguna_laporan'])) {
                    $row['pengguna_laporan'] = $row['pemberi_tugas'];
                    $updated = true;
                }
                if (!isset($row['client_pic_name'])) {
                    $row['client_pic_name'] = $row['pic_pemohon'] ?? 'PIC Pemohon';
                    $updated = true;
                }
                if (!isset($row['client_pic_phone'])) {
                    $row['client_pic_phone'] = $row['pic_contact'] ?? '081288997766';
                    $updated = true;
                }
                if (!isset($row['survey_contact_name'])) {
                    $row['survey_contact_name'] = $row['debitur'] ?? 'Debitur / Pengelola';
                    $updated = true;
                }
                if (!isset($row['survey_contact_phone'])) {
                    $row['survey_contact_phone'] = '081388772211';
                    $updated = true;
                }
                if (!isset($row['klasifikasi_izin_objek'])) {
                    $row['klasifikasi_izin_objek'] = (stripos($row['jenis_properti'] ?? '', 'Pabrik') !== false || stripos($row['jenis_properti'] ?? '', 'Gudang') !== false || stripos($row['jenis_properti'] ?? '', 'Industri') !== false) ? 'P' : 'PS';
                    $updated = true;
                }
                if (!isset($row['tujuan_penilaian'])) {
                    $row['tujuan_penilaian'] = 'Penjaminan Utang / Agunan Kredit';
                    $updated = true;
                }
            }
            unset($row);
            if ($updated) {
                @file_put_contents($storageFile, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            }
            return $json;
        }
    }
    @file_put_contents($storageFile, json_encode($initial, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return $initial;
}

// Simpan data ke file
function saveData($storageFile, $data) {
    return @file_put_contents($storageFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Helper persentase progres
function calculateProgress($currentM) {
    $weights = [
        'M-01' => 14,
        'M-02' => 28,
        'M-03' => 43,
        'M-04' => 57,
        'M-05' => 71,
        'M-06' => 86,
        'M-07' => 100
    ];
    return $weights[$currentM] ?? 50;
}

// Helper Tulis Log Audit Trail (8 Kolom Standar SSOT)
function appendAuditLog($auditLogFile, $entry) {
    $logs = [];
    if (file_exists($auditLogFile)) {
        $raw = @file_get_contents($auditLogFile);
        $parsed = @json_decode($raw, true);
        if (is_array($parsed)) $logs = $parsed;
    }
    array_unshift($logs, $entry);
    if (count($logs) > 500) {
        $logs = array_slice($logs, 0, 500);
    }
    @file_put_contents($auditLogFile, json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Routing Aksi
$action = $_GET['action'] ?? $_POST['action'] ?? 'list';
$jobs = loadData($storageFile);

// =========================================================================
// 1. ACTION: VERIFY_AUTH (Autentikasi NIK + PIN Karyawan)
// =========================================================================
if ($action === 'verify_auth') {
    $rawInput = file_get_contents('php://input');
    $payload = @json_decode($rawInput, true);
    if (!is_array($payload)) $payload = $_POST;

    $nik = $payload['nik'] ?? $_GET['nik'] ?? '';
    $pin = $payload['pin'] ?? $_GET['pin'] ?? '';

    $res = verifyNikPin($nik, $pin);
    if (!$res['success']) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => $res['message']
        ]);
        exit;
    }

    $user = $res['user'];
    $branchCode = getUserBranchCode($user);
    $isCentral = isCentralManagement($user);

    echo json_encode([
        'status' => 'success',
        'message' => 'Autentikasi staf berhasil.',
        'user' => [
            'nik' => $user['nik'],
            'nama' => $user['nama'],
            'jabatan' => $user['jabatan'],
            'divisi' => $user['divisi'],
            'kantor' => $user['kantor'] ?? $user['cabang'] ?? 'Pusat Jakarta',
            'cabang' => $user['cabang'] ?? $user['kantor'] ?? 'Pusat Jakarta',
            'branch_code' => $branchCode,
            'is_central' => $isCentral,
            'access_level' => $isCentral ? 'NATIONWIDE_FULL_ACCESS' : 'BRANCH_ISOLATED'
        ]
    ]);
    exit;
}

// =========================================================================
// 2. ACTION: TRACK (Pencarian Publik 7 Milestone Berbasis JO / Kode Lacak)
// =========================================================================
if ($action === 'track' || $action === 'track_public') {
    $joInput = trim((string)($_GET['jo'] ?? $_POST['jo'] ?? $_GET['id_jo'] ?? $_POST['id_jo'] ?? ''));
    $phoneInput = trim((string)($_GET['phone'] ?? $_POST['phone'] ?? $_GET['telepon_pic'] ?? $_POST['telepon_pic'] ?? ''));

    $cleanJo = strtoupper(preg_replace('/[^a-zA-Z0-9-]/', '', $joInput));
    $cleanPhone = preg_replace('/[^0-9]/', '', $phoneInput);

    // Coba query SSOT Google Apps Script terlebih dahulu
    if (!empty($cleanJo) || !empty($cleanPhone)) {
        $gasTrack = callGASTrackingService('track', ['id_jo' => $cleanJo, 'telepon_pic' => $cleanPhone], 'GET');
        if ($gasTrack && isset($gasTrack['status']) && $gasTrack['status'] === 'success' && !empty($gasTrack['data'])) {
            $gasData = $gasTrack['data'];
            unset($gasData['opini_nilai_pasar']);
            unset($gasData['opini_nilai_likuidasi']);
            unset($gasData['evidence_link']);
            echo json_encode([
                'status' => 'success',
                'source' => 'GAS_SSOT_LIVE',
                'data' => $gasData
            ]);
            exit;
        }
    }

    $found = null;

    // Pencarian exact match JO Number atau Kode Lacak
    if (!empty($cleanJo)) {
        foreach ($jobs as $id => $job) {
            $jJo = strtoupper((string)($job['jo_number'] ?? ''));
            $jKode = strtoupper((string)($job['kode_lacak'] ?? ''));
            if ($jJo === $cleanJo || $jKode === $cleanJo) {
                $found = $job;
                break;
            }
        }
    }

    // Pencarian nomor telepon
    if (!$found && !empty($cleanPhone)) {
        foreach ($jobs as $id => $job) {
            $jPhone = preg_replace('/[^0-9]/', '', (string)($job['client_pic_phone'] ?? $job['pic_contact'] ?? ''));
            if (!empty($jPhone) && strlen($cleanPhone) >= 6 && substr($jPhone, -6) === substr($cleanPhone, -6)) {
                $found = $job;
                break;
            }
        }
    }

    // Pencarian parsial nomor JO / Kode Lacak
    if (!$found && !empty($cleanJo)) {
        foreach ($jobs as $id => $job) {
            $jJo = strtoupper((string)($job['jo_number'] ?? ''));
            $jKode = strtoupper((string)($job['kode_lacak'] ?? ''));
            if ((!empty($jJo) && strpos($jJo, $cleanJo) !== false) || (!empty($jKode) && strpos($jKode, $cleanJo) !== false)) {
                $found = $job;
                break;
            }
        }
    }

    if (!$found) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Status penugasan dengan Nomor JO / Kode Lacak atau Nomor WhatsApp tersebut tidak ditemukan.',
            'data' => null
        ]);
        exit;
    }

    $publicData = $found;
    // Proteksi Kerahasiaan Publik (KEPI & Standar Penilaian):
    // Nilai Opini Rupiah (Pasar & Likuidasi) serta Bukti Kerja Internal DISEKA dari endpoint lacak publik.
    unset($publicData['opini_nilai_pasar']);
    unset($publicData['opini_nilai_likuidasi']);
    unset($publicData['evidence_link']);

    echo json_encode([
        'status' => 'success',
        'message' => 'Status penugasan ditemukan.',
        'data' => $publicData
    ]);
    exit;
}

// =========================================================================
// 3. ACTION: LIST (Task Board dengan Isolasi Wilayah Kerja Cabang)
// =========================================================================
if ($action === 'list' || $action === 'get_active_jobs') {
    $authNik = trim((string)($_GET['auth_nik'] ?? $_POST['auth_nik'] ?? ''));
    $authPin = trim((string)($_GET['auth_pin'] ?? $_POST['auth_pin'] ?? ''));
    $filterKantor = strtoupper(trim((string)($_GET['kantor'] ?? $_POST['kantor'] ?? '')));
    $branchParam = strtoupper(trim((string)($_GET['branch'] ?? $_POST['branch'] ?? '')));

    $currentUser = null;
    $isIsolatedBranch = false;
    $userBranchCode = 'PUSAT';

    if (!empty($authNik)) {
        $user = findUserByNik($authNik);
        if ($user) {
            $currentUser = $user;
            $userBranchCode = getUserBranchCode($user);
            $isIsolatedBranch = !isCentralManagement($user);
        }
    } elseif (!empty($branchParam) && in_array($branchParam, ['BDG', 'PDG', 'MKS', 'PLM', 'PLB'])) {
        $isIsolatedBranch = true;
        $userBranchCode = ($branchParam === 'PLB') ? 'PLM' : $branchParam;
    }

    $filteredJobs = [];
    foreach ($jobs as $id => $job) {
        $jBranch = strtoupper(trim((string)($job['kantor_code'] ?? 'PUSAT')));
        if ($jBranch === 'JKT') $jBranch = 'PUSAT';

        // 1. Jika staf cabang terisolasi (Bandung, Padang, Makassar, Palembang),
        //    hanya tampilkan penugasan di wilayah cabangnya sendiri!
        if ($isIsolatedBranch) {
            if ($jBranch !== $userBranchCode) {
                continue; // Blokir penugasan wilayah lain
            }
        } else {
            // 2. Jika staf Pusat/Manajemen, dukung filter dropdown kantor
            if (!empty($filterKantor) && $filterKantor !== 'ALL' && $filterKantor !== 'SEMUA') {
                $fCode = $filterKantor;
                if ($fCode === 'JKT') $fCode = 'PUSAT';
                if ($jBranch !== $fCode) {
                    continue;
                }
            }
        }

        $filteredJobs[] = $job;
    }

    echo json_encode([
        'status' => 'success',
        'count' => count($filteredJobs),
        'access_mode' => $isIsolatedBranch ? 'BRANCH_ISOLATED' : 'NATIONWIDE_FULL_ACCESS',
        'user_branch' => $userBranchCode,
        'user_name' => $currentUser ? $currentUser['nama'] : 'Tamu / Umum',
        'data' => $filteredJobs
    ]);
    exit;
}

// =========================================================================
// 4. ACTION: ADVANCE_MILESTONE (Pembaruan Milestone Terverifikasi NIK + PIN)
// =========================================================================
if ($action === 'advance_milestone' || $action === 'update_milestone') {
    $rawInput = file_get_contents('php://input');
    $payload = @json_decode($rawInput, true);
    if (!is_array($payload)) $payload = $_POST;

    $joId = trim((string)($payload['jo'] ?? $payload['id'] ?? $payload['id_jo'] ?? ''));
    $targetM = strtoupper(trim((string)($payload['target_milestone'] ?? '')));
    $customNote = trim((string)($payload['note'] ?? $payload['catatan'] ?? $payload['catatan_progres'] ?? ''));
    $nik = trim((string)($payload['nik'] ?? $payload['auth_nik'] ?? ''));
    $pin = trim((string)($payload['pin'] ?? $payload['auth_pin'] ?? ''));

    // 1. Verifikasi Wajib NIK + PIN
    if (empty($nik) || empty($pin)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Otorisasi gagal: NIK Karyawan dan PIN Keamanan wajib diisi untuk memperbarui milestone.'
        ]);
        exit;
    }

    $authRes = verifyNikPin($nik, $pin);
    if (!$authRes['success']) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Verifikasi Gagal: ' . $authRes['message']
        ]);
        exit;
    }
    $user = $authRes['user'];

    // 2. Cari Job Order
    if (!isset($jobs[$joId])) {
        foreach ($jobs as $id => $j) {
            if ($j['jo_number'] === $joId || ($j['kode_lacak'] ?? '') === $joId) {
                $joId = $id;
                break;
            }
        }
    }

    if (!isset($jobs[$joId])) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Job Order ' . $joId . ' tidak ditemukan.']);
        exit;
    }

    $job = &$jobs[$joId];

    // 3. Validasi Pembatasan Wilayah Kerja Cabang (Branch Isolation Check)
    if (!checkBranchAccess($user, $job['kantor_code'])) {
        http_response_code(403);
        $userCabang = $user['kantor'] ?? $user['cabang'] ?? 'Cabang Terdaftar';
        echo json_encode([
            'status' => 'error',
            'message' => "Akses Ditolak: Anda berwenang di {$userCabang}, tidak memiliki hak akses memperbarui penugasan wilayah {$job['kantor']}."
        ]);
        exit;
    }

    // Tentukan milestone target berikutnya jika belum ditentukan
    $mKeys = ['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06', 'M-07'];
    $currentM = $job['current_milestone'];
    $currentIndex = array_search($currentM, $mKeys);

    if (empty($targetM)) {
        $nextIndex = min(count($mKeys) - 1, $currentIndex + 1);
        $targetM = $mKeys[$nextIndex];
    }

    // 4. Validasi Matriks Otoritas Peran (Authority Matrix Check)
    $authCheck = checkMilestoneAuthority($user, $targetM);
    if (!$authCheck['allowed']) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => "Otorisasi Ditolak (Kepatuhan SPI): {$authCheck['message']}"
        ]);
        exit;
    }

    $now = time();
    $wibFormat = 'd M Y, H:i \W\I\B';
    $targetIndex = array_search($targetM, $mKeys);

    $isRollback = ($targetIndex < $currentIndex);

    if ($isRollback) {
        // Rollback / Revisi SPM: target milestone aktif kembali, milestone berikutnya direset ke pending
        for ($i = 0; $i < count($mKeys); $i++) {
            $k = $mKeys[$i];
            if ($i < $targetIndex) {
                $job['milestones'][$k]['status'] = 'completed';
            } elseif ($i === $targetIndex) {
                $job['milestones'][$k]['status'] = 'in_progress';
                $job['milestones'][$k]['timestamp'] = date($wibFormat, $now);
                if (!empty($customNote)) $job['milestones'][$k]['note'] = $customNote;
                $job['milestones'][$k]['actor'] = $user['nama'] . ' (' . $user['jabatan'] . ')';
            } else {
                $job['milestones'][$k]['status'] = 'pending';
                $job['milestones'][$k]['timestamp'] = '-';
            }
        }
        $job['sla_status'] = 'on_track';
        $job['sla_label'] = 'Revisi (' . $targetM . ')';
    } else {
        for ($i = 0; $i <= $targetIndex; $i++) {
            $k = $mKeys[$i];
            if ($i < $targetIndex) {
                $job['milestones'][$k]['status'] = 'completed';
                if ($job['milestones'][$k]['timestamp'] === '-') {
                    $job['milestones'][$k]['timestamp'] = date($wibFormat, $now - (($targetIndex - $i) * 3600));
                }
            } elseif ($i === $targetIndex) {
                if ($targetM === 'M-07') {
                    $job['milestones'][$k]['status'] = 'completed';
                    $job['milestones'][$k]['timestamp'] = date($wibFormat, $now);
                    if (!empty($customNote)) $job['milestones'][$k]['note'] = $customNote;
                    $job['milestones'][$k]['actor'] = $user['nama'] . ' (' . $user['jabatan'] . ')';
                    $job['sla_status'] = 'completed';
                    $job['sla_label'] = 'Selesai 100%';
                } else {
                    $job['milestones'][$k]['status'] = 'in_progress';
                    $job['milestones'][$k]['timestamp'] = date($wibFormat, $now);
                    if (!empty($customNote)) $job['milestones'][$k]['note'] = $customNote;
                    $job['milestones'][$k]['actor'] = $user['nama'] . ' (' . $user['jabatan'] . ')';
                }
            }
        }
    }

    // Tangkap input substansi SPI & NoLap
    if (!empty($payload['evidence_link'])) {
        $job['evidence_link'] = trim((string)$payload['evidence_link']);
    }
    if (!empty($payload['tanggal_penilaian'])) {
        $job['tanggal_penilaian'] = trim((string)$payload['tanggal_penilaian']);
    }
    if (!empty($payload['dokumen_kepemilikan'])) {
        $job['dokumen_kepemilikan'] = trim((string)$payload['dokumen_kepemilikan']);
    }
    if (!empty($payload['nomor_laporan_resmi'])) {
        $job['nomor_laporan_resmi'] = trim((string)$payload['nomor_laporan_resmi']);
    }
    if (isset($payload['opini_nilai_pasar']) && $payload['opini_nilai_pasar'] !== '') {
        $job['opini_nilai_pasar'] = (float)str_replace(['.', ',', ' ', 'Rp', 'rp'], '', (string)$payload['opini_nilai_pasar']);
    }
    if (isset($payload['opini_nilai_likuidasi']) && $payload['opini_nilai_likuidasi'] !== '') {
        $job['opini_nilai_likuidasi'] = (float)str_replace(['.', ',', ' ', 'Rp', 'rp'], '', (string)$payload['opini_nilai_likuidasi']);
    }

    $job['current_milestone'] = $targetM;
    $job['current_milestone_title'] = $job['milestones'][$targetM]['title'];
    $job['progress_percent'] = calculateProgress($targetM);
    $job['updated_at'] = date('Y-m-d H:i:s', $now);

    saveData($storageFile, $jobs);

    // 5. Catat Audit Trail ke Tab LOG_PROGRESS (8 Kolom Standar SSOT)
    // Timestamp | Nomor JO | Kode Lacak TRK | Milestone Baru | NIK Eksekutor | Nama Eksekutor | Jabatan / Cabang | Catatan Progres
    $auditEntry = [
        'timestamp' => date('Y-m-d H:i:s', $now),
        'nomor_jo' => $job['jo_number'],
        'kode_lacak' => $job['kode_lacak'] ?? '',
        'milestone_baru' => $targetM,
        'nik_eksekutor' => $user['nik'],
        'nama_eksekutor' => $user['nama'],
        'jabatan_cabang' => $user['jabatan'] . ' / ' . ($user['kantor'] ?? $user['cabang'] ?? 'KJPP NSR'),
        'catatan_progres' => !empty($customNote) ? $customNote : "Milestone {$targetM} disahkan oleh {$user['nama']}."
    ];
    appendAuditLog($auditLogFile, $auditEntry);

    // 6. Teruskan ke SSOT Google Apps Script Engine
    callGASTrackingService('advance_milestone', [
        'id_jo' => $job['jo_number'],
        'target_milestone' => $targetM,
        'catatan_internal' => $auditEntry['catatan_progres'],
        'pesan_publik' => $job['milestones'][$targetM]['title'],
        'eksekutor_nik' => $user['nik'],
        'eksekutor_nama' => $user['nama'],
        'jabatan_cabang' => $auditEntry['jabatan_cabang'],
        'kode_lacak' => $job['kode_lacak'] ?? ''
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => "Milestone penugasan {$job['jo_number']} berhasil diperbarui ke {$targetM} oleh {$user['nama']}.",
        'data' => $job,
        'audit' => $auditEntry
    ]);
    exit;
}

// =========================================================================
// 5. ACTION: CREATE (Registrasi Job Order Baru dengan Kode Lacak TRK)
// =========================================================================
if ($action === 'create' || $action === 'create_job_order') {
    $rawInput = file_get_contents('php://input');
    $payload = @json_decode($rawInput, true);
    if (!is_array($payload)) $payload = $_POST;

    $kantor = $payload['kantor'] ?? $payload['kantor_pelaksana'] ?? 'Kantor Pusat Jakarta';
    $kantorCode = 'PUSAT';
    if (stripos($kantor, 'Bandung') !== false || stripos($kantor, 'BDG') !== false) $kantorCode = 'BDG';
    elseif (stripos($kantor, 'Padang') !== false || stripos($kantor, 'PDG') !== false) $kantorCode = 'PDG';
    elseif (stripos($kantor, 'Makassar') !== false || stripos($kantor, 'MKS') !== false) $kantorCode = 'MKS';
    elseif (stripos($kantor, 'Palembang') !== false || stripos($kantor, 'PLM') !== false) $kantorCode = 'PLM';

    // Verifikasi pembuat jika dikirimkan auth
    $authNik = trim((string)($payload['auth_nik'] ?? $payload['nik'] ?? ''));
    $authPin = trim((string)($payload['auth_pin'] ?? $payload['pin'] ?? ''));
    $creatorUser = null;

    if (!empty($authNik) && !empty($authPin)) {
        $vRes = verifyNikPin($authNik, $authPin);
        if ($vRes['success']) {
            $creatorUser = $vRes['user'];
            // Jika staf cabang mendaftar, pastikan kantor sesuai cabangnya
            if (!isCentralManagement($creatorUser)) {
                $userBranch = getUserBranchCode($creatorUser);
                if ($userBranch !== $kantorCode) {
                    http_response_code(403);
                    echo json_encode([
                        'status' => 'error',
                        'message' => "Akses Ditolak: Anda berwenang di {$creatorUser['kantor']}, tidak dapat mendaftarkan penugasan untuk kantor lain."
                    ]);
                    exit;
                }
            }
        }
    }

    $year = date('Y');
    $nextSeq = str_pad(count($jobs) + 1, 4, '0', STR_PAD_LEFT);
    $joNumber = 'JO-' . ($kantorCode === 'PUSAT' ? 'JKT' : $kantorCode) . '-' . $year . '-' . $nextSeq;
    $kodeLacak = generateTrackingCode($kantorCode, $year);

    $now = time();
    $wibFormat = 'd M Y, H:i \W\I\B';
    $mTemplate = getMilestoneTemplate();

    $spkNumber = trim((string)($payload['spk_number'] ?? ('SPK/' . $nextSeq . '/' . date('m/Y'))));
    $spkDate = trim((string)($payload['spk_date'] ?? date('Y-m-d')));
    $lingkupPenugasan = trim((string)($payload['lingkup_penugasan'] ?? 'Penilaian Properti Komprehensif'));
    $tanggalLingkup = trim((string)($payload['tanggal_lingkup'] ?? $spkDate));
    
    // M-01 Selesai saat registrasi
    $mTemplate['M-01']['status'] = 'completed';
    $mTemplate['M-01']['timestamp'] = date($wibFormat, $now);
    $mTemplate['M-01']['note'] = "SPK No. {$spkNumber} & Kode Lacak {$kodeLacak} teregistrasi resmi di sistem OPINI NSR.";
    if ($creatorUser) {
        $mTemplate['M-01']['actor'] = $creatorUser['nama'] . ' (' . $creatorUser['jabatan'] . ')';
    }

    // M-02 Masuk Tahap Berjalan
    $penilaiPelaksana = trim((string)($payload['penilai_pelaksana'] ?? $payload['surveyor'] ?? 'Hendra Wijaya, S.T.'));
    $mTemplate['M-02']['status'] = 'in_progress';
    $mTemplate['M-02']['timestamp'] = date($wibFormat, $now);
    $mTemplate['M-02']['note'] = 'Penetapan Penilai Pelaksana / Surveyor: ' . $penilaiPelaksana;

    $slaDays = (int)($payload['sla_days'] ?? 3);
    $slaTargetText = trim((string)($payload['sla_target_text'] ?? ''));
    if (empty($slaTargetText)) {
        $slaTargetText = "SLA H+{$slaDays} (Dalam Proses)";
    }

    $pemberiTugas = trim((string)($payload['pemberi_tugas'] ?? $payload['instansi'] ?? 'PT Bank Tabungan Negara (Persero) Tbk'));
    $penggunaLaporan = trim((string)($payload['pengguna_laporan'] ?? $pemberiTugas));
    $debitur = trim((string)($payload['debitur'] ?? 'Debitur Baru'));
    $clientPicName = trim((string)($payload['client_pic_name'] ?? $payload['pic_pemohon'] ?? 'PIC Pemberi Tugas'));
    $clientPicPhone = trim((string)($payload['client_pic_phone'] ?? $payload['pic_contact'] ?? '081288997766'));
    $surveyContactName = trim((string)($payload['survey_contact_name'] ?? ($debitur . ' (Pendamping Lapangan)')));
    $surveyContactPhone = trim((string)($payload['survey_contact_phone'] ?? ''));
    $tujuanPenilaian = trim((string)($payload['tujuan_penilaian'] ?? 'Penjaminan Utang / Agunan Kredit'));
    $klasifikasiIzinObjek = trim((string)($payload['klasifikasi_izin_objek'] ?? 'PS'));
    $dokumenKepemilikan = trim((string)($payload['dokumen_kepemilikan'] ?? 'SHM / Bukti Hak'));

    $newJob = [
        'id' => $joNumber,
        'jo_number' => $joNumber,
        'kode_lacak' => $kodeLacak,
        'spk_number' => $spkNumber,
        'spk_date' => $spkDate,
        'lingkup_penugasan' => $lingkupPenugasan,
        'tanggal_lingkup' => $tanggalLingkup,
        'pemberi_tugas' => $pemberiTugas,
        'pengguna_laporan' => $penggunaLaporan,
        'instansi' => $pemberiTugas,
        'instansi_singkat' => $payload['instansi_singkat'] ?? 'Bank Rekanan',
        'unit_kerja' => $payload['unit_kerja'] ?? '-',
        'debitur' => $debitur,
        'client_pic_name' => $clientPicName,
        'client_pic_phone' => $clientPicPhone,
        'survey_contact_name' => $surveyContactName,
        'survey_contact_phone' => $surveyContactPhone,
        'pic_pemohon' => $clientPicName,
        'pic_contact' => $clientPicPhone,
        'tujuan_penilaian' => $tujuanPenilaian,
        'klasifikasi_izin_objek' => $klasifikasiIzinObjek,
        'dokumen_kepemilikan' => $dokumenKepemilikan,
        'tanggal_penilaian' => $spkDate,
        'nomor_laporan_resmi' => '',
        'opini_nilai_pasar' => 0,
        'opini_nilai_likuidasi' => 0,
        'kantor' => $kantor,
        'kantor_code' => $kantorCode,
        'jenis_properti' => $payload['jenis_properti'] ?? 'Tanah & Bangunan',
        'lokasi_aset' => $payload['lokasi_aset'] ?? 'Alamat Objek Penilaian',
        'luas_tanah' => $payload['luas_tanah'] ?? '-',
        'luas_bangunan' => $payload['luas_bangunan'] ?? '-',
        'sla_days' => $slaDays,
        'sla_deadline' => date('Y-m-d', $now + ($slaDays * 86400)),
        'sla_status' => 'on_track',
        'sla_label' => $slaTargetText,
        'penilai_pelaksana' => $penilaiPelaksana,
        'surveyor' => $penilaiPelaksana,
        'reviewer' => $payload['reviewer'] ?? $payload['reviewer_spm'] ?? 'Tedi Setiadi',
        'reviewer_spm' => $payload['reviewer_spm'] ?? $payload['reviewer'] ?? 'Tedi Setiadi',
        'penilai_publik' => $payload['penilai_publik'] ?? 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'current_milestone' => 'M-02',
        'current_milestone_title' => 'Penetapan Tim & Jadwal Survei',
        'progress_percent' => 28,
        'milestones' => $mTemplate,
        'keterangan_resmi' => 'Registrasi awal berhasil. Penilai Pelaksana / Surveyor sedang menyiapkan surat tugas inspeksi lapangan.',
        'wa_admin' => '6285110513157',
        'created_at' => date('Y-m-d H:i:s', $now),
        'updated_at' => date('Y-m-d H:i:s', $now)
    ];

    $jobs[$joNumber] = $newJob;
    saveData($storageFile, $jobs);

    // Audit Log M-01
    $auditEntry = [
        'timestamp' => date('Y-m-d H:i:s', $now),
        'nomor_jo' => $joNumber,
        'kode_lacak' => $kodeLacak,
        'milestone_baru' => 'M-01',
        'nik_eksekutor' => $creatorUser ? $creatorUser['nik'] : 'SYSTEM-REG',
        'nama_eksekutor' => $creatorUser ? $creatorUser['nama'] : 'Staf Admin Operasional',
        'jabatan_cabang' => $creatorUser ? ($creatorUser['jabatan'] . ' / ' . $kantor) : ('Admin / ' . $kantor),
        'catatan_progres' => "Registrasi awal SPK {$spkNumber} dan penerbitan Kode Lacak {$kodeLacak}."
    ];
    appendAuditLog($auditLogFile, $auditEntry);

    // Forward ke GAS Engine
    callGASTrackingService('create_job_order', [
        'id_jo' => $joNumber,
        'kode_lacak' => $kodeLacak,
        'spk_number' => $spkNumber,
        'spk_date' => $spkDate,
        'instansi' => $newJob['instansi'],
        'debitur' => $newJob['debitur'],
        'pic_contact' => $newJob['pic_contact'],
        'jenis_properti' => $newJob['jenis_properti'],
        'lokasi_aset' => $newJob['lokasi_aset'],
        'kantor' => $kantor,
        'penilai_pelaksana' => $penilaiPelaksana,
        'reviewer_spm' => $newJob['reviewer_spm'],
        'penilai_publik' => $newJob['penilai_publik'],
        'sla_days' => $slaDays
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => "Job Order {$joNumber} berhasil didaftarkan dengan Kode Lacak {$kodeLacak}.",
        'data' => $newJob
    ]);
    exit;
}

// =========================================================================
// 6. ACTION: GET_JO_SUGGESTIONS (Saran Registrasi JO untuk Auto-Populate)
// =========================================================================
if ($action === 'get_jo_suggestions') {
    $suggestions = [];

    // Ambil dari jobs aktif
    foreach ($jobs as $id => $j) {
        $suggestions[] = [
            'id_jo' => $j['jo_number'] ?? $id,
            'nomor_spk' => $j['spk_number'] ?? '-',
            'tanggal_spk' => $j['spk_date'] ?? date('Y-m-d'),
            'pemberi_tugas' => $j['pemberi_tugas'] ?? ($j['instansi'] ?? ''),
            'pengguna_laporan' => $j['pengguna_laporan'] ?? ($j['pemberi_tugas'] ?? ($j['instansi'] ?? '')),
            'instansi' => $j['pemberi_tugas'] ?? ($j['instansi'] ?? ''),
            'unit_kerja' => $j['unit_kerja'] ?? '',
            'debitur' => $j['debitur'] ?? '',
            'client_pic_name' => $j['client_pic_name'] ?? ($j['pic_pemohon'] ?? ''),
            'client_pic_phone' => $j['client_pic_phone'] ?? ($j['pic_contact'] ?? ''),
            'survey_contact_name' => $j['survey_contact_name'] ?? '',
            'survey_contact_phone' => $j['survey_contact_phone'] ?? '',
            'pic_contact' => $j['client_pic_phone'] ?? ($j['pic_contact'] ?? ''),
            'tujuan_penilaian' => $j['tujuan_penilaian'] ?? 'Penjaminan Utang / Agunan Kredit',
            'klasifikasi_izin_objek' => $j['klasifikasi_izin_objek'] ?? 'PS',
            'dokumen_kepemilikan' => $j['dokumen_kepemilikan'] ?? '',
            'jenis_properti' => $j['jenis_properti'] ?? '',
            'lokasi_aset' => $j['lokasi_aset'] ?? '',
            'kantor' => $j['kantor'] ?? 'Kantor Pusat Jakarta',
            'lingkup_penugasan' => $j['lingkup_penugasan'] ?? 'Penilaian Properti Komprehensif',
            'tanggal_lingkup' => $j['tanggal_lingkup'] ?? ($j['spk_date'] ?? date('Y-m-d')),
            'luas_tanah' => $j['luas_tanah'] ?? '-',
            'luas_bangunan' => $j['luas_bangunan'] ?? '-'
        ];
    }

    // Tambahkan dari database Dual Gate Penugasan & Nolap
    $seenIds = [];
    foreach ($suggestions as $s) {
        $seenIds[$s['id_jo']] = true;
    }

    $dualGateFile = $dataDir . '/dual_gate_database.json';
    if (file_exists($dualGateFile)) {
        $dgData = @json_decode(@file_get_contents($dualGateFile), true);
        if (is_array($dgData)) {
            $countDg = 0;
            foreach ($dgData as $item) {
                $idPenugasan = $item['idPenugasan'] ?? ($item['noPermintaan'] ?? '');
                if (empty($idPenugasan) || isset($seenIds[$idPenugasan])) continue;
                $seenIds[$idPenugasan] = true;

                $klien = $item['namaKlien'] ?? 'Bank Rekanan';
                $debitur = $item['namaDebitur'] ?? ($item['projectData']['debitur_nama'] ?? $klien);
                $noSpk = $item['gerbang1']['nomorLpResmi'] ?? ($item['nomor_lp'] ?? $item['noPermintaan'] ?? 'SPK-NSR-2026');
                $lingkup = $item['tujuanPenilaian'] ?? 'Penilaian Agunan';
                $tglSpk = !empty($item['createdAt']) ? substr($item['createdAt'], 0, 10) : date('Y-m-d');
                $objek = $item['jenisObjek'] ?? 'Tanah & Bangunan';
                $lokasi = $item['objek_penilaian'][0]['alamat'] ?? ($item['projectData']['alamat_objek'] ?? ($item['lokasiObjek'] ?? $lingkup));
                $kontak = $item['pengguna_laporan']['kontak'] ?? ($item['projectData']['kontak_pic'] ?? '081288997766');
                $kantor = $item['kantorAsal'] ? (stripos($item['kantorAsal'], 'Kantor') !== false ? $item['kantorAsal'] : ('Cabang ' . $item['kantorAsal'])) : 'Kantor Pusat Jakarta';

                $suggestions[] = [
                    'id_jo' => $idPenugasan,
                    'nomor_spk' => $noSpk,
                    'tanggal_spk' => $tglSpk,
                    'instansi' => $klien,
                    'unit_kerja' => $item['unit_kerja'] ?? $kantor,
                    'debitur' => $debitur,
                    'pic_contact' => $kontak,
                    'jenis_properti' => $objek,
                    'lokasi_aset' => $lokasi,
                    'kantor' => $kantor,
                    'lingkup_penugasan' => $lingkup,
                    'tanggal_lingkup' => $tglSpk,
                    'luas_tanah' => $item['objek_penilaian'][0]['luas_tanah'] ?? '-',
                    'luas_bangunan' => $item['objek_penilaian'][0]['luas_bangunan'] ?? '-'
                ];
                $countDg++;
                if ($countDg >= 25) break;
            }
        }
    }

    // Tambahkan dari database nolap jika ada
    $nolapFile = $dataDir . '/nolap_database.json';
    if (file_exists($nolapFile)) {
        $nData = @json_decode(@file_get_contents($nolapFile), true);
        if (is_array($nData)) {
            $count = 0;
            foreach ($nData as $item) {
                $idJo = $item['nomor_jo'] ?? ('JO-REG-' . ($item['noPermintaan'] ?? $count));
                if (isset($seenIds[$idJo])) continue;
                $seenIds[$idJo] = true;

                if (!empty($item['namaKlien']) || !empty($item['nama_debitur'])) {
                    $suggestions[] = [
                        'id_jo' => $idJo,
                        'nomor_spk' => $item['noSpk'] ?? ('SPK/' . date('Y') . '/' . str_pad($count + 1, 3, '0', STR_PAD_LEFT)),
                        'tanggal_spk' => $item['tglTerbit'] ?? date('Y-m-d'),
                        'instansi' => $item['namaKlien'] ?? $item['nama_klien'] ?? 'Bank Mitra',
                        'unit_kerja' => $item['cabang'] ?? 'Kantor Pusat',
                        'debitur' => $item['nama_debitur'] ?? $item['namaKlien'] ?? 'Debitur',
                        'pic_contact' => $item['waPemohon'] ?? '081288997766',
                        'jenis_properti' => $item['jenisObjek'] ?? 'Properti Residensial / Komersial',
                        'lokasi_aset' => $item['lokasiObjek'] ?? 'Alamat Aset Terdaftar',
                        'kantor' => 'Kantor ' . ($item['cabang'] ?? 'Pusat Jakarta'),
                        'lingkup_penugasan' => 'Penilaian Agunan / Properti',
                        'tanggal_lingkup' => date('Y-m-d'),
                        'luas_tanah' => '-',
                        'luas_bangunan' => '-'
                    ];
                    $count++;
                    if ($count >= 15) break;
                }
            }
        }
    }

    echo json_encode([
        'status' => 'success',
        'count' => count($suggestions),
        'data' => $suggestions
    ]);
    exit;
}

// =========================================================================
// 7. ACTION: GET_AUDIT_LOG (Riwayat Log Progres 8 Kolom)
// =========================================================================
if ($action === 'get_audit_log') {
    $joParam = trim((string)($_GET['jo'] ?? $_POST['jo'] ?? ''));
    $logs = [];
    if (file_exists($auditLogFile)) {
        $raw = @file_get_contents($auditLogFile);
        $parsed = @json_decode($raw, true);
        if (is_array($parsed)) $logs = $parsed;
    }

    if (!empty($joParam)) {
        $filtered = [];
        foreach ($logs as $l) {
            if (($l['nomor_jo'] ?? '') === $joParam || ($l['kode_lacak'] ?? '') === $joParam) {
                $filtered[] = $l;
            }
        }
        $logs = $filtered;
    }

    echo json_encode([
        'status' => 'success',
        'count' => count($logs),
        'data' => $logs
    ]);
    exit;
}

// =========================================================================
// 8. ACTION: RESET_DEMO (Mengembalikan Seed Data Awal 5 Kantor Wilayah)
// =========================================================================
if ($action === 'reset_demo') {
    $initial = getInitialSeedData();
    saveData($storageFile, $initial);
    @file_put_contents($auditLogFile, json_encode([], JSON_PRETTY_PRINT));
    echo json_encode([
        'status' => 'success',
        'message' => 'Data simulasi staging berhasil direset ke kondisi awal (Lengkap 5 Kantor Wilayah).',
        'data' => array_values($initial)
    ]);
    exit;
}

// Default response
echo json_encode([
    'status' => 'success',
    'endpoint' => 'KJPP NSR Job Tracking Staging API',
    'actions' => ['verify_auth', 'track', 'list', 'create', 'advance_milestone', 'get_jo_suggestions', 'get_audit_log', 'reset_demo']
]);
