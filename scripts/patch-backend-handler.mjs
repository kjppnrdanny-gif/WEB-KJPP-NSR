// scripts/patch-backend-handler.mjs
import fs from 'fs';
import path from 'path';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec';

function patchFile(filePath) {
  console.log(`Patching ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Set GAS_TRACKING_URL and forwarder helper
  const oldDef = "define('GAS_TRACKING_URL', '');";
  const newDef = `define('GAS_TRACKING_URL', '${GAS_URL}');

/**
 * Smart Proxy Forwarder ke SSOT Google Apps Script Web App
 */
function callGASTrackingService($action, $data = [], $method = 'POST', $timeout = 8) {
    if (!defined('GAS_TRACKING_URL') || empty(GAS_TRACKING_URL)) {
        return null;
    }

    $url = GAS_TRACKING_URL;
    $postData = '';
    
    if ($method === 'GET') {
        $queryParams = array_merge(['action' => $action], $data);
        $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query($queryParams);
    } else {
        $payload = array_merge(['action' => $action], $data);
        $postData = json_encode($payload, JSON_UNESCAPED_UNICODE);
    }

    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: text/plain;charset=utf-8']);
        }
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($res && !$err) {
            $json = json_decode($res, true);
            if (is_array($json) && ($json['status'] ?? '') === 'success') {
                return $json;
            }
        }
    }

    $opts = [
        'http' => [
            'method'  => $method,
            'header'  => "Content-Type: text/plain;charset=utf-8\\r\\n",
            'content' => $method === 'POST' ? $postData : null,
            'timeout' => $timeout,
            'follow_location' => 1,
            'max_redirects' => 5
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ];
    $ctx = @stream_context_create($opts);
    $res = @file_get_contents($url, false, $ctx);
    if ($res) {
        $json = json_decode($res, true);
        if (is_array($json) && ($json['status'] ?? '') === 'success') {
            return $json;
        }
    }

    return null;
}`;

  if (content.includes(oldDef)) {
    content = content.replace(oldDef, newDef);
  }

  // 2. Proxy forwarder in ACTION: TRACK
  const trackTarget = `$found = null;\n\n    // Cari exact match JO Number`;
  const trackReplacement = `// 1. Coba proxy query ke SSOT Google Apps Script terlebih dahulu
    $gasTrack = callGASTrackingService('track', ['id_jo' => $cleanJo, 'telepon_pic' => $cleanPhone], 'GET');
    if ($gasTrack && isset($gasTrack['data'])) {
        echo json_encode([
            'status' => 'success',
            'source' => 'GAS_SSOT_LIVE',
            'data' => $gasTrack['data']
        ]);
        exit;
    }

    $found = null;\n\n    // Cari exact match JO Number`;

  if (content.includes('$found = null;\r\n\r\n    // Cari exact match JO Number')) {
    content = content.replace(
      '$found = null;\r\n\r\n    // Cari exact match JO Number',
      `// 1. Coba proxy query ke SSOT Google Apps Script terlebih dahulu\r\n    $gasTrack = callGASTrackingService('track', ['id_jo' => $cleanJo, 'telepon_pic' => $cleanPhone], 'GET');\r\n    if ($gasTrack && isset($gasTrack['data'])) {\r\n        echo json_encode([\r\n            'status' => 'success',\r\n            'source' => 'GAS_SSOT_LIVE',\r\n            'data' => $gasTrack['data']\r\n        ]);\r\n        exit;\r\n    }\r\n\r\n    $found = null;\r\n\r\n    // Cari exact match JO Number`
    );
  } else if (content.includes(trackTarget)) {
    content = content.replace(trackTarget, trackReplacement);
  }

  // 3. Proxy forwarder in ACTION: LIST
  const listTarget = `$filtered = [];`;
  const listReplacement = `// 1. Coba ambil daftar pekerjaan aktif langsung dari SSOT GAS Web App
    $gasList = callGASTrackingService('get_active_jobs', [], 'GET');
    if ($gasList && isset($gasList['data']) && is_array($gasList['data']) && count($gasList['data']) > 0) {
        echo json_encode([
            'status' => 'success',
            'source' => 'GAS_SSOT_LIVE',
            'total' => $gasList['count'] ?? count($gasList['data']),
            'data' => $gasList['data']
        ]);
        exit;
    }

    $filtered = [];`;

  if (content.includes(`    $filtered = [];`)) {
    content = content.replace(`    $filtered = [];`, listReplacement);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ ${filePath} successfully patched.`);
}

patchFile('backend/job-tracking-handler.php');
patchFile('job-tracking-handler.php');
