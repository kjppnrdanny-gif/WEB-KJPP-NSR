import fs from 'fs';

const filePath = 'nolap-data-handler.php';
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

const target = `    if ($actionGet === 'getRegistrasiPersonelQueue') {
        $queueFile = $dataDir . '/registrasi_personel_antrean.json';
        $queue = file_exists($queueFile) ? (json_decode(file_get_contents($queueFile), true) ?: []) : [];
        echo json_encode([
            'success' => true,
            'total' => count($queue),
            'queue' => array_reverse($queue)
        ]);
        exit;
    }`;

const replacement = `    if ($actionGet === 'getRegistrasiPersonelQueue') {
        if (!empty($currentUser['isCabang']) && empty($currentUser['isSuperAdmin']) && ($currentUser['role'] ?? '') !== 'SUPER_ADMIN' && ($currentUser['role'] ?? '') !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Akses ditolak: Hanya Admin Pusat yang berhak meninjau antrean pendaftaran personel.'
            ]);
            exit;
        }

        $queueFile = $dataDir . '/registrasi_personel_antrean.json';
        $queue = file_exists($queueFile) ? (json_decode(file_get_contents($queueFile), true) ?: []) : [];
        echo json_encode([
            'success' => true,
            'total' => count($queue),
            'queue' => array_reverse($queue),
            'antrean' => array_reverse($queue)
        ]);
        exit;
    }`;

if (!content.includes(target)) {
  throw new Error('target not found in nolap-data-handler.php');
}

content = content.replace(target, replacement);
if (isCRLF) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully updated getRegistrasiPersonelQueue in nolap-data-handler.php');
