import fs from 'fs';

const filePath = 'nolap-data-handler.php';
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

const target = `        $filtered = [];
        $isSuper = !empty($currentUser['isSuperAdmin']) || ($currentUser['role'] ?? '') === 'SUPER_ADMIN' || ($currentUser['role'] ?? '') === 'ADMIN_PUSAT';
        $userSub = strtolower($currentUser['sub'] ?? '');
        $userWilayahCode = $currentUser['wilayahCode'] ?? '';

        foreach (array_reverse($logs) as $l) {
            if ($isSuper) {
                $filtered[] = $l;
            } else {
                $reqSub = strtolower($l['requester_user_id'] ?? '');
                $reqOffice = $l['office_id'] ?? '';
                if ($reqSub === $userSub || ($userWilayahCode && $reqOffice === $userWilayahCode)) {
                    $filtered[] = $l;
                }
            }
        }`;

const replacement = `        $filtered = [];
        $isSuper = !empty($currentUser['isSuperAdmin']) || ($currentUser['role'] ?? '') === 'SUPER_ADMIN' || ($currentUser['role'] ?? '') === 'ADMIN_PUSAT';
        $userSub = strtolower($currentUser['sub'] ?? '');
        $userWilayahCode = $currentUser['kodeKemenkeu'] ?? ($currentUser['wilayahCode'] ?? '');
        $officeMap = [
            'BDG' => '2.0160-01',
            'PDG' => '2.0160-03',
            'MKS' => '2.0160-04',
            'PLB' => '2.0160-05',
            'PST' => '2.0160-00'
        ];
        if (isset($officeMap[$userWilayahCode])) {
            $userWilayahCode = $officeMap[$userWilayahCode];
        }

        foreach (array_reverse($logs) as $l) {
            if ($isSuper) {
                $filtered[] = $l;
            } else {
                $reqSub = strtolower($l['requester_user_id'] ?? '');
                $reqOffice = $l['office_id'] ?? '';
                if ($reqSub === $userSub || ($userWilayahCode && $reqOffice === $userWilayahCode) || (strpos($userSub, 'mks') !== false && $reqOffice === '2.0160-04') || (strpos($userSub, 'bdg') !== false && $reqOffice === '2.0160-01')) {
                    $filtered[] = $l;
                }
            }
        }`;

if (!content.includes(target)) {
  throw new Error('target not found in nolap-data-handler.php');
}
content = content.replace(target, replacement);

if (isCRLF) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully updated getNotificationLogs office mapping in nolap-data-handler.php');
