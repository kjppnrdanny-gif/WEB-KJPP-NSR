<?php
/**
 * KJPP NSR — Private Authentication Registry Loader
 * Memuat konfigurasi otentikasi privat server di luar jangkauan repository publik.
 * Fail-closed policy: Jika berkas konfigurasi privat tidak ditemukan, otentikasi ditolak.
 */

defined('PHP_VERSION') or exit('Akses langsung ditolak.');

function loadPrivateAuthRegistry() {
    static $registry = null;
    if ($registry !== null) {
        return $registry;
    }

    $default = [
        'token_hashes'   => [],
        'user_accounts'  => [],
        'service_hashes' => []
    ];

    // 1. Cek berkas rahasia privat server (data/config/credentials.secrets.php)
    $candidatePaths = [
        __DIR__ . '/data/config/credentials.secrets.php',
        __DIR__ . '/private-config/credentials.secrets.php',
        dirname(__DIR__) . '/private-config/credentials.secrets.php',
        __DIR__ . '/credentials.secrets.php'
    ];

    foreach ($candidatePaths as $path) {
        if (file_exists($path) && is_readable($path)) {
            $loaded = include $path;
            if (is_array($loaded)) {
                $registry = [
                    'token_hashes'   => $loaded['token_hashes'] ?? [],
                    'user_accounts'  => $loaded['user_accounts'] ?? [],
                    'service_hashes' => $loaded['service_hashes'] ?? []
                ];
                return $registry;
            }
        }
    }

    // 2. Cek Environment Variable (misal dari server runtime / GitHub Actions)
    $envConfig = getenv('NSR_SECRETS_JSON') ?: ($_SERVER['NSR_SECRETS_JSON'] ?? null);
    if (!empty($envConfig)) {
        $decoded = json_decode($envConfig, true);
        if (is_array($decoded)) {
            $registry = [
                'token_hashes'   => $decoded['token_hashes'] ?? [],
                'user_accounts'  => $decoded['user_accounts'] ?? [],
                'service_hashes' => $decoded['service_hashes'] ?? []
            ];
            return $registry;
        }
    }

    // 3. Fail-Closed: Tolak seluruh akses jika kredensial privat tidak tersedia
    $registry = $default;
    return $registry;
}
