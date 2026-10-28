import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const phpFile = path.join(ROOT_DIR, 'absensi-data-handler.php');
let code = fs.readFileSync(phpFile, 'utf8');

const isCRLF = code.includes('\r\n');
const nl = isCRLF ? '\r\n' : '\n';

// 1. Update PUSAT_LAT, PUSAT_LNG, and $KANTOR_CABANG
const oldBranchRegex = /define\('PUSAT_LAT'[\s\S]*?\$KANTOR_CABANG\s*=\s*\[[\s\S]*?\];/;
const newBranch = `define('PUSAT_LAT', -6.28797);
define('PUSAT_LNG', 106.82478);
define('RADIUS_KANTOR_METER', 150);
define('RADIUS_WFH_METER', 100);
define('JAM_MASUK_BATAS_TERLAMBAT', '08:30:00');

// Multi-Office Geofencing KJPP NSR (Alamat Legal & Koordinat Presisi Terverifikasi)
$KANTOR_CABANG = [
    'Pusat Jakarta' => [
        'nama' => 'Pusat Jakarta',
        'lat' => -6.28797,
        'lng' => 106.82478,
        'radius' => 150,
        'alamat' => 'Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Jakarta Selatan 12550'
    ],
    'Cabang Bandung' => [
        'nama' => 'Cabang Bandung',
        'lat' => -6.85978,
        'lng' => 107.56043,
        'radius' => 150,
        'alamat' => 'Perumahan Pancanaka Royal Garden II, Jl. Pangrango II No. 1A RT.001 RW.012, Kel. Citeureup, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40512'
    ],
    'Cabang Padang' => [
        'nama' => 'Cabang Padang',
        'lat' => -0.94932,
        'lng' => 100.37606,
        'radius' => 150,
        'alamat' => 'Jl. Parak Gadang VIII No. 19, Kel. Simpang Haru, Kec. Padang Timur, Kota Padang, Sumatera Barat'
    ],
    'Cabang Makassar' => [
        'nama' => 'Cabang Makassar',
        'lat' => -5.15650,
        'lng' => 119.41200,
        'radius' => 200,
        'alamat' => 'Jl. Nuri Lr. 301 No. 7, Mariso, Makassar, Sulawesi Selatan'
    ],
    'Cabang Palembang' => [
        'nama' => 'Cabang Palembang',
        'lat' => -2.92904,
        'lng' => 104.69598,
        'radius' => 150,
        'alamat' => 'Komplek Griya Hero Abadi Maskarebet, Kec. Alang-Alang Lebar, Kota Palembang, Sumatera Selatan'
    ]
];`.replace(/\n/g, nl);

if (!oldBranchRegex.test(code)) {
  throw new Error('Pattern PUSAT_LAT / $KANTOR_CABANG not found in absensi-data-handler.php');
}
code = code.replace(oldBranchRegex, newBranch);
console.log('1. PUSAT_LAT and $KANTOR_CABANG updated in absensi-data-handler.php.');

// 2. Update verify_pin logic to check attendance count, WFH data, and return force_change_pin / warning_default_pin
const targetVerifyPinTail = `$isAdminHR = in_array($cleanNik, $ADMIN_HR_NIKS);

        if ($needsEmailUpdate) {
            echo json_encode([
                'status' => 'success',
                'success' => true,
                'needs_email_update' => true,
                'nik' => $cleanNik,
                'nama' => $targetKaryawan['nama'],
                'jabatan' => $targetKaryawan['jabatan'],
                'divisi' => $targetKaryawan['divisi'],
                'cabang' => $cabang,
                'message' => 'Silakan lengkapi email aktif Anda terlebih dahulu.'
            ]);
            exit;
        }

        // Terbitkan Token Sesi
        $sessionToken = 'NSR_PIN_' . bin2hex(random_bytes(16));
        $lifetime = $rememberDevice ? (30 * 86400) : 86400; // 30 hari vs 24 jam
        $cache = loadOTPCache();
        $cache['sessions'][$sessionToken] = [
            'nik' => $cleanNik,
            'nama' => $targetKaryawan['nama'],
            'created_at' => time(),
            'expires_at' => time() + $lifetime,
            'remember_device' => $rememberDevice
        ];
        saveOTPCache($cache);

        // Set Cookie Sesi Aman
        setcookie('nsr_presensi_sess', $sessionToken, [
            'expires' => time() + $lifetime,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'needs_email_update' => false,
            'sessionToken' => $sessionToken,
            'nik' => $cleanNik,
            'nama' => $targetKaryawan['nama'],
            'jabatan' => $targetKaryawan['jabatan'],
            'divisi' => $targetKaryawan['divisi'],
            'cabang' => $cabang,
            'isAdminHR' => $isAdminHR,
            'role' => $isAdminHR ? 'admin_pusat' : 'karyawan',
            'message' => 'Autentikasi Berhasil.'
        ]);
        exit;`.replace(/\n/g, nl);

const newVerifyPinTail = `$isAdminHR = in_array($cleanNik, $ADMIN_HR_NIKS);

        if ($needsEmailUpdate) {
            echo json_encode([
                'status' => 'success',
                'success' => true,
                'needs_email_update' => true,
                'nik' => $cleanNik,
                'nama' => $targetKaryawan['nama'],
                'jabatan' => $targetKaryawan['jabatan'],
                'divisi' => $targetKaryawan['divisi'],
                'cabang' => $cabang,
                'message' => 'Silakan lengkapi email aktif Anda terlebih dahulu.'
            ]);
            exit;
        }

        // Hitung riwayat presensi karyawan
        $attCount = 0;
        if (!empty($db['absensi']) && is_array($db['absensi'])) {
            foreach ($db['absensi'] as $rec) {
                if (cocokNIK($rec['nik'] ?? '', $cleanNik)) {
                    $attCount++;
                }
            }
        }

        // Ambil data WFH terdaftar
        $wfhGps = $targetKaryawan['gps_wfh'] ?? '';
        $wfhAlamat = $targetKaryawan['alamat_wfh'] ?? '';
        if (empty($wfhGps) && !empty($db['master_wfh'])) {
            foreach ($db['master_wfh'] as $w) {
                if (cocokNIK($w['nik'] ?? '', $cleanNik)) {
                    $wfhGps = $w['gps'] ?? '';
                    $wfhAlamat = $w['alamat'] ?? '';
                    break;
                }
            }
        }

        $isDefaultPin = ($cleanPin === '123456' || $dbPin === '123456');
        $forceChangePin = ($isDefaultPin && $attCount >= 1);
        $warningDefaultPin = ($isDefaultPin && $attCount === 0);

        if ($forceChangePin) {
            echo json_encode([
                'status' => 'success',
                'success' => true,
                'needs_email_update' => false,
                'force_change_pin' => true,
                'warning_default_pin' => false,
                'nik' => $cleanNik,
                'nama' => $targetKaryawan['nama'],
                'jabatan' => $targetKaryawan['jabatan'],
                'divisi' => $targetKaryawan['divisi'],
                'cabang' => $cabang,
                'email' => $email,
                'gps_wfh' => $wfhGps,
                'alamat_wfh' => $wfhAlamat,
                'attendance_count' => $attCount,
                'message' => 'PIN Default (123456) wajib diganti demi keamanan sebelum presensi ke-2 dan seterusnya.'
            ]);
            exit;
        }

        // Terbitkan Token Sesi
        $sessionToken = 'NSR_PIN_' . bin2hex(random_bytes(16));
        $lifetime = $rememberDevice ? (30 * 86400) : 86400; // 30 hari vs 24 jam
        $cache = loadOTPCache();
        $cache['sessions'][$sessionToken] = [
            'nik' => $cleanNik,
            'nama' => $targetKaryawan['nama'],
            'created_at' => time(),
            'expires_at' => time() + $lifetime,
            'remember_device' => $rememberDevice
        ];
        saveOTPCache($cache);

        // Set Cookie Sesi Aman
        setcookie('nsr_presensi_sess', $sessionToken, [
            'expires' => time() + $lifetime,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'needs_email_update' => false,
            'force_change_pin' => false,
            'warning_default_pin' => $warningDefaultPin,
            'sessionToken' => $sessionToken,
            'nik' => $cleanNik,
            'nama' => $targetKaryawan['nama'],
            'jabatan' => $targetKaryawan['jabatan'],
            'divisi' => $targetKaryawan['divisi'],
            'cabang' => $cabang,
            'email' => $email,
            'gps_wfh' => $wfhGps,
            'alamat_wfh' => $wfhAlamat,
            'attendance_count' => $attCount,
            'isAdminHR' => $isAdminHR,
            'role' => $isAdminHR ? 'admin_pusat' : 'karyawan',
            'message' => 'Autentikasi Berhasil.'
        ]);
        exit;`.replace(/\n/g, nl);

if (!code.includes(targetVerifyPinTail)) {
  throw new Error('targetVerifyPinTail not found in absensi-data-handler.php');
}
code = code.replace(targetVerifyPinTail, newVerifyPinTail);
console.log('2. verify_pin logic updated with force_change_pin and WFH data.');

// 3. Add direct_change_pin action
const targetBeforeUpdateEmail = `    // ---------------------------------------------------------------------
    // AKSI: UPDATE EMAIL MANDIRI KARYAWAN
    // ---------------------------------------------------------------------
    if ($action === 'update_employee_email' || $action === 'updateEmailKaryawan') {`.replace(/\n/g, nl);

const newActionDirectChangePin = `    // ---------------------------------------------------------------------
    // AKSI: DIRECT CHANGE PIN PRESENSI (ON-SCREEN DIRECT UPDATE)
    // ---------------------------------------------------------------------
    if ($action === 'direct_change_pin' || $action === 'directChangePin') {
        $nik = $_POST['nik'] ?? $payload['nik'] ?? '';
        $newPin = $_POST['new_pin'] ?? $payload['new_pin'] ?? $payload['newPin'] ?? '';

        if (!$nik || !$newPin) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'NIK dan PIN baru wajib diisi.']);
            exit;
        }

        $cleanNik = normalisasiNIK($nik);
        $cleanNewPin = trim((string)$newPin);

        if (!preg_match('/^\\d{6}$/', $cleanNewPin)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'PIN baru harus tepat 6 digit angka.']);
            exit;
        }

        if ($cleanNewPin === '123456') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'PIN baru tidak boleh menggunakan PIN default standar (123456). Silakan pilih 6 digit angka lain.']);
            exit;
        }

        $db = loadDatabase();
        $targetKaryawan = null;
        foreach ($db['master_karyawan'] as &$k) {
            if (cocokNIK($k['nik'], $cleanNik)) {
                $k['pin_presensi'] = $cleanNewPin;
                $targetKaryawan = $k;
                break;
            }
        }

        if ($targetKaryawan) {
            saveDatabase($db);
        }

        // Teruskan ke GAS untuk sinkronisasi Google Sheet & pengiriman notifikasi email pasif
        $gasRes = callGASWebService([
            'action' => 'direct_change_pin',
            'nik' => $cleanNik,
            'new_pin' => $cleanNewPin
        ]);

        // Terbitkan Token Sesi Baru
        $sessionToken = 'NSR_PIN_' . bin2hex(random_bytes(16));
        $cache = loadOTPCache();
        $cache['sessions'][$sessionToken] = [
            'nik' => $cleanNik,
            'nama' => $targetKaryawan['nama'] ?? $cleanNik,
            'created_at' => time(),
            'expires_at' => time() + 86400,
            'remember_device' => false
        ];
        saveOTPCache($cache);

        setcookie('nsr_presensi_sess', $sessionToken, [
            'expires' => time() + 86400,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'sessionToken' => $sessionToken,
            'nik' => $cleanNik,
            'nama' => $targetKaryawan['nama'] ?? $cleanNik,
            'jabatan' => $targetKaryawan['jabatan'] ?? '',
            'divisi' => $targetKaryawan['divisi'] ?? '',
            'cabang' => $targetKaryawan['cabang'] ?? 'Pusat Jakarta',
            'email' => $targetKaryawan['email'] ?? '',
            'gps_wfh' => $targetKaryawan['gps_wfh'] ?? '',
            'alamat_wfh' => $targetKaryawan['alamat_wfh'] ?? '',
            'message' => 'PIN baru berhasil disimpan. Presensi Anda telah diaktifkan.'
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI: UPDATE EMAIL MANDIRI KARYAWAN
    // ---------------------------------------------------------------------
    if ($action === 'update_employee_email' || $action === 'updateEmailKaryawan') {`.replace(/\n/g, nl);

if (!code.includes(targetBeforeUpdateEmail)) {
  throw new Error('targetBeforeUpdateEmail not found in absensi-data-handler.php');
}
code = code.replace(targetBeforeUpdateEmail, newActionDirectChangePin);
console.log('3. direct_change_pin action added to absensi-data-handler.php.');

// 4. Update simpanAbsensi: enforce non-empty email, enforce PIN change on 2nd attendance
const targetSimpanAbsenProfil = `        if (!$profil) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'NIK tidak terdaftar dalam Master Karyawan.']);
            exit;
        }`.replace(/\n/g, nl);

const newSimpanAbsenProfil = `        if (!$profil) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'NIK tidak terdaftar dalam Master Karyawan.']);
            exit;
        }

        // Cek Keberadaan Email Resmi
        $userEmail = trim((string)($profil['email'] ?? ''));
        if (empty($userEmail) || $userEmail === '-' || strpos($userEmail, '@') === false) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'code' => 'EMAIL_REQUIRED',
                'message' => 'Alamat email kepegawaian wajib didaftarkan sebelum melakukan presensi.'
            ]);
            exit;
        }

        // Cek Penggunaan PIN Default Standar pada Presensi Ke-2
        $attCountSimpan = 0;
        if (!empty($db['absensi']) && is_array($db['absensi'])) {
            foreach ($db['absensi'] as $rec) {
                if (cocokNIK($rec['nik'] ?? '', $cleanNik)) {
                    $attCountSimpan++;
                }
            }
        }
        $empPin = trim((string)($profil['pin_presensi'] ?? $profil['pin'] ?? '123456'));
        if ($attCountSimpan >= 1 && $empPin === '123456') {
            http_response_code(403);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'code' => 'FORCE_CHANGE_PIN',
                'message' => 'PIN default standar (123456) tidak diizinkan untuk presensi ke-2 dan seterusnya. Silakan ganti PIN Presensi Anda terlebih dahulu.'
            ]);
            exit;
        }`.replace(/\n/g, nl);

if (!code.includes(targetSimpanAbsenProfil)) {
  throw new Error('targetSimpanAbsenProfil not found in absensi-data-handler.php');
}
code = code.replace(targetSimpanAbsenProfil, newSimpanAbsenProfil);
console.log('4. simpanAbsensi email & PIN validation added.');

// 5. Update simpanWFH: enforce lock if already registered
const targetSimpanWFHCheck = `        $db = loadDatabase();
        $profil = null;
        foreach ($db['master_karyawan'] as &$k) {
            if (cocokNIK($k['nik'], $cleanNik)) {
                $k['alamat_wfh'] = $alamat;
                $k['gps_wfh'] = $gps;
                $profil = $k;
                break;
            }
        }`.replace(/\n/g, nl);

const newSimpanWFHCheck = `        $db = loadDatabase();
        $profil = null;
        foreach ($db['master_karyawan'] as &$k) {
            if (cocokNIK($k['nik'], $cleanNik)) {
                // Kunci Permanen Titik WFH yang Sudah Terdaftar
                if (!empty($k['gps_wfh'])) {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'success' => false,
                        'message' => 'Titik koordinat rumah WFH Anda sudah terkunci permanen dan terdaftar resmi di HR. Hubungi Divisi HR jika terdapat perpindahan domisili.'
                    ]);
                    exit;
                }
                $k['alamat_wfh'] = $alamat;
                $k['gps_wfh'] = $gps;
                $profil = $k;
                break;
            }
        }`.replace(/\n/g, nl);

if (!code.includes(targetSimpanWFHCheck)) {
  throw new Error('targetSimpanWFHCheck not found in absensi-data-handler.php');
}
code = code.replace(targetSimpanWFHCheck, newSimpanWFHCheck);
console.log('5. simpanWFH permanent lock check added.');

fs.writeFileSync(phpFile, code, 'utf8');
console.log('absensi-data-handler.php successfully patched!');
