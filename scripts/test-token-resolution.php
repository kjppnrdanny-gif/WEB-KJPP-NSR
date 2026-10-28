<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['action'] = 'test';
require 'auth-handler.php';
$res = resolveServerToken('NSR-STAGE-MASTER-77', $OFFICIAL_TOKEN_HASHES);
echo "RESULT: " . ($res ? "FOUND (" . $res[0]['displayName'] . ")" : "NULL") . "\n";
