<?php
// scripts/test-tracking-handler.php

$tests = [
    'JO-JKT-2026-0001' => 'JO resmi 1',
    'TRK-JKT-2026-A89F' => 'Kode Lacak 1',
    'JO-JKT-2026-0002' => 'JO resmi 2',
    'TRK-JKT-2026-C42B' => 'Kode Lacak 2',
    'TRK-BDG-2026-M512' => 'Kode Lacak Bandung',
    'JO-RANDOM-INVALID' => 'Kode Invalid'
];

foreach ($tests as $code => $desc) {
    echo "====================================================\n";
    echo "TESTING: $desc ($code)\n";
    $codeStr = addslashes($code);
    $script = "parse_str('action=track&jo={$codeStr}', \$_GET); include 'backend/job-tracking-handler.php';";
    $cmd = 'php -r "' . $script . '"';
    $descriptors = [
        0 => ["pipe", "r"],
        1 => ["pipe", "w"],
        2 => ["pipe", "w"]
    ];
    $process = proc_open($cmd, $descriptors, $pipes);
    if (is_resource($process)) {
        fclose($pipes[0]);
        $out = stream_get_contents($pipes[1]);
        $err = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        proc_close($process);

        $json = json_decode($out, true);
        if ($json) {
            echo "Status: " . ($json['status'] ?? '-') . "\n";
            echo "Message: " . ($json['message'] ?? '-') . "\n";
            if (isset($json['data']) && $json['data']) {
                echo "JO: " . ($json['data']['jo_number'] ?? '-') . "\n";
                echo "Kode Lacak: " . ($json['data']['kode_lacak'] ?? '-') . "\n";
                echo "Debitur: " . ($json['data']['debitur'] ?? '-') . "\n";
            } else {
                echo "Data: NULL (Expected for invalid)\n";
            }
        } else {
            echo "Output: $out\n";
            if ($err) echo "Error: $err\n";
        }
    }
}
