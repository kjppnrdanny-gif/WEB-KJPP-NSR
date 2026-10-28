<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_ORIGIN'] = 'https://kjppnanangrahayu.com';
$_GET['action'] = 'token';
$_POST = ['token' => '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0'];

ob_start();
include __DIR__ . '/../auth-handler.php';
$output = ob_get_clean();
echo "Status Code: " . http_response_code() . "\n";
echo "Output: " . $output . "\n";
