<?php
/**
 * KJPP NSR — Real-Time Anonymous Device Visitor Counter
 * Industry Standard (GA4 Model):
 * - 30-minute session deduplication for Total Visits (anti-spam refresh)
 * - 24-hour unique device tracking for Daily Visits (Hari Ini)
 */

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Visitor-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('Asia/Jakarta');

$INITIAL_TOTAL   = 40;
$INITIAL_TODAY   = 1;
$INITIAL_DATE    = '2026-10-06';
$SESSION_TIMEOUT = 1800; // 30 minutes session window (GA4 Standard)
$todayDate       = date('Y-m-d');
$dataFile        = __DIR__ . '/visitor-data.json';

// Detect bots / search engine crawlers
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isBot = (bool) preg_match('/bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|headless|lighthouse/i', $userAgent);

// Client identification via persistent localStorage vid, cookie, or IP hash
$cookieName = 'nsr_vid';
$visitorId  = $_GET['vid'] ?? $_COOKIE[$cookieName] ?? null;

if (!$visitorId || !preg_match('/^[a-zA-Z0-9_\-]{8,100}$/', $visitorId)) {
    try {
        $visitorId = bin2hex(random_bytes(16));
    } catch (Exception $e) {
        $visitorId = md5(uniqid(mt_rand(), true));
    }
}

$isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
setcookie($cookieName, $visitorId, [
    'expires'  => time() + (86400 * 365),
    'path'     => '/',
    'secure'   => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax'
]);

$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
if (strpos($clientIp, ',') !== false) {
    $clientIp = trim(explode(',', $clientIp)[0]);
}

// Composite device fingerprint (persistent vid + IP subnet + browser)
$ipSubnet = preg_replace('/(\d+)\.\d+$/', '$1.0', $clientIp);
$deviceFingerprint = substr(hash('sha256', $visitorId . '_' . $ipSubnet . '_' . $userAgent), 0, 24);

$counted = false;
$data = null;

// Read / update stats with file locking
$fp = @fopen($dataFile, 'c+');
if ($fp) {
    if (flock($fp, LOCK_EX)) {
        clearstatcache(true, $dataFile);
        rewind($fp);
        $content = stream_get_contents($fp);
        $data = json_decode($content, true);

        if (!$data || !is_array($data)) {
            $data = [
                'total'         => $INITIAL_TOTAL,
                'today'         => ($todayDate === $INITIAL_DATE ? $INITIAL_TODAY : 0),
                'date'          => $todayDate,
                'sessions'      => [],
                'today_devices' => []
            ];
        }

        // Daily reset (WIB midnight rollover)
        if (!isset($data['date']) || $data['date'] !== $todayDate) {
            $data['date']          = $todayDate;
            $data['today']         = ($todayDate === $INITIAL_DATE ? $INITIAL_TODAY : 0);
            $data['today_devices'] = [];
        }

        if (!isset($data['sessions']) || !is_array($data['sessions'])) {
            $data['sessions'] = [];
        }
        if (!isset($data['today_devices']) || !is_array($data['today_devices'])) {
            $data['today_devices'] = [];
        }

        $isPollOnly = isset($_GET['poll']) && $_GET['poll'] === '1';
        $now = time();
        $lastSessionTime = $data['sessions'][$deviceFingerprint] ?? 0;
        $seenToday = isset($data['today_devices'][$deviceFingerprint]);

        // Evaluate visit if not a bot and not just background polling
        if (!$isBot && !$isPollOnly) {
            $isNewSession = ($now - $lastSessionTime) >= $SESSION_TIMEOUT;

            // 1. Total visits: increments only on new sessions (>30 min since last activity)
            if ($isNewSession) {
                $data['sessions'][$deviceFingerprint] = $now;
                $data['total']++;
                $counted = true;
            }

            // 2. Today visits: increments only once per device per calendar day
            if (!$seenToday) {
                $data['today_devices'][$deviceFingerprint] = $now;
                $data['today']++;
                $counted = true;
            }

            if ($counted) {
                // Prune sessions older than 48 hours to keep data file light
                if (count($data['sessions']) > 4000) {
                    $cutoff = $now - 172800;
                    $data['sessions'] = array_filter($data['sessions'], function($t) use ($cutoff) {
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

