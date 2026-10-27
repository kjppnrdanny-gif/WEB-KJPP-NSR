<?php
/**
 * Backend Simulasi & Proxy Handler Job Tracking Penilaian KJPP NSR
 * STAGING LOKAL ONLY - Dilarang deploy ke live cPanel.
 * 
 * Melayani API:
 * 1. track: Pencarian publik status penugasan (7 Milestone M-01 s/d M-07)
 * 2. list: Daftar penugasan untuk Task Board staf internal
 * 3. create: Registrasi Job Order baru
 * 4. advance_milestone: Menaikkan milestone satu-klik
 * 5. reset_demo: Mengembalikan mock data awal dengan 2 skenario Bank BTN
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

// Konfigurasi Google Apps Script Engine Proxy (Dapat dihubungkan ke Deployment ID Web App)
define('GAS_TRACKING_URL', 'https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec');

/**
 * Smart Proxy Forwarder ke SSOT Google Apps Script Web App
 */
function callGASTrackingService($action, $data = [], $method = 'POST', $timeout = 8) {
    if (!defined('GAS_TRACKING_URL') || empty(GAS_TRACKING_URL)) {
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

$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0777, true);
}
$storageFile = $dataDir . '/job_tracking_staging.json';

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

// Inisialisasi Mock Data Awal dengan 2 Skenario Bank BTN + Mandiri & BRI
function getInitialSeedData() {
    $now = time();
    $wibFormat = 'd M Y, H:i \W\I\B';
    
    // =========================================================================
    // SKENARIO 1 BANK BTN: KPR Retail Rumah Tinggal (Tahap M-04 Analisis Nilai)
    // =========================================================================
    $mTemplate1 = getMilestoneTemplate();
    $mTemplate1['M-01']['status'] = 'completed';
    $mTemplate1['M-01']['timestamp'] = date($wibFormat, $now - (86400 * 2));
    $mTemplate1['M-01']['note'] = 'SPK KPR No. 042/BTN-JKT/KPR-SPK/X/2026, SHM No. 402, dan IMB/PBG lengkap diverifikasi resmi.';

    $mTemplate1['M-02']['status'] = 'completed';
    $mTemplate1['M-02']['timestamp'] = date($wibFormat, $now - (86400 * 2) + 14400);
    $mTemplate1['M-02']['note'] = 'Penilai Pelaksana Hendra Wijaya, S.T. ditunjuk. Jadwal survei disepakati bersama debitur.';

    $mTemplate1['M-03']['status'] = 'completed';
    $mTemplate1['M-03']['timestamp'] = date($wibFormat, $now - 86400);
    $mTemplate1['M-03']['note'] = 'Inspeksi fisik tanah 180 m² & bangunan 220 m², geotagging GPS (-6.2215, 106.8324), dan foto agunan selesai.';

    $mTemplate1['M-04']['status'] = 'in_progress';
    $mTemplate1['M-04']['timestamp'] = date($wibFormat, $now - 7200);
    $mTemplate1['M-04']['note'] = 'Sedang proses analisis komparasi pasar residensial dan estimasi Nilai Pasar serta Nilai Likuidasi KPR.';

    $item1 = [
        'id' => 'JO-JKT-2026-0001',
        'jo_number' => 'JO-JKT-2026-0001',
        'spk_number' => '042/BTN-JKT/KPR-SPK/X/2026',
        'spk_date' => date('Y-m-d', $now - (86400 * 2)),
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
        'penilai_pelaksana' => 'Hendra Wijaya, S.T.',
        'surveyor' => 'Hendra Wijaya, S.T.',
        'reviewer' => 'Sigit Paryanto, S.E., MAPPI (Cert.)',
        'reviewer_spm' => 'Sigit Paryanto, S.E., MAPPI (Cert.)',
        'penilai_publik' => 'Ir. Nanang Rahayu, M.Sc., MAPPI (Cert.)',
        'current_milestone' => 'M-04',
        'current_milestone_title' => 'Analisis Penilaian & Kalkulasi Nilai',
        'progress_percent' => 57,
        'milestones' => $mTemplate1,
        'keterangan_resmi' => 'Tahap berjalan saat ini berada dalam koridor SLA H+3 Bank BTN KPR Retail. Analisis perbandingan data pasar dan kalkulasi nilai indikasi pasar rumah tinggal sedang dikerjakan secara teliti berpedoman pada Standar Penilaian Indonesia (SPI 105 & SPI 204).',
        'wa_admin' => '6281218008899',
        'created_at' => date('Y-m-d H:i:s', $now - (86400 * 2)),
        'updated_at' => date('Y-m-d H:i:s', $now)
    ];

    // =========================================================================
    // SKENARIO 2 BANK BTN: Gudang Logistik Komersial Pulogadung (Tahap M-03 Selesai)
    // =========================================================================
    $mTemplate2 = getMilestoneTemplate();
    $mTemplate2['M-01']['status'] = 'completed';
    $mTemplate2['M-01']['timestamp'] = date($wibFormat, $now - (86400 * 3));
    $mTemplate2['M-01']['note'] = 'SPK Komersial No. 048/BTN-CBC/KOM-SPK/X/2026, SHGB No. 1104, dan PBG industri lengkap terverifikasi.';

    $mTemplate2['M-02']['status'] = 'completed';
    $mTemplate2['M-02']['timestamp'] = date($wibFormat, $now - (86400 * 2));
    $mTemplate2['M-02']['note'] = 'Penilai Pelaksana Ahmad Fauzi, S.T. ditunjuk. Jadwal survei komersial dikoordinasikan dengan PIC logistik.';

    $mTemplate2['M-03']['status'] = 'completed';
    $mTemplate2['M-03']['timestamp'] = date($wibFormat, $now - 14400);
    $mTemplate2['M-03']['note'] = 'Inspeksi fisik tapak industri 4.850 m² dan gudang 3.200 m², geotagging GPS (-6.1982, 106.9142), dan foto agunan selesai.';

    $mTemplate2['M-04']['status'] = 'in_progress';
    $mTemplate2['M-04']['timestamp'] = date($wibFormat, $now - 3600);
    $mTemplate2['M-04']['note'] = 'Persiapan kertas kerja kalkulasi biaya penggantian terdepresiasi (DRC) dan riset sewa pergudangan.';

    $item2 = [
        'id' => 'JO-JKT-2026-0002',
        'jo_number' => 'JO-JKT-2026-0002',
        'spk_number' => '048/BTN-CBC/KOM-SPK/X/2026',
        'spk_date' => date('Y-m-d', $now - (86400 * 3)),
        'instansi' => 'PT Bank Tabungan Negara (Persero) Tbk',
        'instansi_singkat' => 'Bank BTN',
        'unit_kerja' => 'BTN CBC Jakarta (Commercial Banking Center)',
        'debitur' => 'PT Bangun Prima Perkasa',
        'pic_pemohon' => 'Bambang Sudarsono, S.E.',
        'pic_contact' => '081299881122',
        'kantor' => 'Kantor Pusat Jakarta',
        'kantor_code' => 'PUSAT',
        'jenis_properti' => 'Gudang Logistik Komersial Pulogadung',
        'lokasi_aset' => 'Jl. Rawa Gelam IV No. 12, Kawasan Industri Pulogadung, Jakarta Timur',
        'luas_tanah' => '4.850 m²',
        'luas_bangunan' => '3.200 m²',
        'sla_days' => 7,
        'sla_deadline' => date('Y-m-d', $now + (86400 * 4)),
        'sla_status' => 'on_track',
        'sla_label' => 'SLA H+7 Bank BTN Komersial (Sisa 4 Hari)',
        'penilai_pelaksana' => 'Ahmad Fauzi, S.T.',
        'surveyor' => 'Ahmad Fauzi, S.T.',
        'reviewer' => 'Danny Taufik Hidayat, S.E., S.H.',
        'reviewer_spm' => 'Danny Taufik Hidayat, S.E., S.H.',
        'penilai_publik' => 'Ir. Nanang Rahayu, M.Sc., MAPPI (Cert.)',
        'current_milestone' => 'M-03',
        'current_milestone_title' => 'Inspeksi Lapangan Selesai',
        'progress_percent' => 43,
        'milestones' => $mTemplate2,
        'keterangan_resmi' => 'Inspeksi fisik tapak industri 4.850 m² dan gudang 3.200 m² telah tuntas dilaksanakan oleh Penilai Pelaksana. Tim penilai sedang menyiapkan kertas kerja kalkulasi biaya penggantian terdepresiasi (DRC).',
        'wa_admin' => '6281218008899',
        'created_at' => date('Y-m-d H:i:s', $now - (86400 * 3)),
        'updated_at' => date('Y-m-d H:i:s', $now)
    ];

    // =========================================================================
    // SKENARIO 3 BANK MANDIRI: Bandung (Tahap M-05 Reviewer SPM)
    // =========================================================================
    $mTemplate3 = getMilestoneTemplate();
    $mTemplate3['M-01']['status'] = 'completed'; $mTemplate3['M-01']['timestamp'] = date($wibFormat, $now - (86400 * 4));
    $mTemplate3['M-02']['status'] = 'completed'; $mTemplate3['M-02']['timestamp'] = date($wibFormat, $now - (86400 * 3));
    $mTemplate3['M-03']['status'] = 'completed'; $mTemplate3['M-03']['timestamp'] = date($wibFormat, $now - (86400 * 2));
    $mTemplate3['M-04']['status'] = 'completed'; $mTemplate3['M-04']['timestamp'] = date($wibFormat, $now - 86400);
    $mTemplate3['M-05']['status'] = 'in_progress'; $mTemplate3['M-05']['timestamp'] = date($wibFormat, $now - 3600);
    $mTemplate3['M-05']['note'] = 'Reviewer sedang melakukan telaah kertas kerja kalkulasi dan pengujian asumsi kritis.';

    $item3 = [
        'id' => 'JO-BDG-2026-0015',
        'jo_number' => 'JO-BDG-2026-0015',
        'spk_number' => 'MDR/BDG/KOM-098/X/2026',
        'spk_date' => date('Y-m-d', $now - (86400 * 4)),
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
        'penilai_pelaksana' => 'Ahmad Fauzi, S.T.',
        'surveyor' => 'Ahmad Fauzi, S.T.',
        'reviewer' => 'Danny Taufik Hidayat, S.E., S.H.',
        'reviewer_spm' => 'Danny Taufik Hidayat, S.E., S.H.',
        'penilai_publik' => 'Sigit Paryanto, S.E., MAPPI (Cert.)',
        'current_milestone' => 'M-05',
        'current_milestone_title' => 'Kendali Mutu & Reviewer SPM',
        'progress_percent' => 71,
        'milestones' => $mTemplate3,
        'keterangan_resmi' => 'Kertas kerja telah selesai disusun dan saat ini memasuki proses verifikasi kendali mutu berjenjang oleh Reviewer SPM.',
        'wa_admin' => '6281218008899',
        'created_at' => date('Y-m-d H:i:s', $now - (86400 * 4)),
        'updated_at' => date('Y-m-d H:i:s', $now)
    ];

    // =========================================================================
    // SKENARIO 4 BANK BRI: Makassar (Tahap M-02 Penetapan Tim)
    // =========================================================================
    $mTemplate4 = getMilestoneTemplate();
    $mTemplate4['M-01']['status'] = 'completed'; $mTemplate4['M-01']['timestamp'] = date($wibFormat, $now - 86400);
    $mTemplate4['M-02']['status'] = 'in_progress'; $mTemplate4['M-02']['timestamp'] = date($wibFormat, $now - 14400);
    $mTemplate4['M-02']['note'] = 'Konfirmasi kesiapan debitur untuk survei lapangan objek perkebunan & pabrik.';

    $item4 = [
        'id' => 'JO-MKS-2026-0008',
        'jo_number' => 'JO-MKS-2026-0008',
        'spk_number' => 'B.341-AGR/MKS/10/2026',
        'spk_date' => date('Y-m-d', $now - 86400),
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
        'penilai_pelaksana' => 'Faisal Rahman, S.T.',
        'surveyor' => 'Faisal Rahman, S.T.',
        'reviewer' => 'Ir. Bambang Tri, MAPPI',
        'reviewer_spm' => 'Ir. Bambang Tri, MAPPI',
        'penilai_publik' => 'Ir. Nanang Rahayu, M.Sc., MAPPI (Cert.)',
        'current_milestone' => 'M-02',
        'current_milestone_title' => 'Penetapan Tim & Jadwal Survei',
        'progress_percent' => 28,
        'milestones' => $mTemplate4,
        'keterangan_resmi' => 'SPK telah diverifikasi. Jadwal survei fisik lapangan sedang dikoordinasikan bersama pihak debitur dan petugas bank.',
        'wa_admin' => '6281218008899',
        'created_at' => date('Y-m-d H:i:s', $now - 86400),
        'updated_at' => date('Y-m-d H:i:s', $now)
    ];

    // =========================================================================
    // SKENARIO 5 BANK BCA: Jakarta (Tahap M-07 Selesai 100%)
    // =========================================================================
    $mTemplate5 = getMilestoneTemplate();
    foreach ($mTemplate5 as $k => &$m) {
        $m['status'] = 'completed';
        $m['timestamp'] = date($wibFormat, $now - (86400 * 3));
    }
    $mTemplate5['M-07']['note'] = 'Laporan penilaian resmi No. 00192/2.0160-00/PI/03/0192/1/X/2026 telah diserahkan lengkap.';

    $item5 = [
        'id' => 'JO-JKT-2026-0003',
        'jo_number' => 'JO-JKT-2026-0003',
        'spk_number' => 'BCA/KCK/APP-551/X/2026',
        'spk_date' => date('Y-m-d', $now - (86400 * 7)),
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
        'penilai_pelaksana' => 'Hendra Wijaya, S.T.',
        'surveyor' => 'Hendra Wijaya, S.T.',
        'reviewer' => 'Sigit Paryanto, S.E., MAPPI (Cert.)',
        'reviewer_spm' => 'Sigit Paryanto, S.E., MAPPI (Cert.)',
        'penilai_publik' => 'Ir. Nanang Rahayu, M.Sc., MAPPI (Cert.)',
        'current_milestone' => 'M-07',
        'current_milestone_title' => 'Penyerahan Laporan Final',
        'progress_percent' => 100,
        'milestones' => $mTemplate5,
        'keterangan_resmi' => 'Seluruh tahapan penilaian telah tuntas diselesaikan dan laporan resmi ber-Nolap telah diserahkan kepada pihak perbankan.',
        'wa_admin' => '6281218008899',
        'created_at' => date('Y-m-d H:i:s', $now - (86400 * 7)),
        'updated_at' => date('Y-m-d H:i:s', $now - (86400 * 3))
    ];

    return [
        $item1['id'] => $item1,
        $item2['id'] => $item2,
        $item3['id'] => $item3,
        $item4['id'] => $item4,
        $item5['id'] => $item5
    ];
}

