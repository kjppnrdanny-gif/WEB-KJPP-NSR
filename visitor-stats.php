<?php
/**
 * KJPP NSR — Real-Time Anonymous Device Visitor Counter
 * Compatible with cPanel / LiteSpeed / Apache PHP 7.4+
 */

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('Asia/Jakarta');

$INITIAL_TOTAL = 18454;
$INITIAL_TODAY = 128;
$INITIAL_DATE  = '2026-10-03';
$todayDate     = date('Y-m-d');
$dataFile      = __DIR__ . '/visitor-data.json';

// Detect common bots / crawlers
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isBot = (bool) preg_match('/bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|headless|lighthouse/i', $userAgent);

// Check / Set Cookie for unique device identification
$cookieName = 'nsr_vid';
$visitorId  = $_COOKIE[$cookieName] ?? null;

if (!$visitorId || !preg_match('/^[a-f0-9\-]{16,80}$/i', $visitorId)) {
    try {
        $visitorId = bin2hex(random_bytes(16));
    } catch (Exception $e) {
        $visitorId = md5(uniqid(mt_rand(), true));
    }
    $isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    setcookie($cookieName, $visitorId, [
        'expires'  => time() + (86400 * 365),
        'path'     => '/',
        'secure'   => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

$visitorHash = substr(hash('sha256', $visitorId), 0, 16);
$counted = false;
$data = null;

// Read / update data with file locking
$fp = @fopen($dataFile, 'c+');
if ($fp) {
    if (flock($fp, LOCK_EX)) {
        $fileSize = filesize($dataFile);
        $content = ($fileSize > 0) ? fread($fp, $fileSize) : '';
        $data = json_decode($content, true);

        if (!$data || !is_array($data)) {
            $data = [
                'total'      => $INITIAL_TOTAL,
                'today'      => ($todayDate === $INITIAL_DATE ? $INITIAL_TODAY : 0),
                'date'       => $todayDate,
                'seen_today' => []
            ];
        }

        // Daily reset (WIB midnight rollover)
        if (!isset($data['date']) || $data['date'] !== $todayDate) {
            $data['date']         = $todayDate;
            $data['today']        = ($todayDate === $INITIAL_DATE ? $INITIAL_TODAY : 0);
            $data['seen_devices'] = [];
        }

        if (!isset($data['seen_devices']) || !is_array($data['seen_devices'])) {
            $data['seen_devices'] = [];
        }

        $isPollOnly = isset($_GET['poll']) && $_GET['poll'] === '1';
        $now = time();
        $lastVisitTime = $data['seen_devices'][$visitorHash] ?? 0;

        // Count real visit if not a bot, not just a poll, and passed 15s cooldown per device
        if (!$isBot && !$isPollOnly) {
            if (($now - $lastVisitTime) >= 15) {
                $data['seen_devices'][$visitorHash] = $now;
                $data['total']++;
                $data['today']++;
                $counted = true;

                // Clean up entries older than 24h if array grows
                if (count($data['seen_devices']) > 3000) {
                    $cutoff = $now - 86400;
                    $data['seen_devices'] = array_filter($data['seen_devices'], function($t) use ($cutoff) {
                        return $t > $cutoff;
                    });
                }

                ftruncate($fp, 0);
                rewind($fp);
                fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
            }
        }

        flock($fp, LOCK_UN);
    }
    fclose($fp);
}

// Fallback in case of filesystem error
if (!$data) {
    $data = [
        'total' => $INITIAL_TOTAL,
        'today' => ($todayDate === $INITIAL_DATE ? $INITIAL_TODAY : 0),
        'date'  => $todayDate
    ];
}

echo json_encode([
    'total'     => (int) $data['total'],
    'today'     => (int) $data['today'],
    'date'      => $data['date'],
    'counted'   => $counted,
    'realtime'  => true,
    'timestamp' => time()
]);
