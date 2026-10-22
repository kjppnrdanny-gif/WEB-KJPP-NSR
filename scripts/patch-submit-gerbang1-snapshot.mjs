import fs from 'fs';

const filePath = 'nolap-data-handler.php';
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

const target = `        $reqProfile = cariPersonelKontak($mastersDir, $currentUser['sub'] ?? ($currentUser['role'] ?? ''), $originBranchCode);
        $pengajuSnapshot = [
            'personnel_id'       => $reqProfile['personnel_id'] ?? ($currentUser['sub'] ?? 'NSR-STAF'),
            'user_id'            => $reqProfile['user_id'] ?? ($currentUser['sub'] ?? 'staf'),
            'nama'               => $currentUser['nama'] ?? ($reqProfile['nama'] ?? $userDisplayName),
            'office_id'          => $originBranchCode,
            'office_name'        => $originBranchId,
            'email'              => $payload['emailPemohon'] ?? ($payload['emailPengaju'] ?? ($reqProfile['email'] ?? 'notifikasi@kjppnanangrahayu.com')),
            'email_verified'     => !empty($reqProfile['email_verified']),
            'whatsapp_number'    => normalisasiNomorWhatsApp($payload['waPemohon'] ?? ($payload['waPengaju'] ?? ($reqProfile['whatsapp_number'] ?? '081298765432'))),
            'whatsapp_verified'  => !empty($reqProfile['whatsapp_verified']),
            'contact_status'     => $reqProfile['contact_status'] ?? 'VERIFIED',
            'snapshot_timestamp' => $nowWib
        ];`;

const replacement = `        $reqInput = is_array($payload['pengaju'] ?? null) ? $payload['pengaju'] : [];
        $reqProfile = cariPersonelKontak($mastersDir, $reqInput['email'] ?? ($currentUser['sub'] ?? ($currentUser['role'] ?? '')), $originBranchCode);
        $pengajuSnapshot = [
            'personnel_id'       => $reqInput['nik'] ?? ($reqProfile['personnel_id'] ?? ($currentUser['sub'] ?? 'NSR-STAF')),
            'user_id'            => $reqProfile['user_id'] ?? ($currentUser['sub'] ?? 'staf'),
            'nama'               => $reqInput['nama'] ?? ($currentUser['nama'] ?? ($reqProfile['nama'] ?? $userDisplayName)),
            'office_id'          => $originBranchCode,
            'office_name'        => $originBranchId,
            'email'              => $reqInput['email'] ?? ($payload['emailPemohon'] ?? ($payload['emailPengaju'] ?? ($payload['pengaju_email'] ?? ($reqProfile['email'] ?? 'notifikasi@kjppnanangrahayu.com')))),
            'email_verified'     => !empty($reqProfile['email_verified']),
            'whatsapp_number'    => normalisasiNomorWhatsApp($reqInput['whatsapp_number'] ?? ($payload['waPemohon'] ?? ($payload['waPengaju'] ?? ($payload['pengaju_wa'] ?? ($reqProfile['whatsapp_number'] ?? '081298765432'))))),
            'whatsapp_verified'  => !empty($reqProfile['whatsapp_verified']),
            'contact_status'     => $reqProfile['contact_status'] ?? 'VERIFIED',
            'snapshot_timestamp' => $nowWib
        ];`;

if (!content.includes(target)) {
  throw new Error('target not found in nolap-data-handler.php');
}
content = content.replace(target, replacement);

if (isCRLF) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully updated submitGerbang1Awal pengajuSnapshot in nolap-data-handler.php');
