import fs from 'fs';

let content = fs.readFileSync('nolap-data-handler.php', 'utf8');

function replaceNormalize(str, target, replacement) {
  const normStr = str.replace(/\r\n/g, '\n');
  const normTarget = target.replace(/\r\n/g, '\n');
  const normReplacement = replacement.replace(/\r\n/g, '\n');
  if (!normStr.includes(normTarget)) {
    throw new Error('Target not found: ' + normTarget.substring(0, 50));
  }
  return normStr.replace(normTarget, normReplacement).replace(/\n/g, '\r\n');
}

// 1. RBAC fix for MARKETING and REVIEWER
content = replaceNormalize(
  content,
  `} elseif (in_array($rawRole, ['ADMIN_CABANG', 'CABANG'], true) || !empty($currentUser['isCabang'])) {
    $userRole = 'ADMIN_CABANG';
} else {`,
  `} elseif (in_array($rawRole, ['ADMIN_CABANG'], true) || ($rawRole === 'CABANG')) {
    $userRole = 'ADMIN_CABANG';
} elseif ($rawRole === 'MARKETING') {
    $userRole = 'MARKETING';
} elseif ($rawRole === 'REVIEWER') {
    $userRole = 'REVIEWER';
} else {`
);

// 2. Add code to 422 response
content = replaceNormalize(
  content,
  `'violation' => 'INSUFFICIENT_BRANCH_COMPETENCY',`,
  `'code' => 'INSUFFICIENT_BRANCH_COMPETENCY',
                    'violation' => 'INSUFFICIENT_BRANCH_COMPETENCY',`
);

// 3. Add pejabatOtorisasi to dgEntry
content = replaceNormalize(
  content,
  `'disetujui_oleh' => $pejabatOtorisasi,`,
  `'disetujui_oleh' => $pejabatOtorisasi,
            'pejabatOtorisasi' => $pejabatOtorisasi,
            'pejabat_otorisasi' => $pejabatOtorisasi,`
);

fs.writeFileSync('nolap-data-handler.php', content, 'utf8');
console.log('Successfully patched nolap-data-handler.php!');
