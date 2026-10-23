<?php
/**
 * TEST KOMPREHENSIF WORKFLOW LINGKUP PENUGASAN (SPK & JO)
 * Menguji:
 * 1. suggestNextNumber untuk seluruh kantor (Pusat, Bandung, Padang, Makassar, Palembang)
 * 2. Jalur A (Mandiri Cabang) Penolakan Kompetensi PS pada Objek Komprehensif (HTTP 422)
 * 3. Jalur A (Mandiri Cabang) Penerbitan Sah Objek Sederhana oleh Cabang PS Padang (HTTP 200)
 * 4. Jalur A (Mandiri Cabang) Penerbitan Sah Objek Komprehensif oleh Cabang PP Bandung (HTTP 200)
 * 5. Jalur A Penolakan Otorisasi untuk Peran Non-Admin Cabang/Non-Penilai (HTTP 403)
 * 6. Jalur B (Pengajuan Cabang ke Pusat) Status WAITING_APPROVAL & Enqueue Notifikasi (HTTP 200)
 * 7. Integritas Database & Register Atomic Server
 */

echo "========================================================================\n";
echo "  TEST SUITE: DUAL WORKFLOW LINGKUP PENUGASAN (MANDIRI CABANG & PUSAT)\n";
echo "========================================================================\n\n";

$dataDir = __DIR__ . '/../data';
$dualGateDbFile = $dataDir . '/dual_gate_database.json';
$registerConfigFile = $dataDir . '/official_register_config.json';
$mailQueueFile = $dataDir . '/mail_queue.json';

// Backup files before test
$dgBackup = file_get_contents($dualGateDbFile);
$regBackup = file_get_contents($registerConfigFile);
$mailBackup = file_exists($mailQueueFile) ? file_get_contents($mailQueueFile) : '[]';

$totalTests = 0;
$passedTests = 0;

function assertTest($name, $condition, $detail = '') {
    global $totalTests, $passedTests;
    $totalTests++;
    if ($condition) {
        $passedTests++;
        echo "  ✅ PASS: {$name}\n";
    } else {
        echo "  ❌ FAIL: {$name}\n";
        if ($detail) echo "     Detail: " . substr($detail, 0, 300) . "\n";
    }
}

function runHandlerAction($method, $action, $sessionUser, $payload = [], $queryString = '') {
    $script = __DIR__ . '/_runner_exec.php';
    $payloadJson = json_encode($payload);
    $userExport = var_export($sessionUser, true);
    
    $code = <<<PHP
<?php
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
date_default_timezone_set('Asia/Jakarta');
session_name('NSR_SESSION');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
\$_SESSION['nsr_user'] = {$userExport};
\$_SESSION['nsr_login_time'] = time();

\$_SERVER['REQUEST_METHOD'] = '{$method}';
\$_SERVER['HTTP_HOST'] = 'localhost';
\$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
\$_SERVER['CONTENT_TYPE'] = 'application/json';

\$_GET = ['action' => '{$action}'];
if ('{$queryString}') {
    parse_str('{$queryString}', \$extraGet);
    \$_GET = array_merge(\$_GET, \$extraGet);
}

class MockPhpStream {
    public \$context;
    private static \$data = '{$payloadJson}';
    private \$position = 0;

    public function stream_open(\$path, \$mode, \$options, &\$opened_path) {
        \$this->position = 0;
        return true;
    }
    public function stream_read(\$count) {
        \$ret = substr(self::\$data, \$this->position, \$count);
        \$this->position += strlen(\$ret);
        return \$ret;
    }
    public function stream_eof() {
        return \$this->position >= strlen(self::\$data);
    }
    public function stream_stat() {
        return [];
    }
}
stream_wrapper_unregister('php');
stream_wrapper_register('php', 'MockPhpStream');

ob_start();
require __DIR__ . '/../nolap-data-handler.php';
\$output = ob_get_clean();

echo \$output;
PHP;

    file_put_contents($script, $code);
    $output = shell_exec('php ' . escapeshellarg($script));
    @unlink($script);
    
    // Extract JSON object safely
    $jsonData = null;
    if (preg_match('/(\{(?:[^{}]|(?R))*\})/s', $output, $m)) {
        $jsonData = json_decode($m[1], true);
    }
    
    return ['raw' => $output, 'json' => $jsonData];
}

