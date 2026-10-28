/**
 * Script untuk mengintegrasikan Dual Smart Mitigation Gate Engine ke dalam nolap-data-handler.php
 */
import fs from 'node:fs';

const targetPath = 'nolap-data-handler.php';
let content = fs.readFileSync(targetPath, 'utf8');

console.log('Reading nolap-data-handler.php...');

// 1. Tambah Official Token Hashes jika belum ada
const officialTokensSnippet = `
    // =========================================================================
    // KREDENSIAL RESMI DUAL SMART MITIGATION GATE (2026 EDITION)
    // =========================================================================
    // Token Header: [REDACTED_SPM_TOKEN]
    'dc943d94880e71c7d1d7f792b1485d6083e71c90d5ef1cf4d19b6446577612a9' => [
        'sub'               => 'danny_spm',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik, S.H.',
        'nama'              => 'Danny Taufik, S.H.',
        'email'             => 'danny.taufik@kjppnanangrahayu.com',
        'wa'                => '081280445731',
        'role'              => 'KEPALA_SPM',
        'roleLabel'         => 'Kepala SPM (Sistem Pengendalian Mutu)',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT'
    ],
    // Token Header: [REDACTED_DIVTEK_TOKEN]
    '718d4e13ec07cd7c24c605c78bd0cb9485f0e199b9d79711a5c2557b10ca6c25' => [
        'sub'               => 'deni_divtek',
        'branch'            => 'PUSAT',
        'displayName'       => 'Deni Siswandi, S.T.',
        'nama'              => 'Deni Siswandi, S.T.',
        'email'             => 'deni.siswandi@kjppnanangrahayu.com',
        'wa'                => '081381909504',
        'role'              => 'KEPALA_DIVTEK',
        'roleLabel'         => 'Kepala Divisi Teknik',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT'
    ],
    // Token Header: [REDACTED_PENILAI_NANANG_TOKEN]
    'bf4963975e153a898bf6547f5528383dce9969a058146311141c9a41f969ada6' => [
        'sub'               => 'nanang_penilai',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'nama'              => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'email'             => 'nanang.rahayu@kjppnanangrahayu.com',
        'izinMenkeu'        => '0218',
        'mappi'             => '96-S-00812',
        'role'              => 'PENILAI_PUBLIK',
        'roleLabel'         => 'Rekan Pemimpin / Penilai Publik Rekan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT'
    ],
    // Token Header: [REDACTED_PENILAI_DENI_TOKEN] (Terpisah dari Divtek!)
    '8b5420d9942829d62967b099a1049a1f36e05d173eac6cd6217fbfe403004c96' => [
        'sub'               => 'deni_penilai',
        'branch'            => 'PUSAT',
        'displayName'       => 'Deni Siswandi, S.T., MAPPI (Cert.)',
        'nama'              => 'Deni Siswandi, S.T., MAPPI (Cert.)',
        'email'             => 'deni.siswandi@kjppnanangrahayu.com',
        'wa'                => '081381909504',
        'izinMenkeu'        => 'P-1.20.00581',
        'mappi'             => '06-S-02013',
        'role'              => 'PENILAI_PUBLIK',
        'roleLabel'         => 'Rekan / Penilai Publik Penanggung Jawab',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT'
    ],
    // Token Header: NSR-ADMIN-PUSAT-2026
    '40c8327a62d48967dc80b016c3762216e1f31093aa78e915e4c68499675a5b36' => [
        'sub'               => 'admin_pusat',
        'branch'            => 'PUSAT',
        'displayName'       => 'Admin Operasional Pusat Jakarta',
        'nama'              => 'Admin Operasional Pusat Jakarta',
        'email'             => 'admin.operasional@kjppnanangrahayu.com',
        'role'              => 'ADMIN_PUSAT',
        'roleLabel'         => 'Admin Kantor Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT'
    ],
    // Token Header: NSR-ADMIN-BDG-2026
    'abbb9d2669adcecef0d82399492141940292dd0eaf358066adacacfb1d0c3545' => [
        'sub'               => 'admin_cabang_bdg',
        'branch'            => 'Bandung',
        'displayName'       => 'Admin Kantor Cabang Bandung',
        'nama'              => 'Admin Kantor Cabang Bandung',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Bandung',
        'wilayah'           => 'Bandung',
        'wilayahLabel'      => 'Kantor Cabang Bandung',
        'wilayahCode'       => 'BDG',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.0160-04'
    ],
`;

if (!content.includes('dc943d94880e71c7d1d7f792b1485d6083e71c90d5ef1cf4d19b6446577612a9')) {
  content = content.replace(
    /(\$OFFICIAL_TOKEN_HASHES\s*=\s*\[)([\s\S]*?)(\n\];)/,
    `$1$2${officialTokensSnippet}$3`
  );
  console.log('Added official token hashes.');
}

// 2. Normalisasi role agar KEPALA_SPM, KEPALA_DIVTEK, PENILAI_PUBLIK tidak di-override
const oldRoleNorm = `$rawRole = $currentUser['role'] ?? 'CABANG';
$isSuperOrPusat = in_array(strtoupper($rawRole), ['ADMIN_PUSAT', 'SUPER ADMIN', 'SUPER_ADMIN'], true) || !empty($currentUser['isSuperAdmin']) || !empty($currentUser['canApprove']);
$isCabangRole = in_array(strtoupper($rawRole), ['CABANG', 'ADMIN_CABANG'], true) || !empty($currentUser['isCabang']);
$userRole = $isSuperOrPusat ? 'ADMIN_PUSAT' : ($isCabangRole ? 'CABANG' : $rawRole);`;

