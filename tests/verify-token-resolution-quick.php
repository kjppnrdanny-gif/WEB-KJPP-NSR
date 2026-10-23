<?php
require_once __DIR__ . '/../auth-registry-loader.php';
$registry = loadPrivateAuthRegistry();
$hashes = $registry['token_hashes'];

function testResolve($rawToken, $hashRegistry) {
    if (!$rawToken || !is_string($rawToken)) return null;
    $clean = trim($rawToken);
    if (strlen($clean) === 64 && ctype_xdigit($clean)) return null;
    $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($clean));
    if (isset($hashRegistry[$saltedHash])) {
        return [$hashRegistry[$saltedHash], $saltedHash];
    }
    return null;
}

$tests = [
    'NSR-SPM-DANNY-2026' => ['role' => 'KEPALA_SPM', 'sub' => 'danny_spm'],
    'NSR-SPM-2026' => ['role' => 'KEPALA_SPM', 'sub' => 'danny_spm'],
    'NSR-DIVTEK-DENI-2026' => ['role' => 'KEPALA_DIVTEK', 'sub' => 'deni_divtek'],
    'NSR-DIVTEK-2026' => ['role' => 'KEPALA_DIVTEK', 'sub' => 'deni_divtek'],
    'NSR-TEK-2026' => ['role' => 'KEPALA_DIVTEK', 'sub' => 'deni_divtek'],
    'NSR8899' => ['role' => 'SUPER_ADMIN', 'sub' => 'super_admin_king'],
    'NSR-ADMIN-PUSAT-2026' => ['role' => 'ADMIN_PUSAT', 'sub' => 'cabang_jkt'],
    'NSR-ADMIN-BDG-2026' => ['role' => 'ADMIN_CABANG', 'sub' => 'cabang_bdg'],
    'NSR-PENILAI-NANANG-2026' => ['role' => 'PENILAI_PUBLIK', 'sub' => 'nanang_penilai'],
    'NSR-PENILAI-DENI-2026' => ['role' => 'PENILAI_PUBLIK', 'sub' => 'deni_penilai']
];

$allPass = true;
foreach ($tests as $token => $expected) {
    $res = testResolve($token, $hashes);
    if (!$res) {
        echo "FAIL: Token $token could not be resolved!\n";
        $allPass = false;
        continue;
    }
    list($user, $h) = $res;
    if ($user['role'] !== $expected['role']) {
        echo "FAIL: Token $token role expected " . $expected['role'] . " got " . $user['role'] . "\n";
        $allPass = false;
    } else {
        echo "PASS: Token $token -> " . $user['role'] . " (" . $user['displayName'] . ")\n";
    }
}

if ($allPass) {
    echo "\n>>> ALL 10 TOKEN RESOLUTIONS TESTED & VERIFIED 100% PASS <<<\n";
    exit(0);
} else {
    exit(1);
}
