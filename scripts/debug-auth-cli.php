<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_ORIGIN'] = 'https://kjppnanangrahayu.com';
$_GET['action'] = 'token';
$_POST = ['token' => 'NSR-KING-OPR-2026-X7M9'];

ob_start();
include __DIR__ . '/../auth-handler.php';
$output = ob_get_clean();
echo "Status Code: " . http_response_code() . "\n";
echo "Output: " . $output . "\n";
