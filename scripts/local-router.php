<?php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (preg_match('#^/api/auth-login#', $uri)) {
    $_GET['action'] = 'login';
    require __DIR__ . '/../auth-handler.php';
    exit;
}
if (preg_match('#^/api/auth-verify#', $uri)) {
    $_GET['action'] = 'verify';
    require __DIR__ . '/../auth-handler.php';
    exit;
}
if (preg_match('#^/api/auth-logout#', $uri)) {
    $_GET['action'] = 'logout';
    require __DIR__ . '/../auth-handler.php';
    exit;
}
if (preg_match('#^/api/nolap-data-proxy#', $uri)) {
    require __DIR__ . '/../nolap-data-handler.php';
    exit;
}
if (preg_match('#^/api/kwitansi-data-proxy#', $uri)) {
    require __DIR__ . '/../kwitansi-data-handler.php';
    exit;
}
if (preg_match('#^/api/operasional-data-proxy#', $uri)) {
    require __DIR__ . '/../operasional-data-handler.php';
    exit;
}
if (preg_match('#^/api/surat-umum-data-proxy#', $uri)) {
    require __DIR__ . '/../surat-umum-data-handler.php';
    exit;
}

$file = __DIR__ . '/..' . $uri;
if (file_exists($file) && !is_dir($file)) {
    return false; // serve as static file
}

if ($uri === '/' || is_dir($file)) {
    $index = __DIR__ . '/../index.html';
    if (file_exists($index)) {
        require $index;
        exit;
    }
}

return false;