// Muat data dari file penyimpanan lokal
function loadData($storageFile) {
    if (file_exists($storageFile)) {
        $content = @file_get_contents($storageFile);
        $json = @json_decode($content, true);
        if (is_array($json) && !empty($json) && isset($json['JO-JKT-2026-0001'])) {
            return $json;
        }
    }
    $initial = getInitialSeedData();
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

// Routing Aksi
$action = $_GET['action'] ?? $_POST['action'] ?? 'list';
$jobs = loadData($storageFile);

// =========================================================================
// 1. ACTION: TRACK (Pencarian Publik 7 Milestone)
// =========================================================================
if ($action === 'track' || $action === 'track_public') {
    $joInput = trim($_GET['jo'] ?? $_POST['jo'] ?? $_GET['id_jo'] ?? $_POST['id_jo'] ?? '');
    $phoneInput = trim($_GET['phone'] ?? $_POST['phone'] ?? $_GET['telepon_pic'] ?? $_POST['telepon_pic'] ?? '');

    // Sanitasi input pencarian
    $cleanJo = strtoupper(preg_replace('/[^a-zA-Z0-9\-]/', '', $joInput));
    $cleanPhone = preg_replace('/[^0-9]/', '', $phoneInput);

    // 1. Coba proxy query ke SSOT Google Apps Script terlebih dahulu
    $gasTrack = callGASTrackingService('track', ['id_jo' => $cleanJo, 'telepon_pic' => $cleanPhone], 'GET');
    if ($gasTrack && isset($gasTrack['data'])) {
        echo json_encode([
            'status' => 'success',
            'source' => 'GAS_SSOT_LIVE',
            'data' => $gasTrack['data']
        ]);
        exit;
    }

    $found = null;

    // Cari exact match JO Number
    foreach ($jobs as $id => $job) {
        if (strtoupper($job['jo_number']) === $cleanJo) {
            $found = $job;
            break;
        }
    }

    // Jika belum ketemu, cari pencarian nomor kontak
    if (!$found && !empty($cleanPhone)) {
        foreach ($jobs as $id => $job) {
            $jPhone = preg_replace('/[^0-9]/', '', $job['pic_contact']);
            if (substr($jPhone, -6) === substr($cleanPhone, -6)) {
                $found = $job;
                break;
            }
        }
    }

    // Jika belum ketemu, cari pencarian parsial nomor JO
    if (!$found && !empty($cleanJo)) {
        foreach ($jobs as $id => $job) {
            if (strpos(strtoupper($job['jo_number']), $cleanJo) !== false) {
                $found = $job;
                break;
            }
        }
    }

    // Default Fallback: Jika pengguna mengosongkan atau mengetik contoh JO Bank BTN
    if (!$found) {
        $found = $jobs['JO-JKT-2026-0001'] ?? reset($jobs);
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Status penugasan ditemukan.',
        'data' => $found
    ]);
    exit;
}

