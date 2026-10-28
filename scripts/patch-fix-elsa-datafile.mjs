import fs from 'fs';

const filePath = 'nolap-data-handler.php';
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

// 1. Replace $databaseFile with $dataFile
const target1 = `$nolapRecords = muatDatabaseNoLap($databaseFile);`;
const replacement1 = `$nolapRecords = muatDatabaseNoLap($dataFile);`;

const target2 = `simpanDatabaseNoLap($databaseFile, $nolapRecords);`;
const replacement2 = `simpanDatabaseNoLap($dataFile, $nolapRecords);`;

if (!content.includes(target1) || !content.includes(target2)) {
  throw new Error('target1 or target2 not found in nolap-data-handler.php');
}
content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);

// 2. Add wa_url and notification_id in response
const targetResp = `'whatsapp_url' => $notifRes['whatsapp_url'] ?? '',
            'event_id' => $notifRes['event_id'] ?? ''`;

const replacementResp = `'whatsapp_url' => $notifRes['whatsapp_url'] ?? '',
            'wa_url' => $notifRes['whatsapp_url'] ?? '',
            'notification_id' => $notifRes['event_id'] ?? '',
            'event_id' => $notifRes['event_id'] ?? ''`;

if (!content.includes(targetResp)) {
  throw new Error('targetResp not found in nolap-data-handler.php');
}
content = content.replace(targetResp, replacementResp);

if (isCRLF) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully fixed $dataFile and output keys in verifyElsaQrReport');
