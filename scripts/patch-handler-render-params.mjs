import fs from 'fs';

let content = fs.readFileSync('nolap-data-handler.php', 'utf8');

function toCrlf(str) {
  return str.replace(/\r?\n/g, '\r\n');
}

const target = toCrlf(`    if ($action === 'renderDocumentTemplate') {
        $noReq = trim($payload['noPermintaan'] ?? '');
        $templateType = strtoupper(trim($payload['templateType'] ?? 'SURAT_TUGAS'));`);

const replacement = toCrlf(`    if ($action === 'renderDocumentTemplate') {
        $noReq = trim($payload['noPermintaan'] ?? ($payload['noReq'] ?? ($_GET['noReq'] ?? ($_GET['noPermintaan'] ?? ''))));
        $templateType = strtoupper(trim($payload['templateType'] ?? ($payload['templateName'] ?? ($_GET['templateType'] ?? ($_GET['templateName'] ?? 'SURAT_TUGAS')))));`);

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('nolap-data-handler.php', content, 'utf8');
  console.log('✔ nolap-data-handler.php patched for GET params in renderDocumentTemplate.');
} else {
  console.error('✘ target not found!');
}