// =========================================================================
// 2. ACTION: LIST (Daftar Penugasan untuk Task Board Staf Internal)
// =========================================================================
if ($action === 'list' || $action === 'get_active_jobs') {
    echo json_encode([
        'status' => 'success',
        'count' => count($jobs),
        'data' => array_values($jobs)
    ]);
    exit;
}

// =========================================================================
// 3. ACTION: CREATE (Registrasi Job Order Baru dari Portal)
// =========================================================================
if ($action === 'create' || $action === 'create_job_order') {
    $rawInput = file_get_contents('php://input');
    $payload = @json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $kantor = $payload['kantor'] ?? $payload['kantor_pelaksana'] ?? 'Kantor Pusat Jakarta';
    $kantorCode = 'PUSAT';
    if (stripos($kantor, 'Bandung') !== false) $kantorCode = 'BDG';
    elseif (stripos($kantor, 'Padang') !== false) $kantorCode = 'PDG';
    elseif (stripos($kantor, 'Makassar') !== false) $kantorCode = 'MKS';
    elseif (stripos($kantor, 'Palembang') !== false) $kantorCode = 'PLM';

    $year = date('Y');
    $nextSeq = str_pad(count($jobs) + 1, 4, '0', STR_PAD_LEFT);
    $joNumber = 'JO-' . ($kantorCode === 'PUSAT' ? 'JKT' : $kantorCode) . '-' . $year . '-' . $nextSeq;

    $now = time();
    $wibFormat = 'd M Y, H:i \W\I\B';
    $mTemplate = getMilestoneTemplate();
    
    // M-01 Selesai saat registrasi
    $mTemplate['M-01']['status'] = 'completed';
    $mTemplate['M-01']['timestamp'] = date($wibFormat, $now);
    $mTemplate['M-01']['note'] = 'SPK No. ' . ($payload['spk_number'] ?? '-') . ' teregistrasi resmi di sistem OPINI NSR.';
    
    // M-02 Masuk Tahap Berjalan
    $penilaiPelaksana = $payload['penilai_pelaksana'] ?? $payload['surveyor'] ?? 'Hendra Wijaya, S.T.';
    $mTemplate['M-02']['status'] = 'in_progress';
    $mTemplate['M-02']['timestamp'] = date($wibFormat, $now);
    $mTemplate['M-02']['note'] = 'Penetapan Penilai Pelaksana / Surveyor: ' . $penilaiPelaksana;

    $slaDays = (int)($payload['sla_days'] ?? 3);

    $newJob = [
        'id' => $joNumber,
        'jo_number' => $joNumber,
        'spk_number' => $payload['spk_number'] ?? ('SPK/' . $nextSeq . '/' . date('m/Y')),
        'spk_date' => $payload['spk_date'] ?? date('Y-m-d'),
        'instansi' => $payload['instansi'] ?? 'PT Bank Tabungan Negara (Persero) Tbk',
        'instansi_singkat' => $payload['instansi_singkat'] ?? 'Bank Rekanan',
        'unit_kerja' => $payload['unit_kerja'] ?? 'KC Jakarta Kuningan',
        'debitur' => $payload['debitur'] ?? 'Debitur Baru',
        'pic_pemohon' => $payload['pic_pemohon'] ?? 'PIC Bank',
        'pic_contact' => $payload['pic_contact'] ?? '081234567890',
        'kantor' => $kantor,
        'kantor_code' => $kantorCode,
        'jenis_properti' => $payload['jenis_properti'] ?? 'KPR Retail (Rumah Tinggal)',
        'lokasi_aset' => $payload['lokasi_aset'] ?? 'Alamat Objek Penilaian',
        'luas_tanah' => $payload['luas_tanah'] ?? '-',
        'luas_bangunan' => $payload['luas_bangunan'] ?? '-',
        'sla_days' => $slaDays,
        'sla_deadline' => date('Y-m-d', $now + ($slaDays * 86400)),
        'sla_status' => 'on_track',
        'sla_label' => 'SLA H+' . $slaDays . ' (Dalam Proses)',
        'penilai_pelaksana' => $penilaiPelaksana,
        'surveyor' => $penilaiPelaksana,
        'reviewer' => $payload['reviewer'] ?? $payload['reviewer_spm'] ?? 'Sigit Paryanto, S.E., MAPPI (Cert.)',
        'reviewer_spm' => $payload['reviewer_spm'] ?? $payload['reviewer'] ?? 'Sigit Paryanto, S.E., MAPPI (Cert.)',
        'penilai_publik' => $payload['penilai_publik'] ?? 'Ir. Nanang Rahayu, M.Sc., MAPPI (Cert.)',
        'current_milestone' => 'M-02',
        'current_milestone_title' => 'Penetapan Tim & Jadwal Survei',
        'progress_percent' => 28,
        'milestones' => $mTemplate,
        'keterangan_resmi' => 'Registrasi awal berhasil. Penilai Pelaksana / Surveyor sedang menyiapkan surat tugas inspeksi lapangan.',
        'wa_admin' => '6281218008899',
        'created_at' => date('Y-m-d H:i:s', $now),
        'updated_at' => date('Y-m-d H:i:s', $now)
    ];

    $jobs[$joNumber] = $newJob;
    saveData($storageFile, $jobs);

    echo json_encode([
        'status' => 'success',
        'message' => 'Job Order ' . $joNumber . ' berhasil didaftarkan.',
        'data' => $newJob
    ]);
    exit;
}

