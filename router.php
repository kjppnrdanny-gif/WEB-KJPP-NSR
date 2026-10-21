<?php
/**
 * router.php
 * Router skrip untuk server PHP lokal / staging preview lingkungan e-Operasional & Portals
 * Mengemulasikan perilaku rewrite engine Apache (.htaccess) & Netlify Functions secara presisi.
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. Proteksi Direktori Data, Backup, Secret & Internal
if (strpos($uri, '/data/') === 0 || strpos($uri, '/scratch/') === 0 || strpos($uri, '/.git') === 0) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => '403 Forbidden: Direktori terproteksi internal.']);
    exit;
}

// 2. Routing API Serverless / cPanel Handlers
if ($uri === '/api/kwitansi-data-proxy') {
    require __DIR__ . '/kwitansi-data-handler.php';
    exit;
}

if ($uri === '/api/operasional-data-proxy') {
    require __DIR__ . '/operasional-data-handler.php';
    exit;
}

if ($uri === '/api/nolap-data-proxy') {
    require __DIR__ . '/nolap-data-handler.php';
    exit;
}

if ($uri === '/api/surat-umum-data-proxy') {
    require __DIR__ . '/surat-umum-data-handler.php';
    exit;
}

if ($uri === '/api/absensi-data-proxy') {
    require __DIR__ . '/absensi-data-handler.php';
    exit;
}

if ($uri === '/api/status-terintegrasi-proxy') {
    require __DIR__ . '/status-terintegrasi-handler.php';
    exit;
}

if ($uri === '/api/auth-login' || $uri === '/api/auth-verify' || $uri === '/api/auth-logout' || $uri === '/api/auth-token') {
    require __DIR__ . '/auth-handler.php';
    exit;
}

// 3. Routing Dokumen & Landing Pages
if ($uri === '/' || $uri === '') {
    $uri = '/index.html';
}

$file = __DIR__ . $uri;

// 4. Sajikan File Statis jika Tersedia
if (file_exists($file) && !is_dir($file)) {
    return false; // PHP Built-in Server melayani langsung file statis (HTML, JS, CSS, gambar)
}

// 5. Fallback 404
http_response_code(404);
header('Content-Type: text/html; charset=UTF-8');
echo '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:40px;text-align:center;"><h1>404 — Halaman Tidak Ditemukan</h1><p>Halaman atau resource yang Anda tuju tidak tersedia pada server preview.</p><a href="/" style="color:#f59e0b;">Kembali ke Beranda</a></body></html>';
exit;