const newRoleNorm = `$rawRole = $currentUser['role'] ?? 'CABANG';
$isSuperOrPusat = (in_array(strtoupper($rawRole), ['ADMIN_PUSAT', 'SUPER ADMIN', 'SUPER_ADMIN'], true) || !empty($currentUser['isSuperAdmin']) || !empty($currentUser['canApprove'])) && !in_array($rawRole, ['KEPALA_SPM', 'KEPALA_DIVTEK', 'PENILAI_PUBLIK'], true);
$isCabangRole = in_array(strtoupper($rawRole), ['CABANG', 'ADMIN_CABANG'], true) || !empty($currentUser['isCabang']);
$userRole = $isSuperOrPusat ? 'ADMIN_PUSAT' : ($isCabangRole ? 'CABANG' : $rawRole);`;

if (content.includes(oldRoleNorm)) {
  content = content.replace(oldRoleNorm, newRoleNorm);
  console.log('Updated userRole normalization.');
}

// 3. Dual Gate DB File & Helper functions
const dbFileSnippet = `
$dataFile = $dataDir . '/nolap_database.json';
// Fallback path untuk kompatibilitas jika file lama berada di root
if (!file_exists($dataFile) && file_exists(__DIR__ . '/nolap-data.json')) {
    $dataFile = __DIR__ . '/nolap-data.json';
}
$dualGateDbFile = $dataDir . '/dual_gate_database.json';
if (!file_exists($dualGateDbFile) && file_exists(__DIR__ . '/dual_gate_database.json')) {
    $dualGateDbFile = __DIR__ . '/dual_gate_database.json';
}
$mailQueueFile = $dataDir . '/mail_queue.json';
`;

content = content.replace(
  /\$dataFile = \$dataDir \. '\/nolap_database\.json';[\s\S]*?if \(!file_exists\(\$dataFile\) && file_exists\(__DIR__ \. '\/nolap-data\.json'\)\) \{\s*\$dataFile = __DIR__ \. '\/nolap-data\.json';\s*\}/,
  dbFileSnippet.trim()
);

// 4. Helper functions Dual Gate
const helpersSnippet = `
function muatDatabaseDualGate($dbFile) {
    if (!file_exists($dbFile)) return [];
    $raw = @file_get_contents($dbFile);
    return json_decode($raw, true) ?: [];
}

function simpanDatabaseDualGate($dbFile, $records) {
    $dir = dirname($dbFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $fp = fopen($dbFile, 'c+');
    if (!$fp) return false;
    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($records, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        return true;
    }
    fclose($fp);
    return false;
}

function antrekanEmailDualGate($mailQueueFile, $payload) {
    $dir = dirname($mailQueueFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $fp = fopen($mailQueueFile, 'c+');
    if (!$fp) return false;
    if (flock($fp, LOCK_EX)) {
        $raw = stream_get_contents($fp);
        $queue = !empty($raw) ? json_decode($raw, true) : [];
        if (!is_array($queue)) $queue = [];

        $entry = [
            'mailId'        => 'MQ-' . date('YmdHis') . '-' . substr(md5(uniqid()), 0, 4),
            'timestampWIB'  => date('Y-m-d H:i:s'),
            'event'         => $payload['event'] ?? 'NOTIFICATION',
            'idPenugasan'   => $payload['idPenugasan'] ?? '',
            'recipient'     => $payload['recipient'] ?? '',
            'recipientName' => $payload['recipientName'] ?? '',
            'subject'       => $payload['subject'] ?? '',
            'body'          => $payload['body'] ?? '',
            'status'        => 'ANTRIAN',
            'attempts'      => 0,
            'smtpConfig'    => [
                'host'      => 'mail.kjppnanangrahayu.com',
                'port'      => 465,
                'encryption'=> 'ssl',
                'username'  => 'notifikasi@kjppnanangrahayu.com'
            ]
        ];

        // Anti-duplikasi antrean identik dalam 5 menit terakhir
        $isDuplicate = false;
        foreach ($queue as $q) {
            if (($q['idPenugasan'] ?? '') === $entry['idPenugasan'] &&
                ($q['event'] ?? '') === $entry['event'] &&
                ($q['recipient'] ?? '') === $entry['recipient'] &&
                ($q['status'] ?? '') === 'ANTRIAN') {
                $isDuplicate = true;
                break;
            }
        }

        if (!$isDuplicate) {
            $queue[] = $entry;
            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($queue, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            fflush($fp);
        }
        flock($fp, LOCK_UN);
        fclose($fp);
        return $entry;
    }
    fclose($fp);
    return false;
}

function generateWhatsAppNotificationLink($noHp, $pesan) {
    $cleanHp = preg_replace('/[^0-9]/', '', $noHp);
    if (substr($cleanHp, 0, 1) === '0') {
        $cleanHp = '62' . substr($cleanHp, 1);
    }
    return 'https://wa.me/' . $cleanHp . '?text=' . rawurlencode($pesan);
}
`;

if (!content.includes('function muatDatabaseDualGate')) {
  content = content.replace(
    'function muatBaselineResmi() {',
    helpersSnippet + '\nfunction muatBaselineResmi() {'
  );
  console.log('Added Dual Gate helper functions.');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('First phase applied successfully.');
