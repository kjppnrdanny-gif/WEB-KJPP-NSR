<?php
// Test Script for Lingkup Penugasan Dual Workflow Backend
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['HTTP_HOST'] = 'localhost';

function testCallEndpoint($action, $payload, $sessionUser) {
    $runnerFile = __DIR__ . '/_temp_runner.php';
    $payloadJson = json_encode($payload);
    
    $code = '<?php
session_name("NSR_SESSION");
session_start();
$_SESSION["nsr_user"] = ' . var_export($sessionUser, true) . ';
$_SESSION["nsr_login_time"] = time();
$_SERVER["REQUEST_METHOD"] = "POST";
$_SERVER["HTTP_HOST"] = "localhost";
$_SERVER["REMOTE_ADDR"] = "127.0.0.1";
$_GET["action"] = ' . var_export($action, true) . ';

// Mock php://input
$GLOBALS["TEST_POST_DATA"] = ' . var_export($payloadJson, true) . ';

// Hook into nolap-data-handler by preloading input stream mock
namespace {
    $rawInput = $GLOBALS["TEST_POST_DATA"];
}
';
    // We can directly test the PHP actions by running a short php script that creates the test context
    $code .= '
$dataDir = __DIR__ . "/../data";
$payload = json_decode($GLOBALS["TEST_POST_DATA"], true) ?: [];
$userRole = $_SESSION["nsr_user"]["role"] ?? "ANONYMOUS";
$userBranch = $_SESSION["nsr_user"]["wilayah"] ?? "";
$currentUser = $_SESSION["nsr_user"];
$userDisplayName = $_SESSION["nsr_user"]["nama"] ?? "User";
$registerConfigFile = $dataDir . "/official_register_config.json";
$dualGateDbFile = $dataDir . "/dual_gate_database.json";
$mailQueueFile = $dataDir . "/mail_queue.json";

require_once __DIR__ . "/../nolap-data-handler.php";
';
    file_put_contents($runnerFile, $code);
    $out = shell_exec('php ' . escapeshellarg($runnerFile));
    @unlink($runnerFile);
    return $out;
}

// 1. Test Padang trying to issue Comprehensive Property (Mall/Komersial) Mandiri
$padangUser = [
    'sub' => 'cabang_pdg',
    'nama' => 'Admin Cabang Padang',
    'role' => 'ADMIN_CABANG',
    'wilayah' => 'Padang',
    'wilayahLabel' => 'Kantor Cabang Padang',
    'isCabang' => true
];

$payloadPadangComprehensive = [
    'idPenugasan' => 'TEST-PDG-COMP-01',
    'kantorWilayah' => 'Kantor Cabang Padang',
    'serviceClassification' => 'PROPERTY',
    'jenisObjek' => 'Mall dan Pusat Perbelanjaan Komersial',
    'tujuanPenilaian' => 'Agunan Bank',
    'namaKlien' => 'Bank Mandiri',
    'namaDebitur' => 'PT Mega Mall Padang',
    'tanggalSurat' => '2026-10-23',
    'jenisLaporan' => 'APP'
];

echo "=== TEST 1: Padang (PS) Menerbitkan Mandiri Objek Komprehensif (Wajib Ditolak 422) ===\n";
// Let's test with a direct script that invokes nolap-data-handler via curl or built-in server, or direct function execution