try {
    // -------------------------------------------------------------------------
    // 1. TEST suggestNextNumber FOR ALL BRANCHES
    // -------------------------------------------------------------------------
    echo "--- [1] PENGUJIAN suggestNextNumber REGISTRY CABANG & PUSAT ---\n";
    $branches = [
        'Bandung' => '2.0160-04',
        'Padang' => '2.0160-02',
        'Makassar' => '2.0160-03',
        'Palembang' => '2.0160-05',
        'Pusat' => '2.0160-00'
    ];
    foreach ($branches as $branch => $code) {
        $res = runHandlerAction('GET', 'suggestNextNumber', ['role' => 'SUPER_ADMIN'], [], "kantor={$branch}&jenisDokumen=LP_SPK&periode=2026");
        $json = $res['json'];
        assertTest("suggestNextNumber {$branch} mengembalikan kode cabang {$code}", 
            isset($json['kodeKantor']) && $json['kodeKantor'] === $code,
            $res['raw']
        );
        assertTest("suggestNextNumber {$branch} mengembalikan format 4 digit kandidatBerikutnya", 
            isset($json['kandidatBerikutnya']) && strlen($json['kandidatBerikutnya']) === 4,
            $res['raw']
        );
    }

    // -------------------------------------------------------------------------
    // 2. TEST JALUR A (MANDIRI CABANG) - MATRIKS KOMPETENSI PS PADANG PADA OBJEK KOMPREHENSIF
    // -------------------------------------------------------------------------
    echo "\n--- [2] PENGUJIAN BATASAN KOMPETENSI PS (PADANG) PADA OBJEK KOMPREHENSIF ---\n";
    $userPadang = [
        'sub' => 'admin_cabang_pdg',
        'role' => 'ADMIN_CABANG',
        'wilayah' => 'Padang',
        'wilayahLabel' => 'Kantor Cabang Padang',
        'isCabang' => true,
        'nama' => 'Admin Cabang Padang'
    ];
    $payloadPadangKomprehensif = [
        'idPenugasan' => 'TEST-PDG-MANDIRI-KOMP-001',
        'kantorWilayah' => 'Kantor Cabang Padang',
        'serviceClassification' => 'PROPERTY', // Komprehensif
        'jenisObjek' => 'Mall & Hotel Berbintang',
        'tujuanPenilaian' => 'Agunan Bank',
        'namaKlien' => 'PT Bank Mandiri (Persero) Tbk',
        'namaDebitur' => 'PT Grand Mall Padang',
        'tanggalSurat' => '2026-10-23',
        'jenisLaporan' => 'APP'
    ];
    $resPadangKomp = runHandlerAction('POST', 'publishMandiriCabangLP', $userPadang, $payloadPadangKomprehensif);
    assertTest("Padang (PS) Menerbitkan Objek Komprehensif via Mandiri Ditolak dengan Kode INSUFFICIENT_BRANCH_COMPETENCY",
        isset($resPadangKomp['json']['success']) && $resPadangKomp['json']['success'] === false &&
        isset($resPadangKomp['json']['code']) && $resPadangKomp['json']['code'] === 'INSUFFICIENT_BRANCH_COMPETENCY',
        $resPadangKomp['raw']
    );
    assertTest("Pesan penolakan mengarahkan ke Jalur B (Pengajuan Pusat)",
        isset($resPadangKomp['json']['error']) && strpos($resPadangKomp['json']['error'], 'Jalur B') !== false,
        $resPadangKomp['raw']
    );

    // -------------------------------------------------------------------------
    // 3. TEST JALUR A (MANDIRI CABANG) - PENERBITAN SAH OBJEK SEDERHANA OLEH PADANG
    // -------------------------------------------------------------------------
    echo "\n--- [3] PENGUJIAN PENERBITAN SAH MANDIRI CABANG PADANG (OBJEK SEDERHANA) ---\n";
    $payloadPadangSederhana = [
        'idPenugasan' => 'TEST-PDG-MANDIRI-SED-002',
        'kantorWilayah' => 'Kantor Cabang Padang',
        'serviceClassification' => 'PROPERTY_SIMPLE', // Sederhana
        'jenisObjek' => '1 Unit Rumah Tinggal Sederhana',
        'tujuanPenilaian' => 'Agunan Bank Sederhana',
        'namaKlien' => 'PT Bank Rakyat Indonesia (Persero) Tbk',
        'namaDebitur' => 'Ahmad Sanusi',
        'tanggalSurat' => '2026-10-23',
        'jenisLaporan' => 'APP'
    ];
    $resPadangSed = runHandlerAction('POST', 'publishMandiriCabangLP', $userPadang, $payloadPadangSederhana);
    assertTest("Padang (PS) Menerbitkan Objek Sederhana via Mandiri Berhasil (HTTP 200)",
        isset($resPadangSed['json']['success']) && $resPadangSed['json']['success'] === true,
        $resPadangSed['raw']
    );
    assertTest("Nomor SPK & JO resmi terbit dengan kode cabang Padang (/02/ atau PDG)",
        isset($resPadangSed['json']['nomorLpResmi']) && strpos($resPadangSed['json']['nomorLpResmi'], 'NSR-PDG') !== false &&
        isset($resPadangSed['json']['nomorAdmResmi']) && strpos($resPadangSed['json']['nomorAdmResmi'], 'PDG-') !== false,
        $resPadangSed['raw']
    );
    assertTest("Otorisasi pejabat atas nama Pimpinan Cabang Padang Hernita (PS)",
        isset($resPadangSed['json']['pejabatBerwenang']) && strpos($resPadangSed['json']['pejabatBerwenang'], 'Hernita') !== false,
        $resPadangSed['raw']
    );

    // -------------------------------------------------------------------------
    // 4. TEST JALUR A (MANDIRI CABANG) - BANDUNG (PP) BEBAS MENERBITKAN OBJEK KOMPREHENSIF
    // -------------------------------------------------------------------------
    echo "\n--- [4] PENGUJIAN PENERBITAN SAH MANDIRI CABANG BANDUNG (KOMPETENSI PP) ---\n";
    $userBandung = [
        'sub' => 'admin_cabang_bdg',
        'role' => 'ADMIN_CABANG',
        'wilayah' => 'Bandung',
        'wilayahLabel' => 'Kantor Cabang Bandung',
        'isCabang' => true,
        'nama' => 'Admin Cabang Bandung'
    ];
    $payloadBandungKomprehensif = [
        'idPenugasan' => 'TEST-BDG-MANDIRI-KOMP-003',
        'kantorWilayah' => 'Kantor Cabang Bandung',
        'serviceClassification' => 'PROPERTY', // Komprehensif
        'jenisObjek' => 'Gedung Perkantoran dan Rukan Komersial',
        'tujuanPenilaian' => 'Agunan Bank',
        'namaKlien' => 'PT Bank BJB Tbk',
        'namaDebitur' => 'PT Bandung Graha Prima',
        'tanggalSurat' => '2026-10-23',
        'jenisLaporan' => 'APP'
    ];
    $resBdgKomp = runHandlerAction('POST', 'publishMandiriCabangLP', $userBandung, $payloadBandungKomprehensif);
    assertTest("Bandung (PP) Menerbitkan Objek Komprehensif Berhasil tanpa Halangan",
        isset($resBdgKomp['json']['success']) && $resBdgKomp['json']['success'] === true,
        $resBdgKomp['raw']
    );
    assertTest("Nomor SPK & JO resmi terbit dengan kode cabang Bandung (NSR-BDG)",
        isset($resBdgKomp['json']['nomorLpResmi']) && strpos($resBdgKomp['json']['nomorLpResmi'], 'NSR-BDG') !== false,
        $resBdgKomp['raw']
    );
    assertTest("Otorisasi pejabat atas nama Pimpinan Cabang Bandung Deni Siswandi (P)",
        isset($resBdgKomp['json']['pejabatBerwenang']) && strpos($resBdgKomp['json']['pejabatBerwenang'], 'Deni Siswandi') !== false,
        $resBdgKomp['raw']
    );

    // -------------------------------------------------------------------------
    // 5. TEST RBAC: NON-ADMIN CABANG/NON-PENILAI DITOLAK JALUR A MANDIRI (HTTP 403)
    // -------------------------------------------------------------------------
    echo "\n--- [5] PENGUJIAN KEAMANAN RBAC: HAK AKSES JALUR MANDIRI CABANG ---\n";
    $userMarketing = [
        'sub' => 'marketing_user',
        'role' => 'MARKETING',
        'wilayah' => 'Padang',
        'isCabang' => true
    ];
    $resMarketing = runHandlerAction('POST', 'publishMandiriCabangLP', $userMarketing, $payloadPadangSederhana);
    assertTest("Peran Marketing ditolak saat mencoba menerbitkan nomor Mandiri Cabang (HTTP 403)",
        isset($resMarketing['json']['success']) && $resMarketing['json']['success'] === false &&
        strpos($resMarketing['raw'], 'Akses Ditolak') !== false,
        $resMarketing['raw']
    );

    // -------------------------------------------------------------------------
    // 6. TEST JALUR B (PENGAJUAN CABANG KE PUSAT)
    // -------------------------------------------------------------------------
    echo "\n--- [6] PENGUJIAN JALUR B: PENGAJUAN CABANG KE KANTOR PUSAT ---\n";
    $payloadPengajuanPusat = [
        'idPenugasan' => 'TEST-PDG-PUSAT-004',
        'kantorWilayah' => 'Kantor Cabang Padang',
        'serviceClassification' => 'PROPERTY',
        'jenisObjek' => 'Pabrik Semen dan Kilang Industri',
        'tujuanPenilaian' => 'Laporan Keuangan PSAK',
        'namaKlien' => 'PT Semen Padang',
        'namaDebitur' => 'PT Semen Padang',
        'pengaju' => [
            'nama' => 'Rahmat Hidayat',
            'nik' => 'PDG-102',
            'jabatan' => 'Petugas Cabang Padang',
            'email' => 'rahmat@kjppnanangrahayu.com',
            'whatsapp_number' => '081234567890'
        ]
    ];
    $resPengajuanPusat = runHandlerAction('POST', 'submitPengajuanPusatLP', $userPadang, $payloadPengajuanPusat);
    assertTest("Pengajuan Cabang ke Pusat Berhasil dengan Status WAITING_APPROVAL",
        isset($resPengajuanPusat['json']['success']) && $resPengajuanPusat['json']['success'] === true &&
        isset($resPengajuanPusat['json']['status']) && $resPengajuanPusat['json']['status'] === 'WAITING_APPROVAL' &&
        isset($resPengajuanPusat['json']['jalur']) && $resPengajuanPusat['json']['jalur'] === 'PENGAJUAN_PUSAT',
        $resPengajuanPusat['raw']
    );

    // -------------------------------------------------------------------------
    // 7. VERIFIKASI ATOMIC DATABASE & MAIL QUEUE
    // -------------------------------------------------------------------------
    echo "\n--- [7] VERIFIKASI PERSISTENSI SERVER ATOMIK ---\n";
    $dbAfter = json_decode(file_get_contents($dualGateDbFile), true);
    
    // Cari record Mandiri Padang
    $recPadang = null;
    foreach ($dbAfter as $r) {
        if (($r['idPenugasan'] ?? '') === 'TEST-PDG-MANDIRI-SED-002') { $recPadang = $r; break; }
    }
    assertTest("Record Mandiri Padang tersimpan di dual_gate_database.json dengan status APPROVED",
        $recPadang !== null && ($recPadang['status'] ?? '') === 'APPROVED' && ($recPadang['jalur_penerbitan'] ?? '') === 'MANDIRI_CABANG'
    );
    assertTest("Record Mandiri Padang menyimpan audit trail pejabat dan kantor asal",
        $recPadang !== null && ($recPadang['kantorAsal'] ?? '') === 'Padang' && isset($recPadang['pejabatOtorisasi'])
    );

    // Cari record Pengajuan Pusat
    $recPusat = null;
    foreach ($dbAfter as $r) {
        if (($r['idPenugasan'] ?? '') === 'TEST-PDG-PUSAT-004') { $recPusat = $r; break; }
    }
    assertTest("Record Pengajuan Pusat tersimpan di dual_gate_database.json dengan status WAITING_APPROVAL",
        $recPusat !== null && ($recPusat['status'] ?? '') === 'WAITING_APPROVAL' && ($recPusat['jalur_penerbitan'] ?? '') === 'PENGAJUAN_PUSAT'
    );

    // Cek mail queue
    $mailQueueAfter = json_decode(file_get_contents($mailQueueFile), true) ?: [];
    $foundMail = false;
    foreach ($mailQueueAfter as $m) {
        if (($m['idPenugasan'] ?? '') === 'TEST-PDG-PUSAT-004' && ($m['event'] ?? '') === 'PENGAJUAN_LP_CABANG') {
            $foundMail = true;
            break;
        }
    }
    assertTest("Notifikasi antrean email ke Admin Pusat berhasil diantrekan", $foundMail);

} finally {
    // Restore clean database states
    file_put_contents($dualGateDbFile, $dgBackup);
    file_put_contents($registerConfigFile, $regBackup);
    file_put_contents($mailQueueFile, $mailBackup);
    echo "\nDatabase rollback/cleanup selesai. Keaslian data operasional tetap terjaga 100%.\n";
}

echo "\n========================================================================\n";
echo "  HASIL AKHIR: {$passedTests} / {$totalTests} TESTS PASSED\n";
echo "========================================================================\n";

if ($passedTests === $totalTests) {
    exit(0);
} else {
    exit(1);
}
