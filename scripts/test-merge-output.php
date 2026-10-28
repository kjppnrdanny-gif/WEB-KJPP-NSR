<?php
require_once __DIR__ . '/../merge-tags-engine.php';

$pusatRecord = [
    'noPermintaan' => 'REQ-TEST-PUSAT',
    'cabang' => 'Pusat',
    'namaKlien' => 'PT Mandiri Pusat',
    'jenisObjek' => 'Gedung Kantor'
];

$bdgRecord = [
    'noPermintaan' => 'REQ-TEST-BDG',
    'cabang' => 'Bandung',
    'namaKlien' => 'PT Bank BCA Bandung',
    'jenisObjek' => 'Tanah dan Bangunan'
];

$stPusat = renderMergeTags(getTemplateSuratTugas(), $pusatRecord);
$stBdg = renderMergeTags(getTemplateSuratTugas(), $bdgRecord);
$qaPusat = renderMergeTags(getTemplateQaChecklist(), $pusatRecord);
$ttPusat = renderMergeTags(getTemplateTandaTerima(), $pusatRecord);

echo "--- SURAT TUGAS PUSAT ---\n";
if (strpos($stPusat, 'KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN') !== false) {
    echo "✔ PASS: Name is KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN\n";
} else {
    echo "✘ FAIL: Wrong name\n";
}

if (strpos($stPusat, 'Cabang: Pusat') === false && strpos($stPusat, '| Cabang: Pusat') === false) {
    echo "✔ PASS: No 'Cabang: Pusat' in Pusat template\n";
} else {
    echo "✘ FAIL: 'Cabang: Pusat' still found\n";
}

echo "\n--- SURAT TUGAS CABANG BANDUNG ---\n";
if (strpos($stBdg, 'Kantor Cabang Bandung') !== false) {
    echo "✔ PASS: 'Kantor Cabang Bandung' present for branch\n";
} else {
    echo "✘ FAIL: 'Kantor Cabang Bandung' missing\n";
}

echo "\n--- QA CHECKLIST PUSAT ---\n";
if (strpos($qaPusat, 'Kantor Pusat') !== false && strpos($qaPusat, 'Cabang: Pusat') === false) {
    echo "✔ PASS: QA Checklist shows 'Kantor Pusat' without 'Cabang: Pusat'\n";
} else {
    echo "✘ FAIL: QA Checklist issue\n";
}

echo "\n--- TANDA TERIMA PUSAT ---\n";
if (strpos($ttPusat, 'Cabang: Pusat') === false) {
    echo "✔ PASS: Tanda Terima Pusat without 'Cabang: Pusat'\n";
} else {
    echo "✘ FAIL: Tanda Terima Pusat issue\n";
}