// =========================================================================
// 4. ACTION: ADVANCE_MILESTONE (Menaikkan Milestone Satu-Klik)
// =========================================================================
if ($action === 'advance_milestone') {
    $rawInput = file_get_contents('php://input');
    $payload = @json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $joId = $payload['jo'] ?? $payload['id'] ?? $payload['id_jo'] ?? '';
    $targetM = $payload['target_milestone'] ?? '';
    $customNote = $payload['note'] ?? $payload['catatan_internal'] ?? '';

    if (!isset($jobs[$joId])) {
        foreach ($jobs as $id => $j) {
            if ($j['jo_number'] === $joId) {
                $joId = $id;
                break;
            }
        }
    }

    if (!isset($jobs[$joId])) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Job Order tidak ditemukan.']);
        exit;
    }

    $job = &$jobs[$joId];
    $currentM = $job['current_milestone'];
    $mKeys = ['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06', 'M-07'];
    $currentIndex = array_search($currentM, $mKeys);

    if (empty($targetM)) {
        $nextIndex = min(count($mKeys) - 1, $currentIndex + 1);
        $targetM = $mKeys[$nextIndex];
    }

    $now = time();
    $wibFormat = 'd M Y, H:i \W\I\B';

    $targetIndex = array_search($targetM, $mKeys);
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
                $job['sla_status'] = 'completed';
                $job['sla_label'] = 'Selesai 100%';
            } else {
                $job['milestones'][$k]['status'] = 'in_progress';
                $job['milestones'][$k]['timestamp'] = date($wibFormat, $now);
                if (!empty($customNote)) $job['milestones'][$k]['note'] = $customNote;
            }
        }
    }

    $job['current_milestone'] = $targetM;
    $job['current_milestone_title'] = $job['milestones'][$targetM]['title'];
    $job['progress_percent'] = calculateProgress($targetM);
    $job['updated_at'] = date('Y-m-d H:i:s', $now);

    saveData($storageFile, $jobs);

    echo json_encode([
        'status' => 'success',
        'message' => 'Milestone penugasan ' . $job['jo_number'] . ' berhasil dimajukan ke ' . $targetM,
        'data' => $job
    ]);
    exit;
}

// =========================================================================
// 5. ACTION: RESET_DEMO (Mengembalikan Seed Data Awal 2 Skenario BTN)
// =========================================================================
if ($action === 'reset_demo') {
    $initial = getInitialSeedData();
    saveData($storageFile, $initial);
    echo json_encode([
        'status' => 'success',
        'message' => 'Data simulasi staging berhasil direset ke kondisi awal (2 Skenario Bank BTN aktif).',
        'data' => array_values($initial)
    ]);
    exit;
}

// Default response
echo json_encode([
    'status' => 'success',
    'endpoint' => 'KJPP NSR Job Tracking Staging API',
    'scenarios' => [
        'JO-JKT-2026-0001' => 'KPR Retail Rumah Tinggal - Hendra Wijaya, S.T. (M-04)',
        'JO-JKT-2026-0002' => 'Gudang Logistik Komersial Pulogadung - PT Bangun Prima Perkasa (M-03)'
    ],
    'actions' => ['track', 'list', 'create', 'advance_milestone', 'reset_demo']
]);
